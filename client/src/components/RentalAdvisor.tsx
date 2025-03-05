import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { getRentalAdvice, RentalAnalysisContext } from "@/services/openai";

interface RentalAdvisorProps {
  analysisData: RentalAnalysisContext;
}

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

export function RentalAdvisor({ analysisData }: RentalAdvisorProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setQuery("");
    setIsLoading(true);

    try {
      const advice = await getRentalAdvice(analysisData, userMessage);
      setMessages(prev => [...prev, { type: 'assistant', content: advice }]);
    } catch (error) {
      console.error("Error getting advice:", error);
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: "Sorry, I encountered an error while analyzing the data. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full p-4 bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 shadow-lg"
      >
        <MessageSquare className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 bg-white shadow-lg border border-gray-200 flex flex-col" style={{ maxHeight: "600px" }}>
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Rental Strategy Advisor</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>×</Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Ask me anything about the rental comparison data or for advice on your rental strategy.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "400px" }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${
              message.type === 'user'
                ? 'ml-auto max-w-[80%]'
                : 'mr-auto max-w-[80%]'
            }`}
          >
            <div
              className={`p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-[#1BA3FF] text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
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