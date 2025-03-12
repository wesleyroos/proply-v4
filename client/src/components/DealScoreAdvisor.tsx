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
 * DealScoreAdvisor component provides an AI assistant specifically for property deal analysis
 * It uses the property data provided as props to offer context-aware insights on deal quality
 */
export function DealScoreAdvisor({
  purchasePrice,
  marketPrice,
  priceDiff,
  rentalYield,
  condition,
  dealScore
}: DealScoreAdvisorProps) {
  // State for controlling chat visibility
  const [isOpen, setIsOpen] = useState(false);
  // State for message history
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'assistant', 
      content: `Hi there! I'm your Deal Score advisor. Ask me anything about this property deal with a Deal Score of ${dealScore}/100.` 
    }
  ]);
  // State for current user input
  const [input, setInput] = useState('');
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  // Reference to the messages container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Toggle chat visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Handle user sending a message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // Send request to deal-advisor API endpoint
      const response = await fetch('/api/deal-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchasePrice,
          marketPrice,
          priceDiff,
          rentalYield,
          condition,
          dealScore,
          question: userMessage
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

  // Handle Enter key press to send message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating chat button */}
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 rounded-full p-4 shadow-lg z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat window */}
      {isOpen && (
        <Card className="fixed bottom-20 right-6 w-80 sm:w-96 max-h-[500px] shadow-xl z-50 flex flex-col">
          {/* Chat header */}
          <div className="flex justify-between items-center p-3 border-b">
            <h3 className="font-medium">Deal Score Advisor</h3>
            <Button variant="ghost" size="icon" onClick={toggleChat}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat messages */}
          <div className="p-3 overflow-y-auto flex-1 max-h-[350px]">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-3 ${
                  message.type === 'user' ? 'ml-auto mr-0' : 'ml-0 mr-auto'
                } max-w-[80%]`}
              >
                <div
                  className={`p-2 rounded-lg ${
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
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this property deal..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}