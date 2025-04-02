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
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define the RiskResult interface
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

  // Form state variables
  const [address, setAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [size, setSize] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [parking, setParking] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Prefill form with example data
  const prefillForm = () => {
    setAddress("27 Leeuwen St, Cape Town City Centre, 8001");
    setPropertyType("apartment");
    setSize("120");
    setBedrooms("2");
    setBathrooms("2");
    setParking("1");
    setCondition("good");
    setPrice("3500000");
    setSelectedPlace({
      description: "27 Leeuwen St, Cape Town City Centre, 8001",
      place_id: "ChIJjQPDkp1YzB0R3FlxtOP9DAI",
      structured_formatting: {
        main_text: "27 Leeuwen St",
        secondary_text: "Cape Town City Centre, 8001",
      },
    });
  };

  // Handle address selection
  const handleAddressSelect = (place) => {
    setSelectedPlace(place);
    setAddress(place.description);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address || !propertyType || !size || !bedrooms || !bathrooms || !parking || !condition || !price) {
      toast({
        title: "Missing Information",
        description:
          "Please fill in all required fields before calculating the risk index.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setRiskResult(calculateRiskIndex());
      setIsLoading(false);
    }, 1500);
  };

  // Handle form reset
  const resetForm = () => {
    setRiskResult(null);
    setCurrentStep(1);
  };

  // Calculate risk index
  const calculateRiskIndex = (): RiskResult => {
    // Mock data for demonstration purposes
    return {
      overallRiskScore: 35,
      totalRiskPoints: 35,
      maxRiskPoints: 100,
      riskRating: "Low",
      riskColor: "#10b981",
      propertyDetails: {
        address: address,
        propertyType: propertyType,
        size: size,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        parking: parking,
        condition: condition,
        price: price,
        municipalValue: "3200000",
        monthlyRates: "3500",
        levy: "2800",
        estimatedMonthlyCosts: "9800",
      },
      riskFactors: {
        securityRisk: {
          score: 15,
          maxScore: 50,
          percentageScore: 30,
          rating: "Low",
          factors: [
            "Gated community with 24/7 security",
            "Biometric access control",
            "CCTV surveillance",
          ],
        },
        environmentalRisk: {
          score: 20,
          maxScore: 50,
          percentageScore: 40,
          rating: "Low",
          factors: [
            "Good air quality",
            "Low noise pollution",
            "No industrial facilities nearby",
          ],
        },
        floodRisk: {
          score: 5,
          maxScore: 50,
          percentageScore: 10,
          rating: "Low",
          factors: [
            "Elevated location",
            "Good drainage system",
            "No history of flooding",
          ],
        },
        climateRisk: {
          score: 15,
          maxScore: 50,
          percentageScore: 30,
          rating: "Low",
          factors: [
            "Moderate temperature variations",
            "Low risk of extreme weather events",
            "Good building insulation",
          ],
        },
        hailRisk: {
          score: 10,
          maxScore: 50,
          percentageScore: 20,
          rating: "Low",
          factors: [
            "Rare hail occurrence in the area",
            "Robust roof construction",
            "Covered parking",
          ],
        },
        marketVolatility: 25,
        locationRisk: 20,
        propertyConditionRisk: 15,
        financialRisk: 30,
        demographicTrends: 45,
        regulatoryRisk: 35,
      },
      projections: {
        shortTerm: "Stable property values with moderate insurance premium increases expected.",
        mediumTerm: "Low to moderate risk of insurance premium increases due to climate change factors.",
        longTerm: "Potential increase in security risks as urban density grows, may affect future premiums.",
        trendDirection: "stable",
      },
      recommendations: [
        "Consider upgrading security features for better insurance rates",
        "Implement water-saving measures to reduce environmental risk",
        "Add flood prevention measures to further reduce premiums",
        "Conduct regular property maintenance to maintain low condition risk rating",
      ],
    };
  };

  // Secret prefill button click handler
  const handleSecretClick = () => {
    setClickCount(clickCount + 1);
    if (clickCount === 2) {
      prefillForm();
      setClickCount(0);
      toast({
        title: "Form Prefilled",
        description: "Example data has been loaded.",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#8884_1px,transparent_1px),linear-gradient(to_bottom,#8884_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        
        {/* Circle animations */}
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
        
        {/* SVG path animations */}
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

      <div className="relative z-10 max-w-screen-xl mx-auto px-4 py-8 w-full">
        {/* Logo and title */}
        <div className="flex items-center mb-8">
          <div className="w-32">
            <img src="/images/Proply Logo 1.png" alt="Proply Logo" className="w-full h-auto" />
          </div>
          <div className="ml-auto">
            {!riskResult && (
              <div className="flex items-center">
                <div className="hidden md:block text-right mr-2">
                  <p className="text-sm text-muted-foreground">Step {currentStep} of 1</p>
                  <h3 className="font-semibold">Property Details</h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
                  <Home className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="relative mb-12">
          {!riskResult ? (
            <form onSubmit={handleSubmit}>
              <Card className="mx-auto mt-2 w-full max-w-[600px] bg-background rounded-lg p-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-xl md:text-2xl">
                    Proply Risk Index™
                  </CardTitle>
                  <CardDescription>
                    Calculate the comprehensive risk profile for your property
                  </CardDescription>
                </CardHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Property Address</Label>
                    <AddressAutocomplete
                      value={address}
                      onChange={setAddress}
                      onSelect={handleAddressSelect}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="type">Property Type</Label>
                      <Select
                        value={propertyType}
                        onValueChange={setPropertyType}
                      >
                        <SelectTrigger id="type" className="mt-1">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="size">Property Size (m²)</Label>
                      <Input
                        id="size"
                        type="number"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        className="mt-1"
                        placeholder="e.g. 120"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Select value={bedrooms} onValueChange={setBedrooms}>
                        <SelectTrigger id="bedrooms" className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5+">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Select value={bathrooms} onValueChange={setBathrooms}>
                        <SelectTrigger id="bathrooms" className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="1.5">1.5</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="2.5">2.5</SelectItem>
                          <SelectItem value="3+">3+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="parking">Parking Spaces</Label>
                      <Select value={parking} onValueChange={setParking}>
                        <SelectTrigger id="parking" className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4+">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="condition">Property Condition</Label>
                    <RadioGroup
                      value={condition}
                      onValueChange={setCondition}
                      className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="poor"
                          id="condition-poor"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="condition-poor"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <AlertTriangle className="mb-1 h-4 w-4" />
                          <span className="text-xs">Poor</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="fair"
                          id="condition-fair"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="condition-fair"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <AlertCircle className="mb-1 h-4 w-4" />
                          <span className="text-xs">Fair</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="good"
                          id="condition-good"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="condition-good"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <CheckCircle2 className="mb-1 h-4 w-4" />
                          <span className="text-xs">Good</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="excellent"
                          id="condition-excellent"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="condition-excellent"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Star className="mb-1 h-4 w-4" />
                          <span className="text-xs">Excellent</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="new"
                          id="condition-new"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="condition-new"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-2 hover:bg-muted hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Building className="mb-1 h-4 w-4" />
                          <span className="text-xs">New</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="price">Purchase Price/Value (ZAR)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1"
                      placeholder="e.g. 3500000"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Calculate Risk Index
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </form>
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

                  {/* Single Results Card */}
                  <Card className="bg-background border-0 shadow-md mt-4">
                    {/* Overall Risk Score with Scale */}
                    <div className="p-6 border-b">
                      <h3 className="text-lg font-semibold text-center mb-4">
                        Overall Risk Score:{" "}
                        <span className={`font-bold ${riskResult.overallRiskScore < 30 ? 'text-green-600' : riskResult.overallRiskScore < 60 ? 'text-orange-500' : 'text-red-600'}`}>
                          {riskResult.totalRiskPoints}/{riskResult.maxRiskPoints} ({riskResult.overallRiskScore}%)
                        </span>{" "}
                        - {riskResult.riskRating} Risk Property
                      </h3>
                      
                      <div className="relative h-4 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 mb-8">
                        {/* Marker showing current risk level */}
                        <div 
                          className="absolute top-0 w-5 h-5 bg-white rounded-full border-2 border-gray-600 transform -translate-x-1/2"
                          style={{ 
                            left: `${riskResult.overallRiskScore}%`,
                            top: '-2px' 
                          }}
                        />
                        
                        {/* Risk labels underneath */}
                        <div className="absolute -bottom-6 left-0 text-sm font-medium">
                          Low Risk
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-medium">
                          Medium Risk
                        </div>
                        <div className="absolute -bottom-6 right-0 text-sm font-medium">
                          High Risk
                        </div>
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="border-b">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Home className="mr-2 h-5 w-5" />
                            <h3 className="text-lg font-semibold">Property Details</h3>
                          </div>
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
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
                      </div>
                    </div>

                    {/* Risk Factors Section */}
                    <div className="border-b">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <AlertCircle className="mr-2 h-5 w-5" />
                            <h3 className="text-lg font-semibold">Risk Factors</h3>
                          </div>
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-6">
                          Individual risk elements that contribute to the overall risk score
                        </p>
                        
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
                      </div>
                    </div>

                    {/* Projections Section */}
                    <div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <TrendingUp className="mr-2 h-5 w-5" />
                            <h3 className="text-lg font-semibold">Market Projections</h3>
                          </div>
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-6">
                          Expected trends and performance insights
                        </p>
                        
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
                                ? "Stable outlook with minimal fluctuations"
                                : "Downward trend expected, caution advised"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Back Button and Download */}
                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={resetForm}
                      className="flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Form
                    </Button>
                    <Button className="flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Secret button in corner for prefilling form */}
      <div
        className="fixed bottom-4 right-4 w-4 h-4 cursor-pointer"
        onClick={handleSecretClick}
      ></div>

      {/* Footer */}
      <footer className="relative mt-auto py-6 text-center text-sm text-muted-foreground">
        <p>© 2025 Proply - All Rights Reserved</p>
      </footer>
    </div>
  );
}