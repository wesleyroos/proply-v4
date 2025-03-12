
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

// Define message interface for chat history
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
      // Create context object similar to RentalAdvisor
      const context = {
        address: "This property",
        purchasePrice,
        marketPrice,
        priceDiff,
        rentalYield: rentalYield || 0,
        condition,
        dealScore
      };

      // Send request to rental-advice API endpoint (the one that works)
      const response = await fetch('/api/rental-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          userQuery: userMessage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Add AI response to chat
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: data.advice || "I'm sorry, I couldn't generate advice at this moment."
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: "Sorry, I encountered an error. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full p-3 w-12 h-12"
        variant="default"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat Modal */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 w-96 max-w-[calc(100vw-2rem)] shadow-xl flex flex-col border z-50">
          {/* Chat Header */}
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-medium">Deal Score Advisor</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full" 
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 max-h-96 space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t flex">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this property deal..."
              className="flex-1 mr-2"
              disabled={isLoading}
            />
            <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}
