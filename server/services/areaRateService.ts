import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to extract number from text with better parsing
function extractNumber(text: string): number {
  if (!text) return NaN;

  // Remove currency symbols and common words
  const cleaned = text.replace(/[R$€£]/g, '')
                     .replace(/per\s+square\s+meter/gi, '')
                     .replace(/per\s+m2/gi, '')
                     .replace(/approximately/gi, '')
                     .replace(/about/gi, '');

  // Find numbers in the text (including decimals)
  const matches = cleaned.match(/\d+(?:,\d+)*(?:\.\d+)?/g);
  if (!matches) return NaN;

  // Parse the first number found, handling comma-separated thousands
  const parsedNumber = parseFloat(matches[0].replace(/,/g, ''));
  return parsedNumber;
}

export async function getAreaRate(address: string, propertyType: string = 'residential') {
  try {
    console.log(`Fetching area rate for ${propertyType} property at ${address}`);

    // First API call for market rate
    const response1 = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are a residential property data expert in South Africa. Analyze recent sales data and return only a number representing the average rate per square meter (R/m²) for residential properties. Focus on actual transaction data, not listing prices."
        },
        {
          role: "user", 
          content: `What is the average residential rate per square meter (excluding offices, parking, and commercial space) for properties in ${address}? Recent sales in the Cape Town CBD area show rates around R30,000-R35,000/m².`
        }
      ]
    });

    // Second API call for validation
    const response2 = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are a global residential property valuation expert. Analyze current market rates per square meter for residential properties in the specified location. Focus exclusively on comparable residential properties (apartments/houses) in similar areas. Consider local market conditions, property standards, and recent sales data. Return only the numerical rate in local currency."
        },
        {
          role: "user",
          content: `What is the current residential rate per square meter for properties in ${address}? Important guidelines:
- Focus only on prime residential properties in this specific area
- Consider local market premiums for the exact location
- Base estimate on recent comparable residential sales only
- Exclude all commercial spaces, offices, and auxiliary areas
- For Cape Town CBD, rates typically range R30,000-R35,000/m²
Return only the numerical rate.`
        }
      ]
    });

    // Log raw responses for debugging
    console.log('OpenAI Response 1:', response1.choices[0]?.message?.content);
    console.log('OpenAI Response 2:', response2.choices[0]?.message?.content);

    // Extract rates with improved parsing and validation
    const content1 = response1.choices[0]?.message?.content;
    const content2 = response2.choices[0]?.message?.content;
    
    // If either response contains an error message, try to extract rate from the other response
    const rate1 = content1?.toLowerCase().includes('error') || content1?.toLowerCase().includes('access') ? 
      0 : extractNumber(content1);
    const rate2 = content2?.toLowerCase().includes('error') || content2?.toLowerCase().includes('access') ? 
      0 : extractNumber(content2);

    // Use the highest non-zero rate if one API call failed
    const validRate = Math.max(rate1 || 0, rate2 || 0);
    
    if (validRate === 0) {
      throw new Error('Unable to fetch valid area rate');
    }

    return validRate;

    if (!content1 || !content2) {
      throw new Error('Invalid response from OpenAI API');
    }

    const rate1 = extractNumber(content1);
    const rate2 = extractNumber(content2);

    console.log('Parsed rates:', { rate1, rate2 });

    if (isNaN(rate1) || isNaN(rate2)) {
      throw new Error('Invalid rate returned from API');
    }

    // Third API call for validation
    const response3 = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a real estate validation expert. Analyze two independent property valuations and local market conditions. Return only a final validated rate per square meter as a number in local currency. Consider property type, location quality, and market trends."
        },
        {
          role: "user",
          content: `Given two independent valuations of ${rate1} and ${rate2} per square meter for a ${propertyType} property at ${address}, validate and provide a final rate. Consider market conditions, property characteristics, and location factors. Return only the final number in local currency.`
        }
      ]
    });

    const content3 = response3.choices[0]?.message?.content;
    if (!content3) throw new Error('Invalid validation response');

    const validatedRate = extractNumber(content3);
    console.log('Validated rate:', validatedRate);

    // Calculate final rate using all three estimates
    const finalRate = Math.round((rate1 + rate2 + validatedRate) / 3);

    // Enhanced validation with wider acceptable range
    if (finalRate <= 0 || finalRate > 150000) {
      console.log('Rate validation failed:', { rate1, rate2, validatedRate, finalRate });
      throw new Error('Area rate outside reasonable range');
    }

    console.log('Final area rate:', finalRate);
    return finalRate;
  } catch (error) {
    console.error('Error in getAreaRate:', error);
    throw error;
  }
}