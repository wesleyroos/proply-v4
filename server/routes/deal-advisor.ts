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

    // Log the request body for debugging
    console.log('Deal advisor request body:', JSON.stringify(req.body, null, 2));

    // Extract data from request (with fallback to ensure backward compatibility)
    const dealDetails = req.body.dealDetails || 
                        (req.body.context ? req.body.context : {});
    const question = req.body.question || '';

    if (!dealDetails) {
      console.error('Missing deal details in request');
      return res.status(400).json({
        error: "Missing deal details",
        details: "The request is missing required property data"
      });
    }

    // Construct the system prompt with data context
    const purchasePrice = dealDetails.purchasePrice || 0;
    const marketPrice = dealDetails.marketPrice || 0;
    const priceDiff = dealDetails.priceDiff || 0;
    const dealScore = dealDetails.dealScore || 0;
    const condition = dealDetails.condition || 'unknown';
    const rentalYield = dealDetails.rentalYield || null;

    console.log('Deal advisor constructing prompt with data:', {
      purchasePrice, marketPrice, priceDiff, dealScore, condition, rentalYield
    });

    const systemPrompt = `You are a real estate investment advisor helping agents evaluate property deals. 

Deal context:
Purchase Price: R${purchasePrice.toLocaleString()}
Market Value: R${marketPrice.toLocaleString()}
Price Difference: ${priceDiff.toFixed(1)}% ${priceDiff > 0 ? 'above' : 'below'} market value
Deal Score: ${dealScore}/100
Property Condition: ${condition}
${rentalYield ? `Rental Yield: ${rentalYield.toFixed(1)}%` : ''}
`;

    // User's question or default prompt
    const userPrompt = question || "What do you think about this property deal?";

    // Call OpenAI API
    try {
      console.log('Calling OpenAI API with system prompt:', systemPrompt);
      console.log('User prompt:', userPrompt);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 500
      });

      console.log('OpenAI API response received');
      
      // Return the response
      return res.json({
        response: completion.choices[0].message.content,
        tokensUsed: completion.usage?.total_tokens || 0
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      return res.status(503).json({
        error: "AI service error",
        details: openaiError instanceof Error ? openaiError.message : "Unknown OpenAI error",
        suggestion: "Please try again later"
      });
    }

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