import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { useState } from "react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { DemoRequestModal } from "@/components/DemoRequestModal";
import {
  ArrowRight,
  Check,
  Shield,
  AlertTriangle,
  BarChart3,
  Clock,
  Zap,
  FileText,
  Building,
  ChevronRight,
  Download,
  Sparkles,
  LineChart,
  PieChart,
  Database,
  CheckCircle2,
  XCircle,
  Calendar,
  MessageSquare,
  Code,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InsurersPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleOpenDemoModal = () => {
    setIsDemoModalOpen(true);
  };

  const handleCloseDemoModal = () => {
    setIsDemoModalOpen(false);
  };
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Risk Index™ for Insurers | Proply</title>
        <meta
          name="description"
          content="AI-powered property risk assessment that transforms how insurers evaluate, price, and manage property risk."
        />
      </Helmet>

      <PublicHeader />

      <main>
        {/* Hero Section - Problem-focused with clear value proposition */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="grid-pattern"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
          </div>

          <div className="container relative z-10">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-proply-blue/20 text-proply-blue text-sm font-medium mb-6">
                  <Shield className="h-4 w-4 mr-2" /> Risk Index™ for Insurers
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                  <span className="text-white">Property risk assessment</span>
                  <span className="text-proply-blue block mt-2">
                    reimagined with AI.
                  </span>
                </h1>
                <p className="mt-6 text-xl text-gray-300 max-w-lg">
                  Reduce claims, optimize pricing, and make smarter underwriting
                  decisions with comprehensive, AI-powered property risk
                  intelligence.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-proply-blue hover:bg-proply-blue/90 text-white"
                    onClick={handleOpenDemoModal}
                  >
                    Book a Demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      window.location.href = "/api/download-pdf";
                    }}
                  >
                    View Sample Report
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="mt-12 pt-6 border-t border-white/10">
                  <p className="text-sm font-medium text-gray-400 mb-4">
                    SOON TO BE TRUSTED BY LEADING INSURERS
                  </p>
                  
                </div>
              </div>

              {/* Hero Visual - Risk Index Preview */}
              <div className="relative">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold">Risk Index™ Report</h3>
                      <p className="text-sm text-gray-400">
                        123 Waterfront Drive, Cape Town
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                        72
                      </div>
                      <span className="font-medium text-red-400">
                        High Risk
                      </span>
                    </div>
                  </div>

                  {/* Risk Factors Preview */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-red-400" />
                          <span>Flood Risk</span>
                        </span>
                        <span className="font-medium text-red-400">
                          High (90%)
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: "90%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                          <span>Climate Risk</span>
                        </span>
                        <span className="font-medium text-amber-400">
                          Medium (65%)
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-green-400" />
                          <span>Security Risk</span>
                        </span>
                        <span className="font-medium text-green-400">
                          Low (25%)
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: "25%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-4 mb-6">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-proply-blue" />
                      AI Risk Insights
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <div className="min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] mt-0.5">
                          !
                        </div>
                        <span>
                          Property is in a high-risk flood zone with historical
                          flooding events
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="min-w-[16px] h-4 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] mt-0.5">
                          !
                        </div>
                        <span>
                          Climate change models predict increased storm severity
                          in this area
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-gray-400">
                        Recommended Premium Adjustment:
                      </span>
                      <span className="ml-2 text-red-400 font-medium">
                        +15%
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-proply-blue hover:bg-proply-blue/90 text-white"
                      onClick={() => {
                        window.location.href = "/api/download-pdf";
                      }}
                    >
                      View Full Report
                    </Button>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-proply-blue" />
                    <span className="text-sm">Analysis time: 3.2 seconds</span>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-proply-blue" />
                    <span className="text-sm">Data sources: 17</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Statement Section - Clear articulation of industry challenges */}
        <section className="py-20">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                The <span className="text-proply-blue">problem</span> with
                property risk assessment
              </h2>
              <p className="mt-6 text-xl text-gray-600">
                Insurance companies are making critical decisions based on
                outdated, incomplete, or siloed data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Inaccurate Risk Pricing",
                  description:
                    "Outdated risk models lead to mispriced premiums, resulting in either lost business or excessive claims.",
                  icon: BarChart3,
                  stat: "43%",
                  statDesc:
                    "of insurers report significant premium pricing challenges",
                },
                {
                  title: "Slow, Manual Processes",
                  description:
                    "Traditional property assessments are time-consuming, expensive, and often inconsistent.",
                  icon: Clock,
                  stat: "5-7 days",
                  statDesc:
                    "average time for traditional property risk assessment",
                },
                {
                  title: "Siloed Data Sources",
                  description:
                    "Critical risk data is scattered across multiple sources, making comprehensive assessment difficult.",
                  icon: Database,
                  stat: "12+",
                  statDesc:
                    "separate data sources typically needed for complete assessment",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mb-6 text-gray-600">{item.description}</p>
                  <div className="pt-6 border-t border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">
                      {item.stat}
                    </div>
                    <div className="text-sm text-gray-500">{item.statDesc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pain Points Comparison */}
            <div className="mt-20 bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Traditional vs. Proply Risk Assessment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <XCircle className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      Traditional Approach
                    </h4>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Manual property inspections taking days or weeks",
                      "Limited data sources and outdated information",
                      "Inconsistent assessment criteria between properties",
                      "High operational costs for physical inspections",
                      "Reactive risk assessment after events occur",
                      "One-time assessments that quickly become outdated",
                    ].map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-6 border border-proply-blue/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-proply-blue/10 text-proply-blue">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      Proply Risk Index™
                    </h4>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Instant AI-powered risk assessment in seconds",
                      "Multiple data sources including real-time climate data",
                      "Consistent, objective scoring across all properties",
                      "Fraction of the cost of traditional assessments",
                      "Predictive risk modeling for future events",
                      "Continuous monitoring and automatic updates",
                    ].map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-proply-blue flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Overview - Clear value proposition */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-white border-y border-gray-200">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-proply-blue/10 text-proply-blue text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4 mr-2" /> The Solution
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                Introducing{" "}
                <span className="text-proply-blue">Risk Index™</span>
              </h2>
              <p className="mt-6 text-xl text-gray-600">
                AI-powered property risk assessment that transforms how insurers
                evaluate, price, and manage property risk.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
              {[
                {
                  title: "Comprehensive Risk Scoring",
                  description:
                    "Get a complete 360° view of property risk factors including flood, fire, climate, security, and more.",
                  icon: Shield,
                },
                {
                  title: "AI-Powered Insights",
                  description:
                    "Our algorithms analyze multiple data sources to provide actionable insights for underwriting decisions.",
                  icon: Zap,
                },
                {
                  title: "Real-Time Assessment",
                  description:
                    "Generate detailed property risk reports in seconds, not days or weeks.",
                  icon: Clock,
                },
                {
                  title: "Predictive Modeling",
                  description:
                    "Anticipate future risks with climate change projections and evolving risk factors.",
                  icon: LineChart,
                },
                {
                  title: "Portfolio Analysis",
                  description:
                    "Evaluate risk across your entire portfolio to identify concentration risks and opportunities.",
                  icon: PieChart,
                },
                {
                  title: "API Integration",
                  description:
                    "Seamlessly integrate with your existing systems through our robust API.",
                  icon: Database,
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-proply-blue/10 text-proply-blue">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <Button
                size="lg"
                className="bg-proply-blue hover:bg-proply-blue/90 text-white"
                onClick={handleOpenDemoModal}
              >
                Schedule a Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works - Process explanation */}
        <section className="py-20">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                How <span className="text-proply-blue">Risk Index™</span> Works
              </h2>
              <p className="mt-6 text-xl text-gray-600">
                Our advanced AI platform delivers comprehensive risk assessment
                in three simple steps.
              </p>
            </div>

            <div className="relative">
              {/* Connection Line */}
              <div className="absolute top-24 left-0 right-0 h-0.5 bg-gray-200 hidden md:block"></div>

              <div className="grid md:grid-cols-3 gap-12">
                {[
                  {
                    title: "Input Property Details",
                    description:
                      "Simply enter the address or upload your property portfolio. That's all we need to get started.",
                    icon: Building,
                    step: "01",
                  },
                  {
                    title: "AI Risk Analysis",
                    description:
                      "Our algorithms instantly analyze multiple data sources including climate, flood, fire, and security risks.",
                    icon: Zap,
                    step: "02",
                  },
                  {
                    title: "Actionable Insights",
                    description:
                      "Receive comprehensive risk reports with clear recommendations for underwriting decisions.",
                    icon: FileText,
                    step: "03",
                  },
                ].map((item, i) => (
                  <div key={i} className="relative">
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 h-full">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-proply-blue text-white h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg">
                        {item.step}
                      </div>
                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-proply-blue/10 text-proply-blue mx-auto">
                        <item.icon className="h-8 w-8" />
                      </div>
                      <h3 className="mb-4 text-xl font-bold text-center text-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-center">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integration Options */}
            <div className="mt-20 bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Flexible Integration Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Stacked Cards */}
                <div className="space-y-8">
                  {/* Web Dashboard Option */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h4 className="text-xl font-bold text-gray-900 mb-3">
                      Web Dashboard
                    </h4>
                    <p className="text-gray-600 mb-6">
                      Access our intuitive web platform to analyze individual
                      properties or small portfolios.
                    </p>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-proply-blue" />
                        <span className="text-gray-700">
                          User-friendly interface
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-proply-blue" />
                        <span className="text-gray-700">
                          Instant risk reports
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-proply-blue" />
                        <span className="text-gray-700">Export to PDF/CSV</span>
                      </li>
                    </ul>
                    <Button
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
                      onClick={handleOpenDemoModal}
                    >
                      Request Access <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  {/* Bulk Processing Option */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h4 className="text-xl font-bold text-gray-900 mb-3">
                      Bulk Processing
                    </h4>
                    <p className="text-gray-600 mb-6">
                      Analyze your entire portfolio with our high-volume
                      processing solution.
                    </p>
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-proply-blue" />
                        <span className="text-gray-700">
                          Millions of properties
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-proply-blue" />
                        <span className="text-gray-700">Custom reporting</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-proply-blue" />
                        <span className="text-gray-700">
                          Risk concentration analysis
                        </span>
                      </li>
                    </ul>
                    <Button
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
                      onClick={handleOpenDemoModal}
                    >
                      Learn More <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Right Column - API Integration */}
                <div className="bg-white rounded-xl p-6 border border-proply-blue shadow-lg flex flex-col">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    API Integration
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Seamlessly integrate Risk Index™ into your existing
                    underwriting systems.
                  </p>

                  <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
                    <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs">
                      <Code className="h-4 w-4" />
                      <span>Example API Request</span>
                    </div>
                    <pre className="text-xs text-gray-100 font-mono">
                      {`// Fetch risk assessment for a property
const response = await fetch('https://api.proply.co.za/v1/risk-index', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    address: '123 Waterfront Drive, Cape Town',
    propertyType: 'residential',
    includeFactors: ['flood', 'climate', 'security']
  })
});

const riskData = await response.json();
console.log(riskData.riskScore); // 72
console.log(riskData.riskLevel); // "High"
`}
                    </pre>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-proply-blue" />
                      <span className="text-gray-700">RESTful API</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-proply-blue" />
                      <span className="text-gray-700">
                        Webhook notifications
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-proply-blue" />
                      <span className="text-gray-700">Batch processing</span>
                    </li>
                  </ul>
                  <div className="mt-auto">
                    <Button
                      className="w-full bg-proply-blue hover:bg-proply-blue/90 text-white"
                      onClick={handleOpenDemoModal}
                    >
                      Request API Access{" "}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Detailed breakdown */}
        <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold">
                Comprehensive{" "}
                <span className="text-proply-blue">Risk Analysis</span>
              </h2>
              <p className="mt-6 text-xl text-gray-300">
                Our Risk Index™ evaluates properties across multiple risk
                dimensions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Flood Risk Assessment",
                  description:
                    "Detailed flood risk analysis including historical flooding, proximity to water bodies, and elevation data.",
                  features: [
                    "Historical flood data",
                    "Elevation and water proximity analysis",
                    "Future flood risk projections",
                    "Dam breach and storm surge modeling",
                  ],
                  icon: AlertTriangle,
                },
                {
                  title: "Climate Risk Modeling",
                  description:
                    "Evaluate long-term climate risks including temperature changes, rainfall patterns, and extreme weather events.",
                  features: [
                    "30-year climate projections",
                    "Extreme weather vulnerability",
                    "Temperature and rainfall trend analysis",
                    "Climate adaptation recommendations",
                  ],
                  icon: LineChart,
                },
                {
                  title: "Fire & Wildfire Risk",
                  description:
                    "Comprehensive fire risk assessment including building materials, proximity to fire services, and wildfire exposure.",
                  features: [
                    "Building material analysis",
                    "Proximity to fire services",
                    "Wildfire exposure modeling",
                    "Vegetation and fuel load assessment",
                  ],
                  icon: AlertTriangle,
                },
                {
                  title: "Security Risk Analysis",
                  description:
                    "Evaluate property security risks including crime statistics, security features, and neighborhood factors.",
                  features: [
                    "Local crime statistics",
                    "Security infrastructure assessment",
                    "Neighborhood safety factors",
                    "Security enhancement recommendations",
                  ],
                  icon: Shield,
                },
                {
                  title: "Structural Risk Evaluation",
                  description:
                    "Assess building structural risks including age, construction type, and maintenance history.",
                  features: [
                    "Building age and construction type",
                    "Maintenance history analysis",
                    "Structural vulnerability assessment",
                    "Building code compliance evaluation",
                  ],
                  icon: Building,
                },
                {
                  title: "Environmental Hazards",
                  description:
                    "Identify environmental risks including soil contamination, air quality, and proximity to hazardous sites.",
                  features: [
                    "Soil contamination risk",
                    "Air quality assessment",
                    "Proximity to hazardous sites",
                    "Environmental compliance evaluation",
                  ],
                  icon: AlertTriangle,
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-proply-blue/20 text-proply-blue">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="mb-6 text-gray-300 text-sm">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.features.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <Check className="h-4 w-4 text-proply-blue" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Case Studies - Social proof */}
        <section className="py-20">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
                Success <span className="text-proply-blue">Stories</span>{" "}
                <span className="text-lg font-normal text-gray-500">
                  (Coming Soon)
                </span>
              </h2>
              <p className="mt-6 text-xl text-gray-600">
                We're new, but here's what we expect our future clients will say
                about transforming their risk assessment with Proply.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "National Insurer Will Reduce Claims by 23%",
                  description:
                    "A leading national insurer will implement Risk Index™ to better assess flood risks. By adjusting premiums and implementing mitigation requirements based on our data, they'll reduce flood-related claims by 23% in the first year. At least, that's our prediction!",
                  stats: [
                    { value: "23%", label: "Projected reduction in claims" },
                    { value: "R12.4M", label: "Potential annual savings" },
                    { value: "3 weeks", label: "Expected implementation time" },
                  ],
                  logo: "FutureClient Inc.",
                },
                {
                  title: "Regional Insurer Will Improve Pricing Accuracy",
                  description:
                    "A regional property insurer will use Risk Index™ to refine their pricing model. By incorporating our comprehensive risk data, they'll be able to offer more competitive rates to low-risk properties while appropriately pricing high-risk properties. We're confident of it!",
                  stats: [
                    {
                      value: "18%",
                      label: "Projected policy retention increase",
                    },
                    {
                      value: "31%",
                      label: "Expected improvement in loss ratio",
                    },
                    { value: "R8.2M", label: "Potential additional revenue" },
                  ],
                  logo: "YourCompany Ltd.",
                },
              ].map((study, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {study.title}
                      </h3>
                      <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">
                        {study.logo}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-8">{study.description}</p>
                    <div className="grid grid-cols-3 gap-4">
                      {study.stats.map((stat, j) => (
                        <div key={j} className="text-center">
                          <div className="text-2xl font-bold text-proply-blue">
                            {stat.value}
                          </div>
                          <div className="text-sm text-gray-500">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <Button
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300"
                      onClick={handleOpenDemoModal}
                    >
                      Be Our First Success Story{" "}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-16 bg-proply-blue/5 rounded-2xl p-8 border border-proply-blue/20">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-medium mb-4">
                FUTURE TESTIMONIAL
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-400 text-4xl font-bold">
                  ?
                </div>
                <div>
                  <blockquote className="text-xl text-gray-700 italic mb-4">
                    "Proply's Risk Index will transform how we assess property
                    risk. What used to take days will take seconds, and the
                    insights will be more comprehensive than anything we had
                    before. It's going to be a game-changer for our underwriting
                    process."
                  </blockquote>
                  <div className="font-bold text-gray-900">Your Name Here</div>
                  <div className="text-sm text-gray-500">
                    Chief Underwriting Officer, Your Company
                  </div>
                  <div className="mt-4 text-sm text-gray-500 italic">
                    We're new, but we're confident our technology will deliver
                    these results. Want to be our first success story?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}

        {/* CTA Section - Strong final conversion point */}
        <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to transform your property risk assessment?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join leading insurers who are using Risk Index™ to make smarter
                underwriting decisions, reduce claims, and optimize pricing.
              </p>
              <Button
                size="lg"
                className="bg-proply-blue hover:bg-proply-blue/90 text-white px-8"
                onClick={handleOpenDemoModal}
              >
                Schedule a Demo <Calendar className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className="py-12 bg-white border-t border-gray-200">
          <div className="container">
            <div className="text-center mb-8">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Our Data & Technology Partners
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="flex items-center justify-center h-12">
                <div className="text-gray-400 font-semibold text-lg">
                  GeoTerra Image
                </div>
              </div>
              <div className="flex items-center justify-center h-12">
                <div className="text-gray-400 font-semibold text-lg">
                  Weather Guard
                </div>
              </div>
              <div className="flex items-center justify-center h-12">
                <div className="text-gray-400 font-semibold text-lg">
                  Knowledge Factory
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />

      {/* Demo Request Modal */}
      <DemoRequestModal
        isOpen={isDemoModalOpen}
        onClose={handleCloseDemoModal}
      />
    </div>
  );
}
