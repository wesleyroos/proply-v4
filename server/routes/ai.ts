import express from 'express';
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'not-configured' });

function buildSystemPrompt(context: any): string {
  const isPropertyDeal = context.hasOwnProperty('dealScore');

  if (isPropertyDeal) {
    return `You are an AI real estate advisor helping agents provide informed guidance to their clients. You're analyzing a property with the following details:

Purchase Price: R${context.purchasePrice.toLocaleString()}
Market Value: R${context.marketPrice.toLocaleString()}
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

  return `You are an advisor for Airbnb property managers helping them communicate effectively with property owners. Your goal is to help managers build trust with owners and retain their business by providing clear insights about rental strategies. Use the comparative data to explain the benefits of short-term rentals when appropriate, but remain balanced and honest.

When owners express concerns about short-term rentals, address them with evidence-based responses that build confidence. Focus on helping managers demonstrate their value and expertise to owners.

Current property context:
- Address: ${context.address}
- Long-term monthly revenue: R${context.longTermMonthly}
- Short-term monthly avg: R${context.shortTermMonthly}
- Long-term annual revenue: R${context.longTermAnnual}
- Short-term annual revenue: R${context.shortTermAnnual}
- Short-term after fees: R${context.shortTermAfterFees}
- Break-even occupancy: ${context.breakEvenOccupancy}%
- Short-term nightly rate: R${context.shortTermNightly}
- Management fee: ${context.managementFee * 100}%
- Annual occupancy: ${context.annualOccupancy}%

Remember, the Rent Compare tool is designed to bridge the trust gap between owners and Airbnb managers. Your advice should help managers demonstrate transparency and data-driven decision making to their owners.`;
}

// Streaming endpoint — returns Server-Sent Events
router.post('/rental-advice/stream', async (req, res) => {
  try {
    const { context, userQuery } = req.body;
    const systemPrompt = buildSystemPrompt(context);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
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
    const { context, userQuery } = req.body;
    const systemPrompt = buildSystemPrompt(context);

    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
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
