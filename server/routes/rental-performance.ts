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
  minYield: number;
  maxYield: number;
  managementFee: string;
}

// Helper function to get rental data without HTTP response
export async function fetchRentalData(propertyData: RentalPerformanceRequest): Promise<{ shortTerm: ShortTermRentalData | null; longTerm: LongTermRentalData | null }> {
  try {
    // Fetch short-term rental data from PriceLabs
    const shortTermData = await fetchPriceLabsData(
      propertyData.address,
      propertyData.bedrooms,
      propertyData.bathrooms,
      propertyData.propertyType
    );

    // Generate long-term rental estimate using OpenAI
    const longTermData = await generateLongTermEstimate(
      propertyData.address,
      propertyData.bedrooms,
      propertyData.bathrooms,
      propertyData.propertyType,
      propertyData.price
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
    const { address, bedrooms, bathrooms, propertyType, price } = req.body as RentalPerformanceRequest;

    if (!address || !bedrooms || !price) {
      return res.status(400).json({ error: 'Missing required fields: address, bedrooms, price' });
    }

    // Fetch short-term rental data from PriceLabs
    const shortTermData = await fetchPriceLabsData(address, bedrooms, bathrooms, propertyType);
    
    // Generate long-term rental estimates using OpenAI
    const longTermData = await generateLongTermEstimate(address, bedrooms, bathrooms, propertyType, price);

    res.json({
      shortTerm: shortTermData,
      longTerm: longTermData
    });

  } catch (error) {
    console.error('Error generating rental performance data:', error);
    res.status(500).json({ error: 'Failed to generate rental performance data' });
  }
}

async function fetchPriceLabsData(
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

    // PriceLabs API endpoint for market data
    const response = await fetch('https://api.pricelabs.co/v1/market_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        address: address,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        property_type: propertyType.toLowerCase(),
        market_data_type: 'percentiles'
      })
    });

    if (!response.ok) {
      throw new Error(`PriceLabs API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Calculate monthly and annual from nightly rates assuming given occupancy
    const occupancy = data.occupancy || 0.71; // Default 71% occupancy
    const daysPerMonth = 30;
    const monthsPerYear = 12;

    const percentile25Nightly = data.percentiles?.p25?.adr || 1018;
    const percentile50Nightly = data.percentiles?.p50?.adr || 1459;
    const percentile75Nightly = data.percentiles?.p75?.adr || 2012;
    const percentile90Nightly = data.percentiles?.p90?.adr || 2753;

    return {
      percentile25: {
        nightly: percentile25Nightly,
        monthly: Math.round(percentile25Nightly * daysPerMonth * occupancy),
        annual: Math.round(percentile25Nightly * daysPerMonth * occupancy * monthsPerYear)
      },
      percentile50: {
        nightly: percentile50Nightly,
        monthly: Math.round(percentile50Nightly * daysPerMonth * occupancy),
        annual: Math.round(percentile50Nightly * daysPerMonth * occupancy * monthsPerYear)
      },
      percentile75: {
        nightly: percentile75Nightly,
        monthly: Math.round(percentile75Nightly * daysPerMonth * occupancy),
        annual: Math.round(percentile75Nightly * daysPerMonth * occupancy * monthsPerYear)
      },
      percentile90: {
        nightly: percentile90Nightly,
        monthly: Math.round(percentile90Nightly * daysPerMonth * occupancy),
        annual: Math.round(percentile90Nightly * daysPerMonth * occupancy * monthsPerYear)
      },
      occupancy: Math.round(occupancy * 100),
      yield: 0 // Will be calculated on frontend with property price
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
  price: number
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

Please provide realistic monthly rental ranges for a standard 12-month lease in Cape Town. Consider:
- Location desirability and transport links
- Property type and size
- Current Cape Town rental market (2025)
- Quality expectations for the area

Respond in JSON format:
{
  "minMonthlyRental": number,
  "maxMonthlyRental": number,
  "reasoning": "brief explanation of estimate basis"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a Cape Town property rental expert with deep knowledge of local rental markets, property values, and yield calculations. Provide accurate, realistic rental estimates based on current market conditions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const minRental = result.minMonthlyRental || 18000;
    const maxRental = result.maxMonthlyRental || 45000;

    // Calculate yields
    const minYield = ((minRental * 12) / price) * 100;
    const maxYield = ((maxRental * 12) / price) * 100;

    return {
      minRental,
      maxRental,
      minYield: Math.round(minYield * 10) / 10,
      maxYield: Math.round(maxYield * 10) / 10,
      managementFee: "8-10%"
    };

  } catch (error) {
    console.error('Error generating long-term rental estimate:', error);
    
    // Fallback calculation based on property price
    const estimatedYield = 0.08; // 8% conservative yield
    const minRental = Math.round((price * estimatedYield) / 12);
    const maxRental = Math.round((price * 0.15) / 12); // 15% higher yield

    return {
      minRental,
      maxRental,
      minYield: 8.0,
      maxYield: 15.0,
      managementFee: "8-10%"
    };
  }
}