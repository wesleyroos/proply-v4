import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2 } from "lucide-react";

export default function MarketIntelligencePage() {
  const [suburb, setSuburb] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([]);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (!suburb.trim()) {
      toast({
        title: "Error",
        description: "Please enter a suburb name",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress([]);

    try {
      // Simulate progress for now (will be replaced with actual API calls)
      setAnalysisProgress(prev => [...prev, "Initiating suburb analysis..."]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnalysisProgress(prev => [...prev, "Searching for recent news and developments..."]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAnalysisProgress(prev => [...prev, "Analyzing market sentiment..."]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to complete the analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Market Intelligence</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Suburb Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter suburb name (e.g., Sea Point, Cape Town)"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAnalysis}
              disabled={isAnalyzing}
              className="min-w-[120px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysisProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysisProgress.map((progress, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
