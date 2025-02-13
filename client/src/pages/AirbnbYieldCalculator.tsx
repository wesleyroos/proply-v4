
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";

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
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* SEO-optimized header section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Free Airbnb Yield Calculator for Property Investors
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calculate the potential yield of your short-term rental property in seconds. Perfect for property investors and Airbnb hosts looking to evaluate investment opportunities.
          </p>
        </div>

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

        {/* Call-to-action section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need a More Comprehensive Analysis?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            While this calculator provides a quick estimate, successful Airbnb investing requires deeper insights. 
            Get access to our full suite of tools including:
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Market Analysis</h3>
              <p className="text-sm text-gray-600">Real-time data on occupancy rates and pricing in your area</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Revenue Forecasting</h3>
              <p className="text-sm text-gray-600">Seasonal adjustments and detailed financial projections</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Expense Tracking</h3>
              <p className="text-sm text-gray-600">Complete expense analysis and ROI calculations</p>
            </div>
          </div>
          <Link href="/pricing">
            <Button className="bg-[#1BA3FF] hover:bg-[#1BA3FF]/90">
              Explore Pro Features
            </Button>
          </Link>
        </div>

        {/* SEO content section */}
        <div className="mt-12 prose max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Understanding Airbnb Property Yields
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-gray-600">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What is Gross Yield?</h3>
              <p className="mb-4">
                Gross yield is the annual rental income as a percentage of the property's purchase price, 
                before expenses. It's a quick way to compare different investment opportunities.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Why Calculate Airbnb Yield?</h3>
              <p className="mb-4">
                Understanding your potential yield helps make informed investment decisions and compare 
                short-term rentals with traditional long-term letting options.
              </p>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
