/**
 * Shared AI Advisor chatbot component.
 * Used on Rent Compare, Property Analyzer, and Report Preview pages.
 * Takes a context object (serialised into system prompt server-side)
 * and a set of contextual action prompts.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, X, Sparkles, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface AiAdvisorAction {
  label: string;
  prompt: string;
}

export interface AiAdvisorProps {
  /** Unique key for the advisor type — used in the API route */
  advisorType: "rental" | "analyzer" | "report";
  /** Title shown in the header */
  title: string;
  /** Context object sent to the server as the system prompt basis */
  context: Record<string, any>;
  /** Contextual action buttons shown after the welcome message */
  actions: AiAdvisorAction[];
  /** Welcome message — shown as the first assistant message */
  welcomeMessage: string;
  /** Input placeholder */
  placeholder?: string;
  /** Accent colour for the header gradient */
  accentColor?: string;
}

interface DisplayMessage {
  type: "user" | "assistant";
  content: string;
}

export function AiAdvisor({
  advisorType,
  title,
  context,
  actions,
  welcomeMessage,
  placeholder = "Ask anything...",
  accentColor = "#1BA3FF",
}: AiAdvisorProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showActions, setShowActions] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ type: "assistant", content: welcomeMessage }]);
    }
  }, [messages.length, welcomeMessage]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getHistory = useCallback(() => {
    return messages.slice(1).map((m) => ({ role: m.type, content: m.content }));
  }, [messages]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      setMessages((prev) => [...prev, { type: "user", content: userMessage }]);
      setQuery("");
      setIsLoading(true);
      setShowActions(false);

      const history = getHistory();

      // Empty assistant bubble to stream into
      setMessages((prev) => [...prev, { type: "assistant", content: "" }]);

      try {
        const response = await fetch("/api/ai-advisor/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ advisorType, context, userQuery: userMessage, history }),
        });

        if (!response.ok) throw new Error("Request failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                setIsLoading(false);
                return;
              }
              if (data.error) {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { type: "assistant", content: data.error };
                  return updated;
                });
                setIsLoading(false);
                return;
              }
              if (data.content) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.type === "assistant") {
                    updated[updated.length - 1] = { ...last, content: last.content + data.content };
                  }
                  return updated;
                });
              }
            } catch {
              // skip
            }
          }
        }
      } catch {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { type: "assistant", content: "Something went wrong. Please try again." };
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, advisorType, context, getHistory]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(query);
  };

  const accentDark = accentColor === "#1BA3FF" ? "#0d8ae0" : accentColor;

  return (
    <>
      {isExpanded && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsExpanded(false)} />}

      <Card
        className={`fixed bg-white shadow-2xl border border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out ${
          isExpanded ? "inset-4 sm:inset-8 md:inset-12 lg:inset-16 rounded-2xl" : "bottom-6 right-6 w-[420px] rounded-lg"
        }`}
        style={isExpanded ? {} : { maxHeight: "650px" }}
      >
        {/* Header */}
        <div className="p-4 border-b text-white rounded-t-lg" style={{ background: `linear-gradient(to right, ${accentColor}, ${accentDark})` }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-base font-semibold">{title}</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-white hover:bg-white/20">
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="text-white hover:bg-white/20 hidden">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 ${isExpanded ? "px-8 md:px-16 lg:px-24" : ""}`} style={isExpanded ? {} : { maxHeight: "420px" }}>
          {messages.map((message, index) => (
            <div key={index} className={`mb-4 ${message.type === "user" ? "ml-auto" : "mr-auto"} ${isExpanded ? "max-w-[70%]" : "max-w-[85%]"}`}>
              <div
                className={`p-3 rounded-xl ${
                  message.type === "user" ? "bg-[#1BA3FF] text-white rounded-br-sm" : "bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm"
                }`}
                style={message.type === "user" ? { background: accentColor } : {}}
              >
                {message.type === "assistant" ? (
                  <div className="text-sm prose prose-sm prose-gray max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:text-gray-900 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mb-2 [&_h2]:mb-1.5 [&_h3]:mb-1 [&_table]:text-xs [&_th]:px-2 [&_td]:px-2">
                    <ReactMarkdown>{message.content || (isLoading && index === messages.length - 1 ? "..." : "")}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Action prompts */}
        {showActions && messages.length === 1 && actions.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex flex-col gap-1.5">
              {actions.slice(0, 4).map((action, index) => (
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

        {/* Input */}
        <div className={`p-3 border-t bg-white rounded-b-lg ${isExpanded ? "px-8 md:px-16 lg:px-24 py-4" : ""}`}>
          <form onSubmit={handleSubmit} className={`flex gap-2 ${isExpanded ? "max-w-3xl mx-auto" : ""}`}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className={`flex-1 ${isExpanded ? "text-base py-5" : "text-sm"}`}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !query.trim()} size={isExpanded ? "default" : "sm"} style={{ background: accentColor }}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </>
  );
}
