import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  LineChart,
  BarChart2,
  Code,
  Database,
  Settings,
  ArrowRight,
  Building,
  Calculator,
  ChartBar,
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function PropertyAnalyzerProductPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Hero Section */}
      <div className="pt-16 bg-gradient-to-r from-[#114D9D] to-[#1BA3FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white">
              Property Analysis Engine
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-white/90">
              Make data-driven property investment decisions with our comprehensive analysis tools
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Start Free Trial</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white hover:bg-white/20"
                asChild
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Comprehensive Property Analysis Suite
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to evaluate property investments with confidence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <Calculator className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Financial Modeling</h3>
                <p className="text-gray-600">
                  Advanced financial calculations including ROI, cash flow projections, and mortgage calculations with adjustable parameters.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <ChartBar className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Market Analysis</h3>
                <p className="text-gray-600">
                  Real-time market data integration for accurate property valuations and area analysis.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Building className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Property Metrics</h3>
                <p className="text-gray-600">
                  Comprehensive property metrics including cap rate, GRM, and price per square meter calculations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API Integration Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Enterprise API Integration
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Seamlessly integrate our powerful analysis engine into your platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">For Real Estate Platforms</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-[#1BA3FF] mt-1" />
                  <span>RESTful API with comprehensive documentation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-[#1BA3FF] mt-1" />
                  <span>Scalable infrastructure for high-volume analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-[#1BA3FF] mt-1" />
                  <span>Custom integration support and consulting</span>
                </li>
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/register">Get API Access</Link>
              </Button>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <pre className="text-sm text-gray-300">
                <code>{`// Example API Response
{
  "property_analysis": {
    "financial_metrics": {
      "roi": 8.5,
      "cap_rate": 7.2,
      "cash_on_cash": 6.8
    },
    "market_data": {
      "comparable_properties": [...],
      "area_statistics": {...}
    }
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#1BA3FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Make Better Investment Decisions?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of real estate professionals using Proply's analysis tools
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white hover:bg-white/20"
              asChild
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}