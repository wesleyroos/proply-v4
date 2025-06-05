import OpenAI from "openai";
// import { findComparableProperties } from "./property24Scraper"; // Temporarily disabled

// Import the interfaces we need
interface ComparableProperty {
  similarity: number | string; // Number (0-100) or "Similar"/"Comparable"
  address: string;
  salePrice: number;
  size: number | null;
  pricePerSqM: number | null;
  bedrooms: number;
  bathrooms?: number;
  parking?: number | null;
  propertyType?: string;
  imageUrl?: string | null;
  url?: string;
  saleDate: string | null;
}

interface ComparableSalesData {
  properties: ComparableProperty[];
  averageSalePrice: number;
}

// Initialize the OpenAI client for fallback
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Find comparable sales data for a property using a tiered approach:
 * 1. Try using Property24 scraper to get real property listings
 * 2. Fallback to OpenAI if scraper doesn't return enough results
 * 
 * @param address Full address of the subject property
 * @param propertySize Size of the subject property in square meters
 * @param bedrooms Number of bedrooms in the subject property
 * @param propertyType Type of property (apartment, house, etc.)
 * @param propertyCondition Condition of the property (excellent, good, fair, poor)
 * @param luxuryRating Optional luxury rating of the property (1-10)
 * @returns Object containing comparable properties and average sale price
 */
