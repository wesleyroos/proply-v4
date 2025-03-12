
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, SendIcon, X } from "lucide-react";

// Define message type for chat
interface Message {
  type: 'user' | 'assistant';
  content: string;
}

// Props interface for deal context
interface DealScoreAdvisorProps {
  purchasePrice: number;
  marketPrice: number;
  priceDiff: number;
  rentalYield: number;
  condition: string;
  dealScore: number;
}

/**
 * DealScoreAdvisor component - A floating AI assistant that provides
 * intelligent insights about the property deal based on the deal score data
 */
export function DealScoreAdvisor({ 
  purchasePrice, 
  marketPrice, 
  priceDiff, 
  rentalYield, 
  condition, 
  dealScore 
}: DealScoreAdvisorProps) {
  // State for chat UI
  const [isOpen, setIsOpen] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'assistant', 
      content: "Hello! I'm your Deal Score Advisor. Ask me anything about this property deal, or how to improve the investment." 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  // Handle sending a user message
  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return;

    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);
    
    // Store message and clear input
    const messageToSend = userMessage;
    setUserMessage('');

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
          question: messageToSend,
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

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-96 bg-background border rounded-lg shadow-lg flex flex-col z-50">
          {/* Chat header */}
          <div className="p-3 border-b flex items-center justify-between bg-primary/5">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 text-primary mr-2" />
              <h3 className="font-medium">Deal Score Advisor</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat messages */}
          <div 
            id="chat-messages"
            className="flex-1 overflow-y-auto p-3 space-y-4"
          >
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-3 py-2 
                    ${message.type === 'user' 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-muted'
                    }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted">
                  <div className="flex space-x-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="p-3 border-t">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex space-x-2"
            >
              <Input
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Ask about this property deal..."
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!userMessage.trim() || isLoading}
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
