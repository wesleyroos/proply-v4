import { useState, useEffect } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Loader2, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProAccess } from "@/hooks/use-pro-access";
import { UpgradeModal } from "@/components/UpgradeModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertyScoreModal } from "@/components/PropertyScoreModal";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RevenueData {
  adr: number;
  occupancy: number;
  percentile: number;
  revpar: number;
  revpam: number;
  leadTime: number;
  stayLength: number;
  activeListings: number;
  seasonalityIndex: number;
  demandScore: number;
  ratePosition: number;
  revparPosition: number;
}

export default function DealScorePage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Property Details (Step 1)
    address: "",
    purchasePrice: "",
    size: "",
    areaRate: "",
    bedrooms: "",
    propertyCondition: "excellent",

    // Rental Details (Step 2)
    nightlyRate: "",
    occupancy: "",
    longTermRental: "",

    // Financing Details (Step 3)
    depositAmount: "",
    depositPercentage: "",
    interestRate: "11.75", // Default to current prime rate
    loanTerm: "20", // Default to 20 years
  });

  // States for revenue data
  const [isLoading, setIsLoading] = useState(false);
  const [showPercentileDialog, setShowPercentileDialog] = useState(false);
  const [revenueData, setRevenueData] = useState<{
    "25": RevenueData;
    "50": RevenueData;
    "75": RevenueData;
    "90": RevenueData;
  } | null>(null);

  const hasProAccess = useProAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<typeof formData | null>(
    null,
  );
  const [showResults, setShowResults] = useState(false);
  const [showPropertyScoreModal, setShowPropertyScoreModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    // Fetch current prime rate when component mounts
    const fetchPrimeRate = async () => {
      try {
        const response = await fetch('/api/prime-rate');
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          interestRate: data.primeRate.toString()
        }));
      } catch (error) {
        console.error('Failed to fetch prime rate:', error);
      }
    };

    fetchPrimeRate();
  }, []);

  // Prefill data handler
  const handlePrefill = () => {
    setFormData({
      address: "27 Leeuwen St, Cape Town City Centre, 8001",
      purchasePrice: "3500000",
      size: "85",
      areaRate: "45000",
      bedrooms: "2",
      nightlyRate: "2500",
      occupancy: "70",
      longTermRental: "25000",
      propertyCondition: "excellent",
      depositAmount: "350000",
      depositPercentage: "10",
      interestRate: "11", // Updated to 11%
      loanTerm: "20",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "bedrooms") {
      // Convert text input to appropriate values
      if (value.toLowerCase() === "studio") {
        value = "0";
      } else if (value.toLowerCase() === "room") {
        value = "-1";
      } else {
        // Replace comma with period for decimal values
        value = value.replace(",", ".");
        // Only allow numbers and one decimal point
        value = value.replace(/[^0-9.-]/g, "");
        // Ensure only one decimal point
        const decimalCount = (value.match(/\./g) || []).length;
        if (decimalCount > 1) {
          value = value.slice(0, value.lastIndexOf("."));
        }
      }
    } else if (
      field === "purchasePrice" ||
      field === "size" ||
      field === "areaRate" ||
      field === "nightlyRate" ||
      field === "occupancy" ||
      field === "longTermRental" ||
      field === "depositAmount" ||
      field === "loanTerm"
    ) {
      value = value.replace(/[^0-9.]/g, "");
    }

    // Handle deposit calculations
    if (field === "depositAmount") {
      const purchasePrice = Number(formData.purchasePrice);
      if (purchasePrice > 0) {
        const percentage = (Number(value) / purchasePrice) * 100;
        setFormData(prev => ({
          ...prev,
          [field]: value,
          depositPercentage: percentage.toFixed(2)
        }));
        return;
      }
    }

    if (field === "depositPercentage") {
      const purchasePrice = Number(formData.purchasePrice);
      if (purchasePrice > 0) {
        const amount = (Number(value) / 100) * purchasePrice;
        setFormData(prev => ({
          ...prev,
          [field]: value,
          depositAmount: amount.toFixed(2)
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateRentalMetrics = (formData: typeof submittedData) => {
    if (!formData) return null;

    // Short term calculations
    const daysInMonth = 30;
    const shortTermMonthly =
      Number(formData.nightlyRate) *
      daysInMonth *
      (Number(formData.occupancy) / 100);
    const shortTermYearly = shortTermMonthly * 12;
    const shortTermYield = (shortTermYearly / Number(formData.purchasePrice)) * 100;

    // Long term calculations
    const longTermMonthly = Number(formData.longTermRental);
    const longTermYearly = longTermMonthly * 12;
    const longTermYield = (longTermYearly / Number(formData.purchasePrice)) * 100;

    return {
      shortTerm: {
        monthly: shortTermMonthly,
        yearly: shortTermYearly,
        yield: shortTermYield,
      },
      longTerm: {
        monthly: longTermMonthly,
        yearly: longTermYearly,
        yield: longTermYield,
      },
      isShortTermRecommended: shortTermYearly > longTermYearly,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Check for required fields based on current step
    const missingFields = getMissingFields(currentStep);
    
    if (missingFields.length > 0) {
      // Show validation error for missing fields
      toast({
        title: "Missing information",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < 3) {
      // Proceed to next step
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsCalculating(true);
    setTimeout(() => {
      setSubmittedData(formData);
      setShowResults(true);
      setIsCalculating(false);
    }, 2000);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const address = formData.address;
      const bedrooms = formData.bedrooms;

      if (!address || !bedrooms) {
        alert("Please enter the property address and number of bedrooms first.");
        return;
      }

      // Convert studio apartments and rooms to API expected values
      let formattedBedrooms: string;
      const bedroomValue = Number(bedrooms);

      if (bedrooms.toLowerCase() === "studio" || bedroomValue === 0) {
        formattedBedrooms = "0";
      } else if (bedrooms.toLowerCase() === "room" || bedroomValue === -1) {
        formattedBedrooms = "-1";
      } else {
        formattedBedrooms = Math.floor(bedroomValue).toString();
      }

      const response = await fetch(
        `/api/revenue-data?address=${encodeURIComponent(
          address,
        )}&bedrooms=${formattedBedrooms}`,
      );

      const data = await response.json();

      if (data.KPIsByBedroomCategory?.[formattedBedrooms]) {
        const result = data.KPIsByBedroomCategory[formattedBedrooms];
        const processedData = {
          "25": {
            adr: result.ADR25PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 25,
            revpar: result.RevPARAvg,
            revpam: result.RevPAMAvg,
            leadTime: result.BookingLeadTimeDays,
            stayLength: result.LengthOfStayDays,
            activeListings: result.ActiveListings,
            seasonalityIndex: result.MonthlySeasonalityIndex,
            demandScore: result.MonthlyDemandScore,
            ratePosition: result.RatePositionPercentile,
            revparPosition: result.RevPARPositionPercentile,
          },
          "50": {
            adr: result.ADR50PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 50,
            revpar: result.RevPARAvg,
            revpam: result.RevPAMAvg,
            leadTime: result.BookingLeadTimeDays,
            stayLength: result.LengthOfStayDays,
            activeListings: result.ActiveListings,
            seasonalityIndex: result.MonthlySeasonalityIndex,
            demandScore: result.MonthlyDemandScore,
            ratePosition: result.RatePositionPercentile,
            revparPosition: result.RevPARPositionPercentile,
          },
          "75": {
            adr: result.ADR75PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 75,
            revpar: result.RevPARAvg,
            revpam: result.RevPAMAvg,
            leadTime: result.BookingLeadTimeDays,
            stayLength: result.LengthOfStayDays,
            activeListings: result.ActiveListings,
            seasonalityIndex: result.MonthlySeasonalityIndex,
            demandScore: result.MonthlyDemandScore,
            ratePosition: result.RatePositionPercentile,
            revparPosition: result.RevPARPositionPercentile,
          },
          "90": {
            adr: result.ADR90PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 90,
            revpar: result.RevPARAvg,
            revpam: result.RevPAMAvg,
            leadTime: result.BookingLeadTimeDays,
            stayLength: result.LengthOfStayDays,
            activeListings: result.ActiveListings,
            seasonalityIndex: result.MonthlySeasonalityIndex,
            demandScore: result.MonthlyDemandScore,
            ratePosition: result.RatePositionPercentile,
            revparPosition: result.RevPARPositionPercentile,
          },
        };
        setRevenueData(processedData);
        setShowPercentileDialog(true);
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      alert("Failed to fetch revenue data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyPercentileData = (percentile: "25" | "50" | "75" | "90") => {
    if (!revenueData) return;

    const data = revenueData[percentile];
    setFormData((prev) => ({
      ...prev,
      nightlyRate: data.adr.toString(),
      occupancy: data.occupancy.toString(),
    }));
    setShowPercentileDialog(false);
  };

  // Calculate results only from submitted data
  const marketPrice = submittedData
    ? Number(submittedData.size) * Number(submittedData.areaRate)
    : 0;
  const priceDiff = submittedData
    ? ((Number(submittedData.purchasePrice) - marketPrice) / marketPrice) * 100
    : 0;

  const getConditionDetails = (condition: string) => {
    switch (condition) {
      case "excellent":
        return {
          description: "(minimal repairs needed)",
          badge: "MOVE-IN READY",
          badgeColor: "text-emerald-500",
        };
      case "good":
        return {
          description: "(some repairs needed)",
          badge: "MINOR WORK",
          badgeColor: "text-blue-500",
        };
      case "fair":
        return {
          description: "(significant repairs needed)",
          badge: "NEEDS WORK",
          badgeColor: "text-amber-500",
        };
      case "poor":
        return {
          description: "(major repairs needed)",
          badge: "MAJOR WORK",
          badgeColor: "text-red-500",
        };
      default:
        return {
          description: "",
          badge: "",
          badgeColor: "",
        };
    }
  };

  // Render form steps
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter property address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price (R)</Label>
                <Input
                  id="purchasePrice"
                  type="text"
                  inputMode="numeric"
                  value={formData.purchasePrice}
                  onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                  placeholder="Enter purchase price"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size (m²)</Label>
                <Input
                  id="size"
                  type="text"
                  inputMode="numeric"
                  value={formData.size}
                  onChange={(e) => handleInputChange("size", e.target.value)}
                  placeholder="Enter property size"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaRate">Area Rate (R/m²)</Label>
                <Input
                  id="areaRate"
                  type="text"
                  inputMode="numeric"
                  value={formData.areaRate}
                  onChange={(e) => handleInputChange("areaRate", e.target.value)}
                  placeholder="Enter area rate per square meter"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="text"
                  inputMode="numeric"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                  placeholder="Enter number of bedrooms"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyCondition">Property Condition</Label>
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
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nightlyRate">Nightly Rate (R)</Label>
                  <Input
                    id="nightlyRate"
                    type="text"
                    inputMode="numeric"
                    value={formData.nightlyRate}
                    onChange={(e) => handleInputChange("nightlyRate", e.target.value)}
                    placeholder="Enter nightly rate"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupancy">Occupancy (%)</Label>
                  <Input
                    id="occupancy"
                    type="text"
                    inputMode="numeric"
                    min="0"
                    max="100"
                    value={formData.occupancy}
                    onChange={(e) => handleInputChange("occupancy", e.target.value)}
                    placeholder="Enter expected occupancy rate"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Market Data</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10"
                    onClick={() => {
                      if (hasProAccess.hasAccess) {
                        fetchRevenueData();
                      } else {
                        setShowUpgradeModal(true);
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting Data...
                      </>
                    ) : (
                      <>
                        Get Revenue
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                          PRO
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="longTermRental">Long Term Rental (R/month)</Label>
              <Input
                id="longTermRental"
                type="text"
                inputMode="numeric"
                value={formData.longTermRental}
                onChange={(e) => handleInputChange("longTermRental", e.target.value)}
                placeholder="Enter long term rental amount"
                required
              />
            </div>
          </>
        );

      case 3:
        return (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount (R)</Label>
                  <Input
                    id="depositAmount"
                    type="text"
                    inputMode="numeric"
                    value={formData.depositAmount}
                    onChange={(e) => handleInputChange("depositAmount", e.target.value)}
                    placeholder="Enter deposit amount"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositPercentage">Deposit (%)</Label>
                  <Input
                    id="depositPercentage"
                    type="text"
                    inputMode="numeric"
                    value={formData.depositPercentage}
                    onChange={(e) => handleInputChange("depositPercentage", e.target.value)}
                    placeholder="Enter deposit percentage"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="text"
                  inputMode="numeric"
                  value={formData.interestRate}
                  onChange={(e) => handleInputChange("interestRate", e.target.value)}
                  placeholder="Enter interest rate"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Current prime rate: 11%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loanTerm">Loan Term (years)</Label>
                <Input
                  id="loanTerm"
                  type="text"
                  inputMode="numeric"
                  value={formData.loanTerm}
                  onChange={(e) => handleInputChange("loanTerm", e.target.value)}
                  placeholder="Enter loan term"
                  required
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Handle step click
  const handleStepClick = (step: number) => {
    // Allow unconditional navigation between steps
    setCurrentStep(step);
  };

  // Check if step is complete (all fields filled)
  const isStepComplete = (step: number) => {
    switch (step) {
      case 1: // Property Details
        return formData.address !== "" && 
               formData.purchasePrice !== "" && 
               formData.size !== "" && 
               formData.areaRate !== "" && 
               formData.bedrooms !== "";
      case 2: // Rental Details
        return formData.nightlyRate !== "" && 
               formData.occupancy !== "" && 
               formData.longTermRental !== "";
      case 3: // Financing Details
        return formData.depositAmount !== "" && 
               formData.depositPercentage !== "" && 
               formData.interestRate !== "" && 
               formData.loanTerm !== "";
      default:
        return false;
    }
  };
  
  // Get list of missing field names for validation
  const getMissingFields = (step: number): string[] => {
    const missingFields: string[] = [];
    
    switch (step) {
      case 1: // Property Details
        if (!formData.address) missingFields.push("Property Address");
        if (!formData.purchasePrice) missingFields.push("Purchase Price");
        if (!formData.size) missingFields.push("Size");
        if (!formData.areaRate) missingFields.push("Area Rate");
        if (!formData.bedrooms) missingFields.push("Bedrooms");
        break;
      case 2: // Rental Details
        if (!formData.nightlyRate) missingFields.push("Nightly Rate");
        if (!formData.occupancy) missingFields.push("Occupancy Rate");
        if (!formData.longTermRental) missingFields.push("Long Term Rental");
        break;
      case 3: // Financing Details
        if (!formData.depositAmount) missingFields.push("Deposit Amount");
        if (!formData.depositPercentage) missingFields.push("Deposit Percentage");
        if (!formData.interestRate) missingFields.push("Interest Rate");
        if (!formData.loanTerm) missingFields.push("Loan Term");
        break;
    }
    
    return missingFields;
  };

  // Update the step counter UI to be clickable
  const renderStepCounter = () => (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex items-center ${step < 3 ? "flex-1" : ""}`}
            onClick={() => handleStepClick(step)}
            style={{ cursor: 'pointer' }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                step <= currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
              {isStepComplete(step) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                  ✓
                </div>
              )}
            </div>
            {step < 3 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm">
        <span 
          className={`${currentStep === 1 ? "text-primary" : ""} ${isStepComplete(1) ? "font-medium" : ""}`}
          onClick={() => handleStepClick(1)}
          style={{ cursor: 'pointer' }}
        >
          Property {isStepComplete(1) && "✓"}
        </span>
        <span 
          className={`${currentStep === 2 ? "text-primary" : ""} ${isStepComplete(2) ? "font-medium" : ""}`}
          onClick={() => handleStepClick(2)}
          style={{ cursor: 'pointer' }}
        >
          Rental {isStepComplete(2) && "✓"}
        </span>
        <span 
          className={`${currentStep === 3 ? "text-primary" : ""} ${isStepComplete(3) ? "font-medium" : ""}`}
          onClick={() => handleStepClick(3)}
          style={{ cursor: 'pointer' }}
        >
          Financing {isStepComplete(3) && "✓"}
        </span>
      </div>
    </div>
  );

  return (
    <PageTransition>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Deal Score</h1>
          {hasProAccess.hasAccess && (
            <Button variant="outline" onClick={() => setShowPropertyScoreModal(true)}>
              View Property Score <BarChart3 className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        <div className="flex gap-8">
          {/* Form Section */}
          <div className="w-[600px]">
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 1
                    ? "Property Details"
                    : currentStep === 2
                    ? "Rental Details"
                    : "Financing Details"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderStepCounter()}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {renderFormStep()}

                  <div className="flex justify-between gap-4 mt-6">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevStep}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className={currentStep === 1 ? "w-full" : "flex-1"}
                      disabled={isCalculating}
                    >
                      {isCalculating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : currentStep < 3 ? (
                        <>
                          Next
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        "Calculate Deal Score"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="flex-1">
            {showResults && submittedData && (
              <Tabs defaultValue="deal_score" className="w-full">
                <TabsList className="bg-muted/50 p-0 h-12">
                  <TabsTrigger value="deal_score" className="flex-1 h-12">
                    Deal Score
                  </TabsTrigger>
                  <TabsTrigger value="price" className="flex-1 h-12">
                    Price
                  </TabsTrigger>
                  <TabsTrigger value="rental" className="flex-1 h-12">
                    Rental
                  </TabsTrigger>
                  <TabsTrigger value="affordability" className="flex-1 h-12">
                    Affordability
                  </TabsTrigger>
                  <TabsTrigger value="buyer_profile" className="flex-1 h-12">
                    Buyer Profile
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="deal_score">
                  <div className="text-center py-8 text-muted-foreground">
                    Deal Score analysis coming soon
                  </div>
                </TabsContent>

                <TabsContent value="price" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Price Justification</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-6">
                        <div>
                          <div className="text-sm font-medium">
                            Asking Price
                          </div>
                          <div className="text-3xl font-bold">
                            R
                            {Number(
                              submittedData.purchasePrice,
                            ).toLocaleString()}
                          </div>
                        </div>
                        <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
                        <div>
                          <div className="text-sm font-medium">
                            Market Average
                          </div>
                          <div className="text-3xl font-bold">
                            R{marketPrice.toLocaleString()}
                          </div>
                        </div>
                        <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
                        <div>
                          <div className="text-sm font-medium">Difference</div>
                          <div
                            className={`text-3xl font-bold ${priceDiff > 0 ? "text-amber-500" : "text-green-500"}`}
                          >
                            {priceDiff > 0 ? "+" : ""}
                            {Math.round(priceDiff)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <div className="font-medium">Price per m²</div>
                        <div className="font-bold">
                          R
                          {submittedData
                            ? Math.round(
                                Number(submittedData.purchasePrice) /
                                  Number(submittedData.size),
                              ).toLocaleString()
                            : "0"}
                          /m²
                        </div>
                        <div className="text-muted-foreground">
                          (vs. area avg R
                          {submittedData
                            ? Number(submittedData.areaRate).toLocaleString()
                            : "0"}
                          /m²)
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={
                              submittedData &&
                              Number(submittedData.purchasePrice) /
                                Number(submittedData.size) <=
                                Number(submittedData.areaRate)
                                ? "text-green-500"
                                : "text-amber-500"
                            }
                          >
                            {submittedData &&
                            Number(submittedData.purchasePrice) /
                              Number(submittedData.size) <=
                              Number(submittedData.areaRate)
                              ? "-"
                              : "+"}
                            R
                            {submittedData
                              ? Math.abs(
                                  Math.round(
                                    Number(submittedData.purchasePrice) /
                                      Number(submittedData.size) -
                                      Number(submittedData.areaRate),
                                  ),
                                ).toLocaleString()
                              : "0"}
                            /m²
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              priceDiff <= 0
                                ? "text-green-500"
                                : "text-amber-500"
                            }
                          >
                            {priceDiff <= 0 ? "Under Paying" : "Over Paying"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <div className="font-medium">Property Condition</div>
                        <div className="font-bold capitalize">
                          {submittedData.propertyCondition}
                        </div>
                        <div className="text-muted-foreground">
                          {
                            getConditionDetails(submittedData.propertyCondition)
                              .description
                          }
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              getConditionDetails(
                                submittedData.propertyCondition,
                              ).badgeColor
                            }
                          >
                            {
                              getConditionDetails(
                                submittedData.propertyCondition,
                              ).badge
                            }
                          </Badge>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <div className="font-medium">Recent Area Sales</div>
                        <div className="font-bold">R3.4M - R3.7M</div>
                        <div className="text-muted-foreground">
                          (last 3 months)
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-blue-600">
                            WITHIN RANGE
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Making This a Good Deal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">
                            To make this a good deal, consider:
                          </p>
                          <p className="text-lg font-medium">
                            Make an offer between{" "}
                            <span className="font-bold text-green-600">
                              R{(marketPrice * 0.9).toLocaleString()}
                            </span>{" "}
                            and{" "}
                            <span className="font-bold text-amber-600">
                              R{(marketPrice * 1.1).toLocaleString()}
                            </span>
                          </p>
                        </div>

                        <div className="mt-6">
                          <div className="flex justify-between mb-2">
                            <div className="text-sm font-medium">
                              Deal Rating
                            </div>
                            <div className="text-sm font-medium">
                              {priceDiff <= -5 &&
                              submittedData?.propertyCondition === "excellent"
                                ? "Great"
                                : priceDiff <= 0
                                  ? "Good"
                                  : priceDiff <= 10
                                    ? "Fair"
                                    : "Bad"}
                            </div>
                          </div>
                          <div className="relative">
                            <div className="h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-green-500 to-blue-500" />
                            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                              <span>Bad</span>
                              <span>Fair</span>
                              <span>Good</span>
                              <span>Great</span>
                            </div>
                            <div className="absolute -top-2 w-full">
                              <div
                                className="absolute w-4 h-4 rounded-full border-2 border-white bg-primary shadow-lg transform -translate-x-1/2"
                                style={{
                                  left: `${
                                    priceDiff <= -5 &&
                                    submittedData?.propertyCondition ===
                                      "excellent"
                                      ? 100
                                      : priceDiff <= 0
                                        ? 75
                                        : priceDiff <= 10
                                          ? 50
                                          : 25
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rental">
                  {submittedData && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold">Rental Potential</h2>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Short Term Rental Card */}
                        <div
                          className={`p-6 rounded-lg border bg-card relative ${
                            calculateRentalMetrics(submittedData)
                              ?.isShortTermRecommended
                              ? "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-emerald-500 before:rounded-t-lg"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">
                              Short-Term (Airbnb)
                            </h3>
                            {calculateRentalMetrics(submittedData)
                              ?.isShortTermRecommended && (
                              <span className="px-2 py-1 text-xs bg-emerald-500 text-white rounded">
                                RECOMMENDED
                              </span>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="text-3xl font-bold">
                                R
                                {calculateRentalMetrics(
                                  submittedData,
                                )?.shortTerm.monthly.toLocaleString()}
                                /month
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Based on {formData.occupancy}% occupancy rate
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Annual yield:</span>
                                <span className="font-semibold text-emerald-600">
                                  {calculateRentalMetrics(
                                    submittedData,
                                  )?.shortTerm.yield.toFixed(1)}
                                  %
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Yearly income:</span>
                                <span className="font-semibold">
                                  R
                                  {calculateRentalMetrics(
                                    submittedData,
                                  )?.shortTerm.yearly.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Management fee:</span>
                                <span className="font-semibold">15-20%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Long Term Rental Card */}
                        <div
                          className={`p-6 rounded-lg border bg-card relative ${
                            !calculateRentalMetrics(submittedData)
                              ?.isShortTermRecommended
                              ? "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-emerald-500 before:rounded-t-lg"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-4">
                            <Home className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">
                              Long-Term Rental
                            </h3>
                            {!calculateRentalMetrics(submittedData)
                              ?.isShortTermRecommended && (
                              <span className="px-2 py-1 text-xs bg-emerald-500 text-white rounded">
                                RECOMMENDED
                              </span>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="text-3xl font-bold">
                                R
                                {calculateRentalMetrics(
                                  submittedData,
                                )?.longTerm.monthly.toLocaleString()}
                                /month
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Standard 12-month lease
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Annual yield:</span>
                                <span className="font-semibold text-emerald-600">
                                  {calculateRentalMetrics(
                                    submittedData,
                                  )?.longTerm.yield.toFixed(1)}
                                  %
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Yearly income:</span>
                                <span className="font-semibold">
                                  R
                                  {calculateRentalMetrics(
                                    submittedData,
                                  )?.longTerm.yearly.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Management fee:</span>
                                <span className="font-semibold">8-10%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="affordability">
                  <div className="text-center py-8 text-muted-foreground">
                    Affordability analysis coming soon
                  </div>
                </TabsContent>

                <TabsContent value="buyer_profile">
                  <div className="text-center py-8 text-muted-foreground">
                    Buyer profile analysis coming soon
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        <div
          onClick={(e) => {
            const now = new Date().getTime();
            if (!window.lastClick) window.lastClick = 0;
            if (!window.clickCount) window.clickCount = 0;

            if (now - window.lastClick > 500) {
              window.clickCount = 1;
            } else {
              window.clickCount++;
            }

            window.lastClick = now;

            if (window.clickCount === 3) {
              handlePrefill();
              window.clickCount = 0;
            }
          }}
          className="fixed bottom-4 right-4 w-8 h-8 rounded-full bg-gray-100/20 cursor-default select-none"
          style={{ opacity: 0.1 }}
        />

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
        />

        <Dialog open={showPercentileDialog} onOpenChange={setShowPercentileDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Revenue Data</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select the percentile data you'd like to use for your analysis:
              </p>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Percentile</th>
                    <th className="text-right py-2 px-4">Nightly Rate</th>
                    <th className="text-right py-2 px-4">Occupancy</th>
                    <th className="text-right py-2 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData &&
                    Object.entries(revenueData).map(([percentile, data]) => (
                      <tr key={percentile} className="border-b">
                        <td className="py-2 px-4">{percentile}th Percentile</td>
                        <td className="text-right py-2 px-4">
                          {new Intl.NumberFormat("en-ZA", {
                            style: "currency",
                            currency: "ZAR",
                          }).format(data.adr)}
                        </td>
                        <td className="text-right py-2 px-4">
                          {Math.round(data.occupancy)}%
                        </td>
                        <td className="text-right py-2 px-4">
                          <Button
                            size="sm"
                            onClick={() =>
                              applyPercentileData(
                                percentile as "25" | "50" | "75" | "90",
                              )
                            }
                          >
                            Use This Data
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
        <PropertyScoreModal
          isOpen={showPropertyScoreModal}
          onOpenChange={setShowPropertyScoreModal}
        />
      </div>
    </PageTransition>
  );
}