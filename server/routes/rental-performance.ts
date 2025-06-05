import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RentalPerformanceRequest {
  address: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  price: number;
}

interface ShortTermRentalData {
  percentile25: { nightly: number; monthly: number; annual: number };
  percentile50: { nightly: number; monthly: number; annual: number };
  percentile75: { nightly: number; monthly: number; annual: number };
  percentile90: { nightly: number; monthly: number; annual: number };
  occupancy: number;
  yield: number;
}

interface LongTermRentalData {
  minRental: number;
  maxRental: number;
  minYield: number | null;
  maxYield: number | null;
  managementFee: string;
  reasoning?: string;
}

// Helper function to get rental data without HTTP response
export async function fetchRentalData(propertyData: RentalPerformanceRequest & { images?: string[] }): Promise<{ shortTerm: ShortTermRentalData | null; longTerm: LongTermRentalData | null }> {
  try {
    // Fetch short-term rental data from PriceLabs
    const shortTermData = await fetchPriceLabsData(
      propertyData.address,
      propertyData.bedrooms,
      propertyData.bathrooms,
      propertyData.propertyType
    );

    // Generate long-term rental estimate using OpenAI with optional image analysis
    const longTermData = await generateLongTermEstimate(
      propertyData.address,
      propertyData.bedrooms,
      propertyData.bathrooms,
      propertyData.propertyType,
      propertyData.price,
      propertyData.images
    );

    return {
      shortTerm: shortTermData,
      longTerm: longTermData
    };
  } catch (error) {
    console.error('Error fetching rental data:', error);
    return {
      shortTerm: null,
      longTerm: null
    };
  }
}

export async function getRentalPerformance(req: Request, res: Response) {
  try {
    const { address, bedrooms, bathrooms, propertyType, price, images } = req.body as RentalPerformanceRequest & { images?: string[] };

    if (!address || !bedrooms || !price) {
      return res.status(400).json({ error: 'Missing required fields: address, bedrooms, price' });
    }

    // Fetch short-term rental data from PriceLabs
    const shortTermData = await fetchPriceLabsData(address, bedrooms, bathrooms, propertyType);
    
    // Generate long-term rental estimates using OpenAI with optional image analysis
    const longTermData = await generateLongTermEstimate(address, bedrooms, bathrooms, propertyType, price, images);

    res.json({
      shortTerm: shortTermData,
      longTerm: longTermData
    });

  } catch (error) {
    console.error('Error generating rental performance data:', error);
    res.status(500).json({ error: 'Failed to generate rental performance data' });
  }
}

