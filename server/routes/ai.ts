import express from 'express';
import OpenAI from "openai";

const router = express.Router();

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'not-configured' });

router.post('/rental-advice', async (req, res) => {
  try {
    const { context, userQuery } = req.body;
    
    // Determine if this is a rental comparison or property deal query
    const isPropertyDeal = context.hasOwnProperty('dealScore');
    
    let systemPrompt = '';
    
    if (isPropertyDeal) {
      // Property deal advisor system prompt
      systemPrompt = `You are an AI real estate advisor helping agents provide informed guidance to their clients. You're analyzing a property with the following details:

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
    } else {
      // Original rental advisor system prompt
      systemPrompt = `You are an advisor for Airbnb property managers helping them communicate effectively with property owners. Your goal is to help managers build trust with owners and retain their business by providing clear insights about rental strategies. Use the comparative data to explain the benefits of short-term rentals when appropriate, but remain balanced and honest. 

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
    
    const response = await openai.chat.completions.create({
      model: "gpt-5.1", // gpt-5.1: latest flagship model
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userQuery
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 500
    });

    res.json({ advice: response.choices[0].message.content });
  } catch (error) {
    console.error("Error getting rental advice:", error);
    res.status(500).json({ error: "Failed to get rental advice" });
  }
});

export default router;
