import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";

export default function AirbnbYieldCalculator() {
  // Airbnb calculator state
  const [nightlyRate, setNightlyRate] = useState("");
  const [occupancyRate, setOccupancyRate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [propertyYield, setPropertyYield] = useState<number | null>(null);

  // Long-term rental calculator state
  const [monthlyRent, setMonthlyRent] = useState("");
  const [longTermPurchasePrice, setLongTermPurchasePrice] = useState("");
  const [longTermYield, setLongTermYield] = useState<number | null>(null);

  const calculateAirbnbYield = () => {
    const annualRevenue = parseFloat(nightlyRate) * (parseFloat(occupancyRate) / 100) * 365;
    const yieldPercentage = (annualRevenue / parseFloat(purchasePrice)) * 100;
    setPropertyYield(parseFloat(yieldPercentage.toFixed(2)));
  };

  const calculateLongTermYield = () => {
    const annualRevenue = parseFloat(monthlyRent) * 12;
    const yieldPercentage = (annualRevenue / parseFloat(longTermPurchasePrice)) * 100;
    setLongTermYield(parseFloat(yieldPercentage.toFixed(2)));
  };

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pt-32">
        {/* SEO-optimized header section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Free Rental Property Yield Calculator
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Calculate and compare yields for both short-term (Airbnb) and long-term rental strategies. Make data-driven decisions for your property investments.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Rental Yield Calculator</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="airbnb" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="airbnb">Airbnb</TabsTrigger>
                <TabsTrigger value="longterm">Long Term</TabsTrigger>
              </TabsList>

              <TabsContent value="airbnb" className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nightlyRate">Nightly Rate (R)</Label>
                  <Input
                    id="nightlyRate"
                    placeholder="e.g. 2500"
                    value={nightlyRate}
                    onChange={(e) => setNightlyRate(e.target.value)}
                    type="number"
                    className="w-full"
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
                    className="w-full"
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
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={calculateAirbnbYield}
                  disabled={!nightlyRate || !occupancyRate || !purchasePrice}
                  className="w-full sm:w-auto"
                >
                  Calculate Airbnb Yield
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
              </TabsContent>

              <TabsContent value="longterm" className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="monthlyRent">Monthly Rent (R)</Label>
                  <Input
                    id="monthlyRent"
                    placeholder="e.g. 15000"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    type="number"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longTermPurchasePrice">Purchase Price (R)</Label>
                  <Input
                    id="longTermPurchasePrice"
                    placeholder="e.g. 3500000"
                    value={longTermPurchasePrice}
                    onChange={(e) => setLongTermPurchasePrice(e.target.value)}
                    type="number"
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={calculateLongTermYield}
                  disabled={!monthlyRent || !longTermPurchasePrice}
                  className="w-full sm:w-auto"
                >
                  Calculate Long-term Yield
                </Button>

                {longTermYield !== null && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900">Results</h3>
                    <p className="text-blue-800">
                      Gross Yield: {longTermYield}%
                    </p>
                    <p className="text-sm text-blue-600 mt-2">
                      Note: This is a basic calculation of gross yield. Actual returns may vary based on expenses,
                      vacancy rates, and market conditions.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Call-to-action section */}
        <div className="mt-8 sm:mt-12 bg-blue-50 rounded-lg p-4 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Need a More Comprehensive Analysis?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-sm sm:text-base">
            While these calculators provide quick estimates, successful property investing requires deeper insights.
            Get access to our full suite of tools including:
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 text-left">
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Market Analysis</h3>
              <p className="text-sm text-gray-600">Compare short-term and long-term rental performance in your area</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Revenue Forecasting</h3>
              <p className="text-sm text-gray-600">Detailed financial projections for both rental strategies</p>
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Expense Tracking</h3>
              <p className="text-sm text-gray-600">Complete expense analysis and ROI calculations</p>
            </div>
          </div>
          <Link href="/pricing">
            <Button className="w-full sm:w-auto bg-[#1BA3FF] hover:bg-[#1BA3FF]/90">
              Explore Pro Features
            </Button>
          </Link>
        </div>

        {/* SEO content section */}
        <div className="mt-8 sm:mt-12 prose max-w-none">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Understanding Rental Property Yields
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 text-gray-600">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Short-term vs Long-term Rentals</h3>
              <p className="mb-4 text-sm sm:text-base">
                Both rental strategies have their advantages. Short-term rentals often generate higher gross yields
                but require more active management. Long-term rentals typically offer more stable income with less
                day-to-day involvement.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Why Calculate Rental Yield?</h3>
              <p className="mb-4 text-sm sm:text-base">
                Understanding your potential yield helps make informed investment decisions and compare
                different rental strategies. It's a crucial metric for evaluating property investments.
              </p>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}