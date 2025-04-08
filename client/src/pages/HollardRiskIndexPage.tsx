"use client";

import { useState, useRef } from "react";
import { EmailPDFButton } from "../components/pdf/email-pdf-button";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  MapPin,
  Home,
  Building,
  Package2,
  Car,
  BarChart3,
  Star,
  AlertCircle,
  Shield,
  TrendingUp,
  TrendingDown,
  Clock,
  Info,
  CheckCircle2,
  AlertTriangle,
  CircleDollarSign,
  Landmark,
  Ban,
  Download,
  CloudRain,
  Thermometer,
  Cloud,
  Umbrella,
  ChevronDown,
  Users,
} from "lucide-react";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import {
  calculateMonthlyRates,
  estimateMonthlyMunicipalCosts,
} from "../data/municipalRates";
import PropertyMap from "../components/PropertyMap";

// Risk Result interface
interface RiskResult {
  overallRiskScore: number;
  totalRiskPoints: number;
  maxRiskPoints: number;
  riskRating: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
  riskColor: string;
  propertyDetails: {
    address: string;
    propertyType: string;
    size: string;
    bedrooms: string;
    bathrooms: string;
    parking: string;
    condition: string;
    price: string;
    municipalValue?: string;
    monthlyRates?: string;
    levy?: string;
    estimatedMonthlyCosts?: string;
    suburb?: string;
    city?: string;
    postalCode?: string;
  };
  neighborhoodDemographics?: {
    dominantAge: string;
    dominantRace: string;
    dominantGender: string;
    incomeClass: string;
    nliIndex: number; // 1=poor, 10=affluent
    averageBuildingValue: string;
  };
  riskFactors: {
    securityRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
      detailedFactors?: Array<{
        dimension: string;
        outcome: string;
        riskFactor: number;
      }>;
    };
    environmentalRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
      detailedFactors?: Array<{
        dimension: string;
        outcome: string;
        riskFactor: number;
      }>;
    };
    floodRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
      detailedFactors?: Array<{
        dimension: string;
        outcome: string;
        riskFactor: number;
      }>;
    };
    climateRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
      detailedFactors?: Array<{
        dimension: string;
        outcome: string;
        riskFactor: number;
        category?: string;
        futureRisk?: string;
      }>;
    };
    hailRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
      detailedFactors?: Array<{
        dimension: string;
        outcome: string;
        riskFactor: number;
      }>;
      // Additional hail metrics
      maxHailSize?: string;
      annualFrequency?: number;
      damageProb?: number;
      roofVulnerability?: "Low" | "Medium" | "High";
      returnPeriod?: string;
    };
    marketVolatility: number;
    locationRisk: number;
    propertyConditionRisk: number;
    financialRisk: number;
    demographicTrends: number;
    regulatoryRisk: number;
  };
  projections: {
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
    trendDirection: "up" | "stable" | "down";
  };
  recommendations: string[];
  riskSummary?: string;
}

