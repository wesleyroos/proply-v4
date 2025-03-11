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

  return (
    <>
      <div>
        <div className="flex flex-col items-center mb-6">
          <div className="text-2xl font-bold flex items-center mb-2">
            {badgeInfo.emoji} Deal Score
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
              <div className="text-right mt-1">
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

        {/* Additional Deal Details */}
        <div className="mt-8 border-t pt-4">
          <h3 className="font-medium mb-4">Key Deal Factors</h3>
          <div className="space-y-3">
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

            <div className="flex justify-between items-center mb-2">
              <div>Short-Term Yield</div>
              <div className="font-semibold text-emerald-600">
                {rentalData?.shortTerm.yield.toFixed(2) || "0"}%
              </div>
            </div>

            <div className="flex justify-between items-center mb-2">
              <div>Long-Term Yield</div>
              <div className="font-semibold text-blue-600">
                {rentalData?.longTerm.yield.toFixed(2) || "0"}%
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