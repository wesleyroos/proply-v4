import { Badge } from "@/components/ui/badge";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DealScoreAdvisor } from "@/components/DealScoreAdvisor";

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
            {badgeInfo.emoji} Deal Score: <span className="text-3xl ml-1 text-primary">{finalScore}/100</span>
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
              This property is <span className={`font-bold text-base ${priceDiff > 0 ? "text-amber-500" : "text-green-500"}`}>{Math.abs(priceDiff).toFixed(1)}%</span>
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
            </div>
          </div>
        </div>


        {/* Key Deal Factors section - Only show if we have rental data */}
        {rentalData && (
          <div className="mt-6">
            <Accordion type="single" collapsible className="border rounded-lg bg-white">
              <AccordionItem value="deal-factors" className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <h3 className="font-semibold">Key Deal Factors</h3>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">Price per m²:</div>
                      <div className="font-bold">
                        R{Math.round(propertyRate).toLocaleString()}/m²
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="font-medium">Area average:</div>
                      <div className="font-bold">
                        R{Math.round(areaRate).toLocaleString()}/m²
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="font-medium">Property condition:</div>
                      <div className="capitalize font-bold">
                        {propertyCondition}
                      </div>
                    </div>
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
                    <div className="text-center mt-1">
                      <span
                        className="text-xs text-blue-600 underline cursor-pointer hover:text-blue-800"
                        onClick={() => setIsCalculationModalOpen(true)}
                      >
                        See how we calculate this
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        {/* Deal Score Section */}
        <div className="flex justify-center mt-6">
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Score based on price difference, property condition, area rates, and rental yields
          </p>
        </div>
      </div>
      {/* AI Advisor moved to parent component to be available across all tabs */}
      )}

      <Dialog open={isCalculationModalOpen} onOpenChange={setIsCalculationModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Deal Factors Calculation Methodology</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* Market Value Calculation */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Market Value</h3>
              <p className="mb-3">The estimated market value is calculated by multiplying the property size by the area rate:</p>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="font-semibold">Property Size: {parseFloat(marketPrice / areaRate).toFixed(1)} m²</p>
                <p className="font-semibold">Area Rate: R{areaRate.toLocaleString()}/m²</p>
                <p className="font-semibold mt-2">Estimated Market Value: R{marketPrice.toLocaleString()}</p>
              </div>
            </div>

            {/* Price per m² */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Price per m²</h3>
              <p className="mb-3">This is calculated by dividing the purchase price by the property size:</p>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="font-medium">Purchase Price: R{purchasePrice.toLocaleString()}</p>
                <p className="font-medium">Property Size: {parseFloat(marketPrice / areaRate).toFixed(1)} m²</p>
                <p className="font-semibold mt-2">Price per m²: R{Math.round(propertyRate).toLocaleString()}/m²</p>
              </div>
            </div>

            {/* Area Average */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Area Average</h3>
              <p className="mb-3">The area average is based on recent sales data and property valuations in the area:</p>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="font-semibold">Area Average Rate: R{areaRate.toLocaleString()}/m²</p>
              </div>
              <p className="text-sm text-gray-600 mt-1">This data is updated periodically based on market transactions.</p>
            </div>

            {rentalData && (
              <>
                {/* Short-term yield */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Short-Term Yield</h3>
                  <p className="mb-3">Calculated as annual short-term rental income divided by property purchase price:</p>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="font-medium">Daily Rate: R{(rentalData.shortTerm.monthly / 30).toFixed(0)}</p>
                    <p className="font-medium">Average Occupancy: {rentalData.shortTerm.monthly ? ((rentalData.shortTerm.yearly / 12) / (rentalData.shortTerm.monthly / 30) / 365 * 100).toFixed(1) : 0}%</p>
                    <p className="font-medium">Annual Revenue: R{rentalData.shortTerm.yearly.toLocaleString()}</p>
                    <p className="font-semibold mt-2">Short-Term Yield: {rentalData.shortTerm.yield.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Long-term yield */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Long-Term Yield</h3>
                  <p className="mb-3">Calculated as annual long-term rental income divided by property purchase price:</p>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="font-medium">Monthly Rental: R{rentalData.longTerm.monthly.toLocaleString()}</p>
                    <p className="font-medium">Annual Revenue: R{rentalData.longTerm.yearly.toLocaleString()}</p>
                    <p className="font-semibold mt-2">Long-Term Yield: {rentalData.longTerm.yield.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Best Strategy */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Best Strategy</h3>
                  <p className="mb-3">The recommended strategy is determined by comparing the annual yields from short-term and long-term rentals:</p>
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="font-medium">Short-Term Annual Income: R{rentalData.shortTerm.yearly.toLocaleString()}</p>
                    <p className="font-medium">Long-Term Annual Income: R{rentalData.longTerm.yearly.toLocaleString()}</p>
                    <p className="font-semibold mt-2">Recommended Strategy: {rentalData.isShortTermRecommended ? "Short-Term (Airbnb)" : "Long-Term Rental"}</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Note: This recommendation is based solely on revenue and does not account for management costs, maintenance, and other expenses which may vary between strategies.</p>
                </div>
              </>
            )}

            {/* Property Condition */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Property Condition</h3>
              <p className="mb-3">Property condition affects both valuation and potential returns:</p>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="font-medium">Current Condition: <span className="capitalize">{propertyCondition}</span></p>
                <p className="text-sm mt-2">
                  • <strong>Excellent:</strong> Move-in ready, minimal repairs needed
                </p>
                <p className="text-sm">
                  • <strong>Good:</strong> Minor cosmetic issues, some repairs needed
                </p>
                <p className="text-sm">
                  • <strong>Fair:</strong> Significant repairs needed, functional but dated
                </p>
                <p className="text-sm">
                  • <strong>Poor:</strong> Major repairs needed, potential structural issues
                </p>
              </div>
            </div>

            {/* Deal Score */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Deal Score Calculation</h3>
              <p className="mb-3">The overall deal score is weighted based on multiple factors:</p>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="font-medium">• Price Factor (40%): Based on the difference between asking price and market value</p>
                <p className="font-medium">• Condition Factor (20%): Based on the property's condition</p>
                <p className="font-medium">• Rate Comparison (20%): How the property's price per m² compares to area average</p>
                <p className="font-medium">• Yield Factor (20%): Based on potential rental yields</p>
              </div>
              <p className="text-sm text-gray-600 mt-1">The final score is a weighted average of these factors, with 100 being the maximum possible score.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCalculationModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}