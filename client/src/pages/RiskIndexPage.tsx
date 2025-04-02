"use client";

import { useState, useRef } from "react";
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
  X,
  ChevronLeft,
  Download,
  Printer,
  Share,
} from "lucide-react";
import AddressAutocomplete from "../components/AddressAutocomplete";
import RiskIndexReport from "../components/RiskIndexReport";
import { RiskIndexReport as RiskIndexReportType, RiskFactor, RiskCategory } from "../types/riskIndex";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";

export default function RiskIndexPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [demoClicks, setDemoClicks] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [riskReport, setRiskReport] = useState<RiskIndexReportType | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
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

  // Helper functions to create properly typed objects
  const createRiskFactor = (
    name: string,
    score: number,
    description: string,
    impact: "low" | "medium" | "high",
    trend: "improving" | "stable" | "worsening"
  ): RiskFactor => {
    return {
      name,
      score,
      description,
      impact,
      trend
    };
  };

  // Generate mock risk report based on form data
  const generateRiskReport = (): RiskIndexReportType => {
    // Parse numeric values
    const purchasePrice = Number(parseFormattedNumber(formData.purchasePrice));
    const propertySize = Number(parseFormattedNumber(formData.size));
    
    // Calculate base risk score (mock calculation)
    const propertyConditionScores = {
      excellent: 85,
      good: 70,
      fair: 50,
      poor: 30,
    };

    // Base overall risk score is influenced by property condition
    const baseRiskScore = propertyConditionScores[formData.propertyCondition as keyof typeof propertyConditionScores];
    
    // Slight variations based on property type
    const propertyTypeInfluence = {
      apartment: 5,
      house: 0,
      townhouse: 2,
      villa: -2,
      commercial: -10,
    };
    
    // Calculate overall risk score (higher is better, lower risk)
    let overallRiskScore = baseRiskScore + propertyTypeInfluence[formData.propertyType as keyof typeof propertyTypeInfluence];
    
    // Ensure score is within bounds
    overallRiskScore = Math.max(0, Math.min(100, overallRiskScore));
    
    // Determine risk rating and color
    let riskRating;
    let riskColor;
    
    if (overallRiskScore >= 80) {
      riskRating = "LOW RISK";
      riskColor = "bg-green-500";
    } else if (overallRiskScore >= 60) {
      riskRating = "LOW-MODERATE RISK";
      riskColor = "bg-blue-500";
    } else if (overallRiskScore >= 40) {
      riskRating = "MODERATE RISK";
      riskColor = "bg-yellow-500";
    } else if (overallRiskScore >= 20) {
      riskRating = "MODERATE-HIGH RISK";
      riskColor = "bg-orange-500";
    } else {
      riskRating = "HIGH RISK";
      riskColor = "bg-red-500";
    }
    
    // Calculate price per square meter
    const pricePerSqM = Math.round(purchasePrice / propertySize);
    
    // Create mock estimated market value (slightly different from purchase price)
    const valuationVariance = ((Math.random() * 20) - 10) / 100; // Random variance between -10% and +10%
    const estimatedMarketValue = Math.round(purchasePrice * (1 + valuationVariance));
    
    // Calculate valuation deviation
    const valuationDeviation = ((purchasePrice - estimatedMarketValue) / estimatedMarketValue) * 100;
    
    // Generate market risk factors
    const marketVolatility = Math.round(Math.random() * 15);
    const demandTrend = Math.random() > 0.5 ? "increasing" : Math.random() > 0.3 ? "stable" : "decreasing";
    const supplyTrend = Math.random() > 0.5 ? "increasing" : Math.random() > 0.3 ? "stable" : "decreasing";
    
    // Create risk categories with factors
    const riskCategories: RiskCategory[] = [
      {
        name: "Financial Risk",
        score: Math.round(overallRiskScore * 0.9 + Math.random() * 10),
        description: "Assessment of the financial aspects of this investment including price, financing, and potential returns.",
        factors: [
          {
            name: "Price to Value",
            score: 50 + (valuationDeviation < 0 ? Math.abs(valuationDeviation) * 5 : -valuationDeviation * 5),
            description: `This property is ${Math.abs(valuationDeviation).toFixed(1)}% ${valuationDeviation < 0 ? "below" : "above"} the estimated market value.`,
            impact: valuationDeviation < -5 ? "low" as const : valuationDeviation > 5 ? "high" as const : "medium" as const,
            trend: "stable" as const
          },
          {
            name: "Monthly Financing Costs",
            score: 65,
            description: "Estimated monthly mortgage payments are within reasonable range for properties of this type.",
            impact: "medium",
            trend: "stable"
          },
          {
            name: "Return on Investment",
            score: 70,
            description: "Based on local rental yields and property appreciation in this area.",
            impact: "medium",
            trend: "improving"
          }
        ]
      },
      {
        name: "Property Risk",
        score: Math.round(propertyConditionScores[formData.propertyCondition as keyof typeof propertyConditionScores]),
        description: "Evaluation of physical property characteristics, condition, and maintenance requirements.",
        factors: [
          {
            name: "Property Condition",
            score: propertyConditionScores[formData.propertyCondition as keyof typeof propertyConditionScores],
            description: `Property is in ${formData.propertyCondition} condition with ${formData.propertyCondition === "excellent" || formData.propertyCondition === "good" ? "minimal" : "some"} maintenance requirements.`,
            impact: formData.propertyCondition === "excellent" || formData.propertyCondition === "good" ? "low" : "high",
            trend: "stable"
          },
          {
            name: "Property Features",
            score: 75,
            description: `${formData.bedrooms || "0"} bedroom, ${formData.bathrooms || "0"} bathroom ${formData.propertyType} with ${formData.parking || "0"} parking spaces.`,
            impact: "low",
            trend: "stable"
          },
          {
            name: "Property Age & Structure",
            score: formData.propertyCondition === "excellent" ? 80 : formData.propertyCondition === "good" ? 65 : 40,
            description: "Based on typical properties in this area and the reported condition.",
            impact: "medium",
            trend: formData.propertyCondition === "poor" ? "worsening" : "stable"
          }
        ]
      },
      {
        name: "Market Risk",
        score: Math.max(20, Math.min(95, 100 - marketVolatility * 5)),
        description: "Analysis of the local property market, trends, and economic indicators.",
        factors: [
          {
            name: "Market Volatility",
            score: 100 - marketVolatility * 5,
            description: `The property market in this area shows ${marketVolatility > 10 ? "high" : marketVolatility > 5 ? "moderate" : "low"} volatility.`,
            impact: marketVolatility > 10 ? "high" : marketVolatility > 5 ? "medium" : "low",
            trend: marketVolatility > 10 ? "worsening" : "stable"
          },
          {
            name: "Supply/Demand Balance",
            score: demandTrend === "increasing" ? 85 : demandTrend === "stable" ? 60 : 30,
            description: `Demand is ${demandTrend} while supply is ${supplyTrend} in this area.`,
            impact: demandTrend === "decreasing" && supplyTrend === "increasing" ? "high" : "medium",
            trend: demandTrend === "increasing" ? "improving" : demandTrend === "stable" ? "stable" : "worsening"
          },
          {
            name: "Economic Outlook",
            score: 55,
            description: "The local economy shows moderate strength with average employment and income growth.",
            impact: "medium",
            trend: "stable"
          }
        ]
      }
    ];

    // Generate risk mitigation strategies based on the lowest scoring risk category
    const lowestCategory = [...riskCategories].sort((a, b) => a.score - b.score)[0];
    let riskMitigationStrategies: string[] = [];
    
    if (lowestCategory.name === "Financial Risk") {
      riskMitigationStrategies = [
        "Consider negotiating the purchase price if above estimated market value",
        "Explore different financing options to reduce monthly costs",
        "Budget for at least 1% of property value annually for maintenance",
        "Diversify your investment portfolio to reduce overall financial risk",
        "Consider property insurance options to protect against unexpected costs"
      ];
    } else if (lowestCategory.name === "Property Risk") {
      riskMitigationStrategies = [
        "Conduct a professional property inspection before purchase",
        "Budget for immediate repairs and maintenance if condition is fair or poor",
        "Consider property improvements that increase value and reduce long-term risk",
        "Review building materials and structure for long-term durability",
        "Assess potential renovation costs against potential value increase"
      ];
    } else {
      riskMitigationStrategies = [
        "Research local market trends and development plans in the area",
        "Consider longer holding periods to ride out market fluctuations",
        "Research upcoming infrastructure or development projects",
        "Monitor local economic indicators that impact property values",
        "Diversify your property portfolio across different areas"
      ];
    }

    // Generate investment recommendation
    let investmentRecommendation = "";
    
    if (overallRiskScore >= 80) {
      investmentRecommendation = "This property presents a favorable risk profile. It's well positioned in the market with strong fundamentals and appears to be a sound investment opportunity based on the provided information.";
    } else if (overallRiskScore >= 60) {
      investmentRecommendation = "This property shows a reasonable risk profile with some areas of concern. With proper risk management strategies, it could be a viable investment opportunity for investors with moderate risk tolerance.";
    } else if (overallRiskScore >= 40) {
      investmentRecommendation = "This property presents a moderate risk profile. Careful consideration of the identified risk factors is recommended before proceeding with this investment. Consider negotiating terms to improve the risk-return profile.";
    } else if (overallRiskScore >= 20) {
      investmentRecommendation = "This property shows elevated risk levels in several key areas. Proceed with caution and consider whether the potential returns justify the identified risks. Additional due diligence is strongly recommended.";
    } else {
      investmentRecommendation = "This property demonstrates a high-risk profile. Significant caution is advised, and it may be prudent to explore alternative investment opportunities with more favorable risk characteristics.";
    }

    return {
      // Property Details
      address: formData.address,
      propertyValue: purchasePrice,
      propertySize: propertySize,
      bedrooms: formData.bedrooms || "N/A",
      bathrooms: formData.bathrooms || "N/A",
      parking: formData.parking || "N/A",
      propertyCondition: formData.propertyCondition,
      propertyType: formData.propertyType,
      
      // Risk Assessment
      overallRiskScore: Math.round(overallRiskScore),
      riskRating: riskRating,
      riskColor: riskColor,
      riskCategories: riskCategories,
      
      // Financial Risk
      pricePerSqM: pricePerSqM,
      estimatedMarketValue: estimatedMarketValue,
      valuationDeviation: valuationDeviation,
      
      // Market Risk
      marketVolatility: marketVolatility,
      demandTrend: demandTrend as any,
      supplyTrend: supplyTrend as any,
      
      // Recommendations
      riskMitigationStrategies: riskMitigationStrategies,
      investmentRecommendation: investmentRecommendation,
      
      // Report Metadata
      reportDate: new Date().toLocaleDateString('en-ZA', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      })
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
    
    // Simulate calculation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Generate risk report
    const report = generateRiskReport();
    setRiskReport(report);
    
    setIsLoading(false);
    setShowReport(true);
    
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

        {/* Risk Report Drawer */}
        <Drawer open={showReport} onOpenChange={setShowReport}>
          <DrawerContent className="max-h-[85vh] overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Risk Index Report</h2>
                <DrawerClose>
                  <Button variant="ghost" size="icon">
                    <X className="w-4 h-4" />
                  </Button>
                </DrawerClose>
              </div>
              
              {/* Controls */}
              <div className="flex justify-between items-center mb-6">
                <Button variant="outline" size="sm" onClick={() => setShowReport(false)}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Form
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
              
              {/* Report */}
              {riskReport && (
                <div className="mt-4">
                  <RiskIndexReport ref={reportRef} report={riskReport} />
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>

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