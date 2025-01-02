import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, TrendingUp, TrendingDown, Star, ExternalLink, LineChart, InfoIcon, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";

interface Suburb {
  id: number;
  name: string;
  city: string;
  province: string;
}

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
  rawDataPoints?: Array<{
    source: string;
    type: string;
    content: string;
    date?: string;
  }>;
}

export default function MarketIntelligencePage() {
  const [search, setSearch] = useState("");
  const [selectedSuburb, setSelectedSuburb] = useState<Suburb | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<SuburbAnalysis | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<string[]>([]);
  const [showDataPoints, setShowDataPoints] = useState(false);
  const { toast } = useToast();

  const { data: suburbs } = useQuery<Suburb[]>({
    queryKey: ['/api/suburbs/search', search],
    enabled: search.length > 2,
    queryFn: async () => {
      const response = await fetch(`/api/suburbs/search?query=${encodeURIComponent(search)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch suburbs');
      }
      return response.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuburb) {
      toast({
        title: "Error",
        description: "Please select a suburb from the list",
        variant: "destructive",
      });
      return;
    }

    handleAnalysis();
  };

  const handleAnalysis = async () => {
    if (!selectedSuburb) {
      toast({
        title: "Error",
        description: "Please select a valid suburb from the list",
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
        body: JSON.stringify({ suburb: selectedSuburb.name }),
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

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Suburb Analysis</CardTitle>
          <CardDescription>Analyze market sentiment and trends for any suburb</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Command className="border rounded-lg">
              <CommandInput 
                placeholder="Type to search suburbs..." 
                value={search}
                onValueChange={setSearch}
              />
              {search.length > 2 && (
                <div className="border-t max-h-48 overflow-y-auto">
                  <CommandEmpty>No suburbs found.</CommandEmpty>
                  <CommandGroup>
                    {suburbs?.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.name}
                        onSelect={() => {
                          setSelectedSuburb(item);
                          setSearch(item.name);
                        }}
                      >
                        {item.name}, {item.city}
                        <span className="ml-2 text-sm text-muted-foreground">
                          {item.province}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              )}
            </Command>
            <Button
              type="submit"
              disabled={isAnalyzing || !selectedSuburb}
              className="w-full"
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
        <Card className="mt-4">
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
          <Card className="mt-4">
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
                <Dialog open={showDataPoints} onOpenChange={setShowDataPoints}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => setShowDataPoints(true)}
                  >
                    <InfoIcon className="h-4 w-4 mr-1" />
                    {analysis.dataPoints} Data Points
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Analysis Data Sources</DialogTitle>
                      <DialogDescription>
                        Data points used to generate this analysis
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {analysis.rawDataPoints?.map((point, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-muted/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{point.source}</span>
                            <span className="text-sm text-muted-foreground">{point.type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{point.content}</p>
                          {point.date && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Date: {new Date(point.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-muted-foreground">{analysis.sentiment.summary}</p>
            </CardContent>
          </Card>

          <Card className="mt-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

          <Card className="mt-4">
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