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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

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

export default function RiskIndexPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [demoClicks, setDemoClicks] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [currentStep, setCurrentStep] = useState(1); // Track the current form step (1-3)
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
    
    // Building Details
    roofType: "",
    nonStandardStructure: "no",
    wallMaterial: "",
    fireRetardant: "no",
    lightningConductor: "no",
    residenceType: "main",
    isCommune: "no",
    isPlotOrFarm: "no",
    landUsage: [] as string[],
    geysers: {
      electric: "0",
      gas: "0",
      heatPump: "0",
      solarWater: "0",
    },
    nearbyWaterBodies: "no",
    surgeArresterInstalled: "no",
    
    // Security Details
    perimeterWallType: "",
    radioLinkedAlarm: "no",
    securityGates: "no",
    burglarBars: "no",
    controlledAccess: "no",
    securityGuard: "no",
    electricFence: "no",
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

  // Navigation functions for the multi-step form
  const goToNextStep = () => {
    // Validate current step fields before proceeding
    if (currentStep === 1) {
      // Validate Property Details
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
    } else if (currentStep === 2) {
      // Validate Building Details
      if (!formData.roofType) {
        toast({
          title: "Missing Roof Type",
          description: "Please select the type of roof.",
          variant: "destructive",
        });
        return;
      }
    }

    // If validation passes, move to the next step
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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
          
          // Building Details
          roofType: "concrete",
          nonStandardStructure: "no",
          wallMaterial: "brick",
          fireRetardant: "yes",
          lightningConductor: "no",
          residenceType: "main",
          isCommune: "no",
          isPlotOrFarm: "no",
          landUsage: ["residence", "retail"] as string[],
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
    const bedrooms = Number(formData.bedrooms) || 0;
    const bathrooms = Number(formData.bathrooms) || 0;
    const parking = Number(formData.parking) || 0;

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
    if (formData.propertyType === "apartment") {
      securityRiskFactors.push(
        "Property is located in an apartment building with shared access",
      );
    } else if (formData.propertyType === "house") {
      securityRiskFactors.push(
        "Standalone structure with multiple entry points",
      );
    } else if (formData.propertyType === "townhouse") {
      securityRiskFactors.push(
        "Townhouse with multiple levels and entry points",
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

    // Sum up climate risk score
    climateRiskScore = climateDetailedFactors.reduce(
      (total, factor) => total + factor.riskFactor,
      0,
    );

    // Parse property location information for summary
    const locationParts = formData.address.split(",").map((part) => part.trim());
    const suburb =
      locationParts.length > 1 ? locationParts[1] : "Cape Town City Centre";

    // Climate risk rating based on percentage of max score
    const climateRiskPercentage = (climateRiskScore / climateRiskMaxScore) * 100;
    let climateRiskRating: "Low" | "Medium" | "High" =
      climateRiskPercentage < 33
        ? "Low"
        : climateRiskPercentage < 66
          ? "Medium"
          : "High";

    // Add narrative information for climate risk
    if (formData.address.toLowerCase().includes("cape town city centre")) {
      climateRiskFactors.push(
        "Urban heat island effect increases temperature risks",
      );
      climateRiskFactors.push(
        "Building density elevates localized climate impacts",
      );
      climateRiskFactors.push(
        "Proximity to coastline increases vulnerability to extreme weather events",
      );
      climateRiskFactors.push(
        "Concrete surfaces limit natural cooling and drainage",
      );
    } else {
      climateRiskFactors.push(
        "Location may be subjected to localized temperature variations",
      );
      climateRiskFactors.push(
        "Limited vegetation coverage impacts local heat regulation",
      );
      climateRiskFactors.push(
        "Drought conditions may affect property over coming decades",
      );
    }

    // HAIL RISK CALCULATION
    const hailRiskMaxScore = 10;
    let hailRiskScore = 5;
    const hailRiskFactors: string[] = [];
    const hailDetailedFactors: Array<{
      dimension: string;
      outcome: string;
      riskFactor: number;
    }> = [];

    // Hail risk assessment
    const hailRisk = "Medium";
    hailDetailedFactors.push({
      dimension: "Hail damage potential",
      outcome: hailRisk,
      riskFactor: hailRiskScore,
    });

    // Add hail risk metrics
    const maxHailSize = "2.5 cm";
    const annualFrequency = 1.2;
    const damageProb = 0.35;
    const roofVulnerability = "Medium" as "Low" | "Medium" | "High";
    const returnPeriod = "1-in-3 years";

    // Add narrative information for hail risk
    hailRiskFactors.push(
      "Property faces moderate risk of hail damage based on historical patterns",
    );
    hailRiskFactors.push(
      "Roof type and building materials provide some protection against small to medium hail",
    );
    hailRiskFactors.push(
      "Large hail events (>2cm) occur approximately once every 3 years in this region",
    );
    hailRiskFactors.push(
      "Solar installations and exterior fixtures may be vulnerable to damage",
    );

    // Hail risk rating based on percentage of max score
    const hailRiskPercentage = (hailRiskScore / hailRiskMaxScore) * 100;
    let hailRiskRating: "Low" | "Medium" | "High" =
      hailRiskPercentage < 33
        ? "Low"
        : hailRiskPercentage < 66
          ? "Medium"
          : "High";

    // OVERALL RISK CALCULATION
    // Sum up all risk scores and their maximums
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

    // Determine the overall risk rating
    let riskRating: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
    let riskColor: string;

    if (overallRiskPercentage < 20) {
      riskRating = "Very Low";
      riskColor = "green";
    } else if (overallRiskPercentage < 40) {
      riskRating = "Low";
      riskColor = "lime";
    } else if (overallRiskPercentage < 60) {
      riskRating = "Moderate";
      riskColor = "yellow";
    } else if (overallRiskPercentage < 80) {
      riskRating = "High";
      riskColor = "orange";
    } else {
      riskRating = "Very High";
      riskColor = "red";
    }

    // Create projections based on risk factors
    const projections = {
      shortTerm: "Risk level expected to remain stable over next 1-2 years.",
      mediumTerm:
        "Moderate increase in risk possible within 3-5 years due to climate factors.",
      longTerm:
        "Long-term climate projections suggest gradual risk elevation over 10+ years.",
      trendDirection: "stable" as "up" | "stable" | "down",
    };

    // Generate specific recommendations based on identified risks
    const recommendations = [
      "Implement additional security measures including motion-sensing lights and CCTV.",
      "Consider flood mitigation measures for ground floor and basement areas.",
      "Ensure adequate insurance coverage for climate and environmental risks.",
      "Roof maintenance should be prioritized to minimize storm and hail damage risks.",
      "Install surge protection devices to mitigate electrical damage during storms.",
    ];

    // Generate risk summary
    const riskSummary = `The property at ${formData.address} presents a ${riskRating.toLowerCase()} overall risk profile for insurance purposes. Key concerns include flood vulnerability, fire risk factors, and moderate security considerations. Climate projections suggest stable risk in the near term with potential increases over longer timeframes. Implementing the recommended risk mitigation measures could significantly improve the property's insurability and potentially reduce premium costs.`;

    // Construct the full result object
    const result: RiskResult = {
      overallRiskScore: Math.round(overallRiskPercentage),
      totalRiskPoints,
      maxRiskPoints,
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
        suburb: suburb,
        city: "Cape Town",
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
        marketVolatility: 30, // Placeholder value (out of 100)
        locationRisk: 45, // Placeholder value (out of 100)
        propertyConditionRisk: 25, // Placeholder value (out of 100)
        financialRisk: 20, // Placeholder value (out of 100)
        demographicTrends: 35, // Placeholder value (out of 100)
        regulatoryRisk: 15, // Placeholder value (out of 100)
      },
      projections,
      recommendations,
      riskSummary,
    };

    return result;
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
    setCurrentStep(1);
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

      // Default rendering (fallback)
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
              {Math.round(riskData.percentageScore)}%
            </Badge>
          </div>
          <div className="mb-4">
            {renderRiskLevelIndicator(
              riskData.percentageScore,
              riskData.rating,
            )}
          </div>
          <div className="text-sm text-gray-600">
            <ul className="space-y-1 list-disc pl-5">
              {riskData.factors.slice(0, 3).map((factor: string, i: number) => (
                <li key={i}>{factor}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    };

    return (
      <div className="pb-4">
        {/* Overall Risk Score Card */}
        <div className="mb-8 p-6 bg-white rounded-lg border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                Proply Risk Index™ Score
              </h2>
              <p className="text-gray-600 mb-4">
                {riskResult.propertyDetails.address}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Generated on</p>
              <p className="font-medium">
                {new Date().toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* Score Visualization */}
            <div className="lg:col-span-1 p-5 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center mb-3 ${
                  riskResult.riskRating === "Very Low" ||
                  riskResult.riskRating === "Low"
                    ? "bg-green-100 text-green-800"
                    : riskResult.riskRating === "Moderate"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                <span className="text-4xl font-bold">
                  {riskResult.overallRiskScore}
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Overall Risk</h3>
                <Badge
                  className={`mt-1 ${
                    riskResult.riskRating === "Very Low" ||
                    riskResult.riskRating === "Low"
                      ? "bg-green-500"
                      : riskResult.riskRating === "Moderate"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                >
                  {riskResult.riskRating}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  {riskResult.totalRiskPoints} out of {riskResult.maxRiskPoints}{" "}
                  points
                </p>
              </div>
            </div>

            {/* Property Overview */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-3">Property Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Property Type</p>
                  <p className="font-medium capitalize">
                    {riskResult.propertyDetails.propertyType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Size</p>
                  <p className="font-medium">
                    {riskResult.propertyDetails.size} m²
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                  <p className="font-medium">
                    {riskResult.propertyDetails.bedrooms || "0"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bathrooms</p>
                  <p className="font-medium">
                    {riskResult.propertyDetails.bathrooms || "0"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Parking</p>
                  <p className="font-medium">
                    {riskResult.propertyDetails.parking || "0"} spaces
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Condition</p>
                  <p className="font-medium capitalize">
                    {riskResult.propertyDetails.condition}
                  </p>
                </div>
              </div>

              {/* Risk Summary */}
              <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-100">
                <h4 className="text-blue-800 font-medium mb-2">Risk Summary</h4>
                <p className="text-sm text-gray-700">
                  {riskResult.riskSummary}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Risk Assessment */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-5">Detailed Risk Assessment</h2>

          {/* Security Risk */}
          {renderRiskCategory(
            "Security",
            riskResult.riskFactors.securityRisk,
            <Shield className="h-5 w-5" />,
          )}

          {/* Environmental Risk */}
          {renderRiskCategory(
            "Environmental",
            riskResult.riskFactors.environmentalRisk,
            <Cloud className="h-5 w-5" />,
          )}

          {/* Flood Risk */}
          {renderRiskCategory(
            "Flood",
            riskResult.riskFactors.floodRisk,
            <CloudRain className="h-5 w-5" />,
          )}

          {/* Climate Risk */}
          {renderRiskCategory(
            "Climate",
            riskResult.riskFactors.climateRisk,
            <Thermometer className="h-5 w-5" />,
          )}

          {/* Hail Risk */}
          {renderRiskCategory(
            "Hail",
            riskResult.riskFactors.hailRisk,
            <Umbrella className="h-5 w-5" />,
          )}
        </div>

        {/* Future Projections */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-5">Future Risk Projections</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-gray-50 rounded-lg border">
              <div className="flex items-center mb-3">
                <Clock className="h-5 w-5 mr-2 text-indigo-500" />
                <h3 className="font-semibold">Short-Term (1-2 years)</h3>
              </div>
              <p className="text-sm text-gray-700">
                {riskResult.projections.shortTerm}
              </p>
            </div>
            <div className="p-5 bg-gray-50 rounded-lg border">
              <div className="flex items-center mb-3">
                <Clock className="h-5 w-5 mr-2 text-indigo-500" />
                <h3 className="font-semibold">Medium-Term (3-5 years)</h3>
              </div>
              <p className="text-sm text-gray-700">
                {riskResult.projections.mediumTerm}
              </p>
            </div>
            <div className="p-5 bg-gray-50 rounded-lg border">
              <div className="flex items-center mb-3">
                <Clock className="h-5 w-5 mr-2 text-indigo-500" />
                <h3 className="font-semibold">Long-Term (10+ years)</h3>
              </div>
              <p className="text-sm text-gray-700">
                {riskResult.projections.longTerm}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm font-medium mr-2">Trend:</span>
                {riskResult.projections.trendDirection === "up" ? (
                  <div className="flex items-center text-red-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">Increasing Risk</span>
                  </div>
                ) : riskResult.projections.trendDirection === "down" ? (
                  <div className="flex items-center text-green-500">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    <span className="text-sm">Decreasing Risk</span>
                  </div>
                ) : (
                  <div className="flex items-center text-blue-500">
                    <BarChart2 className="h-4 w-4 mr-1" />
                    <span className="text-sm">Stable Risk</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-5">Risk Mitigation Recommendations</h2>
          <div className="p-6 bg-green-50 rounded-lg border border-green-100">
            <ul className="space-y-3">
              {riskResult.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Email Report */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-5">Save or Share Report</h2>
          <div className="p-6 bg-gray-50 rounded-lg border">
            <p className="mb-4 text-gray-700">
              You can email this report to yourself or share it with others for
              insurance or property management purposes.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <EmailPDFButton
                  subject={`Property Risk Report: ${riskResult.propertyDetails.address}`}
                  text="Email Report"
                  fileName={`Proply_Risk_Report_${riskResult.propertyDetails.address
                    .replace(/[^a-zA-Z0-9]/g, "_")
                    .substring(0, 30)}.pdf`}
                  elementId="risk-report"
                  width={1000}
                />
              </div>
              <Button variant="outline" className="flex gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg border">
          <p className="mb-2 font-medium">Disclaimer:</p>
          <p>
            This risk assessment is provided for informational purposes only and
            is not a guarantee of future performance or events. The assessment is
            based on available data and statistical models which may have
            limitations. Proply does not assume any liability for decisions made
            based on this report. We recommend consulting with qualified
            insurance professionals for comprehensive coverage advice.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container py-12 px-4 mx-auto max-w-[1200px]">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Hollard Risk Index
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete the form below to generate a comprehensive risk assessment for your property. This analysis provides insurers with critical information for tailored coverage and underwriting.
          </p>
        </div>

        {!showResult ? (
          // Form section
          <Card className="max-w-2xl mx-auto relative z-10 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-center">
                Hollard Property Risk Index
              </CardTitle>
              <CardDescription className="text-center">
                Enter property details for a detailed risk analysis
              </CardDescription>
              
              {/* Step indicator */}
              <div className="flex justify-center mt-4">
                <div className="grid grid-cols-3 gap-1 w-full max-w-md">
                  <div 
                    className={`px-4 py-2 text-center text-sm rounded-l-md ${
                      currentStep === 1 
                        ? "bg-primary text-white" 
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    1. Property Details
                  </div>
                  <div 
                    className={`px-4 py-2 text-center text-sm ${
                      currentStep === 2 
                        ? "bg-primary text-white" 
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    2. Building Details
                  </div>
                  <div 
                    className={`px-4 py-2 text-center text-sm rounded-r-md ${
                      currentStep === 3 
                        ? "bg-primary text-white" 
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    3. Security Details
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <form onSubmit={handleFormSubmit}>
              <CardContent className="space-y-8">
                {/* Step 1: Property Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-center">Property Details</h3>
                    
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
                    
                    {/* Property Purchase Price */}
                    <div className="text-center">
                      <Label htmlFor="purchasePrice" className="mb-1 block">
                        Property Value/Purchase Price
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="purchasePrice"
                          placeholder="0"
                          value={formData.purchasePrice}
                          onChange={(e) =>
                            handleInputChange("purchasePrice", e.target.value)
                          }
                          className="pr-10"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-muted-foreground">R</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Building Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-center">Building Details</h3>
                    
                    {/* Roof Type */}
                    <div className="text-center">
                      <Label htmlFor="roofType" className="mb-1 block">
                        What type of roof does the building have?
                      </Label>
                      <Select
                        value={formData.roofType}
                        onValueChange={(value) => handleInputChange("roofType", value)}
                      >
                        <SelectTrigger id="roofType">
                          <SelectValue placeholder="Select roof type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asbestos">Asbestos</SelectItem>
                          <SelectItem value="concrete">Concrete</SelectItem>
                          <SelectItem value="corrugated iron">Corrugated iron</SelectItem>
                          <SelectItem value="fibre cement">Fibre cement</SelectItem>
                          <SelectItem value="wood">Wood</SelectItem>
                          <SelectItem value="wooden shingles">Wooden shingles</SelectItem>
                          <SelectItem value="slate">Slate</SelectItem>
                          <SelectItem value="thatch">Thatch</SelectItem>
                          <SelectItem value="tile">Tile</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Non-standard Structure */}
                    <div className="text-center">
                      <Label htmlFor="nonStandardStructure" className="mb-1 block">
                        Is there any non-standard structure on your property or a structure with a thatched roof, with a roofed area greater than 15% of the roofed area of the main building?
                      </Label>
                      <Select
                        value={formData.nonStandardStructure}
                        onValueChange={(value) => handleInputChange("nonStandardStructure", value)}
                      >
                        <SelectTrigger id="nonStandardStructure">
                          <SelectValue placeholder="Select yes or no" />
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
                        onValueChange={(value) => handleInputChange("wallMaterial", value)}
                      >
                        <SelectTrigger id="wallMaterial">
                          <SelectValue placeholder="Select wall material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asbestos">Asbestos</SelectItem>
                          <SelectItem value="brick">Brick</SelectItem>
                          <SelectItem value="concrete">Concrete</SelectItem>
                          <SelectItem value="corrugated iron">Corrugated iron</SelectItem>
                          <SelectItem value="fibre cement">Fibre cement</SelectItem>
                          <SelectItem value="precast concrete">Precast concrete</SelectItem>
                          <SelectItem value="prefabricated">Prefabricated</SelectItem>
                          <SelectItem value="shingle">Shingle</SelectItem>
                          <SelectItem value="stone">Stone</SelectItem>
                          <SelectItem value="timber-framed">Timber-framed with Gypsum cladding</SelectItem>
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
                        <p className="text-sm text-center font-medium mb-2">Additional questions for thatch/wooden buildings:</p>
                        
                        {/* Fire Retardant */}
                        <div className="text-center">
                          <Label htmlFor="fireRetardant" className="mb-1 block text-sm">
                            Has the thatch/wooden shingles been treated with SABS-approved fire retardant?
                          </Label>
                          <Select
                            value={formData.fireRetardant}
                            onValueChange={(value) => handleInputChange("fireRetardant", value)}
                          >
                            <SelectTrigger id="fireRetardant">
                              <SelectValue placeholder="Select yes or no" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Lightning Conductor */}
                        <div className="text-center">
                          <Label htmlFor="lightningConductor" className="mb-1 block text-sm">
                            Is there a lightning conductor installed at the building?
                          </Label>
                          <Select
                            value={formData.lightningConductor}
                            onValueChange={(value) => handleInputChange("lightningConductor", value)}
                          >
                            <SelectTrigger id="lightningConductor">
                              <SelectValue placeholder="Select yes or no" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Residence Type */}
                    <div className="text-center">
                      <Label htmlFor="residenceType" className="mb-1 block">
                        What type of residence is this?
                      </Label>
                      <Select
                        value={formData.residenceType}
                        onValueChange={(value) => handleInputChange("residenceType", value)}
                      >
                        <SelectTrigger id="residenceType">
                          <SelectValue placeholder="Select residence type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">Main residence</SelectItem>
                          <SelectItem value="secondary">Secondary residence/Holiday home</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Is Commune */}
                    <div className="text-center">
                      <Label htmlFor="isCommune" className="mb-1 block">
                        Is the building used as a commune?
                      </Label>
                      <Select
                        value={formData.isCommune}
                        onValueChange={(value) => handleInputChange("isCommune", value)}
                      >
                        <SelectTrigger id="isCommune">
                          <SelectValue placeholder="Select yes or no" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
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
                        onValueChange={(value) => handleInputChange("isPlotOrFarm", value)}
                      >
                        <SelectTrigger id="isPlotOrFarm">
                          <SelectValue placeholder="Select yes or no" />
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="electricGeysers" className="text-sm mb-1 block">
                            Electric
                          </Label>
                          <Input
                            id="electricGeysers"
                            placeholder="0"
                            value={formData.geysers.electric}
                            onChange={(e) => setFormData({
                              ...formData,
                              geysers: {
                                ...formData.geysers,
                                electric: e.target.value,
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="gasGeysers" className="text-sm mb-1 block">
                            Gas
                          </Label>
                          <Input
                            id="gasGeysers"
                            placeholder="0"
                            value={formData.geysers.gas}
                            onChange={(e) => setFormData({
                              ...formData,
                              geysers: {
                                ...formData.geysers,
                                gas: e.target.value,
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="heatPumpGeysers" className="text-sm mb-1 block">
                            Heat Pump
                          </Label>
                          <Input
                            id="heatPumpGeysers"
                            placeholder="0"
                            value={formData.geysers.heatPump}
                            onChange={(e) => setFormData({
                              ...formData,
                              geysers: {
                                ...formData.geysers,
                                heatPump: e.target.value,
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="solarWaterGeysers" className="text-sm mb-1 block">
                            Solar Water
                          </Label>
                          <Input
                            id="solarWaterGeysers"
                            placeholder="0"
                            value={formData.geysers.solarWater}
                            onChange={(e) => setFormData({
                              ...formData,
                              geysers: {
                                ...formData.geysers,
                                solarWater: e.target.value,
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nearby Water Bodies */}
                    <div className="text-center">
                      <Label htmlFor="nearbyWaterBodies" className="mb-1 block">
                        Are there water bodies (streams, lakes, rivers) within 500m of the property?
                      </Label>
                      <Select
                        value={formData.nearbyWaterBodies}
                        onValueChange={(value) => handleInputChange("nearbyWaterBodies", value)}
                      >
                        <SelectTrigger id="nearbyWaterBodies">
                          <SelectValue placeholder="Select yes or no" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Surge Arrester */}
                    <div className="text-center">
                      <Label htmlFor="surgeArresterInstalled" className="mb-1 block">
                        Does the building have a surge arrester installed?
                      </Label>
                      <Select
                        value={formData.surgeArresterInstalled}
                        onValueChange={(value) => handleInputChange("surgeArresterInstalled", value)}
                      >
                        <SelectTrigger id="surgeArresterInstalled">
                          <SelectValue placeholder="Select yes or no" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Security Details */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-center">Security Details</h3>
                    
                    {/* Perimeter Wall */}
                    <div className="text-center">
                      <Label htmlFor="perimeterWallType" className="mb-1 block">
                        What type of wall surrounds the property?
                      </Label>
                      <Select
                        value={formData.perimeterWallType}
                        onValueChange={(value) => handleInputChange("perimeterWallType", value)}
                      >
                        <SelectTrigger id="perimeterWallType">
                          <SelectValue placeholder="Select wall type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no wall">No wall</SelectItem>
                          <SelectItem value="wooden fence">Wooden fence</SelectItem>
                          <SelectItem value="palisade fence">Palisade fence</SelectItem>
                          <SelectItem value="brick wall lower than 1.8m">Brick wall lower than 1.8m</SelectItem>
                          <SelectItem value="brick wall higher than 1.8m">Brick wall higher than 1.8m</SelectItem>
                          <SelectItem value="electric fence only">Electric fence only</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Radio-linked Alarm */}
                    <div className="text-center">
                      <Label htmlFor="radioLinkedAlarm" className="mb-1 block">
                        Is there a radio-linked alarm system connected to an armed response company?
                      </Label>
                      <Select
                        value={formData.radioLinkedAlarm}
                        onValueChange={(value) => handleInputChange("radioLinkedAlarm", value)}
                      >
                        <SelectTrigger id="radioLinkedAlarm">
                          <SelectValue placeholder="Select yes or no" />
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
                        Are there security gates on all exterior doors?
                      </Label>
                      <Select
                        value={formData.securityGates}
                        onValueChange={(value) => handleInputChange("securityGates", value)}
                      >
                        <SelectTrigger id="securityGates">
                          <SelectValue placeholder="Select yes or no" />
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
                        Are there burglar bars on all accessible windows?
                      </Label>
                      <Select
                        value={formData.burglarBars}
                        onValueChange={(value) => handleInputChange("burglarBars", value)}
                      >
                        <SelectTrigger id="burglarBars">
                          <SelectValue placeholder="Select yes or no" />
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
                        Is there controlled access to the property? (e.g., intercom, access cards, biometrics)
                      </Label>
                      <Select
                        value={formData.controlledAccess}
                        onValueChange={(value) => handleInputChange("controlledAccess", value)}
                      >
                        <SelectTrigger id="controlledAccess">
                          <SelectValue placeholder="Select yes or no" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Security Guard */}
                    <div className="text-center">
                      <Label htmlFor="securityGuard" className="mb-1 block">
                        Is there a security guard/concierge on the premises?
                      </Label>
                      <Select
                        value={formData.securityGuard}
                        onValueChange={(value) => handleInputChange("securityGuard", value)}
                      >
                        <SelectTrigger id="securityGuard">
                          <SelectValue placeholder="Select yes or no" />
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
                        Is there an electric fence on the perimeter wall?
                      </Label>
                      <Select
                        value={formData.electricFence}
                        onValueChange={(value) => handleInputChange("electricFence", value)}
                      >
                        <SelectTrigger id="electricFence">
                          <SelectValue placeholder="Select yes or no" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="flex justify-between mt-6 p-6 pt-0">
                {currentStep > 1 && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>
                )}
                
                <div className="flex-1"></div>
                
                {currentStep < 3 ? (
                  <Button 
                    type="button"
                    onClick={goToNextStep}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
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
                )}
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