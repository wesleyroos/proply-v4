import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, MessageSquare, Info, X } from "lucide-react";
import { getRentalAdvice, RentalAnalysisContext } from "@/services/openai";
import ReactMarkdown from "react-markdown";

interface RentalAdvisorProps {
  analysisData: RentalAnalysisContext;
}

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

const SAMPLE_QUESTIONS = [
  "How do I explain the profitability difference to my owner?",
  "What if my owner is concerned about occupancy rates?",
  "How can I address owner concerns about property wear and tear?",
  "What data points should I highlight to build owner trust?",
  "How do I justify my management fee with this comparison?"
];

export function RentalAdvisor({ analysisData }: RentalAdvisorProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message when chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        type: 'assistant',
        content: `Hello! I'm your Airbnb Manager Advisor. I can help you communicate effectively with property owners about the rental comparison data and address their concerns. My goal is to help you build trust and retain your owners. How can I assist you today?`
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

  const handleSampleQuestionClick = (question: string) => {
    setQuery(question);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full p-4 bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 shadow-lg"
        aria-label="Open Rental Advisor"
      >
        <MessageSquare className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 bg-white shadow-lg border border-gray-200 flex flex-col z-50" style={{ maxHeight: "600px" }}>
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#1BA3FF]" />
            <h3 className="text-lg font-semibold text-gray-900">Rental Strategy Advisor</h3>
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
              <ReactMarkdown className="text-sm whitespace-pre-wrap markdown-content">
                {message.content}
              </ReactMarkdown>
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
            placeholder="Ask about the rental comparison..."
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
  );
}