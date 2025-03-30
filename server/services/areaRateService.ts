import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

async function getAreaCharacterization(address: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "You are a South African real estate expert. Describe the affluence level and property market of the given area in 2-3 sentences only. Focus on whether it's high-end, mid-range, or budget, and any notable market factors."
        },
        {
          role: "user",
          content: `Describe the property market and affluence level of ${address} in South Africa.`
        }
      ]
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error getting area characterization:', error);
    return ''; // Return empty string if characterization fails
  }
}

async function getHouseErfRate(address: string, areaCharacterization: string) {
  try {
    // Current date for context
    const currentDate = new Date().toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'long'
    });
    
    // Get rate estimates using multiple different approaches
    const estimates = await Promise.all([
      // Approach 1: Reference-based prompting
      openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: "You are a property valuation expert in South Africa. Based on recent sales data, return ONLY a number representing the average rate per square meter (R/m²) for HOUSES based on total ERF SIZE (land area). Example response format: '15000'"
          },
          {
            role: "user",
            content: `What is the current rate per square meter for LAND (erf size) in ${address} as of ${currentDate}? This area is ${areaCharacterization}. For context: High-end areas like Camps Bay can reach R35,000-R45,000/m² for land, mid-range areas like Durbanville around R15,000-R25,000/m², and more affordable areas R5,000-R15,000/m². Return ONLY the numeric value.`
          }
        ]
      }),
      
      // Approach 2: Scenario-based cross-check
      openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: "You are a property developer assessing land value in South Africa. Return ONLY a number for the price per square meter of land."
          },
          {
            role: "user",
            content: `If a 500m² vacant plot in ${address} were for sale in ${currentDate}, what would be the realistic price per square meter? Consider local market conditions in this area: ${areaCharacterization}. Return only the R/m² value as a number.`
          }
        ]
      }),
      
      // Approach 3: Competitive analysis approach
      openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: "You are a property researcher in South Africa. Find the land value (R/m² for erf size) of properties recently sold in the given area. Return ONLY a number."
          },
          {
            role: "user",
            content: `Find the average land value (R/m² for erf size) of properties recently sold in ${address}. Focus specifically on the land component of house sales, not the building value. This area is ${areaCharacterization}. Return ONLY the final average R/m² as a number.`
          }
        ]
      })
    ]);
    
    // Extract rate values from responses
    const rateValues = estimates.map((response, index) => {
      const content = response.choices[0]?.message?.content || '';
      console.log(`House erf rate approach ${index + 1} response:`, content);
      return extractNumber(content);
    }).filter(rate => rate > 0); // Filter out invalid rates
    
    console.log('House erf rate values:', rateValues);
    
    if (rateValues.length === 0) {
      throw new Error('No valid house erf rates found');
    }
    
    // Improved averaging with outlier removal
    if (rateValues.length >= 3) {
      // Sort rates to find median
      const sortedRates = [...rateValues].sort((a, b) => a - b);
      const median = sortedRates[Math.floor(sortedRates.length / 2)];
      
      // Remove extreme outliers (more than 2x different from median)
      const filteredRates = rateValues.filter(rate => 
        rate >= median / 2 && rate <= median * 2
      );
      
      // Calculate weighted average giving more weight to values closer to median
      let weightedSum = 0;
      let totalWeight = 0;
      
      filteredRates.forEach(rate => {
        const distance = Math.abs(rate - median);
        const weight = 1 / (1 + distance / median); // Weight decreases with distance from median
        weightedSum += rate * weight;
        totalWeight += weight;
      });
      
      if (totalWeight > 0) {
        return Math.round(weightedSum / totalWeight);
      }
    }
    
    // Fallback to simple average if not enough values or weights
    const average = Math.round(rateValues.reduce((sum, rate) => sum + rate, 0) / rateValues.length);
    return average;
  } catch (error) {
    console.error('Error getting house erf rate:', error);
    throw error;
  }
}

