import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealAssessment } from "@/components/DealAssessment";
import { DealScoreAdvisor } from "@/components/DealScoreAdvisor";
import { useToast } from "@/hooks/use-toast";

export default function PublicDealScorePage() {
  const { toast } = useToast();
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [propertyCondition, setPropertyCondition] = useState<string>("good");
  const [isCalculating, setIsCalculating] = useState(false);
  const [dealScore, setDealScore] = useState<{
    purchasePrice: number;
    marketPrice: number;
    priceDiff: number;
    rentalData: {
      shortTerm: { yield: number; monthly: number; yearly: number };
      longTerm: { yield: number; monthly: number; yearly: number };
      isShortTermRecommended: boolean;
    };
    propertyCondition: string;
    areaRate: number;
    propertyRate: number;
    finalScore: number;
  } | null>(null);

  const calculateDealScore = async () => {
    if (!purchasePrice) {
      toast({
        title: "Missing Information",
        description: "Please enter a purchase price",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      // This is demo data - in production this would call an API
      const marketPrice = purchasePrice * 1.1; // 10% above purchase price for demo
      const areaRate = 25000; // Demo rate per m²
      const propertySize = purchasePrice / areaRate;
      const propertyRate = purchasePrice / propertySize;
      const priceDiff = ((purchasePrice - marketPrice) / marketPrice) * 100;

      const shortTermYield = 12; // Demo yield
      const longTermYield = 5; // Demo yield

      const shortTermMonthly = (purchasePrice * shortTermYield) / 100 / 12;
      const longTermMonthly = (purchasePrice * longTermYield) / 100 / 12;

      setDealScore({
        purchasePrice,
        marketPrice,
        priceDiff,
        rentalData: {
          shortTerm: {
            yield: shortTermYield,
            monthly: shortTermMonthly,
            yearly: shortTermMonthly * 12,
          },
          longTerm: {
            yield: longTermYield,
            monthly: longTermMonthly,
            yearly: longTermMonthly * 12,
          },
          isShortTermRecommended: shortTermYield > longTermYield * 2,
        },
        propertyCondition,
        areaRate,
        propertyRate,
        finalScore: Math.min(100, Math.max(0, 75 - (priceDiff / 2))), // Demo score calculation
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate deal score. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Property Deal Score Calculator</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Calculate Deal Score</CardTitle>
              <CardDescription>
                Enter property details to get an instant deal score analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Purchase Price</label>
                  <Input
                    type="number"
                    value={purchasePrice || ''}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    placeholder="Enter purchase price"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Property Condition</label>
                  <Select
                    value={propertyCondition}
                    onValueChange={setPropertyCondition}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={calculateDealScore}
                  disabled={isCalculating}
                  className="w-full"
                >
                  {isCalculating ? "Calculating..." : "Calculate Deal Score"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {dealScore && (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <DealAssessment {...dealScore} />
                </CardContent>
              </Card>
              
              <div className="relative">
                <DealScoreAdvisor {...dealScore} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
