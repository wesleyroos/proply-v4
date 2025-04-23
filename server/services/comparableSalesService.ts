import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define interface for comparable property
export interface ComparableProperty {
  similarity: string; // "Similar" or "Comparable"
  address: string;
  salePrice: number;
  size: number;
  pricePerSqM: number;
  bedrooms: number;
  saleDate: string;
}

// Define interface for the response
export interface ComparableSalesData {
  properties: ComparableProperty[];
  averageSalePrice: number;
}

/**
 * Uses OpenAI to find comparable sales data for a property
 * @param address Full address of the subject property
 * @param propertySize Size of the subject property in square meters
 * @param bedrooms Number of bedrooms in the subject property
 * @param propertyType Type of property (apartment, house, etc.)
 * @param propertyCondition Condition of the property (excellent, good, fair, poor)
 * @param luxuryRating Optional luxury rating of the property (1-5)
 * @returns Object containing comparable properties and average sale price
 */
export async function getComparableSales(
  address: string,
  propertySize: number,
  bedrooms: number,
  propertyType: string = 'apartment',
  propertyCondition: string = 'good',
  luxuryRating?: number
): Promise<ComparableSalesData> {
  try {
    console.log(`Fetching comparable sales for ${propertyType} at ${address}`);
    
    // Extract suburb from address (everything after the first comma)
    const addressParts = address.split(',');
    const suburb = addressParts.length > 1 
      ? addressParts[1].trim() 
      : addressParts[0].trim();
    
    // Create request for comparable sales data
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      temperature: 0.1, // Low temperature for more consistent results
      messages: [
        {
          role: "system", 
          content: `You are a real estate data analyst specializing in property transactions in South Africa. 
Your task is to provide realistic, plausible recent comparable property sales data near ${suburb}.
The data MUST be realistic for the South African property market, with properly formatted addresses, 
reasonable sale prices and square meter rates. Base your estimates on typical property values in this area.

For a ${propertySize}m² ${bedrooms}-bedroom ${propertyType} in ${propertyCondition} condition${luxuryRating ? ` with a luxury rating of ${luxuryRating}/5` : ''},
find 15 comparable properties that have recently sold in the area.`
        },
        {
          role: "user",
          content: `Please provide 15 recent property sales near ${address} that are comparable to a ${propertySize}m² ${bedrooms}-bedroom ${propertyType}.
Format your response as a valid JSON array with these fields for each property:
- similarity: either "Similar" (for very close matches) or "Comparable" (for broader comparisons)
- address: a realistic complete street address in the same area (don't use the exact subject property address)
- salePrice: the sale price in Rand (no currency symbol, just the number)
- size: property size in square meters
- pricePerSqM: price per square meter (calculated as salePrice/size)
- bedrooms: number of bedrooms
- saleDate: sale date in DD/MM/YYYY format, within the last 12 months

Also include the average sale price of all properties as a separate field.
Return only the JSON object with no additional text.`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the JSON response
    const content = response.choices[0]?.message?.content || '';
    console.log('OpenAI Comparable Sales Response:', content);
    
    try {
      const result = JSON.parse(content);
      
      // Ensure the response has the expected structure
      if (Array.isArray(result.properties) && result.properties.length > 0 && typeof result.averageSalePrice === 'number') {
        // Validate each property has the required fields
        const validProperties = result.properties.map((prop: any) => ({
          similarity: prop.similarity || "Comparable",
          address: prop.address,
          salePrice: Number(prop.salePrice),
          size: Number(prop.size),
          pricePerSqM: Number(prop.pricePerSqM),
          bedrooms: Number(prop.bedrooms),
          saleDate: prop.saleDate
        }));
        
        return {
          properties: validProperties,
          averageSalePrice: Number(result.averageSalePrice)
        };
      } else {
        throw new Error('Response missing required structure');
      }
    } catch (jsonError) {
      console.error('Error parsing JSON from OpenAI response:', jsonError);
      throw new Error('Failed to parse comparable sales data');
    }
    
  } catch (error) {
    console.error('Error in getComparableSales:', error);
    throw error;
  }
}