import { RentalAnalysisContext } from './context';

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
    const response = await fetch('/api/rental-advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ context, userQuery })
    });

    if (!response.ok) {
      throw new Error('Failed to get rental advice');
    }

    const data = await response.json();
    return data.advice || "I apologize, but I couldn't generate advice at this moment.";
  } catch (error) {
    console.error("Error getting rental advice:", error);
    return "I apologize, but I encountered an error while analyzing the data. Please try again.";
  }
}