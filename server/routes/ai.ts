import express from 'express';
import OpenAI from "openai";

const router = express.Router();

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/rental-advice', async (req, res) => {
  try {
    const { context, userQuery } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an advisor for Airbnb property managers helping them communicate effectively with property owners. Your goal is to help managers build trust with owners and retain their business by providing clear insights about rental strategies. Use the comparative data to explain the benefits of short-term rentals when appropriate, but remain balanced and honest. 

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

Remember, the Rent Compare tool is designed to bridge the trust gap between owners and Airbnb managers. Your advice should help managers demonstrate transparency and data-driven decision making to their owners.`
        },
        {
          role: "user",
          content: userQuery
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    res.json({ advice: response.choices[0].message.content });
  } catch (error) {
    console.error("Error getting rental advice:", error);
    res.status(500).json({ error: "Failed to get rental advice" });
  }
});

export default router;
