import React, { forwardRef } from 'react';
import { RiskIndexReport as RiskIndexReportType } from '../types/riskIndex';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Check, 
  Shield, 
  BarChart3, 
  Home, 
  MapPin, 
  DollarSign, 
  Percent, 
  BarChart, 
  Activity,
  Info
} from 'lucide-react';

interface RiskIndexReportProps {
  report: RiskIndexReportType;
}

const RiskIndexReport = forwardRef<HTMLDivElement, RiskIndexReportProps>(
  ({ report }, ref) => {
    const getRiskColor = (score: number) => {
      if (score <= 20) return 'bg-red-500';
      if (score <= 40) return 'bg-orange-500';
      if (score <= 60) return 'bg-yellow-500';
      if (score <= 80) return 'bg-blue-500';
      return 'bg-green-500';
    };

    const getRiskLabel = (score: number) => {
      if (score <= 20) return 'High Risk';
      if (score <= 40) return 'Moderate-High Risk';
      if (score <= 60) return 'Moderate Risk';
      if (score <= 80) return 'Low-Moderate Risk';
      return 'Low Risk';
    };

    const getTrendIcon = (trend: string) => {
      if (trend === 'improving' || trend === 'increasing') return <TrendingUp className="h-4 w-4 text-green-500" />;
      if (trend === 'stable') return <Activity className="h-4 w-4 text-blue-500" />;
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    };

    const getImpactColor = (impact: string) => {
      if (impact === 'low') return 'bg-green-100 text-green-800';
      if (impact === 'medium') return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    };

    // Function to format currency values
    const formatCurrency = (value: number) => {
      return value.toLocaleString('en-ZA', { 
        style: 'currency', 
        currency: 'ZAR',
        maximumFractionDigits: 0 
      });
    };

    return (
      <div 
        ref={ref}
        className="max-w-[800px] mx-auto bg-white shadow-lg rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/proply-logo-auth.png" alt="Proply Logo" className="h-8 w-auto" />
            </div>
            <div className="text-sm opacity-80">Report generated: {report.reportDate}</div>
          </div>
          <div className="mt-12 mb-6">
            <h1 className="text-3xl font-bold">Proply Risk Index™</h1>
            <p className="opacity-80 mt-2">{report.address}</p>
          </div>
        </div>

        {/* Risk Score Section */}
        <div className="p-8 border-b">
          <div className="text-center mb-8">
            <div className="flex justify-center mt-6">
              <div className="relative w-40 h-40">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  <div className="text-6xl font-bold text-primary">{report.overallRiskScore}</div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <span 
                className={`inline-block px-4 py-1 rounded-full text-white font-medium ${report.riskColor}`}
              >
                {report.riskRating}
              </span>
            </div>
          </div>

          {/* Value assessment indicator */}
          <div className="bg-blue-50 p-4 rounded-lg text-center mb-8">
            <span className="font-medium">This property is </span>
            {report.valuationDeviation < 0 ? (
              <span className="text-green-600 font-bold">{Math.abs(report.valuationDeviation).toFixed(1)}% below</span>
            ) : report.valuationDeviation > 0 ? (
              <span className="text-red-600 font-bold">{report.valuationDeviation.toFixed(1)}% above</span>
            ) : (
              <span className="text-blue-600 font-bold">at</span>
            )}
            <span className="font-medium"> the estimated market value</span>
          </div>

          {/* Risk slider */}
          <div className="relative h-4 mb-10 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full">
            <div
              className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-300 rounded-full transform -translate-x-1/2 shadow-md"
              style={{ left: `${100 - report.overallRiskScore}%` }}
            />
            <div className="absolute -bottom-6 left-0 text-xs">Low Risk</div>
            <div className="absolute -bottom-6 left-1/4 text-xs">Low-Moderate Risk</div>
            <div className="absolute -bottom-6 left-1/2 text-xs transform -translate-x-1/2">Moderate Risk</div>
            <div className="absolute -bottom-6 left-3/4 text-xs">Moderate-High Risk</div>
            <div className="absolute -bottom-6 right-0 text-xs">High Risk</div>
          </div>
        </div>

        {/* Property Details Section */}
        <div className="p-8 border-b">
          <h2 className="text-xl font-bold mb-6">Property Details</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Property Value</div>
              <div className="text-xl font-bold">{formatCurrency(report.propertyValue)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Estimated Market Value</div>
              <div className="text-xl font-bold">{formatCurrency(report.estimatedMarketValue)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Size</div>
              <div className="text-lg font-semibold">{report.propertySize} m²</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Price per m²</div>
              <div className="text-lg font-semibold">R{report.pricePerSqM.toLocaleString()}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Property Type</div>
              <div className="text-lg font-semibold capitalize">{report.propertyType}</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Bedrooms</div>
              <div className="text-lg font-semibold">{report.bedrooms}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Bathrooms</div>
              <div className="text-lg font-semibold">{report.bathrooms}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Parking</div>
              <div className="text-lg font-semibold">{report.parking}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Condition</div>
              <div className="text-lg font-semibold capitalize">{report.propertyCondition}</div>
            </div>
          </div>
        </div>

        {/* Risk Categories Section */}
        <div className="p-8 border-b">
          <h2 className="text-xl font-bold mb-6">Risk Analysis</h2>
          
          <Accordion type="single" collapsible className="w-full">
            {report.riskCategories.map((category, index) => (
              <AccordionItem key={index} value={`category-${index}`}>
                <AccordionTrigger className="py-4">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full ${getRiskColor(category.score)} flex items-center justify-center text-white font-bold mr-3`}>
                        {category.score}
                      </div>
                      <span className="font-semibold">{category.name}</span>
                    </div>
                    <Badge className={getRiskColor(category.score)}>
                      {getRiskLabel(category.score)}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <p className="text-gray-600 mb-4">{category.description}</p>
                  
                  <div className="space-y-4 mt-6">
                    {category.factors.map((factor, factorIndex) => (
                      <div key={factorIndex} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{factor.name}</div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getImpactColor(factor.impact)}>
                              {factor.impact.charAt(0).toUpperCase() + factor.impact.slice(1)} Impact
                            </Badge>
                            <div className="flex items-center">
                              {getTrendIcon(factor.trend)}
                              <span className="text-xs ml-1 capitalize">{factor.trend}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{factor.description}</p>
                        <div className="mt-2">
                          <Progress value={factor.score} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Market Trends */}
        <div className="p-8 border-b">
          <h2 className="text-xl font-bold mb-6">Market Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Market Volatility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{report.marketVolatility}%</span>
                  <Badge className={report.marketVolatility > 15 ? "bg-red-500" : report.marketVolatility > 10 ? "bg-yellow-500" : "bg-green-500"}>
                    {report.marketVolatility > 15 ? "High" : report.marketVolatility > 10 ? "Medium" : "Low"}
                  </Badge>
                </div>
                <Progress 
                  value={report.marketVolatility > 20 ? 100 : report.marketVolatility * 5} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Demand</div>
                    <div className="flex items-center">
                      {getTrendIcon(report.demandTrend)}
                      <span className="ml-1 font-medium capitalize">{report.demandTrend}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Supply</div>
                    <div className="flex items-center">
                      {getTrendIcon(report.supplyTrend)}
                      <span className="ml-1 font-medium capitalize">{report.supplyTrend}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="p-8 border-b">
          <h2 className="text-xl font-bold mb-6">Recommendations</h2>
          
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Investment Recommendation</AlertTitle>
            <AlertDescription>
              {report.investmentRecommendation}
            </AlertDescription>
          </Alert>
          
          <h3 className="font-semibold mb-3">Risk Mitigation Strategies</h3>
          <ul className="space-y-2">
            {report.riskMitigationStrategies.map((strategy, index) => (
              <li key={index} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{strategy}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Report Footer */}
        <div className="pt-6 pb-8 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center">
            <img
              src="/proply-favicon.png"
              alt="Proply Logo"
              className="h-4 w-4 mr-2"
            />
            <span>
              Proply Risk Index™ Report - Generated on {report.reportDate}
            </span>
          </div>
          <p className="mt-2 max-w-md mx-auto">
            This report provides a comprehensive assessment of investment risk based on property details
            and current market conditions.
          </p>
        </div>
      </div>
    );
  }
);

RiskIndexReport.displayName = 'RiskIndexReport';

export default RiskIndexReport;