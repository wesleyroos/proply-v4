"use client"

import { useRef } from "react"
import {
  MapPin,
  Home,
  Calendar,
  DollarSign,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Calculator,
  Building,
  Banknote,
  Percent,
  Download,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Link } from "wouter"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmailPDFButton } from "@/components/pdf/email-pdf-button"

// Property data types
export interface DealScoreReport {
  // Property Details
  address: string;
  askingPrice: number;
  propertySize: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  propertyCondition: string;
  propertyType?: string; // Making it optional to not break existing code
  luxuryRating?: number; // Luxury rating from 1-10 scale
  
  // Deal Score Metrics
  score: number;
  rating: string;
  color: string;
  estimatedValue: number;
  percentageDifference: number;
  
  // Area Information
  areaRate: number;
  recentSalesRange: string;
  
  // Rental Information
  nightlyRate: number;
  occupancyRate: number;
  monthlyLongTerm: number;
  
  // Calculated Financial Metrics
  pricePerSqM: number;
  shortTermYield: number;
  longTermYield: number;
  bestInvestmentStrategy: string;
  
  // Municipal Information
  municipalValue: number;
  monthlyRates: number;
  levy: number;
  estimatedMonthlyCosts: number;
  
  // Rental Calculations
  monthlyRevenue: number;
  annualRevenueShortTerm: number;
  annualRentalLongTerm: number;
  vacancyRate: number;
  netAnnualIncome: number;
  
  // Mortgage Calculations
  depositAmount: number;
  depositPercentage: number;
  interestRate: number;
  loanAmount: number;
  loanTerm: number;
  monthlyPayment: number;
  cashFlowShortTerm: number;
  cashFlowLongTerm: number;
  
  // Comparable Properties
  avgComparableSalesPrice: number;
  comparableProperties: Array<{
    similarity: string;
    address: string;
    salePrice: number;
    size: number;
    pricePerSqM: number;
    bedrooms: number;
    saleDate: string;
  }>;
  
  // Metadata
  reportDate: string;
  
  // Traffic & Convenience Information
  trafficDensity?: {
    morningRushHour: number;
    eveningRushHour: number;
    weekendTraffic: number;
    overallRating: string;
  };
  
  // Delivery Services
  deliveryServices?: {
    uberEats: boolean;
    mrD: boolean;
    takealot: boolean;
    checkersSixty60: boolean;
  };
  
  // Suburb Sentiment
  suburbSentiment?: {
    description: string;
    investmentPotential: string; // HIGH, MEDIUM, LOW
    developmentActivity: string; // ACTIVE, MODERATE, MINIMAL
    trend: string; // "Trending Up", "Stable", "Trending Down"
  };
  
  // Safety Analysis
  safetyAnalysis?: {
    score: number; // 1-10
    rating: string; // "Above Average Safety", "Average Safety", "Below Average Safety"
    comparedToCity: string; // "20% LOWER", "10% HIGHER", etc.
    propertyRisk: string; // LOW, MODERATE, HIGH
    violentRisk: string; // LOW, MODERATE, HIGH
  };
}

