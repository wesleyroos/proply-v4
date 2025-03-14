
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAreaRate(address: string, propertyType: string) {
  try {
    // First API call for market rate
    const response1 = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are a property valuation expert. Analyze the location and provide only a numerical rate per square meter for the given address based on recent market data. Return only the number."
      }, {
        role: "user",
        content: `What is the current rate per square meter for ${propertyType} properties in ${address}?`
      }]
    });

    // Second API call for validation
    const response2 = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "system",
        content: "You are a real estate market analyst. Return only the numerical average rate per square meter for the specified location. Return only the number."
      }, {
        role: "user",
        content: `What is the average rate per square meter for ${propertyType} properties in ${address}?`
      }]
    });

    // Extract rates and calculate average
    const rate1 = parseFloat(response1.choices[0].message.content.replace(/[^\d.]/g, ''));
    const rate2 = parseFloat(response2.choices[0].message.content.replace(/[^\d.]/g, ''));
    
    if (isNaN(rate1) || isNaN(rate2)) {
      throw new Error('Invalid rate returned from API');
    }

    return Math.round((rate1 + rate2) / 2);
  } catch (error) {
    console.error('Error in getAreaRate:', error);
    throw error;
  }
}
