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

import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { findCostFromTable, transferCostsTable, bondCostsTable } from "@/lib/costTables";
import { DealAssessment } from "@/components/DealAssessment";

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
  const [isCalculating, setIsCalculating] = useState(false);
  const [dealScore, setDealScore] = useState<number | null>(null); // Added state for deal score


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
      purchasePrice: formatWithThousandSeparators("3500000"),
      size: formatWithThousandSeparators("85"),
      areaRate: formatWithThousandSeparators("45000"),
      bedrooms: "2",
      nightlyRate: formatWithThousandSeparators("2500"),
      occupancy: "70", // Don't format percentage
      longTermRental: formatWithThousandSeparators("25000"),
      propertyCondition: "excellent",
      depositAmount: formatWithThousandSeparators("350000"),
      depositPercentage: "10", // Don't format percentage
      interestRate: "11", // Don't format percentage
      loanTerm: formatWithThousandSeparators("20"),
    });
  };

  // Format number with thousand separators for display
  const formatWithThousandSeparators = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');

    // If empty, return empty string
    if (!numericValue) return '';

    // Split by decimal point
    const parts = numericValue.split('.');

    // Format the integer part with thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Return the formatted string, with decimal part if it exists
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
  };

  // Parse formatted number to remove separators for calculations
  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, '');
  };

  const handleInputChange = (field: string, value: string) => {
    // Store the actual numeric value (without formatting)
    let numericValue = value;

    if (field === "bedrooms") {
      // Convert text input to appropriate values
      if (value.toLowerCase() === "studio") {
        numericValue = "0";
      } else if (value.toLowerCase() === "room") {
        numericValue = "-1";
      } else {
        // Replace comma with period for decimal values
        numericValue = value.replace(/,/g, "");
        // Only allow numbers and one decimal point
        numericValue = numericValue.replace(/[^0-9.-]/g, "");
        // Ensure only one decimal point
        const decimalCount = (numericValue.match(/\./g) || []).length;
        if (decimalCount > 1) {
          numericValue = numericValue.slice(0, numericValue.lastIndexOf("."));
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
      // Remove existing formatting first
      numericValue = parseFormattedNumber(value);
      // Only allow numbers and decimal point
      numericValue = numericValue.replace(/[^0-9.]/g, "");

      // Format with thousand separators for display in the input field
      const formattedValue = formatWithThousandSeparators(numericValue);

      // For these fields, we'll store the formatted value in the form
      if (field !== "occupancy") { // Don't add separators to occupancy percentage
        value = formattedValue;
      }
    }

    // Handle deposit calculations
    if (field === "depositAmount") {
      const purchasePrice = Number(parseFormattedNumber(formData.purchasePrice));
      if (purchasePrice > 0) {
        const numericDeposit = Number(parseFormattedNumber(numericValue));
        const percentage = (numericDeposit / purchasePrice) * 100;
        setFormData(prev => ({
          ...prev,
          [field]: value,
          depositPercentage: percentage.toFixed(2)
        }));
        return;
      }
    }

    if (field === "depositPercentage") {
      const purchasePrice = Number(parseFormattedNumber(formData.purchasePrice));
      if (purchasePrice > 0) {
        const percentage = Number(numericValue);
        const amount = (percentage / 100) * purchasePrice;
        const formattedAmount = formatWithThousandSeparators(amount.toFixed(2));
        setFormData(prev => ({
          ...prev,
          [field]: value,
          depositAmount: formattedAmount
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

    // Parse formatted values to get numeric values for calculations
    const parseValue = (value: string) => {
      if (!value) return 0;
      // Remove all non-numeric characters except decimal point
      return Number(value.toString().replace(/[^\d.]/g, ''));
    };

    // Short term calculations
    const daysInMonth = 30;
    const purchasePrice = parseValue(formData.purchasePrice);
    const nightlyRate = parseValue(formData.nightlyRate);
    const occupancy = parseValue(formData.occupancy);

    const shortTermMonthly = nightlyRate * daysInMonth * (occupancy / 100);
    const shortTermYearly = shortTermMonthly * 12;
    const shortTermYield = purchasePrice > 0 ? (shortTermYearly / purchasePrice) * 100 : 0;

    // Long term calculations
    const longTermMonthly = parseValue(formData.longTermRental);
    const longTermYearly = longTermMonthly * 12;
    const longTermYield = purchasePrice > 0 ? (longTermYearly / purchasePrice) * 100 : 0;

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

    // Always check for required fields before proceeding, regardless of current step
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

    // Before calculating, check ALL required fields from all steps
    const allMissingFields = [
      ...getMissingFields(1),
      ...getMissingFields(2),
      ...getMissingFields(3)
    ];

    if (allMissingFields.length > 0) {
      toast({
        title: "Missing information",
        description: `Please fill in: ${allMissingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }


    setIsCalculating(true);
    setTimeout(() => {
      setSubmittedData(formData);
      setShowResults(true);
      setIsCalculating(false);
      // Calculate deal score using the existing formData instead of creating a new FormData object
      setDealScore(calculateDealScore(formData));
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

  // Parse formatted values for calculations
  const parseFormattedValue = (value: string) => {
    if (!value) return 0;
    // Remove all non-numeric characters except decimal point
    return Number(value.toString().replace(/[^\d.]/g, ''));
  };

  // Calculate results only from submitted data
  const marketPrice = submittedData
    ? parseFormattedValue(submittedData.size) * parseFormattedValue(submittedData.areaRate)
    : 0;
  const priceDiff = submittedData && marketPrice > 0
    ? ((parseFormattedValue(submittedData.purchasePrice) - marketPrice) / marketPrice) * 100
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

  /**
   * Handles navigation when a step indicator is clicked
   * This function allows users to navigate directly to any step
   * by clicking on the step indicator in the UI
   * 
   * @param step - The step number to navigate to (1-based index)
   */
  const handleStepClick = (step: number) => {
    // Allow unconditional navigation between steps
    setCurrentStep(step);
  };

  /**
   * Determines if a particular step has all required fields completed
   * Used to display completion indicators in the step navigation UI
   * 
   * @param step - The step number to check for completion
   * @returns boolean indicating if all required fields for the given step are filled
   */
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

    // Check if a field has a valid value (handles formatted values with commas)
    const isFieldEmpty = (field: string): boolean => {
      if (!formData[field as keyof typeof formData]) return true;
      const value = formData[field as keyof typeof formData].toString();
      const numericValue = value.replace(/,/g, '');
      return numericValue === '' || numericValue === '0';
    };

    switch (step) {
      case 1: // Property Details
        if (!formData.address) missingFields.push("Property Address");
        if (isFieldEmpty("purchasePrice")) missingFields.push("Purchase Price");
        if (isFieldEmpty("size")) missingFields.push("Size");
        if (isFieldEmpty("areaRate")) missingFields.push("Area Rate");
        if (isFieldEmpty("bedrooms")) missingFields.push("Bedrooms");
        break;
      case 2: // Rental Details
        if (isFieldEmpty("nightlyRate")) missingFields.push("Nightly Rate");
        if (isFieldEmpty("occupancy")) missingFields.push("Occupancy Rate");
        if (isFieldEmpty("longTermRental")) missingFields.push("Long Term Rental");
        break;
      case 3: // Financing Details
        if (isFieldEmpty("depositAmount")) missingFields.push("Deposit Amount");
        if (isFieldEmpty("depositPercentage")) missingFields.push("Deposit Percentage");
        if (isFieldEmpty("interestRate")) missingFields.push("Interest Rate");
        if (isFieldEmpty("loanTerm")) missingFields.push("Loan Term");
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

  const calculateMonthlyPayment = (loanAmount: number, annualRate: number, years: number) => {
    const monthlyRate = annualRate / 12 / 100;
    const numberOfPayments = years * 12;
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                   (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return Math.round(payment);
  };

  const calculateTransferDuty = (purchasePrice: number) => {
    // Using the official SARS transfer duty rates
    if (purchasePrice <= 1000000) return 0;
    if (purchasePrice <= 1375000) return (purchasePrice - 1000000) * 0.03;
    if (purchasePrice <= 1925000) return 11250 + (purchasePrice - 1375000) * 0.06;
    if (purchasePrice <= 2475000) return 44250 + (purchasePrice - 1925000) * 0.08;
    if (purchasePrice <= 11000000) return 88250 + (purchasePrice - 2475000) * 0.11;
    return 1026000 + (purchasePrice - 11000000) * 0.13;
  };

  const calculateTransferCosts = (purchasePrice: number, includeVat = true, includeTransferDuty = true) => {
    // Look up costs from the transfer costs table
    // Make sure we're passing the parameters in the correct order
    const costs = findCostFromTable(purchasePrice, transferCostsTable);

    if (!costs) {
      // Fallback to simplified estimation if price is outside the table range
      const estimatedTransferFee = purchasePrice * 0.025; // Approx. 2.5% for transfer fees
      const estimatedDisbursements = purchasePrice * 0.01; // Approx. 1% for disbursements
      const estimatedDeeds = purchasePrice * 0.005; // Approx. 0.5% for deeds fees
      const transferDutyAmount = includeTransferDuty ? calculateTransferDuty(purchasePrice) : 0;

      return estimatedTransferFee + estimatedDisbursements + estimatedDeeds + transferDutyAmount;
    }

    // Use values from the table
    let totalCost = costs.transferFee + costs.disbursements + costs.deedsFee;

    // Add VAT if needed
    if (includeVat) {
      totalCost += costs.vat;
    }

    // Add transfer duty if needed
    if (includeTransferDuty) {
      totalCost += costs.transferDuty > 0 ? costs.transferDuty : calculateTransferDuty(purchasePrice);
    }

    return totalCost;
  };

  const calculateAffordabilityMetrics = (formData: typeof submittedData) => {
    if (!formData) return null;

    //    // Parse formatted values to getnumeric values for calculations
    const parseValue = (value: string) => {
            if (!value) return 0;
      // Remove all non-numeric characters except decimal point
      return Number(value.toString().replace(/[^\d.]/g, ''));
    };

    const purchasePrice = parseValue(formData.purchasePrice);
    const depositAmount = parseValue(formData.depositAmount);
    const interestRate = parseValue(formData.interestRate);
    const loanTerm = parseValue(formData.loanTerm);
    const depositPercentageValue = parseValue(formData.depositPercentage);

    const loanAmount = purchasePrice - depositAmount;
    const monthlyPayment = depositPercentageValue === 100 ? 0 : calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
    const transferDuty = calculateTransferDuty(purchasePrice);
    const transferCosts = calculateTransferCosts(purchasePrice, true, true) - transferDuty; // Exclude duty from costs as we track it separately
    const totalCashNeeded = depositAmount + transferDuty + transferCosts;

    // Monthly payments with different rates
    const paymentWithLowerRate = depositPercentageValue === 100 ? 0 : calculateMonthlyPayment(loanAmount, interestRate - 1, loanTerm);
    const paymentWithHigherRate = depositPercentageValue === 100 ? 0 : calculateMonthlyPayment(loanAmount, interestRate + 1, loanTerm);

    // Different deposit scenarios
    const depositScenarios = {
      twenty: calculateMonthlyPayment(purchasePrice * 0.8, interestRate, loanTerm),
      ten: calculateMonthlyPayment(purchasePrice * 0.9, interestRate, loanTerm),
      five: calculateMonthlyPayment(purchasePrice * 0.95, interestRate, loanTerm),
    };

    // Estimated levies and rates (simplified calculation)
    const leviesAndRates = Math.round(purchasePrice * 0.001); // Approximately 0.1% of property value monthly

    // Required monthly income (using 30% debt-to-income ratio)
    const requiredIncome = Math.round((monthlyPayment + leviesAndRates) / 0.3);

    // Calculate bond registration costs from the bond costs table
    // If deposit is 100% (cash payment), there's no bond so the cost is 0
    const bondAmount = purchasePrice - depositAmount;
    const bondRegistrationCosts = depositPercentageValue === 100
      ? 0
      : findCostFromTable(bondAmount, bondCostsTable)?.total || Math.round(bondAmount * 0.005);

    //Combine transfer costs
    const combinedTransferCosts = transferCosts + transferDuty;

    return {
      upfrontCosts: {
        deposit: depositAmount,
        combinedTransferCosts,
        bondRegistrationCosts,
        totalCashNeeded,
      },
      monthlyPayments: {
        bondPayment: monthlyPayment,
        lowerRatePayment: paymentWithLowerRate,
        higherRatePayment: paymentWithHigherRate,
        leviesAndRates,
        totalMonthlyCost: monthlyPayment + leviesAndRates,
      },
      depositScenarios,
      requiredIncome,
    };
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(value);
  };

  // Helper function to calculate deal score for the advisor
  const calculateDealScore = (formData: any) => {
    // Get necessary values
    // Check if formData is a FormData object or a plain object and handle accordingly
    const isFormDataObject = formData instanceof FormData;
    
    const purchasePrice = isFormDataObject 
      ? parseFormattedValue(formData.get("purchasePrice")!) 
      : parseFormattedValue(formData.purchasePrice);
      
    const size = isFormDataObject 
      ? parseFormattedValue(formData.get("size")!) 
      : parseFormattedValue(formData.size);
      
    const areaRate = isFormDataObject 
      ? parseFormattedValue(formData.get("areaRate")!) 
      : parseFormattedValue(formData.areaRate);
      
    const marketPrice = size * areaRate;
    const priceDiff = ((purchasePrice - marketPrice) / marketPrice) * 100;
    
    const propertyCondition = isFormDataObject 
      ? formData.get("propertyCondition")! 
      : formData.propertyCondition;
      
    const squareMeters = size;
    const propertyRate = purchasePrice / squareMeters;
    
    const rentalData = isFormDataObject 
      ? calculateRentalMetrics(Object.fromEntries(formData)) 
      : calculateRentalMetrics(formData);

    // Price Factor: 0-100 based on price difference
    let priceScore = 0;
    if (priceDiff <= -15) priceScore = 100; // Great deal
    else if (priceDiff <= -10) priceScore = 90;
    else if (priceDiff <= -5) priceScore = 80;
    else if (priceDiff <= 0) priceScore = 70;
    else if (priceDiff <= 5) priceScore = 60;
    else if (priceDiff <= 10) priceScore = 50;
    else if (priceDiff <= 15) priceScore = 40;
    else if (priceDiff <= 20) priceScore = 30;
    else priceScore = 20;

    // Condition Factor: 0-100
    const conditionScore = 
      propertyCondition === "excellent" ? 100 :
      propertyCondition === "good" ? 80 :
      propertyCondition === "fair" ? 60 :
      40; // poor

    // Area Rate vs Property Rate: 0-100
    let rateScore = 0;
    const rateDiff = ((propertyRate - areaRate) / areaRate) * 100;

    if (rateDiff <= -15) rateScore = 100;
    else if (rateDiff <= -10) rateScore = 90;
    else if (rateDiff <= -5) rateScore = 80;
    else if (rateDiff <= 0) rateScore = 70;
    else if (rateDiff <= 5) rateScore = 60;
    else if (rateDiff <= 10) rateScore = 50;
    else if (rateDiff <= 15) rateScore = 40;
    else rateScore = 30;

    // Yield Factor: 0-100 based on rental yields
    let yieldScore = 0;
    const yield_val = rentalData.isShortTermRecommended ? rentalData.shortTerm.yield : rentalData.longTerm.yield;

    if (yield_val >= 12) yieldScore = 100;
    else if (yield_val >= 10) yieldScore = 90;
    else if (yield_val >= 8) yieldScore = 80;
    else if (yield_val >= 7) yieldScore = 70;
    else if (yield_val >= 6) yieldScore = 60;
    else if (yield_val >= 5) yieldScore = 50;
    else if (yield_val >= 4) yieldScore = 40;
    else yieldScore = 30;

    // Calculate final score (weighted average)
    const finalScore = Math.round(
      (priceScore * 0.35) + // Price difference is important
      (conditionScore * 0.15) + // Condition affects maintenance costs
      (rateScore * 0.2) + // Rate comparison is good for value
      (yieldScore * 0.3) // Yield is critical for investment returns
    );

    return finalScore;
  };

  // Common result processing function
  const calculatePriceDiff = (formData: FormData) => {
    const purchasePrice = parseFormattedValue(formData.get("purchasePrice")!);
    const marketPrice = parseFormattedValue(formData.get("size")!) * parseFormattedValue(formData.get("areaRate")!);
    return ((purchasePrice - marketPrice) / marketPrice) * 100;
  };

  return (
    <PageTransition>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Deal Score</h1>
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
          {showResults && (
            <div className="flex-1">
              <Tabs defaultValue="deal-score" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="deal-score">Deal Score</TabsTrigger>
                  <TabsTrigger value="price">Price</TabsTrigger>
                  <TabsTrigger value="rental">Rental</TabsTrigger>
                  <TabsTrigger value="affordability">Affordability</TabsTrigger>
                  <TabsTrigger value="buyer-profile">Buyer Profile</TabsTrigger>
                </TabsList>
                <TabsContent value="deal-score">
                  <Card>
                    <CardHeader>
                      <CardTitle>Deal Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Using the new DealAssessment component */}
                      <DealAssessment
                        purchasePrice={parseFormattedValue(submittedData.purchasePrice)}
                        marketPrice={marketPrice}
                        priceDiff={priceDiff}
                        rentalData={calculateRentalMetrics(submittedData)}
                        propertyCondition={submittedData.propertyCondition}
                        areaRate={parseFormattedValue(submittedData.areaRate)}
                        propertyRate={parseFormattedValue(submittedData.purchasePrice) / parseFormattedValue(submittedData.size)}
                        dealScore={dealScore} // Pass deal score to DealAssessment
                      />
                    </CardContent>
                  </Card>
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
                            {parseFormattedValue(
                              submittedData.purchasePrice
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
                                parseFormattedValue(submittedData.purchasePrice) /
                                parseFormattedValue(submittedData.size),
                              ).toLocaleString()
                            : "0"}
                          /m²
                        </div>
                        <div className="text-muted-foreground">
                          (vs. area avg R
                          {submittedData
                            ? parseFormattedValue(submittedData.areaRate).toLocaleString()
                            : "0"}
                          /m²)
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={
                              submittedData &&
                              parseFormattedValue(submittedData.purchasePrice) /
                                parseFormattedValue(submittedData.size) <=
                                parseFormattedValue(submittedData.areaRate)
                                ? "text-green-500"
                                : "text-amber-500"
                            }
                          >
                            {submittedData &&
                            parseFormattedValue(submittedData.purchasePrice) /
                              parseFormattedValue(submittedData.size) <=
                              parseFormattedValue(submittedData.areaRate)
                              ? "-"
                              : "+"}
                            R
                            {submittedData
                              ? Math.abs(
                                  Math.round(
                                    parseFormattedValue(submittedData.purchasePrice) /
                                      parseFormattedValue(submittedData.size) -
                                      parseFormattedValue(submittedData.areaRate),
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
                            {priceDiff <= 0 ? "UnderPaying" : "Over Paying"}
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
                    <Card>
                      <CardHeader>
                        <CardTitle>Rental Potential</CardTitle>
                      </CardHeader>
                      <CardContent>
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
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="affordability" className="space-y-4">
                  {submittedData && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Affordability Cheat Sheet</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const metrics = calculateAffordabilityMetrics(submittedData);
                          if (!metrics) return null;

                          // Calculate total cash needed based on the costs
                          const totalCashNeeded = metrics.upfrontCosts.deposit + metrics.upfrontCosts.combinedTransferCosts + metrics.upfrontCosts.bondRegistrationCosts;

                          return (
                            <div className="grid grid-cols-2 gap-4">
                              {/* Upfront Costs */}
                              <div className="border rounded-lg bg-white p-4">
                                <h3 className="font-semibold text-lg mb-4">Upfront Costs</h3>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Deposit ({submittedData.depositPercentage}%):</span>
                                    <span className="font-medium">
                                      R{Math.round(metrics.upfrontCosts.deposit).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Transfer costs:</span>
                                    <span className="font-medium">
                                      R{Math.round(metrics.upfrontCosts.combinedTransferCosts).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Bond registration costs:</span>
                                    <span className="font-medium">
                                      R{Math.round(metrics.upfrontCosts.bondRegistrationCosts).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t">
                                    <span>Total cash needed:</span>
                                    <span className="font-medium">
                                      R{Math.round(totalCashNeeded).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Monthly Payments */}
                              <div className="border rounded-lg bg-white p-4">
                                <h3 className="font-semibold text-lg mb-4">Monthly Payments</h3>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Bond payment:</span>
                                    <span className="font-medium">
                                      R{metrics.monthlyPayments.bondPayment.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>If rates drop 1%:</span>
                                    <span className="font-medium text-emerald-600">
                                      R{metrics.monthlyPayments.lowerRatePayment.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Levies/rates:</span>
                                    <span className="font-medium">
                                      R{metrics.monthlyPayments.leviesAndRates.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t">
                                    <span>Total monthly cost:</span>
                                    <span className="font-medium">
                                      R{metrics.monthlyPayments.totalMonthlyCost.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Income Requirements */}
                              <div className="border rounded-lg bg-gray-50 p-4">
                                <h3 className="font-semibold text-lg mb-2">Income Requirements</h3>
                                <div>
                                  <div className="flex justify-between items-baseline">
                                    <span>Required household income:</span>
                                    <span className="font-bold text-xl">
                                      R{metrics.requiredIncome.toLocaleString()}/month
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Based on 30% debt-to-income ratio
                                  </p>
                                </div>
                              </div>

                              {/* Different Deposit Options */}
                              <div className="border rounded-lg bg-white p-4">
                                <h3 className="font-semibold text-lg mb-4">Different Deposit Options</h3>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>20% deposit:</span>
                                    <span className="font-medium">
                                      R{metrics.depositScenarios.twenty.toLocaleString()}/month
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>10% deposit:</span>
                                    <span className="font-medium">
                                      R{metrics.depositScenarios.ten.toLocaleString()}/month
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>5% deposit:</span>
                                    <span className="font-medium">
                                      R{metrics.depositScenarios.five.toLocaleString()}/month
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Rate Changes */}
                              <div className="border rounded-lg bg-white p-4">
                                <h3 className="font-semibold text-lg mb-4">Rate Changes</h3>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Current rate:</span>
                                    <span className="font-medium">
                                      R{metrics.monthlyPayments.bondPayment.toLocaleString()}/month
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>If rates drop 1%:</span>
                                    <span className="font-medium text-emerald-600">
                                      R{metrics.monthlyPayments.lowerRatePayment.toLocaleString()}/month
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>If rates rise 1%:</span>
                                    <span className="font-medium text-red-600">
                                      R{metrics.monthlyPayments.higherRatePayment.toLocaleString()}/month
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="buyer-profile">
                  <div className="text-center py-8 text-muted-foreground">
                    Buyer profile analysis coming soon
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
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
      </div>
    </PageTransition>
  );
}