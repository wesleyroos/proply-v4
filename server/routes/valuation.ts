import { Router } from "express";
import OpenAI from "openai";
import { fetchPriceLabsData } from "./rental-performance";

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/generate-valuation-report - Generate AI-powered property valuation
router.post("/generate-valuation-report", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const {
      address,
      propertyType,
      bedrooms,
      bathrooms,
      parkingSpaces,
      floorSize,
      landSize,
      price,
      images,
      location
    } = req.body;

    // Prepare property data for OpenAI analysis
    const propertyData = {
      address,
      propertyType,
      bedrooms,
      bathrooms,
      parkingSpaces,
      floorSize,
      landSize,
      currentListingPrice: price,
      location: location || {}
    };

    // Create the prompt for OpenAI
    const prompt = `You are a professional property valuer in South Africa with expertise in Cape Town real estate market. Analyze this property and provide a comprehensive valuation report.

Property Details:
- Address: ${address}
- Type: ${propertyType}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Parking Spaces: ${parkingSpaces || 'Not specified'}
- Floor Size: ${floorSize ? `${floorSize}m²` : 'Not specified'}
- Land Size: ${landSize ? `${landSize}m²` : 'Not specified'}
- Current Listing Price: R${price?.toLocaleString('en-ZA') || 'Not specified'}
- Location: ${location?.suburb || ''} ${location?.city || ''} ${location?.province || ''}

Based on current Cape Town property market conditions and the specifications provided, provide a comprehensive valuation and rental analysis in the following JSON format:

{
  "summary": "Brief 2-3 sentence summary of the property's key characteristics and market position",
  "valuations": [
    {
      "type": "Conservative",
      "formula": "Calculation method used (e.g., '90m² × R30,000/m²')",
      "value": numeric_value_in_rands
    },
    {
      "type": "Optimistic", 
      "formula": "Calculation method with premium factors",
      "value": numeric_value_in_rands
    },
    {
      "type": "Midline (Proply est.)",
      "formula": "Balanced calculation approach",
      "value": numeric_value_in_rands
    }
  ],
  "features": "Analysis of property features and their impact on value (2-3 sentences)",
  "marketContext": "Current market conditions and location factors affecting valuation (2-3 sentences)",
  "rentalEstimates": {
    "longTerm": {
      "minMonthlyRental": numeric_value,
      "maxMonthlyRental": numeric_value,
      "reasoning": "Brief explanation based on visual assessment and market analysis"
    }
  }
}

Consider factors like:
- Location premium/discount within Cape Town
- Property type market demand
- Size efficiency and layout
- Current market trends
- Comparable property values in the area
- For rental estimates: tenant appeal, rental competitiveness, property condition and finishes (from images if provided)

Provide realistic South African Rand valuations and rental estimates based on current Cape Town property market rates. For rental estimates, consider standard 12-month lease terms and factor in visual property condition, finishes, and overall tenant appeal.`;

    console.log('Generating valuation report for property:', address);

    // Fetch PriceLabs short-term rental data
    let shortTermData = null;
    try {
      shortTermData = await fetchPriceLabsData(address, bedrooms, bathrooms, propertyType);
    } catch (error) {
      console.error('PriceLabs API error:', error);
    }

    // Prepare messages for OpenAI
    const messages: any[] = [
      {
        role: "system",
        content: "You are a professional property valuer specializing in South African real estate, particularly Cape Town. Provide accurate, market-based valuations in JSON format only."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    // Add image analysis if images are provided
    if (images && images.length > 0) {
      const imageAnalysisPrompt = "Additionally, I'm providing property images for visual analysis. Consider the property's condition, finishes, views, and overall presentation in your valuation.";
      
      messages.push({
        role: "user",
        content: [
          { type: "text", text: imageAnalysisPrompt },
          ...images.slice(0, 3).map((imageUrl: string) => ({
            type: "image_url",
            image_url: { url: imageUrl }
          }))
        ]
      });
    }

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.7,
    });

    const reportContent = response.choices[0].message.content;
    
    if (!reportContent) {
      throw new Error("No response content from OpenAI");
    }

    // Parse the JSON response
    const valuationReport = JSON.parse(reportContent);

    console.log('Valuation report generated successfully');

    // Process rental estimates from the valuation report and combine with PriceLabs data
    const rentalPerformance = {
      shortTerm: shortTermData,
      longTerm: valuationReport.rentalEstimates?.longTerm ? {
        minRental: valuationReport.rentalEstimates.longTerm.minMonthlyRental,
        maxRental: valuationReport.rentalEstimates.longTerm.maxMonthlyRental,
        minYield: price ? parseFloat(((valuationReport.rentalEstimates.longTerm.minMonthlyRental * 12) / price * 100).toFixed(1)) : 0,
        maxYield: price ? parseFloat(((valuationReport.rentalEstimates.longTerm.maxMonthlyRental * 12) / price * 100).toFixed(1)) : 0,
        managementFee: "8-10%"
      } : null
    };

    // Include rental performance data in the response
    return res.json({
      ...valuationReport,
      rentalPerformance
    });

  } catch (error) {
    console.error("Error generating valuation report:", error);
    
    if (error instanceof SyntaxError) {
      return res.status(500).json({ 
        error: "Failed to parse AI response. Please try again." 
      });
    }
    
    return res.status(500).json({ 
      error: "Failed to generate valuation report. Please try again." 
    });
  }
});

export default router;