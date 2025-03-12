import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, MessageSquare, Info, X, Lock } from "lucide-react";
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

const SAMPLE_QUESTIONS = [
  "What are the key strengths of this deal?",
  "How can I negotiate a better price?",
  "What risks should I be aware of?",
  "Is this a good investment opportunity?",
  "How does the price compare to market value?"
];

export function DealScoreAdvisor({
  purchasePrice,
  marketPrice,
  priceDiff,
  rentalYield,
  condition,
  dealScore
}: DealScoreAdvisorProps) {
  const { hasAccess, isLoading: accessLoading } = useProAccess();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message when chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        type: 'assistant',
        content: `Hello! I'm your Deal Score Advisor. I can help analyze this property deal and provide insights for your clients. Ask me anything about the deal's strengths, negotiation points, or potential concerns.`
      }]);
    }
  }, [isOpen, messages.length]);

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
    setShowSuggestions(false);

    try {
      const response = await fetch('/api/deal-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealDetails: {
            purchasePrice,
            marketPrice,
            priceDiff,
            dealScore,
            condition,
            rentalYield
          },
          question: userMessage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: data.response || "I'm sorry, I couldn't generate advice at this moment."
      }]);
    } catch (error) {
      console.error('Error in DealScoreAdvisor:', error);
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: "Sorry, I encountered an error processing your request. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQuestionClick = (question: string) => {
    setQuery(question);
  };

  // Helper to render pro-only upgrade prompt
  const renderProUpgradePrompt = () => (
    <Card className="fixed bottom-6 right-6 w-96 bg-white shadow-lg border border-gray-200 flex flex-col z-50" style={{ maxHeight: "600px" }}>
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
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
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <Lock className="h-12 w-12 text-primary mb-2" />
        <h3 className="text-xl font-semibold">Pro Feature</h3>
        <p className="text-gray-600">
          The Deal Score Advisor is available exclusively to Pro plan subscribers.
        </p>
        <Button 
          className="bg-primary hover:bg-primary/90 mt-2" 
          onClick={() => setShowUpgradeModal(true)}
        >
          Upgrade to Pro
        </Button>
      </div>
    </Card>
  );

  // If still checking access status, show nothing
  if (accessLoading) {
    return null;
  }

  // If not open, show only the button
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full p-6 bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center"
        aria-label="Open Deal Advisor"
        size="icon"
      >
        <MessageSquare className="h-8 w-8 text-white" />
        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
      </Button>
    );
  }

  // If no pro access, show upgrade prompt
  if (!hasAccess) {
    return (
      <>
        {renderProUpgradePrompt()}
        <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      </>
    );
  }

  // Regular chatbox for pro users
  return (
    <>
      <Card className="fixed bottom-6 right-6 w-96 bg-white shadow-lg border border-gray-200 flex flex-col z-50" style={{ maxHeight: "600px" }}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
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
            Ask me anything about this property deal and I'll help you analyze it.
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
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showSuggestions && messages.length === 1 && (
          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Info className="h-3 w-3" /> Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleQuestionClick(question)}
                  className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded-full transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about this property deal..."
              className="flex-1"
              disabled={isLoading}
              aria-label="Ask a question"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !query.trim()}
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </>
  );
}