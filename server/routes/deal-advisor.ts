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

Your role is to help real estate agents better serve their diverse clientele:

For Investment Buyers:
1. Analyze short-term and long-term rental yield potential
2. Highlight ROI factors based on the property's condition and price
3. Provide insights on cash flow projections and capital appreciation
4. Compare investment value against other market opportunities

For Owner-Occupiers:
1. Focus on lifestyle benefits and property features
2. Discuss long-term value appreciation potential
3. Address affordability and financing considerations
4. Highlight neighborhood amenities and quality of life factors

For All Clients:
1. Suggest negotiation strategies based on the deal score and market value
2. Identify property strengths and potential concerns
3. Provide market trend insights relevant to the purchase decision
4. Offer tactical advice for competitive offers or seller responses

Keep your advice professional, practical, and tailored to the agent's needs when advising different types of clients.
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