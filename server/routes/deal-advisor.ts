
import { Request, Response } from "express";
import OpenAI from "openai";
import { auth } from "../auth";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * API handler for deal advisor AI responses
 * Requires authentication and processes user queries related to property deals
 */
export const dealAdvisorHandler = async (req: Request, res: Response) => {
  try {
    // Verify authenticated user
    const user = auth(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Extract query and context from request
    const { query, context } = req.body;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Invalid query" });
    }
    
    // Create system prompt with context about the property
    const systemPrompt = `You are an AI real estate investment advisor specializing in property deal analysis.
    
Current property context:
- Purchase Price: R${context.purchasePrice.toLocaleString()}
- Market Value: R${context.marketPrice.toLocaleString()}
- Price Difference: ${context.priceDiff.toFixed(1)}% ${context.priceDiff > 0 ? "above" : "below"} market value
- Property Condition: ${context.condition}
- Deal Score: ${context.dealScore}/100
${context.rentalYield ? `- Rental Yield: ${context.rentalYield.toFixed(1)}%` : ""}

Provide concise, practical advice based on this data. Focus on actionable insights for the investor.`;

    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      max_tokens: 750,
      temperature: 0.7,
    });
    
    // Return AI response to client
    return res.status(200).json({ 
      response: response.choices[0].message.content
    });
    
  } catch (error) {
    console.error("Deal advisor error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
