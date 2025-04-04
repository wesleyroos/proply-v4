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
    standNumber?: string;
    erfNumber?: string;
    registeredOwner?: string;
    zoning?: string;
  };
  demographicData?: {
    ageDistribution: {
      under18Percent: number;
      adults18to35Percent: number;
      adults36to65Percent: number;
      over65Percent: number;
    };
    incomeLevel: {
      medianIncome: string;
      incomeBracket: "Low" | "Lower-Middle" | "Middle" | "Upper-Middle" | "High";
      unemploymentRate: number;
    };
    populationDensity: number; // people per square km
    populationGrowthRate: number; // annual percentage
  };
  propertyValueMetrics?: {
    estimatedBuildingValue: string;
    landValue: string;
    areaAverageValue: string;
    valueTrend: {
      fiveYearGrowth: number; // percentage
      oneYearGrowth: number; // percentage
      forecastNextYear: number; // percentage
    };
    comparableProperties: {
      recentSales: {
        avgPricePerSquareMeter: string;
        numberOfSales: number;
        timeFrame: string; // e.g., "Last 12 months"
      }
    }
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
      floodZoneType?: string; // e.g., "100-year flood plain"
      historicalFloodEvents?: {
        numberOfEvents: number;
        lastOccurrence: string; // year
        severityOfLastEvent: string;
      };
      drainageInfrastructure?: {
        quality: "Poor" | "Adequate" | "Good";
        maintenanceStatus: string;
      };
      waterTableDepth?: number; // in meters
      surfaceWaterAccumulation?: "Low" | "Medium" | "High";
      floodMitigationMeasures?: string[];
    };
    climateRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
      temperatureVolatility?: {
        historical: {
          averageAnnualTemperature: number; // in celsius
          temperatureRange: [number, number]; // [min, max] in celsius
          extremeHeatDays: number; // days per year above threshold
          extremeColdDays: number; // days per year below threshold
        };
        future: {
          projectedTemperatureIncrease: number; // in celsius by 2050
          projectedExtremeDaysIncrease: number; // additional extreme days by 2050
          riskLevel: "Low" | "Medium" | "High";
        };
        anomalyData: {
          yearsAboveAverage: number; // out of last 10 years
          temperatureTrend: number; // celsius per decade
        }
      };
      precipitationPatterns?: {
        historical: {
          annualAverage: number; // in mm
          seasonalDistribution: {
            summer: number; // percentage of annual
            autumn: number;
            winter: number;
            spring: number;
          };
          highestRecordedDaily: number; // in mm
        };
        future: {
          projectedChange: number; // percentage by 2050
          droughtRisk: "Low" | "Medium" | "High";
          floodRisk: "Low" | "Medium" | "High";
        };
        anomalyData: {
          dryYears: number; // out of last 10 years
          wetYears: number; // out of last 10 years
          precipitationTrend: number; // mm per decade
        }
      };
      windExposure?: {
        averageWindSpeed: number; // in km/h
        prevailingDirection: string;
        gustRisk: "Low" | "Medium" | "High";
        hurricaneOrCycloneRisk: "Low" | "Medium" | "High";
      };
      subsidence?: {
        riskLevel: "Low" | "Medium" | "High";
        soilShrinkageRisk: "Low" | "Medium" | "High";
        miningActivities: boolean;
        geologicalFaults: boolean;
      };
      wildfireRisk?: {
        riskLevel: "Low" | "Medium" | "High";
        proximityToVegetation: number; // in meters
        vegetationType: string;
        historicalIncidents: number;
        droughtCorrelation: "Low" | "Medium" | "High";
      };
      redFlagRisks?: string[]; // Critical climate risks that need immediate attention
    };
    hailRisk: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
      hailCharacteristics?: {
        estimatedAnnualOccurrence: number; // events per year
        severeHailProbability: number; // percentage chance of severe hail annually
        historicalHailsizes: {
          average: number; // in mm
          largest: number; // in mm
          damageThreshold: number; // size in mm that causes damage
        };
        seasonality: {
          peakMonths: string[];
          offSeasonRisk: "Low" | "Medium" | "High";
        };
      };
      impactAssessment?: {
        roofVulnerability: {
          roofType: string;
          roofAge: number; // in years
          materialResistance: "Low" | "Medium" | "High";
          estimatedReplacementCost: string;
        };
        potentialDamageAreas: string[]; // e.g., ["Roof", "Solar Panels", "Windows", "Vehicles"]
        previousHailDamageClaims: number;
        typicalClaimAmount: string; // e.g., "R15,000 - R45,000"
      };
      mitigationMeasures?: {
        installed: string[]; // e.g., ["Impact-resistant Roof", "Covered Parking"]
        recommended: string[];
        estimatedCostToImplement: string;
        potentialPremiumSavings: string;
      };
    };
    lightningRisk?: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
      lightningCharacteristics?: {
        strikeFrequency: number; // strikes per km² per year
        regionRanking: string; // e.g., "High concentration area"
        historicalTrends: string;
      };
      vulnerabilityFactors?: {
        buildingHeight: string;
        surroundingTerrain: string;
        proximityToTallStructures: string;
        proximityToLargeWaterBodies: string;
      };
      impactAssessment?: {
        electricalSystemVulnerability: "Low" | "Medium" | "High";
        fireRiskFromLightning: "Low" | "Medium" | "High";
        potentialDamageToElectronics: "Low" | "Medium" | "High";
        typicalClaimAmount: string; // e.g., "R20,000 - R75,000"
      };
      protectionSystems?: {
        lightningRods: boolean;
        surgeProtection: boolean;
        groundingSystem: boolean;
        additionalMeasures: string[];
      };
      mitigationRecommendations?: {
        critical: string[];
        recommended: string[];
        estimatedCostToImplement: string;
        potentialPremiumSavings: string;
      };
    };
    fireRisk?: {
      score: number;
      maxScore: number;
      percentageScore: number;
      rating: "Low" | "Medium" | "High";
      factors: string[];
      buildingConstructionType: string;
      distanceToFireStation: number; // in km
      fireSuppressionSystems: string[];
      solarInstallation?: {
        hasSolarPanels: boolean;
        installationAge: number; // in years
        solarFireRisk: "Low" | "Medium" | "High";
        safetyFeatures: string[];
      };
    };
    marketVolatility: number;
    locationRisk: number;
    propertyConditionRisk: number;
    financialRisk: number;
    demographicTrends: number;
    regulatoryRisk: number;
  };
  proximityRisks?: {
    openAreas?: {
      distanceToNearestOpenArea: number; // in meters
      typeOfOpenArea: string; // e.g., "Park", "Undeveloped Land"
      riskLevel: "Low" | "Medium" | "High";
      impactDescription: string;
    };
    informalSettlements?: {
      distanceToNearestSettlement: number; // in meters
      populationEstimate: number;
      riskLevel: "Low" | "Medium" | "High";
      impactDescription: string;
    };
    industrialZones?: {
      distanceToNearestZone: number; // in meters
      typeOfIndustry: string;
      pollutionRisk: "Low" | "Medium" | "High";
      impactDescription: string;
    };
    securedArea?: {
      isInSecuredComplex: boolean;
      securityFeatures: string[]; // e.g., ["Electric Fence", "24hr Security", "Access Control"]
      crimeRate: {
        propertyRateVsCity: number; // percentage relative to city average
        violentRateVsCity: number; // percentage relative to city average
      }
    }
  };
  topography?: {
    elevation: number; // in meters
    slope: {
      degreeOfSlope: number; // in degrees
      stabilityRisk: "Low" | "Medium" | "High";
      erosionPotential: "Low" | "Medium" | "High";
    };
    proximityToWater: {
      distanceToNearestWaterBody: number; // in meters
      typeOfWaterBody: string; // e.g., "River", "Dam", "Ocean"
      historicalWaterLevelChanges: string;
    };
    soilType: string;
    soilStability: "Low" | "Medium" | "High";
  };
  aggregateRiskMetrics?: {
    totalRiskScore: number; // absolute score
    maxPossibleScore: number;
    percentageScore: number;
    weightedBreakdown: {
      securityRisk: number; // percentage contribution
      environmentalRisk: number;
      floodRisk: number;
      climateRisk: number;
      hailRisk: number;
      lightningRisk: number;
      fireRisk: number;
      otherRisks: number;
    };
    insuranceImplications: {
      recommendedCoverageLevel: string;
      estimatedPremiumImpact: string;
      specialCoverageNeeds: string[];
      exclusionConsiderations: string[];
    };
  };
  visualRiskBreakdown?: {
    riskRadarData: {
      categories: string[];
      values: number[];
      benchmarkValues: number[];
    };
    historicalTrendData: {
      years: string[];
      riskValues: number[];
    };
    riskHeatmap: {
      categories: string[];
      severity: number[];
    };
  };
  projections: {
    shortTerm: string;
    mediumTerm: string;
    longTerm: string;
    trendDirection: "up" | "stable" | "down";
    riskTrendProjection?: {
      shortTerm: string; // 1-2 years
      mediumTerm: string; // 3-5 years
      longTerm: string; // 10+ years
      confidenceLevel: "Low" | "Medium" | "High";
    };
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
      case "lightning":
        return <AlertTriangle className="h-5 w-5" />;
      case "fire":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
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

    // Generate property stand/erf number
    const standNumber = `ST-${Math.floor(Math.random() * 100000)}`;
    const erfNumber = `ERF-${Math.floor(Math.random() * 10000)}`;
    
    // SECURITY RISK CALCULATION
    const securityRiskMaxScore = 50;
    let securityRiskScore = 0;
    const securityRiskFactors: string[] = [];

    // Property type affects security risk
    if (formData.propertyType === "apartment") {
      securityRiskScore += 15; // Medium risk (building security but potential shared access)
      securityRiskFactors.push(
        "Property is located in an apartment building with shared access",
      );
    } else if (formData.propertyType === "house") {
      securityRiskScore += 25; // Higher risk (standalone structure)
      securityRiskFactors.push(
        "Standalone structure with multiple entry points",
      );
    } else if (formData.propertyType === "townhouse") {
      securityRiskScore += 20; // Medium-high risk
      securityRiskFactors.push(
        "Townhouse with multiple levels and entry points",
      );
    }

    // Location-based risk (mock data - would be based on real crime statistics)
    if (formData.address.toLowerCase().includes("cape town city centre")) {
      securityRiskScore += 10; // Urban center risks
      securityRiskFactors.push(
        "Property is located in an area with moderate crime rates",
      );
    }

    // Add generic factors for demo
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

    // Property location affects environmental risk
    if (formData.address.toLowerCase().includes("cape town city centre")) {
      environmentalRiskScore += 21; // Urban pollution factors
      environmentalRiskFactors.push(
        "Moderate air pollution from nearby traffic",
      );
      environmentalRiskFactors.push("Some noise pollution during peak hours");
      environmentalRiskFactors.push(
        "Limited exposure to industrial contaminants",
      );
    }

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

    // Property location affects flood risk
    if (formData.address.toLowerCase().includes("cape town city centre")) {
      floodRiskScore += 10; // Flood zone risks
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
    }

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

    // Property location and construction affect climate risk
    if (
      formData.propertyCondition === "excellent" ||
      formData.propertyCondition === "good"
    ) {
      climateRiskScore += 61; // Better buildings withstand climate risks better
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
      climateRiskScore += 120; // Poorer condition buildings have higher climate risk
      climateRiskFactors.push(
        "Property may experience increased maintenance due to weather extremes",
      );
      climateRiskFactors.push(
        "Building materials may not be optimal for temperature regulation",
      );
    }

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

    // Roof condition affects hail risk
    if (formData.propertyCondition === "excellent") {
      hailRiskScore += 10; // Lower risk with excellent roofing
      hailRiskFactors.push(
        "Roof is in excellent condition and likely to withstand hail impact",
      );
      hailRiskFactors.push("Covered parking provides vehicle protection");
    } else if (formData.propertyCondition === "poor") {
      hailRiskScore += 20; // Higher risk with poor roofing
      hailRiskFactors.push("Roof condition may be vulnerable to hail damage");
      hailRiskFactors.push("Inadequate vehicle protection during hail storms");
    } else {
      hailRiskScore += 15; // Medium risk
      hailRiskFactors.push(
        "Roof may require inspection to assess hail resistance",
      );
      hailRiskFactors.push("Partial covered parking for vehicles");
    }

    // Enhanced hail risk data for insurance purposes
    const hailCharacteristics = {
      estimatedAnnualOccurrence: 3.2, // events per year
      severeHailProbability: 12.5, // percentage chance of severe hail annually
      historicalHailsizes: {
        average: 15, // in mm
        largest: 32, // in mm
        damageThreshold: 19, // size in mm that causes damage
      },
      seasonality: {
        peakMonths: ["October", "November", "December"],
        offSeasonRisk: "Low" as "Low" | "Medium" | "High",
      },
    };
    
    const hailImpactAssessment = {
      roofVulnerability: {
        roofType: formData.propertyType === "apartment" ? "Flat concrete" : "Tiled sloped",
        roofAge: 6, // in years
        materialResistance: "Medium" as "Low" | "Medium" | "High",
        estimatedReplacementCost: "R75,000 - R120,000",
      },
      potentialDamageAreas: [
        "Roof", 
        "Windows", 
        "Outdoor equipment", 
        "Vehicles"
      ],
      previousHailDamageClaims: 1,
      typicalClaimAmount: "R18,000 - R42,000",
    };
    
    const hailMitigationMeasures = {
      installed: ["Weather-resistant roof materials"],
      recommended: [
        "Covered parking structures",
        "Impact-resistant window film",
        "Regular roof inspection and maintenance"
      ],
      estimatedCostToImplement: "R22,000 - R35,000",
      potentialPremiumSavings: "8-12% on comprehensive coverage",
    };

    // Hail risk rating
    const hailRiskPercentage = (hailRiskScore / hailRiskMaxScore) * 100;
    let hailRiskRating: "Low" | "Medium" | "High" =
      hailRiskPercentage < 33
        ? "Low"
        : hailRiskPercentage < 66
          ? "Medium"
          : "High";
          
    // LIGHTNING RISK CALCULATION
    const lightningRiskMaxScore = 40;
    let lightningRiskScore = 0;
    const lightningRiskFactors: string[] = [];
    
    // Calculate lightning risk based on location and building features
    if (formData.address.toLowerCase().includes("cape town")) {
      lightningRiskScore += 15; // Moderate lightning risk in Cape Town area
      lightningRiskFactors.push("Property located in area with moderate thunderstorm activity");
    }
    
    if (formData.propertyType === "house") {
      lightningRiskScore += 12; // Higher risk for standalone structures
      lightningRiskFactors.push("Standalone structure with higher lightning strike exposure");
    } else if (formData.propertyType === "apartment") {
      lightningRiskScore += 5; // Lower risk for apartments in larger buildings
      lightningRiskFactors.push("Multi-unit building with shared lightning protection systems");
    }
    
    // Add typical lightning risk factors
    lightningRiskFactors.push("Limited surge protection for sensitive electronics");
    lightningRiskFactors.push("Aging electrical wiring may increase vulnerability to surges");
    
    // Lightning risk characteristics
    const lightningCharacteristics = {
      strikeFrequency: 3.8, // strikes per km² per year
      regionRanking: "Moderate lightning density area",
      historicalTrends: "Increasing strike frequency over past decade",
    };
    
    const lightningVulnerabilityFactors = {
      buildingHeight: formData.propertyType === "apartment" ? "Medium-rise building" : "Low-rise structure",
      surroundingTerrain: "Urban environment with varied building heights",
      proximityToTallStructures: "Several taller buildings within 500m radius",
      proximityToLargeWaterBodies: "2.3km from coastline",
    };
    
    const lightningImpactAssessment = {
      electricalSystemVulnerability: "Medium" as "Low" | "Medium" | "High",
      fireRiskFromLightning: "Low" as "Low" | "Medium" | "High",
      potentialDamageToElectronics: "High" as "Low" | "Medium" | "High",
      typicalClaimAmount: "R12,000 - R35,000",
    };
    
    const lightningProtectionSystems = {
      lightningRods: false,
      surgeProtection: true,
      groundingSystem: true,
      additionalMeasures: ["Basic circuit breakers"],
    };
    
    const lightningMitigationRecommendations = {
      critical: ["Install whole-house surge protection system"],
      recommended: [
        "Upgrade electrical panel",
        "Add dedicated circuits for sensitive electronics",
        "Install lightning protection system on roof"
      ],
      estimatedCostToImplement: "R15,000 - R28,000",
      potentialPremiumSavings: "5-8% on electronics coverage",
    };
    
    // Lightning risk rating
    const lightningRiskPercentage = (lightningRiskScore / lightningRiskMaxScore) * 100;
    let lightningRiskRating: "Low" | "Medium" | "High" =
      lightningRiskPercentage < 33
        ? "Low"
        : lightningRiskPercentage < 66
          ? "Medium"
          : "High";
    
    // FIRE RISK CALCULATION
    const fireRiskMaxScore = 45;
    let fireRiskScore = 0;
    const fireRiskFactors: string[] = [];
    
    // Calculate fire risk based on property type and condition
    if (formData.propertyType === "apartment") {
      fireRiskScore += 15; // Apartments have shared risk factors
      fireRiskFactors.push("Multi-unit building with shared fire risk");
      fireRiskFactors.push("Fire could spread from neighboring units");
    } else if (formData.propertyType === "house") {
      fireRiskScore += 10; // Houses have more isolated risk
      fireRiskFactors.push("Standalone structure with lower risk of fire spread from neighbors");
    }
    
    if (formData.propertyCondition === "excellent") {
      fireRiskScore += 5; // Better condition means less fire risk
      fireRiskFactors.push("Modern wiring and electrical systems reduce fire risk");
    } else if (formData.propertyCondition === "poor") {
      fireRiskScore += 20; // Poor condition means higher fire risk
      fireRiskFactors.push("Aging electrical systems may present fire hazards");
      fireRiskFactors.push("Building materials may not meet current fire safety standards");
    }
    
    // Add rooftop solar fire risk if applicable
    const hasSolarPanels = Math.random() > 0.7; // 30% chance of having solar panels for demo
    if (hasSolarPanels) {
      fireRiskScore += 8;
      fireRiskFactors.push("Rooftop solar installation creates additional fire risk points");
      fireRiskFactors.push("DC electrical components from solar system require specialized firefighting approach");
    }
    
    // Fire risk rating
    const fireRiskPercentage = (fireRiskScore / fireRiskMaxScore) * 100;
    let fireRiskRating: "Low" | "Medium" | "High" =
      fireRiskPercentage < 33
        ? "Low"
        : fireRiskPercentage < 66
          ? "Medium"
          : "High";

    // OVERALL RISK CALCULATION
    const totalRiskPoints =
      securityRiskScore +
      environmentalRiskScore +
      floodRiskScore +
      climateRiskScore +
      hailRiskScore +
      lightningRiskScore +
      fireRiskScore;
    const maxRiskPoints =
      securityRiskMaxScore +
      environmentalRiskMaxScore +
      floodRiskMaxScore +
      climateRiskMaxScore +
      hailRiskMaxScore +
      lightningRiskMaxScore +
      fireRiskMaxScore;
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
        "Consider upgrading security systems and access control.",
      );
      recommendations.push(
        "Install additional exterior lighting around the property.",
      );
    }

    // Add flood recommendations
    if (floodRiskRating === "High") {
      recommendations.push("Obtain comprehensive flood insurance coverage.");
      recommendations.push(
        "Install flood barriers and improved drainage systems.",
      );
    }

    // Add climate recommendations
    if (climateRiskRating === "Medium" || climateRiskRating === "High") {
      recommendations.push(
        "Improve building insulation to manage temperature extremes.",
      );
      recommendations.push(
        "Consider energy-efficient upgrades to reduce climate vulnerability.",
      );
    }

    // Add generic recommendations
    recommendations.push(
      "Conduct a professional property inspection before finalizing insurance coverage.",
    );
    recommendations.push(
      "Consider bundling multiple insurance policies for better protection and rates.",
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

    // Define insurance implications first for use in the risk summary
    const insuranceImplications = {
      recommendedCoverageLevel: "Comprehensive Plus",
      estimatedPremiumImpact: "R850 - R1,200 monthly",
      specialCoverageNeeds: [
        "Enhanced flood protection",
        "Electronics coverage for lightning damage",
        "Hail damage rider for vehicles"
      ],
      exclusionConsiderations: [
        "Subsidence may be excluded in standard policy",
        "Solar panel coverage may require specialized endorsement"
      ],
    };

    // Risk summary using the defined insurance implications
    const riskSummary = `This property presents an overall ${riskRating.toLowerCase()} risk profile (${Math.round(overallRiskPercentage)}%), with most risk factors being well-managed or naturally low. However, there are specific areas of concern:
    
${floodRiskRating === "High" ? "High Flood Risk: The property's location in a flood-prone area represents a significant risk factor and should be carefully considered.\n" : ""}
${securityRiskRating === "Medium" || securityRiskRating === "High" ? `${securityRiskRating} Security Risk: ${securityRiskRating === "High" ? "This is a critical concern and" : "While not critical,"} security measures could be improved to enhance property protection.\n` : ""}
${environmentalRiskRating === "Medium" || environmentalRiskRating === "High" ? `${environmentalRiskRating} Environmental Risk: This moderate risk factor should be monitored, particularly regarding air quality and noise pollution.\n` : ""}
${hailRiskRating === "Medium" || hailRiskRating === "High" ? `${hailRiskRating} Hail Risk: The property may require additional protection measures against potential hail damage. Historical data shows hail sizes of up to ${hailCharacteristics.historicalHailsizes.largest}mm in this area.\n` : ""}
${lightningRiskRating === "Medium" || lightningRiskRating === "High" ? `${lightningRiskRating} Lightning Risk: With a strike frequency of ${lightningCharacteristics.strikeFrequency} strikes per km² annually, additional surge protection is recommended for electronics and systems.\n` : ""}
${fireRiskRating === "Medium" || fireRiskRating === "High" ? `${fireRiskRating} Fire Risk: The building's construction type and maintenance status contribute to elevated fire risk levels. Regular inspections and updated suppression systems are advised.\n` : ""}
${hasSolarPanels ? "Solar Installation Fire Risk: The property's solar installation represents an additional fire risk factor that requires specialized coverage and safety measures.\n" : ""}

Based on the overall risk assessment, we recommend a comprehensive insurance policy that specifically addresses the identified risk factors. Insurance implications include estimated premiums of ${insuranceImplications.estimatedPremiumImpact} with special consideration for ${insuranceImplications.specialCoverageNeeds.join(", ")}.`;

    // Create demographic and property value data
    const demographicData = {
      ageDistribution: {
        under18Percent: 18.7,
        adults18to35Percent: 34.2,
        adults36to65Percent: 37.5,
        over65Percent: 9.6,
      },
      incomeLevel: {
        medianIncome: "R384,200",
        incomeBracket: "Middle" as "Low" | "Lower-Middle" | "Middle" | "Upper-Middle" | "High",
        unemploymentRate: 9.8,
      },
      populationDensity: 4800, // people per square km
      populationGrowthRate: 1.7, // annual percentage
    };
    
    const propertyValueMetrics = {
      estimatedBuildingValue: formatWithThousandSeparators(
        String(Math.round(price * 0.75))
      ),
      landValue: formatWithThousandSeparators(
        String(Math.round(price * 0.25))
      ),
      areaAverageValue: formatWithThousandSeparators(
        String(Math.round(price * 1.12))
      ),
      valueTrend: {
        fiveYearGrowth: 18.4, // percentage
        oneYearGrowth: 3.2, // percentage
        forecastNextYear: 4.5, // percentage
      },
      comparableProperties: {
        recentSales: {
          avgPricePerSquareMeter: formatWithThousandSeparators(
            String(Math.round((price / propertySize) * 1.05))
          ),
          numberOfSales: 14,
          timeFrame: "Last 12 months",
        }
      }
    };
    
    // Create proximity risk data
    const proximityRisks = {
      openAreas: {
        distanceToNearestOpenArea: 350, // in meters
        typeOfOpenArea: "Public park", 
        riskLevel: "Low" as "Low" | "Medium" | "High",
        impactDescription: "Nearby Company's Garden provides natural buffer zone",
      },
      informalSettlements: {
        distanceToNearestSettlement: 6500, // in meters
        populationEstimate: 12000,
        riskLevel: "Low" as "Low" | "Medium" | "High",
        impactDescription: "Significant distance from property reduces associated risks",
      },
      industrialZones: {
        distanceToNearestZone: 4200, // in meters
        typeOfIndustry: "Light manufacturing",
        pollutionRisk: "Low" as "Low" | "Medium" | "High",
        impactDescription: "Industrial zone is downwind and has minimal impact on air quality",
      },
      securedArea: {
        isInSecuredComplex: formData.propertyType === "apartment",
        securityFeatures: ["Access control", "CCTV", "Security personnel"],
        crimeRate: {
          propertyRateVsCity: 85, // percentage relative to city average
          violentRateVsCity: 72, // percentage relative to city average
        }
      }
    };
    
    // Create topography data
    const topography = {
      elevation: 28, // in meters
      slope: {
        degreeOfSlope: 2.3, // in degrees
        stabilityRisk: "Low" as "Low" | "Medium" | "High",
        erosionPotential: "Low" as "Low" | "Medium" | "High",
      },
      proximityToWater: {
        distanceToNearestWaterBody: 970, // in meters
        typeOfWaterBody: "Harbor", 
        historicalWaterLevelChanges: "Stable with minor seasonal fluctuations",
      },
      soilType: "Urban fill over sandy loam",
      soilStability: "Medium" as "Low" | "Medium" | "High",
    };
    
    // Create aggregate risk metrics
    const totalRiskWithNewFactors = totalRiskPoints + fireRiskScore + lightningRiskScore;
    const maxRiskWithNewFactors = maxRiskPoints + fireRiskMaxScore + lightningRiskMaxScore;
    const percentageWithNewFactors = (totalRiskWithNewFactors / maxRiskWithNewFactors) * 100;
    
    // Create the aggregateRiskMetrics object using the insurance implications we defined earlier
    const aggregateRiskMetrics = {
      totalRiskScore: totalRiskWithNewFactors,
      maxPossibleScore: maxRiskWithNewFactors,
      percentageScore: percentageWithNewFactors,
      weightedBreakdown: {
        securityRisk: Math.round((securityRiskScore / totalRiskWithNewFactors) * 100),
        environmentalRisk: Math.round((environmentalRiskScore / totalRiskWithNewFactors) * 100),
        floodRisk: Math.round((floodRiskScore / totalRiskWithNewFactors) * 100),
        climateRisk: Math.round((climateRiskScore / totalRiskWithNewFactors) * 100),
        hailRisk: Math.round((hailRiskScore / totalRiskWithNewFactors) * 100),
        lightningRisk: Math.round((lightningRiskScore / totalRiskWithNewFactors) * 100),
        fireRisk: Math.round((fireRiskScore / totalRiskWithNewFactors) * 100),
        otherRisks: 5,
      },
      insuranceImplications: insuranceImplications,
    };
    
    // Create visualization data
    const visualRiskBreakdown = {
      riskRadarData: {
        categories: ["Security", "Environmental", "Flood", "Climate", "Hail", "Lightning", "Fire"],
        values: [
          securityRiskPercentage, 
          environmentalRiskPercentage, 
          floodRiskPercentage, 
          climateRiskPercentage, 
          hailRiskPercentage,
          lightningRiskPercentage,
          fireRiskPercentage
        ],
        benchmarkValues: [45, 38, 32, 59, 38, 29, 34],
      },
      historicalTrendData: {
        years: ["2018", "2019", "2020", "2021", "2022", "2023", "2024"],
        riskValues: [35, 38, 41, 43, 45, 48, Math.round(overallRiskPercentage)],
      },
      riskHeatmap: {
        categories: ["Short-term", "Medium-term", "Long-term"],
        severity: [Math.round(overallRiskPercentage * 0.9), Math.round(overallRiskPercentage * 1.1), Math.round(overallRiskPercentage * 1.2)],
      },
    };
    
    // Create enhanced projections
    const riskTrendProjection = {
      shortTerm: "Insurance costs likely to increase 8-12% annually",
      mediumTerm: "Regulatory changes may require additional mitigation measures",
      longTerm: "Climate impacts expected to significantly affect risk profile", 
      confidenceLevel: "Medium" as "Low" | "Medium" | "High",
    };

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
        suburb: "Cape Town City Centre",
        city: "Cape Town",
        postalCode: "8001",
        standNumber: standNumber,
        erfNumber: erfNumber,
        registeredOwner: "Current Owner",
        zoning: "Residential 1",
      },
      demographicData,
      propertyValueMetrics,
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
          floodZoneType: "100-year flood zone",
          historicalFloodEvents: {
            numberOfEvents: 2,
            lastOccurrence: "2019",
            severityOfLastEvent: "Moderate",
          },
          drainageInfrastructure: {
            quality: "Adequate" as "Poor" | "Adequate" | "Good",
            maintenanceStatus: "Regularly maintained but undersized for severe events",
          },
          waterTableDepth: 3.2, // in meters
          surfaceWaterAccumulation: "Medium" as "Low" | "Medium" | "High",
          floodMitigationMeasures: ["Improved building drainage", "Waterproofing of basement level"],
        },
        climateRisk: {
          score: climateRiskScore,
          maxScore: climateRiskMaxScore,
          percentageScore: climateRiskPercentage,
          rating: climateRiskRating,
          factors: climateRiskFactors,
          temperatureVolatility: {
            historical: {
              averageAnnualTemperature: 18.2, // in celsius
              temperatureRange: [7.4, 33.8], // [min, max] in celsius
              extremeHeatDays: 12, // days per year above threshold
              extremeColdDays: 2, // days per year below threshold
            },
            future: {
              projectedTemperatureIncrease: 1.8, // in celsius by 2050
              projectedExtremeDaysIncrease: 6, // additional extreme days by 2050
              riskLevel: "Medium" as "Low" | "Medium" | "High",
            },
            anomalyData: {
              yearsAboveAverage: 7, // out of last 10 years
              temperatureTrend: 0.21, // celsius per decade
            }
          },
          precipitationPatterns: {
            historical: {
              annualAverage: 580, // in mm
              seasonalDistribution: {
                summer: 12, // percentage of annual
                autumn: 21,
                winter: 52,
                spring: 15,
              },
              highestRecordedDaily: 102, // in mm
            },
            future: {
              projectedChange: -8.5, // percentage by 2050
              droughtRisk: "Medium" as "Low" | "Medium" | "High",
              floodRisk: "Medium" as "Low" | "Medium" | "High",
            },
            anomalyData: {
              dryYears: 6, // out of last 10 years
              wetYears: 3, // out of last 10 years
              precipitationTrend: -12.5, // mm per decade
            }
          },
          windExposure: {
            averageWindSpeed: 18.7, // in km/h
            prevailingDirection: "South-East",
            gustRisk: "Medium" as "Low" | "Medium" | "High",
            hurricaneOrCycloneRisk: "Low" as "Low" | "Medium" | "High",
          },
          redFlagRisks: ["Increasing drought conditions", "Rising sea levels"],
        },
        hailRisk: {
          score: hailRiskScore,
          maxScore: hailRiskMaxScore,
          percentageScore: hailRiskPercentage,
          rating: hailRiskRating,
          factors: hailRiskFactors,
          hailCharacteristics: hailCharacteristics,
          impactAssessment: hailImpactAssessment,
          mitigationMeasures: hailMitigationMeasures,
        },
        lightningRisk: {
          score: lightningRiskScore,
          maxScore: lightningRiskMaxScore,
          percentageScore: lightningRiskPercentage,
          rating: lightningRiskRating,
          factors: lightningRiskFactors,
          lightningCharacteristics: lightningCharacteristics,
          vulnerabilityFactors: lightningVulnerabilityFactors,
          impactAssessment: lightningImpactAssessment,
          protectionSystems: lightningProtectionSystems,
          mitigationRecommendations: lightningMitigationRecommendations,
        },
        fireRisk: {
          score: fireRiskScore,
          maxScore: fireRiskMaxScore,
          percentageScore: fireRiskPercentage,
          rating: fireRiskRating,
          factors: fireRiskFactors,
          buildingConstructionType: formData.propertyType === "apartment" ? "Concrete frame with masonry" : "Wood frame with brick exterior",
          distanceToFireStation: 1.8, // in km
          fireSuppressionSystems: ["Sprinklers", "Fire extinguishers", "Smoke detectors"],
          solarInstallation: hasSolarPanels ? {
            hasSolarPanels: true,
            installationAge: 3, // in years
            solarFireRisk: "Medium" as "Low" | "Medium" | "High",
            safetyFeatures: ["DC isolation switches", "Micro-inverters"],
          } : undefined,
        },
        marketVolatility,
        locationRisk,
        propertyConditionRisk,
        financialRisk,
        demographicTrends,
        regulatoryRisk,
      },
      proximityRisks,
      topography,
      aggregateRiskMetrics,
      visualRiskBreakdown,
      projections: {
        shortTerm,
        mediumTerm,
        longTerm,
        trendDirection,
        riskTrendProjection,
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

    // Function to render risk category section
    const renderRiskCategory = (
      title: string,
      riskData: any,
      icon: React.ReactNode,
    ) => {
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
          <h2 className="text-2xl font-bold mb-4">Proply Risk Index™</h2>
          <h3 className="text-xl font-medium mb-5">{riskResult.propertyDetails.address}</h3>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-6">
            {riskResult.propertyDetails.bedrooms && (
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm">
                {riskResult.propertyDetails.bedrooms}{" "}
                {parseInt(riskResult.propertyDetails.bedrooms) === 1
                  ? "Bed"
                  : "Beds"}
              </Badge>
            )}
            {riskResult.propertyDetails.bathrooms && (
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm">
                {riskResult.propertyDetails.bathrooms}{" "}
                {parseInt(riskResult.propertyDetails.bathrooms) === 1
                  ? "Bath"
                  : "Baths"}
              </Badge>
            )}
            {riskResult.propertyDetails.size && (
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm">
                {riskResult.propertyDetails.size} m²
              </Badge>
            )}
            {riskResult.propertyDetails.parking && (
              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm">
                {riskResult.propertyDetails.parking} Parking
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

          {/* Property Value Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 max-w-3xl mx-auto">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Purchase Price</p>
              <p className="text-xl font-bold">R{riskResult.propertyDetails.price}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Municipal Value</p>
              <p className="text-xl font-bold">R{riskResult.propertyDetails.municipalValue}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Est. Monthly Rates</p>
              <p className="text-xl font-bold">R{riskResult.propertyDetails.monthlyRates}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Est. Monthly Costs</p>
              <p className="text-xl font-bold">R{riskResult.propertyDetails.estimatedMonthlyCosts}</p>
            </div>
          </div>

          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            A comprehensive assessment of property risks including security,
            environmental, flood, climate, and hail factors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-4xl mx-auto">
            {/* Risk Score Card */}
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white relative z-10">
              <div className="p-6 flex flex-col items-center">
                <h3 className="text-slate-700 font-medium mb-4">
                  Proply Risk Index™
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

            {/* Risk Factors Card */}
            <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white relative z-10">
              <div className="bg-gradient-to-r from-slate-700 to-gray-600 px-4 py-3">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-white mr-2" />
                  <h4 className="font-semibold text-white">Risk Factors</h4>
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
                          {Math.round(riskResult.riskFactors.securityRisk.percentageScore)}%
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          riskResult.riskFactors.securityRisk.rating === "Low" 
                            ? "bg-green-100 text-green-800" 
                            : riskResult.riskFactors.securityRisk.rating === "Medium" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {riskResult.riskFactors.securityRisk.rating}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          riskResult.riskFactors.securityRisk.rating === "Low" 
                            ? "bg-green-500" 
                            : riskResult.riskFactors.securityRisk.rating === "Medium" 
                            ? "bg-yellow-500" 
                            : "bg-red-500"
                        }`}
                        style={{ width: `${riskResult.riskFactors.securityRisk.percentageScore}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Environmental Risk */}
                  <div className="pb-2 border-b border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">Environmental</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">
                          {Math.round(riskResult.riskFactors.environmentalRisk.percentageScore)}%
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          riskResult.riskFactors.environmentalRisk.rating === "Low" 
                            ? "bg-green-100 text-green-800" 
                            : riskResult.riskFactors.environmentalRisk.rating === "Medium" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {riskResult.riskFactors.environmentalRisk.rating}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          riskResult.riskFactors.environmentalRisk.rating === "Low" 
                            ? "bg-green-500" 
                            : riskResult.riskFactors.environmentalRisk.rating === "Medium" 
                            ? "bg-yellow-500" 
                            : "bg-red-500"
                        }`}
                        style={{ width: `${riskResult.riskFactors.environmentalRisk.percentageScore}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Flood Risk */}
                  <div className="pb-2 border-b border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">Flood</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">
                          {Math.round(riskResult.riskFactors.floodRisk.percentageScore)}%
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          riskResult.riskFactors.floodRisk.rating === "Low" 
                            ? "bg-green-100 text-green-800" 
                            : riskResult.riskFactors.floodRisk.rating === "Medium" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {riskResult.riskFactors.floodRisk.rating}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          riskResult.riskFactors.floodRisk.rating === "Low" 
                            ? "bg-green-500" 
                            : riskResult.riskFactors.floodRisk.rating === "Medium" 
                            ? "bg-yellow-500" 
                            : "bg-red-500"
                        }`}
                        style={{ width: `${riskResult.riskFactors.floodRisk.percentageScore}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Climate Risk */}
                  <div className="pb-2 border-b border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">Climate</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">
                          {Math.round(riskResult.riskFactors.climateRisk.percentageScore)}%
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          riskResult.riskFactors.climateRisk.rating === "Low" 
                            ? "bg-green-100 text-green-800" 
                            : riskResult.riskFactors.climateRisk.rating === "Medium" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {riskResult.riskFactors.climateRisk.rating}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          riskResult.riskFactors.climateRisk.rating === "Low" 
                            ? "bg-green-500" 
                            : riskResult.riskFactors.climateRisk.rating === "Medium" 
                            ? "bg-yellow-500" 
                            : "bg-red-500"
                        }`}
                        style={{ width: `${riskResult.riskFactors.climateRisk.percentageScore}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Hail Risk */}
                  <div className="pb-2">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">Hail</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium">
                          {Math.round(riskResult.riskFactors.hailRisk.percentageScore)}%
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          riskResult.riskFactors.hailRisk.rating === "Low" 
                            ? "bg-green-100 text-green-800" 
                            : riskResult.riskFactors.hailRisk.rating === "Medium" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {riskResult.riskFactors.hailRisk.rating}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          riskResult.riskFactors.hailRisk.rating === "Low" 
                            ? "bg-green-500" 
                            : riskResult.riskFactors.hailRisk.rating === "Medium" 
                            ? "bg-yellow-500" 
                            : "bg-red-500"
                        }`}
                        style={{ width: `${riskResult.riskFactors.hailRisk.percentageScore}%` }}
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

          <div className="mb-8">
            <div className="text-lg font-semibold mb-4">
              Overall Risk Score: {riskResult.overallRiskScore}% -{" "}
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
          
          {/* Lightning Risk */}
          {renderRiskCategory(
            "Lightning",
            riskResult.riskFactors.lightningRisk,
            getRiskIcon("lightning"),
          )}
          
          {/* Fire Risk */}
          {renderRiskCategory(
            "Fire",
            riskResult.riskFactors.fireRisk,
            getRiskIcon("fire"),
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
            Total Risk Score: {riskResult.overallRiskScore}% -{" "}
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
                <span className="text-amber-600 font-medium">
                  Lightning Risk:
                </span>{" "}
                With a strike frequency of 3.8 strikes per km² annually, 
                additional surge protection is recommended for electronics and systems.
              </li>
              
              <li>
                <span className="text-amber-600 font-medium">
                  Fire Risk:
                </span>{" "}
                The building's construction type and maintenance status contribute to 
                elevated fire risk levels. Regular inspections and updated suppression systems are advised.
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

        {/* Report Footer */}
        <div className="pt-6 border-t text-center text-sm text-muted-foreground mb-8">
          <div className="flex items-center justify-center">
            <img
              src="/proply-favicon.png"
              alt="Proply Logo"
              className="h-4 w-4 mr-2"
            />
            <span>
              Proply Risk Index™ Report - Generated on{" "}
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
            filename={`Proply_Risk_Index_${riskResult?.propertyDetails?.address?.split(",")[0] || "Report"}.pdf`}
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
          <h1 className="text-6xl font-bold">Proply Risk Index™</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive insurance risk assessment for your property investment
          </p>
        </div>

        {!showResult ? (
          // Form section
          <Card className="max-w-2xl mx-auto relative z-10 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-center">
                Proply Risk Index™
              </CardTitle>
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