export async function getComparableSales(
  address: string,
  propertySize: number,
  bedrooms: number,
  propertyType?: string,
  propertyCondition?: string,
  luxuryRating?: number
): Promise<ComparableSalesData> {
  console.log(
    `Finding comparable sales for ${propertySize}m² ${bedrooms} bedroom ${
      propertyType || "property"
    } at ${address}`
  );

  try {
    // FIRST ATTEMPT: Try to get real property listings using Property24 scraper
    const scrapedProperties = await findComparableProperties(
      address,
      propertySize,
      bedrooms,
      propertyType || 'apartment',
      15
    );

    // If we found any properties, use them (we now have better filtering)
    if (scrapedProperties && scrapedProperties.length > 0) {
      console.log(`Using ${scrapedProperties.length} real property listings from Property24`);
      
      // First remove outliers and keep only the filtered properties
      const filteredProperties = removeOutliers(scrapedProperties);
      
      // If we have filtered out all properties, return to original set
      const propertiesToUse = filteredProperties.length > 0 ? filteredProperties : scrapedProperties;
      
      // Calculate average sale price (using the filtered properties)
      const averageSalePrice = calculateAverageSalePrice(propertiesToUse);
      
      // Format to the expected structure using the filtered/fallback properties
      const result: ComparableSalesData = {
        properties: propertiesToUse.map(p => ({
          similarity: typeof p.similarity === 'number' ? p.similarity : 'Similar',
          address: p.address,
          salePrice: p.salePrice,
          size: p.size,
          pricePerSqM: p.pricePerSqM,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          parking: p.parking,
          propertyType: p.propertyType,
          imageUrl: p.imageUrl,
          url: p.url,
          saleDate: p.saleDate ? formatSaleDate(new Date(p.saleDate).toISOString()) : 'Recent'
        })),
        averageSalePrice
      };
      
      return result;
    }
    
    // FALLBACK: Use OpenAI to generate comparable properties
    console.log("Not enough real property listings found, falling back to AI-generated data");
    
    // Create a system prompt for the OpenAI model
    const systemPrompt = `You are a real estate data analyst with expertise in South African property markets. Your task is to research and provide comparable property sales data based on the information provided.
    
The subject property is:
- Address: ${address}
- Size: ${propertySize} square meters
- Bedrooms: ${bedrooms}
- Type: ${propertyType || "Not specified"}
- Condition: ${propertyCondition || "Not specified"}
${luxuryRating ? `- Luxury Rating: ${luxuryRating}/10` : ""}

Based on your expert knowledge of recent property sales, generate a list of 15 comparable properties that have sold in the same area or similar neighborhoods within the last 12 months.

For each property, provide:
1. The full address
2. Sale price in ZAR (South African Rand)
3. Property size in square meters 
4. Price per square meter (calculated)
5. Number of bedrooms
6. Sale date (within the last 12 months)
7. Similarity rating: Either "Similar" for very close matches or "Comparable" for properties with some differences but still relevant

Format your response as a valid JSON object with the following structure:
{
  "properties": [
    {
      "similarity": "Similar" or "Comparable",
      "address": "Full property address",
      "salePrice": number (in ZAR),
      "size": number (in square meters),
      "pricePerSqM": number (calculated),
      "bedrooms": number,
      "saleDate": "DD/MM/YYYY format"
    },
    ...
  ],
  "averageSalePrice": number (calculated average of all properties)
}

Your response should be based on realistic market data for the area, with sale prices that reflect actual market conditions. Provide a range of properties, some very similar to the subject property and others that are comparable but with some differences.`;

    // Create the user prompt
    const userPrompt = `Find comparable property sales for ${propertySize}m² ${bedrooms}-bedroom ${
      propertyType || "property"
    } located at ${address}.${
      luxuryRating ? ` The property has a luxury rating of ${luxuryRating}/10.` : ""
    }${
      propertyCondition
        ? ` The property is in ${propertyCondition} condition.`
        : ""
    }`;

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more deterministic/factual responses
      max_tokens: 2000, // Allow plenty of tokens for the detailed response
      response_format: { type: "json_object" },
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const result = JSON.parse(content) as ComparableSalesData;

    // Validate the result structure
    if (!result.properties || !Array.isArray(result.properties) || result.properties.length === 0) {
      throw new Error("Invalid result structure: missing or empty properties array");
    }

    // Remove any outliers from the AI-generated data
    const filteredProperties = removeOutliers(result.properties);
    
    // If we have filtered out all properties, use original set
    const propertiesToUse = filteredProperties.length > 0 ? filteredProperties : result.properties;
    
    // Replace the properties with filtered ones
    result.properties = propertiesToUse;
    
    // Calculate a new average sale price after outlier removal
    result.averageSalePrice = calculateAverageSalePrice(propertiesToUse);
    
    // Make sure the properties are properly formatted
    result.properties = result.properties.map((property: ComparableProperty) => ({
      ...property,
      // Ensure consistent date format
      saleDate: formatSaleDate(property.saleDate?.toString() || '')
    }));

    console.log(`Successfully found ${result.properties.length} AI-generated comparable properties with average price R${result.averageSalePrice.toLocaleString()}`);
    return result;
  } catch (error) {
    console.error("Error finding comparable sales:", error);
    throw new Error(
      `Failed to find comparable sales data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Remove outliers from a list of properties based on size and price
 * Using reasonable size constraints for residential properties
 * and the Interquartile Range (IQR) method when enough data exists
 */
function removeOutliers(properties: ComparableProperty[]): ComparableProperty[] {
  if (!properties || properties.length === 0) {
    return properties;
  }
  
  console.log(`Removing outliers from ${properties.length} properties`);
  
  // First, apply direct constraints for obviously non-residential properties
  // Large properties (>450m²) are almost certainly commercial, not residential
  const sizeFilteredProperties = properties.filter(property => {
    // Skip properties with missing size data
    if (!property.size) return true;
    
    // Only filter out extremely large properties that are certainly commercial
    // Most residential properties are under 400m², but some luxury homes/penthouses can be large
    const isDefinitelyCommercialSize = property.size > 450;
    
    if (isDefinitelyCommercialSize) {
      console.log(`Filtering out definitely commercial property: ${property.address} (${property.size}m²)`);
      return false;
    }
    
    return true;
  });
  
  console.log(`After size constraint filtering: ${sizeFilteredProperties.length} properties remain`);
  
  // If we have enough properties, also apply statistical outlier detection
  if (sizeFilteredProperties.length >= 5) {
    // Remove properties with missing or zero sizes/prices for statistics
    const validProperties = sizeFilteredProperties.filter(p => 
      p.size && p.size > 0 && p.salePrice && p.salePrice > 0
    );
    
    if (validProperties.length >= 5) {
      // Sort arrays by size to calculate quartiles
      const sizes = [...validProperties].map(p => p.size as number).sort((a, b) => a - b);
      const n = sizes.length;
      
      // Calculate quartiles for sizes
      const q1IndexSize = Math.floor(n * 0.25);
      const q3IndexSize = Math.floor(n * 0.75);
      const q1Size = sizes[q1IndexSize];
      const q3Size = sizes[q3IndexSize];
      const iqrSize = q3Size - q1Size;
      
      // Define bounds for sizes (1.5 is the standard multiplier for outlier detection)
      const lowerBoundSize = q1Size - 1.5 * iqrSize;
      const upperBoundSize = q3Size + 1.5 * iqrSize;
      
      console.log(`Size outlier bounds: ${lowerBoundSize} - ${upperBoundSize}`);
      
      // Filter out size outliers
      const result = sizeFilteredProperties.filter(property => {
        // If size is missing, keep the property
        if (!property.size) return true;
        
        const isOutlier = property.size < lowerBoundSize || property.size > upperBoundSize;
        
        if (isOutlier) {
          console.log(`Found statistical size outlier: ${property.address} (${property.size}m²)`);
        }
        
        return !isOutlier;
      });
      
      console.log(`Removed ${sizeFilteredProperties.length - result.length} statistical outliers`);
      return result;
    }
  }
  
  // If we don't have enough properties for statistical methods, return the size-filtered list
  return sizeFilteredProperties;
}

/**
 * Calculate the average sale price from a list of properties
 * Optionally remove outliers before calculation
 */
function calculateAverageSalePrice(properties: ComparableProperty[], removeOutliersFirst: boolean = false): number {
  if (!properties || properties.length === 0) {
    return 0;
  }
  
  // Optionally remove outliers before calculation
  const propsToUse = removeOutliersFirst ? removeOutliers(properties) : properties;
  
  // Skip properties with zero or missing price
  const validProperties = propsToUse.filter(p => p.salePrice && p.salePrice > 0);
  
  if (validProperties.length === 0) {
    return 0;
  }
  
  const sum = validProperties.reduce((acc, property) => acc + property.salePrice, 0);
  return Math.round(sum / validProperties.length);
}

/**
 * Format a sale date string to ensure consistent format (DD/MM/YYYY)
 */
function formatSaleDate(dateStr: string): string {
  try {
    // If it's already in the DD/MM/YYYY format, return it
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try to parse the date string
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // If we can't parse it, return the original
      return dateStr;
    }
    
    // Format to DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    // If any error occurs, return the original
    return dateStr;
  }
}