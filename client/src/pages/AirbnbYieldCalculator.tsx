import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function AirbnbYieldCalculator() {
  const [nightlyRate, setNightlyRate] = useState("");
  const [occupancyRate, setOccupancyRate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [propertyYield, setPropertyYield] = useState<number | null>(null);

  const calculateYield = () => {
    const annualRevenue = parseFloat(nightlyRate) * (parseFloat(occupancyRate) / 100) * 365;
    const yieldPercentage = (annualRevenue / parseFloat(purchasePrice)) * 100;
    setPropertyYield(parseFloat(yieldPercentage.toFixed(2)));
  };

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 py-12 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Airbnb Yield Calculator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nightlyRate">Nightly Rate (R)</Label>
                <Input
                  id="nightlyRate"
                  placeholder="e.g. 2500"
                  value={nightlyRate}
                  onChange={(e) => setNightlyRate(e.target.value)}
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupancyRate">Occupancy Rate (%)</Label>
                <Input
                  id="occupancyRate"
                  placeholder="e.g. 65"
                  value={occupancyRate}
                  onChange={(e) => setOccupancyRate(e.target.value)}
                  type="number"
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price (R)</Label>
                <Input
                  id="purchasePrice"
                  placeholder="e.g. 3500000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  type="number"
                />
              </div>
              <Button 
                onClick={calculateYield}
                disabled={!nightlyRate || !occupancyRate || !purchasePrice}
              >
                Calculate Yield
              </Button>

              {propertyYield !== null && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900">Results</h3>
                  <p className="text-blue-800">
                    Gross Yield: {propertyYield}%
                  </p>
                  <p className="text-sm text-blue-600 mt-2">
                    Note: This is a basic calculation of gross yield. Actual returns may vary based on expenses, 
                    seasonality, and market conditions.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}