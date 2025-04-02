"use client";

import { useState, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";

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
  riskFactors: {
    securityRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
    };
    environmentalRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
    };
    floodRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
    };
    climateRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
    };
    hailRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
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

export default function RiskIndexPage() {
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
    // Extract numeric values from form data
    const propertySize = Number(parseFormattedNumber(formData.size));
    const price = Number(parseFormattedNumber(formData.purchasePrice));
    const bedrooms = Number(formData.bedrooms) || 0;
    const bathrooms = Number(formData.bathrooms) || 0;
    const parking = Number(formData.parking) || 0;

    // SECURITY RISK CALCULATION
    const securityRiskMaxScore = 50;
    let securityRiskScore = 0;
    const securityRiskFactors: string[] = [];

    // Property type affects security risk
    if (formData.propertyType === "apartment") {
      securityRiskScore += 15; // Medium risk (building security but potential shared access)
      securityRiskFactors.push(
        "Property is located in an apartment building with shared access"
      );
    } else if (formData.propertyType === "house") {
      securityRiskScore += 25; // Higher risk (standalone structure)
      securityRiskFactors.push("Standalone structure with multiple entry points");
    } else if (formData.propertyType === "townhouse") {
      securityRiskScore += 20; // Medium-high risk
      securityRiskFactors.push("Townhouse with multiple levels and entry points");
    }

    // Location-based risk (mock data - would be based on real crime statistics)
    if (formData.address.toLowerCase().includes("cape town city centre")) {
      securityRiskScore += 10; // Urban center risks
      securityRiskFactors.push(
        "Property is located in an area with moderate crime rates"
      );
    }

    // Add generic factors for demo
    securityRiskFactors.push("Building has security but lacks 24-hour monitoring");
    securityRiskFactors.push(
      "Access control systems are present but could be improved"
    );

    // Security risk rating
    const securityRiskPercentage = (securityRiskScore / securityRiskMaxScore) * 100;
    let securityRiskRating: "Low" | "Medium" | "High" = securityRiskPercentage < 33 ? "Low" : securityRiskPercentage < 66 ? "Medium" : "High";

    // ENVIRONMENTAL RISK CALCULATION
    const environmentalRiskMaxScore = 40;
    let environmentalRiskScore = 0;
    const environmentalRiskFactors: string[] = [];

    // Property location affects environmental risk
    if (formData.address.toLowerCase().includes("cape town city centre")) {
      environmentalRiskScore += 21; // Urban pollution factors
      environmentalRiskFactors.push("Moderate air pollution from nearby traffic");
      environmentalRiskFactors.push("Some noise pollution during peak hours");
      environmentalRiskFactors.push("Limited exposure to industrial contaminants");
    }

    // Environmental risk rating
    const environmentalRiskPercentage =
      (environmentalRiskScore / environmentalRiskMaxScore) * 100;
    let environmentalRiskRating: "Low" | "Medium" | "High" = environmentalRiskPercentage < 33 ? "Low" : environmentalRiskPercentage < 66 ? "Medium" : "High";

    // FLOOD RISK CALCULATION
    const floodRiskMaxScore = 10;
    let floodRiskScore = 0;
    const floodRiskFactors: string[] = [];

    // Property location affects flood risk
    if (formData.address.toLowerCase().includes("cape town city centre")) {
      floodRiskScore += 10; // Flood zone risks
      floodRiskFactors.push("Property is located in a 1-in-100 year flood zone");
      floodRiskFactors.push("Historical flooding has occurred in this area");
      floodRiskFactors.push("Limited drainage infrastructure in surrounding streets");
      floodRiskFactors.push(
        "Basement level is particularly vulnerable to water ingress"
      );
    }

    // Flood risk rating
    const floodRiskPercentage = (floodRiskScore / floodRiskMaxScore) * 100;
    let floodRiskRating: "Low" | "Medium" | "High" = floodRiskPercentage < 33 ? "Low" : floodRiskPercentage < 66 ? "Medium" : "High";

    // CLIMATE RISK CALCULATION
    const climateRiskMaxScore = 270;
    let climateRiskScore = 0;
    const climateRiskFactors: string[] = [];

    // Property location and construction affect climate risk
    if (
      formData.propertyCondition === "excellent" ||
      formData.propertyCondition === "good"
    ) {
      climateRiskScore += 61; // Better buildings withstand climate risks better
      climateRiskFactors.push(
        "Property is not in a high-risk zone for sea level rise"
      );
      climateRiskFactors.push(
        "Building materials are resistant to temperature fluctuations"
      );
      climateRiskFactors.push(
        "Energy-efficient design helps mitigate extreme weather impacts"
      );
      climateRiskFactors.push(
        "Property has good natural ventilation reducing AC dependency"
      );
    } else {
      climateRiskScore += 120; // Poorer condition buildings have higher climate risk
      climateRiskFactors.push(
        "Property may experience increased maintenance due to weather extremes"
      );
      climateRiskFactors.push(
        "Building materials may not be optimal for temperature regulation"
      );
    }

    // Climate risk rating
    const climateRiskPercentage = (climateRiskScore / climateRiskMaxScore) * 100;
    let climateRiskRating: "Low" | "Medium" | "High" = climateRiskPercentage < 33 ? "Low" : climateRiskPercentage < 66 ? "Medium" : "High";

    // HAIL RISK CALCULATION
    const hailRiskMaxScore = 30;
    let hailRiskScore = 0;
    const hailRiskFactors: string[] = [];

    // Roof condition affects hail risk
    if (formData.propertyCondition === "excellent") {
      hailRiskScore += 10; // Lower risk with excellent roofing
      hailRiskFactors.push(
        "Roof is in excellent condition and likely to withstand hail impact"
      );
      hailRiskFactors.push("Covered parking provides vehicle protection");
    } else if (formData.propertyCondition === "poor") {
      hailRiskScore += 20; // Higher risk with poor roofing
      hailRiskFactors.push("Roof condition may be vulnerable to hail damage");
      hailRiskFactors.push("Inadequate vehicle protection during hail storms");
    } else {
      hailRiskScore += 15; // Medium risk
      hailRiskFactors.push("Roof may require inspection to assess hail resistance");
      hailRiskFactors.push("Partial covered parking for vehicles");
    }

    // Hail risk rating
    const hailRiskPercentage = (hailRiskScore / hailRiskMaxScore) * 100;
    let hailRiskRating: "Low" | "Medium" | "High" = hailRiskPercentage < 33 ? "Low" : hailRiskPercentage < 66 ? "Medium" : "High";

    // OVERALL RISK CALCULATION
    const totalRiskPoints =
      securityRiskScore +
      environmentalRiskScore +
      floodRiskScore +
      climateRiskScore +
      hailRiskScore;
    const maxRiskPoints =
      securityRiskMaxScore +
      environmentalRiskMaxScore +
      floodRiskMaxScore +
      climateRiskMaxScore +
      hailRiskMaxScore;
    const overallRiskPercentage = (totalRiskPoints / maxRiskPoints) * 100;

    // Determine overall risk rating
    let riskRating: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
    let riskColor: string;

    if (overallRiskPercentage < 20) {
      riskRating = "Very Low";
      riskColor = "green";
    } else if (overallRiskPercentage < 40) {
      riskRating = "Low";
      riskColor = "green";
    } else if (overallRiskPercentage < 60) {
      riskRating = "Moderate";
      riskColor = "orange";
    } else if (overallRiskPercentage < 80) {
      riskRating = "High";
      riskColor = "amber";
    } else {
      riskRating = "Very High";
      riskColor = "red";
    }

    // Generate overall recommendations
    const recommendations: string[] = [];

    // Add security recommendations
    if (securityRiskRating === "High" || securityRiskRating === "Medium") {
      recommendations.push(
        "Consider upgrading security systems and access control."
      );
      recommendations.push("Install additional exterior lighting around the property.");
    }

    // Add flood recommendations
    if (floodRiskRating === "High") {
      recommendations.push("Obtain comprehensive flood insurance coverage.");
      recommendations.push("Install flood barriers and improved drainage systems.");
    }

    // Add climate recommendations
    if (climateRiskRating === "Medium" || climateRiskRating === "High") {
      recommendations.push(
        "Improve building insulation to manage temperature extremes."
      );
      recommendations.push(
        "Consider energy-efficient upgrades to reduce climate vulnerability."
      );
    }

    // Add generic recommendations
    recommendations.push(
      "Conduct a professional property inspection before finalizing insurance coverage."
    );
    recommendations.push(
      "Consider bundling multiple insurance policies for better protection and rates."
    );

    // Calculate additional risk factors
    const marketVolatility = Math.floor(Math.random() * 35) + 40; // Random value between 40-75%
    const locationRisk = Math.floor(Math.random() * 45) + 30; // Random value between 30-75%
    const propertyConditionRisk =
      formData.propertyCondition === "excellent"
        ? 25
        : formData.propertyCondition === "good"
        ? 45
        : formData.propertyCondition === "fair"
        ? 65
        : 85;
    const financialRisk = Math.floor(Math.random() * 30) + 40; // Random value between 40-70%
    const demographicTrends = Math.floor(Math.random() * 40) + 30; // Random value between 30-70%
    const regulatoryRisk = Math.floor(Math.random() * 35) + 25; // Random value between 25-60%

    // Generate market projections
    const shortTerm =
      "Property insurance costs are expected to increase by 8-12% in the next year due to rising material costs and increased claim frequency.";
    const mediumTerm =
      "Over the next 5 years, property in this area may experience a 15-20% increase in insurance premiums as climate-related risks continue to be factored into underwriting models.";
    const longTerm =
      "Long-term projections suggest a 30-35% increase in insurance costs for properties in this zone over the next decade, with potential new regulatory requirements for flood and climate risk mitigation.";

    // Determine trend direction based on overall risk score
    let trendDirection: "up" | "stable" | "down";
    if (overallRiskPercentage > 60) {
      trendDirection = "up";
    } else if (overallRiskPercentage > 40) {
      trendDirection = "stable";
    } else {
      trendDirection = "down";
    }

    // Risk summary
    const riskSummary = `This property presents an overall ${riskRating.toLowerCase()} risk profile (${Math.round(overallRiskPercentage)}%), with most risk factors being well-managed or naturally low. However, there are specific areas of concern:
    
${floodRiskRating === "High" ? "High Flood Risk: The property's location in a flood-prone area represents a significant risk factor and should be carefully considered.\n" : ""}
${securityRiskRating === "Medium" || securityRiskRating === "High" ? `${securityRiskRating} Security Risk: ${securityRiskRating === "High" ? "This is a critical concern and" : "While not critical,"} security measures could be improved to enhance property protection.\n` : ""}
${environmentalRiskRating === "Medium" || environmentalRiskRating === "High" ? `${environmentalRiskRating} Environmental Risk: This moderate risk factor should be monitored, particularly regarding air quality and noise pollution.\n` : ""}
${hailRiskRating === "Medium" || hailRiskRating === "High" ? `${hailRiskRating} Hail Risk: The property may require additional protection measures against potential hail damage.\n` : ""}

Based on the overall risk assessment, we recommend a comprehensive insurance policy that specifically addresses the identified risk factors.`;

    return {
      overallRiskScore: Math.round(overallRiskPercentage),
      totalRiskPoints,
      maxRiskPoints,
      riskRating,
      riskColor,
      propertyDetails: {
        address: formData.address,
        propertyType: formData.propertyType,
        size: formData.size,
        bedrooms: formData.bedrooms || "0",
        bathrooms: formData.bathrooms || "0",
        parking: formData.parking || "0",
        condition: formData.propertyCondition,
        price: formData.purchasePrice,
        municipalValue: "3,600,000",
        monthlyRates: "2,850",
        levy: "1,950",
        estimatedMonthlyCosts: "7,350",
        suburb: "Cape Town City Centre",
        city: "Cape Town",
        postalCode: "8001",
      },
      riskFactors: {
        securityRisk: {
          score: securityRiskScore,
          maxScore: securityRiskMaxScore,
          percentageScore: securityRiskPercentage,
          rating: securityRiskRating,
          factors: securityRiskFactors,
        },
        environmentalRisk: {
          score: environmentalRiskScore,
          maxScore: environmentalRiskMaxScore,
          percentageScore: environmentalRiskPercentage,
          rating: environmentalRiskRating,
          factors: environmentalRiskFactors,
        },
        floodRisk: {
          score: floodRiskScore,
          maxScore: floodRiskMaxScore,
          percentageScore: floodRiskPercentage,
          rating: floodRiskRating,
          factors: floodRiskFactors,
        },
        climateRisk: {
          score: climateRiskScore,
          maxScore: climateRiskMaxScore,
          percentageScore: climateRiskPercentage,
          rating: climateRiskRating,
          factors: climateRiskFactors,
        },
        hailRisk: {
          score: hailRiskScore,
          maxScore: hailRiskMaxScore,
          percentageScore: hailRiskPercentage,
          rating: hailRiskRating,
          factors: hailRiskFactors,
        },
        marketVolatility,
        locationRisk,
        propertyConditionRisk,
        financialRisk,
        demographicTrends,
        regulatoryRisk,
      },
      projections: {
        shortTerm,
        mediumTerm,
        longTerm,
        trendDirection,
      },
      recommendations,
      riskSummary
    };
  };

  const handleAddressChange = (newAddress: string) => {
    setFormData((prev) => ({
      ...prev,
      address: newAddress,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.address) {
      toast({
        title: "Missing Address",
        description: "Please enter a property address.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.purchasePrice) {
      toast({
        title: "Missing Purchase Price",
        description: "Please enter the property value.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      const results = calculateRiskIndex();
      setRiskResult(results);
      setShowResult(true);
      setIsLoading(false);
    }, 1500);
  };

  const resetForm = () => {
    setShowResult(false);
    setRiskResult(null);
  };

  // Render the comprehensive risk report
  const renderComprehensiveReport = () => {
    if (!riskResult) return null;
    
    // Function to render risk category section
    const renderRiskCategory = (title: string, riskData: any, icon: React.ReactNode) => {
      return (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-full ${getRiskColor(riskData.rating)} bg-opacity-20`}>{icon}</div>
            <h3 className="text-lg font-semibold">{title} Risk</h3>
            <Badge className={getRiskColor(riskData.rating)}>
              {riskData.score}/{riskData.maxScore} ({Math.round(riskData.percentageScore)}%)
            </Badge>
          </div>

          <div className="mb-4">
            {renderRiskLevelIndicator(riskData.percentageScore, riskData.rating)}
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
    
    return (
      <div id="risk-index-report" className="space-y-8 max-w-[900px] mx-auto">
        {/* Property Title and Summary */}
        <div className="pb-8 text-center">
          <h2 className="text-2xl font-medium mb-2">Proply Risk Index™ (PRI)</h2>
          <h3 className="text-xl mb-5">{riskResult.propertyDetails.address}</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            A comprehensive assessment of property risks including security, environmental, flood, climate, and hail
            factors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Risk Score Card */}
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white relative z-10">
              <div className="p-6 flex flex-col items-center">
                <h3 className="text-slate-700 font-medium mb-4">Property Risk Assessment</h3>
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
                  <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold">
                    {riskResult.overallRiskScore}%
                  </div>
                </div>
                <div
                  className={`text-xl font-semibold ${riskResult.overallRiskScore <= 33 ? "text-green-600" : riskResult.overallRiskScore <= 66 ? "text-yellow-600" : "text-red-600"}`}
                >
                  {riskResult.riskRating} Risk
                </div>
              </div>
            </div>

            {/* Property Address Card */}
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white relative z-10">
              <div className="bg-gradient-to-r from-slate-700 to-gray-600 px-4 py-3">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-white mr-2" />
                  <h4 className="font-semibold text-white">Property Address</h4>
                </div>
              </div>
              <div className="p-5">
                <p className="text-lg font-medium mb-4">{riskResult.propertyDetails.address}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Property Type</p>
                    <p className="font-medium">{riskResult.propertyDetails.propertyType.charAt(0).toUpperCase() + riskResult.propertyDetails.propertyType.slice(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Size</p>
                    <p className="font-medium">{riskResult.propertyDetails.size} m²</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-slate-500">Bedrooms</p>
                    <p className="font-medium">{riskResult.propertyDetails.bedrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Bathrooms</p>
                    <p className="font-medium">{riskResult.propertyDetails.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Parking</p>
                    <p className="font-medium">{riskResult.propertyDetails.parking} Covered</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Value Card */}
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white relative z-10">
              <div className="bg-gradient-to-r from-slate-700 to-gray-600 px-4 py-3">
                <div className="flex items-center">
                  <CircleDollarSign className="h-5 w-5 text-white mr-2" />
                  <h4 className="font-semibold text-white">Property Value</h4>
                </div>
              </div>
              <div className="p-5">
                <p className="text-lg font-medium mb-4">R{riskResult.propertyDetails.price}</p>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Municipal Value</p>
                    <p className="font-medium">R{riskResult.propertyDetails.municipalValue}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Monthly Rates</p>
                      <p className="font-medium">R{riskResult.propertyDetails.monthlyRates}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Levy</p>
                      <p className="font-medium">R{riskResult.propertyDetails.levy}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Est. Monthly Costs</p>
                    <p className="font-medium">R{riskResult.propertyDetails.estimatedMonthlyCosts}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-lg font-semibold mb-4">
              Overall Risk Score: {riskResult.totalRiskPoints}/{riskResult.maxRiskPoints} ({riskResult.overallRiskScore}%) - {riskResult.riskRating} Risk Property
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Low Risk</span>
              <span>Medium Risk</span>
              <span>High Risk</span>
            </div>
            <div className="w-full h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full relative z-10">
              <div
                className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-800 rounded-full -mt-0.5 transform -translate-x-1/2"
                style={{ left: `${riskResult.overallRiskScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-6">Risk Factors</h3>
          
          {/* Security Risk */}
          {renderRiskCategory("Security", riskResult.riskFactors.securityRisk, getRiskIcon("security"))}
          
          {/* Environmental Risk */}
          {renderRiskCategory("Environmental", riskResult.riskFactors.environmentalRisk, getRiskIcon("environmental"))}
          
          {/* Flood Risk */}
          {renderRiskCategory("Flood", riskResult.riskFactors.floodRisk, getRiskIcon("flood"))}
          
          {/* Climate Risk */}
          {renderRiskCategory("Climate", riskResult.riskFactors.climateRisk, getRiskIcon("climate"))}
          
          {/* Hail Risk */}
          {renderRiskCategory("Hail", riskResult.riskFactors.hailRisk, getRiskIcon("hail"))}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 relative z-10">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Low Risk (0-33%)</h4>
              <div className="w-full h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">Medium Risk (34-66%)</h4>
              <div className="w-full h-2 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">High Risk (67-100%)</h4>
              <div className="w-full h-2 bg-red-500 rounded-full"></div>
            </div>
          </div>

          <div className="text-lg font-semibold mb-4 mt-8">
            Total Risk Score: {riskResult.totalRiskPoints}/{riskResult.maxRiskPoints} ({riskResult.overallRiskScore}% - {riskResult.riskRating} Risk)
          </div>

          <div className="bg-gray-50 p-6 rounded-lg relative z-10">
            <h4 className="font-semibold text-lg mb-3">Risk Assessment Summary</h4>
            <div className="text-gray-700 whitespace-pre-line">{riskResult.riskSummary}</div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Recommendations</h3>
          <div className="bg-gray-50 p-6 rounded-lg relative z-10">
            <ul className="space-y-2">
              {riskResult.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Download Report Button */}
        <div className="flex justify-center mt-8">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Download Full Report
          </Button>
        </div>

        {/* Report Footer */}
        <div className="pt-6 border-t text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center">
            <img src="/proply-logo-1.png" alt="Proply Logo" className="h-4 w-auto mr-2" />
            <span>
              Proply Risk Index™ Report - Generated on{" "}
              {new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Proply Logo */}
      <div className="absolute top-8 left-8 z-20">
        <img src="/proply-logo-1.png" alt="Proply Logo" className="h-8 w-auto" />
      </div>
      
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#e5f9ff,transparent)]" />
      </div>
      
      {/* Enhanced Background Patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#8884_1px,transparent_1px),linear-gradient(to_bottom,#8884_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        
        {/* Gradient circle animations */}
        <div className="circle-animation absolute -top-[150px] -left-[150px] w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl"></div>
        <div className="circle-animation animation-delay-1000 absolute top-[20%] -right-[100px] w-[200px] h-[200px] rounded-full bg-blue-400/10 blur-3xl"></div>
        <div className="circle-animation animation-delay-2000 absolute -bottom-[150px] left-[20%] w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl"></div>
        
        {/* Data points */}
        <div className="data-points absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/40"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
              }}
            />
          ))}
        </div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-[15%] left-[10%] w-16 h-16 border-2 border-primary/20 rounded-lg rotate-12 animate-float"></div>
        <div className="absolute bottom-[20%] right-[15%] w-20 h-20 border-2 border-primary/20 rounded-full animate-float animation-delay-1000"></div>
        <div className="absolute top-[60%] right-[25%] w-12 h-12 border-2 border-primary/20 rotate-45 animate-float animation-delay-2000"></div>
        
        {/* SVG paths */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,100 Q150,50 300,200 T600,100 T900,100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary animate-draw"
          />
          <path
            d="M0,200 Q200,150 400,250 T800,200"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary animate-draw animation-delay-1000"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 pt-[80px] pb-20">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-6xl font-bold">Proply Risk Index™</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive insurance risk assessment for your property investment
          </p>
        </div>

        {!showResult ? (
          // Form section
          <Card className="max-w-2xl mx-auto relative z-10 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-center">Proply Risk Index™</CardTitle>
              <CardDescription className="text-center">
                Enter property details for a detailed risk analysis
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleFormSubmit}>
              <CardContent className="space-y-8">
                {/* Property Address */}
                <div className="space-y-2 text-center">
                  <AddressAutocomplete
                    label="Property Address"
                    placeholder="Enter the property address"
                    value={formData.address}
                    onChange={handleAddressChange}
                    required={true}
                  />
                </div>

                {/* Property Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <Label htmlFor="propertyType" className="mb-1 block">
                      Property Type
                    </Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(value) =>
                        handleInputChange("propertyType", value)
                      }
                    >
                      <SelectTrigger id="propertyType">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Property Size */}
                  <div className="text-center">
                    <Label htmlFor="size" className="mb-1 block">
                      Property Size
                      <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="size"
                        placeholder="0"
                        value={formData.size}
                        onChange={(e) => handleInputChange("size", e.target.value)}
                        className="pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-muted-foreground">m²</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <Label htmlFor="bedrooms" className="mb-1 block">
                      Bedrooms
                    </Label>
                    <Input
                      id="bedrooms"
                      placeholder="0"
                      value={formData.bedrooms}
                      onChange={(e) =>
                        handleInputChange("bedrooms", e.target.value)
                      }
                    />
                  </div>

                  <div className="text-center">
                    <Label htmlFor="bathrooms" className="mb-1 block">
                      Bathrooms
                    </Label>
                    <Input
                      id="bathrooms"
                      placeholder="0"
                      value={formData.bathrooms}
                      onChange={(e) =>
                        handleInputChange("bathrooms", e.target.value)
                      }
                    />
                  </div>

                  <div className="text-center">
                    <Label htmlFor="parking" className="mb-1 block">
                      Parking
                    </Label>
                    <Input
                      id="parking"
                      placeholder="0"
                      value={formData.parking}
                      onChange={(e) =>
                        handleInputChange("parking", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Property Condition */}
                <div className="text-center">
                  <Label htmlFor="propertyCondition" className="mb-1 block">
                    Property Condition
                  </Label>
                  <Select
                    value={formData.propertyCondition}
                    onValueChange={(value) =>
                      handleInputChange("propertyCondition", value)
                    }
                  >
                    <SelectTrigger id="propertyCondition">
                      <SelectValue placeholder="Select property condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Purchase Price */}
                <div className="text-center">
                  <Label htmlFor="purchasePrice" className="mb-1 block">
                    Purchase Price/Property Value
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-muted-foreground">R</span>
                    </div>
                    <Input
                      id="purchasePrice"
                      className="pl-7"
                      placeholder="0"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        handleInputChange("purchasePrice", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>

              <div className="flex justify-end mt-6 p-6 pt-0">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      Calculate Risk Index
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          // Result display
          <div className="w-full max-w-[1000px] mx-auto">
            <Card className="w-full bg-white shadow-md rounded-lg relative z-10">
              <CardContent className="p-8">
                {riskResult && renderComprehensiveReport()}
                
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex items-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <footer className="py-6 px-6 w-full mt-12">
          <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Proply. All rights reserved.</p>
            <p className="mt-1">
              The Proply Risk Index™ is a proprietary algorithm designed to
              assess risk for insurance underwriting purposes.
            </p>
          </div>
        </footer>

        {/* Secret Fill Data Button */}
        <button
          type="button"
          onClick={fillDemoData}
          className="fixed bottom-4 right-4 opacity-0"
        >
          Fill Demo Data
        </button>
      </div>
    </div>
  );
}