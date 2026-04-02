
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'not-configured' });

// Function to generate luxury context based on rating
function getLuxuryContext(luxuryRating: number): string {
  // Validate the luxury rating
  const rating = Math.max(1, Math.min(5, luxuryRating));
  
  // Create a more granular description based on exact rating
  switch(rating) {
    case 5:
      return ` The property is ultra-luxury (rated 5/5) with exceptional finishes, state-of-the-art appliances, premium building amenities (like concierge, spa, etc.), and spectacular views. It would command the absolute highest rental rates in this market, potentially 40-60% above standard properties.`;
    case 4:
      return ` The property features high-end luxury finishes (rated 4/5) with quality brand appliances, excellent amenities, and superior quality throughout. It would attract discerning tenants willing to pay a significant premium, typically 20-40% above standard rates.`;
    case 3:
      return ` The property has standard modern finishes (rated 3/5) with good quality appliances and typical amenities expected in this area. It would achieve average market rental rates for the location.`;
    case 2:
      return ` The property has basic but functional finishes (rated 2/5), modest amenities, and meets minimum market standards. It would typically achieve rental rates 10-20% below the area average.`;
    case 1:
      return ` The property has very basic finishes (rated 1/5), outdated features, minimal to no amenities, and may require improvements to meet modern standards. It would typically achieve rental rates 20-30% below the area average.`;
    default:
      return ` The property has standard finishes and typical amenities for its area.`;
  }
}

// Define new interface to return rental rate range
export interface RentalRateRange {
  min: number;
  max: number;
  average: number;
}

export async function getRentalRate(address: string, propertySize: number, bedrooms: number, condition: string, luxuryRating?: number): Promise<RentalRateRange> {
  try {
    // Create luxury context based on the rating
    const luxuryContext = luxuryRating 
      ? getLuxuryContext(luxuryRating) 
      : '';
    
    // First API call - rental market expert perspective (lower range)
    const response1 = await openai.chat.completions.create({
      model: "gpt-5.1", // gpt-5.1: latest flagship model
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are a conservative rental market expert in South Africa focused on providing the lower end of market rental estimates. Return ONLY a number representing the minimum monthly rental amount in Rand that could be reasonably achieved. No text, just the number. Example: '15000'"
        },
        {
          role: "user",
          content: `What would be the minimum reasonable market rental rate for a ${propertySize}m² ${bedrooms} bedroom property in ${condition} condition located at ${address}?${luxuryContext} Return only the numeric amount.`
        }
      ]
    });

    // Second API call - property manager perspective (higher range)
    const response2 = await openai.chat.completions.create({
      model: "gpt-5.1", // gpt-5.1: latest flagship model
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are an optimistic property manager in South Africa focused on providing the higher end of market rental estimates. Return ONLY a number representing the maximum monthly rental amount in Rand that could be reasonably achieved. No text, just the number. Example: '18000'"
        },
        {
          role: "user",
          content: `What is the maximum monthly rental we could reasonably achieve for a ${propertySize}m² ${bedrooms} bedroom property in ${condition} condition at ${address}?${luxuryContext} Return only the numeric amount.`
        }
      ]
    });

    const content1 = response1.choices[0]?.message?.content || '';
    const content2 = response2.choices[0]?.message?.content || '';

    console.log('OpenAI Rental Response (Min):', content1);
    console.log('OpenAI Rental Response (Max):', content2);

    // Parse rates and handle edge cases
    let minRate = parseInt(content1.replace(/[^0-9]/g, '')) || 0;
    let maxRate = parseInt(content2.replace(/[^0-9]/g, '')) || 0;

    // Ensure min is actually less than max
    if (minRate > maxRate && maxRate > 0) {
      const temp = minRate;
      minRate = maxRate;
      maxRate = temp;
    }

    // If one rate is 0, use the other with a +/- 10% range
    if (minRate === 0 && maxRate > 0) {
      minRate = Math.round(maxRate * 0.9);
      // maxRate stays the same
    } else if (maxRate === 0 && minRate > 0) {
      maxRate = Math.round(minRate * 1.1);
      // minRate stays the same
    }

    // If both rates are valid, use them as the range
    if (minRate > 0 && maxRate > 0) {
      // Calculate the average
      const averageRate = Math.round((minRate + maxRate) / 2);

      // Validate rates are within reasonable range for SA rental market
      if (minRate > 0 && maxRate <= 200000) {
        console.log('Rental rate range:', { min: minRate, max: maxRate, average: averageRate });
        return { min: minRate, max: maxRate, average: averageRate };
      }
    }

    throw new Error('Could not determine a valid rental rate range');
  } catch (error) {
    console.error('Error in getRentalRate:', error);
    throw error;
  }
}

// Interface for suburb sentiment data
export interface SuburbSentimentResult {
  description: string;
  investmentPotential: string;
  developmentActivity: string;
  trend: string;
}

export async function getSuburbSentiment(suburb: string): Promise<SuburbSentimentResult> {
  console.log(`Getting suburb sentiment for: ${suburb}`);
  
  try {
    // Use the same OpenAI instance that works for rental rate
    const response = await openai.chat.completions.create({
      model: "gpt-5.1", // gpt-5.1: latest flagship model
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are a South African real estate expert with deep knowledge of local property markets and suburbs. Analyze the provided suburb and produce a structured report on its investment potential.`
        },
        {
          role: "user",
          content: `Please analyze the suburb of ${suburb} in South Africa and provide insights in JSON format with these fields:
          1. description: A 1-2 sentence description of the area
          2. investmentPotential: Rating as "HIGH", "MEDIUM", or "LOW" 
          3. developmentActivity: Rating as "ACTIVE", "MODERATE", or "MINIMAL"
          4. trend: "Trending Up", "Stable", or "Declining"
          
          Return only valid JSON without backticks or additional text.`
        }
      ]
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('OpenAI Suburb Response:', content);

    // Try to extract the JSON from the response
    try {
      // First, try to parse the entire response as JSON
      const result = JSON.parse(content);
      
      // Validate the expected fields
      if (
        typeof result.description === 'string' &&
        typeof result.investmentPotential === 'string' &&
        typeof result.developmentActivity === 'string' &&
        typeof result.trend === 'string'
      ) {
        console.log('Parsed suburb sentiment:', result);
        return result;
      } else {
        throw new Error('Response missing required fields');
      }
    } catch (jsonError) {
      console.error('Error parsing JSON from OpenAI response:', jsonError);
      
      // If we can't parse JSON directly, try to extract JSON using regex
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          if (
            typeof extractedJson.description === 'string' &&
            typeof extractedJson.investmentPotential === 'string' &&
            typeof extractedJson.developmentActivity === 'string' &&
            typeof extractedJson.trend === 'string'
          ) {
            console.log('Extracted suburb sentiment from text:', extractedJson);
            return extractedJson;
          }
        } catch (e) {
          console.error('Error parsing extracted JSON:', e);
        }
      }
      
      // Fallback to default values if JSON parsing fails
      return {
        description: `${suburb} is a residential area in South Africa with typical local amenities and services.`,
        investmentPotential: "MEDIUM",
        developmentActivity: "MODERATE",
        trend: "Stable"
      };
    }
  } catch (error) {
    console.error('Error in getSuburbSentiment:', error);
    throw error;
  }
}
