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

export async function getAreaRate(address: string, propertyType: string = 'residential') {
  try {
    console.log(`Fetching area rate for ${propertyType} property at ${address}`);

    // First API call with more specific prompt
    const response1 = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest model
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are a property valuation expert in South Africa. Your task is to return ONLY a number representing the average rate per square meter (R/m²) for properties. Do not provide disclaimers or explanations. If uncertain, estimate based on similar areas. Example response format: '35000'"
        },
        {
          role: "user",
          content: `What is the current average rate per square meter for residential properties in ${address}? For reference: Cape Town CBD rates range R30,000-R35,000/m². Return only the numeric rate.`
        }
      ]
    });

    // Second API call with different context
    const response2 = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest model
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are a real estate data analyst. Return ONLY a numeric value for the rate per square meter (R/m²). Use the format: '35000'. No text, just the number."
        },
        {
          role: "user",
          content: `What is the average residential rate per square meter in ${address}? CBD reference: R30,000-R35,000/m². Return only the number.`
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