import express from 'express';
import OpenAI from "openai";
import express from "express";

const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Area rate endpoint - public access
router.post('/area-rate', async (req, res) => {
  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }
  
  try {
    const { address, propertyType } = req.body;
    
    // First API call for market rate
    const response1 = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are a property valuation expert. Analyze the location and provide only a numerical rate per square meter for the given address based on recent market data. Return only the number."
      }, {
        role: "user",
        content: `What is the current rate per square meter for ${propertyType} properties in ${address}?`
      }]
    });

    // Second API call for validation
    const response2 = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are a real estate market analyst. Return only the numerical average rate per square meter for the specified location. Return only the number."
      }, {
        role: "user",
        content: `What is the average rate per square meter for ${propertyType} properties in ${address}?`
      }]
    });

    // Extract rates and calculate average
    const rate1 = parseFloat(response1.choices[0].message.content.replace(/[^\d.]/g, ''));
    const rate2 = parseFloat(response2.choices[0].message.content.replace(/[^\d.]/g, ''));
    const averageRate = Math.round((rate1 + rate2) / 2);

    res.json({ areaRate: averageRate });
  } catch (error) {
    console.error('Error fetching area rate:', error);
    res.status(500).json({ error: 'Failed to fetch area rate' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { dealDetails, question } = req.body;

    if (!dealDetails) {
      return res.status(400).json({
        error: "Missing deal details",
        details: "The request is missing required property data"
      });
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemPrompt = `You are an AI real estate advisor helping agents provide informed guidance to their clients. You're analyzing a property with the following details:

Purchase Price: R${dealDetails.purchasePrice.toLocaleString()}
Market Value: R${dealDetails.marketPrice.toLocaleString()}
Price Difference: ${dealDetails.priceDiff.toFixed(1)}% ${dealDetails.priceDiff > 0 ? 'above' : 'below'} market value
Deal Score: ${dealDetails.dealScore}/100
Property Condition: ${dealDetails.condition}
${dealDetails.rentalYield ? `Rental Yield: ${dealDetails.rentalYield.toFixed(1)}%` : ''}

Your role is to help the real estate agent:
1. Provide balanced insights for both buyer and seller perspectives
2. Suggest negotiation points based on the deal score and market value
3. Highlight property strengths and potential concerns
4. Offer guidance on positioning the property or making a competitive offer
5. Provide context on comparable properties and market trends

Provide professional, concise advice that the agent can use when advising their clients.`;

    // Create a streaming completion
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: question || "What do you think about this property deal?"
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: true
    });

    // Stream the response chunks to the client
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ chunk: content, fullResponse })}\n\n`);
      }
    }

    // End the response
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error in deal advisor:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to get AI response" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Failed to get AI response" })}\n\n`);
      res.end();
    }
  }
});

export default router;