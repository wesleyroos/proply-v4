import { Badge } from "@/components/ui/badge";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DealAssessmentProps {
  purchasePrice: number;
  marketPrice: number;
  priceDiff: number;
  rentalData: {
    shortTerm: {
      yield: number;
    };
    longTerm: {
      yield: number;
    };
    isShortTermRecommended: boolean;
  } | null;
  propertyCondition: string;
  areaRate: number;
  propertyRate: number;
}

/**
 * DealAssessment component displays a comprehensive deal score and key metrics
 * for property investment evaluation
 */
export function DealAssessment({
  purchasePrice,
  marketPrice,
  priceDiff,
  rentalData,
  propertyCondition,
  areaRate,
  propertyRate
}: DealAssessmentProps) {
  // Determine badge and color based on price difference
  const getBadgeInfo = () => {
    if (priceDiff <= -5) return { emoji: "🔥", text: "GREAT DEAL", color: "bg-green-500" };
    if (priceDiff <= 5) return { emoji: "✅", text: "FAIR PRICE", color: "bg-blue-500" };
    return { emoji: "⚠️", text: "OVERPRICED", color: "bg-amber-500" };
  };

  const badgeInfo = getBadgeInfo();
  const [isCalculationModalOpen, setIsCalculationModalOpen] = useState(false);

  // Deal Score calculation (with yield factors included)
  const calculateDealScore = () => {
    // Price Factor: 0-100 based on price difference
    let priceScore = 0;
    if (priceDiff <= -15) priceScore = 100; // Great deal
    else if (priceDiff <= -10) priceScore = 90;
    else if (priceDiff <= -5) priceScore = 80;
    else if (priceDiff <= 0) priceScore = 70;
    else if (priceDiff <= 5) priceScore = 60;
    else if (priceDiff <= 10) priceScore = 50;
    else if (priceDiff <= 15) priceScore = 40;
    else if (priceDiff <= 20) priceScore = 30;
    else priceScore = 20;

    // Condition Factor: 0-100
    const conditionScore = 
      propertyCondition === "excellent" ? 100 :
      propertyCondition === "good" ? 80 :
      propertyCondition === "fair" ? 60 :
      40; // poor

    // Area Rate vs Property Rate: 0-100
    let rateScore = 0;
    const rateDiff = ((propertyRate - areaRate) / areaRate) * 100;

    if (rateDiff <= -15) rateScore = 100;
    else if (rateDiff <= -10) rateScore = 90;
    else if (rateDiff <= -5) rateScore = 80;
    else if (rateDiff <= 0) rateScore = 70;
    else if (rateDiff <= 5) rateScore = 60;
    else if (rateDiff <= 10) rateScore = 50;
    else if (rateDiff <= 15) rateScore = 40;
    else rateScore = 30;

    // Yield Factor: 0-100 based on short-term and long-term yields
    let yieldScore = 0;

    // Only calculate if we have rental data
    if (rentalData) {
      // Short-term yield score (0-50, with 50 being excellent)
      let shortTermYieldScore = 0;
      const shortTermYield = rentalData.shortTerm.yield;

      if (shortTermYield >= 15) shortTermYieldScore = 50; // Excellent yield
      else if (shortTermYield >= 12) shortTermYieldScore = 40;
      else if (shortTermYield >= 10) shortTermYieldScore = 30;
      else if (shortTermYield >= 8) shortTermYieldScore = 20;
      else if (shortTermYield >= 6) shortTermYieldScore = 10;
      else shortTermYieldScore = 5;

      // Long-term yield score (0-50, with 50 being excellent)
      let longTermYieldScore = 0;
      const longTermYield = rentalData.longTerm.yield;

      if (longTermYield >= 8) longTermYieldScore = 50; // Excellent yield
      else if (longTermYield >= 7) longTermYieldScore = 40;
      else if (longTermYield >= 6) longTermYieldScore = 30;
      else if (longTermYield >= 5) longTermYieldScore = 20;
      else if (longTermYield >= 4) longTermYieldScore = 10;
      else longTermYieldScore = 5;

      // Combined yield score (0-100)
      yieldScore = shortTermYieldScore + longTermYieldScore;
    }

    // Final Score (weighted average)
    // 40% price, 20% condition, 20% rate comparison, 20% yield
    const finalScore = Math.round(
      (priceScore * 0.4) + 
      (conditionScore * 0.2) + 
      (rateScore * 0.2) + 
      (yieldScore * 0.2)
    );

    return finalScore;
  };

  const finalScore = calculateDealScore();

  return (
    <>
      <div>
        <div className="flex flex-col items-center mb-6">
          <div className="text-2xl font-bold flex items-center mb-2">
            {badgeInfo.emoji} Deal Score: {finalScore}
          </div>

          {/* Score Display */}
          <div className="flex items-center justify-center mb-4">
            <Badge
              className={`
              ${badgeInfo.color}
              text-white px-6 py-2 text-xl
            `}
            >
              {badgeInfo.text}
            </Badge>
          </div>

          {/* Gauge Visualization */}
          <div className="w-full max-w-md">
            <div className="relative pt-4">
              {/* Gauge Background */}
              <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-green-500 to-blue-500" />

              {/* Gauge Markers */}
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Overpriced</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Great</span>
              </div>

              {/* Gauge Pointer */}
              <div
                className="absolute -top-1 w-4 h-4 bg-background border-2 border-primary rounded-full transform -translate-x-1/2"
                style={{
                  left: `${Math.min(Math.max((100 - priceDiff * 5), 0), 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Deal Explanation */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              This property is {Math.abs(priceDiff).toFixed(1)}%
              {priceDiff > 0 ? " above " : " below "}
              the estimated market value.
            </p>

            <div className="flex justify-between items-center mt-4 px-4">
              <div className="text-sm">Asking Price:</div>
              <div className="font-bold">R{purchasePrice.toLocaleString()}</div>
            </div>

            {/* Market Price */}
            <div className="space-y-1 mt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">
                  Estimated Market Value
                </div>
                <div className="font-bold">R{marketPrice.toLocaleString()}</div>
              </div>
              <div className="text-center mt-1">
                <span
                  className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800"
                  onClick={() => setIsCalculationModalOpen(true)}
                >
                  See how we calculate this
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Yield Assessment - Only show if we have rental data */}
        {rentalData && (
          <div className="border rounded-lg bg-white p-4 mt-6">
            <h3 className="font-semibold mb-4">Key Deal Factors</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="font-medium">Short-Term Yield:</div>
                <div 
                  className={`font-bold ${
                    rentalData.shortTerm.yield >= 15 
                      ? "text-green-600" 
                      : rentalData.shortTerm.yield >= 10 
                        ? "text-blue-600" 
                        : "text-amber-600"
                  }`}
                >
                  {rentalData.shortTerm.yield.toFixed(1)}%
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className={`
                      ${rentalData.shortTerm.yield >= 15 ? "text-green-500" : 
                        rentalData.shortTerm.yield >= 10 ? "text-blue-500" : 
                        "text-amber-500"}
                    `}
                  >
                    {rentalData.shortTerm.yield >= 15 
                      ? "EXCELLENT" 
                      : rentalData.shortTerm.yield >= 10 
                        ? "GOOD" 
                        : "FAIR"}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="font-medium">Long-Term Yield:</div>
                <div 
                  className={`font-bold ${
                    rentalData.longTerm.yield >= 6 
                      ? "text-green-600" 
                      : rentalData.longTerm.yield >= 5 
                        ? "text-blue-600" 
                        : "text-amber-600"
                  }`}
                >
                  {rentalData.longTerm.yield.toFixed(1)}%
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className={`
                      ${rentalData.longTerm.yield >= 6 ? "text-green-500" : 
                        rentalData.longTerm.yield >= 5 ? "text-blue-500" : 
                        "text-amber-500"}
                    `}
                  >
                    {rentalData.longTerm.yield >= 6 
                      ? "EXCELLENT" 
                      : rentalData.longTerm.yield >= 5 
                        ? "GOOD" 
                        : "FAIR"}
                  </Badge>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="font-medium">Best Strategy:</div>
                <div className="font-bold">
                  {rentalData.isShortTermRecommended ? "Short-Term" : "Long-Term"}
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className={`text-purple-500`}
                  >
                    {rentalData.isShortTermRecommended ? "AIRBNB" : "RENTAL"}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>Price per m²</div>
                <div className="font-bold">
                  R{Math.round(propertyRate).toLocaleString()}/m²
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>Area average</div>
                <div className="font-bold">
                  R{Math.round(areaRate).toLocaleString()}/m²
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>Property condition</div>
                <div className="capitalize font-medium">
                  {propertyCondition}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deal Score Section */}
        <div className="flex justify-center mt-6">
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Score based on price difference, property condition, area rates, and rental yields
          </p>
        </div>
      </div>
      <Dialog open={isCalculationModalOpen} onOpenChange={setIsCalculationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Market Value Calculation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">The estimated market value is calculated by multiplying the property size by the area rate:</p>
            <div className="bg-gray-100 p-3 rounded-md mb-4">
              <p className="font-semibold">Property Size: {parseFloat(marketPrice / areaRate).toFixed(1)} m²</p>
              <p className="font-semibold">Area Rate: R{areaRate.toLocaleString()}/m²</p>
              <p className="font-semibold mt-2">Estimated Market Value: R{marketPrice.toLocaleString()}</p>
            </div>
            <p className="text-sm text-gray-600">Note: This estimation is based on current market rates in the area and provides a useful benchmark for property valuation.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCalculationModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}