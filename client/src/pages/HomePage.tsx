import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart2,
  Calculator,
  Code,
  Database,
  DollarSign,
  Home,
  LineChart,
  Settings,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src="/proply-logo-1.png" alt="Proply" className="h-8" />
            <div className="flex gap-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#1BA3FF] hover:bg-[#114D9D]">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#114D9D] to-[#1BA3FF] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/property-technology.png"
            alt="Property Technology"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#114D9D]/90 to-[#1BA3FF]/90" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
              Powerful Real Estate Investment
              <br />
              Data at Your Fingertips
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-white/90">
              We deliver you with data-driven insights for strategic
              decision-making in real estate.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white/20" asChild>
                <Link href="#saas">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SaaS Product Section */}
      <section id="saas" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Property Analysis Platform</h2>
            <p className="mt-4 text-xl text-gray-600">
              Comprehensive property analysis for investors and professionals
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <LineChart className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">The Challenge</h3>
                <p className="text-gray-600">
                  Making investment decisions without accurate data and comprehensive analysis
                  leads to missed opportunities and potential losses.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Database className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">The Solution</h3>
                <p className="text-gray-600">
                  Our platform provides detailed property analysis, market insights, and
                  financial projections to guide your investment decisions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <DollarSign className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Analyzing</h3>
                <Link href="/register">
                  <Button className="w-full mt-4">
                    Try Free Analysis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Rental Comparison Section */}
      <section id="comparison" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Rental Strategy Comparison</h2>
            <p className="mt-4 text-xl text-gray-600">
              Compare long-term vs short-term rental potential for your property
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <Home className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">The Challenge</h3>
                <p className="text-gray-600">
                  Deciding between long-term rentals and Airbnb without clear data on
                  potential returns and market dynamics.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Calculator className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">The Solution</h3>
                <p className="text-gray-600">
                  Side-by-side comparison of rental strategies with projected revenues,
                  expenses, and ROI calculations.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <BarChart2 className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Comparing</h3>
                <Link href="/rent-compare">
                  <Button className="w-full mt-4">
                    Compare Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Property Analysis API</h2>
            <p className="mt-4 text-xl text-gray-600">
              Enterprise-grade property analysis engine for your business
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <Settings className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">The Challenge</h3>
                <p className="text-gray-600">
                  Building and maintaining your own property analysis system is
                  time-consuming and expensive.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Code className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">The Solution</h3>
                <p className="text-gray-600">
                  Integrate our powerful analysis engine into your platform with our
                  simple REST API.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Database className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Get API Access</h3>
                <Link href="/api-access">
                  <Button className="w-full mt-4">
                    View Documentation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-[#1BA3FF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Property Investment Strategy?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join industry leaders making data-driven decisions with Proply
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
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
