import { Router } from "express";
import OpenAI from "openai";
import { fetchPriceLabsData } from "./rental-performance";
import { db } from "../../db";
import { rentalPerformanceData } from "../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { trackReportGeneration } from "../utils/report-tracker";
import fetch from "node-fetch";

const router = Router();

// Function to validate image size before sending to OpenAI
async function validateImageSize(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      // OpenAI has a 20MB limit per image, we'll use 15MB as safe threshold
      return sizeInMB <= 15;
    }
    
    // If we can't determine size, allow it and let OpenAI handle it
    return true;
  } catch (error) {
    console.warn('Failed to validate image size for:', imageUrl, error);
    // If validation fails, allow the image and let OpenAI handle it
    return true;
  }
}

// Function to filter valid images for OpenAI
async function filterValidImages(images: string[]): Promise<string[]> {
  const validImages: string[] = [];
  
  for (const imageUrl of images.slice(0, 10)) {
    const isValid = await validateImageSize(imageUrl);
    if (isValid) {
      validImages.push(imageUrl);
    } else {
      console.log('Skipping oversized image:', imageUrl);
    }
  }
  
  return validImages;
}

// Function to calculate and save all financial data after valuation generation
export async function calculateAndSaveFinancialDataAfterValuation(
  propertyId: string, 
  propertyPrice: number, 
  valuationReport: any, 
  userId: number
) {
  console.log(`Calculating and saving financial data for property ${propertyId}`);
  
  // Get current financing parameters from database or use defaults
  const existingReport = await db.execute(sql`
    SELECT current_deposit_percentage, current_interest_rate, current_loan_term
    FROM valuation_reports 
    WHERE property_id = ${propertyId} AND user_id = ${userId}
    LIMIT 1
  `);
  
  const financingParams = existingReport.rows[0] || {
    current_deposit_percentage: 10,
    current_interest_rate: 11.5,
    current_loan_term: 20
  };

  // 1. ANNUAL PROPERTY APPRECIATION DATA
  const annualPropertyAppreciationData = {
    baseSuburbRate: valuationReport.propertyAppreciation?.suburbAppreciationRate || 8.0,
    propertyAdjustments: valuationReport.propertyAppreciation?.adjustments || {},
    finalAppreciationRate: valuationReport.propertyAppreciation?.annualAppreciationRate || 8.0,
    yearlyValues: (() => {
      const rate = (valuationReport.propertyAppreciation?.annualAppreciationRate || 8.0) / 100;
      return [1, 2, 3, 4, 5, 10, 20].reduce((acc, year) => {
        acc[`year${year}`] = propertyPrice * Math.pow(1 + rate, year);
        return acc;
      }, {} as Record<string, number>);
    })(),
    reasoning: valuationReport.propertyAppreciation?.reasoning || "Standard market appreciation rate applied automatically"
  };

  // 2. CASHFLOW ANALYSIS DATA
  const shortTermRevenue = valuationReport.rentalEstimates?.shortTerm?.estimatedAnnualRevenue;
  const longTermRevenue = valuationReport.rentalEstimates?.longTerm ? 
    (valuationReport.rentalEstimates.longTerm.minMonthlyRental + valuationReport.rentalEstimates.longTerm.maxMonthlyRental) / 2 * 12 
    : null;

  const cashflowAnalysisData = {
    recommendedStrategy: shortTermRevenue > (longTermRevenue || 0) ? "shortTerm" : "longTerm",
    strategyReasoning: "Automatically calculated based on available rental data",
    revenueGrowthTrajectory: {
      shortTerm: shortTermRevenue ? {
        year1: { revenue: shortTermRevenue, grossYield: (shortTermRevenue / propertyPrice) * 100 },
        year2: { revenue: shortTermRevenue * 1.08, grossYield: (shortTermRevenue * 1.08 / propertyPrice) * 100 },
        year3: { revenue: shortTermRevenue * Math.pow(1.08, 2), grossYield: (shortTermRevenue * Math.pow(1.08, 2) / propertyPrice) * 100 },
        year4: { revenue: shortTermRevenue * Math.pow(1.08, 3), grossYield: (shortTermRevenue * Math.pow(1.08, 3) / propertyPrice) * 100 },
        year5: { revenue: shortTermRevenue * Math.pow(1.08, 4), grossYield: (shortTermRevenue * Math.pow(1.08, 4) / propertyPrice) * 100 }
      } : null,
      longTerm: longTermRevenue ? {
        year1: { revenue: longTermRevenue, grossYield: (longTermRevenue / propertyPrice) * 100 },
        year2: { revenue: longTermRevenue * 1.08, grossYield: (longTermRevenue * 1.08 / propertyPrice) * 100 },
        year3: { revenue: longTermRevenue * Math.pow(1.08, 2), grossYield: (longTermRevenue * Math.pow(1.08, 2) / propertyPrice) * 100 },
        year4: { revenue: longTermRevenue * Math.pow(1.08, 3), grossYield: (longTermRevenue * Math.pow(1.08, 3) / propertyPrice) * 100 },
        year5: { revenue: longTermRevenue * Math.pow(1.08, 4), grossYield: (longTermRevenue * Math.pow(1.08, 4) / propertyPrice) * 100 }
      } : null
    }
  };

  // 3. FINANCING ANALYSIS DATA
  const depositPercentage = Number(financingParams.current_deposit_percentage) / 100;
  const interestRate = Number(financingParams.current_interest_rate) / 100;
  const loanTermYears = Number(financingParams.current_loan_term);
  const loanTermMonths = loanTermYears * 12;
  
  const depositAmount = propertyPrice * depositPercentage;
  const loanAmount = propertyPrice - depositAmount;
  const monthlyInterestRate = interestRate / 12;
  
  const monthlyPayment = (loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths))) / (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);

  const financingAnalysisData = {
    financingParameters: {
      depositAmount,
      depositPercentage: Number(financingParams.current_deposit_percentage),
      loanAmount,
      interestRate: Number(financingParams.current_interest_rate),
      loanTerm: loanTermYears,
      monthlyPayment
    },
    yearlyMetrics: [1, 2, 3, 4, 5, 10, 20].reduce((acc, year) => {
      const monthsElapsed = year * 12;
      let remainingBalance = loanAmount;
      let totalPrincipalPaid = 0;

      for (let month = 1; month <= monthsElapsed && month <= loanTermMonths; month++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        totalPrincipalPaid += principalPayment;
        remainingBalance -= principalPayment;
      }

      acc[`year${year}`] = {
        monthlyPayment,
        equityBuildup: totalPrincipalPaid,
        remainingBalance: Math.max(0, remainingBalance)
      };
      return acc;
    }, {} as Record<string, { monthlyPayment: number; equityBuildup: number; remainingBalance: number }>)
  };

  // Save all financial data to database
  const updateResult = await db.execute(sql`
    UPDATE valuation_reports 
    SET 
      annual_property_appreciation_data = ${JSON.stringify(annualPropertyAppreciationData)},
      cashflow_analysis_data = ${JSON.stringify(cashflowAnalysisData)},
      financing_analysis_data = ${JSON.stringify(financingAnalysisData)},
      updated_at = NOW()
    WHERE property_id = ${propertyId} AND user_id = ${userId}
  `);

  if (updateResult.rowCount === 0) {
    throw new Error(`No valuation report found to update for property ${propertyId} and user ${userId}`);
  }

  console.log(`Successfully saved comprehensive financial data for property ${propertyId}`);
}

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
      propertyId,
      monthlyLevy
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
- Monthly Levy: R${monthlyLevy?.toLocaleString('en-ZA') || 'Not specified'}
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
  },
  "propertyAppreciation": {
    "annualAppreciationRate": numeric_value_percentage,
    "components": {
      "baseSuburbRate": {
        "rate": numeric_value_percentage,
        "justification": "Historical CAGR and recent market trends for this suburb"
      },
      "propertyTypeModifier": {
        "adjustment": numeric_value_percentage,
        "justification": "Explanation of why this property type performs differently vs full-title homes"
      },
      "levyImpact": {
        "levyPerSquareMeter": numeric_value,
        "adjustment": numeric_value_percentage,
        "justification": "Analysis of levy impact - high/low relative to area norm and investor appeal"
      },
      "visualConditionAdjustment": {
        "adjustment": numeric_value_percentage,
        "justification": "Based on property condition, finishes, and renovation needs from images"
      },
      "locationPremium": {
        "adjustment": numeric_value_percentage,
        "justification": "Premium/discount for views, proximity to amenities, transport links"
      }
    },
    "fiveYearProjection": [
      {"year": 2025, "estimatedValue": numeric_value},
      {"year": 2026, "estimatedValue": numeric_value},
      {"year": 2027, "estimatedValue": numeric_value},
      {"year": 2028, "estimatedValue": numeric_value},
      {"year": 2029, "estimatedValue": numeric_value}
    ],
    "summary": "Brief summary of key appreciation drivers and potential risks"
  }
}

