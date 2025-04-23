import OpenAI from "openai";
import { ComparableProperty, ComparableSalesData } from "../types";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    // Create a system prompt for the OpenAI model
    const systemPrompt = `You are a real estate data analyst with expertise in South African property markets. Your task is to research and provide comparable property sales data based on the information provided.
    
The subject property is:
- Address: ${address}
- Size: ${propertySize} square meters
- Bedrooms: ${bedrooms}
- Type: ${propertyType || "Not specified"}
- Condition: ${propertyCondition || "Not specified"}
${luxuryRating ? `- Luxury Rating: ${luxuryRating}/5` : ""}

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
      luxuryRating ? ` The property has a luxury rating of ${luxuryRating}/5.` : ""
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

    if (typeof result.averageSalePrice !== "number" || isNaN(result.averageSalePrice)) {
      // Calculate the average ourselves if it's missing or invalid
      result.averageSalePrice = calculateAverageSalePrice(result.properties);
    }

    // Make sure the properties are properly formatted
    result.properties = result.properties.map(property => ({
      ...property,
      // Ensure consistent date format
      saleDate: formatSaleDate(property.saleDate)
    }));

    console.log(`Successfully found ${result.properties.length} comparable properties with average price R${result.averageSalePrice.toLocaleString()}`);
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
 * Calculate the average sale price from a list of properties
 */
function calculateAverageSalePrice(properties: ComparableProperty[]): number {
  if (!properties || properties.length === 0) {
    return 0;
  }
  
  const sum = properties.reduce((acc, property) => acc + property.salePrice, 0);
  return Math.round(sum / properties.length);
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