export default function HollardRiskIndexPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [demoClicks, setDemoClicks] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [formData, setFormData] = useState({
    // Property Details
    address: "",
    purchasePrice: "",
    size: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    propertyCondition: "excellent",
    propertyType: "apartment", // Default to apartment
  });

  const formatWithThousandSeparators = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, "");
    if (!numericValue) return "";
    const parts = numericValue.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
  };

  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, "");
  };

  const handleInputChange = (field: string, value: string) => {
    let numericValue = value;

    if (field === "bedrooms") {
      if (value.toLowerCase() === "studio") {
        numericValue = "0";
      } else if (value.toLowerCase() === "room") {
        numericValue = "-1";
      } else {
        numericValue = value.replace(/,/g, "");
        numericValue = numericValue.replace(/[^0-9.-]/g, "");
        const decimalCount = (numericValue.match(/\./g) || []).length;
        if (decimalCount > 1) {
          numericValue = numericValue.slice(0, numericValue.lastIndexOf("."));
        }
      }
    } else if (
      field === "purchasePrice" ||
      field === "size" ||
      field === "bathrooms" ||
      field === "parking"
    ) {
      numericValue = parseFormattedNumber(value);
      numericValue = numericValue.replace(/[^0-9.]/g, "");
      const formattedValue = formatWithThousandSeparators(numericValue);
      value = formattedValue;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fillDemoData = () => {
    setDemoClicks((prev) => {
      if (prev === 2) {
        setFormData({
          address: "27 Leeuwen St, Cape Town City Centre, 8001",
          purchasePrice: "3,500,000",
          size: "85",
          bedrooms: "2",
          bathrooms: "2",
          parking: "1",
          propertyCondition: "excellent",
          propertyType: "apartment",
        });
        return 0;
      }
      return prev + 1;
    });
  };

  // Function to determine color based on risk rating
  const getRiskColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  // Function to determine text color based on risk rating
  const getRiskTextColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "low":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "high":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  // Function to get risk icon based on category
  const getRiskIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "security":
        return <Shield className="h-5 w-5" />;
      case "environmental":
        return <Cloud className="h-5 w-5" />;
      case "flood":
        return <CloudRain className="h-5 w-5" />;
      case "climate":
        return <Thermometer className="h-5 w-5" />;
      case "hail":
        return <Umbrella className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  // Function to render risk level indicator
  const renderRiskLevelIndicator = (percentage: number, rating: string) => {
    return (
      <div className="flex items-center space-x-2 relative z-10">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${getRiskColor(rating)}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className={`text-sm font-medium ${getRiskTextColor(rating)}`}>
          {rating}
        </span>
      </div>
    );
  };

  const calculateRiskIndex = (): RiskResult => {
    // For brevity, reusing the same risk calculation logic from RiskIndexPage
    // In a real application, you might customize this specifically for Hollard
    
    // This is just a sample calculation - normally this would be more sophisticated
    const securityRiskScore = 21;
    const securityRiskMaxScore = 50;
    const securityRiskPercentage = (securityRiskScore / securityRiskMaxScore) * 100;
    const securityRiskRating: "Low" | "Medium" | "High" = securityRiskPercentage < 33 ? "Low" : securityRiskPercentage < 66 ? "Medium" : "High";
    
    const environmentalRiskScore = 21;
    const environmentalRiskMaxScore = 40;
    const environmentalRiskPercentage = (environmentalRiskScore / environmentalRiskMaxScore) * 100;
    const environmentalRiskRating: "Low" | "Medium" | "High" = environmentalRiskPercentage < 33 ? "Low" : environmentalRiskPercentage < 66 ? "Medium" : "High";
    
    const floodRiskScore = 6;
    const floodRiskMaxScore = 10;
    const floodRiskPercentage = (floodRiskScore / floodRiskMaxScore) * 100;
    const floodRiskRating: "Low" | "Medium" | "High" = floodRiskPercentage < 33 ? "Low" : floodRiskPercentage < 66 ? "Medium" : "High";
    
    const climateRiskScore = 15;
    const climateRiskMaxScore = 40;
    const climateRiskPercentage = (climateRiskScore / climateRiskMaxScore) * 100;
    const climateRiskRating: "Low" | "Medium" | "High" = climateRiskPercentage < 33 ? "Low" : climateRiskPercentage < 66 ? "Medium" : "High";
    
    const hailRiskScore = 3;
    const hailRiskMaxScore = 10;
    const hailRiskPercentage = (hailRiskScore / hailRiskMaxScore) * 100;
    const hailRiskRating: "Low" | "Medium" | "High" = hailRiskPercentage < 33 ? "Low" : hailRiskPercentage < 66 ? "Medium" : "High";
    
    // Calculate total risk score and percentage
    const totalRiskScore = securityRiskScore + environmentalRiskScore + floodRiskScore + climateRiskScore + hailRiskScore;
    const maxRiskScore = securityRiskMaxScore + environmentalRiskMaxScore + floodRiskMaxScore + climateRiskMaxScore + hailRiskMaxScore;
    const overallRiskPercentage = (totalRiskScore / maxRiskScore) * 100;
    
    // Determine overall risk rating based on the percentage
    let riskRating: "Very Low" | "Low" | "Moderate" | "High" | "Very High" = "Moderate";
    if (overallRiskPercentage < 20) {
      riskRating = "Very Low";
    } else if (overallRiskPercentage < 40) {
      riskRating = "Low";
    } else if (overallRiskPercentage < 60) {
      riskRating = "Moderate";
    } else if (overallRiskPercentage < 80) {
      riskRating = "High";
    } else {
      riskRating = "Very High";
    }
    
    // Determine risk color
    let riskColor = "";
    switch (riskRating) {
      case "Very Low":
        riskColor = "bg-green-300";
        break;
      case "Low":
        riskColor = "bg-green-500";
        break;
      case "Moderate":
        riskColor = "bg-yellow-500";
        break;
      case "High":
        riskColor = "bg-red-500";
        break;
      case "Very High":
        riskColor = "bg-red-700";
        break;
    }
    
    return {
      overallRiskScore: Math.round(overallRiskPercentage),
      totalRiskPoints: totalRiskScore,
      maxRiskPoints: maxRiskScore,
      riskRating,
      riskColor,
      propertyDetails: {
        address: formData.address,
        propertyType: formData.propertyType,
        size: formData.size,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        parking: formData.parking,
        condition: formData.propertyCondition,
        price: formData.purchasePrice,
        municipalValue: "R2,650,000",
        monthlyRates: "R2,250",
        levy: formData.propertyType === "apartment" ? "R1,800" : "N/A",
        estimatedMonthlyCosts: "R4,050",
        suburb: "Cape Town City Centre",
        city: "Cape Town",
        postalCode: "8001",
      },
      neighborhoodDemographics: {
        dominantAge: "25-45",
        dominantRace: "Mixed",
        dominantGender: "Balanced",
        incomeClass: "Upper-middle",
        nliIndex: 7,
        averageBuildingValue: "R3,200,000",
      },
      riskFactors: {
        securityRisk: {
          score: securityRiskScore,
          maxScore: securityRiskMaxScore,
          percentageScore: securityRiskPercentage,
          rating: securityRiskRating,
          factors: [
            "Property is located in an apartment building with shared access",
            "Property is located in an area with moderate crime rates",
            "Building has security but lacks 24-hour monitoring",
            "Access control systems are present but could be improved",
          ],
          detailedFactors: [
            {
              dimension: "Inside security area:",
              outcome: "Yes",
              riskFactor: 1,
            },
            {
              dimension: "Next to open areas:",
              outcome: "Yes",
              riskFactor: 10,
            },
            {
              dimension: "Distance to industrial:",
              outcome: "1.8km",
              riskFactor: 5,
            },
            {
              dimension: "Distance to informal settlements:",
              outcome: "3.2km",
              riskFactor: 5,
            },
            {
              dimension: "Construction in the area:",
              outcome: "No",
              riskFactor: 0,
            },
          ],
        },
        environmentalRisk: {
          score: environmentalRiskScore,
          maxScore: environmentalRiskMaxScore,
          percentageScore: environmentalRiskPercentage,
          rating: environmentalRiskRating,
          factors: [
            "Moderate air pollution from nearby traffic",
            "Some noise pollution during peak hours",
            "Limited exposure to industrial contaminants",
            "Property is in an area with high fire risk rating",
            "Roof top solar installation increases potential fire hazard",
            "Property has low slope gradient which is favorable for drainage",
          ],
          detailedFactors: [
            {
              dimension: "Fire risk:",
              outcome: "High",
              riskFactor: 10,
            },
            {
              dimension: "Roof top solar (fire risk):",
              outcome: "Yes",
              riskFactor: 10,
            },
            {
              dimension: "Distance to water:",
              outcome: ">100m (225m)",
              riskFactor: 0,
            },
            {
              dimension: "Slope:",
              outcome: "5°",
              riskFactor: 1,
            },
          ],
        },
        floodRisk: {
          score: floodRiskScore,
          maxScore: floodRiskMaxScore,
          percentageScore: floodRiskPercentage,
          rating: floodRiskRating,
          factors: [
            "Property is located in a 1-in-100 year flood zone",
            "Historical flooding has occurred in this area",
            "Limited drainage infrastructure in surrounding streets",
            "Basement level is particularly vulnerable to water ingress",
          ],
          detailedFactors: [
            {
              dimension: "Flood Risk",
              outcome: "Medium",
              riskFactor: 6,
            },
          ],
        },
        climateRisk: {
          score: climateRiskScore,
          maxScore: climateRiskMaxScore,
          percentageScore: climateRiskPercentage,
          rating: climateRiskRating,
          factors: [
            "Moderate exposure to increased temperatures",
            "Low risk of extreme weather events",
            "Area has shown resilience to drought conditions",
            "City has implemented climate adaptation measures",
          ],
          detailedFactors: [
            {
              dimension: "Climate Risk",
              outcome: "Low",
              riskFactor: 15,
              category: "Temperature",
              futureRisk: "Moderate",
            },
          ],
        },
        hailRisk: {
          score: hailRiskScore,
          maxScore: hailRiskMaxScore,
          percentageScore: hailRiskPercentage,
          rating: hailRiskRating,
          factors: [
            "Low frequency of hail events",
            "Historical hail sizes typically small",
            "Building construction offers adequate protection",
            "Roof material resistant to typical hail damage",
          ],
          detailedFactors: [
            {
              dimension: "Hail Risk",
              outcome: "Low",
              riskFactor: 3,
            },
          ],
          maxHailSize: "20mm",
          annualFrequency: 0.5,
          damageProb: 0.15,
          roofVulnerability: "Low",
          returnPeriod: "1-in-5 years",
        },
        marketVolatility: 4,
        locationRisk: 3,
        propertyConditionRisk: 2,
        financialRisk: 5,
        demographicTrends: 2,
        regulatoryRisk: 3,
      },
      projections: {
        shortTerm: "Stable with minimal risk exposure",
        mediumTerm: "Potential increase in environmental risks",
        longTerm: "Climate adaptation measures likely to mitigate risks",
        trendDirection: "stable",
      },
      recommendations: [
        "Consider upgrading to a comprehensive insurance policy that covers flood damage",
        "Install water sensors in basement areas for early detection",
        "Upgrade fire detection systems due to solar installation risks",
        "Regular maintenance of drainage systems is recommended",
        "Document belongings with photographs for insurance purposes",
      ],
      riskSummary: "This property presents a moderate overall risk profile with specific concerns in environmental and security categories. The property's location in Cape Town City Centre exposes it to moderate urban risks including crime and fire hazards. While flood risk exists, it is manageable with proper precautions. Climate and hail risks are relatively low, presenting minimal concerns for long-term ownership.",
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      try {
        const riskResult = calculateRiskIndex();
        setRiskResult(riskResult);
        setShowResult(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error calculating risk index:", error);
        toast({
          title: "Error",
          description: "Failed to calculate risk index. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }, 1500); // Simulate API call delay
  };

  const handleReset = () => {
    setShowResult(false);
    setRiskResult(null);
    setFormData({
      address: "",
      purchasePrice: "",
      size: "",
      bedrooms: "",
      bathrooms: "",
      parking: "",
      propertyCondition: "excellent",
      propertyType: "apartment",
    });
  };

  // Function to render risk category section
  const renderRiskCategory = (
    title: string,
    riskData: any,
    icon: React.ReactNode,
  ) => {
    // Apply accordions only to security risk (as requested)
    if (title.toLowerCase() === 'security') {
      return (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`p-2 rounded-full ${getRiskColor(riskData.rating)} bg-opacity-20`}
            >
              {icon}
            </div>
            <h3 className="text-lg font-semibold">{title} Risk</h3>
            <Badge className={getRiskColor(riskData.rating)}>
              {riskData.score} out of {riskData.maxScore} ({Math.round(riskData.percentageScore)}%)
            </Badge>
          </div>

          <div className="mb-4">
            {renderRiskLevelIndicator(
              riskData.percentageScore,
              riskData.rating,
            )}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low Risk</span>
              <span>Medium Risk</span>
              <span>High Risk</span>
            </div>
          </div>

          <Accordion type="single" collapsible className="bg-gray-50 rounded-lg">
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger className="py-3 px-4 hover:no-underline">
                <span className="text-sm font-medium">Risk Factors</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <ul className="space-y-1 text-sm">
                  {riskData.factors.map((factor: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-gray-700 mr-2">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b-0 border-t">
              <AccordionTrigger className="py-3 px-4 hover:no-underline">
                <span className="text-sm font-medium">Detailed Assessment</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Factor</th>
                      <th className="text-left py-2 font-medium">Value</th>
                      <th className="text-left py-2 font-medium">Risk Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskData.detailedFactors?.map((factor: any, index: number) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-1.5">{factor.dimension}</td>
                        <td className="py-1.5">{factor.outcome}</td>
                        <td className="py-1.5">{factor.riskFactor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      );
    }

    // Standard display for other risk categories
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div
            className={`p-2 rounded-full ${getRiskColor(riskData.rating)} bg-opacity-20`}
          >
            {icon}
          </div>
          <h3 className="text-lg font-semibold">{title} Risk</h3>
          <Badge className={getRiskColor(riskData.rating)}>
            {riskData.score} out of {riskData.maxScore} ({Math.round(riskData.percentageScore)}%)
          </Badge>
        </div>

        <div className="mb-4">
          {renderRiskLevelIndicator(
            riskData.percentageScore,
            riskData.rating,
          )}
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low Risk</span>
            <span>Medium Risk</span>
            <span>High Risk</span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg relative z-10">
          <h4 className="font-medium mb-2">{title} Risk Factors:</h4>
          <ul className="space-y-1 text-sm">
            {riskData.factors.map((factor: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="text-gray-700 mr-2">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // Render the comprehensive risk report
  const renderComprehensiveReport = () => {
    if (!riskResult) return null;
    
    // Function to render hail insurance metrics 
    const renderHailInsuranceMetrics = (riskData: { 
      maxHailSize?: string; 
      annualFrequency?: number; 
      damageProb?: number; 
      roofVulnerability?: "Low" | "Medium" | "High"; 
      returnPeriod?: string;
    }) => {
      if (!riskData) return null;
      
      return (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="text-sm font-semibold mb-3 text-blue-800">Insurance-Relevant Metrics:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskData.maxHailSize && (
              <div>
                <span className="text-xs text-gray-500 block">Max Hail Size</span>
                <span className="font-medium">{riskData.maxHailSize}</span>
              </div>
            )}
            {riskData.annualFrequency !== undefined && (
              <div>
                <span className="text-xs text-gray-500 block">Annual Frequency</span>
                <span className="font-medium">{riskData.annualFrequency} events/year</span>
              </div>
            )}
            {riskData.damageProb !== undefined && (
              <div>
                <span className="text-xs text-gray-500 block">Damage Probability</span>
                <span className="font-medium">{typeof riskData.damageProb === 'number' && riskData.damageProb <= 1 ? Math.round(riskData.damageProb * 100) : riskData.damageProb}%</span>
              </div>
            )}
            {riskData.roofVulnerability && (
              <div>
                <span className="text-xs text-gray-500 block">Roof Vulnerability</span>
                <span className="font-medium">{riskData.roofVulnerability}</span>
              </div>
            )}
            {riskData.returnPeriod && (
              <div>
                <span className="text-xs text-gray-500 block">Return Period</span>
                <span className="font-medium">{riskData.returnPeriod}</span>
              </div>
            )}
          </div>
        </div>
      );
    };
    
    // Get municipality tax data
    const estimatedMunicipalCosts = riskResult.propertyDetails.estimatedMonthlyCosts || "R0";

    return (
      <div id="risk-index-report" className="space-y-8 max-w-[900px] mx-auto">
        {/* Property Title and Summary */}
        <div className="pb-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Hollard Risk Index™</h2>
          <h3 className="text-xl font-medium mb-5">
            {riskResult.propertyDetails.address}
          </h3>
        </div>

        {/* Risk Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-4xl mx-auto">
          {/* Risk Score Card */}
          <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white relative z-10">
            <div className="p-6 flex flex-col items-center">
              <h3 className="text-slate-700 font-medium mb-4">
                Hollard Risk Index™
              </h3>
              <div className="relative mb-3 w-36 h-36">
                <svg className="w-36 h-36" viewBox="0 0 128 128">
                  <circle
                    className="text-slate-100 stroke-current"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className={`${riskResult.overallRiskScore <= 33 ? "text-green-500" : riskResult.overallRiskScore <= 66 ? "text-yellow-500" : "text-red-500"} stroke-current`}
                    strokeWidth="12"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${riskResult.overallRiskScore * 3.51} 351`}
                    strokeDashoffset="0"
                    transform="rotate(-90 64 64)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">
                    {riskResult.overallRiskScore}
                  </span>
                  <span className="text-sm text-gray-500">out of 100</span>
                </div>
              </div>
              <div className="text-center">
                <h4 className="font-medium text-lg">
                  {riskResult.riskRating} Risk
                </h4>
                <p className="text-sm text-gray-500">
                  {riskResult.totalRiskPoints} of {riskResult.maxRiskPoints}{" "}
                  risk points
                </p>
              </div>
            </div>
          </div>

          {/* Property Details Card */}
          <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white">
            <div className="p-6">
              <h3 className="text-slate-700 font-medium mb-4">
                Property Details
              </h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <p className="text-gray-500">Property Type</p>
                  <p className="font-medium capitalize">
                    {riskResult.propertyDetails.propertyType}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Size</p>
                  <p className="font-medium">
                    {riskResult.propertyDetails.size} m²
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Bedrooms</p>
                  <p className="font-medium">{riskResult.propertyDetails.bedrooms}</p>
                </div>
                <div>
                  <p className="text-gray-500">Bathrooms</p>
                  <p className="font-medium">
                    {riskResult.propertyDetails.bathrooms}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Parking</p>
                  <p className="font-medium">{riskResult.propertyDetails.parking}</p>
                </div>
                <div>
                  <p className="text-gray-500">Condition</p>
                  <p className="font-medium capitalize">
                    {riskResult.propertyDetails.condition}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Purchase Price</p>
                  <p className="font-medium">R{riskResult.propertyDetails.price}</p>
                </div>
                <div>
                  <p className="text-gray-500">Municipal Value</p>
                  <p className="font-medium">
                    {riskResult.propertyDetails.municipalValue}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Property Map */}
        <div className="mb-10 rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white">
          <div className="px-6 py-4 border-b">
            <h3 className="text-slate-700 font-medium">Property Location</h3>
          </div>
          <div className="h-80 relative">
            <PropertyMap address={riskResult.propertyDetails.address} />
          </div>
        </div>

        {/* Detailed Risk Assessment */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-6">Detailed Risk Assessment</h3>
          {renderRiskCategory(
            "Security",
            riskResult.riskFactors.securityRisk,
            getRiskIcon("security"),
          )}
          {renderRiskCategory(
            "Environmental",
            riskResult.riskFactors.environmentalRisk,
            getRiskIcon("environmental"),
          )}
          {renderRiskCategory(
            "Flood",
            riskResult.riskFactors.floodRisk,
            getRiskIcon("flood"),
          )}
          {renderRiskCategory(
            "Climate",
            riskResult.riskFactors.climateRisk,
            getRiskIcon("climate"),
          )}
          {renderRiskCategory(
            "Hail",
            riskResult.riskFactors.hailRisk,
            getRiskIcon("hail"),
          )}
          
          {/* Special hail metrics for insurance */}
          {riskResult.riskFactors.hailRisk && 
            renderHailInsuranceMetrics(riskResult.riskFactors.hailRisk)
          }
        </div>

        {/* Risk Summary */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Risk Summary</h3>
          <div className="bg-slate-50 p-6 rounded-lg relative z-10">
            <p className="text-gray-700 mb-4">{riskResult.riskSummary}</p>
            <h4 className="font-semibold text-base mb-3">Key Points:</h4>
            <ul className="space-y-3 ml-5 list-disc">
              <li>
                <span className="text-red-600 font-medium">
                  High Security Risk:
                </span>{" "}
                This property requires additional security measures to mitigate
                significant vulnerabilities.
              </li>

              <li>
                <span className="text-amber-600 font-medium">
                  Medium Environmental & Hail Risk:
                </span>{" "}
                These moderate risk factors should be monitored but don't
                present immediate concerns.
              </li>

              <li>
                <span className="text-green-600 font-medium">
                  Low Climate Risk:
                </span>{" "}
                The property is well-positioned to withstand long-term climate
                change impacts.
              </li>
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Recommendations</h3>
          <div className="bg-blue-50 p-6 rounded-lg relative z-10">
            <h4 className="text-blue-600 font-semibold text-lg mb-3">
              Insurance Considerations
            </h4>
            <ul className="space-y-4 ml-5 list-disc">
              {riskResult.recommendations.map((recommendation, index) => (
                <li key={index}>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Future Projections */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4">Future Risk Projections</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Short Term</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {riskResult.projections.trendDirection === "up" ? (
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  ) : riskResult.projections.trendDirection === "down" ? (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                  <p className="text-sm">{riskResult.projections.shortTerm}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Medium Term</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {riskResult.projections.trendDirection === "up" ? (
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  ) : riskResult.projections.trendDirection === "down" ? (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                  <p className="text-sm">{riskResult.projections.mediumTerm}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Long Term</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {riskResult.projections.trendDirection === "up" ? (
                    <TrendingUp className="h-5 w-5 text-red-500" />
                  ) : riskResult.projections.trendDirection === "down" ? (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                  <p className="text-sm">{riskResult.projections.longTerm}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Methodology Section (Information Box) */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4">Methodology</h3>
          <div className="bg-gray-50 p-6 rounded-lg text-sm relative z-10">
            <div className="mb-4 flex items-start">
              <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>
                The Hollard Risk Index™ is a proprietary algorithm designed to
                assess property risk across multiple dimensions. It combines
                real-world data with predictive analytics to provide a
                comprehensive risk profile.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Data Sources</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Historical crime statistics</li>
                  <li>Flood mapping and historical flood data</li>
                  <li>Climate and weather pattern analysis</li>
                  <li>Geographical and environmental assessments</li>
                  <li>Municipal zoning and property records</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Calculation Method</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    Each risk category is scored independently on specific
                    criteria
                  </li>
                  <li>
                    Scores are weighted based on severity and impact potential
                  </li>
                  <li>
                    Combined total scores determine the overall risk rating
                  </li>
                  <li>
                    Projections are based on historical trends and predictive
                    modeling
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Report Footer */}
        <div className="pt-6 border-t text-center text-sm text-muted-foreground mb-8">
          <div className="flex items-center justify-center">
            <img
              src="/proply-favicon.png"
              alt="Proply Logo"
              className="h-4 w-4 mr-2"
            />
            <span>
              Hollard Risk Index™ Report - Generated on{" "}
              {new Date().toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Download Report Button */}
        <div className="flex justify-center">
          <EmailPDFButton
            elementId="risk-index-report"
            filename={`Hollard_Risk_Index_${riskResult?.propertyDetails?.address?.split(",")[0] || "Report"}.pdf`}
            className="bg-blue-500 hover:bg-blue-600 text-white w-full max-w-md h-10 py-2 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium"
            propertyAddress={riskResult?.propertyDetails?.address}
          >
            Download Full Report
          </EmailPDFButton>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Proply Logo */}
      <div className="absolute top-8 left-8 z-20">
        <img
          src="/proply-logo-1.png"
          alt="Proply Logo"
          className="h-8 w-auto"
        />
      </div>

      <div className="container max-w-[1200px] mx-auto px-4 py-16">
        {!showResult ? (
          <>
            <div className="mb-12 text-center pt-8">
              <h1 className="text-6xl font-bold">Hollard Risk Index™</h1>
              <p className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto">
                Comprehensive risk assessment for property insurance
              </p>
              <p className="text-muted-foreground mt-2">
                Hollard Risk Index™
              </p>
            </div>
            
            <Card className="max-w-3xl mx-auto mb-12">
              <CardHeader className="pb-0">
                <CardTitle className="text-2xl">
                  Property Risk Assessment
                </CardTitle>
                <CardDescription>
                  Enter property details to generate a comprehensive risk report
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                      <Label htmlFor="address">Property Address</Label>
                      <div className="flex items-center">
                        <AddressAutocomplete
                          value={formData.address}
                          onChange={(value) => handleInputChange("address", value)}
                          placeholder="Enter property address"
                          className="w-full"
                          required
                        />
                        <Info className="w-4 h-4 ml-2 text-muted-foreground cursor-help" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Required for accurate risk assessment
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="property-type">Property Type</Label>
                      <Select
                        value={formData.propertyType}
                        onValueChange={(value) => handleInputChange("propertyType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="vacant-land">Vacant Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="purchase-price">Purchase Price (R)</Label>
                      <Input
                        id="purchase-price"
                        type="text"
                        placeholder="e.g. 1,500,000"
                        value={formData.purchasePrice}
                        onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="size">Size (m²)</Label>
                      <Input
                        id="size"
                        type="text"
                        placeholder="e.g. 80"
                        value={formData.size}
                        onChange={(e) => handleInputChange("size", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input
                        id="bedrooms"
                        type="text"
                        placeholder="e.g. 2 (or 'Studio')"
                        value={formData.bedrooms}
                        onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input
                        id="bathrooms"
                        type="text"
                        placeholder="e.g. 1.5"
                        value={formData.bathrooms}
                        onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="parking">Parking Spaces</Label>
                      <Input
                        id="parking"
                        type="text"
                        placeholder="e.g. 1"
                        value={formData.parking}
                        onChange={(e) => handleInputChange("parking", e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="property-condition">Property Condition</Label>
                      <Select
                        value={formData.propertyCondition}
                        onValueChange={(value) => handleInputChange("propertyCondition", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="below-average">Below Average</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fillDemoData}
                      className="text-sm"
                    >
                      Fill with Sample Data
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="min-w-[150px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Calculate Risk
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="flex items-center mb-8">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="mr-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
            {renderComprehensiveReport()}
          </>
        )}
      </div>
    </div>
  );
}