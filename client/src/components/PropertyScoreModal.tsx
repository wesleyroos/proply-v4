import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, TrendingUp, Wallet, Timer, AlertTriangle, Home } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { Progress } from "@/components/ui/progress";

interface PropertyScoreModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  scores?: {
    priceVsMarket: number;
    rentalYield: number;
    affordability: number;
    liquidity: number;
    riskFactors: number;
    amenities: number;
  };
}

export function PropertyScoreModal({ isOpen, onOpenChange, scores }: PropertyScoreModalProps) {
  // Default static scores for now
  const defaultScores = {
    priceVsMarket: 85,
    rentalYield: 75,
    affordability: 90,
    liquidity: 70,
    riskFactors: 80,
    amenities: 95,
  };

  // Market benchmark scores
  const marketBenchmarks = {
    priceVsMarket: 70,
    rentalYield: 65,
    affordability: 75,
    liquidity: 80,
    riskFactors: 70,
    amenities: 85,
  };

  const activeScores = scores || defaultScores;

  const categories = [
    {
      name: "Price vs. Market",
      weight: 25,
      score: activeScores.priceVsMarket,
      benchmark: marketBenchmarks.priceVsMarket,
      description: "Compares purchase price to AvgRatePerM2 and market trends",
      icon: <Scale className="h-5 w-5 text-blue-500" />,
    },
    {
      name: "Rental Yield",
      weight: 25,
      score: activeScores.rentalYield,
      benchmark: marketBenchmarks.rentalYield,
      description: "Gross yield + Net cash flow vs. market average",
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
    },
    {
      name: "Affordability",
      weight: 15,
      score: activeScores.affordability,
      benchmark: marketBenchmarks.affordability,
      description: "Loan affordability vs. expected rental income",
      icon: <Wallet className="h-5 w-5 text-purple-500" />,
    },
    {
      name: "Liquidity",
      weight: 15,
      score: activeScores.liquidity,
      benchmark: marketBenchmarks.liquidity,
      description: "Popularity of area, lease cycle gap, and resale potential",
      icon: <Timer className="h-5 w-5 text-orange-500" />,
    },
    {
      name: "Risk Factors",
      weight: 10,
      score: activeScores.riskFactors,
      benchmark: marketBenchmarks.riskFactors,
      description: "Operating expenses, management fees, and escalation risks",
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    },
    {
      name: "Amenities",
      weight: 10,
      score: activeScores.amenities,
      benchmark: marketBenchmarks.amenities,
      description: "Bedrooms, bathrooms, parking, and qualitative factors",
      icon: <Home className="h-5 w-5 text-indigo-500" />,
    },
  ];

  // Calculate overall score
  const overallScore = Math.round(
    categories.reduce((acc, category) => {
      return acc + category.score * (category.weight / 100);
    }, 0)
  );

  // Format data for RadarChart
  const chartData = categories.map(category => ({
    subject: category.name,
    score: category.score,
    benchmark: category.benchmark,
    fullMark: 100,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Property Score Assessment</DialogTitle>
        </DialogHeader>
        <Card className="w-full bg-gradient-to-br from-background/50 to-background border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="space-y-1">
                <div>Analysis based on 6 key factors</div>
                <div className="text-sm text-muted-foreground">
                  Comprehensive property evaluation
                </div>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
                {overallScore}%
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[600px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    cx="50%" 
                    cy="50%" 
                    outerRadius="75%" 
                    data={chartData}
                    margin={{ top: 20, right: 30, bottom: 30, left: 30 }}
                  >
                    <PolarGrid 
                      gridType="polygon"
                      stroke="hsl(var(--border))"
                      strokeWidth={0.5}
                      strokeDasharray="4 4"
                    />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ 
                        fill: 'hsl(var(--foreground))',
                        fontSize: 16,
                        fontWeight: 600
                      }}
                      stroke="hsl(var(--border))"
                      strokeWidth={0.5}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]}
                      stroke="hsl(var(--border))"
                      strokeWidth={0.5}
                      tick={{ 
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 14
                      }}
                    />
                    <Radar
                      name="Market Average"
                      dataKey="benchmark"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      fill="none"
                      dot
                    />
                    <Radar
                      name="Property Score"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="none"
                      dot
                    />
                    <Legend 
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '16px',
                        fontWeight: 600
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.name} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    {category.icon}
                    <div className="w-full">
                      <div className="font-medium flex items-center gap-2">
                        {category.name}
                        <span className="text-sm text-muted-foreground">
                          (Weight: {category.weight}%)
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.description}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-lg font-medium">Score: {category.score}%</div>
                        <div className="text-lg text-muted-foreground">Market: {category.benchmark}%</div>
                      </div>
                      <Progress value={category.score} className="h-2 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