Consider factors like:
- Location premium/discount within Cape Town
- Property type market demand
- Size efficiency and layout
- Current market trends
- Comparable property values in the area
- For rental estimates: tenant appeal, rental competitiveness, property condition and finishes (from images if provided)

FOR PROPERTY APPRECIATION ANALYSIS:
1. BASE SUBURB RATE: Research historical appreciation for this specific suburb/area (typical Cape Town suburbs: 4-8% annually)
2. PROPERTY TYPE MODIFIER: Analyze why apartments vs townhouses vs full-title homes perform differently (liquidity, maintenance, demographics)
3. LEVY IMPACT: Calculate levy per m² (divide monthly levy by floor size). Cape Town norm is R30-R40/m². High levies (>R50/m²) typically reduce investor appeal and growth
4. VISUAL CONDITION: Assess renovation needs, finishes quality, and marketability from images. Dated properties typically lag market by 0.5-1.5%
5. LOCATION PREMIUM: Consider proximity to transport, amenities, views, security. Premium locations can add 0.3-0.8% annually

Use current property price as baseline for 5-year projections with compound annual growth.

CRITICAL: Rental estimates MUST vary based on:
1. NUMBER OF BEDROOMS: ${bedrooms} bedrooms should determine base rental range
2. PROPERTY SIZE: ${floorSize}m² affects rental value significantly  
3. LOCATION PREMIUM: Analyze ${address} for location-based adjustments
4. VISUAL CONDITION: Use image analysis to adjust rental estimates up/down by 10-30%
5. PARKING AVAILABILITY: ${parkingSpaces || 0} parking spaces add premium

