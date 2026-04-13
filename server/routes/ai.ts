import express from 'express';
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'not-configured' });

const fmt = (n: number) => `R${Math.round(n).toLocaleString('en-ZA')}`;

function buildSystemPrompt(context: any): string {
  const isPropertyDeal = context.hasOwnProperty('dealScore');

  if (isPropertyDeal) {
    return `You are an AI real estate advisor helping agents provide informed guidance to their clients. You're analyzing a property with the following details:

Purchase Price: ${fmt(context.purchasePrice)}
Market Value: ${fmt(context.marketPrice)}
Price Difference: ${context.priceDiff.toFixed(1)}% ${context.priceDiff > 0 ? 'above' : 'below'} market value
Deal Score: ${context.dealScore}/100
Property Condition: ${context.condition}
${context.rentalYield ? `Rental Yield: ${context.rentalYield.toFixed(1)}%` : ''}

Your role is to help the real estate agent:
1. Provide balanced insights for both buyer and seller perspectives
2. Suggest negotiation points based on the deal score and market value
3. Highlight property strengths and potential concerns
4. Offer guidance on positioning the property or making a competitive offer
5. Provide context on comparable properties and market trends

Provide professional, concise advice that the agent can use when advising their clients.`;
  }

  // Rental advisor — enriched system prompt
  const advantage = context.advantage ?? (context.shortTermAfterFees - context.longTermAnnual);
  const advantagePercent = context.advantagePercent ?? (context.longTermAnnual > 0 ? ((advantage / context.longTermAnnual) * 100) : 0);
  const strBetter = advantage > 0;

  let prompt = `You are a sharp, data-driven advisor for Airbnb property managers. You help managers communicate effectively with property owners, build trust, and retain business using hard numbers.

You have access to the full rental comparison analysis for this property. Use specific numbers in your answers — don't be vague.

## Property Details
- **Address:** ${context.address}
${context.title ? `- **Title:** ${context.title}` : ''}
${context.bedrooms ? `- **Bedrooms:** ${context.bedrooms}` : ''}
${context.bathrooms ? `- **Bathrooms:** ${context.bathrooms}` : ''}

## Rental Comparison Summary
| Metric | Long-Term | Short-Term |
|--------|-----------|------------|
| Monthly Revenue | ${fmt(context.longTermMonthly)} | ${fmt(context.shortTermMonthly)} (avg) |
| Annual Revenue | ${fmt(context.longTermAnnual)} | ${fmt(context.shortTermAnnual)} (gross) |
| After Fees | ${fmt(context.longTermAnnual)} | ${fmt(context.shortTermAfterFees)} (net) |

- **Nightly Rate:** ${fmt(context.shortTermNightly)}
- **Occupancy Target:** ${context.annualOccupancy}%
- **Management Fee:** ${(context.managementFee * 100).toFixed(0)}%
- **Platform Fee:** ${((context.platformFeeRate || (context.managementFee > 0 ? 0.15 : 0.03)) * 100).toFixed(0)}%
- **Break-even Occupancy:** ${context.breakEvenOccupancy.toFixed(1)}%
- **Annual Advantage:** ${strBetter ? '+' : ''}${fmt(advantage)} (${strBetter ? '+' : ''}${advantagePercent.toFixed(1)}%) in favour of ${strBetter ? 'short-term' : 'long-term'}
${context.annualEscalation ? `- **Annual Escalation:** ${context.annualEscalation}%` : ''}`;

  if (context.marketData) {
    const m = context.marketData;
    prompt += `

## Market Data (PriceLabs)
- **Active Listings in Area:** ${m.activeListings ?? 'N/A'}
- **Market ADR (25th/50th/75th/90th):** ${m.adr25 ? `${fmt(m.adr25)} / ${fmt(m.adr50!)} / ${fmt(m.adr75!)} / ${fmt(m.adr90!)}` : 'N/A'}
- **Avg Market Occupancy:** ${m.avgOccupancy ? `${m.avgOccupancy}%` : 'N/A'}
- **RevPAR:** ${m.revpar ? fmt(m.revpar) : 'N/A'}
${m.demandScore ? `- **Demand Score:** ${m.demandScore}` : ''}
${m.seasonalityIndex ? `- **Seasonality Index:** ${m.seasonalityIndex}` : ''}

The user's nightly rate of ${fmt(context.shortTermNightly)} ${m.adr50 ? (context.shortTermNightly > m.adr50 ? `is above the median market rate of ${fmt(m.adr50)} — positioned at the premium end` : context.shortTermNightly < m.adr25! ? `is below the 25th percentile (${fmt(m.adr25!)}) — there may be room to increase rates` : `is within the market range`) : 'is set by the user'}.`;
  }

  prompt += `

## Your Role
- Use the specific numbers above in every answer. Don't say "significant advantage" — say "${fmt(Math.abs(advantage))} more per year".
- When the user asks about scenarios (different occupancy, fees, etc.), calculate the actual numbers.
- Help managers draft professional messages to owners when asked.
- Be concise but thorough. Use markdown formatting (bold, bullet points, tables) for readability.
- If short-term underperforms long-term in this analysis, be honest about it and help the manager frame it constructively.`;

  return prompt;
}

function buildMessages(systemPrompt: string, history: any[], userQuery: string) {
  const messages: any[] = [{ role: "system", content: systemPrompt }];

  // Add conversation history (cap at last 20 messages to stay within limits)
  if (history && Array.isArray(history)) {
    const recent = history.slice(-20);
    for (const msg of recent) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  // Add current query
  messages.push({ role: "user", content: userQuery });
  return messages;
}

// Streaming endpoint
router.post('/rental-advice/stream', async (req, res) => {
  try {
    const { context, userQuery, history } = req.body;
    const systemPrompt = buildSystemPrompt(context);
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
    console.error("[rental-advice/stream] Error:", error);
    res.write(`data: ${JSON.stringify({ error: "Failed to generate advice" })}\n\n`);
    res.end();
  }
});

// Non-streaming fallback
router.post('/rental-advice', async (req, res) => {
  try {
    const { context, userQuery, history } = req.body;
    const systemPrompt = buildSystemPrompt(context);
    const messages = buildMessages(systemPrompt, history, userQuery);

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages,
      temperature: 0.7,
      max_completion_tokens: 4000,
    });

    const choice = response.choices[0];
    const advice = choice?.message?.content || "";
    console.log(`[rental-advice] finish_reason=${choice?.finish_reason}, content_length=${advice.length}, query="${userQuery.substring(0, 80)}"`);

    res.json({ advice });
  } catch (error) {
    console.error("Error getting rental advice:", error);
    res.status(500).json({ error: "Failed to get rental advice" });
  }
});

export default router;
