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
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#114D9D] to-[#1BA3FF]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#114D9D]/90 to-[#1BA3FF]/90" />
        <div className="absolute inset-0 z-10">
          <img
            src="/images/property-technology.png"
            alt="Property Technology"
            className="w-full h-full object-cover opacity-75"
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <div className="text-center space-y-12">
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
              <Button size="lg" variant="secondary">
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white hover:bg-white/20"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted By Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 items-center">
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">
                Trusted By:
              </h2>
            </div>
            <img
              src="/images/partners/nox-properties.jpg"
              alt="Nox Properties"
              className="h-20 object-contain justify-self-center"
            />
            <img
              src="/images/partners/prospr-management.jpg"
              alt="Prospr Management"
              className="h-20 object-contain justify-self-center"
            />
            <img
              src="/images/partners/sothebys.jpg"
              alt="Sotheby's International Realty"
              className="h-20 object-contain justify-self-center"
            />
          </div>
        </div>
      </section>

      {/* SaaS Product Section */}
      <section id="saas" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Property Analyzer
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Comprehensive on-platform property analysis for investors and professionals
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <LineChart className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">The Challenge</h3>
                <p className="text-gray-600">
                  Making investment decisions without accurate data and
                  comprehensive analysis leads to missed opportunities and
                  potential losses.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Database className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">The Solution</h3>
                <p className="text-gray-600">
                  Our platform provides detailed property analysis, market
                  insights, and financial projections to guide your investment
                  decisions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <DollarSign className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Analyzing</h3>
                <div className="flex flex-col gap-4 mt-4">
                  <Link href="/property-analyzer">
                    <Button variant="outline" className="w-full">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full">
                      Try Free Analysis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Targeted Property Analysis Section */}
          <div className="mt-16 max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Comprehensive Analysis for Every Stakeholder
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-lg font-semibold text-[#1BA3FF] mb-3">
                  For Property Investors
                </h4>
                <p className="text-gray-600">
                  Make confident investment decisions with our detailed financial modeling
                  and market analysis. Get instant insights into property potential, ROI
                  calculations, and future value projections based on real market data.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-lg font-semibold text-[#1BA3FF] mb-3">
                  For Real Estate Professionals
                </h4>
                <p className="text-gray-600">
                  Elevate your client service with professional-grade property analysis.
                  Present compelling investment cases backed by comprehensive data and
                  detailed financial projections.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rental Comparison Section */}
      <section id="comparison" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Rent Compare
            </h2>
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
                  Deciding between long-term rentals and Airbnb without clear
                  data on potential returns and market dynamics.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Calculator className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">The Solution</h3>
                <p className="text-gray-600">
                  Side-by-side comparison of rental strategies with projected
                  revenues, expenses, and ROI calculations.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <BarChart2 className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Comparing</h3>
                <div className="flex flex-col gap-4 mt-4">
                  <Link href="/rent-compare">
                    <Button variant="outline" className="w-full">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full">
                      Compare Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Targeted Airbnb Management Section */}
          <div className="mt-16 max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Transform Your Airbnb Management Business
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-lg font-semibold text-[#1BA3FF] mb-3">
                  For Management Companies
                </h4>
                <p className="text-gray-600">
                  Convert prospects into clients with confidence using our comprehensive
                  data-driven analysis. Show potential clients exactly how much more they
                  could earn with professional Airbnb management, backed by precise market
                  data and revenue projections.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-lg font-semibold text-[#1BA3FF] mb-3">
                  For Individual Hosts
                </h4>
                <p className="text-gray-600">
                  Whether you're considering Airbnb hosting or already managing your
                  property, get detailed insights into your property's true potential.
                  Make informed decisions about your investment with actual market data,
                  not guesswork.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section id="api" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Property Analyzer (API)
            </h2>
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
                  Real estate agencies need quick and accurate property analysis when uploading properties to the market to better assist their clients with transactions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Code className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">The Solution</h3>
                <p className="text-gray-600">
                  Automatic property analysis reports generated instantly when you
                  list properties, seamlessly integrated with your existing workflow.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Database className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2">Get API Access</h3>
                <div className="flex flex-col gap-4 mt-4">
                  <Link href="/property-analyzer">
                    <Button variant="outline" className="w-full">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button className="w-full">
                      View Enterprise Plans
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Targeted API Integration Section */}
          <div className="mt-16 max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Empower Your Real Estate Platform
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-lg font-semibold text-[#1BA3FF] mb-3">
                  For Real Estate Agencies
                </h4>
                <p className="text-gray-600">
                  Streamline your property listing process with automatic analysis reports.
                  Every time you upload a new property, our system generates comprehensive
                  insights that help your agents close deals faster and provide more value
                  to clients.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h4 className="text-lg font-semibold text-[#1BA3FF] mb-3">
                  For Property Platforms
                </h4>
                <p className="text-gray-600">
                  Enhance your platform's value proposition with enterprise-grade property
                  analysis. Our API seamlessly integrates with your existing systems to
                  provide automatic, accurate property insights at scale.
                </p>
              </div>
            </div>
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
            <Button size="lg" variant="secondary">
              Get Started Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white hover:bg-white/20"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}