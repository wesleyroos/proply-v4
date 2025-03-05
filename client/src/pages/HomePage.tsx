import { Link } from "wouter";
import { Helmet } from "react-helmet";
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
  Building2,
  PieChart,
  TrendingUp,
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function HomePage() {
  // Structured data for SEO remains unchanged
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Proply - Property Investment Intelligence Platform",
    "description": "Transform complex real estate data into actionable strategic insights for professional investors through advanced technological integration.",
    "url": "https://proply.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "{search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <Helmet>
        <title>Proply - Property Investment Intelligence Platform | Real Estate Analytics</title>
        <meta name="description" content="Transform complex real estate data into actionable strategic insights. Compare long-term vs Airbnb rental yields, analyze property investments, and make data-driven decisions." />
        {/* Rest of the meta tags remain unchanged */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      <PublicHeader />

      {/* Redesigned Hero Section with Split Layout */}
      <div className="relative min-h-[90vh] flex items-center bg-gradient-to-r from-[#114D9D] to-[#1BA3FF] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/property-technology.png')] bg-cover bg-center opacity-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-sm font-medium">Property Intelligence Platform</span>
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
                  <span className="block">Powerful Real</span>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                    Estate Analytics
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-white/90 max-w-xl leading-relaxed">
                  We deliver you with data-driven insights for strategic decision-making in real estate.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-[#114D9D] hover:bg-white/90 text-lg px-8 h-14"
                  asChild
                >
                  <Link href="/register">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 h-14"
                  asChild
                >
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-8">
                <div className="flex items-center gap-3 text-white/90">
                  <div className="rounded-full p-2 bg-white/10">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Property Analysis</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="rounded-full p-2 bg-white/10">
                    <PieChart className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Market Insights</span>
                </div>
              </div>
            </div>

            {/* Right Column - Feature Cards */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-transparent blur-3xl -z-10" />
              <div className="grid gap-4">
                <Card className="bg-white/10 backdrop-blur-sm border-0 shadow-xl hover:bg-white/15 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg p-2.5 bg-[#1BA3FF]">
                        <Calculator className="h-6 w-6 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-white">Yield Calculator</h3>
                        <p className="text-white/80">Compare short-term and long-term rental yields instantly</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-sm border-0 shadow-xl hover:bg-white/10 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg p-2.5 bg-[#1BA3FF]">
                        <LineChart className="h-6 w-6 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-white">Market Analysis</h3>
                        <p className="text-white/80">Get real-time property market insights and trends</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the content remains unchanged */}
      <div className="overflow-hidden">
        {/* SaaS Product Section */}
        <section id="saas" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                Property Analyzer
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Comprehensive on-platform property analysis for investors and
                professionals
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
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
                    Make confident investment decisions with our detailed
                    financial modeling and market analysis. Get instant insights
                    into property potential, ROI calculations, and future value
                    projections based on real market data.
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h4 className="text-lg font-semibold text-[#1BA3FF] mb-3">
                    For Real Estate Professionals
                  </h4>
                  <p className="text-gray-600">
                    Elevate your client service with professional-grade property
                    analysis. Present compelling investment cases backed by
                    comprehensive data and detailed financial projections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="overflow-hidden">
          {/* Rental Comparison Section */}
          <section id="comparison" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">Rent Compare</h2>
                <p className="mt-4 text-xl text-gray-600">
                  Compare long-term vs short-term rental potential for your property
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-4">
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
                      Convert prospects into clients with confidence using our
                      comprehensive data-driven analysis. Show potential clients
                      exactly how much more they could earn with professional Airbnb
                      management, backed by precise market data and revenue
                      projections.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h4 className="text-lg font-semibold text-[#1BA3FF] mb-3">
                      For Individual Hosts
                    </h4>
                    <p className="text-gray-600">
                      Whether you're considering Airbnb hosting or already managing
                      your property, get detailed insights into your property's true
                      potential. Make informed decisions about your investment with
                      actual market data, not guesswork.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-4">
                <Card>
                  <CardContent className="pt-6">
                    <Settings className="h-12 w-12 text-[#1BA3FF] mb-4" />
                    <h3 className="text-lg font-semibold mb-2">The Challenge</h3>
                    <p className="text-gray-600">
                      Real estate agencies need quick and accurate property analysis
                      when uploading properties to the market to better assist their
                      clients with transactions.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <Code className="h-12 w-12 text-[#1BA3FF] mb-4" />
                    <h3 className="text-lg font-semibold mb-2">The Solution</h3>
                    <p className="text-gray-600">
                      Automatic property analysis reports generated instantly when
                      you list properties, seamlessly integrated with your existing
                      workflow.
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
                      Streamline your property listing process with automatic
                      analysis reports. Every time you upload a new property, our
                      system generates comprehensive insights that help your agents
                      close deals faster and provide more value to clients.
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h4 className="text-lg font-semibold text-[#1BA3FF] mb-3">
                      For Property Platforms
                    </h4>
                    <p className="text-gray-600">
                      Enhance your platform's value proposition with
                      enterprise-grade property analysis. Our API seamlessly
                      integrates with your existing systems to provide automatic,
                      accurate property insights at scale.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Trusted By Section */}
          <section className="py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-4 gap-8 items-center">
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-900">Trusted By:</h2>
                </div>
                <img
                  src="/images/partners/nox-properties.jpg"
                  alt="Nox Properties"
                  className="h-21 object-contain justify-self-center"
                />
                <img
                  src="/images/partners/prospr-management.jpg"
                  alt="Prospr Management"
                  className="h-21 object-contain justify-self-center"
                />
                <img
                  src="/images/partners/sothebys.jpg"
                  alt="Sotheby's International Realty"
                  className="h-21 object-contain justify-self-center"
                />
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
              <div className="flex flex-col sm:flex-row justify-center gap-4">
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
      </div>

      <PublicFooter />
    </div>
  );
}