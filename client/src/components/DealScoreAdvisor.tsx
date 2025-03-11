
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
  const [isOpen, setIsOpen] = useState(true);
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

  if (!isOpen) {
    // Render the floating chat button if chat is closed
    return (
      <Button 
        onClick={() => setIsOpen(true)} 
        size="icon" 
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-primary"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <>
      <Card className="relative border rounded-lg overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b flex justify-between items-center bg-background">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary" />
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

        {viewMode === 'form' ? (
          // Form view - Input area and suggestions
          <div className="flex flex-col">
            {/* Welcome message */}
            <div className="p-4 bg-muted/20 rounded-lg m-4">
              <p className="text-sm">
                {messages[0]?.content}
              </p>
            </div>

            {/* Sample Questions */}
            {showSuggestions && (
              <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground mb-2">Try asking about:</p>
                <div className="space-y-2 max-w-full">
                  {SAMPLE_QUESTIONS.map((question, index) => (
                    <div 
                      key={index}
                      className="p-2 bg-background border rounded-lg text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSampleQuestionClick(question)}
                    >
                      {question}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Box */}
            <form onSubmit={handleSubmit} className="p-4 border-t mt-auto">
              <div className="flex gap-2">
                <Input
                  id="query-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about this property..."
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!query.trim() || isLoading || accessLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          // Results view - Chat messages
          <div className="flex flex-col h-[400px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, i) => (
                <div 
                  key={i}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/30'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted/30">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Back button and Input Box */}
            <div className="p-4 border-t mt-auto">
              <div className="flex items-center gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleBackToForm}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about this property..."
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!query.trim() || isLoading || accessLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </div>
        )}
      </Card>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        title="Get AI Deal Advisor"
        description="Upgrade to Pro to access the AI Deal Advisor and get personalized insights for your property investments."
        feature={
          <div className="flex items-center text-primary gap-2 font-medium">
            <Sparkles className="h-5 w-5" />
            AI-Powered Deal Analysis
          </div>
        }
      />
    </>
  );
}
