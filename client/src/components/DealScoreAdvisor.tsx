import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Loader2, Sparkles, Send } from "lucide-react";
import { useProAccess } from "@/hooks/use-pro-access";
import { UpgradeModal } from "@/components/UpgradeModal";

interface DealScoreAdvisorProps {
  purchasePrice: number;
  marketPrice: number;
  priceDiff: number;
  rentalYield?: number;
  condition: string;
  dealScore: number;
}

// Define sample questions tailored for real estate agents advising clients
const SAMPLE_QUESTIONS = [
  "How should I position this property to potential buyers?",
  "What negotiation points can I use for my buyer client?",
  "What property improvements would offer the best ROI for my seller?",
  "How does this price compare to similar properties in the area?",
  "What financing options should I recommend to my client?"
];

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

/**
 * DealScoreAdvisor - AI-powered chatbot that provides personalized advice based on deal assessment
 * 
 * This component renders a chat interface that allows users to ask questions about their
 * property investment analysis and receive AI-generated responses.
 */
export function DealScoreAdvisor({ 
  purchasePrice, 
  marketPrice, 
  priceDiff, 
  rentalYield, 
  condition, 
  dealScore 
}: DealScoreAdvisorProps) {
  const { hasAccess, isLoading: accessLoading } = useProAccess();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message when chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        type: 'assistant',
        content: `Hello! I'm your Deal Score Advisor. I can help you advise your clients about this property based on its score of ${dealScore}/100. I can provide insights for both buyers and sellers, suggest negotiation points, and highlight key property features. How can I assist you today?`
      }]);
    }
  }, [isOpen, messages.length, dealScore]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!hasAccess) {
      setShowUpgradeModal(true);
      return;
    }

    // Add user message to chat
    const userMessage = query.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setQuery("");
    setIsLoading(true);

    try {
      // Make API call to deal advisor endpoint
      const response = await fetch('/api/deal-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Add AI response to chat
      setMessages(prev => [...prev, { type: 'assistant', content: data.response }]);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: "I'm sorry, I couldn't process your request at the moment. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuestion = (question: string) => {
    setQuery(question);
    handleSubmit(new Event('submit') as unknown as React.FormEvent);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
      </Button>
    );
  }

  // Regular chatbox for pro users
  return (
    <>
      <Card className="fixed bottom-6 right-6 w-96 bg-white shadow-lg border border-gray-200 flex flex-col z-50" style={{ maxHeight: "600px" }}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#1BA3FF]" />
              <h3 className="text-lg font-semibold text-gray-900">Deal Score Advisor</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Ask me anything about the deal score analysis or for advice on improving your investment strategy.
          </p>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-xl ${
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
              <div className="max-w-[80%] p-3 rounded-lg bg-muted">
                <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showSuggestions && messages.length === 1 && (
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-gray-700 mb-2">Try asking about:</p>
            <div className="flex flex-wrap gap-2 max-w-full">
              {SAMPLE_QUESTIONS.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 px-2 h-auto whitespace-normal text-left justify-start"
                  onClick={() => handleSampleQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about this property..."
              className="flex-grow"
              disabled={isLoading || !hasAccess}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={isLoading || !query.trim() || !hasAccess}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasAccess ? (
                <Send className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!hasAccess && (
            <div className="mt-2 text-center">
              <Button 
                variant="link" 
                size="sm"
                className="text-xs text-blue-600"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Upgrade to Pro to use the AI advisor
              </Button>
            </div>
          )}
        </form>
      </Card>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </>
  );
}