import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, MessageSquare, X, Lock, Sparkles } from "lucide-react";
import { streamRentalAdvice, RentalAnalysisContext, ChatMessage } from "@/services/openai";
import { useProAccess } from "@/hooks/use-pro-access";
import { UpgradeModal } from "@/components/UpgradeModal";
import ReactMarkdown from "react-markdown";

interface RentalAdvisorProps {
  analysisData: RentalAnalysisContext;
}

interface DisplayMessage {
  type: 'user' | 'assistant';
  content: string;
}

// Contextual action prompts based on the data
function getActionPrompts(data: RentalAnalysisContext): Array<{ label: string; prompt: string; icon?: string }> {
  const advantage = data.advantage ?? (data.shortTermAfterFees - data.longTermAnnual);
  const strBetter = advantage > 0;

  const actions: Array<{ label: string; prompt: string }> = [];

  if (strBetter) {
    actions.push({
      label: "Draft owner pitch email",
      prompt: `Draft a professional email I can send to the property owner explaining why short-term rental is the better strategy for their property at ${data.address}. Include the specific revenue numbers and advantage. Keep it warm but data-driven.`
    });
  } else {
    actions.push({
      label: "Explain the numbers honestly",
      prompt: `The numbers show long-term rental performs better for this property. Help me frame this honestly to the owner — what are the non-financial benefits of STR that might still make it worth considering, or should I recommend long-term?`
    });
  }

  actions.push({
    label: `What if occupancy drops to ${Math.max(30, Math.round(data.breakEvenOccupancy))}%?`,
    prompt: `Run the numbers: what happens to profitability if occupancy drops to ${Math.max(30, Math.round(data.breakEvenOccupancy))}% (near break-even)? Compare that scenario to the long-term rental income. Give me the exact figures.`
  });

  if (data.marketData?.adr50) {
    const position = data.shortTermNightly > data.marketData.adr50 ? "above" : "below";
    actions.push({
      label: `Rate is ${position} market — analyse`,
      prompt: `My nightly rate of R${data.shortTermNightly} is ${position} the market median. Analyse whether I should adjust pricing — what would the revenue impact be if I moved to the 50th or 75th percentile rate? Show me the numbers.`
    });
  }

  actions.push({
    label: "Justify my management fee",
    prompt: `The owner might question my ${(data.managementFee * 100).toFixed(0)}% management fee. Help me build a compelling case with the specific numbers from this analysis — what value am I delivering vs what they'd earn self-managing?`
  });

  actions.push({
    label: "Seasonal strategy breakdown",
    prompt: `Break down the seasonal revenue patterns for this property. When are the peak and low months? What pricing and minimum-stay strategies should I use in each season to maximise revenue?`
  });

  return actions;
}

export function RentalAdvisor({ analysisData }: RentalAdvisorProps) {
  const { hasAccess, isLoading: accessLoading } = useProAccess();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const actionPrompts = getActionPrompts(analysisData);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const advantage = analysisData.advantage ?? (analysisData.shortTermAfterFees - analysisData.longTermAnnual);
      const strBetter = advantage > 0;
      setMessages([{
        type: 'assistant',
        content: `Hey! I've analysed the rental comparison for **${analysisData.address}**.\n\n${strBetter
          ? `Short-term rental comes out **R${Math.round(advantage).toLocaleString('en-ZA')} ahead** per year after fees. Your break-even occupancy is just **${analysisData.breakEvenOccupancy.toFixed(1)}%** — you have good margin.`
          : `Long-term rental actually performs better here by **R${Math.round(Math.abs(advantage)).toLocaleString('en-ZA')}/year**. But there may still be a case for STR depending on your goals.`
        }\n\nWhat would you like to dig into?`
      }]);
    }
  }, [isOpen, messages.length, analysisData]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Build conversation history for the API (excluding the welcome message)
  const getHistory = useCallback((): ChatMessage[] => {
    return messages
      .slice(1) // skip welcome message
      .map(m => ({ role: m.type as 'user' | 'assistant', content: m.content }));
  }, [messages]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setQuery("");
    setIsLoading(true);
    setShowActions(false);

    const history = getHistory();

    // Add empty assistant message to stream into
    setMessages(prev => [...prev, { type: 'assistant', content: '' }]);

    await streamRentalAdvice(
      analysisData,
      userMessage,
      history,
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
      () => { setIsLoading(false); },
      (error) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { type: 'assistant', content: error };
          return updated;
        });
        setIsLoading(false);
      }
    );
  }, [isLoading, analysisData, getHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(query);
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
      <Card className="fixed bottom-6 right-6 w-[420px] bg-white shadow-lg border border-gray-200 flex flex-col z-50" style={{ maxHeight: "650px" }}>
        <div className="p-4 border-b bg-gradient-to-r from-[#1BA3FF] to-[#0d8ae0] text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-base font-semibold">Rental Strategy Advisor</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} aria-label="Close" className="text-white hover:bg-white/20">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "420px" }}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${message.type === 'user' ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[85%]'}`}
            >
              <div
                className={`p-3 rounded-xl ${
                  message.type === 'user'
                    ? 'bg-[#1BA3FF] text-white rounded-br-sm'
                    : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm'
                }`}
              >
                {message.type === 'assistant' ? (
                  <div className="text-sm prose prose-sm prose-gray max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:text-gray-900 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mb-2 [&_h2]:mb-1.5 [&_h3]:mb-1 [&_table]:text-xs [&_th]:px-2 [&_td]:px-2">
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

        {/* Action prompts — shown after welcome message */}
        {showActions && messages.length === 1 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex flex-col gap-1.5">
              {actionPrompts.slice(0, 4).map((action, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(action.prompt)}
                  className="text-left text-xs bg-white hover:bg-blue-50 text-gray-700 hover:text-[#1BA3FF] px-3 py-2 rounded-lg border border-gray-100 hover:border-[#1BA3FF]/30 transition-all"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 border-t bg-white rounded-b-lg">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about this analysis..."
              className="flex-1 text-sm"
              disabled={isLoading}
              aria-label="Ask a question"
            />
            <Button
              type="submit"
              disabled={isLoading || !query.trim()}
              aria-label="Send message"
              size="sm"
              className="bg-[#1BA3FF] hover:bg-[#0d8ae0]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </>
  );
}
