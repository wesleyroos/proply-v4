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
import { ArrowRight, Calculator } from "lucide-react";

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

  const currencySymbol = {
    ZAR: "R",
    USD: "$",
    EUR: "€",
    GBP: "£"
  };

  const getSymbol = () => currencySymbol[selectedCurrency as keyof typeof currencySymbol] || "R";

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Rental Property Yield Calculator | Compare Airbnb vs Long-term Rental Returns | Proply</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="description" content="Calculate and compare rental property yields instantly. Free calculator for Airbnb and long-term rental strategies. Make data-driven property investment decisions with real-time yield projections." />
        <meta name="keywords" content="rental yield calculator, Airbnb yield calculator, property investment calculator, rental return calculator, property ROI calculator, rental property calculator, investment property calculator, Airbnb investment calculator, short term rental calculator, long term rental calculator, South Africa property calculator" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://app.proply.co.za/airbnb-yield-calculator" />
        <meta property="og:title" content="Free Rental Property Yield Calculator | Compare Airbnb vs Long-term Returns" />
        <meta property="og:description" content="Calculate and compare rental property yields instantly. Make data-driven property investment decisions with our free calculator. Compare Airbnb and long-term rental strategies." />
        <meta property="og:image" content="/images/Yield Calculator Thumbnail.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://app.proply.co.za/airbnb-yield-calculator" />
        <meta name="twitter:title" content="Free Rental Property Yield Calculator | Compare Rental Strategies" />
        <meta name="twitter:description" content="Calculate and compare rental property yields instantly. Make data-driven property investment decisions with our free calculator." />
        <meta name="twitter:image" content="https://proply.app/images/Yield Calculator Thumbnail.jpg" />

        {/* Additional SEO Meta Tags */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Proply" />
        <meta name="language" content="English" />
        <link rel="canonical" href="https://app.proply.co.za/airbnb-yield-calculator" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Proply Rental Yield Calculator",
            "description": "Calculate and compare yields for both short-term (Airbnb) and long-term rental strategies. Make data-driven property investment decisions with our free calculator.",
            "applicationCategory": "Business Calculator",
            "operatingSystem": "Any",
            "url": "https://app.proply.co.za/airbnb-yield-calculator",
            "provider": {
              "@type": "Organization",
              "name": "Proply",
              "url": "https://proply.app"
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "ZAR"
            }
          })}
        </script>

        {/* Breadcrumb Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://proply.app"
            }, {
              "@type": "ListItem",
              "position": 2,
              "name": "Tools",
              "item": "https://proply.app/tools"
            }, {
              "@type": "ListItem",
              "position": 3,
              "name": "Rental Yield Calculator",
              "item": "https://app.proply.co.za/airbnb-yield-calculator"
            }]
          })}
        </script>

        {/* FAQ Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [{
              "@type": "Question",
              "name": "What is a good rental yield?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "In South Africa, rental yields typically range from 4% to 12%. A yield above 7% is generally considered good, but this can vary significantly by location and property type."
              }
            }, {
              "@type": "Question",
              "name": "How accurate are these calculations?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "This calculator provides a basic gross yield calculation. For more accurate predictions, consider using our full suite of tools which account for expenses, vacancy rates, and market conditions."
              }
            }, {
              "@type": "Question",
              "name": "How do I calculate rental yield?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "For Airbnb calculations, enter your expected nightly rate, estimated occupancy rate, and the property's purchase price. For long-term rentals, input your expected monthly rental income and the property's purchase price. The calculator will instantly show your potential gross yield."
              }
            }]
          })}
        </script>
      </Helmet>

      <PublicHeader />

      <main className="w-full pt-16 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-4 sm:space-y-6 lg:pr-12">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
                Quickly calculate
              </h1>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                the yield of any rental property
              </h2>
            </div>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl">
              Make data-driven property investment decisions with our comprehensive yield calculator. Compare short-term and long-term rental strategies instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/register">
                <Button className="bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                  Start Calculating
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/property-analyzer">
                <Button variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="pt-6 sm:pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-blue-100 shrink-0">
                  <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Calculations</h3>
                  <p className="text-sm sm:text-base text-gray-600">Instant yield projections based on your inputs</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-full p-2 bg-green-100 shrink-0">
                  <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Multiple Currencies</h3>
                  <p className="text-sm sm:text-base text-gray-600">Support for ZAR, USD, EUR, and GBP</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:pl-12">
            <Card className="shadow-xl border-0">
              <CardHeader className="space-y-1 p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl font-bold">Rental Yield Calculator</CardTitle>
                <p className="text-gray-500">Compare short-term and long-term rental strategies</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-6">
                  <Label htmlFor="currency" className="text-gray-700">Select Currency</Label>
                  <Select onValueChange={setSelectedCurrency} value={selectedCurrency}>
                    <SelectTrigger id="currency" className="w-full">
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
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nightlyRate">{`Nightly Rate (${getSymbol()})`}</Label>
                        <div className="relative">
                          <Input
                            id="nightlyRate"
                            placeholder={`e.g. ${selectedCurrency === 'ZAR' ? '2,500' : selectedCurrency === 'USD' ? '135' : selectedCurrency === 'EUR' ? '125' : '110'}`}
                            value={nightlyRate ? Number(nightlyRate).toLocaleString() : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '');
                              setNightlyRate(value);
                            }}
                            type="text"
                            className="w-full"
                          />
                          {selectedCurrency !== 'ZAR' && nightlyRate && (
                            <div className="text-sm text-muted-foreground mt-1">
                              ≈ R{(parseFloat(nightlyRate) * exchangeRates[selectedCurrency as keyof typeof exchangeRates]).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
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

                      <div>
                        <Label htmlFor="purchasePrice">{`Purchase Price (${getSymbol()})`}</Label>
                        <div className="relative">
                          <Input
                            id="purchasePrice"
                            placeholder={`e.g. ${selectedCurrency === 'ZAR' ? '3,500,000' : selectedCurrency === 'USD' ? '185,000' : selectedCurrency === 'EUR' ? '170,000' : '150,000'}`}
                            value={purchasePrice ? Number(purchasePrice).toLocaleString() : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '');
                              setPurchasePrice(value);
                            }}
                            type="text"
                            className="w-full"
                          />
                          {selectedCurrency !== 'ZAR' && purchasePrice && (
                            <div className="text-sm text-muted-foreground mt-1">
                              ≈ R{(parseFloat(purchasePrice) * exchangeRates[selectedCurrency as keyof typeof exchangeRates]).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={calculateAirbnbYield}
                      disabled={!nightlyRate || !occupancyRate || !purchasePrice}
                      className="w-full bg-[#1BA3FF] hover:bg-[#1BA3FF]/90"
                    >
                      Calculate Airbnb Yield
                    </Button>

                    {propertyYield !== null && (
                      <div className="mt-6 p-6 bg-blue-50 rounded-lg">
                        <h3 className="text-xl font-semibold text-blue-900 mb-2">Results</h3>
                        <p className="text-3xl font-bold text-blue-800">
                          {propertyYield}% <span className="text-lg font-normal">Gross Yield</span>
                        </p>
                        <p className="text-sm text-blue-600 mt-4">
                          Note: This is a basic calculation of gross yield. Actual returns may vary based on expenses,
                          seasonality, and market conditions.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="longterm" className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="monthlyRent">{`Monthly Rent (${getSymbol()})`}</Label>
                        <div className="relative">
                          <Input
                            id="monthlyRent"
                            placeholder={`e.g. ${selectedCurrency === 'ZAR' ? '25,000' : selectedCurrency === 'USD' ? '1,300' : selectedCurrency === 'EUR' ? '1,200' : '1,100'}`}
                            value={monthlyRent ? Number(monthlyRent).toLocaleString() : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '');
                              setMonthlyRent(value);
                            }}
                            type="text"
                            className="w-full"
                          />
                          {selectedCurrency !== 'ZAR' && monthlyRent && (
                            <div className="text-sm text-muted-foreground mt-1">
                              ≈ R{(parseFloat(monthlyRent) * exchangeRates[selectedCurrency as keyof typeof exchangeRates]).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="longTermPurchasePrice">{`Purchase Price (${getSymbol()})`}</Label>
                        <div className="relative">
                          <Input
                            id="longTermPurchasePrice"
                            placeholder={`e.g. ${selectedCurrency === 'ZAR' ? '3,500,000' : selectedCurrency === 'USD' ? '185,000' : selectedCurrency === 'EUR' ? '170,000' : '150,000'}`}
                            value={longTermPurchasePrice ? Number(longTermPurchasePrice).toLocaleString() : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d]/g, '');
                              setLongTermPurchasePrice(value);
                            }}
                            type="text"
                            className="w-full"
                          />
                          {selectedCurrency !== 'ZAR' && longTermPurchasePrice && (
                            <div className="text-sm text-muted-foreground mt-1">
                              ≈ R{(parseFloat(longTermPurchasePrice) * exchangeRates[selectedCurrency as keyof typeof exchangeRates]).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={calculateLongTermYield}
                      disabled={!monthlyRent || !longTermPurchasePrice}
                      className="w-full bg-[#1BA3FF] hover:bg-[#1BA3FF]/90"
                    >
                      Calculate Long-term Yield
                    </Button>

                    {longTermYield !== null && (
                      <div className="mt-6 p-6 bg-blue-50 rounded-lg">
                        <h3 className="text-xl font-semibold text-blue-900 mb-2">Results</h3>
                        <p className="text-3xl font-bold text-blue-800">
                          {longTermYield}% <span className="text-lg font-normal">Gross Yield</span>
                        </p>
                        <p className="text-sm text-blue-600 mt-4">
                          Note: This is a basic calculation of gross yield. Actual returns may vary based on expenses,
                          vacancy rates, and market conditions.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Marketing and Information Section */}
      <section className="bg-gray-50 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mt-8 sm:mt-12 bg-blue-50 rounded-lg p-4 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Need a More Comprehensive Analysis?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-sm sm:text-base">
              While these calculators provide quick estimates, successful property investing requires deeper insights.
              Get access to our full suite of tools including:
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 text-left">
              <div className="bg-white p-3 sm:p-4 rounded shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2">Market Analysis</h3>
                <p className="text-sm text-gray-600">Compare short-term and long-term rental performance in your area</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2">Revenue Forecasting</h3>
                <p className="text-sm text-gray-600">Detailed financial projections for both rental strategies</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2">Expense Tracking</h3>
                <p className="text-sm text-gray-600">Complete expense analysis and ROI calculations</p>
              </div>
            </div>
            <Link href="/pricing">
              <Button className="bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                Explore Pro Features
              </Button>
            </Link>
          </div>

          <section className="mt-12 sm:mt-16 max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
              Understanding Rental Property Yields
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Short-term vs Long-term Rentals</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Both rental strategies have their unique advantages in the South African property market. Short-term rentals
                  through platforms like Airbnb often generate higher gross yields but require more active management.
                  Long-term rentals typically offer more stable income with less day-to-day involvement, making them
                  attractive to passive investors.
                </p>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Why Calculate Rental Yield?</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Rental yield is a crucial metric for property investors to evaluate potential returns on investment.
                  It helps compare different properties and rental strategies objectively. Our calculator provides instant
                  insights into both short-term and long-term rental potential, helping you make informed investment decisions.
                </p>
              </div>
            </div>

            <div className="mb-12 sm:mb-16">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">How to Use This Calculator</h3>
              <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-600">
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600">1.</span>
                  For Airbnb calculations: Enter your expected nightly rate, estimated occupancy rate, and the property's
                  purchase price. The calculator will instantly show your potential gross yield.
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600">2.</span>
                  For long-term rental calculations: Input your expected monthly rental income and the property's
                  purchase price to see the projected annual yield.
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-semibold text-blue-600">3.</span>
                  Compare both strategies to determine which approach might work better for your investment goals.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">What is a good rental yield?</h4>
                  <p className="text-sm sm:text-base text-gray-600">
                    In South Africa, rental yields typically range from 4% to 12%. A yield above 7% is generally
                    considered good, but this can vary significantly by location and property type.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">How accurate are these calculations?</h4>
                  <p className="text-sm sm:text-base text-gray-600">
                    This calculator provides a basic gross yield calculation. For more accurate predictions, consider
                    using our full suite of tools which account for expenses, vacancy rates, and market conditions.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}