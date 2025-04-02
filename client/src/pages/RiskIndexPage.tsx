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

    return {
      overallRiskScore: Math.round(overallRiskPercentage),
      totalRiskPoints,
      maxRiskPoints,
      riskRating,
      riskColor,
      propertyDetails: {
        address: formData.address,
        propertyType: formData.propertyType.charAt(0).toUpperCase() + formData.propertyType.slice(1),
        size: formData.size,
        bedrooms: formData.bedrooms || "0",
        bathrooms: formData.bathrooms || "0",
        parking: formData.parking || "0",
        condition: formData.propertyCondition,
        price: formData.purchasePrice,
        municipalValue: "3,600,000",
        monthlyRates: "2,850",
        levy: "1,950",
        estimatedMonthlyCosts: "4,800"
      },
      riskFactors: {
        securityRisk: {
          score: securityRiskScore,
          maxScore: securityRiskMaxScore,
          percentageScore: securityRiskPercentage,
          rating: securityRiskRating,
          factors: securityRiskFactors
        },
        environmentalRisk: {
          score: environmentalRiskScore,
          maxScore: environmentalRiskMaxScore,
          percentageScore: environmentalRiskPercentage,
          rating: environmentalRiskRating,
          factors: environmentalRiskFactors
        },
        floodRisk: {
          score: floodRiskScore,
          maxScore: floodRiskMaxScore,
          percentageScore: floodRiskPercentage,
          rating: floodRiskRating,
          factors: floodRiskFactors
        },
        climateRisk: {
          score: climateRiskScore,
          maxScore: climateRiskMaxScore,
          percentageScore: climateRiskPercentage,
          rating: climateRiskRating,
          factors: climateRiskFactors
        },
        hailRisk: {
          score: hailRiskScore,
          maxScore: hailRiskMaxScore,
          percentageScore: hailRiskPercentage,
          rating: hailRiskRating,
          factors: hailRiskFactors
        }
      },
      recommendations
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.address || !formData.purchasePrice || !formData.size) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Calculate risk index
    const result = calculateRiskIndex();
    setRiskResult(result);
    setShowResult(true);
    setIsLoading(false);

    // Show success toast
    toast({
      title: "Risk Index Calculated",
      description: "Your property risk analysis is complete.",
    });
  };

  // Check if a field is required and empty
  const checkRequiredFields = (field: string) => {
    if (field === "address" || field === "purchasePrice" || field === "size") {
      return formData[field as keyof typeof formData] === "";
    }
    return false;
  };

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-background">
      <div className="absolute top-8 left-8 z-20">
        <img
          src="/proply-logo-auth.png"
          alt="Proply Logo"
          className="h-8 w-auto"
        />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid background pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#8884_1px,transparent_1px),linear-gradient(to_bottom,#8884_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        {/* Gradient Circle Animations */}
        <div className="circle-animation absolute -top-[150px] -left-[150px] w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl"></div>
        <div className="circle-animation animation-delay-1000 absolute top-[20%] -right-[100px] w-[200px] h-[200px] rounded-full bg-blue-400/10 blur-3xl"></div>
        <div className="circle-animation animation-delay-2000 absolute -bottom-[150px] left-[20%] w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl"></div>

        {/* Data Points */}
        <div className="data-points absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/40"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
                animationDelay: `${Math.random() * 5000}ms`,
                animationDuration: `${Math.random() * 10000 + 5000}ms`,
              }}
            />
          ))}
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute top-[15%] left-[10%] w-16 h-16 border-2 border-primary/20 rounded-lg rotate-12 animate-float"></div>
        <div className="absolute bottom-[20%] right-[15%] w-20 h-20 border-2 border-primary/20 rounded-full animate-float animation-delay-1000"></div>
        <div className="absolute top-[60%] right-[25%] w-12 h-12 border-2 border-primary/20 rotate-45 animate-float animation-delay-2000"></div>

        {/* SVG Paths */}
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

      <div className="flex-1 relative z-10 flex flex-col items-center pt-8">
        <div className="container flex flex-col items-center px-2 py-4 text-center md:py-8 lg:py-12 max-w-[1600px]">
          <div className="w-full max-w-[1400px] space-y-4">
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
              Proply Risk Index™
            </h1>
            <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl">
              Get an instant risk assessment based on property details and
              market conditions.
            </p>
          </div>
        </div>

        {!showResult ? (
          <Card className="mx-auto mt-2 w-full max-w-[600px] bg-background rounded-lg p-6">
            <h1 className="text-3xl font-bold mb-8 text-center">
              Proply Risk Index™
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Address */}
              <div>
                <div className="flex flex-col w-full">
                  <AddressAutocomplete
                    id="address"
                    name="address"
                    label="Property Address"
                    placeholder="Enter the full property address"
                    value={formData.address}
                    onChange={(value) => handleInputChange("address", value)}
                    onAddressValidated={(addressData) => {
                      if (addressData.validationStatus === "valid") {
                        handleInputChange(
                          "address",
                          addressData.formattedAddress,
                        );
                      }
                    }}
                    className={
                      checkRequiredFields("address") ? "border-red-500" : ""
                    }
                    required
                  />
                  {checkRequiredFields("address") && (
                    <p className="text-red-500 text-xs mt-1">
                      Please enter the property address
                    </p>
                  )}
                </div>
              </div>

              {/* Property Type */}
              <div>
                <Label htmlFor="propertyType" className="mb-1 block">
                  Property Type
                </Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) =>
                    handleInputChange("propertyType", value)
                  }
                >
                  <SelectTrigger>
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
              <div>
                <Label
                  htmlFor="size"
                  className="mb-1 block"
                  data-error={checkRequiredFields("size")}
                >
                  Property Size (m²)
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="size"
                    placeholder="0"
                    value={formData.size}
                    onChange={(e) => handleInputChange("size", e.target.value)}
                    className={
                      checkRequiredFields("size")
                        ? "border-red-500 pr-16"
                        : "pr-16"
                    }
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-muted-foreground">m²</span>
                  </div>
                </div>
                {checkRequiredFields("size") && (
                  <p className="text-red-500 text-xs mt-1">
                    Please enter the property size
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bedrooms */}
                <div>
                  <Label htmlFor="bedrooms" className="mb-1 block">
                    Bedrooms
                  </Label>
                  <Input
                    id="bedrooms"
                    placeholder="2"
                    value={formData.bedrooms}
                    onChange={(e) =>
                      handleInputChange("bedrooms", e.target.value)
                    }
                  />
                </div>

                {/* Bathrooms */}
                <div>
                  <Label htmlFor="bathrooms" className="mb-1 block">
                    Bathrooms
                  </Label>
                  <Input
                    id="bathrooms"
                    placeholder="2"
                    value={formData.bathrooms}
                    onChange={(e) =>
                      handleInputChange("bathrooms", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Parking */}
              <div>
                <Label htmlFor="parking" className="mb-1 block">
                  Parking Spaces
                </Label>
                <Input
                  id="parking"
                  placeholder="1"
                  value={formData.parking}
                  onChange={(e) => handleInputChange("parking", e.target.value)}
                />
              </div>

              {/* Property Condition */}
              <div>
                <Label htmlFor="propertyCondition" className="mb-1 block">
                  Property Condition
                </Label>
                <Select
                  value={formData.propertyCondition}
                  onValueChange={(value) =>
                    handleInputChange("propertyCondition", value)
                  }
                >
                  <SelectTrigger>
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
              <div>
                <Label
                  htmlFor="purchasePrice"
                  className="mb-1 block"
                  data-error={checkRequiredFields("purchasePrice")}
                >
                  Purchase Price/Property Value
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-muted-foreground">R</span>
                  </div>
                  <Input
                    id="purchasePrice"
                    placeholder="0"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      handleInputChange("purchasePrice", e.target.value)
                    }
                    className={
                      checkRequiredFields("purchasePrice")
                        ? "border-red-500 pl-8"
                        : "pl-8"
                    }
                  />
                </div>
                {checkRequiredFields("purchasePrice") && (
                  <p className="text-red-500 text-xs mt-1">
                    Please enter the purchase price
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-6">
                <Button type="submit" className="ml-auto">
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
          <div className="w-full max-w-[900px] space-y-6 mx-auto">
            {riskResult && (
              <>
                {/* Risk Score Header */}
                <Card className="bg-background border-0 shadow-lg overflow-hidden">
                  <div className="relative p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                      <div className="mb-4 md:mb-0">
                        <h2 className="text-2xl font-bold">
                          Proply Risk Index™ Score
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

                {/* Property Details */}
                <Card className="bg-background border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Home className="mr-2 h-5 w-5" />
                      Property Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Property Type
                        </p>
                        <p className="font-medium">
                          {riskResult.propertyDetails.propertyType
                            .charAt(0)
                            .toUpperCase() +
                            riskResult.propertyDetails.propertyType.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Property Size
                        </p>
                        <p className="font-medium">
                          {riskResult.propertyDetails.size} m²
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Purchase Price
                        </p>
                        <p className="font-medium">
                          R {riskResult.propertyDetails.price}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Bedrooms
                        </p>
                        <p className="font-medium">
                          {riskResult.propertyDetails.bedrooms}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Bathrooms
                        </p>
                        <p className="font-medium">
                          {riskResult.propertyDetails.bathrooms}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Parking</p>
                        <p className="font-medium">
                          {riskResult.propertyDetails.parking}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Factors */}
                <Card className="bg-background border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="mr-2 h-5 w-5" />
                      Risk Factors
                    </CardTitle>
                    <CardDescription>
                      Individual risk elements that contribute to the overall
                      risk score
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                </Card>

                {/* Projections */}
                <Card className="bg-background border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Market Projections
                    </CardTitle>
                    <CardDescription>
                      Expected trends and performance insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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
                            ? "Overall stable market performance expected"
                            : "Caution advised - negative trend potential"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="bg-background border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Recommendations
                    </CardTitle>
                    <CardDescription>
                      Strategic advice based on risk analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {riskResult.recommendations.map(
                        (recommendation, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2 mt-0.5">•</span>
                            <span>{recommendation}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setShowResult(false)}
                    className="flex items-center"
                  >
                    <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                    Return to Form
                  </Button>
                  <Button className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </div>
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
