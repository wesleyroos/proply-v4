import express from 'express';
import { getAreaRate, getDealAnalysis } from '../services/areaRateService';
import { getRentalRate, getSuburbSentiment } from '../services/rentalRateService';
import { getComparableSales } from '../services/comparableSalesService';
import OpenAI from "openai";
import { db } from 'db';
import { dealScoreLeads } from '@db/schema';

const router = express.Router();

// Email collection endpoint for deal score leads
router.post('/collect-email', async (req, res) => {
  try {
    const { email, propertyAddress, reportType, date } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Save the email to the database
    await db.insert(dealScoreLeads).values({
      email,
      propertyAddress,
      reportType: reportType || 'Deal Score',
      createdAt: date ? new Date(date) : new Date(),
    });

    res.status(200).json({ success: true, message: 'Email saved successfully' });
  } catch (error) {
    console.error('Error collecting email:', error);
    res.status(500).json({ error: 'Failed to save email address' });
  }
});

// Public endpoints
router.post('/rental-amount', async (req, res) => {
  try {
    const { address, propertySize, bedrooms, condition, luxuryRating } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const rentalRateRange = await getRentalRate(address, propertySize, bedrooms, condition, luxuryRating);
    res.json({ 
      rentalRange: {
        min: rentalRateRange.min,
        max: rentalRateRange.max
      },
      rentalAmount: rentalRateRange.average // Keep this for backward compatibility
    });
  } catch (error) {
    console.error('Error in rental-amount endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch rental amount' });
  }
});

// Suburb sentiment endpoint - public access
router.post('/suburb-sentiment', async (req, res) => {
  // Public endpoint - no auth required
  const { suburb } = req.body;

  if (!suburb) {
    return res.status(400).json({ error: 'Suburb is required' });
  }

  try {
    console.log(`Processing suburb sentiment request for suburb: "${suburb}"`);
    console.log(`OPENAI_API_KEY available: ${process.env.OPENAI_API_KEY ? 'YES' : 'NO'}`);
    console.log(`OPENAI_API_KEY length: ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0}`);

    // Validate and clean the suburb name
    const cleanedSuburb = suburb.trim().replace(/[^\w\s,-]/g, '');
    
    // Generate sentiment data using the OpenAI service that works for rental-amount
    console.log('Calling getSuburbSentiment service function...');
    const sentimentData = await getSuburbSentiment(cleanedSuburb);
    console.log('Suburb sentiment result:', sentimentData);
    
    res.json({ 
      success: true,
      data: sentimentData
    });
  } catch (error) {
    console.error('Error in suburb sentiment endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to analyze suburb sentiment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Area rate endpoint - public access
router.post('/area-rate', async (req, res) => {
  const { address, propertyType, luxuryRating } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    console.log(`Processing area rate request for ${address}${luxuryRating ? ` with luxury rating: ${luxuryRating}` : ''}`);
    const areaRate = await getAreaRate(address, propertyType, luxuryRating);

    if (typeof areaRate !== 'number' || isNaN(areaRate)) {
      throw new Error('Invalid area rate calculated');
    }

    console.log(`Successfully calculated area rate: ${areaRate}`);
    res.json({ 
      areaRate,
      message: 'Area rate calculated successfully'
    });
  } catch (error) {
    console.error('Error in area rate endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch area rate',
      details: error instanceof Error ? error.message : 'Unknown error',
      message: 'Could not calculate area rate. Please try again.'
    });
  }
});

// Comparable sales endpoint - public access
router.post('/comparable-sales', async (req, res) => {
  const { address, propertySize, bedrooms, propertyType, propertyCondition, luxuryRating } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  if (!propertySize || isNaN(Number(propertySize))) {
    return res.status(400).json({ error: 'Valid property size is required' });
  }

  if (!bedrooms || isNaN(Number(bedrooms))) {
    return res.status(400).json({ error: 'Valid number of bedrooms is required' });
  }

  try {
    console.log(`Processing comparable sales request for ${propertySize}m² ${bedrooms}-bedroom ${propertyType || 'property'} at ${address}`);
    
    const comparableSalesData = await getComparableSales(
      address,
      Number(propertySize),
      Number(bedrooms),
      propertyType,
      propertyCondition,
      luxuryRating ? Number(luxuryRating) : undefined
    );

    console.log(`Successfully retrieved ${comparableSalesData.properties.length} comparable properties`);
    res.json({
      success: true,
      data: comparableSalesData
    });
  } catch (error) {
    console.error('Error in comparable-sales endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch comparable sales data',
      details: error instanceof Error ? error.message : 'Unknown error',
      message: 'Could not retrieve comparable sales data. Please try again.'
    });
  }
});

// Deal analysis endpoint - public access
router.post('/deal-analysis', async (req, res) => {
  const { 
    address,
    areaRateResponses,
    finalAreaRate,
    propertySize,
    propertyCondition,
    propertyType,
    nightlyRate,
    occupancyRate,
    monthlyRental,
    purchasePrice,
    dealScore,
    luxuryRating // Add luxury rating parameter
  } = req.body;

  // Validate required fields
  const requiredFields = {
    address,
    finalAreaRate,
    propertySize,
    propertyCondition,
    purchasePrice,
    dealScore
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => value === undefined || value === null)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      missingFields 
    });
  }

  try {
    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await getDealAnalysis({
      address,
      areaRateResponses: Array.isArray(areaRateResponses) ? areaRateResponses : [],
      finalAreaRate,
      propertySize,
      propertyCondition,
      propertyType: propertyType || 'apartment', // Default to apartment if not specified
      nightlyRate,
      occupancyRate,
      monthlyRental,
      purchasePrice,
      dealScore,
      luxuryRating: luxuryRating ? Number(luxuryRating) : undefined // Pass luxury rating if available
    });

    // Stream the response chunks to the client
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    }

    // End the response
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error in deal analysis endpoint:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate deal analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Failed to generate deal analysis' })}\n\n`);
      res.end();
    }
  }
});

// Chat endpoint
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

    // Create a new OpenAI instance directly in this function
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an AI real estate advisor helping agents provide informed guidance to their clients. You're analyzing a property with the following details:

Purchase Price: R${dealDetails.purchasePrice.toLocaleString()}
Market Value: R${dealDetails.marketPrice.toLocaleString()}
Price Difference: ${dealDetails.priceDiff.toFixed(1)}% ${dealDetails.priceDiff > 0 ? 'above' : 'below'} market value
Deal Score: ${dealDetails.dealScore}/100
Property Condition: ${dealDetails.condition}
${dealDetails.luxuryRating ? `Luxury Rating: ${dealDetails.luxuryRating}/10` : ''}
${dealDetails.rentalYield ? `Rental Yield: ${dealDetails.rentalYield.toFixed(1)}%` : ''}

Your role is to help the real estate agent:
1. Provide balanced insights for both buyer and seller perspectives
2. Suggest negotiation points based on the deal score and market value
3. Highlight property strengths and potential concerns
4. Offer guidance on positioning the property or making a competitive offer
5. Provide context on comparable properties and market trends

Provide professional, concise advice that the agent can use when advising their clients.`;

    // Create a streaming completion
    const stream = await client.chat.completions.create({
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
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
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