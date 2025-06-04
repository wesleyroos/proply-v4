import { Router } from "express";
import OpenAI from "openai";
import { fetchPriceLabsData } from "./rental-performance";
import { db } from "../../db";
import { rentalPerformanceData } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";

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
      location,
      propertyId
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

IMPORTANT: For rental estimates, consider the specific property characteristics:
- 1-bedroom apartments in Cape Town typically rent for R15,000-R25,000/month
- 2-bedroom apartments typically rent for R25,000-R40,000/month  
- 3-bedroom apartments typically rent for R40,000-R65,000/month
- Premium locations (Waterfront, Sea Point, Camps Bay) command 30-50% premiums
- Modern finishes and parking add 10-20% to rental values
- Property condition from images significantly impacts rental potential

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
      "type": "Midline (Proply est.)",
      "formula": "Balanced calculation approach",
      "value": numeric_value_in_rands
    },
    {
      "type": "Optimistic", 
      "formula": "Calculation method with premium factors",
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

CRITICAL: Rental estimates MUST vary based on:
1. NUMBER OF BEDROOMS: ${bedrooms} bedrooms should determine base rental range
2. PROPERTY SIZE: ${floorSize}m² affects rental value significantly  
3. LOCATION PREMIUM: Analyze ${address} for location-based adjustments
4. VISUAL CONDITION: Use image analysis to adjust rental estimates up/down by 10-30%
5. PARKING AVAILABILITY: ${parkingSpaces || 0} parking spaces add premium

Provide realistic South African Rand valuations and rental estimates based on current Cape Town property market rates. For rental estimates, consider standard 12-month lease terms and factor in visual property condition, finishes, and overall tenant appeal.

ENSURE rental estimates are property-specific and NOT generic ranges.`;

    console.log('Generating valuation report for property:', address);
    console.log('Property details for rental analysis:', {
      address,
      bedrooms,
      bathrooms,
      propertyType,
      price,
      floorSize,
      parkingSpaces,
      imagesProvided: images ? images.length : 0
    });
    console.log('Expected rental range for', bedrooms, 'bedrooms:', 
      bedrooms === 1 ? 'R15,000-R25,000' : 
      bedrooms === 2 ? 'R25,000-R40,000' : 
      bedrooms === 3 ? 'R40,000-R65,000' : 'R50,000+'
    );

    // Fetch PriceLabs short-term rental data
    let shortTermData = null;
    try {
      console.log('Fetching PriceLabs data...');
      shortTermData = await fetchPriceLabsData(address, bedrooms, bathrooms, propertyType);
      console.log('PriceLabs data received:', shortTermData);
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
      const imageAnalysisPrompt = `Additionally, I'm providing property images for visual analysis. Consider the property's condition, finishes, views, and overall presentation in both your valuation AND rental estimates. 

For rental estimates, carefully assess:
- Property finishes and quality level (affects premium pricing)
- Layout and space efficiency 
- Natural light and views
- Overall condition and maintenance
- Tenant appeal and marketability

This is a ${bedrooms}-bedroom property in Cape Town. For context, similar properties in desirable Cape Town areas typically rent for R35,000-R55,000+ per month depending on location, condition, and finishes.`;
      
      console.log('Sending images to OpenAI for visual analysis:', images.length, 'images');
      
      messages.push({
        role: "user",
        content: [
          { type: "text", text: imageAnalysisPrompt },
          ...images.slice(0, 10).map((imageUrl: string) => ({
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
    console.log('OpenAI rental estimates received:', valuationReport.rentalEstimates);
    
    // Process rental estimates from the valuation report and combine with PriceLabs data
    const rentalPerformance = {
      shortTerm: shortTermData,
      longTerm: valuationReport.rentalEstimates?.longTerm ? {
        minRental: valuationReport.rentalEstimates.longTerm.minMonthlyRental,
        maxRental: valuationReport.rentalEstimates.longTerm.maxMonthlyRental,
        minYield: price ? parseFloat(((valuationReport.rentalEstimates.longTerm.minMonthlyRental * 12) / price * 100).toFixed(1)) : 0,
        maxYield: price ? parseFloat(((valuationReport.rentalEstimates.longTerm.maxMonthlyRental * 12) / price * 100).toFixed(1)) : 0,
        managementFee: "8-10%",
        reasoning: valuationReport.rentalEstimates.longTerm.reasoning
      } : null
    };

    console.log('Final rental performance data:', rentalPerformance);

    // Save rental performance data to database for persistence
    if (rentalPerformance.longTerm || rentalPerformance.shortTerm) {
      try {
        const propertyIdToUse = propertyId || address.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        
        // Check if rental data already exists for this property
        const existingRentalData = await db.execute(sql`
          SELECT id FROM rental_performance_data 
          WHERE user_id = ${req.user.id} AND property_id = ${propertyIdToUse}
          LIMIT 1
        `);

        if (existingRentalData.rows.length > 0) {
          // Update existing record
          await db.execute(sql`
            UPDATE rental_performance_data 
            SET 
              address = ${address},
              bedrooms = ${bedrooms},
              bathrooms = ${bathrooms},
              property_type = ${propertyType},
              price = ${price?.toString()},
              short_term_data = ${JSON.stringify(rentalPerformance.shortTerm)},
              long_term_min_rental = ${rentalPerformance.longTerm?.minRental?.toString()},
              long_term_max_rental = ${rentalPerformance.longTerm?.maxRental?.toString()},
              long_term_min_yield = ${rentalPerformance.longTerm?.minYield?.toString()},
              long_term_max_yield = ${rentalPerformance.longTerm?.maxYield?.toString()},
              long_term_reasoning = ${valuationReport.rentalEstimates?.longTerm?.reasoning},
              images_analyzed = ${images ? images.length : 0},
              analysis_model = 'gpt-4o',
              updated_at = NOW()
            WHERE id = ${existingRentalData.rows[0].id}
          `);
          console.log('Updated existing rental performance data in database');
        } else {
          // Insert new record
          await db.execute(sql`
            INSERT INTO rental_performance_data (
              user_id, property_id, address, bedrooms, bathrooms, property_type, price,
              short_term_data, long_term_min_rental, long_term_max_rental, 
              long_term_min_yield, long_term_max_yield, long_term_reasoning,
              images_analyzed, analysis_model
            ) VALUES (
              ${req.user.id}, ${propertyIdToUse}, ${address}, ${bedrooms}, ${bathrooms}, 
              ${propertyType}, ${price?.toString()}, ${JSON.stringify(rentalPerformance.shortTerm)},
              ${rentalPerformance.longTerm?.minRental?.toString()}, ${rentalPerformance.longTerm?.maxRental?.toString()},
              ${rentalPerformance.longTerm?.minYield?.toString()}, ${rentalPerformance.longTerm?.maxYield?.toString()},
              ${valuationReport.rentalEstimates?.longTerm?.reasoning}, ${images ? images.length : 0}, 'gpt-4o'
            )
          `);
          console.log('Saved new rental performance data to database');
        }
      } catch (error) {
        console.error('Error saving rental performance data to database:', error);
      }
    }

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