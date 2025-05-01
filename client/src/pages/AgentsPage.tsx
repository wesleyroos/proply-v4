import { useState } from "react"
import { Link } from "wouter"
import { Helmet } from "react-helmet"
import PublicHeader from "@/components/PublicHeader"
import PublicFooter from "@/components/PublicFooter"
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
  Lightbulb
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
      <Helmet>
        <title>Property Analyzer API™ for Agents | Proply</title>
        <meta name="description" content="Turn every listing into an investment opportunity with automated property analysis that helps you close deals faster." />
      </Helmet>
      
      <PublicHeader />

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
                <CheckCircle className="h-4 w-4 mr-2" /> BENEFITS
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">Why agents love our API</h2>
              <p className="mt-4 text-xl text-gray-600">
                Transform your listings into powerful sales tools with zero extra work
              </p>
            </div>

            <div className="space-y-24">
              {/* Benefit 1 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-600 text-sm font-medium mb-4">
                    STAND OUT FROM COMPETITORS
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">Differentiate your listings</h3>
                  <p className="text-xl text-gray-600 mb-8">
                    In a sea of similar listings, be the only agent offering comprehensive investment insights that help
                    buyers make confident decisions.
                  </p>

                  <ul className="space-y-4">
                    {[
                      "Showcase rental yields and ROI projections",
                      "Highlight investment potential with data",
                      "Provide market comparisons and value analysis",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-1 md:order-2">
                  <div className="relative">
                    <div className="absolute -top-6 -left-6 w-24 h-24 bg-green-100 rounded-full opacity-30 blur-xl"></div>
                    <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                      <div className="grid grid-cols-2 gap-px bg-gray-100">
                        <div className="bg-white p-4">
                          <div className="text-xs text-gray-500 mb-1">Standard Listing</div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Basic property details</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Photos and floor plans</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Location information</span>
                            </li>
                          </ul>
                        </div>
                        <div className="bg-white p-4">
                          <div className="text-xs text-green-600 font-medium mb-1">Your Enhanced Listing</div>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-gray-900 font-medium">Everything in standard listing</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-gray-900 font-medium">Rental yield analysis</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-gray-900 font-medium">ROI projections</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-gray-900 font-medium">Market value assessment</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-gray-900 font-medium">Investment recommendations</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 text-center">
                        <span className="text-sm text-gray-600">
                          <span className="font-medium text-green-600">78%</span> of buyers prefer listings with
                          investment data
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-4">
                    SAVE TIME, CLOSE FASTER
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">Automate investment analysis</h3>
                  <p className="text-xl text-gray-600 mb-8">
                    Stop spending hours creating manual reports. Our API generates comprehensive investment analyses in
                    seconds, automatically.
                  </p>

                  <ul className="space-y-4">
                    {[
                      "Reports generate in under 3 seconds",
                      "No manual data entry or calculations",
                      "Always up-to-date with current market data",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-blue-600" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-1">
                  <div className="relative">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-100 rounded-full opacity-30 blur-xl"></div>
                    <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <h4 className="font-bold text-gray-900">Time Comparison</h4>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">Manual Analysis</span>
                              <span className="font-medium text-gray-900">3-4 hours</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gray-400" style={{ width: "100%" }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600">With Property Analyzer API™</span>
                              <span className="font-medium text-blue-600">3 seconds</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: "1%" }}></div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Save 99.9% of your time</span> while providing more
                                comprehensive investment insights to your clients.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-600 text-sm font-medium mb-4">
                    BUILD TRUST WITH BUYERS
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">Answer tough questions with confidence</h3>
                  <p className="text-xl text-gray-600 mb-8">
                    When buyers ask about ROI, rental yields, or fair value, you'll have data-backed answers ready
                    instantly.
                  </p>

                  <ul className="space-y-4">
                    {[
                      "Justify asking prices with market comparisons",
                      "Show potential returns with rental yield data",
                      "Demonstrate long-term value with ROI projections",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-amber-600" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-1 md:order-2">
                  <div className="relative">
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-100 rounded-full opacity-30 blur-xl"></div>
                    <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="h-5 w-5 text-amber-600" />
                          <h4 className="font-bold text-gray-900">Common Buyer Questions</h4>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {[
                          {
                            question: "Is this property fairly priced?",
                            answer:
                              "Our market analysis shows it's 5% below similar properties in the area, making it a good value.",
                          },
                          {
                            question: "What rental income could I expect?",
                            answer:
                              "Based on current market rates, you could expect R15,000/month, giving a 7.2% yield.",
                          },
                          {
                            question: "Is this a good investment?",
                            answer:
                              "With a projected 5-year ROI of 32% and above-average rental yield, it's a strong investment opportunity.",
                          },
                        ].map((item, i) => (
                          <div key={i} className="p-4">
                            <div className="font-medium text-gray-900 mb-1">{item.question}</div>
                            <div className="text-sm text-gray-600">{item.answer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
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

      <PublicFooter />

      {/* Sample Report Modal */}
      <SampleReportModal isOpen={isReportModalOpen} onClose={closeReportModal} />
    </div>
  )
}