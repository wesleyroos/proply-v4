import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  MapPin,
  Shield,
  TrendingUp,
  Zap,
  Database,
  BarChart3,
} from "lucide-react";
import { BackgroundPattern } from "@/components/background-pattern";
import { RiskIndexShowcase } from "@/components/risk-index-showcase";

export default function HomePage() {
  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Proply - An Intelligence Layer for Real Estate",
    "description": "AI-powered data tools for property buyers, agents, and insurers.",
    "url": "https://proply.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "{search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>Proply - An Intelligence Layer for Real Estate | Property Analytics</title>
        <meta name="description" content="AI-powered data tools for property buyers, agents, and insurers. Make better property decisions with Proply's comprehensive intelligence solutions." />
        <meta name="keywords" content="property intelligence, real estate analytics, risk index, property data, AI real estate, insurance risk" />

        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content="Proply - An Intelligence Layer for Real Estate" />
        <meta property="og:description" content="AI-powered data tools for property buyers, agents, and insurers." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://proply.com" />
        <meta property="og:image" content="/images/property-technology.png" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Proply - An Intelligence Layer for Real Estate" />
        <meta name="twitter:description" content="AI-powered data tools for property buyers, agents, and insurers." />
        <meta name="twitter:image" content="/images/property-technology.png" />

        {/* Add structured data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/proply-logo-auth.png" alt="Proply Logo" className="h-8 w-auto" />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#for-insurers" className="text-sm font-medium hover:text-proply-blue transition-colors">
              For Insurers
            </Link>
            <Link href="#for-agents" className="text-sm font-medium hover:text-proply-blue transition-colors">
              For Agents
            </Link>
            <Link href="#for-buyers" className="text-sm font-medium hover:text-proply-blue transition-colors">
              For Buyers
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-proply-blue transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden md:flex border-black text-black hover:bg-black/5">
              Login
            </Button>
            <Button className="bg-black hover:bg-gray-800 text-white">Book a Demo</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        {/* Background Pattern - positioned within main content to scroll with page */}
        <div className="relative">
          <BackgroundPattern />

          {/* Hero Section */}
          <section className="relative py-20 md:py-32 overflow-hidden">
            <div className="container relative z-20">
              <div className="grid gap-12 md:grid-cols-2 items-center">
                <div className="max-w-2xl relative z-10">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                    <span className="text-black">An Intelligence</span>
                    <span className="text-black block">Layer for</span>
                    <span className="text-proply-blue block mt-2">Real Estate.</span>
                  </h1>
                  <p className="mt-6 text-xl text-gray-600 max-w-lg">
                    AI-powered data tools for buyers, agents, and insurers.
                  </p>
                  <div className="mt-10 flex flex-col sm:flex-row gap-4">
                    <Button size="lg" className="bg-black text-white hover:bg-gray-800">
                      Try a Report <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button size="lg" variant="outline" className="border-black text-black hover:bg-black/5">
                      Book a Demo
                    </Button>
                  </div>

                  {/* Trust Bar */}
                  <div className="mt-16 pt-8 border-t">
                    <p className="text-sm font-medium text-gray-500 mb-4">TRUSTED BY</p>
                    <div className="flex flex-wrap gap-8">
                      <div className="h-10 w-36 bg-gray-100 flex items-center justify-center text-gray-800 font-medium rounded-md">
                        Insurers
                      </div>
                      <div className="h-10 w-48 bg-gray-100 flex items-center justify-center text-gray-800 font-medium rounded-md">
                        Real Estate Agents
                      </div>
                      <div className="h-10 w-36 bg-gray-100 flex items-center justify-center text-gray-800 font-medium rounded-md">
                        Buyers & Sellers
                      </div>
                    </div>
                  </div>
                </div>

                {/* This div is intentionally empty to maintain the grid layout */}
                <div></div>
              </div>
            </div>

            {/* Hero Image - positioned absolutely with no gap on the right */}
            <div className="absolute top-[40%] right-0 transform -translate-y-1/2 h-full w-full z-10">
              <div className="relative h-full w-full flex justify-end">
                <img
                  src="/images/property-technology.png"
                  alt="AI Technology for Real Estate"
                  className="object-contain object-right h-full"
                  style={{ position: 'absolute', right: 0 }}
                />
              </div>
            </div>
          </section>

          {/* Pain Points Section */}
          <section className="relative py-20 border-t">
            <div className="container relative z-20">
              <div className="grid gap-12 md:grid-cols-2 items-center">
                <div className="max-w-2xl">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-black">
                    Property decisions
                    <span className="text-proply-blue block mt-2">are broken.</span>
                  </h2>
                  <p className="mt-6 text-xl text-gray-600 max-w-lg">
                    The real estate and insurance industries lack the tools to make data-driven decisions.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Unclear risk exposure",
                      description: "Properties with hidden risks lead to costly insurance claims.",
                      icon: Shield,
                    },
                    {
                      title: "Wasted time on bad deals",
                      description: "Hours spent researching properties that aren't worth it.",
                      icon: TrendingUp,
                    },
                    {
                      title: "No easy access to data",
                      description: "Critical property information is scattered across sources.",
                      icon: ExternalLink,
                    },
                    {
                      title: "Legacy tools",
                      description: "Outdated systems that are slow and difficult to use.",
                      icon: MapPin,
                    },
                  ].map((item, i) => (
                    <div key={i} className="border-l-2 border-proply-blue pl-4">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-proply-blue">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <h3 className="mb-1 text-lg font-bold">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Product Pillars */}
          <section id="products" className="relative py-20 border-t">
            <div className="container relative z-20">
              <div className="grid gap-12 md:grid-cols-2 items-center">
                <div className="max-w-2xl">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-black">
                    The complete
                    <span className="text-proply-blue block mt-2">solution.</span>
                  </h2>
                  <p className="mt-6 text-xl text-gray-600 max-w-lg">
                    Our comprehensive suite of AI-powered property intelligence tools.
                  </p>
                </div>

                {/* New visualization for the right side */}
                <div className="relative">
                  <div className="w-full max-w-md mx-auto md:ml-auto">
                    <div className="relative bg-gradient-to-br from-proply-blue/80 to-proply-blue rounded-3xl p-8 text-white shadow-lg">
                      <h3 className="text-2xl font-bold mb-6">AI-Powered Intelligence</h3>

                      {/* Data flow visualization */}
                      <div className="relative h-64 mb-6">
                        {/* Data sources */}
                        <div className="absolute top-0 left-0 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                          <Database className="h-6 w-6 mb-2 mx-auto" />
                          <div className="text-sm font-medium">Property Data</div>
                        </div>

                        <div className="absolute top-0 right-0 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                          <BarChart3 className="h-6 w-6 mb-2 mx-auto" />
                          <div className="text-sm font-medium">Market Trends</div>
                        </div>

                        <div className="absolute bottom-0 left-0 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                          <MapPin className="h-6 w-6 mb-2 mx-auto" />
                          <div className="text-sm font-medium">Location Data</div>
                        </div>

                        <div className="absolute bottom-0 right-0 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                          <Shield className="h-6 w-6 mb-2 mx-auto" />
                          <div className="text-sm font-medium">Risk Factors</div>
                        </div>

                        {/* Central AI processor */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full h-20 w-20 flex items-center justify-center shadow-lg">
                          <Zap className="h-10 w-10 text-proply-blue" />
                        </div>

                        {/* Connection lines */}
                        <svg
                          className="absolute inset-0 w-full h-full"
                          viewBox="0 0 400 300"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M80,60 L200,150"
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                          <path
                            d="M320,60 L200,150"
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                          <path
                            d="M80,240 L200,150"
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                          <path
                            d="M320,240 L200,150"
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        </svg>
                      </div>

                      <div className="text-center">
                        <div className="font-medium mb-2">Proply's AI Core processes multiple data sources</div>
                        <div className="text-sm text-white/80">
                          Delivering actionable insights for property decisions
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reordered product layout with audience badges */}
                <div className="mt-20 col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      {
                        title: "Risk Index™",
                        description: "Insurance-grade risk analysis for every property.",
                        features: [
                          "Flood, hail & climate risk",
                          "Crime & fire risk assessment",
                          "Comprehensive safety score",
                        ],
                        price: "Used by top insurers",
                        cta: "View Demo",
                        icon: Shield,
                        audience: "For Insurers",
                        id: "for-insurers",
                      },
                      {
                        title: "Property Analyzer API™",
                        description: "Real-time analysis for real estate platforms & agencies.",
                        features: ["Enrich property listings", "Investment insights", "Plug-and-play for enterprise"],
                        price: "Custom pricing for enterprise",
                        cta: "Request Access",
                        icon: ExternalLink,
                        audience: "For Agents",
                        id: "for-agents",
                      },
                      {
                        title: "Deal Score™",
                        description: "Smart, affordable reports for property buyers.",
                        features: ["Rental yields & resale value", "Market comparisons", "Investment potential"],
                        price: "R49/report, no login required",
                        cta: "Try It Now",
                        icon: TrendingUp,
                        audience: "For Buyers",
                        id: "for-buyers",
                        link: "/dealscore",
                      },
                    ].map((product, i) => (
                      <div
                        key={i}
                        id={product.id}
                        className="group relative overflow-hidden border-t-2 border-proply-blue pt-6"
                      >
                        {/* Icon and Badge in same row */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-proply-blue">
                            <product.icon className="h-6 w-6" />
                          </div>
                          <div className="px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-xs font-medium">
                            {product.audience}
                          </div>
                        </div>

                        <h3 className="mb-2 text-2xl font-bold">{product.title}</h3>
                        <p className="mb-6 text-gray-500">{product.description}</p>
                        <ul className="mb-6 space-y-2">
                          {product.features.map((feature, j) => (
                            <li key={j} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-proply-blue" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mb-6 text-sm font-medium text-gray-500">{product.price}</div>
                        <Link href={product.link || "#"}>
                          <Button className="w-full bg-black hover:bg-gray-800 text-white">
                            {product.cta} <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Live Demo Preview */}
          <section id="demo" className="relative py-20 border-t">
            <div className="container relative z-20">
              <div className="mb-12">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-black">
                  See how Proply
                  <span className="text-proply-blue block mt-2">makes decisions easier.</span>
                </h2>
                <p className="mt-6 text-xl text-gray-600 max-w-lg">
                  Try our interactive demo to experience the power of property intelligence.
                </p>
              </div>

              {/* Risk Index Showcase */}
              <RiskIndexShowcase />
            </div>
          </section>

          {/* Testimonials */}
          <section id="testimonials" className="relative py-20 border-t">
            <div className="container relative z-20">
              <div className="grid gap-12 md:grid-cols-2 items-center">
                <div className="max-w-2xl">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-black">
                    Testimonials
                    <span className="text-proply-blue block mt-2">we hope to have soon.</span>
                  </h2>
                  <p className="mt-6 text-xl text-gray-600 max-w-lg">
                    We're new here, but here's what we imagine our future clients might say about us if they existed
                    yet.
                  </p>

                  <div className="mt-10 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-proply-blue">100,000+</div>
                      <div className="mt-1 text-sm text-gray-500">Reports we aim to do monthly</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-proply-blue">98%</div>
                      <div className="mt-1 text-sm text-gray-500">Satisfaction goal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-proply-blue">485</div>
                      <div className="mt-1 text-sm text-gray-500">Coffees to make this site</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      quote:
                        "Proply completely revolutionized how we assess property risk! At least that's what we hope they'll say after they try our product.",
                      author: "Future Client",
                      role: "Insurance Company We're Courting",
                    },
                    {
                      quote:
                        "Our clients are making smarter decisions with confidence! Well, they will be once they start using our Deal Score feature.",
                      author: "Potential Agent",
                      role: "Real Estate Agency We'd Love to Work With",
                    },
                    {
                      quote:
                        "Integrating their API was so seamless, it was like it was made for us! This is the feedback we're designing for.",
                      author: "Dream Customer",
                      role: "Tech Company on Our Wishlist",
                    },
                  ].map((testimonial, i) => (
                    <div key={i} className="border-l-2 border-proply-blue pl-6 py-2">
                      <p className="mb-3 text-gray-700">"{testimonial.quote}"</p>
                      <div>
                        <div className="font-medium">{testimonial.author}</div>
                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section id="contact" className="relative py-20 border-t">
            <div className="container relative z-20">
              <div className="grid gap-12 md:grid-cols-2 items-center">
                <div className="max-w-2xl">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-black">
                    Get access to
                    <span className="text-proply-blue block mt-2">South Africa's smartest property data.</span>
                  </h2>
                  <p className="mt-6 text-xl text-gray-600 max-w-lg">Schedule a call with our team to learn more.</p>
                </div>

                <div className="relative">
                  <div className="w-full max-w-md mx-auto md:ml-auto">
                    <div className="bg-white rounded-xl shadow-lg border p-8">
                      <h3 className="text-xl font-bold mb-6 text-gray-900">Request Access</h3>
                      <div className="space-y-4">
                        <div>
                          <Input
                            type="text"
                            placeholder="Full Name"
                            className="border-gray-200 focus-visible:ring-proply-blue"
                          />
                        </div>
                        <div>
                          <Input
                            type="email"
                            placeholder="Email Address"
                            className="border-gray-200 focus-visible:ring-proply-blue"
                          />
                        </div>
                        <div>
                          <Input
                            type="text"
                            placeholder="Company"
                            className="border-gray-200 focus-visible:ring-proply-blue"
                          />
                        </div>
                        <div>
                          <select className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proply-blue">
                            <option value="">I'm interested in...</option>
                            <option value="deal-score">Deal Score</option>
                            <option value="risk-index">Risk Index</option>
                            <option value="property-api">Property Analyzer API</option>
                          </select>
                        </div>
                        <Button className="w-full bg-proply-blue hover:bg-proply-blue/90 text-white">
                          Send Enquiry
                        </Button>
                        <div className="text-center text-xs text-gray-500">
                          Or{" "}
                          <Link href="#" className="text-proply-blue hover:underline">
                            schedule a demo call
                          </Link>{" "}
                          with our team
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer - with solid background to hide pattern */}
      <footer className="bg-white py-12 border-t relative z-30">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center">
                <img src="/proply-logo-auth.png" alt="Proply Logo" width={120} height={40} className="h-8 w-auto" />
              </div>
              <p className="mt-4 text-sm text-gray-500">
                The intelligence layer for the real estate and insurance industries.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-medium">Products</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="#for-insurers" className="hover:text-proply-blue">
                    Risk Index
                  </Link>
                </li>
                <li>
                  <Link href="#for-agents" className="hover:text-proply-blue">
                    Property Analyzer API
                  </Link>
                </li>
                <li>
                  <Link href="/dealscore" className="hover:text-proply-blue">
                    Deal Score
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-medium">Company</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-lg font-medium">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-proply-blue">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-gray-500">
            <p>© {currentYear} Proply. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}