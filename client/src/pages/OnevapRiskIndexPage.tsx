"use client";

import { useState, useRef } from "react";
import { EmailPDFButton } from "../components/pdf/email-pdf-button";
import { StaticPDFButton } from "../components/pdf/static-pdf-button";
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  MapPin,
  Home,
  Building,
  Building2,
  Package2,
  Car,
  BarChart3,
  Star,
  AlertCircle,
  Shield,
  ShieldCheck,
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
  Layers,
  CircuitBoard,
  Flame,
  Zap,
  BatteryCharging,
  Droplets,
  PanelTop,
  KeyRound,
  Lock,
  SplitSquareVertical,
  GanttChart,
  Radio,
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
  premiumRange?: {
    low: string;
    high: string;
    factors: string[];
  };
  commercialRisk?: {
    businessInterruptionScore: number; // 1-100 scale
    liabilityExposureRating: "Low" | "Medium" | "High";
    occupationType: string;
    occupationRiskLevel: "Low" | "Medium" | "High";
  };
  claimsProbability?: {
    fire: number; // percentage
    theft: number;
    waterDamage: number;
    stormDamage: number;
    liability: number;
  };
  propertyDetails: {
    address: string;
    propertyType: string;
    size: string;
    yearBuilt: string;
    stories: string;
    condition: string;
    price: string;
    municipalValue?: string;
    monthlyRates?: string;
    levy?: string;
    estimatedMonthlyCosts?: string;
    suburb?: string;
    city?: string;
    postalCode?: string;
    replacementCost?: string;
    estimatedMarketValue?: string;
    replacementBreakdown?: {
      buildingShell: string;
      fixtures: string;
      codeCompliance: string;
    };
  };
  buildingDetails?: {
    roofType?: string;
    nonStandardStructure?: string;
    wallMaterial?: string;
    fireRetardant?: string;
    lightningConductor?: string;
    residenceType?: string;
    isCommune?: string;
    isPlotOrFarm?: string;
    geysers?: {
      electric?: string;
      gas?: string;
      heatPump?: string;
      solarWater?: string;
    };
    nearbyWaterBodies?: string;
    surgeArresterInstalled?: string;
  };
  securityDetails?: {
    perimeterWallType?: string;
    radioLinkedAlarm?: string;
    securityGates?: string;
    burglarBars?: string;
    controlledAccess?: string;
    securityGuard?: string;
    electricFence?: string;
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
    propertyCondition: "excellent",
    propertyType: "office", // Default to office for commercial properties
    yearBuilt: "",
    stories: "",

    // Commercial Risk Factors
    businessInterruptionCoverage: "",
    regulatoryCompliance: "",
    occupancyRate: "",
    tenantQuality: "",

    // Building Details
    roofType: "",
    nonStandardStructure: "",
    wallMaterial: "",
    fireRetardant: "",
    lightningConductor: "",
    residenceType: "owner", // Default to owner-occupied 
    isCommune: "",
    isPlotOrFarm: "",
    landUsage: [] as string[],
    geysers: {
      electric: "0",
      gas: "0",
      heatPump: "0",
      solarWater: "0",
    },
    nearbyWaterBodies: "",
    surgeArresterInstalled: "",

    // Security Details
    perimeterWallType: "",
    radioLinkedAlarm: "",
    securityGates: "",
    burglarBars: "",
    controlledAccess: "",
    securityGuard: "",
    electricFence: "",
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

    if (field === "yearBuilt" || field === "stories") {
      numericValue = value.replace(/,/g, "");
      numericValue = numericValue.replace(/[^0-9.-]/g, "");
      const decimalCount = (numericValue.match(/\./g) || []).length;
      if (decimalCount > 1) {
        numericValue = numericValue.slice(0, numericValue.lastIndexOf("."));
      }
    } else if (
      field === "purchasePrice" ||
      field === "size"
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
          // Property Details
          address: "27 Leeuwen St, Cape Town City Centre, 8001",
          purchasePrice: "3,500,000",
          size: "850",
          propertyCondition: "excellent",
          propertyType: "office",
          yearBuilt: "2005",
          stories: "4",

          // Commercial Risk Factors
          businessInterruptionCoverage: "comprehensive",
          regulatoryCompliance: "fullcompliance",
          occupancyRate: "95",
          tenantQuality: "highquality",

          // Building Details
          roofType: "concrete",
          nonStandardStructure: "no",
          wallMaterial: "brick",
          fireRetardant: "yes",
          lightningConductor: "no",
          residenceType: "owner",
          isCommune: "no",
          isPlotOrFarm: "no",
          landUsage: ["commercial", "office"] as string[],
          geysers: {
            electric: "1",
            gas: "0",
            heatPump: "0",
            solarWater: "0",
          },
          nearbyWaterBodies: "no",
          surgeArresterInstalled: "yes",

          // Security Details
          perimeterWallType: "brick wall higher than 1.8m",
          radioLinkedAlarm: "yes",
          securityGates: "yes",
          burglarBars: "yes",
          controlledAccess: "yes",
          securityGuard: "yes",
          electricFence: "no",
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
    const yearBuilt = Number(formData.yearBuilt) || 0;
    const stories = Number(formData.stories) || 0;

    // SECURITY RISK CALCULATION
    const securityRiskMaxScore = 50;
    let securityRiskScore = 0;
    const securityRiskFactors: string[] = [];
    const securityDetailedFactors: Array<{
      dimension: string;
      outcome: string;
      riskFactor: number;
    }> = [];

    // Inside security area
    const insideSecurityArea =
      formData.propertyType === "apartment" ? "Yes" : "No";
    const insideSecurityScore = insideSecurityArea === "Yes" ? 1 : 5;
    securityRiskScore += insideSecurityScore;
    securityDetailedFactors.push({
      dimension: "Inside security area:",
      outcome: insideSecurityArea,
      riskFactor: insideSecurityScore,
    });

    // Next to open areas
    const nextToOpenAreas = formData.address
      .toLowerCase()
      .includes("cape town city centre")
      ? "Yes"
      : "No";
    const nextToOpenAreasScore = nextToOpenAreas === "Yes" ? 10 : 0;
    securityRiskScore += nextToOpenAreasScore;
    securityDetailedFactors.push({
      dimension: "Next to open areas:",
      outcome: nextToOpenAreas,
      riskFactor: nextToOpenAreasScore,
    });

    // Distance to industrial
    const distanceToIndustrial = "1.8km";
    const distanceToIndustrialScore = 5;
    securityRiskScore += distanceToIndustrialScore;
    securityDetailedFactors.push({
      dimension: "Distance to industrial:",
      outcome: distanceToIndustrial,
      riskFactor: distanceToIndustrialScore,
    });

    // Distance to informal settlements
    const distanceToInformal = "3.2km";
    const distanceToInformalScore = 5;
    securityRiskScore += distanceToInformalScore;
    securityDetailedFactors.push({
      dimension: "Distance to informal settlements:",
      outcome: distanceToInformal,
      riskFactor: distanceToInformalScore,
    });

    // Construction in the area
    const constructionInArea = "No";
    const constructionInAreaScore = 0;
    securityRiskScore += constructionInAreaScore;
    securityDetailedFactors.push({
      dimension: "Construction in the area:",
      outcome: constructionInArea,
      riskFactor: constructionInAreaScore,
    });

    // Property type context for narrative
    if (formData.propertyType === "office") {
      securityRiskFactors.push(
        "Office building with multiple tenants and shared access points",
      );
    } else if (formData.propertyType === "retail") {
      securityRiskFactors.push(
        "Retail space with public access and potential security challenges",
      );
    } else if (formData.propertyType === "warehouse") {
      securityRiskFactors.push(
        "Industrial/warehouse property with valuable inventory storage",
      );
    } else if (formData.propertyType === "healthcare") {
      securityRiskFactors.push(
        "Healthcare facility requiring controlled access and specialized security",
      );
    } else if (formData.propertyType === "hospitality") {
      securityRiskFactors.push(
        "Hospitality property with 24/7 public access and turnover",
      );
    } else if (formData.propertyType === "mixed") {
      securityRiskFactors.push(
        "Mixed-use commercial property with complex security requirements",
      );
    } else if (formData.propertyType === "apartment") {
      securityRiskFactors.push(
        "Multi-unit apartment building with shared access points",
      );
    }

    // Location context for narrative
    if (formData.address.toLowerCase().includes("cape town city centre")) {
      securityRiskFactors.push(
        "Property is located in an area with moderate crime rates",
      );
    }

    // Add generic factors for narrative
    securityRiskFactors.push(
      "Building has security but lacks 24-hour monitoring",
    );
    securityRiskFactors.push(
      "Access control systems are present but could be improved",
    );

    // Security risk rating
    const securityRiskPercentage =
      (securityRiskScore / securityRiskMaxScore) * 100;
    let securityRiskRating: "Low" | "Medium" | "High" =
      securityRiskPercentage < 33
        ? "Low"
        : securityRiskPercentage < 66
          ? "Medium"
          : "High";

    // ENVIRONMENTAL RISK CALCULATION
    const environmentalRiskMaxScore = 40;
    let environmentalRiskScore = 0;
    const environmentalRiskFactors: string[] = [];
    const environmentalDetailedFactors: Array<{
      dimension: string;
      outcome: string;
      riskFactor: number;
    }> = [];

    // Fire risk
    const fireRisk = "High";
    const fireRiskScore = 10;
    environmentalRiskScore += fireRiskScore;
    environmentalDetailedFactors.push({
      dimension: "Fire risk:",
      outcome: fireRisk,
      riskFactor: fireRiskScore,
    });

    // Roof top solar (fire risk)
    const roofTopSolar = "Yes";
    const roofTopSolarScore = 10;
    environmentalRiskScore += roofTopSolarScore;
    environmentalDetailedFactors.push({
      dimension: "Roof top solar (fire risk):",
      outcome: roofTopSolar,
      riskFactor: roofTopSolarScore,
    });

    // Distance to water
    const distanceToWater = ">100m (225m)";
    const distanceToWaterScore = 0;
    environmentalRiskScore += distanceToWaterScore;
    environmentalDetailedFactors.push({
      dimension: "Distance to water:",
      outcome: distanceToWater,
      riskFactor: distanceToWaterScore,
    });

    // Slope
    const slope = "5°";
    const slopeScore = 1;
    environmentalRiskScore += slopeScore;
    environmentalDetailedFactors.push({
      dimension: "Slope:",
      outcome: slope,
      riskFactor: slopeScore,
    });

    // Add narrative factors for display
    if (formData.address.toLowerCase().includes("cape town city centre")) {
      environmentalRiskFactors.push(
        "Moderate air pollution from nearby traffic",
      );
      environmentalRiskFactors.push("Some noise pollution during peak hours");
      environmentalRiskFactors.push(
        "Limited exposure to industrial contaminants",
      );
    }

    // Add fire-related factors for narrative
    environmentalRiskFactors.push(
      "Property is in an area with high fire risk rating",
    );
    environmentalRiskFactors.push(
      "Roof top solar installation increases potential fire hazard",
    );
    environmentalRiskFactors.push(
      "Property has low slope gradient which is favorable for drainage",
    );

    // Environmental risk rating
    const environmentalRiskPercentage =
      (environmentalRiskScore / environmentalRiskMaxScore) * 100;
    let environmentalRiskRating: "Low" | "Medium" | "High" =
      environmentalRiskPercentage < 33
        ? "Low"
        : environmentalRiskPercentage < 66
          ? "Medium"
          : "High";

    // FLOOD RISK CALCULATION
    const floodRiskMaxScore = 10;
    let floodRiskScore = 0;
    const floodRiskFactors: string[] = [];
    const floodDetailedFactors: Array<{
      dimension: string;
      outcome: string;
      riskFactor: number;
    }> = [];

    // Flood risk assessment - based on screenshot data
    const floodRisk = "High";
    floodRiskScore = 10; // Total flood risk score

    // Add flood risk detailed factor
    floodDetailedFactors.push({
      dimension: "Flood Risk",
      outcome: floodRisk,
      riskFactor: 10,
    });

    // Property location affects flood risk narrative
    if (formData.address.toLowerCase().includes("cape town city centre")) {
      floodRiskFactors.push(
        "Property is located in a 1-in-100 year flood zone",
      );
      floodRiskFactors.push("Historical flooding has occurred in this area");
      floodRiskFactors.push(
        "Limited drainage infrastructure in surrounding streets",
      );
      floodRiskFactors.push(
        "Basement level is particularly vulnerable to water ingress",
      );
    } else {
      floodRiskFactors.push(
        "Property is located in a potential flood zone area",
      );
      floodRiskFactors.push(
        "Flood hazard assessment estimates risk of inundation damage",
      );
      floodRiskFactors.push(
        "Property may be subject to water velocity risks during heavy rainfall",
      );
    }

    // Add flood educational narrative
    floodRiskFactors.push(
      "Flood hazard assessment estimates the probability of different magnitudes of damaging flood conditions",
    );
    floodRiskFactors.push(
      "Factors include depth of inundation, duration, velocity of moving water, and wave height",
    );

    // Flood risk rating
    const floodRiskPercentage = (floodRiskScore / floodRiskMaxScore) * 100;
    let floodRiskRating: "Low" | "Medium" | "High" =
      floodRiskPercentage < 33
        ? "Low"
        : floodRiskPercentage < 66
          ? "Medium"
          : "High";

    // CLIMATE RISK CALCULATION
    const climateRiskMaxScore = 270;
    let climateRiskScore = 0;
    const climateRiskFactors: string[] = [];
    const climateDetailedFactors: Array<{
      dimension: string;
      outcome: string;
      riskFactor: number;
      category?: string;
      futureRisk?: string;
    }> = [];

    // Temperature related climate factors
    climateDetailedFactors.push({
      category: "Temperature Related",
      dimension: "Changing of air temperature",
      outcome: "Medium risk",
      riskFactor: 5,
      futureRisk: "Medium Risk",
    });

    climateDetailedFactors.push({
      category: "Temperature Related",
      dimension: "Changing of freshwater and marine water temperatures",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Temperature Related",
      dimension: "Heat Stress",
      outcome: "Low risk",
      riskFactor: 2,
      futureRisk: "Medium Risk",
    });

    climateDetailedFactors.push({
      category: "Temperature Related",
      dimension: "Temperature variability",
      outcome: "Medium risk",
      riskFactor: 5,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Temperature Related",
      dimension: "Permafrost thawing",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Temperature Related",
      dimension: "Heat wave",
      outcome: "Medium risk",
      riskFactor: 5,
      futureRisk: "Medium risk",
    });

    climateDetailedFactors.push({
      category: "Temperature Related",
      dimension: "Cold wave / frost",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Temperature Related",
      dimension: "Wildfire",
      outcome: "High Risk",
      riskFactor: 10,
      futureRisk: "High Risk",
    });

    // Wind related climate factors
    climateDetailedFactors.push({
      category: "Wind related",
      dimension: "Changing wind patterns",
      outcome: "Low risk",
      riskFactor: 2,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Wind related",
      dimension: "Windstorm (cyclone, hurricane, typhoon)",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Wind related",
      dimension: "Blizzards, dust and sandstorm",
      outcome: "Low risk",
      riskFactor: 2,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Wind related",
      dimension: "Tornado",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    // Water related climate factors
    climateDetailedFactors.push({
      category: "Water Related",
      dimension: "Changing of precipitation patterns: Rain",
      outcome: "Medium risk",
      riskFactor: 5,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Water Related",
      dimension: "Precipitation or hydrological variability",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Water Related",
      dimension: "Ocean acidification",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Water Related",
      dimension: "Saline intrusion",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Water Related",
      dimension: "Sea level rise",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Water Related",
      dimension: "Water stress",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "Medium Risk",
    });

    climateDetailedFactors.push({
      category: "Water Related",
      dimension: "Drought",
      outcome: "Medium risk",
      riskFactor: 5,
      futureRisk: "High Risk",
    });

    climateDetailedFactors.push({
      category: "Water Related",
      dimension: "Heavy precipitation",
      outcome: "Medium risk",
      riskFactor: 5,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Water Related",
      dimension: "Flood (coastal, fluvial, pluvial, ground water)",
      outcome: "High Risk",
      riskFactor: 10,
      futureRisk: "Red Flag",
    });

    // Solid matter related factors
    climateDetailedFactors.push({
      category: "Solid matter-related",
      dimension: "Coastal erosion",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Solid matter-related",
      dimension: "Soil degradation",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Solid matter-related",
      dimension: "Soil erosion",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Solid matter-related",
      dimension: "Solifluction",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Solid matter-related",
      dimension: "Landslide",
      outcome: "No risk",
      riskFactor: 0,
      futureRisk: "No risk",
    });

    climateDetailedFactors.push({
      category: "Solid matter-related",
      dimension: "Subsidence",
      outcome: "Medium Risk",
      riskFactor: 5,
      futureRisk: "Medium Risk",
    });

    // Calculate total climate risk score from detailed factors
    climateRiskScore = climateDetailedFactors.reduce(
      (sum, factor) => sum + factor.riskFactor,
      0,
    );

    // Property quality context for narrative
    if (
      formData.propertyCondition === "excellent" ||
      formData.propertyCondition === "good"
    ) {
      climateRiskFactors.push(
        "Property is not in a high-risk zone for sea level rise",
      );
      climateRiskFactors.push(
        "Building materials are resistant to temperature fluctuations",
      );
      climateRiskFactors.push(
        "Energy-efficient design helps mitigate extreme weather impacts",
      );
      climateRiskFactors.push(
        "Property has good natural ventilation reducing AC dependency",
      );
    } else {
      climateRiskFactors.push(
        "Property may experience increased maintenance due to weather extremes",
      );
      climateRiskFactors.push(
        "Building materials may not be optimal for temperature regulation",
      );
    }

    // Add additional climate narrative
    climateRiskFactors.push(
      "Temperature anomalies show a slight increase of 0.3°C from historical average",
    );
    climateRiskFactors.push(
      "Precipitation is 45mm below normal average which may indicate drought conditions",
    );
    climateRiskFactors.push(
      "Wildfire risk is rated high with increasing prevalence in the region",
    );
    climateRiskFactors.push(
      "Future climate projections indicate higher water stress and drought potential",
    );

    // Climate risk rating
    const climateRiskPercentage =
      (climateRiskScore / climateRiskMaxScore) * 100;
    let climateRiskRating: "Low" | "Medium" | "High" =
      climateRiskPercentage < 33
        ? "Low"
        : climateRiskPercentage < 66
          ? "Medium"
          : "High";

    // HAIL RISK CALCULATION
    const hailRiskMaxScore = 30;
    let hailRiskScore = 0;
    const hailRiskFactors: string[] = [];
    const hailDetailedFactors: Array<{
      dimension: string;
      outcome: string;
      riskFactor: number;
    }> = [];

    // Hail risk detailed factors based on roof condition and location
    if (formData.propertyCondition === "excellent") {
      // Hail risk assessment for excellent condition properties
      hailDetailedFactors.push({
        dimension: "Roof condition",
        outcome: "Excellent - High impact resistance",
        riskFactor: 1,
      });

      hailDetailedFactors.push({
        dimension: "Hail frequency in area",
        outcome: "Medium - 1-2 events per year",
        riskFactor: 5,
      });

      hailDetailedFactors.push({
        dimension: "Vehicle protection",
        outcome: "Full covered parking available",
        riskFactor: 1,
      });

      hailDetailedFactors.push({
        dimension: "Roof material",
        outcome: "Hail-resistant materials",
        riskFactor: 1,
      });

      hailDetailedFactors.push({
        dimension: "Proximity to high-risk zone",
        outcome: "Within 5km of high frequency area",
        riskFactor: 2,
      });

      // Calculate total hail risk score
      hailRiskScore = hailDetailedFactors.reduce(
        (sum, factor) => sum + factor.riskFactor,
        0,
      );

      // Narrative factors
      hailRiskFactors.push(
        "Roof is in excellent condition and likely to withstand hail impact",
      );
      hailRiskFactors.push("Covered parking provides vehicle protection");
      hailRiskFactors.push("Hail-resistant roofing materials installed");
    } else if (formData.propertyCondition === "poor") {
      // Hail risk assessment for poor condition properties
      hailDetailedFactors.push({
        dimension: "Roof condition",
        outcome: "Poor - Low impact resistance",
        riskFactor: 8,
      });

      hailDetailedFactors.push({
        dimension: "Hail frequency in area",
        outcome: "Medium - 1-2 events per year",
        riskFactor: 5,
      });

      hailDetailedFactors.push({
        dimension: "Vehicle protection",
        outcome: "No covered parking available",
        riskFactor: 4,
      });

      hailDetailedFactors.push({
        dimension: "Roof material",
        outcome: "Standard materials with wear",
        riskFactor: 5,
      });

      hailDetailedFactors.push({
        dimension: "Proximity to high-risk zone",
        outcome: "Within 5km of high frequency area",
        riskFactor: 2,
      });

      // Calculate total hail risk score
      hailRiskScore = hailDetailedFactors.reduce(
        (sum, factor) => sum + factor.riskFactor,
        0,
      );

      // Narrative factors
      hailRiskFactors.push("Roof condition may be vulnerable to hail damage");
      hailRiskFactors.push("Inadequate vehicle protection during hail storms");
      hailRiskFactors.push(
        "Roof materials show signs of wear and may need replacement",
      );
    } else {
      // Hail risk assessment for average condition properties
      hailDetailedFactors.push({
        dimension: "Roof condition",
        outcome: "Fair/Good - Moderate impact resistance",
        riskFactor: 4,
      });

      hailDetailedFactors.push({
        dimension: "Hail frequency in area",
        outcome: "Medium - 1-2 events per year",
        riskFactor: 5,
      });

      hailDetailedFactors.push({
        dimension: "Vehicle protection",
        outcome: "Partial covered parking available",
        riskFactor: 2,
      });

      hailDetailedFactors.push({
        dimension: "Roof material",
        outcome: "Standard materials in good condition",
        riskFactor: 3,
      });

      hailDetailedFactors.push({
        dimension: "Proximity to high-risk zone",
        outcome: "Within 5km of high frequency area",
        riskFactor: 2,
      });

      // Calculate total hail risk score
      hailRiskScore = hailDetailedFactors.reduce(
        (sum, factor) => sum + factor.riskFactor,
        0,
      );

      // Narrative factors
      hailRiskFactors.push(
        "Roof may require inspection to assess hail resistance",
      );
      hailRiskFactors.push("Partial covered parking for vehicles");
      hailRiskFactors.push(
        "Standard roofing materials with moderate resistance to hail impact",
      );
    }

    // Hail risk rating
    const hailRiskPercentage = (hailRiskScore / hailRiskMaxScore) * 100;
    let hailRiskRating: "Low" | "Medium" | "High" =
      hailRiskPercentage < 33
        ? "Low"
        : hailRiskPercentage < 66
          ? "Medium"
          : "High";

    // Additional hail risk metrics
    const maxHailSize =
      hailRiskRating === "Low"
        ? "10-20mm"
        : hailRiskRating === "Medium"
          ? "20-40mm"
          : "40-60mm";

    const annualFrequency =
      hailRiskRating === "Low" ? 1 : hailRiskRating === "Medium" ? 3 : 5;

    const damageProb =
      hailRiskRating === "Low" ? 15 : hailRiskRating === "Medium" ? 45 : 75;

    const roofVulnerability =
      formData.propertyCondition === "excellent"
        ? "Low"
        : formData.propertyCondition === "good"
          ? "Low"
          : formData.propertyCondition === "fair"
            ? "Medium"
            : "High";

    const returnPeriod =
      hailRiskRating === "Low"
        ? "1 in 7 years"
        : hailRiskRating === "Medium"
          ? "1 in 3 years"
          : "Annual";

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

    // Add security recommendations for commercial properties
    if (securityRiskRating === "High" || securityRiskRating === "Medium") {
      recommendations.push(
        "Consider upgrading security systems and access control for all entry points.",
      );
      recommendations.push(
        "Install additional exterior lighting and CCTV coverage around the property.",
      );
      recommendations.push(
        "Implement electronic access control systems for sensitive areas of the building.",
      );
    }

    // Add flood recommendations for commercial properties
    if (floodRiskRating === "High") {
      recommendations.push("Obtain comprehensive commercial flood insurance coverage.");
      recommendations.push(
        "Install commercial-grade flood barriers and improved drainage systems.",
      );
      recommendations.push(
        "Implement a business continuity plan for flood-related disruptions.",
      );
      recommendations.push(
        "Consider relocating valuable equipment and inventory above ground floor level.",
      );
    }

    // Add climate recommendations for commercial buildings
    if (climateRiskRating === "Medium" || climateRiskRating === "High") {
      recommendations.push(
        "Invest in commercial-grade insulation to manage temperature extremes and reduce HVAC costs.",
      );
      recommendations.push(
        "Consider energy-efficient upgrades to reduce climate vulnerability and lower operational expenses.",
      );
      recommendations.push(
        "Install backup power generators to maintain business operations during extreme weather events.",
      );
      recommendations.push(
        "Implement a preventative maintenance schedule for HVAC and building systems.",
      );
    }

    // Add hail risk recommendations for commercial buildings based on enhanced metrics
    if (hailRiskRating === "Medium" || hailRiskRating === "High") {
      recommendations.push(
        `Upgrade commercial roofing systems to withstand maximum hail size of ${maxHailSize}.`,
      );
      if (damageProb > 40) {
        recommendations.push(
          `Obtain specialized commercial hail insurance with business interruption coverage (annual damage probability: ${damageProb}%).`,
        );
      }
      if (roofVulnerability === "Medium" || roofVulnerability === "High") {
        recommendations.push(
          `Schedule a professional commercial roof inspection to address ${roofVulnerability.toLowerCase()} vulnerability rating.`,
        );
      }
      recommendations.push(
        `Implement a quarterly roof maintenance program to manage ${annualFrequency} potential hail events per year.`,
      );
      recommendations.push(
        `Consider installing protective barriers for HVAC units and other roof-mounted equipment.`,
      );
    }

    // Add generic recommendations for commercial properties
    recommendations.push(
      "Conduct a comprehensive commercial property assessment by a professional inspector before finalizing insurance coverage.",
    );
    recommendations.push(
      "Consider a customized commercial insurance package including property, liability, and business interruption coverage.",
    );
    recommendations.push(
      "Implement a formal emergency response plan and conduct regular safety drills with staff and tenants.",
    );
    recommendations.push(
      "Document and regularly update an inventory of all valuable equipment, fixtures, and other assets for insurance purposes.",
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

    // Commercial risk calculations
    let businessInterruptionScore = Math.round(
      (securityRiskScore / securityRiskMaxScore) * 70 + 
      (floodRiskScore / floodRiskMaxScore) * 30 + 
      (climateRiskScore / climateRiskMaxScore * 10)
    );

    // Adjust business interruption score based on selected coverage
    if (formData.businessInterruptionCoverage === "comprehensive") {
      businessInterruptionScore = Math.max(10, businessInterruptionScore - 25); // Reduce risk with comprehensive coverage
    } else if (formData.businessInterruptionCoverage === "basic") {
      businessInterruptionScore = Math.max(10, businessInterruptionScore - 10); // Reduce risk slightly with basic coverage
    } else if (formData.businessInterruptionCoverage === "none") {
      businessInterruptionScore = Math.min(95, businessInterruptionScore + 15); // Increase risk with no coverage
    }

    // Determine liability exposure based on property type and location
    let liabilityExposureRating: "Low" | "Medium" | "High" = "Medium";
    if (formData.propertyType === "apartment") {
      liabilityExposureRating = "Low";
    } else if ((formData.propertyType === "retail" || formData.propertyType === "hospitality") && securityRiskScore > 30) {
      liabilityExposureRating = "High";
    }

    // Adjust liability based on regulatory compliance
    if (formData.regulatoryCompliance === "fullcompliance") {
      if (liabilityExposureRating === "High") liabilityExposureRating = "Medium";
      else if (liabilityExposureRating === "Medium") liabilityExposureRating = "Low";
    } else if (formData.regulatoryCompliance === "pending" || formData.regulatoryCompliance === "unknown") {
      if (liabilityExposureRating === "Low") liabilityExposureRating = "Medium";
      else if (liabilityExposureRating === "Medium") liabilityExposureRating = "High";
    }

    // Determine occupation type based on property use
    const occupationType = formData.propertyType === "retail" ? "Retail" : 
                          formData.propertyType === "office" ? "Office" :
                          formData.propertyType === "warehouse" ? "Industrial" :
                          formData.propertyType === "healthcare" ? "Healthcare" :
                          formData.propertyType === "hospitality" ? "Hospitality" :
                          formData.propertyType === "mixed" ? "Mixed-Use" : "Commercial";

    // Determine occupation risk level based on property type
    let occupationRiskLevel: "Low" | "Medium" | "High" = "Medium";
    if (formData.propertyType === "warehouse" || formData.propertyType === "office") {
      occupationRiskLevel = "Low";
    } else if (formData.propertyType === "retail" || formData.propertyType === "hospitality") {
      occupationRiskLevel = "High";
    }

    // Risk summary for commercial properties
    const riskSummary = `This commercial property presents an overall ${riskRating.toLowerCase()} risk profile (${Math.round(overallRiskPercentage)}%), with a business interruption risk score of ${businessInterruptionScore}/100 and ${liabilityExposureRating.toLowerCase()} liability exposure as a ${occupationType.toLowerCase()} property. While some risk factors are well-managed, there are specific areas of concern:

${formData.businessInterruptionCoverage === "none" ? "No Business Interruption Coverage: The absence of business interruption insurance significantly increases financial vulnerability in case of property damage or forced closure.\n" : ""}
${floodRiskRating === "High" ? "High Flood Risk: The property's location in a flood-prone area represents a significant business continuity risk factor and should be carefully considered.\n" : ""}
${securityRiskRating === "Medium" || securityRiskRating === "High" ? `${securityRiskRating} Security Risk: ${securityRiskRating === "High" ? "This is a critical concern for commercial operations and" : "While not critical,"} security measures could be improved to enhance property and business protection.\n` : ""}
${environmentalRiskRating === "Medium" || environmentalRiskRating === "High" ? `${environmentalRiskRating} Environmental Risk: This risk factor should be monitored for impact on commercial operations, particularly regarding air quality and regulatory compliance.\n` : ""}
${hailRiskRating === "Medium" || hailRiskRating === "High" ? `${hailRiskRating} Hail Risk: The property may experience ${annualFrequency} hail events annually with maximum size of ${maxHailSize}. Roof and equipment vulnerability is rated as ${roofVulnerability}. Probability of business disruption is ${damageProb}% with a return period of ${returnPeriod}.\n` : ""}
${formData.regulatoryCompliance !== "fullcompliance" ? `Regulatory Compliance Issues: The property's ${formData.regulatoryCompliance === "pending" ? "pending" : "unknown"} regulatory compliance status may lead to additional liability exposure and potential penalties.\n` : ""}

Based on this commercial risk assessment, we recommend a comprehensive business insurance package that specifically addresses the identified risk factors including property damage, business interruption, and liability coverage.`;

    // Commercial insurance premium range calculation (for commercial properties)
    // Base premium calculation approximately 0.5% to 0.8% of property value annually
    const annualBasePremiumLow = price * 0.005;
    const annualBasePremiumHigh = price * 0.008;

    // Adjust based on risk factors
    const riskMultiplier = overallRiskPercentage / 50; // 1.0 = medium risk, lower is better
    const adjustedAnnualPremiumLow = annualBasePremiumLow * (1 + (riskMultiplier - 1) * 0.5);
    const adjustedAnnualPremiumHigh = annualBasePremiumHigh * (1 + (riskMultiplier - 1) * 0.7);

    // Monthly premiums
    const monthlyPremiumLow = adjustedAnnualPremiumLow / 12;
    const monthlyPremiumHigh = adjustedAnnualPremiumHigh / 12;

    // Calculate claims probability
    const fireClaimProb = Math.min(90, Math.round((environmentalRiskScore / environmentalRiskMaxScore) * 100));
    const theftClaimProb = Math.min(90, Math.round((securityRiskScore / securityRiskMaxScore) * 100));
    const waterDamageProb = Math.min(90, Math.round((floodRiskScore / floodRiskMaxScore) * 100));
    const stormDamageProb = Math.min(90, Math.round((hailRiskScore / hailRiskMaxScore) * 70 + (climateRiskScore / climateRiskMaxScore) * 30));
    const liabilityClaimProb = liabilityExposureRating === "Low" ? 20 : liabilityExposureRating === "Medium" ? 45 : 70;

    // Replacement cost breakdown
    const buildingShellCost = price * 0.75; // 75% of property value
    const fixturesCost = price * 0.15; // 15% of property value
    const codeComplianceCost = price * 0.1; // 10% of property value for bringing up to code

    return {
      overallRiskScore: Math.round(overallRiskPercentage),
      totalRiskPoints,
      maxRiskPoints,
      riskRating,
      riskColor,
      premiumRange: {
        low: formatWithThousandSeparators(String(Math.round(monthlyPremiumLow))),
        high: formatWithThousandSeparators(String(Math.round(monthlyPremiumHigh))),
        factors: [
          "Property value and characteristics",
          "Overall risk assessment score",
          "Location and environmental factors",
          "Security measures in place"
        ]
      },
      commercialRisk: {
        businessInterruptionScore: businessInterruptionScore,
        liabilityExposureRating: liabilityExposureRating,
        occupationType: occupationType,
        occupationRiskLevel: occupationRiskLevel
      },
      claimsProbability: {
        fire: fireClaimProb,
        theft: theftClaimProb,
        waterDamage: waterDamageProb,
        stormDamage: stormDamageProb,
        liability: liabilityClaimProb
      },
      propertyDetails: {
        address: formData.address,
        propertyType: formData.propertyType,
        size: formData.size,
        yearBuilt: formData.yearBuilt || "0",
        stories: formData.stories || "0",
        condition: formData.propertyCondition,
        price: formData.purchasePrice,
        municipalValue: formatWithThousandSeparators(
          String(Math.round(price * 1.03)),
        ), // Municipal value is typically slightly higher than purchase price
        monthlyRates: formatWithThousandSeparators(
          String(Math.round(calculateMonthlyRates(price * 1.03))),
        ),
        levy: "1,950",
        estimatedMonthlyCosts: formatWithThousandSeparators(
          String(Math.round(estimateMonthlyMunicipalCosts(price * 1.03))),
        ),
        replacementCost: formatWithThousandSeparators(
          String(Math.round(price * 1.25)), // Replacement cost is higher than purchase price
        ),
        estimatedMarketValue: formatWithThousandSeparators(
          String(Math.round(price * 1.08)), // Market value estimated higher than purchase price
        ),
        replacementBreakdown: {
          buildingShell: formatWithThousandSeparators(String(Math.round(buildingShellCost))),
          fixtures: formatWithThousandSeparators(String(Math.round(fixturesCost))),
          codeCompliance: formatWithThousandSeparators(String(Math.round(codeComplianceCost)))
        },
        suburb: "Cape Town City Centre",
        city: "Cape Town",
        postalCode: "8001",
      },
      buildingDetails: {
        roofType: formData.roofType,
        nonStandardStructure: formData.nonStandardStructure,
        wallMaterial: formData.wallMaterial,
        fireRetardant: formData.fireRetardant,
        lightningConductor: formData.lightningConductor,
        residenceType: formData.residenceType,
        isCommune: formData.isCommune,
        isPlotOrFarm: formData.isPlotOrFarm,
        geysers: {
          electric: formData.geysers.electric,
          gas: formData.geysers.gas,
          heatPump: formData.geysers.heatPump,
          solarWater: formData.geysers.solarWater,
        },
        nearbyWaterBodies: formData.nearbyWaterBodies,
        surgeArresterInstalled: formData.surgeArresterInstalled,
      },
      securityDetails: {
        perimeterWallType: formData.perimeterWallType,
        radioLinkedAlarm: formData.radioLinkedAlarm,
        securityGates: formData.securityGates,
        burglarBars: formData.burglarBars,
        controlledAccess: formData.controlledAccess,
        securityGuard: formData.securityGuard,
        electricFence: formData.electricFence,
      },
      neighborhoodDemographics: {
        dominantAge: "25-35 years",
        dominantRace: "Mixed",
        dominantGender: "Balanced (52% female)",
        incomeClass: "Upper Middle",
        nliIndex: 7, // 1=poor, 10=affluent
        averageBuildingValue: "3,850,000",
      },
      riskFactors: {
        securityRisk: {
          score: securityRiskScore,
          maxScore: securityRiskMaxScore,
          percentageScore: securityRiskPercentage,
          rating: securityRiskRating,
          factors: securityRiskFactors,
          detailedFactors: securityDetailedFactors,
        },
        environmentalRisk: {
          score: environmentalRiskScore,
          maxScore: environmentalRiskMaxScore,
          percentageScore: environmentalRiskPercentage,
          rating: environmentalRiskRating,
          factors: environmentalRiskFactors,
          detailedFactors: environmentalDetailedFactors,
        },
        floodRisk: {
          score: floodRiskScore,
          maxScore: floodRiskMaxScore,
          percentageScore: floodRiskPercentage,
          rating: floodRiskRating,
          factors: floodRiskFactors,
          detailedFactors: floodDetailedFactors,
        },
        climateRisk: {
          score: climateRiskScore,
          maxScore: climateRiskMaxScore,
          percentageScore: climateRiskPercentage,
          rating: climateRiskRating,
          factors: climateRiskFactors,
          detailedFactors: climateDetailedFactors,
        },
        hailRisk: {
          score: hailRiskScore,
          maxScore: hailRiskMaxScore,
          percentageScore: hailRiskPercentage,
          rating: hailRiskRating,
          factors: hailRiskFactors,
          detailedFactors: hailDetailedFactors,
          maxHailSize,
          annualFrequency,
          damageProb,
          roofVulnerability,
          returnPeriod,
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
      riskSummary,
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
          <h4 className="text-sm font-semibold mb-3 text-blue-800">
            Insurance-Relevant Metrics:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskData.maxHailSize && (
              <div>
                <span className="text-xs text-gray-500 block">
                  Max Hail Size
                </span>
                <span className="font-medium">{riskData.maxHailSize}</span>
              </div>
            )}
            {riskData.annualFrequency !== undefined && (
              <div>
                <span className="text-xs text-gray-500 block">
                  Annual Frequency
                </span>
                <span className="font-medium">
                  {riskData.annualFrequency} events/year
                </span>
              </div>
            )}
            {riskData.damageProb !== undefined && (
              <div>
                <span className="text-xs text-gray-500 block">
                  Damage Probability
                </span>
                <span className="font-medium">
                  {typeof riskData.damageProb === "number" &&
                  riskData.damageProb <= 1
                    ? Math.round(riskData.damageProb * 100)
                    : riskData.damageProb}
                  %
                </span>
              </div>
            )}
            {riskData.roofVulnerability && (
              <div>
                <span className="text-xs text-gray-500 block">
                  Roof Vulnerability
                </span>
                <span className="font-medium">
                  {riskData.roofVulnerability}
                </span>
              </div>
            )}
            {riskData.returnPeriod && (
              <div>
                <span className="text-xs text-gray-500 block">
                  Return Period
                </span>
                <span className="font-medium">{riskData.returnPeriod}</span>
              </div>
            )}
          </div>
        </div>
      );
    };

    // Function to render risk category section
    const renderRiskCategory = (
      title: string,
      riskData: any,
      icon: React.ReactNode,
    ) => {
      // Apply accordions only to security risk (as requested)
      if (title.toLowerCase() === "security") {
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
                {riskData.score} out of {riskData.maxScore} (
                {Math.round(riskData.percentageScore)}%)
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

            <Accordion type="single" collapsible className="w-full">
              {/* Single accordion item with all risk details */}
              <AccordionItem value="detailed-factors">
                <AccordionTrigger className="py-2 px-4 bg-gray-50 rounded-t-lg font-medium text-gray-800 hover:no-underline">
                  Security Risk Details
                </AccordionTrigger>
                <AccordionContent className="border border-t-0 border-gray-200 p-4 rounded-b-lg">
                  {/* Risk factors */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Risk Factors:</h4>
                    <ul className="space-y-1 text-sm mb-4">
                      {riskData.factors.map((factor: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-700 mr-2">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Detailed assessment table */}
                  {riskData.detailedFactors &&
                    riskData.detailedFactors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Detailed Assessment:
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left font-medium text-gray-700">
                                  Dimension
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">
                                  Outcome
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">
                                  Risk Factor
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {riskData.detailedFactors.map(
                                (factor: any, index: number) => (
                                  <tr
                                    key={index}
                                    className={
                                      index % 2 === 0
                                        ? "bg-gray-50"
                                        : "bg-white"
                                    }
                                  >
                                    <td className="px-4 py-2 border-t border-gray-200">
                                      {factor.dimension}
                                    </td>
                                    <td className="px-4 py-2 border-t border-gray-200">
                                      {factor.outcome}
                                    </td>
                                    <td className="px-4 py-2 border-t border-gray-200">
                                      <Badge
                                        variant={
                                          factor.riskFactor > 5
                                            ? "destructive"
                                            : factor.riskFactor > 2
                                              ? "secondary"
                                              : "outline"
                                        }
                                      >
                                        {factor.riskFactor}{" "}
                                        {factor.riskFactor === 1
                                          ? "point"
                                          : "points"}
                                      </Badge>
                                    </td>
                                  </tr>
                                ),
                              )}
                              <tr className="bg-gray-100">
                                <td className="px-4 py-2 font-medium border-t">
                                  Total
                                </td>
                                <td className="px-4 py-2 border-t"></td>
                                <td className="px-4 py-2 font-medium border-t">
                                  <Badge variant="default">
                                    {riskData.score}{" "}
                                    {riskData.score === 1 ? "point" : "points"}
                                  </Badge>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );
      }

      // Removed special case for hail risk - now handled in the shared accordion pattern

      // Use accordion pattern for environmental, flood, climate, and hail risks
      if (
        title.toLowerCase() === "environmental" ||
        title.toLowerCase() === "flood" ||
        title.toLowerCase() === "climate" ||
        title.toLowerCase() === "hail"
      ) {
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
                {riskData.score} out of {riskData.maxScore} (
                {Math.round(riskData.percentageScore)}%)
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

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="detailed-factors">
                <AccordionTrigger className="py-2 px-4 bg-gray-50 rounded-t-lg font-medium text-gray-800 hover:no-underline">
                  {title} Risk Details
                </AccordionTrigger>
                <AccordionContent className="border border-t-0 border-gray-200 p-4 rounded-b-lg">
                  {/* Risk factors */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Risk Factors:</h4>
                    <ul className="space-y-1 text-sm mb-4">
                      {riskData.factors.map((factor: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-700 mr-2">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Insurance metrics for hail risk */}
                  {title.toLowerCase() === "hail" &&
                    renderHailInsuranceMetrics(riskData)}

                  {/* Detailed assessment table */}
                  {riskData.detailedFactors &&
                    riskData.detailedFactors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Detailed Assessment:
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left font-medium text-gray-700">
                                  Dimension
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">
                                  Outcome
                                </th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">
                                  Risk Factor
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {riskData.detailedFactors.map(
                                (factor: any, index: number) => (
                                  <tr
                                    key={index}
                                    className={
                                      index % 2 === 0
                                        ? "bg-gray-50"
                                        : "bg-white"
                                    }
                                  >
                                    <td className="px-4 py-2 border-t border-gray-200">
                                      {factor.dimension}
                                    </td>
                                    <td className="px-4 py-2 border-t border-gray-200">
                                      {factor.outcome}
                                    </td>
                                    <td className="px-4 py-2 border-t border-gray-200">
                                      <Badge
                                        variant={
                                          factor.riskFactor > 5
                                            ? "destructive"
                                            : factor.riskFactor > 2
                                              ? "secondary"
                                              : "outline"
                                        }
                                      >
                                        {factor.riskFactor}{" "}
                                        {factor.riskFactor === 1
                                          ? "point"
                                          : "points"}
                                      </Badge>
                                    </td>
                                  </tr>
                                ),
                              )}
                              <tr className="bg-gray-100">
                                <td className="px-4 py-2 font-medium border-t">
                                  Total
                                </td>
                                <td className="px-4 py-2 border-t"></td>
                                <td className="px-4 py-2 font-medium border-t">
                                  <Badge variant="default">
                                    {riskData.score}{" "}
                                    {riskData.score === 1 ? "point" : "points"}
                                  </Badge>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        );
      }

      // For other risk factors (keep the original design)
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
              {riskData.score} out of {riskData.maxScore} (
              {Math.round(riskData.percentageScore)}%)
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

          {/* Detailed risk factors table (if available) */}
          {riskData.detailedFactors && riskData.detailedFactors.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full bg-white border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Dimension
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Outcome
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Risk Factor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {riskData.detailedFactors.map(
                    (factor: any, index: number) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        <td className="px-4 py-2 border-t border-gray-200">
                          {factor.dimension}
                        </td>
                        <td className="px-4 py-2 border-t border-gray-200">
                          {factor.outcome}
                        </td>
                        <td className="px-4 py-2 border-t border-gray-200">
                          <Badge
                            variant={
                              factor.riskFactor > 5
                                ? "destructive"
                                : factor.riskFactor > 2
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {factor.riskFactor}{" "}
                            {factor.riskFactor === 1 ? "point" : "points"}
                          </Badge>
                        </td>
                      </tr>
                    ),
                  )}
                  <tr className="bg-gray-100">
                    <td className="px-4 py-2 font-medium border-t">Total</td>
                    <td className="px-4 py-2 border-t"></td>
                    <td className="px-4 py-2 font-medium border-t">
                      <Badge variant="default">
                        {riskData.score}{" "}
                        {riskData.score === 1 ? "point" : "points"}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

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
          <h2 className="text-2xl font-bold mb-4">
            One Vap Property Risk Index
          </h2>
          <h3 className="text-xl font-medium mb-5">
            {riskResult.propertyDetails.address}
          </h3>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-6">
            {riskResult.propertyDetails.size && (
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm">
                {riskResult.propertyDetails.size} m²
              </Badge>
            )}
            {riskResult.propertyDetails.propertyType && (
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm capitalize">
                {riskResult.propertyDetails.propertyType
                  .charAt(0)
                  .toUpperCase() +
                  riskResult.propertyDetails.propertyType.slice(1)}
              </Badge>
            )}
            {riskResult.propertyDetails.condition && (
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm capitalize flex items-center gap-1">
                {riskResult.propertyDetails.condition.charAt(0).toUpperCase() +
                  riskResult.propertyDetails.condition.slice(1)}{" "}
                Condition
                <span className="ml-1 flex">
                  {riskResult.propertyDetails.condition === "excellent" && (
                    <>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </>
                  )}
                  {riskResult.propertyDetails.condition === "good" && (
                    <>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </>
                  )}
                  {riskResult.propertyDetails.condition === "fair" && (
                    <>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </>
                  )}
                  {riskResult.propertyDetails.condition === "poor" && (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  )}
                </span>
              </Badge>
            )}
          </div>

          {/* Commercial Insurance Premium Range */}
          <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white mb-8 max-w-6xl mx-auto">
            <div className="p-5 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CircleDollarSign className="h-5 w-5 text-blue-700 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-700">
                    Commercial Insurance Premium Range
                  </h3>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 py-1">
                  Monthly Estimate
                </Badge>
              </div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium">
                  R{riskResult.premiumRange?.low} - R{riskResult.premiumRange?.high}
                </h4>
                <div className="text-sm text-gray-500 italic">
                  Based on risk assessment
                </div>
              </div>

              <h5 className="text-sm font-medium mb-2 text-gray-700">Key factors affecting premium:</h5>
              <ul className="text-sm space-y-1">
                {riskResult.premiumRange?.factors.map((factor, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-700 mr-2">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Commercial Risk Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-6xl mx-auto">
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white">
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center">
                  <BatteryCharging className="h-5 w-5 text-gray-700 mr-2" />
                  <h3 className="font-medium text-gray-700">Business Disruption Risk</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Business Interruption Score:</span>
                    <span className={`text-sm font-medium ${
                      riskResult.commercialRisk?.businessInterruptionScore || 0 <= 30 
                        ? "text-green-600" 
                        : riskResult.commercialRisk?.businessInterruptionScore || 0 <= 70 
                        ? "text-yellow-600" 
                        : "text-red-600"
                    }`}>
                      {riskResult.commercialRisk?.businessInterruptionScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${
                      riskResult.commercialRisk?.businessInterruptionScore || 0 <= 30 
                        ? "bg-green-500" 
                        : riskResult.commercialRisk?.businessInterruptionScore || 0 <= 70 
                        ? "bg-yellow-500" 
                        : "bg-red-500"
                    }`} style={{ width: `${riskResult.commercialRisk?.businessInterruptionScore || 0}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-sm">Occupation Type:</span>
                  <span className="text-sm font-medium">{riskResult.commercialRisk?.occupationType}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm">Occupation Risk Level:</span>
                  <Badge className={`${
                    riskResult.commercialRisk?.occupationRiskLevel === "Low" 
                      ? "bg-green-100 text-green-800" 
                      : riskResult.commercialRisk?.occupationRiskLevel === "Medium" 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {riskResult.commercialRisk?.occupationRiskLevel}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white">
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-gray-700 mr-2" />
                  <h3 className="font-medium text-gray-700">Claim Probability Analysis</h3>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fire:</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">{riskResult.claimsProbability?.fire}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${riskResult.claimsProbability?.fire || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Theft:</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">{riskResult.claimsProbability?.theft}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${riskResult.claimsProbability?.theft || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Water Damage:</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">{riskResult.claimsProbability?.waterDamage}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${riskResult.claimsProbability?.waterDamage || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Storm Damage:</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">{riskResult.claimsProbability?.stormDamage}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${riskResult.claimsProbability?.stormDamage || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Liability:</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">{riskResult.claimsProbability?.liability}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${riskResult.claimsProbability?.liability || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property Value Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Replacement Cost
              </p>
              <p className="text-xl font-bold">
                R{riskResult.propertyDetails.replacementCost}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Municipal Valuation
              </p>
              <p className="text-xl font-bold">
                R{riskResult.propertyDetails.municipalValue}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Estimated Market Value
              </p>
              <p className="text-xl font-bold">
                R{riskResult.propertyDetails.estimatedMarketValue}
              </p>
            </div>
          </div>

          {/* Replacement Cost Breakdown */}
          {riskResult.propertyDetails.replacementBreakdown && (
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white mb-8 max-w-6xl mx-auto">
              <div className="p-4 bg-slate-50 border-b">
                <div className="flex items-center">
                  <Layers className="h-5 w-5 text-gray-700 mr-2" />
                  <h3 className="font-medium text-gray-700">Replacement Cost Breakdown</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Building Shell</span>
                      <span className="font-medium">R{riskResult.propertyDetails.replacementBreakdown.buildingShell}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fixtures & Fittings</span>
                      <span className="font-medium">R{riskResult.propertyDetails.replacementBreakdown.fixtures}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "15%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Code Compliance Upgrades</span>
                      <span className="font-medium">R{riskResult.propertyDetails.replacementBreakdown.codeCompliance}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "10%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Replacement Cost</span>
                    <span className="font-semibold">R{riskResult.propertyDetails.replacementCost}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <Info className="h-3 w-3 inline mr-1" />
                    This breakdown helps insurers determine appropriate coverage limits for different aspects of the property.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-6xl mx-auto">
            {/* Risk Score Card */}
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white relative z-10">
              <div className="p-6 flex flex-col items-center">
                <h3 className="text-slate-700 font-medium mb-4">
                  One Vap Property Risk Index
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
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-5xl font-bold">
                      {riskResult.overallRiskScore}%
                    </div>
                  </div>
                </div>
                <div
                  className={`text-xl font-semibold ${riskResult.overallRiskScore <= 33 ? "text-green-600" : riskResult.overallRiskScore <= 66 ? "text-yellow-600" : "text-red-600"}`}
                >
                  {riskResult.riskRating} Risk
                </div>
              </div>
            </div>

            {/* Risk Factors Card */}
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white relative z-10">
              <div className="bg-white px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-gray-700 mr-2" />
                    <h4 className="font-semibold text-gray-700">
                      Risk Factors
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white/20 text-gray-700 hover:bg-white/25">
                      Total: {riskResult.totalRiskPoints}/
                      {riskResult.maxRiskPoints}
                    </Badge>
                    <Badge
                      className={`${
                        riskResult.riskRating === "Very Low" ||
                        riskResult.riskRating === "Low"
                          ? "bg-green-500 text-white"
                          : riskResult.riskRating === "Moderate"
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                      }`}
                    >
                      {riskResult.riskRating} Risk
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="p-5 overflow-auto h-[300px]">
                <div className="space-y-2">
                  {/* Security Risk */}
                  <div className="pb-2 border-b border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">Security</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">
                          {riskResult.riskFactors.securityRisk.score} /{" "}
                          {riskResult.riskFactors.securityRisk.maxScore} (
                          {Math.round(
                            riskResult.riskFactors.securityRisk.percentageScore,
                          )}
                          %)
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            riskResult.riskFactors.securityRisk.rating === "Low"
                              ? "bg-green-100 text-green-800"
                              : riskResult.riskFactors.securityRisk.rating ===
                                  "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {riskResult.riskFactors.securityRisk.rating}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          riskResult.riskFactors.securityRisk.rating === "Low"
                            ? "bg-green-500"
                            : riskResult.riskFactors.securityRisk.rating ===
                                "Medium"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${riskResult.riskFactors.securityRisk.percentageScore}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Environmental Risk */}
                  <div className="pb-2 border-b border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">Environmental</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">
                          {riskResult.riskFactors.environmentalRisk.score} /{" "}
                          {riskResult.riskFactors.environmentalRisk.maxScore} (
                          {Math.round(
                            riskResult.riskFactors.environmentalRisk
                              .percentageScore,
                          )}
                          %)
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            riskResult.riskFactors.environmentalRisk.rating ===
                            "Low"
                              ? "bg-green-100 text-green-800"
                              : riskResult.riskFactors.environmentalRisk
                                    .rating === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {riskResult.riskFactors.environmentalRisk.rating}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          riskResult.riskFactors.environmentalRisk.rating ===
                          "Low"
                            ? "bg-green-500"
                            : riskResult.riskFactors.environmentalRisk
                                  .rating === "Medium"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${riskResult.riskFactors.environmentalRisk.percentageScore}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Flood Risk */}
                  <div className="pb-2 border-b border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">Flood</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">
                          {riskResult.riskFactors.floodRisk.score} /{" "}
                          {riskResult.riskFactors.floodRisk.maxScore} (
                          {Math.round(
                            riskResult.riskFactors.floodRisk.percentageScore,
                          )}
                          %)
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            riskResult.riskFactors.floodRisk.rating === "Low"
                              ? "bg-green-100 text-green-800"
                              : riskResult.riskFactors.floodRisk.rating ===
                                  "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {riskResult.riskFactors.floodRisk.rating}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          riskResult.riskFactors.floodRisk.rating === "Low"
                            ? "bg-green-500"
                            : riskResult.riskFactors.floodRisk.rating ===
                                "Medium"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${riskResult.riskFactors.floodRisk.percentageScore}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Climate Risk */}
                  <div className="pb-2 border-b border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">Climate</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">
                          {riskResult.riskFactors.climateRisk.score} /{" "}
                          {riskResult.riskFactors.climateRisk.maxScore} (
                          {Math.round(
                            riskResult.riskFactors.climateRisk.percentageScore,
                          )}
                          %)
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            riskResult.riskFactors.climateRisk.rating === "Low"
                              ? "bg-green-100 text-green-800"
                              : riskResult.riskFactors.climateRisk.rating ===
                                  "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {riskResult.riskFactors.climateRisk.rating}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          riskResult.riskFactors.climateRisk.rating === "Low"
                            ? "bg-green-500"
                            : riskResult.riskFactors.climateRisk.rating ===
                                "Medium"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${riskResult.riskFactors.climateRisk.percentageScore}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Hail Risk */}
                  <div className="pb-2">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">Hail</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">
                          {riskResult.riskFactors.hailRisk.score} /{" "}
                          {riskResult.riskFactors.hailRisk.maxScore} (
                          {Math.round(
                            riskResult.riskFactors.hailRisk.percentageScore,
                          )}
                          %)
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            riskResult.riskFactors.hailRisk.rating === "Low"
                              ? "bg-green-100 text-green-800"
                              : riskResult.riskFactors.hailRisk.rating ===
                                  "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {riskResult.riskFactors.hailRisk.rating}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          riskResult.riskFactors.hailRisk.rating === "Low"
                            ? "bg-green-500"
                            : riskResult.riskFactors.hailRisk.rating ===
                                "Medium"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${riskResult.riskFactors.hailRisk.percentageScore}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property Location Map */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4"></h3>
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 relative z-10">
              <div className="h-[300px] w-full rounded-lg overflow-hidden">
                <PropertyMap
                  address={riskResult.propertyDetails.address}
                  mapClassName="w-full h-full rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Building Details Card */}
          {riskResult.buildingDetails && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-full bg-amber-500 bg-opacity-20">
                  <Building2 className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold">Building Details</h3>
                <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                  Structure
                </Badge>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left column - Building structure */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-1 text-gray-700">
                      <Building className="h-4 w-4" />
                      <span>Structure Information</span>
                    </h4>

                    <div className="space-y-3">
                      {riskResult.buildingDetails.roofType && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <Home className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Roof Type
                            </span>
                          </div>
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.buildingDetails.roofType}
                          </span>
                        </div>
                      )}

                      {riskResult.buildingDetails.wallMaterial && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <Layers className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Wall Material
                            </span>
                          </div>
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.buildingDetails.wallMaterial}
                          </span>
                        </div>
                      )}

                      {riskResult.buildingDetails.nonStandardStructure && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <CircuitBoard className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Non-Standard Structure
                            </span>
                          </div>
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.buildingDetails.nonStandardStructure}
                          </span>
                        </div>
                      )}

                      {riskResult.buildingDetails.residenceType && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <Home className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Residence Type
                            </span>
                          </div>
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.buildingDetails.residenceType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right column - Safety features */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-1 text-gray-700">
                      <Shield className="h-4 w-4" />
                      <span>Safety Features</span>
                    </h4>

                    <div className="space-y-3">
                      {riskResult.buildingDetails.fireRetardant && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <Flame className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Fire Retardant
                            </span>
                          </div>
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.buildingDetails.fireRetardant}
                          </span>
                        </div>
                      )}

                      {riskResult.buildingDetails.lightningConductor && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <Zap className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Lightning Conductor
                            </span>
                          </div>
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.buildingDetails.lightningConductor}
                          </span>
                        </div>
                      )}

                      {riskResult.buildingDetails.surgeArresterInstalled && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <BatteryCharging className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Surge Arrester
                            </span>
                          </div>
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.buildingDetails.surgeArresterInstalled}
                          </span>
                        </div>
                      )}

                      {riskResult.buildingDetails.nearbyWaterBodies && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <Droplets className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Nearby Water Bodies
                            </span>
                          </div>
                          <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.buildingDetails.nearbyWaterBodies}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Geysers section */}
                {riskResult.buildingDetails.geysers && (
                  <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
                    <h4 className="font-medium mb-3 flex items-center gap-1 text-gray-700">
                      <Droplets className="h-4 w-4" />
                      <span>Geyser Information</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Electric
                          </span>
                          <span className="font-semibold text-blue-700">
                            {riskResult.buildingDetails.geysers.electric}
                          </span>
                        </div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Gas</span>
                          <span className="font-semibold text-orange-700">
                            {riskResult.buildingDetails.geysers.gas}
                          </span>
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Heat Pump
                          </span>
                          <span className="font-semibold text-green-700">
                            {riskResult.buildingDetails.geysers.heatPump}
                          </span>
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Solar Water
                          </span>
                          <span className="font-semibold text-yellow-700">
                            {riskResult.buildingDetails.geysers.solarWater}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Details Card */}
          {riskResult.securityDetails && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-full bg-indigo-500 bg-opacity-20">
                  <Shield className="h-5 w-5 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold">Security Details</h3>
                <Badge className="bg-indigo-500 text-white hover:bg-indigo-600">
                  Safety
                </Badge>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left column - Perimeter security */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-1 text-gray-700">
                      <PanelTop className="h-4 w-4" />
                      <span>Perimeter Protection</span>
                    </h4>

                    <div className="space-y-3">
                      {riskResult.securityDetails.perimeterWallType && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <Layers className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Perimeter Wall Type
                            </span>
                          </div>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.securityDetails.perimeterWallType}
                          </span>
                        </div>
                      )}

                      {riskResult.securityDetails.electricFence && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <Zap className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Electric Fence
                            </span>
                          </div>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.securityDetails.electricFence}
                          </span>
                        </div>
                      )}

                      {riskResult.securityDetails.controlledAccess && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <KeyRound className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Controlled Access
                            </span>
                          </div>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.securityDetails.controlledAccess}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right column - Building security */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-1 text-gray-700">
                      <Lock className="h-4 w-4" />
                      <span>Building Protection</span>
                    </h4>

                    <div className="space-y-3">
                      {riskResult.securityDetails.burglarBars && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <SplitSquareVertical className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Burglar Bars
                            </span>
                          </div>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.securityDetails.burglarBars}
                          </span>
                        </div>
                      )}

                      {riskResult.securityDetails.securityGates && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <GanttChart className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Security Gates
                            </span>
                          </div>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.securityDetails.securityGates}
                          </span>
                        </div>
                      )}

                      {riskResult.securityDetails.radioLinkedAlarm && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <Radio className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Radio-Linked Alarm
                            </span>
                          </div>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.securityDetails.radioLinkedAlarm}
                          </span>
                        </div>
                      )}

                      {riskResult.securityDetails.securityGuard && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded">
                              <ShieldCheck className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="text-sm font-medium">
                              Security Guard
                            </span>
                          </div>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-sm font-medium">
                            {riskResult.securityDetails.securityGuard}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Neighborhood Demographics Card */}
          {riskResult.neighborhoodDemographics && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-full bg-blue-500 bg-opacity-20">
                  <Landmark className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold">
                  Neighborhood Demographics
                </h3>
                <Badge className="bg-blue-500 text-white hover:bg-blue-600">
                  Area Profile
                </Badge>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left column - Demographics */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-1 text-gray-700">
                      <AlertCircle className="h-4 w-4" />
                      <span>Population Demographics</span>
                    </h4>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 p-1.5 rounded">
                            <Clock className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium">
                            Dominant Age Group
                          </span>
                        </div>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                          {riskResult.neighborhoodDemographics.dominantAge}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 p-1.5 rounded">
                            <AlertCircle className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium">
                            Dominant Race
                          </span>
                        </div>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                          {riskResult.neighborhoodDemographics.dominantRace}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 p-1.5 rounded">
                            <AlertCircle className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium">
                            Gender Ratio
                          </span>
                        </div>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                          {riskResult.neighborhoodDemographics.dominantGender}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right column - Economic Indicators */}
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-1 text-gray-700">
                      <CircleDollarSign className="h-4 w-4" />
                      <span>Economic Indicators</span>
                    </h4>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 p-1.5 rounded">
                            <TrendingUp className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium">
                            Income Classification
                          </span>
                        </div>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                          {riskResult.neighborhoodDemographics.incomeClass}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 p-1.5 rounded">
                            <Home className="h-4 w-4 text-slate-500" />
                          </div>
                          <span className="text-sm font-medium">
                            Average Building Value
                          </span>
                        </div>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                          R
                          {
                            riskResult.neighborhoodDemographics
                              .averageBuildingValue
                          }
                        </span>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            National Living Index (NLI)
                          </span>
                          <span className="text-sm font-medium text-blue-600">
                            {riskResult.neighborhoodDemographics.nliIndex}/10
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full bg-blue-600"
                            style={{
                              width: `${(riskResult.neighborhoodDemographics.nliIndex / 10) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Lower Income</span>
                          <span>Middle Income</span>
                          <span>Higher Income</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      <Info className="h-4 w-4 inline mr-1" />
                      Demographics data is based on the latest census
                      information and local surveys.
                    </p>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" /> Updated Feb 2025
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="text-lg font-semibold mb-4">
              Overall Risk Score: {riskResult.totalRiskPoints}/
              {riskResult.maxRiskPoints} ({riskResult.overallRiskScore}%) -{" "}
              {riskResult.riskRating} Risk Property
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
          {renderRiskCategory(
            "Security",
            riskResult.riskFactors.securityRisk,
            getRiskIcon("security"),
          )}

          {/* Environmental Risk */}
          {renderRiskCategory(
            "Environmental",
            riskResult.riskFactors.environmentalRisk,
            getRiskIcon("environmental"),
          )}

          {/* Flood Risk */}
          {renderRiskCategory(
            "Flood",
            riskResult.riskFactors.floodRisk,
            getRiskIcon("flood"),
          )}

          {/* Climate Risk */}
          {renderRiskCategory(
            "Climate",
            riskResult.riskFactors.climateRisk,
            getRiskIcon("climate"),
          )}

          {/* Hail Risk */}
          {renderRiskCategory(
            "Hail",
            riskResult.riskFactors.hailRisk,
            getRiskIcon("hail"),
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 relative z-10">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">
                Low Risk (0-33%)
              </h4>
              <div className="w-full h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">
                Medium Risk (34-66%)
              </h4>
              <div className="w-full h-2 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <h4 className="font-medium text-red-800 mb-2">
                High Risk (67-100%)
              </h4>
              <div className="w-full h-2 bg-red-500 rounded-full"></div>
            </div>
          </div>

          <div className="text-lg font-semibold mb-4 mt-8">
            Total Risk Score: {riskResult.totalRiskPoints} out of{" "}
            {riskResult.maxRiskPoints} ({riskResult.overallRiskScore}%) -{" "}
            {riskResult.riskRating} Risk
          </div>

          <div className="bg-blue-50 p-6 rounded-lg relative z-10">
            <h4 className="text-blue-600 font-semibold text-lg mb-3">
              Risk Assessment Summary
            </h4>
            <p className="text-gray-700 mb-4">
              This property presents an overall{" "}
              {riskResult.riskRating.toLowerCase()} risk profile (
              {riskResult.overallRiskScore}%), with most risk factors being
              well-managed or naturally low. However, there are specific areas
              of concern:
            </p>
            <ul className="space-y-4 ml-5 list-disc">
              <li>
                <span className="text-red-600 font-medium">
                  High Flood Risk:
                </span>{" "}
                The property's location in a flood-prone area represents the
                most significant risk factor and should be carefully considered.
              </li>

              <li>
                <span className="text-amber-600 font-medium">
                  Medium Security Risk:
                </span>{" "}
                While not critical, security measures could be improved to
                enhance property protection.
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

          {/* Commercial Premium Reduction Opportunities */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg mb-6 shadow-sm relative z-10">
            <div className="flex items-center mb-4">
              <CircleDollarSign className="h-6 w-6 text-blue-700 mr-3" />
              <h4 className="text-lg font-semibold text-blue-700">Premium Reduction Opportunities</h4>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex">
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  <div className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    12%
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Install Fire Suppression System</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Modern automatic sprinkler system could reduce premium by up to 12% and significantly mitigate fire damage risk.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex">
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  <div className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    8%
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Upgrade Security System</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Adding 24/7 monitored alarm system with armed response could reduce theft-related premiums by approximately 8%.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex">
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  <div className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    5%
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Install Backup Power System</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Backup generator with automatic transfer switch could reduce business interruption coverage costs by approximately 5%.
                  </p>
                </div>
              </div>
            </div>
          </div>

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

        {/* Report Footer */}
        <div className="pt-6 border-t text-center text-sm text-muted-foreground mb-8">
          <div className="flex items-center justify-center">
            <img
              src="/proply-favicon.png"
              alt="Proply Logo"
              className="h-4 w-4 mr-2"
            />
            <span>
              Powered by Proply Risk Index™ - Report generated on{" "}
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
          <StaticPDFButton
            pdfPath="/Property Risk Assessment - One Vap.pdf"
            className="bg-blue-500 hover:bg-blue-600 text-white w-full max-w-md h-10 py-2 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium"
            propertyAddress={riskResult?.propertyDetails?.address}
          >
            Download Full Report
          </StaticPDFButton>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* One Vap Logo */}
      <div className="absolute top-8 left-8 z-20">
        <img
          src="/1VAP Visionary Logo [12].png"
          alt="One Vap Logo"
          className="h-12 w-auto"
        />
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 min-h-screen w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="fixed inset-0 min-h-screen bg-[radial-gradient(circle_800px_at_50%_200px,#e5f9ff,transparent)]" />
      </div>

      {/* Enhanced Background Patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="fixed inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#8884_1px,transparent_1px),linear-gradient(to_bottom,#8884_1px,transparent_1px)] bg-[size:14px_24px]"></div>

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
          <h1 className="text-6xl font-bold">One Vap Commercial Property Risk Index</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A comprehensive assessment of commercial property risks including security,
            environmental, business interruption, structural integrity, and regulatory compliance factors.
          </p>
        </div>

        {!showResult ? (
          // Form section
          <Card className="max-w-2xl mx-auto relative z-10 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-center">
                Commercial Property Risk Assessment
              </CardTitle>
              <CardDescription className="text-center">
                Enter commercial property details for comprehensive risk analysis
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
                        <SelectItem value="office">Office Building</SelectItem>
                        <SelectItem value="retail">Retail Space</SelectItem>
                        <SelectItem value="warehouse">Warehouse/Industrial</SelectItem>
                        <SelectItem value="mixed">Mixed-Use Commercial</SelectItem>
                        <SelectItem value="healthcare">Healthcare Facility</SelectItem>
                        <SelectItem value="hospitality">Hotel/Hospitality</SelectItem>
                        <SelectItem value="apartment">Apartment Block (Multi-Unit)</SelectItem>
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
                        onChange={(e) =>
                          handleInputChange("size", e.target.value)
                        }
                        className="pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-muted-foreground">m²</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commercial Property Specifics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <Label htmlFor="yearBuilt" className="mb-1 block">
                      Year Built
                    </Label>
                    <Input
                      id="yearBuilt"
                      placeholder="e.g. 2005"
                      value={formData.yearBuilt}
                      onChange={(e) =>
                        handleInputChange("yearBuilt", e.target.value)
                      }
                    />
                  </div>

                  <div className="text-center">
                    <Label htmlFor="stories" className="mb-1 block">
                      Number of Stories
                    </Label>
                    <Input
                      id="stories"
                      placeholder="1"
                      value={formData.stories}
                      onChange={(e) =>
                        handleInputChange("stories", e.target.value)
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

                {/* Commercial Risk Assessment */}
                <div className="mt-8 mb-4 p-4 border border-blue-100 rounded-lg bg-blue-50">
                  <h3 className="text-lg font-medium text-center mb-4">
                    Commercial Risk Factors
                  </h3>
                  <div className="space-y-6">
                    <div className="text-center">
                      <Label htmlFor="businessInterruption" className="mb-1 block">
                        Business Interruption Protection
                      </Label>
                      <Select
                        value={formData.businessInterruptionCoverage || ""}
                        onValueChange={(value) =>
                          handleInputChange("businessInterruptionCoverage", value)
                        }
                      >
                        <SelectTrigger id="businessInterruption">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comprehensive">Comprehensive Plan</SelectItem>
                          <SelectItem value="basic">Basic Coverage</SelectItem>
                          <SelectItem value="none">No Coverage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="text-center">
                      <Label htmlFor="buildingRegCompliance" className="mb-1 block">
                        Building Regulatory Compliance
                      </Label>
                      <Select
                        value={formData.regulatoryCompliance || ""}
                        onValueChange={(value) =>
                          handleInputChange("regulatoryCompliance", value)
                        }
                      >
                        <SelectTrigger id="buildingRegCompliance">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fullcompliance">Full Compliance</SelectItem>
                          <SelectItem value="partial">Partial Compliance</SelectItem>
                          <SelectItem value="pending">Compliance Pending</SelectItem>
                          <SelectItem value="unknown">Unknown Status</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Building Details Section */}
                <div className="mt-8 mb-4">
                  <h3 className="text-lg font-medium text-center mb-4">
                    Building Details
                  </h3>
                  <div className="space-y-6">
                    {/* Roof Type */}
                    <div className="text-center">
                      <Label htmlFor="roofType" className="mb-1 block">
                        What type of roof does the building have?
                      </Label>
                      <Select
                        value={formData.roofType}
                        onValueChange={(value) =>
                          handleInputChange("roofType", value)
                        }
                      >
                        <SelectTrigger id="roofType">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asbestos">Asbestos</SelectItem>
                          <SelectItem value="concrete">Concrete</SelectItem>
                          <SelectItem value="corrugated iron">
                            Corrugated iron
                          </SelectItem>
                          <SelectItem value="fibre cement">
                            Fibre cement
                          </SelectItem>
                          <SelectItem value="wood">Wood</SelectItem>
                          <SelectItem value="wooden shingles">
                            Wooden shingles
                          </SelectItem>
                          <SelectItem value="slate">Slate</SelectItem>
                          <SelectItem value="thatch">Thatch</SelectItem>
                          <SelectItem value="tile">Tile</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Non-standard Structure */}
                    <div className="text-center">
                      <Label
                        htmlFor="nonStandardStructure"
                        className="mb-1 block"
                      >
                        Is there any non-standard structure on your property or
                        a structure with a thatched roof, with a roofed area
                        greater than 15% of the roofed area of the main
                        building?
                      </Label>
                      <Select
                        value={formData.nonStandardStructure}
                        onValueChange={(value) =>
                          handleInputChange("nonStandardStructure", value)
                        }
                      >
                        <SelectTrigger id="nonStandardStructure">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Wall Material */}
                    <div className="text-center">
                      <Label htmlFor="wallMaterial" className="mb-1 block">
                        What material are the walls of the building made of?
                      </Label>
                      <Select
                        value={formData.wallMaterial}
                        onValueChange={(value) =>
                          handleInputChange("wallMaterial", value)
                        }
                      >
                        <SelectTrigger id="wallMaterial">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asbestos">Asbestos</SelectItem>
                          <SelectItem value="brick">Brick</SelectItem>
                          <SelectItem value="concrete">Concrete</SelectItem>
                          <SelectItem value="corrugated iron">
                            Corrugated iron
                          </SelectItem>
                          <SelectItem value="fibre cement">
                            Fibre cement
                          </SelectItem>
                          <SelectItem value="precast concrete">
                            Precast concrete
                          </SelectItem>
                          <SelectItem value="prefabricated">
                            Prefabricated
                          </SelectItem>
                          <SelectItem value="shingle">Shingle</SelectItem>
                          <SelectItem value="stone">Stone</SelectItem>
                          <SelectItem value="timber-framed">
                            Timber-framed with Gypsum cladding
                          </SelectItem>
                          <SelectItem value="wood">Wood</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Conditional section for thatch/wooden buildings */}
                    {(formData.roofType === "thatch" ||
                      formData.roofType === "wood" ||
                      formData.roofType === "wooden shingles" ||
                      formData.nonStandardStructure === "yes" ||
                      formData.wallMaterial === "wood") && (
                      <div className="space-y-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                        <p className="text-sm text-center font-medium mb-2">
                          Additional questions for thatch/wooden buildings:
                        </p>

                        {/* Fire Retardant */}
                        <div className="text-center">
                          <Label
                            htmlFor="fireRetardant"
                            className="mb-1 block text-sm"
                          >
                            Has the thatch/wooden shingles been treated with
                            SABS-approved fire retardant?
                          </Label>
                          <Select
                            value={formData.fireRetardant}
                            onValueChange={(value) =>
                              handleInputChange("fireRetardant", value)
                            }
                          >
                            <SelectTrigger id="fireRetardant">
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Lightning Conductor */}
                        <div className="text-center">
                          <Label
                            htmlFor="lightningConductor"
                            className="mb-1 block text-sm"
                          >
                            Is there a lightning conductor installed at the
                            building?
                          </Label>
                          <Select
                            value={formData.lightningConductor}
                            onValueChange={(value) =>
                              handleInputChange("lightningConductor", value)
                            }
                          >
                            <SelectTrigger id="lightningConductor">
                              <SelectValue placeholder="Please select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Occupancy Type */}
                    <div className="text-center">
                      <Label htmlFor="residenceType" className="mb-1 block">
                        What is the occupancy type of this property?
                      </Label>
                      <Select
                        value={formData.residenceType}
                        onValueChange={(value) =>
                          handleInputChange("residenceType", value)
                        }
                      >
                        <SelectTrigger id="residenceType">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner-Occupied</SelectItem>
                          <SelectItem value="tenant">
                            Single-Tenant Leased
                          </SelectItem>
                          <SelectItem value="multi-tenant">Multi-Tenant Leased</SelectItem>
                          <SelectItem value="vacant">Vacant</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Business Usage */}
                    <div className="text-center">
                      <Label htmlFor="isCommune" className="mb-1 block">
                        What business activities are conducted on the premises?
                      </Label>
                      <Select
                        value={formData.isCommune}
                        onValueChange={(value) =>
                          handleInputChange("isCommune", value)
                        }
                      >
                        <SelectTrigger id="isCommune">
                          <SelectValue placeholder="Please select primary usage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="office">Office/Administrative</SelectItem>
                          <SelectItem value="retail">Retail/Sales</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="storage">Storage/Warehousing</SelectItem>
                          <SelectItem value="food">Food Service</SelectItem>
                          <SelectItem value="medical">Medical/Healthcare</SelectItem>
                          <SelectItem value="mixed">Mixed Use</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Is Plot or Farm */}
                    <div className="text-center">
                      <Label htmlFor="isPlotOrFarm" className="mb-1 block">
                        Is the property a plot, smallholding or farm?
                      </Label>
                      <Select
                        value={formData.isPlotOrFarm}
                        onValueChange={(value) =>
                          handleInputChange("isPlotOrFarm", value)
                        }
                      >
                        <SelectTrigger id="isPlotOrFarm">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Geysers */}
                    <div className="text-center">
                      <Label className="mb-3 block">
                        How many geysers are at the building?
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="electricGeysers"
                            className="mb-1 block text-sm"
                          >
                            Electric geysers
                          </Label>
                          <Input
                            id="electricGeysers"
                            value={formData.geysers.electric}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                geysers: {
                                  ...prev.geysers,
                                  electric: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="gasGeysers"
                            className="mb-1 block text-sm"
                          >
                            Gas geysers
                          </Label>
                          <Input
                            id="gasGeysers"
                            value={formData.geysers.gas}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                geysers: {
                                  ...prev.geysers,
                                  gas: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="heatPumpGeysers"
                            className="mb-1 block text-sm"
                          >
                            Heat pump geysers
                          </Label>
                          <Input
                            id="heatPumpGeysers"
                            value={formData.geysers.heatPump}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                geysers: {
                                  ...prev.geysers,
                                  heatPump: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="solarWaterGeysers"
                            className="mb-1 block text-sm"
                          >
                            Solar/water tank geysers
                          </Label>
                          <Input
                            id="solarWaterGeysers"
                            value={formData.geysers.solarWater}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                geysers: {
                                  ...prev.geysers,
                                  solarWater: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Note: Geysers are not automatically covered. Please
                        select the Damage to geysers optional benefit.
                      </p>
                    </div>

                    {/* Nearby Water Bodies */}
                    <div className="text-center">
                      <Label htmlFor="nearbyWaterBodies" className="mb-1 block">
                        Are there any water bodies within 100m of the building –
                        like a dam, lake or a river?
                      </Label>
                      <Select
                        value={formData.nearbyWaterBodies}
                        onValueChange={(value) =>
                          handleInputChange("nearbyWaterBodies", value)
                        }
                      >
                        <SelectTrigger id="nearbyWaterBodies">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Surge Arrester */}
                    <div className="text-center">
                      <Label
                        htmlFor="surgeArresterInstalled"
                        className="mb-1 block"
                      >
                        Is an approved surge arrester installed on the main
                        electrical distribution board?
                      </Label>
                      <Select
                        value={formData.surgeArresterInstalled}
                        onValueChange={(value) =>
                          handleInputChange("surgeArresterInstalled", value)
                        }
                      >
                        <SelectTrigger id="surgeArresterInstalled">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        Note: Must meet SANS/IEC 61643-11 standards and several
                        installation criteria.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="mt-8 mb-4">
                  <h3 className="text-lg font-medium text-center mb-4">
                    Security
                  </h3>
                  <div className="space-y-6">
                    {/* Perimeter Wall Type */}
                    <div className="text-center">
                      <Label htmlFor="perimeterWallType" className="mb-1 block">
                        What type of perimeter wall does the property have?
                      </Label>
                      <Select
                        value={formData.perimeterWallType}
                        onValueChange={(value) =>
                          handleInputChange("perimeterWallType", value)
                        }
                      >
                        <SelectTrigger id="perimeterWallType">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no fence">No fence</SelectItem>
                          <SelectItem value="wire fence">Wire fence</SelectItem>
                          <SelectItem value="brick wall lower than 1.8m">
                            Brick wall lower than 1.8m
                          </SelectItem>
                          <SelectItem value="brick wall higher than 1.8m">
                            Brick wall higher than 1.8m
                          </SelectItem>
                          <SelectItem value="pre-cast wall lower than 1.8m">
                            Pre-cast wall lower than 1.8m
                          </SelectItem>
                          <SelectItem value="pre-cast wall higher than 1.8m">
                            Pre-cast wall higher than 1.8m
                          </SelectItem>
                          <SelectItem value="palisade wall lower than 1.8m">
                            Palisade wall lower than 1.8m
                          </SelectItem>
                          <SelectItem value="palisade wall higher than 1.8m">
                            Palisade wall higher than 1.8m
                          </SelectItem>
                          <SelectItem value="wood fence lower than 1.8m">
                            Wood fence lower than 1.8m
                          </SelectItem>
                          <SelectItem value="wood fence higher than 1.8m">
                            Wood fence higher than 1.8m
                          </SelectItem>
                          <SelectItem value="pre-fabricated wire mesh lower than 1.8m">
                            Pre-fabricated wire mesh lower than 1.8m
                          </SelectItem>
                          <SelectItem value="pre-fabricated wire mesh higher than 1.8m">
                            Pre-fabricated wire mesh higher than 1.8m
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Radio-linked Alarm */}
                    <div className="text-center">
                      <Label htmlFor="radioLinkedAlarm" className="mb-1 block">
                        Is there a radio-linked alarm installed?
                      </Label>
                      <Select
                        value={formData.radioLinkedAlarm}
                        onValueChange={(value) =>
                          handleInputChange("radioLinkedAlarm", value)
                        }
                      >
                        <SelectTrigger id="radioLinkedAlarm">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Security Gates */}
                    <div className="text-center">
                      <Label htmlFor="securityGates" className="mb-1 block">
                        Are there security gates on all the external doors,
                        including sliding doors?
                      </Label>
                      <Select
                        value={formData.securityGates}
                        onValueChange={(value) =>
                          handleInputChange("securityGates", value)
                        }
                      >
                        <SelectTrigger id="securityGates">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Burglar Bars */}
                    <div className="text-center">
                      <Label htmlFor="burglarBars" className="mb-1 block">
                        Are there burglar bars on all the opening windows?
                      </Label>
                      <Select
                        value={formData.burglarBars}
                        onValueChange={(value) =>
                          handleInputChange("burglarBars", value)
                        }
                      >
                        <SelectTrigger id="burglarBars">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Controlled Access */}
                    <div className="text-center">
                      <Label htmlFor="controlledAccess" className="mb-1 block">
                        Is there controlled access to the property?
                      </Label>
                      <Select
                        value={formData.controlledAccess}
                        onValueChange={(value) =>
                          handleInputChange("controlledAccess", value)
                        }
                      >
                        <SelectTrigger id="controlledAccess">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">
                        For instance, is there a security guard that allows
                        access to the complex/estate, or does the client have a
                        special code or remote that allows access?
                      </p>
                    </div>

                    {/* Security Guard */}
                    <div className="text-center">
                      <Label htmlFor="securityGuard" className="mb-1 block">
                        Is there a 24hr security guard at the address?
                      </Label>
                      <Select
                        value={formData.securityGuard}
                        onValueChange={(value) =>
                          handleInputChange("securityGuard", value)
                        }
                      >
                        <SelectTrigger id="securityGuard">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Electric Fence */}
                    <div className="text-center">
                      <Label htmlFor="electricFence" className="mb-1 block">
                        Is there an electric fence covering all the perimeter
                        walls of the property?
                      </Label>
                      <Select
                        value={formData.electricFence}
                        onValueChange={(value) =>
                          handleInputChange("electricFence", value)
                        }
                      >
                        <SelectTrigger id="electricFence">
                          <SelectValue placeholder="Please select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
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
