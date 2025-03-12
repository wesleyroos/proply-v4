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
  Building,
  TrendingUp,
  Users,
  Globe,
  Shield,
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export default function HomePage() {
  // Structured data for SEO
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
        <meta name="keywords" content="property investment, real estate analytics, rental yield calculator, Airbnb analytics, property analysis, investment strategy" />

        {/* Open Graph tags */}
        <meta property="og:title" content="Proply - Property Investment Intelligence Platform" />
        <meta property="og:description" content="Transform complex real estate data into actionable strategic insights for professional investors." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://proply.com" />
        <meta property="og:image" content="/images/property-technology.png" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Proply - Property Investment Intelligence Platform" />
        <meta name="twitter:description" content="Transform complex real estate data into actionable strategic insights for professional investors." />
        <meta name="twitter:image" content="/images/property-technology.png" />

        {/* Structured data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
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
              Property Investment Intelligence
              <br className="hidden sm:block" />
              At Your Fingertips
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-white/90">
              Make data-driven property investment decisions with our comprehensive suite of analysis tools
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
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

      {/* Core Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Our Core Solutions
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Comprehensive tools for property investment success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Property Analyzer */}
            <Card className="relative overflow-hidden border-2 border-[#1BA3FF]">
              <CardContent className="pt-6">
                <Calculator className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-xl font-bold mb-3">Property Analyzer</h3>
                <p className="text-gray-600 mb-6">
                  Comprehensive property analysis with financial modeling, market insights, and ROI calculations.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-[#1BA3FF]" />
                    <span className="text-sm">Financial modeling</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-[#1BA3FF]" />
                    <span className="text-sm">Market analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#1BA3FF]" />
                    <span className="text-sm">ROI calculations</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/property-analyzer">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Rent Compare */}
            <Card className="relative overflow-hidden border-2 border-[#1BA3FF]">
              <CardContent className="pt-6">
                <Home className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-xl font-bold mb-3">Rent Compare</h3>
                <p className="text-gray-600 mb-6">
                  Compare long-term and short-term rental strategies to maximize your property's earning potential.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-[#1BA3FF]" />
                    <span className="text-sm">Revenue projections</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#1BA3FF]" />
                    <span className="text-sm">Expense analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-[#1BA3FF]" />
                    <span className="text-sm">Market insights</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/rent-compare">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise API */}
            <Card className="relative overflow-hidden border-2 border-[#1BA3FF]">
              <CardContent className="pt-6">
                <Code className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-xl font-bold mb-3">Enterprise API</h3>
                <p className="text-gray-600 mb-6">
                  Integrate our powerful analysis engine directly into your real estate platform.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-[#1BA3FF]" />
                    <span className="text-sm">Full API access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-[#1BA3FF]" />
                    <span className="text-sm">Custom integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#1BA3FF]" />
                    <span className="text-sm">Enterprise support</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/pricing">
                    View Enterprise Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Solutions for Every Professional
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Tailored features for different property investment needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Property Investors */}
            <Card>
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-xl font-bold mb-3">Property Investors</h3>
                <p className="text-gray-600 mb-6">
                  Make confident investment decisions with comprehensive analysis and market insights.
                </p>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/property-analyzer">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Airbnb Managers */}
            <Card>
              <CardContent className="pt-6">
                <Building className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-xl font-bold mb-3">Airbnb Managers</h3>
                <p className="text-gray-600 mb-6">
                  Optimize your portfolio performance with data-driven rental strategy comparisons.
                </p>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/rent-compare">Learn More</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Real Estate Platforms */}
            <Card>
              <CardContent className="pt-6">
                <Globe className="h-12 w-12 text-[#1BA3FF] mb-4" />
                <h3 className="text-xl font-bold mb-3">Real Estate Platforms</h3>
                <p className="text-gray-600 mb-6">
                  Enhance your platform with our enterprise-grade property analysis API.
                </p>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/pricing">View Enterprise Plans</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Trusted By Industry Leaders</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 items-center justify-items-center">
            <img
              src="/images/partners/nox-properties.jpg"
              alt="Nox Properties"
              className="h-16 object-contain"
            />
            <img
              src="/images/partners/prospr-management.jpg"
              alt="Prospr Management"
              className="h-16 object-contain"
            />
            <img
              src="/images/partners/sothebys.jpg"
              alt="Sotheby's International Realty"
              className="h-16 object-contain"
            />
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1BA3FF]">1000+</p>
              <p className="text-gray-600">Active Users</p>
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
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Start Free Trial</Link>
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

      <PublicFooter />
    </div>
  );
}