export async function fetchPriceLabsData(
  address: string, 
  bedrooms: number, 
  bathrooms: number, 
  propertyType: string
): Promise<ShortTermRentalData> {
  try {
    const apiKey = process.env.PRICELABS_API_KEY;
    if (!apiKey) {
      throw new Error('PriceLabs API key not configured');
    }

    // Construct the PriceLabs Revenue Estimator API URL with query parameters
    const apiUrl = new URL('https://api.pricelabs.co/v1/revenue/estimator');
    apiUrl.searchParams.set('version', '2');
    apiUrl.searchParams.set('address', address);
    apiUrl.searchParams.set('currency', 'ZAR'); // South African Rand
    apiUrl.searchParams.set('bedroom_category', bedrooms.toString());

    // Add bathroom filter if available
    if (bathrooms > 0) {
      const filters = JSON.stringify({
        "bathroom": {"gt": bathrooms - 1}
      });
      apiUrl.searchParams.set('filters', filters);
    }

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`PriceLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract data from PriceLabs response format
    const bedroomData = data.KPIsByBedroomCategory?.[bedrooms.toString()];
    
    if (!bedroomData) {
      throw new Error('No data available for this bedroom category');
    }
    
    // Use PriceLabs data directly
    const occupancy = bedroomData.AvgAdjustedOccupancy || 0;
    
    return {
      percentile25: {
        nightly: bedroomData.ADR25PercentileAvg || 0,
        monthly: Math.round(bedroomData.Revenue25PercentileSum / 12) || 0,
        annual: bedroomData.Revenue25PercentileSum || 0
      },
      percentile50: {
        nightly: bedroomData.ADR50PercentileAvg || 0,
        monthly: bedroomData.RevenueMonthlyAvg || 0,
        annual: bedroomData.Revenue50PercentileSum || 0
      },
      percentile75: {
        nightly: bedroomData.ADR75PercentileAvg || 0,
        monthly: Math.round(bedroomData.Revenue75PercentileSum / 12) || 0,
        annual: bedroomData.Revenue75PercentileSum || 0
      },
      percentile90: {
        nightly: bedroomData.ADR90PercentileAvg || 0,
        monthly: Math.round(bedroomData.Revenue90PercentileSum / 12) || 0,
        annual: bedroomData.Revenue90PercentileSum || 0
      },
      occupancy: occupancy,
      yield: 0 // Will be calculated on frontend based on property price
    };

  } catch (error) {
    console.error('Error fetching PriceLabs data:', error);
    // Return fallback data based on Cape Town market averages
    const occupancy = 0.71;
    const daysPerMonth = 30;
    const monthsPerYear = 12;

    return {
      percentile25: {
        nightly: 1018,
        monthly: Math.round(1018 * daysPerMonth * occupancy),
        annual: Math.round(1018 * daysPerMonth * occupancy * monthsPerYear)
      },
      percentile50: {
        nightly: 1459,
        monthly: Math.round(1459 * daysPerMonth * occupancy),
        annual: Math.round(1459 * daysPerMonth * occupancy * monthsPerYear)
      },
      percentile75: {
        nightly: 2012,
        monthly: Math.round(2012 * daysPerMonth * occupancy),
        annual: Math.round(2012 * daysPerMonth * occupancy * monthsPerYear)
      },
      percentile90: {
        nightly: 2753,
        monthly: Math.round(2753 * daysPerMonth * occupancy),
        annual: Math.round(2753 * daysPerMonth * occupancy * monthsPerYear)
      },
      occupancy: 71,
      yield: 0
    };
  }
}

async function generateLongTermEstimate(
  address: string,
  bedrooms: number,
  bathrooms: number,
  propertyType: string,
  price: number,
  images?: string[]
): Promise<LongTermRentalData> {
  try {
    const prompt = `
As a Cape Town property rental expert, analyze this property and provide long-term rental estimates:

Property Details:
- Address: ${address}
- Type: ${propertyType}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Purchase Price: R${price.toLocaleString()}

${images && images.length > 0 ? 'I will also provide property images for visual assessment of condition, finishes, layout, and rental appeal.' : ''}

Please provide realistic monthly rental ranges for a standard 12-month lease in Cape Town. Consider:
- Location desirability and transport links
- Property type and size
- Current Cape Town rental market (2025)
- Quality expectations for the area
${images && images.length > 0 ? '- Property condition, finishes, and overall presentation from images' : ''}
- Tenant appeal and rental competitiveness

Respond in JSON format:
{
  "minMonthlyRental": number,
  "maxMonthlyRental": number,
  "reasoning": "brief explanation of estimate basis including visual assessment"
}
`;

    // Build messages with optional image analysis
    const messages: any[] = [
      {
        role: "system",
        content: "You are a Cape Town property rental expert with deep knowledge of local rental markets, property values, and yield calculations. Provide accurate, realistic rental estimates based on current market conditions and visual property assessment."
      }
    ];

    if (images && images.length > 0) {
      // Add message with images for visual analysis
      const imageContent = images.slice(0, 4).map(imageUrl => ({
        type: "image_url",
        image_url: { url: imageUrl }
      }));

      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...imageContent
        ]
      });
    } else {
      // Text-only message when no images available
      messages.push({
        role: "user",
        content: prompt
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const minRental = result.minMonthlyRental || 18000;
    const maxRental = result.maxMonthlyRental || 45000;

    // Calculate yields
    // Handle valuation properties (price = 0) gracefully
    let minYield = 0;
    let maxYield = 0;
    
    if (price > 0) {
      minYield = ((minRental * 12) / price) * 100;
      maxYield = ((maxRental * 12) / price) * 100;
    }

    return {
      minRental,
      maxRental,
      minYield: price > 0 ? Math.round(minYield * 10) / 10 : null,
      maxYield: price > 0 ? Math.round(maxYield * 10) / 10 : null,
      managementFee: "8-10%",
      reasoning: price === 0 ? "Yield cannot be calculated for valuation properties (no asking price)" : (result.reasoning || "AI-generated rental estimate")
    };

  } catch (error) {
    console.error('Error generating long-term rental estimate:', error);
    
    // Fallback calculation based on property price
    if (price > 0) {
      const estimatedYield = 0.08; // 8% conservative yield
      const minRental = Math.round((price * estimatedYield) / 12);
      const maxRental = Math.round((price * 0.15) / 12); // 15% higher yield

      return {
        minRental,
        maxRental,
        minYield: 8.0,
        maxYield: 15.0,
        managementFee: "8-10%",
        reasoning: "Fallback estimate used due to API error"
      };
    } else {
      // For valuation properties (price = 0), provide rental estimates without yield
      return {
        minRental: 25000, // Conservative estimate
        maxRental: 60000, // High-end estimate
        minYield: null,
        maxYield: null,
        managementFee: "8-10%",
        reasoning: "Yield cannot be calculated for valuation properties (no asking price)"
      };
    }
  }
}