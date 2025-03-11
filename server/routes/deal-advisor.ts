import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { requireAuth } from "../auth";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const dealAdvisorHandler = async (req: Request, res: Response) => {
  try {
    // Require authentication
    const user = requireAuth(req, res);
    if (!user) return;

    // Extract data from request
    const { 
      purchasePrice, 
      marketPrice, 
      priceDiff, 
      rentalYield, 
      condition, 
      dealScore, 
      question 
    } = req.body;

    // Validate required fields
    if (!purchasePrice || !marketPrice || priceDiff === undefined || !dealScore) {
      return res.status(400).json({ error: "Missing required property analysis data" });
    }

    // Create system prompt with property details
    const systemPrompt = `
You are an AI investment advisor specializing in property investments. You're analyzing a property with the following details:

Purchase Price: R${purchasePrice.toLocaleString()}
Market Value: R${marketPrice.toLocaleString()}
Price Difference: ${priceDiff.toFixed(1)}% ${priceDiff > 0 ? 'above' : 'below'} market value
Deal Score: ${dealScore}/100
Property Condition: ${condition}
${rentalYield ? `Rental Yield: ${rentalYield.toFixed(1)}%` : ''}

Provide helpful, concise advice about this property investment opportunity.
`;

    // User's question or default prompt
    const userPrompt = question || "Provide a brief assessment of this deal and any key considerations I should keep in mind.";

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 500
    });

    // Return the response
    return res.json({
      response: completion.choices[0].message.content,
      tokensUsed: completion.usage?.total_tokens || 0
    });

  } catch (error) {
    console.error('Deal advisor error:', error);
    return res.status(500).json({ 
      error: "Failed to process deal advisor request",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};