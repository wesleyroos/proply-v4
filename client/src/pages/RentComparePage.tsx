import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart2,
  Calculator,
  DollarSign,
  Home,
  LineChart,
  TrendingUp,
  Building,
  ArrowRight,
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function RentComparePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />

      {/* Hero Section */}
      <div className="pt-16 bg-gradient-to-r from-[#114D9D] to-[#1BA3FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white">
              Long-Term vs Short-Term Rental Analysis
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-white/90">
              Make data-driven decisions between traditional rentals and Airbnb with our comprehensive comparison tools
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Start Comparing</Link>
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
              Comprehensive Rental Strategy Analysis
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to evaluate and compare rental strategies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <Calculator className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Revenue Projections</h3>
                <p className="text-gray-600">
                  Detailed income forecasts for both long-term and short-term rental strategies, including seasonal variations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <DollarSign className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Expense Analysis</h3>
                <p className="text-gray-600">
                  Comprehensive breakdown of costs including management fees, cleaning, and maintenance for both strategies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <TrendingUp className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Market Insights</h3>
                <p className="text-gray-600">
                  Real-time market data and occupancy rates for informed decision-making.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Target Market Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Tailored Solutions for Property Professionals
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Powerful tools for both management companies and individual hosts
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">For Airbnb Management Companies</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <BarChart2 className="h-5 w-5 text-[#1BA3FF] mt-1" />
                    <span>Convert prospects with data-driven revenue projections</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <LineChart className="h-5 w-5 text-[#1BA3FF] mt-1" />
                    <span>Show potential earnings increase with professional management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-[#1BA3FF] mt-1" />
                    <span>Portfolio-wide performance analysis and reporting</span>
                  </li>
                </ul>
                <Button className="mt-8 w-full" asChild>
                  <Link href="/pricing">Start Converting More Clients</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-4">For Individual Hosts</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-[#1BA3FF] mt-1" />
                    <span>Evaluate your property's short-term rental potential</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Calculator className="h-5 w-5 text-[#1BA3FF] mt-1" />
                    <span>Compare different rental strategies with confidence</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-[#1BA3FF] mt-1" />
                    <span>Make informed decisions about your investment</span>
                  </li>
                </ul>
                <Button className="mt-8 w-full" asChild>
                  <Link href="/register">Start Your Free Analysis</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#1BA3FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Optimize Your Rental Strategy?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join property managers and hosts making data-driven decisions with Proply
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Get Started Free</Link>
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
