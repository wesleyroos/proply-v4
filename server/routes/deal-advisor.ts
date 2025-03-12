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

Your role is to help the real estate agent:
1. Provide balanced insights for both buyer and seller perspectives
2. Suggest negotiation points based on the deal score and market value
3. Highlight property strengths and potential concerns
4. Offer guidance on positioning the property or making a competitive offer
5. Provide context on comparable properties and market trends

Always reference the specific data points provided above in your responses when relevant.
Provide professional, concise advice that the agent can use when advising their clients.
`;

    // User's question or default prompt
    const userPrompt = question || "What do you think about this property deal?";

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