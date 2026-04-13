export interface RentalAnalysisContext {
  // Core inputs
  address: string;
  title?: string;
  bedrooms?: string;
  bathrooms?: string;
  longTermMonthly: number;
  shortTermNightly: number;
  managementFee: number;
  annualOccupancy: number;

  // Calculated outputs
  longTermAnnual: number;
  shortTermMonthly: number;
  shortTermAnnual: number;
  shortTermAfterFees: number;
  breakEvenOccupancy: number;

  // Enriched data (optional — passed when available)
  annualEscalation?: number;
  platformFeeRate?: number;
  platformFeeAmount?: number;
  managementFeeAmount?: number;
  advantage?: number; // shortTermAfterFees - longTermAnnual
  advantagePercent?: number;

  // Market data from PriceLabs (when available)
  marketData?: {
    adr25?: number;
    adr50?: number;
    adr75?: number;
    adr90?: number;
    avgOccupancy?: number;
    activeListings?: number;
    revpar?: number;
    demandScore?: number;
    seasonalityIndex?: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getRentalAdvice(
  context: RentalAnalysisContext,
  userQuery: string
): Promise<string> {
  try {
    const response = await fetch('/api/rental-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, userQuery })
    });

    if (!response.ok) throw new Error('Failed to get rental advice');

    const data = await response.json();
    return data.advice || "I apologize, but I couldn't generate advice at this moment.";
  } catch (error) {
    console.error("Error getting rental advice:", error);
    return "I apologize, but I encountered an error. Please try again.";
  }
}

export async function streamRentalAdvice(
  context: RentalAnalysisContext,
  userQuery: string,
  conversationHistory: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
): Promise<void> {
  try {
    const response = await fetch('/api/rental-advice/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context, userQuery, history: conversationHistory }),
    });

    if (!response.ok) throw new Error('Failed to get rental advice');

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.done) { onDone(); return; }
          if (data.error) { onError(data.error); return; }
          if (data.content) onChunk(data.content);
        } catch {
          // skip malformed lines
        }
      }
    }
    onDone();
  } catch (error) {
    console.error("Streaming error:", error);
    onError("I encountered an error. Please try again.");
  }
}
