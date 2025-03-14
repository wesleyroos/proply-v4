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
      messages: [{
        role: "system",
        content: `You are a property valuation expert. Analyze the location and provide the rate per square meter for the given address based on recent market data. 
                 Important: Your response must contain only a single number representing Rands per square meter. Do not include any text, currency symbols or units.
                 Example correct response: "15000"`
      }, {
        role: "user",
        content: `What is the current rate per square meter for ${propertyType} properties in ${address}?`
      }],
      temperature: 0.3 // Lower temperature for more consistent numerical responses
    });

    // Second API call for validation
    const response2 = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: `You are a real estate market analyst. Provide the average rate per square meter for the specified location.
                 Important: Your response must contain only a single number representing Rands per square meter. Do not include any text, currency symbols or units.
                 Example correct response: "15000"`
      }, {
        role: "user",
        content: `What is the average rate per square meter for ${propertyType} properties in ${address}?`
      }],
      temperature: 0.3
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

    // Calculate average and ensure it's reasonable
    const averageRate = Math.round((rate1 + rate2) / 2);

    // Basic validation - rates shouldn't be zero or absurdly high
    // Assuming max property value of R100,000 per square meter for high-end areas
    if (averageRate <= 0 || averageRate > 100000) {
      console.log('Rate validation failed:', { averageRate, rate1, rate2 });
      throw new Error('Area rate outside reasonable range');
    }

    console.log('Final area rate:', averageRate);
    return averageRate;
  } catch (error) {
    console.error('Error in getAreaRate:', error);
    throw error;
  }
}