
import { Request, Response } from 'express';
import { OpenAI } from 'openai';
import { requireAuth } from "../auth";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Check if API key is configured
const isApiKeyConfigured = !!process.env.OPENAI_API_KEY;

export const dealAdvisorHandler = async (req: Request, res: Response) => {
  try {
    // Require authentication
    const user = requireAuth(req, res);
    if (!user) return;

    // Check if OpenAI API key is configured
    if (!isApiKeyConfigured) {
      console.error('OpenAI API key is not configured');
      return res.status(503).json({ 
        error: "AI service is unavailable", 
        details: "OpenAI API key is not configured" 
      });
    }

    // Extract data from request
    const { 
      question,
      dealContext
    } = req.body;

    // Validate input
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    if (!dealContext) {
      return res.status(400).json({ error: "Deal context is required" });
    }

    // Create a system prompt for the AI with property-specific context
    const systemPrompt = `
You are a helpful Real Estate Deal Advisor that provides guidance on property investments.

You're currently analyzing a property deal with the following characteristics:
- Purchase Price: R${dealContext.purchasePrice.toLocaleString()}
- Market Value: R${dealContext.marketPrice.toLocaleString()}
- Price Difference: ${Math.abs(dealContext.priceDiff).toFixed(1)}% ${dealContext.priceDiff > 0 ? 'above' : 'below'} market value
- Property Condition: ${dealContext.condition}
- Deal Score: ${dealContext.dealScore}/100
${dealContext.rentalYield ? `- Expected Rental Yield: ${dealContext.rentalYield.toFixed(1)}%` : ''}

Based on these metrics, provide helpful, concise, and professional advice for property investors.
Focus on actionable insights and practical recommendations.

Property is ${dealContext.priceDiff <= -5 ? 'underpriced' : dealContext.priceDiff <= 5 ? 'fairly priced' : 'overpriced'}.
Deal score interpretation:
- 90-100: Excellent deal
- 75-89: Very good deal
- 60-74: Good deal
- 40-59: Fair deal
- Below 40: Poor deal / Requires caution

For yield:
- Above 8%: Excellent
- 6-8%: Good
- 4-6%: Average
- Below 4%: Poor
`;

    // Make request to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    // Get AI response
    const aiResponse = completion.choices[0].message.content;

    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    // Return success response
    return res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error('Deal advisor error:', error);
    
    // Check if error is related to OpenAI API
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isOpenAIError = errorMessage.includes('openai') || 
                          errorMessage.includes('api key') || 
                          errorMessage.includes('authentication');
    
    return res.status(500).json({ 
      error: isOpenAIError 
        ? "AI service is currently unavailable" 
        : "Failed to process deal advisor request",
      details: errorMessage,
      suggestion: isOpenAIError 
        ? "Please contact the administrator to verify the OpenAI API configuration" 
        : "Please try again later"
    });
  }
};
