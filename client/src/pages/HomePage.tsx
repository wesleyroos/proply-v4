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
  Sparkles,
  TrendingUp,
  Building,
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
    <div className="min-h-screen bg-black">
      <Helmet>
        <title>Proply - Property Investment Intelligence Platform | Real Estate Analytics</title>
        <meta name="description" content="Transform complex real estate data into actionable strategic insights. Compare long-term vs Airbnb rental yields, analyze property investments, and make data-driven decisions." />
        <meta name="keywords" content="property investment, real estate analytics, rental yield calculator, Airbnb analytics, property analysis, investment strategy" />
        <meta property="og:title" content="Proply - Property Investment Intelligence Platform" />
        <meta property="og:description" content="Transform complex real estate data into actionable strategic insights for professional investors." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://proply.com" />
        <meta property="og:image" content="/images/property-technology.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Proply - Property Investment Intelligence Platform" />
        <meta name="twitter:description" content="Transform complex real estate data into actionable strategic insights for professional investors." />
        <meta name="twitter:image" content="/images/property-technology.png" />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-black to-[#114D9D]">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#114D9D]/20 via-[#1BA3FF]/20 to-[#114D9D]/20 animate-gradient-x" />

        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            background: "radial-gradient(50% 50% at 50% 50%, #1BA3FF 0%, transparent 70%)"
          }} />
          <div className="absolute inset-0" style={{
            background: "radial-gradient(30% 30% at 80% 20%, #114D9D 0%, transparent 70%)"
          }} />
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <Sparkles className="h-4 w-4 text-[#1BA3FF]" />
              <span className="text-white/90">Cutting-edge property analytics</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Property Investment
              <br />
              <span className="bg-gradient-to-r from-[#1BA3FF] to-white bg-clip-text text-transparent">
                Intelligence Platform
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-xl text-white/80">
              Transform complex real estate data into actionable insights with
              our advanced AI-powered analytics platform.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
              <Button
                size="lg"
                className="bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 text-white px-8"
                asChild
              >
                <Link href="/register">Get Started Free</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8"
                asChild
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </section>

      {/* Features Grid */}
      <section className="relative bg-black py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Powerful Analytics Suite
            </h2>
            <p className="text-lg text-white/70">
              Everything you need to make data-driven property investment decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <LineChart className="h-8 w-8 text-[#1BA3FF]" />,
                title: "Property Analysis",
                description: "Comprehensive property analysis with ROI calculations and market comparisons",
                link: "/property-analyzer"
              },
              {
                icon: <BarChart2 className="h-8 w-8 text-[#1BA3FF]" />,
                title: "Rental Comparison",
                description: "Compare long-term vs Airbnb rental potential with our advanced calculator",
                link: "/rent-compare"
              },
              {
                icon: <TrendingUp className="h-8 w-8 text-[#1BA3FF]" />,
                title: "Market Intelligence",
                description: "Real-time market insights and trend analysis for informed decisions",
                link: "/market-intelligence"
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 mb-6">
                    {feature.description}
                  </p>
                  <Link href={feature.link}>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Integration Section */}
      <section className="relative bg-gradient-to-b from-black to-[#114D9D] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Enterprise API Integration
              </h2>
              <p className="text-lg text-white/70 mb-8">
                Integrate our powerful analysis engine directly into your platform
                with our enterprise-grade API.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: <Code />, text: "RESTful API with comprehensive documentation" },
                  { icon: <Database />, text: "Scalable infrastructure for high-volume analysis" },
                  { icon: <Settings />, text: "Custom integration support and consulting" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/70">
                    <div className="text-[#1BA3FF]">{item.icon}</div>
                    {item.text}
                  </li>
                ))}
              </ul>
              <Button
                className="bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 text-white"
                asChild
              >
                <Link href="/register">Get API Access</Link>
              </Button>
            </div>

            {/* Code preview */}
            <div className="bg-black/50 backdrop-blur-sm rounded-lg border border-white/10 p-6">
              <pre className="text-sm text-white/90 overflow-x-auto">
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

      {/* Trusted By Section */}
      <section className="bg-black py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white">Trusted By Industry Leaders</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 items-center opacity-70">
            <div className="text-right">
              <h3 className="text-lg text-white/70">Trusted By:</h3>
            </div>
            {['nox-properties.jpg', 'prospr-management.jpg', 'sothebys.jpg'].map((logo, i) => (
              <img
                key={i}
                src={`/images/partners/${logo}`}
                alt="Partner logo"
                className="h-12 object-contain justify-self-center invert"
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#114D9D] to-[#1BA3FF] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Investment Strategy?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join industry leaders making data-driven decisions with Proply
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-[#1BA3FF] hover:bg-white/90"
              asChild
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
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