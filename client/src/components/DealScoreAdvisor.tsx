import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, MessageSquare, Info, X, Lock } from "lucide-react";
import { useProAccess } from "@/hooks/use-pro-access";
import { UpgradeModal } from "@/components/UpgradeModal";

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

const SAMPLE_QUESTIONS = [
  "What makes this a good investment?",
  "What are the key risk factors?",
  "How does the yield compare to market averages?",
  "What are the main value-add opportunities?",
  "How can I improve the deal score?"
];

export function DealScoreAdvisor() {
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
        content: `Hello! I'm your Deal Score Advisor. I can help you understand the investment potential of this property and provide insights on how to improve your deal score. How can I assist you today?`
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

    // For now, just echo back a placeholder response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: "I understand you're asking about the deal score. Once connected to the AI, I'll provide specific insights about this property investment."
      }]);
      setIsLoading(false);
    }, 1000);
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
            <Lock className="h-5 w-5 text-[#1BA3FF]" />
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
        <Lock className="h-12 w-12 text-[#1BA3FF] mb-2" />
        <h3 className="text-xl font-semibold">Pro Feature</h3>
        <p className="text-gray-600">
          The Deal Score Advisor is available exclusively to Pro plan subscribers.
        </p>
        <Button className="bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 mt-2" onClick={() => setShowUpgradeModal(true)}>
          Upgrade to Pro
        </Button>
      </div>
    </Card>
  );

  // If still checking access status, show nothing
  if (accessLoading) {
    return null;
  }

  // If not open, show the button only
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full p-6 bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 shadow-lg flex items-center justify-center"
        aria-label="Open Deal Score Advisor"
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

        {showSuggestions && messages.length === 1 && (
          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              <Info className="h-3 w-3" /> Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleQuestionClick(question)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
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
              placeholder="Ask about the deal score analysis..."
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

interface DealScoreAdvisorProps {
  purchasePrice: number;
  marketPrice: number;
  priceDiff: number;
  rentalYield?: number;
  condition: string;
  dealScore: number;
}

// Define sample questions for the AI chatbot
const SAMPLE_QUESTIONS2 = [
  "How should I negotiate based on this deal score?",
  "What improvements could increase the property value?",
  "How does this deal compare to typical investments?",
  "What are the main risks with this property?",
  "How can I improve the rental yield?"
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
export function DealScoreAdvisor2({ 
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
        content: `Hello! I'm your Deal Score Advisor. I can help you understand the investment potential of this property and provide insights on how to improve your deal score. How can I assist you today?`
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

  // Handle suggestion click
  const handleSuggestionClick = (question: string) => {
    setQuery(question);
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-4 rounded-full shadow-lg flex items-center justify-center"
      >
        <MessageSquare className="h-5 w-5 mr-2" />
        Deal Advisor
      </Button>
    );
  }

  return (
    <>
      <Card className="mt-8 overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            <h3 className="font-semibold">Deal Score Advisor</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-[300px] overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Show suggestions if no messages from user yet */}
        {showSuggestions && messages.length === 1 && (
          <div className="p-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS2.map((question, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSuggestionClick(question)}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t bg-white">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about the deal score analysis..."
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