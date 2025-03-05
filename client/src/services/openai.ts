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

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;

      if (retries > 0) {
        await wait(waitTime);
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await wait(delay);
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function getRentalAdvice(
  context: RentalAnalysisContext,
  userQuery: string
): Promise<string> {
  try {
    const response = await fetchWithRetry('/api/rental-advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ context, userQuery })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return "I'm currently handling too many requests. Please try again in a few minutes.";
      }
      throw new Error('Failed to get rental advice');
    }

    const data = await response.json();
    return data.advice || "I apologize, but I couldn't generate advice at this moment.";
  } catch (error) {
    console.error("Error getting rental advice:", error);
    return "I apologize, but I encountered an error while analyzing the data. Please try again.";
  }
}