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
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a global property valuation expert. For the given address, analyze local market data and provide ONLY a numerical rate per square meter in the local currency. Consider property type, location quality, and recent comparable sales. Return only the number, no currency symbols or text."
        },
        {
          role: "user",
          content: `What is the current rate per square meter for ${propertyType} properties at exactly this address: ${address}? Consider nearby sales, property condition, and local market trends. Return only the number in local currency.`
        }
      ]
    });

    // Second API call for validation
    const response2 = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a local real estate data analyst. Return ONLY the numerical average rate per square meter for the exact location specified, based on recent comparable sales data. Consider location-specific factors and local market conditions. Return only the number, no currency symbols or text."
        },
        {
          role: "user",
          content: `What is the current average rate per square meter for ${propertyType} properties at this exact location: ${address}? Focus on similar properties within 1km. Return only the number in local currency.`
        }
      ]
    });

    // Log raw responses for debugging
    console.log('OpenAI Response 1:', response1.choices[0]?.message?.content);
    console.log('OpenAI Response 2:', response2.choices[0]?.message?.content);

    // Extract rates with improved parsing
    const content1 = response1.choices[0]?.message?.content;
    const content2 = response2.choices[0]?.message?.content;

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
          content: "You are a real estate validation expert. Analyze property valuations considering condition, location, and market trends. Adjust rates based on property condition (excellent: +10%, good: +5%, fair: 0%, poor: -5%, needs-work: -10%). Return only the final validated rate per square meter as a number in local currency."
        },
        {
          role: "user",
          content: `Given two independent valuations of ${rate1} and ${rate2} per square meter for a ${propertyType} property at ${address} in ${propertyCondition} condition, validate and provide a final adjusted rate. Consider the property condition impact on value. Return only the final number in local currency.`
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