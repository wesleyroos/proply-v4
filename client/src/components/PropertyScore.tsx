import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Scale, TrendingUp, Wallet, Timer, AlertTriangle, Home } from "lucide-react";

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
      weight: "25%",
      score: activeScores.priceVsMarket,
      description: "Compares purchase price to AvgRatePerM2 and market trends",
      icon: <Scale className="h-5 w-5 text-blue-500" />,
    },
    {
      name: "Rental Yield",
      weight: "25%",
      score: activeScores.rentalYield,
      description: "Gross yield + Net cash flow vs. market average",
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
    },
    {
      name: "Affordability",
      weight: "15%",
      score: activeScores.affordability,
      description: "Loan affordability vs. expected rental income",
      icon: <Wallet className="h-5 w-5 text-purple-500" />,
    },
    {
      name: "Liquidity",
      weight: "15%",
      score: activeScores.liquidity,
      description: "Popularity of area, lease cycle gap, and resale potential",
      icon: <Timer className="h-5 w-5 text-orange-500" />,
    },
    {
      name: "Risk Factors",
      weight: "10%",
      score: activeScores.riskFactors,
      description: "Operating expenses, management fees, and escalation risks",
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    },
    {
      name: "Amenities & Condition",
      weight: "10%",
      score: activeScores.amenities,
      description: "Bedrooms, bathrooms, parking, and qualitative factors",
      icon: <Home className="h-5 w-5 text-indigo-500" />,
    },
  ];

  // Calculate overall score
  const overallScore = Math.round(
    categories.reduce((acc, category) => {
      const weight = parseInt(category.weight) / 100;
      return acc + category.score * weight;
    }, 0)
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>Property Score Assessment</div>
          <div className="text-2xl font-bold text-primary">
            {overallScore}%
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {category.icon}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {category.name}
                      <span className="text-sm text-muted-foreground">
                        (Weight: {category.weight})
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.description}
                    </div>
                  </div>
                </div>
                <div className="font-semibold">{category.score}%</div>
              </div>
              <Progress value={category.score} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}