export default function DealScoreReportPage({ report }: { report?: DealScoreReport }) {
  const reportRef = useRef<HTMLDivElement>(null)
  
  // If no report provided, use demo data
  const demoReport: DealScoreReport = {
    // Property Details
    address: "27 Leeuwen St, Cape Town City Centre, 8001",
    askingPrice: 3500000,
    propertySize: 85,
    bedrooms: 2,
    bathrooms: 2,
    parking: 1,
    propertyCondition: "excellent",
    propertyType: "apartment",
    luxuryRating: 7,
    
    // Deal Score Metrics
    score: 89,
    rating: "GREAT DEAL",
    color: "bg-green-500",
    estimatedValue: 3825000,
    percentageDifference: 9.3,
    
    // Area Information
    areaRate: 45000,
    recentSalesRange: "R3.4M - R3.7M (last 3 months)",
    
    // Rental Information
    nightlyRate: 2500,
    occupancyRate: 70,
    monthlyLongTerm: 25000,
    
    // Calculated Financial Metrics
    pricePerSqM: 41176,
    shortTermYield: 18.3,
    longTermYield: 8.6,
    bestInvestmentStrategy: "Short-Term",
    
    // Municipal Information
    municipalValue: 3600000,
    monthlyRates: 2850,
    levy: 1950,
    estimatedMonthlyCosts: 4800,
    
    // Rental Calculations
    monthlyRevenue: 52500,
    annualRevenueShortTerm: 630000,
    annualRentalLongTerm: 300000,
    vacancyRate: 5,
    netAnnualIncome: 285000,
    
    // Mortgage Calculations
    depositAmount: 350000,
    depositPercentage: 10,
    interestRate: 11.75,
    loanAmount: 3150000,
    loanTerm: 20,
    monthlyPayment: 33850,
    cashFlowShortTerm: 18650,
    cashFlowLongTerm: -8850,
    
    // Comparable Properties
    avgComparableSalesPrice: 4943949,
    comparableProperties: [
      {
        similarity: "MOST SIMILAR",
        address: "123 Main St, Cape Town",
        salePrice: 3900000,
        size: 85,
        pricePerSqM: 45882,
        bedrooms: 2,
        saleDate: "2023/10/10"
      },
      {
        similarity: "COMPARABLE",
        address: "456 Oak St, Cape Town",
        salePrice: 4400000,
        size: 95,
        pricePerSqM: 46315,
        bedrooms: 3,
        saleDate: "2023/10/20"
      },
      {
        similarity: "COMPARABLE",
        address: "789 Pine St, Cape Town",
        salePrice: 4900000,
        size: 105,
        pricePerSqM: 46666,
        bedrooms: 4,
        saleDate: "2023/10/30"
      }
    ],
    
    // Metadata
    reportDate: "20 March 2025",
    
    // Traffic & Convenience Information
    trafficDensity: {
      morningRushHour: 65,
      eveningRushHour: 85,
      weekendTraffic: 30,
      overallRating: "Medium Traffic"
    },
    
    // Delivery Services
    deliveryServices: {
      uberEats: true,
      mrD: true,
      takealot: true,
      checkersSixty60: true
    },
    
    // Suburb Sentiment
    suburbSentiment: {
      description: "Cape Town City Centre is considered a highly desirable area with a vibrant mix of residential and commercial properties. The area has seen significant revitalization in recent years, with many historic buildings being converted into modern apartments and offices.",
      investmentPotential: "HIGH",
      developmentActivity: "ACTIVE",
      trend: "Trending Up"
    },
    
    // Safety Analysis
    safetyAnalysis: {
      score: 7.2,
      rating: "Above Average Safety",
      comparedToCity: "20% LOWER",
      propertyRisk: "MODERATE",
      violentRisk: "LOW"
    }
  }
  
  const data = report || demoReport

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-0">
      <div
        id="deal-score-content"
        ref={reportRef}
        className="max-w-[800px] mx-auto bg-white shadow-lg rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/proply-logo-auth.png" alt="Proply Logo" className="h-8 w-auto" />
              <Link
                to="/"
                className="print:hidden text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
            <div className="text-sm opacity-80">Report generated: {data.reportDate}</div>
          </div>
          <div className="mt-12 mb-6">
            <h1 className="text-3xl font-bold">Proply Deal Score™</h1>
            <p className="opacity-80 mt-2">{data.address}</p>
          </div>
        </div>

        {/* Deal Score Section */}
        <div className="p-8 border-b">
          <div className="text-center mb-8">
            <div className="flex justify-center mt-6">
              <div className="relative w-40 h-40">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 animate-pulse-slow"></div>
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  <div className="text-6xl font-bold text-primary">{data.score}%</div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <span className={`inline-block px-4 py-1 rounded-full text-white font-medium ${data.color}`}>
                {data.rating}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Asking Price</div>
              <div className="text-xl font-bold">R{data.askingPrice.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Estimated Market Value</div>
              <div className="text-xl font-bold">R{data.estimatedValue.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-center mb-8">
            <span className="font-medium">This property is </span>
            <span className="text-green-600 font-bold">{data.percentageDifference.toFixed(1)}% below</span>
            <span className="font-medium"> the estimated market value</span>
          </div>

          <div className="relative h-4 mb-10 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full">
            <div
              className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-300 rounded-full transform -translate-x-1/2 shadow-md"
              style={{ left: `${data.score}%` }}
            />
            <div className="absolute -bottom-6 left-0 text-xs">Poor</div>
            <div className="absolute -bottom-6 left-1/4 text-xs">Average</div>
            <div className="absolute -bottom-6 left-1/2 text-xs transform -translate-x-1/2">Good</div>
            <div className="absolute -bottom-6 left-3/4 text-xs">Great</div>
            <div className="absolute -bottom-6 right-0 text-xs">Excellent</div>
          </div>
        </div>

        {/* Key Deal Factors */}
        <div className="p-8 border-b">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Key Deal Factors</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                Price per m²:
              </span>
              <span className="font-medium">R{data.pricePerSqM.toLocaleString()}/m²</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Area average:
              </span>
              <span className="font-medium">R{data.areaRate.toLocaleString()}/m²</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Recent Area Sales:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{data.recentSalesRange}</span>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  WITHIN RANGE
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Property condition:
              </span>
              <span className="font-medium capitalize">{data.propertyCondition}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Short-Term Yield:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{data.shortTermYield.toFixed(1)}%</span>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  EXCELLENT
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Long-Term Yield:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{data.longTermYield.toFixed(1)}%</span>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  EXCELLENT
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Best Investment Strategy:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{data.bestInvestmentStrategy}</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                  RECOMMENDED
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="p-8 border-b">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Property Details</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">General Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-medium">{data.propertyType === 'apartment' ? 'Apartment/Flat' : data.propertyType === 'house' ? 'House' : 'Apartment/Flat'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{data.propertySize} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bedrooms:</span>
                  <span className="font-medium">{data.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bathrooms:</span>
                  <span className="font-medium">{data.bathrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Parking:</span>
                  <span className="font-medium">{data.parking}</span>
                </div>
                {data.luxuryRating && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Luxury Rating:</span>
                    <span className="font-medium">{data.luxuryRating}/10</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Financial Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Municipal Value:</span>
                  <span className="font-medium">R{data.municipalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Rates:</span>
                  <span className="font-medium">R{data.monthlyRates.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Levy:</span>
                  <span className="font-medium">R{data.levy.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Monthly Costs:</span>
                  <span className="font-medium">R{data.estimatedMonthlyCosts.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Analysis */}
        <div className="p-8 border-b">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Investment Analysis</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-6">
            {/* Short-term Rental Analysis */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Short-term Rental Analysis</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Nightly Rate</div>
                  <div className="text-xl font-bold">R{data.nightlyRate.toLocaleString()}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Occupancy Rate</div>
                  <div className="text-xl font-bold">{data.occupancyRate}%</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Monthly Revenue</div>
                  <div className="text-xl font-bold">R{data.monthlyRevenue.toLocaleString()}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Annual Revenue</div>
                  <div className="text-xl font-bold">R{data.annualRevenueShortTerm.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-primary" />
                  Short-Term Yield:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{data.shortTermYield.toFixed(1)}%</span>
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    EXCELLENT
                  </Badge>
                </div>
              </div>
            </div>

            {/* Long-term Rental Analysis */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Building className="h-5 w-5 text-purple-600" />
                <h3 className="font-medium">Long-term Rental Analysis</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Monthly Rental</div>
                  <div className="text-xl font-bold">R{data.monthlyLongTerm.toLocaleString()}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Annual Rental</div>
                  <div className="text-xl font-bold">R{data.annualRentalLongTerm.toLocaleString()}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Vacancy Rate</div>
                  <div className="text-xl font-bold">{data.vacancyRate}%</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Net Annual Income</div>
                  <div className="text-xl font-bold">R{data.netAnnualIncome.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-purple-600" />
                  Long-Term Yield:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{data.longTermYield.toFixed(1)}%</span>
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    EXCELLENT
                  </Badge>
                </div>
              </div>
            </div>

            {/* Mortgage Analysis */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Mortgage Analysis</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Purchase Price</div>
                  <div className="text-xl font-bold">R{data.askingPrice.toLocaleString()}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Deposit ({data.depositPercentage}%)</div>
                  <div className="text-xl font-bold">R{data.depositAmount.toLocaleString()}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Loan Amount</div>
                  <div className="text-xl font-bold">R{data.loanAmount.toLocaleString()}</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Interest Rate</div>
                  <div className="text-xl font-bold">{data.interestRate}%</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Loan Term</div>
                  <div className="text-xl font-bold">{data.loanTerm} years</div>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <div className="text-sm text-gray-500">Monthly Payment</div>
                  <div className="text-xl font-bold">R{data.monthlyPayment.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-green-600" />
                  Cash Flow (Short-term):
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">R{data.cashFlowShortTerm.toLocaleString()}/month</span>
                  <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                    POSITIVE
                  </Badge>
                </div>
              </div>

              <div className="mt-2 flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-green-600" />
                  Cash Flow (Long-term):
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">R{data.cashFlowLongTerm.toLocaleString()}/month</span>
                  <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                    NEGATIVE
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparable Properties */}
        <div className="p-8 border-b">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Comparable Properties</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>

          <div className="mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <span className="font-medium">Average Comparable Sales Price: </span>
              <span className="text-primary font-bold">R{data.avgComparableSalesPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            {data.comparableProperties.map((property, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Property {index + 1}</span>
                  <Badge variant="outline" className={`${index === 0 ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-gray-50 text-gray-800 border-gray-200"}`}>
                    {property.similarity}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Address:</div>
                    <div>{property.address}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Sale Price:</div>
                    <div className="font-medium">R{property.salePrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Size:</div>
                    <div>{property.size} m²</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Price per m²:</div>
                    <div>R{property.pricePerSqM.toLocaleString()}/m²</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Bedrooms:</div>
                    <div>{property.bedrooms}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Sale Date:</div>
                    <div>{property.saleDate}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <button className="text-primary font-medium flex items-center gap-1 mx-auto">
              View all {data.comparableProperties.length + 10} comparable properties
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Miscellaneous Information Section */}
        <div className="p-8 border-b">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-semibold">Area Insights</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Traffic Density Index */}
            {data.trafficDensity && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Traffic Density Index</h3>
                    <Badge className="bg-blue-500">{data.trafficDensity.overallRating}</Badge>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Morning Rush Hour</span>
                        <span className="font-medium">{data.trafficDensity.morningRushHour}/100</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-red-500"
                          style={{ width: `${data.trafficDensity.morningRushHour}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Evening Rush Hour</span>
                        <span className="font-medium">{data.trafficDensity.eveningRushHour}/100</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-red-500"
                          style={{ width: `${data.trafficDensity.eveningRushHour}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Weekend Traffic</span>
                        <span className="font-medium">{data.trafficDensity.weekendTraffic}/100</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-red-500"
                          style={{ width: `${data.trafficDensity.weekendTraffic}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Services */}
            {data.deliveryServices && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white">
                  <h3 className="font-semibold">Delivery Services Available</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${data.deliveryServices.uberEats ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {data.deliveryServices.uberEats ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-3 w-3 bg-gray-300 rounded-full"></span>}
                      </div>
                      <span>Uber Eats</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${data.deliveryServices.mrD ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {data.deliveryServices.mrD ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-3 w-3 bg-gray-300 rounded-full"></span>}
                      </div>
                      <span>Mr D</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${data.deliveryServices.takealot ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {data.deliveryServices.takealot ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-3 w-3 bg-gray-300 rounded-full"></span>}
                      </div>
                      <span>Takealot</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${data.deliveryServices.checkersSixty60 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {data.deliveryServices.checkersSixty60 ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-3 w-3 bg-gray-300 rounded-full"></span>}
                      </div>
                      <span>Checkers Sixty60</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suburb Sentiment */}
            {data.suburbSentiment && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Suburb Sentiment</h3>
                    <Badge 
                      className={`${
                        data.suburbSentiment.investmentPotential === 'HIGH' ? 'bg-green-500' :
                        data.suburbSentiment.investmentPotential === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    >
                      {data.suburbSentiment.investmentPotential}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm mb-4">{data.suburbSentiment.description}</p>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Development Activity</span>
                      <Badge 
                        variant="outline" 
                        className={`${
                          data.suburbSentiment.developmentActivity === 'ACTIVE' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                          data.suburbSentiment.developmentActivity === 'MODERATE' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                          'bg-gray-50 text-gray-800 border-gray-200'
                        }`}
                      >
                        {data.suburbSentiment.developmentActivity}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Market Trend</span>
                      <div className="flex items-center gap-1">
                        {data.suburbSentiment.trend === "Trending Up" ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : data.suburbSentiment.trend === "Trending Down" ? (
                          <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                        ) : (
                          <span className="h-4 w-4 bg-gray-200 rounded-full"></span>
                        )}
                        <span className="text-sm font-medium">{data.suburbSentiment.trend}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Safety Analysis */}
            {data.safetyAnalysis && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 text-white">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Safety Analysis</h3>
                    <Badge 
                      className={`${
                        data.safetyAnalysis.score >= 7 ? 'bg-green-500' :
                        data.safetyAnalysis.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    >
                      {data.safetyAnalysis.score}/10
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Area Safety</div>
                    <div className="font-medium">{data.safetyAnalysis.rating}</div>
                    <div className="text-sm text-gray-600">
                      {data.safetyAnalysis.comparedToCity} crime than city average
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Property Crime</div>
                      <Badge 
                        variant="outline" 
                        className={`${
                          data.safetyAnalysis.propertyRisk === 'LOW' ? 'bg-green-50 text-green-800 border-green-200' :
                          data.safetyAnalysis.propertyRisk === 'MODERATE' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                          'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {data.safetyAnalysis.propertyRisk} RISK
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Violent Crime</div>
                      <Badge 
                        variant="outline" 
                        className={`${
                          data.safetyAnalysis.violentRisk === 'LOW' ? 'bg-green-50 text-green-800 border-green-200' :
                          data.safetyAnalysis.violentRisk === 'MODERATE' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                          'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {data.safetyAnalysis.violentRisk} RISK
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 text-center pdf-section">
          <EmailPDFButton
            elementId="deal-score-content"
            filename="Proply-Deal-Score-Report.pdf"
            className="bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-full flex items-center gap-2 mx-auto disabled:opacity-70"
            propertyAddress={data.address}
          >
            Download Full Report
          </EmailPDFButton>
          <p className="text-sm text-gray-500 mt-6">Report generated by Proply Deal Score™ on {data.reportDate}</p>
          <p className="text-xs text-gray-400 mt-2">
            The information in this report is based on market data and should be used for informational purposes only.
            Proply does not guarantee the accuracy of the information provided.
          </p>
        </div>
      </div>
    </div>
  )
}