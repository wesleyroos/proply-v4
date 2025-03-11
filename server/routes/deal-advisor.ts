
import { Request, Response } from "express";
import { z } from "zod";
import OpenAI from "openai";
import { crypto } from "../auth";
import { db } from "@db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const dealAdvisorSchema = z.object({
  purchasePrice: z.number(),
  marketPrice: z.number(), 
  priceDiff: z.number(),
  rentalYield: z.number(),
  condition: z.string(),
  dealScore: z.number(),
  question: z.string().optional()
});

/**
 * Handles requests to the deal advisor AI
 * Processes property data and user questions to provide deal insights
 */
export const dealAdvisorHandler = async (req: Request, res: Response) => {
  try {
    // Validate request body against schema
    const validationResult = dealAdvisorSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid request data",
        details: validationResult.error.format()
      });
    }

    const { 
      purchasePrice,
      marketPrice, 
      priceDiff,
      rentalYield,
      condition,
      dealScore,
      question 
    } = validationResult.data;

    // Create system prompt with property context
    const systemPrompt = `
You are a property investment advisor. You provide insights about property deals based on data.
You're analyzing a property with the following metrics:
- Purchase price: R${purchasePrice.toLocaleString()}
- Market value: R${marketPrice.toLocaleString()}
- Price difference: ${priceDiff > 0 ? '+' : ''}${priceDiff.toFixed(1)}% ${priceDiff > 0 ? 'above' : 'below'} market value
- Rental yield: ${rentalYield.toFixed(1)}%
- Property condition: ${condition}
- Overall deal score: ${dealScore}/100

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
