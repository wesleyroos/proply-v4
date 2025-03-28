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
  
  // Deal Score Metrics
  score: number;
  rating: string;
  color: string;
  estimatedValue: number;
  percentageDifference: number;
  
  // Factor Scores (for multi-ring visualization)
  priceFactorScore?: number;
  conditionFactorScore?: number;
  rateComparisonScore?: number;
  yieldFactorScore?: number;
  
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
    reportDate: "20 March 2025"
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
              <div className="relative w-60 h-60">
                <svg className="w-60 h-60" viewBox="0 0 128 128">
                  {/* Background Circles */}
                  <circle
                    className="text-slate-100 stroke-current"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r="60"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-slate-100 stroke-current"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r="50"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-slate-100 stroke-current"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-slate-100 stroke-current"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r="30"
                    cx="64"
                    cy="64"
                  />
                  
                  {/* Factor Rings */}
                  {/* Price Factor Ring (40%) - Outermost */}
                  <circle
                    className="text-blue-500 stroke-current"
                    strokeWidth="5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="60"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${(data.priceFactorScore || 70) * 3.77} 377`}
                    strokeDashoffset="0"
                    transform="rotate(-90 64 64)"
                  />
                  
                  {/* Condition Factor Ring (20%) */}
                  <circle
                    className="text-green-500 stroke-current"
                    strokeWidth="5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="50"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${(data.conditionFactorScore || 80) * 3.14} 314`}
                    strokeDashoffset="0"
                    transform="rotate(-90 64 64)"
                  />
                  
                  {/* Rate Comparison Ring (20%) */}
                  <circle
                    className="text-purple-500 stroke-current"
                    strokeWidth="5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${(data.rateComparisonScore || 70) * 2.51} 251`}
                    strokeDashoffset="0"
                    transform="rotate(-90 64 64)"
                  />
                  
                  {/* Yield Factor Ring (20%) - Innermost */}
                  <circle
                    className="text-orange-500 stroke-current"
                    strokeWidth="5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="30"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${(data.yieldFactorScore || 60) * 1.88} 188`}
                    strokeDashoffset="0"
                    transform="rotate(-90 64 64)"
                  />
                  
                  {/* Central Score Circle */}
                  <circle
                    className="fill-white"
                    r="24"
                    cx="64"
                    cy="64"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl font-bold text-primary">{data.score}</div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full max-w-[280px] text-sm mx-auto mt-4 mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span>Price (40%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span>Condition (20%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                <span>Rate Comp (20%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                <span>Yield (20%)</span>
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
                  <span className="font-medium">Apartment</span>
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