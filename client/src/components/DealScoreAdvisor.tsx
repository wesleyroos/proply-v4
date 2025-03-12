
import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Loader2, Sparkles, Send, ArrowLeft } from "lucide-react";
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

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

// Define sample questions tailored for real estate agents advising clients
const SAMPLE_QUESTIONS = [
  "How should I position this property to potential buyers?",
  "What negotiation points can I use for my buyer client?",
  "What property improvements would offer the best ROI for my seller?",
  "How does this price compare to similar properties in the area?",
  "What financing options should I recommend to my client?"
];

/**
 * DealScoreAdvisor - AI-powered chatbot that provides personalized advice based on deal assessment
 * 
 * This component renders a chat interface that allows real estate agents to ask questions about their
 * property investment analysis and receive AI-generated responses to assist their clients.
 * The UI toggles between an input form and results view for a cleaner interface.
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
  const [isOpen, setIsOpen] = useState(false); // Changed to false by default
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'results'>('form');
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
  }, [messages, viewMode]);

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
    
    // Switch to results view when a question is submitted
    setViewMode('results');
    setShowSuggestions(false);

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

  const handleSampleQuestionClick = (question: string) => {
    setQuery(question);
    if (hasAccess) {
      // Focus on the input
      document.getElementById('query-input')?.focus();
    }
  };

  // Toggle back to form view
  const handleBackToForm = () => {
    setViewMode('form');
    setShowSuggestions(true);
  };

  // If not open, show the floating chat button
  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary flex items-center justify-center"
      >
        <MessageSquare className="h-6 w-6" />
        {/* Add back the online indicator */}
        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
      </Button>
    );
  }

  return (
    <>
      <Card className="fixed bottom-6 right-6 w-96 shadow-lg border z-50 flex flex-col bg-background" style={{ maxHeight: '80vh' }}>
        {/* Chat Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Deal Score Advisor</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat Description */}
        <div className="px-4 py-2 bg-muted/30 text-sm text-muted-foreground">
          Ask me anything about the deal score analysis or for advice on improving your investment strategy.
        </div>

        {/* Chat Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'form' ? (
            /* Form View - Show sample questions */
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              {/* Suggestions Section */}
              {showSuggestions && (
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <p className="text-sm text-muted-foreground mb-3">Try asking about:</p>
                  <div className="space-y-2">
                    {SAMPLE_QUESTIONS.map((question, index) => (
                      <div
                        key={index}
                        onClick={() => handleSampleQuestionClick(question)}
                        className="p-3 bg-muted/50 rounded-lg text-sm cursor-pointer hover:bg-muted transition-colors"
                      >
                        {question}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results View - Show chat messages */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Back Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-2 mt-2 w-fit flex items-center gap-1" 
                onClick={handleBackToForm}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              {/* Chat Messages - Scrollable */}
              <div className="flex-1 p-4 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${
                      message.type === 'user' ? 'text-right' : ''
                    }`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg max-w-[85%] ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-center items-center p-3">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input Form - Always at the bottom */}
          <form onSubmit={handleSubmit} className="p-4 border-t mt-auto">
            <div className="flex gap-2">
              <Input
                id="query-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1"
                disabled={isLoading || accessLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!query.trim() || isLoading || accessLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)}
        feature="AI Deal Advisor"
      />
    </>
  );
}
