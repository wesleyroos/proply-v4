import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, MessageSquare, Info, X, Lock } from "lucide-react";
import { streamRentalAdvice, RentalAnalysisContext } from "@/services/openai";
import { useProAccess } from "@/hooks/use-pro-access";
import { UpgradeModal } from "@/components/UpgradeModal";
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
  const { hasAccess, isLoading: accessLoading } = useProAccess();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        type: 'assistant',
        content: `Hello! I'm your Airbnb Manager Advisor. I can help you communicate effectively with property owners about the rental comparison data and address their concerns. How can I assist you today?`
      }]);
    }
  }, [isOpen, messages.length]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = query.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setQuery("");
    setIsLoading(true);
    setShowSuggestions(false);

    // Add empty assistant message that will be streamed into
    setMessages(prev => [...prev, { type: 'assistant', content: '' }]);

    await streamRentalAdvice(
      analysisData,
      userMessage,
      // onChunk — append to the last message
      (text) => {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.type === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + text };
          }
          return updated;
        });
      },
      // onDone
      () => { setIsLoading(false); },
      // onError
      (error) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { type: 'assistant', content: error };
          return updated;
        });
        setIsLoading(false);
      }
    );
  };

  const handleSampleQuestionClick = (question: string) => {
    setQuery(question);
  };

  const renderProUpgradePrompt = () => (
    <Card className="fixed bottom-6 right-6 w-96 bg-white shadow-lg border border-gray-200 flex flex-col z-50" style={{ maxHeight: "600px" }}>
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#1BA3FF]" />
            <h3 className="text-lg font-semibold text-gray-900">Rental Strategy Advisor</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <Lock className="h-12 w-12 text-[#1BA3FF] mb-2" />
        <h3 className="text-xl font-semibold">Pro Feature</h3>
        <p className="text-gray-600">The Rental Strategy Advisor is available exclusively to Pro plan subscribers.</p>
        <Button className="bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 mt-2" onClick={() => setShowUpgradeModal(true)}>
          Upgrade to Pro
        </Button>
      </div>
    </Card>
  );

  if (accessLoading) return null;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full p-6 bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 shadow-lg flex items-center justify-center"
        aria-label="Open Rental Advisor"
        size="icon"
      >
        <MessageSquare className="h-8 w-8 text-white" />
        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
      </Button>
    );
  }

  if (!hasAccess) {
    return (
      <>
        {renderProUpgradePrompt()}
        <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      </>
    );
  }

  return (
    <>
      <Card className="fixed bottom-6 right-6 w-96 bg-white shadow-lg border border-gray-200 flex flex-col z-50" style={{ maxHeight: "600px" }}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#1BA3FF]" />
              <h3 className="text-lg font-semibold text-gray-900">Rental Strategy Advisor</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close">
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
              className={`mb-4 ${message.type === 'user' ? 'ml-auto max-w-[80%]' : 'mr-auto max-w-[80%]'}`}
            >
              <div
                className={`p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-[#1BA3FF] text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.type === 'assistant' ? (
                  <div className="text-sm prose prose-sm prose-gray max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:text-gray-900 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mb-2 [&_h2]:mb-1.5 [&_h3]:mb-1">
                    <ReactMarkdown>{message.content || (isLoading && index === messages.length - 1 ? '...' : '')}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
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
            <Button type="submit" disabled={isLoading || !query.trim()} aria-label="Send message">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </>
  );
}
