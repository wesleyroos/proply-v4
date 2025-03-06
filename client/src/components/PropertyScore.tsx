import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, TrendingUp, Wallet, Timer, AlertTriangle, Home } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Progress } from "@/components/ui/progress";

interface PropertyScoreProps {
  scores?: {
    priceVsMarket: number;
    rentalYield: number;
    affordability: number;
    liquidity: number;
    riskFactors: number;
    amenities: number;
  };
}

export function PropertyScore({ scores }: PropertyScoreProps) {
  // Default static scores for now
  const defaultScores = {
    priceVsMarket: 85,
    rentalYield: 75,
    affordability: 90,
    liquidity: 70,
    riskFactors: 80,
    amenities: 95,
  };

  const activeScores = scores || defaultScores;

  const categories = [
    {
      name: "Price vs. Market",
      weight: 25,
      score: activeScores.priceVsMarket,
      description: "Compares purchase price to AvgRatePerM2 and market trends",
      icon: <Scale className="h-5 w-5 text-blue-500" />,
    },
    {
      name: "Rental Yield",
      weight: 25,
      score: activeScores.rentalYield,
      description: "Gross yield + Net cash flow vs. market average",
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
    },
    {
      name: "Affordability",
      weight: 15,
      score: activeScores.affordability,
      description: "Loan affordability vs. expected rental income",
      icon: <Wallet className="h-5 w-5 text-purple-500" />,
    },
    {
      name: "Liquidity",
      weight: 15,
      score: activeScores.liquidity,
      description: "Popularity of area, lease cycle gap, and resale potential",
      icon: <Timer className="h-5 w-5 text-orange-500" />,
    },
    {
      name: "Risk Factors",
      weight: 10,
      score: activeScores.riskFactors,
      description: "Operating expenses, management fees, and escalation risks",
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    },
    {
      name: "Amenities",
      weight: 10,
      score: activeScores.amenities,
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
    fullMark: 100,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="space-y-1">
            <div>Property Score Assessment</div>
            <div className="text-sm text-muted-foreground">
              Analysis based on 6 key factors
            </div>
          </div>
          <div className="text-4xl font-bold bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
            {overallScore}%
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.5}
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
                  <div className="text-sm font-medium mt-2">
                    Score: {category.score}%
                  </div>
                  <Progress value={category.score} className="h-2 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}