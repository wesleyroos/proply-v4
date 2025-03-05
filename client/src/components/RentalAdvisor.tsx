import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { getRentalAdvice, RentalAnalysisContext } from "@/services/openai";

interface RentalAdvisorProps {
  analysisData: RentalAnalysisContext;
}

export function RentalAdvisor({ analysisData }: RentalAdvisorProps) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const advice = await getRentalAdvice(analysisData, query);
      setResponse(advice);
    } catch (error) {
      console.error("Error getting advice:", error);
      setResponse("Sorry, I encountered an error while analyzing the data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-white shadow-sm border border-gray-200">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Rental Strategy Advisor</h3>
        <p className="text-sm text-gray-600">
          Ask me anything about the rental comparison data or for advice on your rental strategy.
        </p>
        
        {response && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{response}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about the rental comparison..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
