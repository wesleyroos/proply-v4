"use client";

import { useState } from "react";
import {
  ArrowRight,
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
  Download
} from "lucide-react";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  riskRating: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
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
  };
  riskFactors: {
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
    trendDirection: 'up' | 'stable' | 'down';
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
    
    // Base risk score calculation (lower is better)
    let baseScore = 50; // Start with neutral score
    
    // Property type risk adjustment
    switch (formData.propertyType) {
      case "apartment":
        baseScore += 5; // Slightly higher risk
        break;
      case "house":
        baseScore -= 5; // Slightly lower risk
        break;
      case "commercial":
        baseScore += 15; // Higher risk
        break;
      case "townhouse":
        baseScore -= 2; // Lower risk
        break;
      case "villa":
        baseScore -= 8; // Lower risk
        break;
    }
    
    // Property condition adjustment
    switch (formData.propertyCondition) {
      case "excellent":
        baseScore -= 15;
        break;
      case "good":
        baseScore -= 8;
        break;
      case "fair":
        baseScore += 5;
        break;
      case "poor":
        baseScore += 15;
        break;
    }
    
    // Price to size ratio impact (higher ratio = higher price per sqm = potentially higher risk)
    const pricePerSqm = price / propertySize;
    if (pricePerSqm > 45000) {
      baseScore += 10; // Very expensive for size
    } else if (pricePerSqm > 35000) {
      baseScore += 5; // Somewhat expensive
    } else if (pricePerSqm < 20000) {
      baseScore -= 5; // Good value
    }
    
    // Adjust for bedrooms and price ratio
    const pricePerBedroom = bedrooms > 0 ? price / bedrooms : price;
    if (pricePerBedroom > 2000000) {
      baseScore += 8; // Very expensive per bedroom
    } else if (pricePerBedroom < 1000000) {
      baseScore -= 5; // Good value per bedroom
    }
    
    // Adjust for bathrooms and bedrooms ratio
    if (bedrooms > 0 && bathrooms / bedrooms < 0.5) {
      baseScore += 5; // Too few bathrooms
    } else if (bedrooms > 0 && bathrooms / bedrooms > 1.5) {
      baseScore -= 3; // Good bathroom ratio
    }
    
    // Ensure score is within bounds
    let finalScore = Math.max(0, Math.min(100, baseScore));
    
    // Determine risk rating based on score
    let riskRating: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
    let riskColor: string;
    
    if (finalScore < 20) {
      riskRating = 'Very Low';
      riskColor = 'green';
    } else if (finalScore < 40) {
      riskRating = 'Low';
      riskColor = 'teal';
    } else if (finalScore < 60) {
      riskRating = 'Moderate';
      riskColor = 'orange';
    } else if (finalScore < 80) {
      riskRating = 'High';
      riskColor = 'amber';
    } else {
      riskRating = 'Very High';
      riskColor = 'red';
    }
    
    // Calculate individual risk factors (0-100 scale)
    const marketVolatility = Math.min(100, Math.max(0, 50 + (Math.random() * 20 - 10)));
    const locationRisk = Math.min(100, Math.max(0, baseScore - 15 + (Math.random() * 10)));
    const propertyConditionRisk = Math.min(100, Math.max(0, 
      formData.propertyCondition === 'excellent' ? 20 : 
      formData.propertyCondition === 'good' ? 40 : 
      formData.propertyCondition === 'fair' ? 70 : 90
    ));
    const financialRisk = Math.min(100, Math.max(0, (price > 3000000 ? 60 : 40) + (Math.random() * 20 - 10)));
    const demographicTrends = Math.min(100, Math.max(0, 50 + (Math.random() * 30 - 15)));
    const regulatoryRisk = Math.min(100, Math.max(0, 40 + (Math.random() * 20 - 10)));
    
    // Generate recommendations based on risk factors
    const recommendations: string[] = [];
    
    if (propertyConditionRisk > 60) {
      recommendations.push("Consider budgeting for property repairs and maintenance costs.");
    }
    
    if (marketVolatility > 60) {
      recommendations.push("Market shows high volatility. Consider diversifying your investment portfolio.");
    }
    
    if (locationRisk > 60) {
      recommendations.push("Research neighborhood trends and development plans before investment.");
    }
    
    if (financialRisk > 60) {
      recommendations.push("Consider alternative financing options to reduce financial exposure.");
    }
    
    if (demographicTrends > 60) {
      recommendations.push("Monitor demographic changes in the area that may impact property values.");
    }
    
    // Add general recommendations
    recommendations.push("Consult with a property investment specialist before finalizing your decision.");
    recommendations.push("Consider getting a professional property valuation and inspection report.");
    
    // Determine trend projections
    let trendDirection: 'up' | 'stable' | 'down';
    if (finalScore < 40) {
      trendDirection = 'up';
    } else if (finalScore < 70) {
      trendDirection = 'stable';
    } else {
      trendDirection = 'down';
    }
    
    return {
      overallRiskScore: finalScore,
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
      },
      riskFactors: {
        marketVolatility,
        locationRisk,
        propertyConditionRisk,
        financialRisk,
        demographicTrends,
        regulatoryRisk,
      },
      projections: {
        shortTerm: trendDirection === 'up' ? 'Positive growth potential' : 
                  trendDirection === 'stable' ? 'Stable returns expected' : 'Potential value decline',
        mediumTerm: trendDirection === 'up' ? 'Strong appreciation likely' : 
                   trendDirection === 'stable' ? 'Moderate growth expected' : 'Flat or negative growth possible',
        longTerm: trendDirection === 'up' ? 'Excellent long-term potential' : 
                trendDirection === 'stable' ? 'Consistent returns expected' : 'Significant intervention may be required',
        trendDirection,
      },
      recommendations,
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
              Get an instant risk assessment based on property details and market conditions.
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
                        handleInputChange("address", addressData.formattedAddress);
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
                  onValueChange={(value) => handleInputChange("propertyType", value)}
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
                      checkRequiredFields("size") ? "border-red-500 pr-16" : "pr-16"
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
                    onChange={(e) => handleInputChange("bedrooms", e.target.value)}
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
                    onChange={(e) => handleInputChange("bathrooms", e.target.value)}
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
                  onValueChange={(value) => handleInputChange("propertyCondition", value)}
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
                    onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
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
                        <h2 className="text-2xl font-bold">Proply Risk Index™ Score</h2>
                        <p className="text-muted-foreground">
                          {riskResult.propertyDetails.address}
                        </p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div 
                          className={`relative w-32 h-32 rounded-full flex items-center justify-center border-8 ${
                            riskResult.riskRating === 'Very Low' ? 'border-green-500 text-green-500' :
                            riskResult.riskRating === 'Low' ? 'border-teal-500 text-teal-500' :
                            riskResult.riskRating === 'Moderate' ? 'border-orange-500 text-orange-500' :
                            riskResult.riskRating === 'High' ? 'border-amber-500 text-amber-500' :
                            'border-red-500 text-red-500'
                          }`}
                        >
                          <span className="text-4xl font-bold">{Math.round(riskResult.overallRiskScore)}</span>
                        </div>
                        <div className="mt-2 text-center">
                          <Badge 
                            className={`text-white ${
                              riskResult.riskRating === 'Very Low' ? 'bg-green-500 hover:bg-green-600' :
                              riskResult.riskRating === 'Low' ? 'bg-teal-500 hover:bg-teal-600' :
                              riskResult.riskRating === 'Moderate' ? 'bg-orange-500 hover:bg-orange-600' :
                              riskResult.riskRating === 'High' ? 'bg-amber-500 hover:bg-amber-600' :
                              'bg-red-500 hover:bg-red-600'
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
                        <p className="text-sm text-muted-foreground">Property Type</p>
                        <p className="font-medium">{riskResult.propertyDetails.propertyType.charAt(0).toUpperCase() + riskResult.propertyDetails.propertyType.slice(1)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Property Size</p>
                        <p className="font-medium">{riskResult.propertyDetails.size} m²</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Purchase Price</p>
                        <p className="font-medium">R {riskResult.propertyDetails.price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bedrooms</p>
                        <p className="font-medium">{riskResult.propertyDetails.bedrooms}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bathrooms</p>
                        <p className="font-medium">{riskResult.propertyDetails.bathrooms}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Parking</p>
                        <p className="font-medium">{riskResult.propertyDetails.parking}</p>
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
                      Individual risk elements that contribute to the overall risk score
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Market Volatility</span>
                          <span className="text-sm font-medium">{Math.round(riskResult.riskFactors.marketVolatility)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{
                              width: `${riskResult.riskFactors.marketVolatility}%`,
                              backgroundColor: riskResult.riskFactors.marketVolatility > 70 ? 'rgb(239, 68, 68)' : 
                                             riskResult.riskFactors.marketVolatility > 50 ? 'rgb(249, 115, 22)' : 
                                             'rgb(34, 197, 94)'
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Location Risk</span>
                          <span className="text-sm font-medium">{Math.round(riskResult.riskFactors.locationRisk)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{
                              width: `${riskResult.riskFactors.locationRisk}%`,
                              backgroundColor: riskResult.riskFactors.locationRisk > 70 ? 'rgb(239, 68, 68)' : 
                                             riskResult.riskFactors.locationRisk > 50 ? 'rgb(249, 115, 22)' : 
                                             'rgb(34, 197, 94)'
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Property Condition Risk</span>
                          <span className="text-sm font-medium">{Math.round(riskResult.riskFactors.propertyConditionRisk)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{
                              width: `${riskResult.riskFactors.propertyConditionRisk}%`,
                              backgroundColor: riskResult.riskFactors.propertyConditionRisk > 70 ? 'rgb(239, 68, 68)' : 
                                             riskResult.riskFactors.propertyConditionRisk > 50 ? 'rgb(249, 115, 22)' : 
                                             'rgb(34, 197, 94)'
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Financial Risk</span>
                          <span className="text-sm font-medium">{Math.round(riskResult.riskFactors.financialRisk)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{
                              width: `${riskResult.riskFactors.financialRisk}%`,
                              backgroundColor: riskResult.riskFactors.financialRisk > 70 ? 'rgb(239, 68, 68)' : 
                                             riskResult.riskFactors.financialRisk > 50 ? 'rgb(249, 115, 22)' : 
                                             'rgb(34, 197, 94)'
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Demographic Trends</span>
                          <span className="text-sm font-medium">{Math.round(riskResult.riskFactors.demographicTrends)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{
                              width: `${riskResult.riskFactors.demographicTrends}%`,
                              backgroundColor: riskResult.riskFactors.demographicTrends > 70 ? 'rgb(239, 68, 68)' : 
                                             riskResult.riskFactors.demographicTrends > 50 ? 'rgb(249, 115, 22)' : 
                                             'rgb(34, 197, 94)'
                            }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Regulatory Risk</span>
                          <span className="text-sm font-medium">{Math.round(riskResult.riskFactors.regulatoryRisk)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{
                              width: `${riskResult.riskFactors.regulatoryRisk}%`,
                              backgroundColor: riskResult.riskFactors.regulatoryRisk > 70 ? 'rgb(239, 68, 68)' : 
                                             riskResult.riskFactors.regulatoryRisk > 50 ? 'rgb(249, 115, 22)' : 
                                             'rgb(34, 197, 94)'
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
                          <h3 className="font-semibold">Medium Term (5 Years)</h3>
                        </div>
                        <p>{riskResult.projections.mediumTerm}</p>
                      </div>
                      <div className="p-4 border rounded-md">
                        <div className="flex items-center mb-2">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">Long Term (10+ Years)</h3>
                        </div>
                        <p>{riskResult.projections.longTerm}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center">
                      <div className="mr-2">
                        {riskResult.projections.trendDirection === 'up' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : riskResult.projections.trendDirection === 'stable' ? (
                          <ArrowRight className="h-5 w-5 text-orange-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <p className="font-medium">
                        {riskResult.projections.trendDirection === 'up' 
                          ? 'Overall positive trend expected' 
                          : riskResult.projections.trendDirection === 'stable'
                          ? 'Overall stable market performance expected'
                          : 'Caution advised - negative trend potential'}
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
                      {riskResult.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2 mt-0.5">•</span>
                          <span>{recommendation}</span>
                        </li>
                      ))}
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
              The Proply Risk Index™ is a proprietary algorithm designed to assess investment risk.
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