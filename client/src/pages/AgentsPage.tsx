"use client"

import { useState } from "react"
import { Link } from "wouter"
import {
  ArrowRight,
  Check,
  Clock,
  Zap,
  FileText,
  BarChart3,
  MessageSquare,
  Code,
  TrendingUp,
  Sparkles,
  DollarSign,
  PercentCircle,
  Home,
  Users,
  Share2,
  Upload,
  CheckCircle,
  Star,
  Lightbulb,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SampleReportModal } from "@/components/sample-report-modal"

export default function AgentsPage() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  const openReportModal = () => {
    setIsReportModalOpen(true)
  }

  const closeReportModal = () => {
    setIsReportModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <img src="/proply-logo.png" alt="Proply Logo" width={120} height={40} className="h-8 w-auto" />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/for-insurers" className="text-sm font-medium hover:text-proply-blue transition-colors">
              For Insurers
            </Link>
            <Link href="/for-agents" className="text-sm font-medium text-proply-blue transition-colors">
              For Agents
            </Link>
            <div className="relative flex flex-col items-center">
              <span className="text-sm font-medium text-gray-500 cursor-default">For Buyers</span>
              <div className="absolute -bottom-4">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-proply-blue/10 text-proply-blue">
                  Soon
                </span>
              </div>
            </div>
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

      <main>
        {/* Hero Section - Split design with angled divider */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white z-0"></div>

          {/* Angled background for right side */}
          <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-proply-blue clip-path-polygon-[0_0,_100%_0,_100%_100%,_15%_100%] z-0"></div>

          <div className="container relative z-10 py-24">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-6">
                  <TrendingUp className="h-4 w-4 mr-2" /> Property Analyzer API™
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                  Close deals faster with <span className="text-proply-blue">investment insights</span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 max-w-lg">
                  Automatically generate comprehensive investment reports for every property you list. No extra work
                  required.
                </p>

                <div className="mt-10 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
                  <Button size="lg" className="bg-proply-blue hover:bg-proply-blue/90 text-white w-full sm:w-auto">
                    Request API Access <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                    onClick={openReportModal}
                  >
                    See Sample Report
                  </Button>
                </div>

                <div className="mt-12 flex items-center gap-6">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Trusted by <span className="font-medium">500+</span> agents across South Africa
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-16 -left-16 w-32 h-32 bg-yellow-100 rounded-full opacity-50 blur-2xl"></div>
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-proply-blue/20 rounded-full opacity-50 blur-xl"></div>

                <div className="relative bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">Investment Analysis</h3>
                        <p className="text-sm text-gray-500">Automatically generated for your listings</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                          82
                        </div>
                        <span className="text-sm font-medium text-green-600">Good Deal</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Rental Yield</div>
                        <div className="text-lg font-semibold text-gray-900">7.2%</div>
                        <div className="text-xs text-green-600">Above area average</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">ROI (5-Year)</div>
                        <div className="text-lg font-semibold text-gray-900">32%</div>
                        <div className="text-xs text-green-600">Strong growth potential</div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Price vs. Market</span>
                          <span className="font-medium text-amber-600">5% Above</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: "65%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Break-even Rent</span>
                          <span className="font-medium text-gray-900">R12,500/month</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-proply-blue" style={{ width: "78%" }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">Generated in 2.8 seconds</div>
                      <Button
                        size="sm"
                        className="bg-proply-blue hover:bg-proply-blue/90 text-white"
                        onClick={openReportModal}
                      >
                        View Full Report
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Horizontal timeline */}
        <section className="py-24 bg-gray-50">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                <Sparkles className="h-4 w-4 mr-2" /> SEAMLESS INTEGRATION
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">How it works</h2>
              <p className="mt-4 text-xl text-gray-600">
                Our API integrates with your existing workflow to deliver investment reports automatically
              </p>
            </div>

            <div className="relative mt-20">
              {/* Horizontal line */}
              <div className="absolute top-16 left-0 right-0 h-0.5 bg-gray-200 hidden md:block"></div>

              <div className="grid md:grid-cols-5 gap-8">
                {[
                  {
                    title: "Upload Property",
                    description: "List a property via your agency's website or CRM",
                    icon: Upload,
                    step: "1",
                  },
                  {
                    title: "Listing Syndicated",
                    description: "Property is pushed to Property24, Private Property, and Proply",
                    icon: Share2,
                    step: "2",
                  },
                  {
                    title: "Analysis Triggered",
                    description: "Our AI analyzes the property using market data",
                    icon: Zap,
                    step: "3",
                  },
                  {
                    title: "Report Generated",
                    description: "Comprehensive investment report is created",
                    icon: FileText,
                    step: "4",
                  },
                  {
                    title: "Close Faster",
                    description: "Share insights with buyers to accelerate sales",
                    icon: Users,
                    step: "5",
                  },
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <div className="flex flex-col items-center">
                      <div className="relative z-10 w-12 h-12 rounded-full bg-proply-blue text-white flex items-center justify-center font-bold text-lg mb-6">
                        {item.step}
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center h-full w-full">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proply-blue/10 text-proply-blue mx-auto">
                          <item.icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section - Alternating layout */}
        <section className="py-24">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                <Lightbulb className="h-4 w-4 mr-2" /> WHY AGENTS LOVE US
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">Benefits for real estate agents</h2>
              <p className="mt-4 text-xl text-gray-600">
                Turn every listing into a compelling investment opportunity with data-driven insights
              </p>
            </div>

            <div className="space-y-32">
              {/* Benefit 1 */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                    <Clock className="h-4 w-4 mr-2" /> SAVE TIME
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">Close deals 37% faster</h3>
                  <p className="text-lg text-gray-600 mb-8">
                    Stop manually gathering data for potential investors. Our API automatically analyzes every property
                    listing and generates comprehensive investment reports instantly.
                  </p>

                  <ul className="space-y-4">
                    {[
                      "Automatic generation for every listing",
                      "No need to manually crunch numbers",
                      "Instantly answer investor questions with confidence",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <div className="aspect-video bg-gray-100">
                    <img
                      src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
                      alt="Agent discussing property with client"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="order-2 md:order-1 relative rounded-2xl overflow-hidden shadow-xl">
                  <div className="aspect-video bg-gray-100">
                    <img
                      src="https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
                      alt="Property investment dashboard"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="order-1 md:order-2">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                    <DollarSign className="h-4 w-4 mr-2" /> INCREASE VALUE
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">Convert browsers into buyers</h3>
                  <p className="text-lg text-gray-600 mb-8">
                    Show potential buyers the true investment potential of each property with detailed ROI calculations,
                    yield projections, and market comparisons.
                  </p>

                  <ul className="space-y-4">
                    {[
                      "Detailed rental yield projections",
                      "Comprehensive 20-year ROI forecasts",
                      "Market comparison data and price analysis",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                    <BarChart3 className="h-4 w-4 mr-2" /> STAND OUT
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">Differentiate from competitors</h3>
                  <p className="text-lg text-gray-600 mb-8">
                    Be the agent that offers more than just property details. Provide sophisticated investment analysis
                    that positions you as the go-to expert for serious property investors.
                  </p>

                  <ul className="space-y-4">
                    {[
                      "White-labeled reports with your branding",
                      "Position yourself as an investment expert",
                      "Generate more referrals from impressed clients",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <div className="aspect-video bg-gray-100">
                    <img
                      src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80"
                      alt="Professional real estate agent"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Grid layout */}
        <section className="py-24 bg-gray-50">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                <Code className="h-4 w-4 mr-2" /> API FEATURES
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">Powerful features</h2>
              <p className="mt-4 text-xl text-gray-600">
                A comprehensive API that delivers sophisticated investment analysis instantly
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Automated Property Analysis",
                  description:
                    "Instant calculation of key investment metrics including rental yields, ROI, cap rates, and more.",
                  icon: Zap,
                },
                {
                  title: "Comprehensive Reports",
                  description:
                    "Detailed PDF reports with visual charts and graphs that break down investment potential.",
                  icon: FileText,
                },
                {
                  title: "Market Comparisons",
                  description:
                    "Analyze how each property compares to similar listings in the area by price and investment metrics.",
                  icon: BarChart3,
                },
                {
                  title: "Dual Strategy Analysis",
                  description:
                    "Compare short-term vs. long-term rental scenarios to identify the optimal investment strategy.",
                  icon: TrendingUp,
                },
                {
                  title: "Investment Projections",
                  description:
                    "20-year forecasts for property value appreciation, rental income growth, and equity buildup.",
                  icon: PercentCircle,
                },
                {
                  title: "White Labeling",
                  description:
                    "Customize reports with your agency's branding, logos, and contact information.",
                  icon: MessageSquare,
                },
                {
                  title: "Deal Scoring",
                  description:
                    "Proprietary algorithm that rates each property's investment potential on a scale of 1-100.",
                  icon: CheckCircle,
                },
                {
                  title: "Area Risk Profiles",
                  description:
                    "Detailed risk assessments for different neighborhoods based on historical data and future projections.",
                  icon: Home,
                },
                {
                  title: "Real-Time Updates",
                  description:
                    "Continuously updated analysis based on the latest market data and economic indicators.",
                  icon: Clock,
                },
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proply-blue/10 text-proply-blue">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                <Star className="h-4 w-4 mr-2" /> TESTIMONIALS
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">What agents are saying</h2>
              <p className="mt-4 text-xl text-gray-600">
                Hear from real estate professionals who are already using the Property Analyzer API
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote:
                    "The investment reports have transformed how I sell properties. Investors love the detailed analysis and I've closed deals 40% faster since adding these reports to my listings.",
                  name: "Sarah Johnson",
                  title: "Principal Agent, Pam Golding Properties",
                  avatar: "https://randomuser.me/api/portraits/women/45.jpg",
                },
                {
                  quote:
                    "As a luxury property specialist, my clients expect sophisticated insights. These investment reports provide exactly what my high-net-worth clients need to make confident decisions.",
                  name: "Michael Dawson",
                  title: "Luxury Property Specialist, Seeff",
                  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
                },
                {
                  quote:
                    "The API integration was seamless with our existing CRM. Now every property listing automatically generates an investment report that gives us a competitive edge in the market.",
                  name: "Thandi Nkosi",
                  title: "Managing Director, RE/MAX Living",
                  avatar: "https://randomuser.me/api/portraits/women/23.jpg",
                },
              ].map((testimonial, i) => (
                <div key={i} className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
                  <div className="flex items-center gap-1 text-amber-400 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to transform your property listings?</h2>
              <p className="text-xl text-gray-300 mb-10">
                Join hundreds of successful agents already using the Property Analyzer API
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-12 max-w-2xl mx-auto">
                <div className="bg-gray-800 rounded-xl p-6 text-left">
                  <h3 className="text-xl font-bold mb-4">Standard API Access</h3>
                  <p className="text-gray-300 mb-4">Perfect for individual agents and small teams</p>
                  <div className="text-3xl font-bold mb-4">
                    R1,999<span className="text-lg font-normal text-gray-400">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {[
                      "Up to 50 properties analyzed per month",
                      "White-labeled branded reports",
                      "Email delivery to clients",
                      "Basic API integration",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-proply-blue/20 text-proply-blue flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-proply-blue hover:bg-proply-blue/90">Request Access</Button>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-proply-blue text-white text-xs font-bold px-3 py-1">
                    MOST POPULAR
                  </div>
                  <h3 className="text-xl font-bold mb-4">Enterprise API Access</h3>
                  <p className="text-gray-300 mb-4">For agencies and large brokerage teams</p>
                  <div className="text-3xl font-bold mb-4">
                    Custom<span className="text-lg font-normal text-gray-400"> pricing</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {[
                      "Unlimited properties analyzed",
                      "Full CRM integration",
                      "Custom feature development",
                      "Dedicated account manager",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-proply-blue/20 text-proply-blue flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-white text-gray-900 hover:bg-gray-100">Book a Demo</Button>
                </div>
              </div>

              <p className="text-sm text-gray-400">
                All plans include free technical support and regular feature updates
              </p>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-24" id="contact">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Stay updated</h2>
              <p className="text-xl text-gray-600 mb-10">
                Get the latest news and updates about our property investment tools
              </p>

              <div className="flex max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="rounded-r-none border-r-0 flex-1"
                />
                <Button className="rounded-l-none bg-proply-blue hover:bg-proply-blue/90">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src="/proply-logo.png" alt="Proply Logo" width={120} height={40} className="h-8 w-auto mb-6" />
              <p className="text-gray-400 mb-6">
                Proply provides AI-powered property investment analysis tools for real estate professionals and investors.
              </p>
              <div className="flex space-x-4">
                {["twitter", "facebook", "instagram", "linkedin"].map((social) => (
                  <a
                    key={social}
                    href={`#${social}`}
                    className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                  >
                    <span className="sr-only">{social}</span>
                    <div className="h-5 w-5 text-gray-300"></div>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Products</h3>
              <ul className="space-y-3">
                {["Property Analyzer API", "Risk Index", "Deal Score", "Market Intelligence"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                {["About Us", "Careers", "Blog", "Legal", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Contact</h3>
              <ul className="space-y-3 text-gray-400">
                <li>21 Main Road</li>
                <li>Cape Town, South Africa</li>
                <li>info@proply.com</li>
                <li>+27 21 123 4567</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-gray-500 flex justify-between">
            <div>© {new Date().getFullYear()} Proply. All rights reserved.</div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-gray-300 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sample Report Modal */}
      <SampleReportModal isOpen={isReportModalOpen} onClose={closeReportModal} />
    </div>
  )
}