
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getRentalRate(address: string, propertySize: number, bedrooms: number, condition: string): Promise<number> {
  try {
    // First API call - rental market expert perspective
    const response1 = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are a rental market expert in South Africa. Return ONLY a number representing the monthly rental amount in Rand. No text, just the number. Example: '15000'"
        },
        {
          role: "user",
          content: `What would be the current market rental rate for a ${propertySize}m² ${bedrooms} bedroom property in ${condition} condition located at ${address}? Return only the numeric amount.`
        }
      ]
    });

    // Second API call - property manager perspective
    const response2 = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: "You are a property manager in South Africa. Return ONLY a number representing the achievable monthly rental in Rand. No text, just the number. Example: '15000'"
        },
        {
          role: "user",
          content: `What monthly rental could we achieve for a ${propertySize}m² ${bedrooms} bedroom property in ${condition} condition at ${address}? Return only the numeric amount.`
        }
      ]
    });

    const content1 = response1.choices[0]?.message?.content || '';
    const content2 = response2.choices[0]?.message?.content || '';

    console.log('OpenAI Rental Response 1:', content1);
    console.log('OpenAI Rental Response 2:', content2);

    // Parse rates and handle edge cases
    let rate1 = parseInt(content1.replace(/[^0-9]/g, '')) || 0;
    let rate2 = parseInt(content2.replace(/[^0-9]/g, '')) || 0;

    // If one rate is 0, use the other rate
    if (rate1 === 0 && rate2 > 0) return rate2;
    if (rate2 === 0 && rate1 > 0) return rate1;

    // If both rates are valid, take the average
    if (rate1 > 0 && rate2 > 0) {
      const finalRate = Math.round((rate1 + rate2) / 2);

      // Validate final rate is within reasonable range for SA rental market
      if (finalRate > 0 && finalRate <= 200000) {
        console.log('Final rental rate:', finalRate);
        return finalRate;
      }
    }

    throw new Error('Could not determine a valid rental rate');
  } catch (error) {
    console.error('Error in getRentalRate:', error);
    throw error;
  }
}
