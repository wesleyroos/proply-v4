import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PublicHeader from "@/components/PublicHeader";
import { useEffect } from "react";
import PublicFooter from "@/components/PublicFooter";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AirbnbYieldCalculator() {
  const [nightlyRate, setNightlyRate] = useState("");
  const [occupancyRate, setOccupancyRate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [propertyYield, setPropertyYield] = useState<number | null>(null);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [longTermPurchasePrice, setLongTermPurchasePrice] = useState("");
  const [longTermYield, setLongTermYield] = useState<number | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("ZAR");
  const [exchangeRates, setExchangeRates] = useState({
    ZAR: 1,
    USD: 0,
    EUR: 0,
    GBP: 0
  });

  // Fetch exchange rates on component mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/ZAR`);
        const data = await response.json();
        setExchangeRates({
          ZAR: 1,
          USD: 1 / data.rates.USD,
          EUR: 1 / data.rates.EUR,
          GBP: 1 / data.rates.GBP
        });
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      }
    };
    fetchRates();
  }, []);

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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Free Rental Property Yield Calculator",
    "description": "Calculate and compare yields for both short-term (Airbnb) and long-term rental strategies. Make data-driven property investment decisions with our free calculator.",
    "applicationCategory": "Calculator",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "ZAR"
    }
  };

  const currencySymbol = {
    ZAR: "R",
    USD: "$",
    EUR: "€",
    GBP: "£"
  };

  const getSymbol = () => currencySymbol[selectedCurrency] || "R"; //Default to R if currency not found


  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <Helmet>
        <title>Free Rental Property Yield Calculator | Compare Airbnb vs Long-term Rental Yields</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="Calculate and compare rental property yields instantly. Free calculator for both Airbnb and long-term rental strategies. Make smarter property investment decisions." />
        <meta name="keywords" content="rental yield calculator, property yield calculator, Airbnb yield calculator, rental property calculator, investment property calculator, real estate yield calculator, property investment tools" />
        <meta property="og:title" content="Free Rental Property Yield Calculator | Compare Airbnb vs Long-term Rental Yields" />
        <meta property="og:description" content="Calculate and compare rental property yields instantly. Free calculator for both Airbnb and long-term rental strategies. Make smarter property investment decisions." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://proply.app/rental-yield-calculator" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <PublicHeader />

      <main className="w-full overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pt-32">
          <nav className="text-sm mb-6 whitespace-nowrap" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex">
              <li className="flex items-center">
                <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
                <span className="mx-2 text-gray-500">/</span>
              </li>
              <li className="flex items-center">
                <span className="text-gray-900" aria-current="page">Rental Yield Calculator</span>
              </li>
            </ol>
          </nav>

          <header className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Free Rental Property Yield Calculator
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Calculate and compare yields for both short-term (Airbnb) and long-term rental strategies. Make data-driven decisions for your property investments with our free calculator tool.
            </p>
          </header>

          <Card className="mb-8">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Rental Yield Calculator</CardTitle>
              <img src="/proply-logo-1.png" alt="Proply Logo" className="h-8" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4">
                <Label htmlFor="currency">Select Currency</Label>
                <Select onValueChange={setSelectedCurrency} value={selectedCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZAR">South African Rand (R) - Base Rate</SelectItem>
                    <SelectItem value="USD">US Dollar ($) - R{exchangeRates.USD.toFixed(2)}</SelectItem>
                    <SelectItem value="EUR">Euro (€) - R{exchangeRates.EUR.toFixed(2)}</SelectItem>
                    <SelectItem value="GBP">British Pound (£) - R{exchangeRates.GBP.toFixed(2)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Tabs defaultValue="airbnb" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="airbnb">Airbnb</TabsTrigger>
                  <TabsTrigger value="longterm">Long Term</TabsTrigger>
                </TabsList>

                <TabsContent value="airbnb" className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nightlyRate">{`Nightly Rate (${getSymbol()})`}</Label>
                    <div className="relative">
                      <Input
                        id="nightlyRate"
                        placeholder="e.g. 2500"
                        value={nightlyRate}
                        onChange={(e) => setNightlyRate(e.target.value)}
                        type="number"
                        className="w-full"
                      />
                      {selectedCurrency !== 'ZAR' && nightlyRate && (
                        <div className="text-sm text-muted-foreground mt-1">
                          ≈ R{(parseFloat(nightlyRate) * exchangeRates[selectedCurrency]).toFixed(2)}
                        </div>
                      )}
                    </div>
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
                    <Label htmlFor="purchasePrice">{`Purchase Price (${getSymbol()})`}</Label>
                    <div className="relative">
                      <Input
                        id="purchasePrice"
                        placeholder="e.g. 3500000"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        type="number"
                        className="w-full"
                      />
                      {selectedCurrency !== 'ZAR' && purchasePrice && (
                        <div className="text-sm text-muted-foreground mt-1">
                          ≈ R{(parseFloat(purchasePrice) * exchangeRates[selectedCurrency]).toFixed(2)}
                        </div>
                      )}
                    </div>
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
                    <Label htmlFor="monthlyRent">{`Monthly Rent (${getSymbol()})`}</Label>
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
                    <Label htmlFor="longTermPurchasePrice">{`Purchase Price (${getSymbol()})`}</Label>
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

          <section className="mt-8 sm:mt-12 prose max-w-none">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
              Understanding Rental Property Yields
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 text-gray-600">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Short-term vs Long-term Rentals</h3>
                <p className="mb-4 text-sm sm:text-base">
                  Both rental strategies have their unique advantages in the South African property market. Short-term rentals
                  through platforms like Airbnb often generate higher gross yields but require more active management.
                  Long-term rentals typically offer more stable income with less day-to-day involvement, making them
                  attractive to passive investors.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Why Calculate Rental Yield?</h3>
                <p className="mb-4 text-sm sm:text-base">
                  Rental yield is a crucial metric for property investors to evaluate potential returns on investment.
                  It helps compare different properties and rental strategies objectively. Our calculator provides instant
                  insights into both short-term and long-term rental potential, helping you make informed investment decisions.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Use This Calculator</h3>
              <div className="space-y-4 text-sm sm:text-base text-gray-600">
                <p>
                  1. For Airbnb calculations: Enter your expected nightly rate, estimated occupancy rate, and the property's
                  purchase price. The calculator will instantly show your potential gross yield.
                </p>
                <p>
                  2. For long-term rental calculations: Input your expected monthly rental income and the property's
                  purchase price to see the projected annual yield.
                </p>
                <p>
                  3. Compare both strategies to determine which approach might work better for your investment goals.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <h4 className="font-semibold text-gray-800">What is a good rental yield?</h4>
                  <p className="text-gray-600">
                    In South Africa, rental yields typically range from 4% to 12%. A yield above 7% is generally
                    considered good, but this can vary significantly by location and property type.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">How accurate are these calculations?</h4>
                  <p className="text-gray-600">
                    This calculator provides a basic gross yield calculation. For more accurate predictions, consider
                    using our full suite of tools which account for expenses, vacancy rates, and market conditions.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}