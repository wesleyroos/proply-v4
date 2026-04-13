import express from 'express';
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'not-configured' });

const fmt = (n: number) => n != null ? `R${Math.round(n).toLocaleString('en-ZA')}` : 'N/A';

// ─── System prompt builders per advisor type ─────────────────────────

function buildRentalPrompt(ctx: any): string {
  const advantage = ctx.advantage ?? (ctx.shortTermAfterFees - ctx.longTermAnnual);
  const advantagePercent = ctx.advantagePercent ?? (ctx.longTermAnnual > 0 ? ((advantage / ctx.longTermAnnual) * 100) : 0);
  const strBetter = advantage > 0;

  let prompt = `You are a sharp, data-driven advisor for Airbnb property managers. You help managers communicate effectively with property owners, build trust, and retain business using hard numbers.

## Property Details
- **Address:** ${ctx.address}
${ctx.title ? `- **Title:** ${ctx.title}` : ''}
${ctx.bedrooms ? `- **Bedrooms:** ${ctx.bedrooms}` : ''}

## Rental Comparison Summary
| Metric | Long-Term | Short-Term |
|--------|-----------|------------|
| Monthly Revenue | ${fmt(ctx.longTermMonthly)} | ${fmt(ctx.shortTermMonthly)} (avg) |
| Annual Revenue | ${fmt(ctx.longTermAnnual)} | ${fmt(ctx.shortTermAnnual)} (gross) |
| After Fees | ${fmt(ctx.longTermAnnual)} | ${fmt(ctx.shortTermAfterFees)} (net) |

- **Nightly Rate:** ${fmt(ctx.shortTermNightly)}
- **Occupancy Target:** ${ctx.annualOccupancy}%
- **Management Fee:** ${((ctx.managementFee || 0) * 100).toFixed(0)}%
- **Break-even Occupancy:** ${(ctx.breakEvenOccupancy || 0).toFixed(1)}%
- **Annual Advantage:** ${strBetter ? '+' : ''}${fmt(Math.abs(advantage))} (${strBetter ? '+' : ''}${advantagePercent.toFixed(1)}%) in favour of ${strBetter ? 'short-term' : 'long-term'}`;

  if (ctx.marketData) {
    const m = ctx.marketData;
    prompt += `

## Market Data (PriceLabs)
- **Active Listings:** ${m.activeListings ?? 'N/A'}
- **Market ADR (25th/50th/75th/90th):** ${m.adr25 ? `${fmt(m.adr25)} / ${fmt(m.adr50)} / ${fmt(m.adr75)} / ${fmt(m.adr90)}` : 'N/A'}
- **Avg Occupancy:** ${m.avgOccupancy ? `${m.avgOccupancy}%` : 'N/A'}
- **RevPAR:** ${m.revpar ? fmt(m.revpar) : 'N/A'}`;
  }

  prompt += `

## Your Role
- Use specific numbers in every answer.
- Help managers draft messages to owners when asked.
- Calculate scenarios when asked (different occupancy, fees, etc.).
- Be concise. Use markdown formatting.`;

  return prompt;
}

function buildAnalyzerPrompt(ctx: any): string {
  return `You are a sharp South African property investment analyst. You have full access to the analysis data below. Use specific numbers — never be vague.

## Property
- **Address:** ${ctx.address || 'N/A'}
- **Purchase Price:** ${fmt(ctx.purchasePrice)}
- **Bedrooms:** ${ctx.bedrooms || 'N/A'} | **Bathrooms:** ${ctx.bathrooms || 'N/A'}
- **Floor Size:** ${ctx.floorSize ? `${ctx.floorSize}m²` : 'N/A'}
${ctx.ratePerSqm ? `- **Rate/m²:** ${fmt(ctx.ratePerSqm)}` : ''}

## Yields & Returns
- **Short-Term Gross Yield:** ${ctx.shortTermGrossYield != null ? `${ctx.shortTermGrossYield.toFixed(1)}%` : 'N/A'}
- **Long-Term Gross Yield:** ${ctx.longTermGrossYield != null ? `${ctx.longTermGrossYield.toFixed(1)}%` : 'N/A'}
- **Short-Term Annual Revenue:** ${ctx.shortTermAnnualRevenue ? fmt(ctx.shortTermAnnualRevenue) : 'N/A'}
- **Long-Term Annual Revenue:** ${ctx.longTermAnnualRevenue ? fmt(ctx.longTermAnnualRevenue) : 'N/A'}

## Financing
- **Deposit:** ${ctx.depositPercent ? `${ctx.depositPercent}%` : 'N/A'} (${ctx.depositAmount ? fmt(ctx.depositAmount) : 'N/A'})
- **Interest Rate:** ${ctx.interestRate ? `${ctx.interestRate}%` : 'N/A'}
- **Loan Term:** ${ctx.loanTerm ? `${ctx.loanTerm} years` : 'N/A'}
- **Monthly Bond:** ${ctx.monthlyBondRepayment ? fmt(ctx.monthlyBondRepayment) : 'N/A'}

## Investment Metrics
${ctx.capRate != null ? `- **Cap Rate:** ${ctx.capRate.toFixed(1)}%` : ''}
${ctx.cashOnCash != null ? `- **Cash-on-Cash Return:** ${ctx.cashOnCash.toFixed(1)}%` : ''}
${ctx.irr != null ? `- **IRR (5yr):** ${ctx.irr.toFixed(1)}%` : ''}

## Your Role
- Answer questions about this investment with hard numbers.
- Run "what if" scenarios when asked (different deposit, rates, occupancy).
- Compare STR vs LTR strategies with actual yields.
- Help the user decide if this is a good deal and why.
- Be concise. Use markdown.`;
}

