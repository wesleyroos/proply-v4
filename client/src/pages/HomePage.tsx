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
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { motion } from "framer-motion";

export default function HomePage() {
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

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen">
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

      {/* Hero Section with Modern Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#114D9D] via-[#1BA3FF] to-[#114D9D]">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:32px]" />
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at center, rgba(27,163,255,0.1) 0%, rgba(17,77,157,0.2) 100%)'
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <motion.div 
            className="text-center space-y-8"
            initial="initial"
            animate="animate"
            variants={fadeInUp}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Property Intelligence
              <br className="hidden sm:block" />
              Powered by Technology
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-white/90 leading-relaxed">
              Transform complex real estate data into actionable insights with our
              cutting-edge analytics platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-[#114D9D] hover:bg-white/90"
                asChild
              >
                <Link href="/register">Start Free Analysis</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/pricing">View Enterprise Plans</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Advanced Property Analysis Tools
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive solutions for property investors and professionals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Property Analyzer Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="group hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Calculator className="h-6 w-6 text-[#1BA3FF]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Property Analyzer</h3>
                  <p className="text-gray-600 mb-6">
                    Advanced analysis tools for property valuation, rental yields, and investment potential.
                  </p>
                  <Link href="/property-analyzer">
                    <Button variant="outline" className="w-full group-hover:bg-[#1BA3FF] group-hover:text-white transition-colors duration-300">
                      Explore Analysis Tools
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Rent Compare Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="group hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BarChart2 className="h-6 w-6 text-[#8B5CF6]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Rent Compare</h3>
                  <p className="text-gray-600 mb-6">
                    Compare long-term vs Airbnb rental strategies with data-driven insights.
                  </p>
                  <Link href="/rent-compare">
                    <Button variant="outline" className="w-full group-hover:bg-[#8B5CF6] group-hover:text-white transition-colors duration-300">
                      Start Comparison
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* API Integration Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="group hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Code className="h-6 w-6 text-[#10B981]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">API Integration</h3>
                  <p className="text-gray-600 mb-6">
                    Enterprise-grade property analysis engine for seamless integration.
                  </p>
                  <Link href="/api-docs">
                    <Button variant="outline" className="w-full group-hover:bg-[#10B981] group-hover:text-white transition-colors duration-300">
                      View API Docs
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid md:grid-cols-4 gap-8 items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">Trusted By:</h2>
            </div>
            {['nox-properties', 'prospr-management', 'sothebys'].map((partner, index) => (
              <motion.img
                key={partner}
                src={`/images/partners/${partner}.jpg`}
                alt={partner.replace('-', ' ')}
                className="h-16 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#114D9D] to-[#1BA3FF]">
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Property Investment Strategy?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join industry leaders making data-driven decisions with Proply
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-[#114D9D] hover:bg-white/90"
              asChild
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10"
              asChild
            >
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <PublicFooter />
    </div>
  );
}