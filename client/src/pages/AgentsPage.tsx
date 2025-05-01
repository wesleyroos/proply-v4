import { useState } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SampleReportModal } from "@/components/sample-report-modal";

export default function AgentsPage() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("propdata");

  const openReportModal = () => {
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Property Analyzer API™ for Agents | Proply</title>
        <meta
          name="description"
          content="Turn every listing into an investment opportunity with automated property analysis that helps you close deals faster."
        />
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
                  <TrendingUp className="h-4 w-4 mr-2" /> Property Analyzer
                  API™
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                  Close deals faster with{" "}
                  <span className="text-proply-blue">investment insights</span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 max-w-lg">
                  Automatically generate comprehensive investment reports for
                  every property you list. No extra work required.
                </p>

                <div className="mt-10 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
                  <Button
                    size="lg"
                    className="bg-proply-blue hover:bg-proply-blue/90 text-white w-full sm:w-auto"
                  >
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
                    Trusted by <span className="font-medium">500+</span> agents
                    across South Africa
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
                        <h3 className="font-bold text-lg">
                          Investment Analysis
                        </h3>
                        <p className="text-sm text-gray-500">
                          Automatically generated for your listings
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                          82
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          Good Deal
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">
                          Rental Yield
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          7.2%
                        </div>
                        <div className="text-xs text-green-600">
                          Above area average
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">
                          ROI (5-Year)
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          32%
                        </div>
                        <div className="text-xs text-green-600">
                          Strong growth potential
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            Price vs. Market
                          </span>
                          <span className="font-medium text-amber-600">
                            5% Above
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: "65%" }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Break-even Rent</span>
                          <span className="font-medium text-gray-900">
                            R12,500/month
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-proply-blue"
                            style={{ width: "78%" }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Generated in 2.8 seconds
                      </div>
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
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                How it works
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Our API integrates with your existing workflow to deliver
                investment reports automatically
              </p>
            </div>

            <div className="relative mt-20">
              {/* Horizontal line */}
              <div className="absolute top-16 left-0 right-0 h-0.5 bg-gray-200 hidden md:block"></div>

              <div className="grid md:grid-cols-5 gap-8">
                {[
                  {
                    title: "Upload Property",
                    description:
                      "List a property via your agency's website or CRM",
                    icon: Upload,
                    step: "1",
                  },
                  {
                    title: "Listing Syndicated",
                    description:
                      "Property is pushed to Property24, Private Property, and Proply",
                    icon: Share2,
                    step: "2",
                  },
                  {
                    title: "Analysis Triggered",
                    description:
                      "Our AI analyzes the property using market data",
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
                    description:
                      "Share insights with buyers to accelerate sales",
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
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
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
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                <Lightbulb className="h-4 w-4 mr-2" /> WHY AGENTS LOVE US
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                Stand out from other agents
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Transform every property listing into a compelling investment
                opportunity
              </p>
            </div>

            <div className="space-y-24">
              {/* Benefit 1 */}
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-600 text-sm font-medium mb-4">
                    <Clock className="h-4 w-4 mr-2" /> SAVE TIME
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Close deals faster with instant investment insights
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Stop manually calculating investment returns. Our API
                    instantly generates comprehensive reports that answer the
                    most common investor questions before they're even asked.
                  </p>

                  <div className="space-y-4">
                    {[
                      "Automated analysis of each property's investment potential",
                      "Detailed ROI calculations that investor buyers need",
                      "White-labeled reports that showcase your expertise",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative bg-gray-100 rounded-2xl p-8 md:p-12">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="font-medium text-gray-900">
                        Common Investor Questions - Instantly Answered
                      </h4>
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
                          <div className="font-medium text-gray-900 mb-1">
                            {item.question}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.answer}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Report Features - Card grid */}
        <section className="py-24 bg-gray-900 text-white">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium mb-4">
                <FileText className="h-4 w-4 mr-2" /> COMPREHENSIVE REPORTS
              </div>
              <h2 className="text-3xl md:text-5xl font-bold">
                What's inside each report
              </h2>
              <p className="mt-4 text-xl text-gray-300">
                Every report includes detailed investment metrics that help
                buyers make confident decisions
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Rental Yield Analysis",
                  description:
                    "Detailed breakdown of potential rental income and yield compared to market averages.",
                  icon: PercentCircle,
                  color: "bg-green-500/10 text-green-400",
                },
                {
                  title: "ROI Projections",
                  description:
                    "Comprehensive return on investment calculations showing short and long-term potential.",
                  icon: TrendingUp,
                  color: "bg-blue-500/10 text-blue-400",
                },
                {
                  title: "Market Value Assessment",
                  description:
                    "Compare listing price against estimated market value based on recent comparable sales.",
                  icon: BarChart3,
                  color: "bg-purple-500/10 text-purple-400",
                },
                {
                  title: "Cash Flow Analysis",
                  description:
                    "Detailed monthly and annual cash flow projections including all expenses and income.",
                  icon: DollarSign,
                  color: "bg-amber-500/10 text-amber-400",
                },
                {
                  title: "Neighborhood Insights",
                  description:
                    "Key data about the area including growth trends, amenities, and investment potential.",
                  icon: Home,
                  color: "bg-red-500/10 text-red-400",
                },
                {
                  title: "Investment Recommendations",
                  description:
                    "Clear, actionable insights to help buyers make informed decisions quickly.",
                  icon: Sparkles,
                  color: "bg-indigo-500/10 text-indigo-400",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div
                    className={`w-12 h-12 rounded-full ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-12">
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100"
                onClick={openReportModal}
              >
                View Sample Report <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Integration Options - Tabs */}
        <section className="py-24">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                <Code className="h-4 w-4 mr-2" /> FLEXIBLE INTEGRATION
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                Choose your integration method
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Multiple ways to connect with our API, from simple no-code
                options to advanced integrations
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap border-b border-gray-200 mb-8">
                <button
                  onClick={() => setActiveTab("propdata")}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === "propdata"
                      ? "text-proply-blue border-b-2 border-proply-blue"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  PropData Integration
                </button>
                <button
                  onClick={() => setActiveTab("direct")}
                  className={`px-6 py-3 text-sm font-medium ${
                    activeTab === "direct"
                      ? "text-proply-blue border-b-2 border-proply-blue"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Direct API
                </button>
              </div>

              {activeTab === "propdata" && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-8 bg-gray-50 flex items-center">
                      <div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-medium mb-4">
                          EASIEST OPTION
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          PropData Integration
                        </h3>
                        <p className="text-gray-600 mb-6">
                          The simplest way to get started. Just inform PropData
                          that you wish to use Proply, and we'll handle the
                          rest.
                        </p>

                        <ul className="space-y-3 mb-6">
                          <li className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">
                              No account setup or configuration needed
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">
                              Works with your existing listings
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">
                              No technical knowledge required
                            </span>
                          </li>
                        </ul>

                        <Button className="bg-proply-blue hover:bg-proply-blue/90 text-white">
                          Contact PropData{" "}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-8 flex items-center">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-4">
                          How it works
                        </h4>
                        <ol className="space-y-4">
                          <li className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-sm flex-shrink-0 mt-0.5">
                              1
                            </div>
                            <span className="text-gray-700">
                              Contact PropData and inform them you want to use
                              Proply
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-sm flex-shrink-0 mt-0.5">
                              2
                            </div>
                            <span className="text-gray-700">
                              We set up the integration directly with PropData
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-sm flex-shrink-0 mt-0.5">
                              3
                            </div>
                            <span className="text-gray-700">
                              Investment reports are automatically generated for
                              your listings and sent to your inbox
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-sm flex-shrink-0 mt-0.5">
                              4
                            </div>
                            <span className="text-gray-700">
                              Share reports with clients or embed them on your
                              listings
                            </span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "direct" && (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-8 bg-gray-50 flex items-center">
                      <div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mb-4">
                          ADVANCED INTEGRATION
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          Direct API Access
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Full control over the integration process. Connect
                          directly to our API endpoints for maximum flexibility
                          and customization.
                        </p>

                        <ul className="space-y-3 mb-6">
                          <li className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">
                              RESTful API with comprehensive documentation
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">
                              Webhooks for real-time updates
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">
                              Custom integration options
                            </span>
                          </li>
                        </ul>

                        <Button className="bg-proply-blue hover:bg-proply-blue/90 text-white">
                          Request API Access{" "}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-8 flex items-center">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-4">
                          Sample API Request
                        </h4>
                        <div className="bg-gray-900 rounded-lg p-4 mb-6">
                          <pre className="text-sm text-gray-100 font-mono overflow-auto">
                            {`// Generate investment analysis
const response = await fetch('api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    address: '123 Main St',
    price: 2500000,
    bedrooms: 3,
    type: 'apartment'
  })
});

const analysis = await response.json();
console.log(analysis);`}
                          </pre>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-sm flex-shrink-0 mt-0.5">
                              1
                            </div>
                            <span className="text-gray-700">
                              Request your API credentials through our dashboard
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-sm flex-shrink-0 mt-0.5">
                              2
                            </div>
                            <span className="text-gray-700">
                              Integrate the API endpoints into your application
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-sm flex-shrink-0 mt-0.5">
                              3
                            </div>
                            <span className="text-gray-700">
                              Start generating investment reports
                              programmatically
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Testimonials - Carousel style */}
        <section className="py-24 bg-gray-50">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                <Star className="h-4 w-4 mr-2" /> TESTIMONIALS
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                What agents are saying
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Hear from real estate professionals who are using Property
                Analyzer API™
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0"></div>
                  <div>
                    <div className="flex mb-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                    <blockquote className="text-xl text-gray-700 italic mb-6">
                      "It's like having an investment analyst on every listing.
                      My clients trust me more, and I close faster. The reports
                      give me a competitive edge that no other agent in my area
                      has."
                    </blockquote>
                    <div className="font-bold text-gray-900">Jared S.</div>
                    <div className="text-sm text-gray-500">
                      Principal at Cape Invest Realty
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-proply-blue">
                          32%
                        </div>
                        <div className="text-sm text-gray-500">
                          Increase in investor inquiries
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-proply-blue">
                          18
                        </div>
                        <div className="text-sm text-gray-500">
                          Days average time to sell
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-proply-blue">
                          R200k
                        </div>
                        <div className="text-sm text-gray-500">
                          Average negotiation advantage
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8 gap-2">
                <button className="w-3 h-3 rounded-full bg-proply-blue"></button>
                <button className="w-3 h-3 rounded-full bg-gray-300"></button>
                <button className="w-3 h-3 rounded-full bg-gray-300"></button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing - Simple card */}
        <section className="py-24">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-4">
                <DollarSign className="h-4 w-4 mr-2" /> PRICING
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                Simple, transparent pricing
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                No subscriptions or hidden fees. Only pay for what you use.
              </p>
            </div>

            <div className="max-w-lg mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-8 text-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-600 text-sm font-medium mb-4">
                    USAGE-BASED PRICING
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-5xl font-bold text-gray-900">
                      R200
                    </span>
                    <span className="text-xl text-gray-500">per report</span>
                  </div>
                  <p className="text-gray-600 mb-8">
                    Only pay for the reports you generate
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Monthly minimum</span>
                      <span className="font-medium text-gray-900">None</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Contract length</span>
                      <span className="font-medium text-gray-900">
                        No contract
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Volume discounts</span>
                      <span className="font-medium text-gray-900">
                        Available
                      </span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-proply-blue hover:bg-proply-blue/90 text-white"
                  >
                    Request API Access
                  </Button>

                  <div className="mt-6 text-sm text-gray-500">
                    Volume discounts available for agencies with high listing
                    volumes
                  </div>
                </div>

                <div className="bg-gray-50 p-8 border-t border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4">
                    What's included:
                  </h4>
                  <ul className="space-y-3">
                    {[
                      "Comprehensive investment analysis",
                      "Rental yield calculations",
                      "ROI projections",
                      "Market value assessment",
                      "Cash flow analysis",
                      "Neighborhood insights",
                      "White-labeled reports",
                      "Unlimited sharing with clients",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-proply-blue flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-proply-blue">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                    Ready to transform your listings?
                  </h2>
                  <p className="text-xl text-blue-100 mb-8">
                    Join forward-thinking agents who are using Property Analyzer
                    API™ to close deals faster and stand out in a competitive
                    market.
                  </p>
                  <div className="space-y-4">
                    <Button
                      size="lg"
                      className="w-full bg-white hover:bg-gray-100 text-proply-blue"
                    >
                      Request API Access <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full bg-transparent border-white text-white hover:bg-white/10 hover:text-white"
                      onClick={openReportModal}
                    >
                      View Sample Report <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold mb-6 text-white">
                    Contact Our Team
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Input
                        type="text"
                        placeholder="Full Name"
                        className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Work Email"
                        className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        placeholder="Agency Name"
                        className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                      />
                    </div>
                    <div>
                      <Input
                        type="tel"
                        placeholder="Phone Number"
                        className="bg-white/10 border-white/20 text-white placeholder:text-blue-200"
                      />
                    </div>
                    <Button className="w-full bg-white hover:bg-gray-100 text-proply-blue">
                      Request Information{" "}
                      <MessageSquare className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm text-blue-200">
                    We'll respond within 24 hours to schedule a personalized
                    demo.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-12 bg-white border-t border-gray-200">
          <div className="container">
            <div className="text-center mb-8">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Trusted By Leading Real Estate Agencies
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="flex items-center justify-center h-12">
                <div className="text-gray-400 font-semibold text-lg">
                  RealtyGroup
                </div>
              </div>
              <div className="flex items-center justify-center h-12">
                <div className="text-gray-400 font-semibold text-lg">
                  PropertyPro
                </div>
              </div>
              <div className="flex items-center justify-center h-12">
                <div className="text-gray-400 font-semibold text-lg">
                  InvestHomes
                </div>
              </div>
              <div className="flex items-center justify-center h-12">
                <div className="text-gray-400 font-semibold text-lg">
                  PremierEstates
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Sample Report Modal */}
      <SampleReportModal
        isOpen={isReportModalOpen}
        onClose={closeReportModal}
      />
    </div>
  );
}