IMPORTANT RENTAL BASELINE: Many property agents use a rule of thumb where monthly rental = 0.6% of purchase price (R${Math.round(price * 0.006).toLocaleString()} for this property). Use this as a baseline reference point and adjust based on the specific property characteristics and market conditions. If the property warrants it, this 0.6% figure can serve as a midpoint for your rental range.

Provide realistic South African Rand valuations and rental estimates based on current South African property market rates. For rental estimates, consider standard 12-month lease terms and factor in visual property condition, finishes, and overall tenant appeal.

ENSURE rental estimates are property-specific and NOT generic ranges, and include the 0.6% rule consideration in your reasoning.`;

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
      
      console.log('Validating images for OpenAI analysis:', images.length, 'images');
      
      // Filter out oversized images to prevent OpenAI API failures
      const validImages = await filterValidImages(images);
      
      if (validImages.length > 0) {
        console.log('Sending images to OpenAI for visual analysis:', validImages.length, 'valid images');
        
        messages.push({
          role: "user",
          content: [
            { type: "text", text: imageAnalysisPrompt },
            ...validImages.map((imageUrl: string) => ({
              type: "image_url",
              image_url: { url: imageUrl }
            }))
          ]
        });
      } else {
        console.log('No valid images found for OpenAI analysis - all images too large or inaccessible');
      }
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
        minYield: price && price > 0 ? parseFloat(((valuationReport.rentalEstimates.longTerm.minMonthlyRental * 12) / price * 100).toFixed(1)) : null,
        maxYield: price && price > 0 ? parseFloat(((valuationReport.rentalEstimates.longTerm.maxMonthlyRental * 12) / price * 100).toFixed(1)) : null,
        managementFee: "8-10%",
        reasoning: valuationReport.rentalEstimates.longTerm.reasoning || (price === 0 ? "Yield cannot be calculated for valuation properties (no asking price)" : "AI-generated rental estimate")
      } : null
    };

    console.log('Final rental performance data:', rentalPerformance);

    // Define propertyId to use for database operations
    const propertyIdToUse = propertyId || address.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    // Save rental performance data to database for persistence
    if (rentalPerformance.longTerm || rentalPerformance.shortTerm) {
      try {
        
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

    // Track report generation for analytics
    try {
      await trackReportGeneration({
        propertyId: propertyIdToUse,
        reportType: 'valuation',
        userId: req.user.id
      });
    } catch (error) {
      console.error('Error tracking report generation:', error);
    }

    // Include rental performance data in the response
    const responseData = {
      ...valuationReport,
      rentalPerformance
    };

    // Return response immediately, calculate financial data after response is sent
    res.json(responseData);

    // CALCULATE AND SAVE ALL FINANCIAL DATA AFTER VALUATION IS SAVED TO DATABASE
    // This happens asynchronously after the response to avoid race conditions
    setTimeout(async () => {
      try {
        await calculateAndSaveFinancialDataAfterValuation(propertyIdToUse, price || 0, valuationReport, req.user.id);
      } catch (error) {
        console.error('Error saving financial data (async):', error);
      }
    }, 100); // Small delay to ensure valuation is saved first

    return;

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

// PATCH /api/valuation-reports/:propertyId/financing - Update financing parameters
// This endpoint updates the current working state of financing parameters for a property
// Ensures single source of truth for PDF generation by storing user's current financing scenario
router.patch("/:propertyId/financing", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { propertyId } = req.params;
    const { 
      depositPercentage, 
      interestRate, 
      loanTerm,
      purchasePrice // Property price needed to calculate derived values
    } = req.body;

    // Validate required fields
    if (!depositPercentage || !interestRate || !loanTerm || !purchasePrice) {
      return res.status(400).json({ 
        error: "Missing required financing parameters: depositPercentage, interestRate, loanTerm, purchasePrice" 
      });
    }

    // Calculate derived financing values to store in database
    // This avoids recalculation during PDF generation and ensures consistency
    const depositAmount = (purchasePrice * depositPercentage) / 100;
    const loanAmount = purchasePrice - depositAmount;
    
    // Calculate monthly repayment using standard mortgage formula
    // M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    const monthlyRepayment = monthlyRate > 0 
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
      : loanAmount / numPayments; // Handle 0% interest case

    console.log(`Updating financing parameters for property ${propertyId}:`, {
      depositPercentage,
      interestRate,
      loanTerm,
      purchasePrice,
      calculatedDepositAmount: depositAmount,
      calculatedLoanAmount: loanAmount,
      calculatedMonthlyRepayment: monthlyRepayment
    });

    // Update the valuation report with new financing parameters
    // This creates our single source of truth for PDF generation
    const result = await db.execute(sql`
      UPDATE valuation_reports 
      SET 
        current_deposit_percentage = ${depositPercentage.toString()},
        current_interest_rate = ${interestRate.toString()},
        current_loan_term = ${loanTerm},
        current_deposit_amount = ${depositAmount.toString()},
        current_loan_amount = ${loanAmount.toString()},
        current_monthly_repayment = ${monthlyRepayment.toString()},
        updated_at = NOW()
      WHERE property_id = ${propertyId} 
        AND user_id = ${req.user.id}
      RETURNING *
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: "Valuation report not found for this property" 
      });
    }

    console.log('Successfully updated financing parameters in database');

    // Return the updated financing data
    res.json({
      success: true,
      financing: {
        depositPercentage: parseFloat(depositPercentage),
        interestRate: parseFloat(interestRate),
        loanTerm: parseInt(loanTerm),
        depositAmount: depositAmount,
        loanAmount: loanAmount,
        monthlyRepayment: monthlyRepayment
      }
    });

  } catch (error) {
    console.error("Error updating financing parameters:", error);
    return res.status(500).json({ 
      error: "Failed to update financing parameters" 
    });
  }
});

