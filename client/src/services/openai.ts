import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });

export interface RentalAnalysisContext {
  longTermMonthly: number;
  shortTermMonthly: number;
  longTermAnnual: number;
  shortTermAnnual: number;
  shortTermAfterFees: number;
  breakEvenOccupancy: number;
  shortTermNightly: number;
  managementFee: number;
  annualOccupancy: number;
  address: string;
}

export async function getRentalAdvice(
  context: RentalAnalysisContext,
  userQuery: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a property investment advisor specializing in rental strategy analysis. You have access to detailed comparison data between long-term and short-term rental options for a property. Provide clear, actionable advice based on the data provided. Focus on ROI, risks, and market conditions. Use actual numbers from the data when relevant.

Current property context:
- Address: ${context.address}
- Long-term monthly revenue: R${context.longTermMonthly}
- Short-term monthly avg: R${context.shortTermMonthly}
- Long-term annual revenue: R${context.longTermAnnual}
- Short-term annual revenue: R${context.shortTermAnnual}
- Short-term after fees: R${context.shortTermAfterFees}
- Break-even occupancy: ${context.breakEvenOccupancy}%
- Short-term nightly rate: R${context.shortTermNightly}
- Management fee: ${context.managementFee * 100}%
- Annual occupancy: ${context.annualOccupancy}%`
        },
        {
          role: "user",
          content: userQuery
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || "I apologize, but I couldn't generate advice at this moment.";
  } catch (error) {
    console.error("Error getting rental advice:", error);
    return "I apologize, but I encountered an error while analyzing the data. Please try again.";
  }
}
