
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, MessageSquare, X } from "lucide-react";

// Define props interface to receive property data
interface DealScoreAdvisorProps {
  purchasePrice: number;
  marketPrice: number;
  priceDiff: number;
  rentalYield?: number;
  condition: string;
  dealScore: number;
}

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

/**
 * DealScoreAdvisor component provides an AI-powered chat interface
 * for getting insights about property deals
 */
export function DealScoreAdvisor({
  purchasePrice,
  marketPrice,
  priceDiff,
  rentalYield,
  condition,
  dealScore
}: DealScoreAdvisorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'assistant', 
      content: "Hello! I'm your Deal Score Advisor. Ask me anything about this property deal." 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to the bottom of the chat when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // Create context data about the property deal for the AI
      const dealContext = {
        purchasePrice,
        marketPrice,
        priceDiff,
        rentalYield,
        condition,
        dealScore,
        priceStatus: priceDiff <= -5 ? "below market" : priceDiff <= 5 ? "at market" : "above market"
      };

      // Send the question along with the deal context to the API
      const response = await fetch('/api/deal-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          dealContext: dealContext,
        }),
      });

      // Get response data even if not OK to capture error messages
      const data = await response.json();

      if (!response.ok) {
        // Check if we have a specific error message from the server
        const errorMessage = data.error || data.details || 'Failed to get AI response';
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Add AI response to chat
      setMessages(prev => [...prev, { type: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error details:', error);
      // Provide a more helpful error message
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: "Sorry, I encountered an error processing your request. This might be because the AI service is currently unavailable or the OpenAI API key needs to be configured. Please try again later or contact support if the issue persists." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Floating chat button */}
      <Button
        className="fixed bottom-6 right-6 rounded-full p-4 shadow-lg z-50 bg-primary hover:bg-primary/90"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </Button>

      {/* Chat window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 max-h-[500px] shadow-xl z-50 flex flex-col">
          <div className="bg-primary text-white p-3 flex justify-between items-center rounded-t-lg">
            <h3 className="font-semibold">Deal Score Advisor</h3>
            <Button variant="ghost" size="sm" className="p-1 h-auto text-white hover:bg-primary/80" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </Button>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-3 max-h-[320px]">
            {messages.map((message, i) => (
              <div 
                key={i} 
                className={`mb-3 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-muted rounded-tl-none'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input form */}
          <form onSubmit={handleSubmit} className="p-3 border-t">
            <div className="flex">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this property deal..."
                className="flex-1 mr-2"
                disabled={isLoading}
              />
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
