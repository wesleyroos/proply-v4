"use client";

import { useState } from "react";
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
  BarChart4,
  Download,
  Droplets,
  Cloud,
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

// Risk Index Result interface
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
      securityRiskFactors.push("Property is located in an apartment building with shared access");
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
      securityRiskFactors.push("Property is located in an area with moderate crime rates");
    }
    
    // Add generic factors for demo
    securityRiskFactors.push("Building has security but lacks 24-hour monitoring");
    securityRiskFactors.push("Access control systems are present but could be improved");
    
    // Security risk rating
    const securityRiskPercentage = (securityRiskScore / securityRiskMaxScore) * 100;
    const securityRiskRating = securityRiskPercentage < 33 ? "Low" : securityRiskPercentage < 66 ? "Medium" : "High";

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
    const environmentalRiskPercentage = (environmentalRiskScore / environmentalRiskMaxScore) * 100;
    const environmentalRiskRating = environmentalRiskPercentage < 33 ? "Low" : environmentalRiskPercentage < 66 ? "Medium" : "High";

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
      floodRiskFactors.push("Basement level is particularly vulnerable to water ingress");
    }
    
    // Flood risk rating
    const floodRiskPercentage = (floodRiskScore / floodRiskMaxScore) * 100;
    const floodRiskRating = floodRiskPercentage < 33 ? "Low" : floodRiskPercentage < 66 ? "Medium" : "High";

    // CLIMATE RISK CALCULATION
    const climateRiskMaxScore = 270;
    let climateRiskScore = 0;
    const climateRiskFactors: string[] = [];

    // Property location and construction affect climate risk
    if (formData.propertyCondition === "excellent" || formData.propertyCondition === "good") {
      climateRiskScore += 61; // Better buildings withstand climate risks better
      climateRiskFactors.push("Property is not in a high-risk zone for sea level rise");
      climateRiskFactors.push("Building materials are resistant to temperature fluctuations");
      climateRiskFactors.push("Energy-efficient design helps mitigate extreme weather impacts");
      climateRiskFactors.push("Property has good natural ventilation reducing AC dependency");
    } else {
      climateRiskScore += 120; // Poorer condition buildings have higher climate risk
      climateRiskFactors.push("Property may experience increased maintenance due to weather extremes");
      climateRiskFactors.push("Building materials may not be optimal for temperature regulation");
    }
    
    // Climate risk rating
    const climateRiskPercentage = (climateRiskScore / climateRiskMaxScore) * 100;
    const climateRiskRating = climateRiskPercentage < 33 ? "Low" : climateRiskPercentage < 66 ? "Medium" : "High";

    // HAIL RISK CALCULATION
    const hailRiskMaxScore = 30;
    let hailRiskScore = 0;
    const hailRiskFactors: string[] = [];

    // Roof condition affects hail risk
    if (formData.propertyCondition === "excellent") {
      hailRiskScore += 10; // Lower risk with excellent roofing
      hailRiskFactors.push("Roof is in excellent condition and likely to withstand hail impact");
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
    const hailRiskRating = hailRiskPercentage < 33 ? "Low" : hailRiskPercentage < 66 ? "Medium" : "High";

    // OVERALL RISK CALCULATION
    const totalRiskPoints = securityRiskScore + environmentalRiskScore + floodRiskScore + climateRiskScore + hailRiskScore;
    const maxRiskPoints = securityRiskMaxScore + environmentalRiskMaxScore + floodRiskMaxScore + climateRiskMaxScore + hailRiskMaxScore;
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
      recommendations.push("Consider upgrading security systems and access control.");
      recommendations.push("Install additional exterior lighting around the property.");
    }

    // Add flood recommendations
    if (floodRiskRating === "High") {
      recommendations.push("Obtain comprehensive flood insurance coverage.");
      recommendations.push("Install flood barriers and improved drainage systems.");
    }

    // Add climate recommendations
    if (climateRiskRating === "Medium" || climateRiskRating === "High") {
      recommendations.push("Improve building insulation to manage temperature extremes.");
      recommendations.push("Consider energy-efficient upgrades to reduce climate vulnerability.");
    }

    // Add generic recommendations
    recommendations.push("Conduct a professional property inspection before finalizing insurance coverage.");
    recommendations.push("Consider bundling multiple insurance policies for better protection and rates.");

    // Calculate additional risk factors
    const marketVolatility = Math.floor(Math.random() * 35) + 40; // Random value between 40-75%
    const locationRisk = Math.floor(Math.random() * 45) + 30; // Random value between 30-75%
    const propertyConditionRisk = formData.propertyCondition === "excellent" ? 25 : 
                                formData.propertyCondition === "good" ? 45 : 
                                formData.propertyCondition === "fair" ? 65 : 85;
    const financialRisk = Math.floor(Math.random() * 30) + 40; // Random value between 40-70%
    const demographicTrends = Math.floor(Math.random() * 40) + 30; // Random value between 30-70%
    const regulatoryRisk = Math.floor(Math.random() * 35) + 25; // Random value between 25-60%
    
    // Generate market projections
    const shortTerm = "Property insurance costs are expected to increase by 8-12% in the next year due to rising material costs and increased claim frequency.";
    const mediumTerm = "Over the next 5 years, property in this area may experience a 15-20% increase in insurance premiums as climate-related risks continue to be factored into underwriting models.";
    const longTerm = "Long-term projections suggest a 30-35% increase in insurance costs for properties in this zone over the next decade, with potential new regulatory requirements for flood and climate risk mitigation.";
    
    // Determine trend direction based on overall risk score
    let trendDirection: "up" | "stable" | "down";
    if (overallRiskPercentage > 60) {
      trendDirection = "up";
    } else if (overallRiskPercentage > 40) {
      trendDirection = "stable";
    } else {
      trendDirection = "down";
    }

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

  return (
    <div className="min-h-screen bg-background">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#e5f9ff,transparent)]" />
      </div>

      <div className="container mx-auto px-4 pt-[80px] pb-20">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold">Proply Risk Index™</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive insurance risk assessment for your property investment
          </p>
        </div>

        {!showResult ? (
          // Form section
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Property Risk Assessment</CardTitle>
              <CardDescription>
                Enter property details for a detailed risk analysis
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleFormSubmit}>
              <CardContent className="space-y-8">
                {/* Property Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="font-medium">
                    <MapPin className="h-4 w-4 inline mr-1" /> Property Address
                  </Label>
                  <AddressAutocomplete
                    placeholder="Enter the property address"
                    value={formData.address}
                    onChange={handleAddressChange}
                  />
                </div>

                {/* Property Type */}
                <div className="space-y-2">
                  <Label htmlFor="propertyType" className="font-medium">
                    <Home className="h-4 w-4 inline mr-1" /> Property Type
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
                <div className="space-y-2">
                  <Label htmlFor="size" className="font-medium">
                    <Package2 className="h-4 w-4 inline mr-1" /> Property Size (m²)
                  </Label>
                  <Input
                    id="size"
                    placeholder="Size in square meters"
                    value={formData.size}
                    onChange={(e) => handleInputChange("size", e.target.value)}
                  />
                </div>

                {/* Property Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms" className="font-medium">
                      <BarChart3 className="h-4 w-4 inline mr-1" /> Bedrooms
                    </Label>
                    <Input
                      id="bedrooms"
                      placeholder="e.g. 3"
                      value={formData.bedrooms}
                      onChange={(e) =>
                        handleInputChange("bedrooms", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms" className="font-medium">
                      <Droplets className="h-4 w-4 inline mr-1" /> Bathrooms
                    </Label>
                    <Input
                      id="bathrooms"
                      placeholder="e.g. 2"
                      value={formData.bathrooms}
                      onChange={(e) =>
                        handleInputChange("bathrooms", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parking" className="font-medium">
                      <Car className="h-4 w-4 inline mr-1" /> Parking
                    </Label>
                    <Input
                      id="parking"
                      placeholder="e.g. 1"
                      value={formData.parking}
                      onChange={(e) =>
                        handleInputChange("parking", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Property Condition */}
                <div className="space-y-2">
                  <Label htmlFor="propertyCondition" className="font-medium">
                    <Building className="h-4 w-4 inline mr-1" /> Property
                    Condition
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
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice" className="font-medium">
                    <CircleDollarSign className="h-4 w-4 inline mr-1" />{" "}
                    Purchase Price/Property Value
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">R</span>
                    </div>
                    <Input
                      id="purchasePrice"
                      className="pl-8"
                      placeholder="e.g. 3,500,000"
                      value={formData.purchasePrice}
                      onChange={(e) =>
                        handleInputChange("purchasePrice", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>

              <div className="flex items-center justify-end p-6 pt-0">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing
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
          <div className="w-full max-w-[900px] space-y-6 mx-auto">
            {riskResult && (
              <>
                {/* Risk Score Header */}
                <Card className="bg-background border-0 shadow-lg overflow-hidden">
                  <div className="relative p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                      <div className="mb-4 md:mb-0">
                        <h2 className="text-2xl font-bold">
                          Property Risk Score
                        </h2>
                        <p className="text-muted-foreground">
                          {riskResult.propertyDetails.address}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div
                          className={`relative w-32 h-32 rounded-full flex items-center justify-center border-8 ${
                            riskResult.riskRating === "Very Low"
                              ? "border-green-500 text-green-500"
                              : riskResult.riskRating === "Low"
                                ? "border-teal-500 text-teal-500"
                                : riskResult.riskRating === "Moderate"
                                  ? "border-orange-500 text-orange-500"
                                  : riskResult.riskRating === "High"
                                    ? "border-amber-500 text-amber-500"
                                    : "border-red-500 text-red-500"
                          }`}
                        >
                          <span className="text-4xl font-bold">
                            {Math.round(riskResult.overallRiskScore)}
                          </span>
                        </div>
                        <div className="mt-2 text-center">
                          <Badge
                            className={`text-white ${
                              riskResult.riskRating === "Very Low"
                                ? "bg-green-500 hover:bg-green-600"
                                : riskResult.riskRating === "Low"
                                  ? "bg-teal-500 hover:bg-teal-600"
                                  : riskResult.riskRating === "Moderate"
                                    ? "bg-orange-500 hover:bg-orange-600"
                                    : riskResult.riskRating === "High"
                                      ? "bg-amber-500 hover:bg-amber-600"
                                      : "bg-red-500 hover:bg-red-600"
                            }`}
                          >
                            {riskResult.riskRating} Risk
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Overall Risk Score with Scale */}
                <div className="my-4">
                  <div className="bg-slate-50 rounded-md p-4 mb-4 text-center">
                    <h3 className="text-lg font-semibold">
                      Overall Risk Score:{" "}
                      <span className="text-green-600 font-bold">
                        {riskResult.totalRiskPoints}/{riskResult.maxRiskPoints} ({riskResult.overallRiskScore}%)
                      </span>{" "}
                      - {riskResult.riskRating} Risk Property
                    </h3>
                  </div>
                  
                  <div className="relative h-8 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500">
                    {/* Marker showing current risk level */}
                    <div 
                      className="absolute top-0 w-6 h-6 bg-white rounded-full border-2 border-gray-300 transform -translate-x-1/2"
                      style={{ 
                        left: `${riskResult.overallRiskScore}%`,
                        top: '-4px' 
                      }}
                    />
                    
                    {/* Risk labels underneath */}
                    <div className="absolute -bottom-8 left-0 text-sm font-medium">
                      Low Risk
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm font-medium">
                      Medium Risk
                    </div>
                    <div className="absolute -bottom-8 right-0 text-sm font-medium">
                      High Risk
                    </div>
                  </div>
                </div>

                {/* All Report Content in a Single Card */}
                <Card className="bg-background border-0 shadow-md mt-12">
                  {/* Property Details Section */}
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Home className="mr-2 h-5 w-5" />
                        Property Details
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* General Information Column */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-700">General Information</h3>
                        
                        <div className="flex justify-between items-center border-b pb-2">
                          <p className="text-sm text-muted-foreground">Property Type:</p>
                          <p className="font-medium text-right">
                            {riskResult.propertyDetails.propertyType
                              .charAt(0)
                              .toUpperCase() +
                              riskResult.propertyDetails.propertyType.slice(1)}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center border-b pb-2">
                          <p className="text-sm text-muted-foreground">Size:</p>
                          <p className="font-medium text-right">
                            {riskResult.propertyDetails.size} m²
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center border-b pb-2">
                          <p className="text-sm text-muted-foreground">Bedrooms:</p>
                          <p className="font-medium text-right">
                            {riskResult.propertyDetails.bedrooms}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center border-b pb-2">
                          <p className="text-sm text-muted-foreground">Bathrooms:</p>
                          <p className="font-medium text-right">
                            {riskResult.propertyDetails.bathrooms}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center border-b pb-2">
                          <p className="text-sm text-muted-foreground">Parking:</p>
                          <p className="font-medium text-right">
                            {riskResult.propertyDetails.parking} Covered
                          </p>
                        </div>
                      </div>
                      
                      {/* Financial Information Column */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-700">Financial Information</h3>
                        
                        <div className="flex justify-between items-center border-b pb-2">
                          <p className="text-sm text-muted-foreground">Municipal Value:</p>
                          <p className="font-medium text-right">
                            R{riskResult.propertyDetails.municipalValue}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center border-b pb-2">
                          <p className="text-sm text-muted-foreground">Monthly Rates:</p>
                          <p className="font-medium text-right">
                            R{riskResult.propertyDetails.monthlyRates}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center border-b pb-2">
                          <p className="text-sm text-muted-foreground">Levy:</p>
                          <p className="font-medium text-right">
                            R{riskResult.propertyDetails.levy}
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center border-b pb-2">
                          <p className="text-sm text-muted-foreground">Estimated Monthly Costs:</p>
                          <p className="font-medium text-right">
                            R{riskResult.propertyDetails.estimatedMonthlyCosts}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Risk Factors Section */}
                  <CardHeader className="border-t border-b pt-8">
                    <CardTitle className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5" />
                      Risk Factors
                    </CardTitle>
                    <CardDescription>
                      Individual risk elements that contribute to the overall
                      risk score
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 pb-2">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            Market Volatility
                          </span>
                          <span className="text-sm font-medium">
                            {Math.round(
                              riskResult.riskFactors.marketVolatility,
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${riskResult.riskFactors.marketVolatility}%`,
                              backgroundColor:
                                riskResult.riskFactors.marketVolatility > 70
                                  ? "rgb(239, 68, 68)"
                                  : riskResult.riskFactors.marketVolatility > 50
                                    ? "rgb(249, 115, 22)"
                                    : "rgb(34, 197, 94)",
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            Location Risk
                          </span>
                          <span className="text-sm font-medium">
                            {Math.round(riskResult.riskFactors.locationRisk)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${riskResult.riskFactors.locationRisk}%`,
                              backgroundColor:
                                riskResult.riskFactors.locationRisk > 70
                                  ? "rgb(239, 68, 68)"
                                  : riskResult.riskFactors.locationRisk > 50
                                    ? "rgb(249, 115, 22)"
                                    : "rgb(34, 197, 94)",
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            Property Condition Risk
                          </span>
                          <span className="text-sm font-medium">
                            {Math.round(
                              riskResult.riskFactors.propertyConditionRisk,
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${riskResult.riskFactors.propertyConditionRisk}%`,
                              backgroundColor:
                                riskResult.riskFactors.propertyConditionRisk >
                                70
                                  ? "rgb(239, 68, 68)"
                                  : riskResult.riskFactors
                                        .propertyConditionRisk > 50
                                    ? "rgb(249, 115, 22)"
                                    : "rgb(34, 197, 94)",
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            Financial Risk
                          </span>
                          <span className="text-sm font-medium">
                            {Math.round(riskResult.riskFactors.financialRisk)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${riskResult.riskFactors.financialRisk}%`,
                              backgroundColor:
                                riskResult.riskFactors.financialRisk > 70
                                  ? "rgb(239, 68, 68)"
                                  : riskResult.riskFactors.financialRisk > 50
                                    ? "rgb(249, 115, 22)"
                                    : "rgb(34, 197, 94)",
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            Demographic Trends
                          </span>
                          <span className="text-sm font-medium">
                            {Math.round(
                              riskResult.riskFactors.demographicTrends,
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${riskResult.riskFactors.demographicTrends}%`,
                              backgroundColor:
                                riskResult.riskFactors.demographicTrends > 70
                                  ? "rgb(239, 68, 68)"
                                  : riskResult.riskFactors.demographicTrends >
                                      50
                                    ? "rgb(249, 115, 22)"
                                    : "rgb(34, 197, 94)",
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            Regulatory Risk
                          </span>
                          <span className="text-sm font-medium">
                            {Math.round(riskResult.riskFactors.regulatoryRisk)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${riskResult.riskFactors.regulatoryRisk}%`,
                              backgroundColor:
                                riskResult.riskFactors.regulatoryRisk > 70
                                  ? "rgb(239, 68, 68)"
                                  : riskResult.riskFactors.regulatoryRisk > 50
                                    ? "rgb(249, 115, 22)"
                                    : "rgb(34, 197, 94)",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Projections Section */}
                  <CardHeader className="border-t border-b pt-8">
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Market Projections
                    </CardTitle>
                    <CardDescription>
                      Expected trends and performance insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 pb-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-md">
                        <div className="flex items-center mb-2">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">Short Term (1 Year)</h3>
                        </div>
                        <p>{riskResult.projections.shortTerm}</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <div className="flex items-center mb-2">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">
                            Medium Term (5 Years)
                          </h3>
                        </div>
                        <p>{riskResult.projections.mediumTerm}</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <div className="flex items-center mb-2">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">
                            Long Term (10+ Years)
                          </h3>
                        </div>
                        <p>{riskResult.projections.longTerm}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center">
                      <div className="mr-2">
                        {riskResult.projections.trendDirection === "up" ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : riskResult.projections.trendDirection ===
                          "stable" ? (
                          <ArrowRight className="h-5 w-5 text-orange-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <p className="font-medium">
                        {riskResult.projections.trendDirection === "up"
                          ? "Overall positive trend expected"
                          : riskResult.projections.trendDirection === "stable"
                            ? "Market expected to remain stable"
                            : "Potential downward trend expected"}
                      </p>
                    </div>
                  </CardContent>

                  {/* Recommendations Section */}
                  <CardHeader className="border-t pt-8">
                    <CardTitle className="flex items-center">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Recommendations
                    </CardTitle>
                    <CardDescription>
                      Strategic advice based on risk analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 pb-6">
                    <ul className="space-y-2">
                      {riskResult.recommendations.map(
                        (recommendation, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 shrink-0 mt-0.5" />
                            <span>{recommendation}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
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