function buildReportPrompt(ctx: any): string {
  const vals = ctx.valuations || [];
  const conservative = vals.find((v: any) => /conserv/i.test(v.type))?.value;
  const midline = vals.find((v: any) => /midline|mid/i.test(v.type))?.value;
  const optimistic = vals.find((v: any) => /optim/i.test(v.type))?.value;

  let prompt = `You are a professional property investment advisor. You have access to a full Proply valuation report for this property. Use specific numbers — never be vague.

## Property
- **Address:** ${ctx.address}
- **Type:** ${ctx.propertyType || 'N/A'}
- **Bedrooms:** ${ctx.bedrooms || 'N/A'} | **Bathrooms:** ${ctx.bathrooms || 'N/A'}
- **Floor Size:** ${ctx.floorSize ? `${ctx.floorSize}m²` : 'N/A'}
${ctx.price && Number(ctx.price) > 0 ? `- **Asking Price:** ${fmt(Number(ctx.price))}` : '- **Status:** Valuation (no asking price)'}

## Valuation Estimates
- **Conservative:** ${conservative ? fmt(conservative) : 'N/A'}
- **Midline:** ${midline ? fmt(midline) : 'N/A'}
- **Optimistic:** ${optimistic ? fmt(optimistic) : 'N/A'}`;

  if (ctx.ltrMinRental || ctx.ltrMaxRental) {
    prompt += `

## Rental Performance
- **LTR Monthly Range:** ${fmt(ctx.ltrMinRental)} – ${fmt(ctx.ltrMaxRental)}
- **LTR Yield:** ${ctx.ltrMinYield ?? 'N/A'}% – ${ctx.ltrMaxYield ?? 'N/A'}%`;
  }

  if (ctx.strMedianAnnual) {
    prompt += `
- **STR Median Annual:** ${fmt(ctx.strMedianAnnual)}`;
  }

  if (ctx.appreciationRate) {
    prompt += `
- **Appreciation Rate:** ${ctx.appreciationRate}% p.a.`;
  }

  if (ctx.comparableSalesCount > 0) {
    prompt += `

## Comparable Sales
- **${ctx.comparableSalesCount} comparable sales** on record
- **Avg Sale Price:** ${ctx.avgSalePrice ? fmt(ctx.avgSalePrice) : 'N/A'}
${ctx.avgPricePerSqm ? `- **Avg R/m²:** ${fmt(ctx.avgPricePerSqm)}` : ''}`;
  }

  if (ctx.summary) {
    prompt += `

## AI Valuation Summary
${ctx.summary}`;
  }

  prompt += `

## Your Role
- Help the user understand what this property is worth and why.
- Explain valuation methodology when asked.
- Compare to comparable sales data.
- Advise on rental strategy (STR vs LTR) using the yield data.
- Help with investment decisions — is this a good buy?
- Be concise. Use markdown.`;

  return prompt;
}

function buildDealPrompt(ctx: any): string {
  return `You are an AI real estate advisor. You're analyzing a property deal:

Purchase Price: ${fmt(ctx.purchasePrice)}
Market Value: ${fmt(ctx.marketPrice)}
Price Difference: ${ctx.priceDiff?.toFixed(1) || 0}% ${(ctx.priceDiff || 0) > 0 ? 'above' : 'below'} market value
Deal Score: ${ctx.dealScore}/100
Property Condition: ${ctx.condition}
${ctx.rentalYield ? `Rental Yield: ${ctx.rentalYield.toFixed(1)}%` : ''}

Help the agent with negotiation points, deal assessment, and client advice. Be concise, use markdown.`;
}

const PROMPT_BUILDERS: Record<string, (ctx: any) => string> = {
  rental: buildRentalPrompt,
  analyzer: buildAnalyzerPrompt,
  report: buildReportPrompt,
  deal: buildDealPrompt,
};

// ─── Shared message builder ─────────────────────────────────────────

function buildMessages(systemPrompt: string, history: any[], userQuery: string) {
  const messages: any[] = [{ role: "system", content: systemPrompt }];
  if (history && Array.isArray(history)) {
    for (const msg of history.slice(-20)) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }
  messages.push({ role: "user", content: userQuery });
  return messages;
}

// ─── Unified streaming endpoint ─────────────────────────────────────

router.post('/ai-advisor/stream', async (req, res) => {
  try {
    const { advisorType, context, userQuery, history } = req.body;

    const builder = PROMPT_BUILDERS[advisorType];
    if (!builder) {
      return res.status(400).json({ error: `Unknown advisor type: ${advisorType}` });
    }

    const systemPrompt = builder(context);
    const messages = buildMessages(systemPrompt, history, userQuery);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages,
      temperature: 0.7,
      max_completion_tokens: 4000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("[ai-advisor/stream] Error:", error);
    res.write(`data: ${JSON.stringify({ error: "Failed to generate advice" })}\n\n`);
    res.end();
  }
});

// ─── Legacy endpoints (kept for backwards compat) ───────────────────

router.post('/rental-advice/stream', async (req, res) => {
  req.body.advisorType = 'rental';
  return router.handle(req, res, () => {});
});

router.post('/rental-advice', async (req, res) => {
  try {
    const { context, userQuery, history } = req.body;
    const systemPrompt = buildRentalPrompt(context);
    const messages = buildMessages(systemPrompt, history, userQuery);

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages,
      temperature: 0.7,
      max_completion_tokens: 4000,
    });

    const choice = response.choices[0];
    const advice = choice?.message?.content || "";
    console.log(`[rental-advice] finish_reason=${choice?.finish_reason}, content_length=${advice.length}`);
    res.json({ advice });
  } catch (error) {
    console.error("Error getting rental advice:", error);
    res.status(500).json({ error: "Failed to get rental advice" });
  }
});

export default router;
