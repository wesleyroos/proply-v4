import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useProAccess } from '@/hooks/use-pro-access';
import { X } from 'lucide-react';

interface DealScoreAdvisorProps {
  purchasePrice: number;
  marketPrice: number;
  priceDiff: number;
  rentalYield: number;
  condition: string;
  dealScore: number;
}

interface Message {
  type: 'user' | 'assistant';
  content: string;
}

/**
 * DealScoreAdvisor - Simplified AI-powered chatbot that provides personalized advice 
 * based on deal assessment data
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
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add welcome message when chat is first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        type: 'assistant',
        content: `Hello! I'm your Deal Score Advisor. I can help you advise your clients about this property based on its score of ${dealScore}/100. I can provide insights for both buyers and sellers, suggest negotiation points, and highlight key property features. How can I assist you today?`
      }]);
    }
  }, [isOpen, messages.length, dealScore]);

  // Auto-scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Check if the user has access to the feature
    if (!hasAccess && !accessLoading) {
      setShowUpgradeModal(true);
      return;
    }

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

  return (
    <div className="relative">
      {/* Floating button to open the chatbot */}
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <span className="hidden md:inline">Deal Score Advisor</span>
          <span className="inline md:hidden">Advisor</span>
        </Button>
      )}

      {/* Chatbot dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md md:max-w-xl" style={{ maxHeight: '80vh' }}>
          <div className="flex justify-between items-center">
            <DialogTitle>Deal Score Advisor</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              {/* Chat messages */}
              <div 
                ref={chatContainerRef}
                className="flex flex-col space-y-4 max-h-[50vh] overflow-y-auto pr-2"
                style={{ scrollbarWidth: 'thin' }}
              >
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg py-2 px-3 ${
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
                    <div className="max-w-[80%] rounded-lg py-2 px-3 bg-muted">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input form */}
              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <Input
                  id="query-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything about the deal score analysis..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Upgrade modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogTitle>Upgrade to Proply Pro</DialogTitle>
          <DialogDescription>
            This feature is only available to Pro subscribers. Upgrade now to access AI-powered deal insights.
          </DialogDescription>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
            <Button onClick={() => window.location.href = '/pricing'}>Upgrade Now</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}