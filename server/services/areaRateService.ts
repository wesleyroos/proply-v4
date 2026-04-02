import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'not-configured' });

// No function signature needed - we'll just use the implementation directly

// Helper function to extract number from text with better parsing
function extractNumber(text: string): number {
  if (!text) return 0;

  // Remove currency symbols and common words
  const cleaned = text.replace(/[R$€£]/g, '')
                     .replace(/per\s+square\s+meter/gi, '')
                     .replace(/per\s+m2/gi, '')
                     .replace(/approximately/gi, '')
                     .replace(/about/gi, '');

  // Find numbers in the text (including decimals)
  const matches = cleaned.match(/\d+(?:,\d+)*(?:\.\d+)?/g);
  if (!matches) return 0;

  // Parse the first number found, handling comma-separated thousands
  const parsedNumber = parseFloat(matches[0].replace(/,/g, ''));
  return isNaN(parsedNumber) ? 0 : parsedNumber;
}

// Function to generate detailed luxury context based on rating
function getAreaRateLuxuryContext(rating: number = 3): string {
  // Default to middle rating if no rating provided
  rating = rating || 3;
  
  // Validate rating is between 1-5
  rating = Math.max(1, Math.min(5, rating));
  
  switch(rating) {
    case 5:
      return ` This is an ultra-premium luxury property rated 5/5. It features exceptional architectural design, the highest quality finishes, state-of-the-art systems, premium imported materials, and exclusive amenities. Such properties command the absolute top prices in their respective areas, typically 30-50% above standard market rates.`;
    case 4:
      return ` This is a high-end luxury property rated 4/5. It offers premium finishes, high-quality fixtures, superior construction, and desirable amenities. Properties at this level are positioned in the upper tier of the market, commanding prices significantly above average.`;
    case 3:
      return ` This is a standard quality property rated 3/5 for luxury. It features typical contemporary finishes and amenities expected for properties in this area, with good construction quality and some desirable features, priced at the market average.`;
    case 2:
      return ` This is a basic property rated 2/5 for luxury. It has functional but modest finishes, limited amenities, and meets minimum market standards. Such properties typically sell at 10-20% below the area average.`;
    case 1:
      return ` This is a very basic property rated 1/5 for luxury. It features outdated finishes, minimal to no amenities, and may require significant improvements to meet market standards. Such properties typically sell at 20-30% below the area average.`;
    default:
      return ` This is a standard property with typical finishes for its area.`;
  }
}