async function validateRateAccuracy(address: string, initialRate: number, propertyType: string) {
  try {
    const rateType = propertyType === 'apartment' ? 'living space' : 'erf size (land)';
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a real estate auditor reviewing property valuations in South Africa. Your task is to verify if the provided rate per square meter is accurate and provide a correction if needed. Return ONLY a number representing the corrected rate."
        },
        {
          role: "user",
          content: `The estimated ${rateType} value for properties in ${address} is R${initialRate}/m². Based on current market conditions and recent sales in the area, is this value significantly undervalued, overvalued, or realistic? If it's accurate, return the same number. If it's significantly off, provide a more accurate estimate. Return ONLY the final number, either confirming the original or providing a correction.`
        }
      ]
    });
    
    const correctedRate = extractNumber(response.choices[0]?.message?.content || '');
    console.log(`Rate validation: Original ${initialRate}, Corrected ${correctedRate}`);
    
    // If correction is valid and significantly different (>15%), use it
    if (correctedRate > 0 && Math.abs(correctedRate - initialRate) / initialRate > 0.15) {
      return correctedRate;
    }
    
    // Otherwise stick with the original rate
    return initialRate;
  } catch (error) {
    console.error('Error validating rate:', error);
    return initialRate; // Return original rate if validation fails
  }
}

export async function getAreaRate(address: string, propertyType: string = 'apartment') {
  try {
    console.log(`Fetching area rate for ${propertyType} property at ${address}`);
    
    // For apartments, use the original approach with minor improvements
    if (propertyType === 'apartment') {
      const rateType = 'living area (internal space)';
      
      // Customize our prompts based on property type
      const systemPrompt = "You are a property valuation expert in South Africa. Your task is to return ONLY a number representing the average rate per square meter (R/m²) for APARTMENT UNITS based on internal living space. Do not provide disclaimers or explanations. Example response format: '35000'";
      
      const userPrompt = `What is the current average rate per square meter (internal living space) for apartments/flats in ${address}? For reference: Cape Town CBD rates range R30,000-R35,000/m², Sea Point R25,000-R30,000/m², and suburban apartments R15,000-R25,000/m². Return only the numeric rate.`;
      
      // First API call with more specific prompt
      const response1 = await openai.chat.completions.create({
        model: "gpt-4o",
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

      // Second API call with different context
      const response2 = await openai.chat.completions.create({
        model: "gpt-4o",
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

      console.log('Apartment Rate Response 1:', content1);
      console.log('Apartment Rate Response 2:', content2);

      // Parse rates and handle edge cases
      let rate1 = extractNumber(content1);
      let rate2 = extractNumber(content2);

      // If one rate is 0, use the other rate
      if (rate1 === 0 && rate2 > 0) rate1 = rate2;
      if (rate2 === 0 && rate1 > 0) rate2 = rate1;

      // If both rates are valid, take the average
      if (rate1 > 0 && rate2 > 0) {
        const initialRate = Math.round((rate1 + rate2) / 2);
        
        // Validate and potentially correct the rate
        const finalRate = await validateRateAccuracy(address, initialRate, propertyType);

        // Ensure rate is within reasonable range
        if (finalRate > 0 && finalRate <= 150000) {
          console.log('Final apartment rate:', finalRate);
          return finalRate;
        }
      }
      
      throw new Error('Could not determine a valid apartment rate');
    } 
    // For houses, use the enhanced multi-stage approach
    else {
      // Stage 1: Get area characterization
      const areaCharacterization = await getAreaCharacterization(address);
      console.log('Area characterization:', areaCharacterization);
      
      // Stage 2: Get house erf rate with multiple approaches
      const initialRate = await getHouseErfRate(address, areaCharacterization);
      console.log('Initial house erf rate:', initialRate);
      
      // Stage 3: Validate and potentially correct the rate
      const finalRate = await validateRateAccuracy(address, initialRate, propertyType);
      console.log('Final house erf rate:', finalRate);
      
      // Ensure rate is within reasonable range
      if (finalRate > 0 && finalRate <= 150000) {
        return finalRate;
      }
      
      throw new Error('Could not determine a valid house erf rate');
    }
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