// PATCH /api/valuation-reports/:propertyId/financial-data - Save all financial analysis data
// This endpoint saves the complete financial analysis data to ensure single source of truth for PDF generation
// Includes: annual property appreciation, cashflow analysis, and financing analysis data
router.patch("/:propertyId/financial-data", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { propertyId } = req.params;
    const { 
      annualPropertyAppreciationData,
      cashflowAnalysisData,
      financingAnalysisData,
      // Optional financing parameter updates
      depositPercentage,
      interestRate,
      loanTerm,
      purchasePrice
    } = req.body;

    // Validate required financial data
    if (!annualPropertyAppreciationData || !cashflowAnalysisData || !financingAnalysisData) {
      return res.status(400).json({ 
        error: "Missing required financial analysis data" 
      });
    }

    console.log(`Saving complete financial analysis data for property ${propertyId}:`, {
      hasAnnualAppreciation: !!annualPropertyAppreciationData,
      hasCashflowAnalysis: !!cashflowAnalysisData,
      hasFinancingAnalysis: !!financingAnalysisData,
      updatingFinancingParams: !!(depositPercentage && interestRate && loanTerm)
    });

    // Calculate financing parameters if provided
    let depositAmount, loanAmount, monthlyRepayment;
    if (depositPercentage && interestRate && loanTerm && purchasePrice) {
      depositAmount = (purchasePrice * depositPercentage) / 100;
      loanAmount = purchasePrice - depositAmount;
      
      const monthlyRate = interestRate / 100 / 12;
      const numPayments = loanTerm * 12;
      monthlyRepayment = monthlyRate > 0 
        ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
        : loanAmount / numPayments;
    }

    // Update the valuation report with all financial analysis data
    const result = depositPercentage && interestRate && loanTerm && purchasePrice
      ? await db.execute(sql`
          UPDATE valuation_reports 
          SET 
            annual_property_appreciation_data = ${JSON.stringify(annualPropertyAppreciationData)},
            cashflow_analysis_data = ${JSON.stringify(cashflowAnalysisData)},
            financing_analysis_data = ${JSON.stringify(financingAnalysisData)},
            current_deposit_percentage = ${depositPercentage.toString()},
            current_interest_rate = ${interestRate.toString()},
            current_loan_term = ${loanTerm},
            current_deposit_amount = ${depositAmount!.toString()},
            current_loan_amount = ${loanAmount!.toString()},
            current_monthly_repayment = ${monthlyRepayment!.toString()},
            updated_at = NOW()
          WHERE property_id = ${propertyId} 
            AND user_id = ${req.user.id}
          RETURNING *
        `)
      : await db.execute(sql`
          UPDATE valuation_reports 
          SET 
            annual_property_appreciation_data = ${JSON.stringify(annualPropertyAppreciationData)},
            cashflow_analysis_data = ${JSON.stringify(cashflowAnalysisData)},
            financing_analysis_data = ${JSON.stringify(financingAnalysisData)},
            updated_at = NOW()
          WHERE property_id = ${propertyId} 
            AND user_id = ${req.user.id}
          RETURNING *
        `);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: "Valuation report not found for this property" 
      });
    }

    console.log(`=== FINANCIAL DATA SAVED for property ${propertyId} ===`);
    console.log('Successfully saved complete financial analysis data to database');
    console.log('Financial update timestamp:', new Date().toISOString());

    // Return confirmation with data summary
    res.json({
      success: true,
      financialDataSaved: {
        annualPropertyAppreciation: !!annualPropertyAppreciationData,
        cashflowAnalysis: !!cashflowAnalysisData, 
        financingAnalysis: !!financingAnalysisData,
        financingParametersUpdated: !!(depositPercentage && interestRate && loanTerm)
      }
    });

  } catch (error) {
    console.error("Error saving financial analysis data:", error);
    return res.status(500).json({ 
      error: "Failed to save financial analysis data" 
    });
  }
});

export default router;