export async function getAreaRate(address: string, propertyType: string = 'apartment', luxuryRating?: number) {
  try {
    console.log(`Fetching area rate for ${propertyType} property at ${address}${luxuryRating ? ` with luxury rating: ${luxuryRating}` : ''}`);
    
    // Determine if we're dealing with an apartment or house
    const isApartment = propertyType === 'apartment';
    const rateType = isApartment ? 'living area (internal space)' : 'erf size (land area)';
    
    // Determine if this is a luxury property (rating 4-5) for the prompts that still need this flag
    const isLuxury = luxuryRating ? luxuryRating >= 4 : false;
    
    // Get luxury context based on rating
    const luxuryContext = luxuryRating ? getAreaRateLuxuryContext(luxuryRating) : '';
    
    // Customize our prompts based on property type and luxury status
    const systemPrompt = isApartment 
      ? `You are a property valuation expert in South Africa specializing in high-end properties. Your task is to return ONLY a number representing the average rate per square meter (R/m²) for APARTMENT UNITS based on internal living space.${luxuryContext} Do not provide disclaimers or explanations. Example response format: '35000'`
      : `You are a property valuation expert in South Africa specializing in high-end properties. Your task is to return ONLY a number representing the average rate per square meter (R/m²) for HOUSES based on total ERF SIZE (land area).${luxuryContext} Do not provide disclaimers or explanations. Example response format: '15000'`;
      
    const userPrompt = isApartment
      ? `What is the current average rate per square meter (internal living space) for apartments/flats in ${address}? Consider the property's luxury level in your valuation. For reference: Cape Town CBD rates range R30,000-R35,000/m² for standard apartments and up to R60,000/m² for luxury units. Return only the numeric rate.`
      : `What is the current average rate per square meter based on erf size (land area) for houses in ${address}? Consider the property's luxury level in your valuation. For reference: Houses in suburban Cape Town might range R10,000-R25,000/m² for land, with luxury properties commanding significantly higher rates. Return only the numeric rate.`;
    
    // First API call with more specific prompt
    const response1 = await openai.chat.completions.create({
      model: "gpt-5.1", // gpt-5.1: latest flagship model
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    // Second API call with different context but still property-type aware
    const response2 = await openai.chat.completions.create({
      model: "gpt-5.1", // gpt-5.1: latest flagship model
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You are a real estate data analyst specializing in ${isLuxury ? 'luxury and ' : ''}high-value properties. Return ONLY a numeric value for the rate per square meter (R/m²) for ${isLuxury ? 'luxury ' : ''}${propertyType} properties based on ${rateType}. ${luxuryContext}Use the format: '35000'. No text, just the number.`
        },
        {
          role: "user",
          content: `What is the average rate per square meter for ${isLuxury ? 'luxury ' : ''}${propertyType} properties in ${address} based on ${rateType}? ${isLuxury ? 'Consider premium market positioning and exclusive amenities. ' : ''}Return only the number.`
        }
      ]
    });

    // Extract and validate rates
    const content1 = response1.choices[0]?.message?.content || '';
    const content2 = response2.choices[0]?.message?.content || '';

    console.log('OpenAI Response 1:', content1);
    console.log('OpenAI Response 2:', content2);

    // Parse rates and handle edge cases
    let rate1 = extractNumber(content1);
    let rate2 = extractNumber(content2);

    // If one rate is 0, use the other rate
    if (rate1 === 0 && rate2 > 0) return rate2;
    if (rate2 === 0 && rate1 > 0) return rate1;

    // If both rates are valid, take the average
    if (rate1 > 0 && rate2 > 0) {
      const finalRate = Math.round((rate1 + rate2) / 2);

      // Validate final rate is within reasonable range for SA property market
      if (finalRate > 0 && finalRate <= 150000) {
        console.log('Final area rate:', finalRate);
        return finalRate;
      }
    }

    // If we get here, we couldn't get a valid rate
    throw new Error('Could not determine a valid area rate');

  } catch (error) {
    console.error('Error in getAreaRate:', error);
    throw error;
  }
}

export async function getDealAnalysis(dealData: {
  address: string;
  areaRateResponses: string[];
  finalAreaRate: number;
  propertySize: number;
  propertyCondition: string;
  propertyType?: string;
  nightlyRate?: number;
  occupancyRate?: number;
  monthlyRental?: number;
  purchasePrice: number;
  dealScore: number;
  luxuryRating?: number; // Add luxury rating parameter
}) {
  try {
    console.log('Generating deal analysis for:', dealData.address);

    const response = await openai.chat.completions.create({
      model: "gpt-5.1", // gpt-5.1: latest flagship model
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are an expert property investment analyst in South Africa. Analyze property deals taking into account:
1. Location context and suburb dynamics
2. Property specifics (size, condition)
3. Market rates and valuations
4. Rental yield potential
5. Overall investment potential

Provide a structured analysis with clear sections. Be specific about the location and comparable properties. Use actual numbers in your analysis.`
        },
        {
          role: "user",
          content: `Please analyze this property deal with the following details:

Address: ${dealData.address}
Property Type: ${dealData.propertyType === 'apartment' ? 'Apartment/Flat' : 'House'}
Size: ${dealData.propertySize}m² ${dealData.propertyType === 'apartment' ? '(living space)' : '(erf size)'}
Condition: ${dealData.propertyCondition}
${dealData.luxuryRating ? `Luxury Rating: ${dealData.luxuryRating}/5` : ''}
Purchase Price: R${dealData.purchasePrice.toLocaleString()}
Area Rate Range: ${dealData.areaRateResponses.join(' to ')} per m²
Final Area Rate: R${dealData.finalAreaRate.toLocaleString()} per m² ${dealData.propertyType === 'apartment' ? 'for apartments' : 'for houses'}
${dealData.nightlyRate ? `Nightly Rate: R${dealData.nightlyRate}` : ''}
${dealData.occupancyRate ? `Expected Occupancy: ${dealData.occupancyRate}%` : ''}
${dealData.monthlyRental ? `Monthly Rental: R${dealData.monthlyRental}` : ''}
Deal Score: ${dealData.dealScore}%

Provide a detailed analysis of this investment opportunity, including:
1. Location Analysis (discuss the suburb and its investment potential)
2. Property Valuation (analyze the price vs market rate)
3. Yield Analysis (discuss both short-term and long-term rental potential)
4. Investment Recommendation (explain why the deal got this score)
`
        }
      ],
      stream: true
    });

    return response;

  } catch (error) {
    console.error('Error in getDealAnalysis:', error);
    throw error;
  }
}