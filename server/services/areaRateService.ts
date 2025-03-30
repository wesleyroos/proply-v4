import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

export async function getAreaRate(address: string, propertyType: string = 'apartment') {
  try {
    console.log(`Fetching area rate for ${propertyType} property at ${address}`);
    
    // Determine if we're dealing with an apartment or house
    const isApartment = propertyType === 'apartment';
    const rateType = isApartment ? 'living area (internal space)' : 'erf size (land area)';
    
    // Customize our prompts based on property type
    const systemPrompt = isApartment 
      ? "You are a property valuation expert in South Africa. Your task is to return ONLY a number representing the average rate per square meter (R/m²) for APARTMENT UNITS based on internal living space. Do not provide disclaimers or explanations. Example response format: '35000'"
      : "You are a property valuation expert in South Africa. Your task is to return ONLY a number representing the average rate per square meter (R/m²) for HOUSES based on total ERF SIZE (land area). Do not provide disclaimers or explanations. Example response format: '15000'";
      
    const userPrompt = isApartment
      ? `What is the current average rate per square meter (internal living space) for apartments/flats in ${address}? For reference: Cape Town CBD rates range R30,000-R35,000/m². Return only the numeric rate.`
      : `What is the current average rate per square meter based on erf size (land area) for houses in ${address}? For reference: Houses in suburban Cape Town might range R10,000-R25,000/m² for land. Return only the numeric rate.`;
    
    // First API call with more specific prompt
    const response1 = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest model
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
      model: "gpt-4o", // Using the latest model
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `You are a real estate data analyst. Return ONLY a numeric value for the rate per square meter (R/m²) for ${propertyType} properties based on ${rateType}. Use the format: '35000'. No text, just the number.`
        },
        {
          role: "user",
          content: `What is the average rate per square meter for ${propertyType} properties in ${address} based on ${rateType}? Return only the number.`
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
}) {
  try {
    console.log('Generating deal analysis for:', dealData.address);

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest model
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