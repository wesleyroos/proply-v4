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

    // Create system prompt with property details for real estate agents
    const systemPrompt = `
You are an AI real estate advisor helping agents provide informed guidance to their clients. You're analyzing a property with the following details:

Purchase Price: R${purchasePrice.toLocaleString()}
Market Value: R${marketPrice.toLocaleString()}
Price Difference: ${priceDiff.toFixed(1)}% ${priceDiff > 0 ? 'above' : 'below'} market value
Deal Score: ${dealScore}/100
Property Condition: ${condition}
${rentalYield ? `Rental Yield: ${rentalYield.toFixed(1)}%` : ''}

Your role is to help the real estate agent:
1. Provide balanced insights for both buyer and seller perspectives
2. Suggest negotiation points based on the deal score and market value
3. Highlight property strengths and potential concerns
4. Offer guidance on positioning the property or making a competitive offer
5. Provide context on comparable properties and market trends

Provide professional, concise advice that the agent can use when advising their clients.
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