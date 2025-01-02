import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, TrendingUp, TrendingDown, Star, ExternalLink, LineChart } from "lucide-react";

interface SuburbAnalysis {
  sentiment: {
    score: number;
    summary: string;
  };
  news: Array<{
    title: string;
    summary: string;
    relevance: number;
    sentiment: number;
    source?: string;
  }>;
  trends: {
    positive: string[];
    negative: string[];
  };
  overallScore: number;
  categoryScores: Array<{
    category: string;
    score: number;
    confidence: number;
  }>;
  confidenceLevel: number;
  dataPoints: number;
}

export default function MarketIntelligencePage() {
  const [suburb, setSuburb] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SuburbAnalysis | null>(null);
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
    setAnalysis(null);

    try {
      setAnalysisProgress(prev => [...prev, "Initiating suburb analysis..."]);

      const response = await fetch("/api/market-intelligence/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ suburb: suburb.trim() }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to analyze suburb');
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to complete the analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalysis();
  };

  return (
    <div className="h-full p-4 space-y-4">
      <h1 className="text-3xl font-bold">Market Intelligence</h1>

      <Card>
        <CardHeader>
          <CardTitle>Suburb Analysis</CardTitle>
          <CardDescription>Analyze market sentiment and trends for any suburb</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <Input
              placeholder="Enter suburb name (e.g., Sea Point, Cape Town)"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
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
          </form>
        </CardContent>
      </Card>

      {isAnalyzing && (
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

      {analysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Overall Sentiment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-6 w-6 text-yellow-500" />
                <span className="text-2xl font-bold">{analysis.overallScore.toFixed(1)}/10</span>
                <span className="text-sm text-muted-foreground ml-2">
                  Confidence: {(analysis.confidenceLevel * 100).toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  Based on {analysis.dataPoints} data points
                </span>
              </div>
              <p className="text-muted-foreground">{analysis.sentiment.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Category Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.categoryScores.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">Score: {category.score.toFixed(1)}/10</span>
                        <span className="text-sm text-muted-foreground">
                          Confidence: {(category.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(category.score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Positive Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {analysis.trends.positive.map((trend, index) => (
                    <li key={index} className="text-sm">{trend}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Areas of Concern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  {analysis.trends.negative.map((trend, index) => (
                    <li key={index} className="text-sm">{trend}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent News & Developments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.news.map((item, index) => (
                  <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{item.title}</h3>
                      {item.source && (
                        <a
                          href={item.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="text-xs">Source</span>
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.summary}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Relevance: {item.relevance}/10
                      </span>
                      <span className={item.sentiment > 0 ? "text-green-500" : "text-red-500"}>
                        Impact: {item.sentiment > 0 ? "Positive" : "Negative"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}