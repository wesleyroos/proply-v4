import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useProAccess } from "@/hooks/use-pro-access";
import { UpgradeModal } from "@/components/UpgradeModal";

interface AIAnalysisDialogProps {
  dealDetails: {
    purchasePrice: number;
    marketPrice: number;
    priceDiff: number;
    dealScore: number;
    condition: string;
    rentalYield?: number;
  };
}

export function AIAnalysisDialog({ dealDetails }: AIAnalysisDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasAccess } = useProAccess();

  const fetchAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/deal-advisor/deal-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: "", // Not needed for general analysis
          dealDetails,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI analysis');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let analysisText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(5));
              if (data.chunk) {
                analysisText += data.chunk;
                setAnalysis(analysisText);
              }
            } catch (e) {
              console.debug('Ignored parsing error for incomplete chunk');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setAnalysis("Sorry, there was an error generating the analysis. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = async () => {
    if (!hasAccess) {
      setShowUpgradeModal(true);
      return;
    }
    setIsOpen(true);
    if (!analysis) {
      await fetchAnalysis();
    }
  };

  return (
    <>
      <Button 
        onClick={handleOpen}
        variant="outline"
        className="w-full mt-4"
      >
        View AI Analysis
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Investment Analysis</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Generating analysis...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                {analysis.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />
    </>
  );
}
