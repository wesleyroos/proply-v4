"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CreditCard,
  Wallet,
  Loader2,
  Info,
  Lock,
  Download,
  Clock,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AreaRateProgressDialog } from "@/components/AreaRateProgressDialog";

export default function DealScorePublicPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
    depositPercentage: "10", // Default to 10%
    interestRate: "11",
    loanTerm: "20",
  });

  // Auto-calculate deposit when purchase price changes
  useEffect(() => {
    if (formData.purchasePrice) {
      const price = Number(parseFormattedNumber(formData.purchasePrice));
      const depositAmount = (price * 0.1).toString(); // 10% of purchase price
      setFormData((prev) => ({
        ...prev,
        depositAmount,
      }));
    }
  }, [formData.purchasePrice]);

  const [result, setResult] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [demoClicks, setDemoClicks] = useState(0);
  const [areaRateStatus, setAreaRateStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [showAreaRateDialog, setShowAreaRateDialog] = useState(false);
  const [areaRateError, setAreaRateError] = useState<string>();
  const [reportUnlocked, setReportUnlocked] = useState(false);

  const fillDemoData = () => {
    setDemoClicks((prev) => {
      if (prev === 2) {
        setFormData({
          address: "27 Leeuwen St, Cape Town City Centre, 8001",
          purchasePrice: "3500000",
          size: "85",
          areaRate: "45000",
          bedrooms: "2",
          propertyCondition: "excellent",
          nightlyRate: "2500",
          occupancy: "70",
          longTermRental: "25000",
          depositAmount: "350000",
          depositPercentage: "10",
          interestRate: "11.75",
          loanTerm: "20",
        });
        return 0;
      }
      return prev + 1;
    });
  };

  useEffect(() => {
    const fetchPrimeRate = async () => {
      try {
        const response = await fetch("/api/prime-rate");
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          interestRate: data.primeRate.toString(),
        }));
      } catch (error) {
        console.error("Failed to fetch prime rate:", error);
      }
    };

    fetchPrimeRate();
  }, []);

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
      field === "areaRate" ||
      field === "nightlyRate" ||
      field === "occupancy" ||
      field === "longTermRental" ||
      field === "depositAmount" ||
      field === "loanTerm"
    ) {
      numericValue = parseFormattedNumber(value);
      numericValue = numericValue.replace(/[^0-9.]/g, "");
      const formattedValue = formatWithThousandSeparators(numericValue);
      if (field !== "occupancy") {
        value = formattedValue;
      }
    }

    if (field === "depositAmount") {
      const purchasePrice = Number(
        parseFormattedNumber(formData.purchasePrice),
      );
      if (purchasePrice > 0) {
        const numericDeposit = Number(parseFormattedNumber(numericValue));
        const percentage = (numericDeposit / purchasePrice) * 100;
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          depositPercentage: percentage.toFixed(2),
        }));
        return;
      }
    }

    if (field === "depositPercentage") {
      const purchasePrice = Number(
        parseFormattedNumber(formData.purchasePrice),
      );
      if (purchasePrice > 0) {
        const percentage = Number(numericValue);
        const amount = (percentage / 100) * purchasePrice;
        const formattedAmount = formatWithThousandSeparators(amount.toFixed(2));
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          depositAmount: formattedAmount,
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsCalculating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    calculateDealScore();
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateDealScore = () => {
    const propertyRate =
      Number(parseFormattedNumber(formData.purchasePrice)) /
      Number(parseFormattedNumber(formData.size));
    const priceDiff =
      ((propertyRate - Number(parseFormattedNumber(formData.areaRate))) /
        Number(parseFormattedNumber(formData.areaRate))) *
      100;

    let shortTermYield = null;
    let longTermYield = null;
    const purchasePrice = Number(parseFormattedNumber(formData.purchasePrice));

    if (formData.longTermRental) {
      const monthlyRental = Number(
        parseFormattedNumber(formData.longTermRental),
      );
      longTermYield = ((monthlyRental * 12) / purchasePrice) * 100;
    }

    if (formData.nightlyRate && formData.occupancy) {
      const annualRevenue =
        Number(parseFormattedNumber(formData.nightlyRate)) *
        365 *
        (Number(formData.occupancy) / 100);
      shortTermYield = (annualRevenue / purchasePrice) * 100;
    }

    let score = 50;
    score -= priceDiff * 0.5;

    switch (formData.propertyCondition) {
      case "excellent":
        score += 10;
        break;
      case "good":
        score += 5;
        break;
      case "fair":
        score -= 5;
        break;
      case "poor":
        score -= 10;
        break;
    }

    if (shortTermYield !== null) {
      if (shortTermYield >= 18) {
        score += 15;
      } else if (shortTermYield >= 12) {
        score += 10;
      } else if (shortTermYield >= 8) {
        score += 5;
      }
    }

    if (longTermYield !== null) {
      if (longTermYield >= 8) {
        score += 10;
      } else if (longTermYield >= 6) {
        score += 5;
      }
    }

    score = Math.max(0, Math.min(100, score));

    let rating: string;
    let color: string;

    if (score >= 90) {
      rating = "Excellent";
      color = "bg-emerald-500";
    } else if (score >= 75) {
      rating = "Great";
      color = "bg-green-500";
    } else if (score >= 60) {
      rating = "Good";
      color = "bg-blue-500";
    } else if (score >= 40) {
      rating = "Average";
      color = "bg-yellow-500";
    } else if (score >= 25) {
      rating = "Poor";
      color = "bg-orange-500";
    } else {
      rating = "Bad";
      color = "bg-red-500";
    }

    const estimatedValue =
      Number(parseFormattedNumber(formData.areaRate)) *
      Number(parseFormattedNumber(formData.size));

    setResult({
      score: Math.round(score),
      rating,
      color,
      percentageDifference:
        ((estimatedValue - purchasePrice) / purchasePrice) * 100,
      askingPrice: purchasePrice,
      estimatedValue,
      propertyRate,
      areaRate: Number(parseFormattedNumber(formData.areaRate)),
      propertyCondition: formData.propertyCondition,
      shortTermYield,
      longTermYield,
      bestStrategy:
        shortTermYield > (longTermYield || 0) ? "Short-Term" : "Long-Term",
    });
    setShowResult(true);
    setIsCalculating(false);
  };

  const handlePayment = async () => {
    setProcessingPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setProcessingPayment(false);
    setShowPaymentModal(false);
    setReportUnlocked(true);
    toast({
      title: "Success",
      description: "Payment successful! Your report is now unlocked.",
    });
  };

  const resetForm = () => {
    setCurrentStep(1);
  };

  const handleNewCalculation = () => {
    setShowResult(false);
    setCurrentStep(1);
    setReportUnlocked(false);
    setResult(null);
  };

  const handleDownloadReport = () => {
    toast({
      title: "Coming Soon",
      description: "PDF download functionality will be available soon!",
    });
  };

  const getMissingFields = (step: number): string[] => {
    const missingFields: string[] = [];

    const isFieldEmpty = (field: string): boolean => {
      if (!formData[field as keyof typeof formData]) return true;
      const value = formData[field as keyof typeof formData].toString();
      const numericValue = value.replace(/,/g, "");
      return numericValue === "" || numericValue === "0";
    };

    switch (step) {
      case 1:
        if (!formData.address) missingFields.push("Property Address");
        if (isFieldEmpty("purchasePrice")) missingFields.push("Purchase Price");
        if (isFieldEmpty("size")) missingFields.push("Size");
        if (isFieldEmpty("areaRate")) missingFields.push("Area Rate");
        if (isFieldEmpty("bedrooms")) missingFields.push("Bedrooms");
        break;
      case 2:
        if (isFieldEmpty("nightlyRate")) missingFields.push("Nightly Rate");
        if (isFieldEmpty("occupancy")) missingFields.push("Occupancy Rate");
        if (isFieldEmpty("longTermRental"))
          missingFields.push("Long Term Rental");
        break;
      case 3:
        if (isFieldEmpty("depositAmount")) missingFields.push("Deposit Amount");
        if (isFieldEmpty("depositPercentage"))
          missingFields.push("Deposit Percentage");
        if (isFieldEmpty("interestRate")) missingFields.push("Interest Rate");
        if (isFieldEmpty("loanTerm")) missingFields.push("Loan Term");
        break;
    }

    return missingFields;
  };

  const isStepComplete = (step: number): boolean => {
    return getMissingFields(step).length === 0;
  };

  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
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
                onChange={(e) =>
                  handleInputChange("purchasePrice", e.target.value)
                }
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
              <div className="flex justify-between items-center">
                <Label htmlFor="areaRate">Area Rate (R/m²)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchAreaRate}
                  disabled={!formData.address || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    "Fetch Area Rate"
                  )}
                </Button>
              </div>
              <Input
                id="areaRate"
                type="text"
                inputMode="numeric"
                value={formData.areaRate}
                onChange={(e) => handleInputChange("areaRate", e.target.value)}
                placeholder="Area rate will be fetched automatically"
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
          </div>
        );

      case 2:
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nightlyRate">Nightly Rate (R)</Label>
                <Input
                  id="nightlyRate"
                  type="text"
                  inputMode="numeric"
                  value={formData.nightlyRate}
                  onChange={(e) =>
                    handleInputChange("nightlyRate", e.target.value)
                  }
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
                  value={formData.occupancy}
                  onChange={(e) =>
                    handleInputChange("occupancy", e.target.value)
                  }
                  placeholder="Enter expected occupancy rate"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longTermRental">
                  Long Term Rental (R/month)
                </Label>
                <Input
                  id="longTermRental"
                  type="text"
                  inputMode="numeric"
                  value={formData.longTermRental}
                  onChange={(e) =>
                    handleInputChange("longTermRental", e.target.value)
                  }
                  placeholder="Enter long term rental amount"
                  required
                />
              </div>
            </div>
          </>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="depositAmount">Deposit Amount (R)</Label>
                <Input
                  id="depositAmount"
                  type="text"
                  inputMode="numeric"
                  value={formData.depositAmount}
                  onChange={(e) =>
                    handleInputChange("depositAmount", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleInputChange("depositPercentage", e.target.value)
                  }
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
                onChange={(e) =>
                  handleInputChange("interestRate", e.target.value)
                }
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
        );

      default:
        return null;
    }
  };

  const renderStepCounter = () => (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex items-center ${step < 3 ? "flex-1" : ""}`}
            onClick={() => setCurrentStep(step)}
            style={{ cursor: "pointer" }}
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
        <span className={currentStep === 1 ? "text-primary" : ""}>
          Property
        </span>
        <span className={currentStep === 2 ? "text-primary" : ""}>Rental</span>
        <span className={currentStep === 3 ? "text-primary" : ""}>
          Financing
        </span>
      </div>
    </div>
  );

  const fetchAreaRate = async () => {
    try {
      setAreaRateStatus("loading");
      setShowAreaRateDialog(true);
      setIsLoading(true);

      const response = await fetch("/api/deal-advisor/area-rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: formData.address,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch area rate");
      }

      const data = await response.json();

      await new Promise((resolve) => setTimeout(resolve, 4000));

      setFormData((prev) => ({
        ...prev,
        areaRate: data.areaRate.toString(),
      }));

      setAreaRateStatus("success");
      toast({
        title: "Success",
        description: "Area rate fetched successfully",
      });
    } catch (error) {
      setAreaRateStatus("error");
      setAreaRateError(
        error instanceof Error ? error.message : "Failed to fetch area rate",
      );
      toast({
        title: "Error",
        description: "Failed to fetch area rate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setShowAreaRateDialog(false);
      }, 2000);
    }
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
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#8884_1px,transparent_1px),linear-gradient(to_bottom,#8884_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        <div className="circle-animation absolute -top-[150px] -left-[150px] w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl"></div>
        <div className="circle-animation animation-delay-1000 absolute top-[20%] -right-[100px] w-[200px] h-[200px] rounded-full bg-blue-400/10 blur-3xl"></div>
        <div className="circle-animation animation-delay-2000 absolute -bottom-[150px] left-[20%] w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl"></div>

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

        <div className="absolute top-[15%] left-[10%] w-16 h-16 border-2 border-primary/20 rounded-lg rotate-12 animate-float"></div>
        <div className="absolute bottom-[20%] right-[15%] w-20 h-20 border-2 border-primary/20 rounded-full animate-float animation-delay-1000"></div>
        <div className="absolute top-[60%] right-[25%] w-12 h-12 border-2 border-primary/20 rotate-45 animate-float animation-delay-2000"></div>

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

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center pt-8">
        <div className="container flex flex-col items-center px-4 py-8 text-center md:py-16 lg:py-24">
          <div className="mx-auto max-w-[800px] space-y-4">
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
              Proply Deal Score™
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
              Enter the property details below to get an instant deal score
              based on market data, area rates, and rental yields.
            </p>
          </div>

          <div className="mx-auto mt-12 w-full max-w-[500px] relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>

            <Card className="relative bg-background rounded-lg p-6">
              <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center">
                  Proply Deal Score™
                </h1>

                <button
                  type="button"
                  onClick={fillDemoData}
                  className="fixed bottom-4 right-4 opacity-0"
                >
                  Fill Demo Data
                </button>

                {!showResult ? (
                  <form onSubmit={handleSubmit}>
                    {renderStepCounter()}
                    {renderFormStep()}

                    <div className="flex justify-between mt-6">
                      {currentStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevStep}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className={currentStep === 1 ? "ml-auto" : ""}
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
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold mb-2">
                        Deal Score: {result?.score}%
                      </h2>

                      <div className="flex justify-between items-center mt-4 px-4">
                        <div className="text-sm">Asking Price:</div>
                        <div className="font-bold">
                          R{result?.askingPrice?.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-2 px-4">
                        <div className="text-sm">Estimated Market Value:</div>
                        <div className="font-bold">
                          R{result?.estimatedValue?.toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm text-center mt-2">
                        This property is{" "}
                        <span
                          className={`font-bold ${
                            result?.askingPrice > result?.estimatedValue
                              ? "text-amber-500"
                              : "text-green-500"
                          }`}
                        >
                          {Math.abs(result?.percentageDifference || 0).toFixed(1)}%
                        </span>{" "}
                        {result?.askingPrice > result?.estimatedValue
                          ? "above"
                          : "below"}{" "}
                        the estimated market value
                      </p>
                      </div>

                      <div className="mt-4">
                        <div
                          className={`inline-block px-4 py-1 rounded-full text-white ${result?.color}`}
                        >
                          {result?.rating} DEAL
                        </div>
                      </div>

                      <div className="relative h-4 mt-6 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full">
                        <div
                          className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-300 rounded-full transform -translate-x-1/2"
                          style={{ left: `${result?.score}%` }}
                        />
                        <div className="absolute -bottom-6 left-0 text-xs">
                          Poor
                        </div>
                        <div className="absolute -bottom-6 left-1/4 text-xs">
                          Average
                        </div>
                        <div className="absolute -bottom-6 left-1/2 text-xs transform -translate-x-1/2">
                          Good
                        </div>
                        <div className="absolute -bottom-6 left-3/4 text-xs">
                          Great
                        </div>
                        <div className="absolute -bottom-6 right-0 text-xs">
                          Excellent
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed Analysis Section */}
                    <div className="relative mt-8">
                      <div
                        className={`space-y-6 ${!reportUnlocked ? "blur-sm select-none pointer-events-none" : ""}`}
                      >
                        {/* Deal Factors Section */}
                        <div className="mt-4">
                          <Accordion
                                                        type="single"
                            collapsible
                            className="w-full"
                            defaultValue="deal-factors"
                          >
                            <AccordionItem value="deal-factors">
                              <AccordionTrigger className="text-xl font-semibold">
                                Key Deal Factors
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-4 pt-2">
                                  <div className="flex justify-between">
                                    <span>Price per m²:</span>{" "}
                                    <span className="font-medium">
                                      R
                                      {Math.round(
                                        result?.propertyRate || 0,
                                      ).toLocaleString()}
                                      /m²
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Area average:</span>
                                    <span className="font-medium">
                                      R
                                      {Math.round(
                                        result?.areaRate || 0,
                                      ).toLocaleString()}
                                      /m²
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Property condition:</span>
                                    <span className="font-medium capitalize">
                                      {result?.propertyCondition}
                                    </span>
                                  </div>
                                  {result?.shortTermYield !== null && (
                                    <div className="flex justify-between">
                                      <span>Short-Term Yield:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {result?.shortTermYield?.toFixed(1)}%
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 text-xs rounded ${
                                            result?.shortTermYield >= 12
                                              ? "bg-green-100 text-green-800"
                                              : result?.shortTermYield >= 8
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {result?.shortTermYield >= 12
                                            ? "EXCELLENT"
                                            : result?.shortTermYield >= 8
                                              ? "GOOD"
                                              : "POOR"}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {result?.longTermYield !== null && (
                                    <div className="flex justify-between">
                                      <span>Long-Term Yield:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                          {result?.longTermYield?.toFixed(1)}%
                                        </span>
                                        <span
                                          className={`px-2 py-0.5 text-xs rounded ${
                                            result?.longTermYield >= 8
                                              ? "bg-green-100 text-green-800"
                                              : result?.longTermYield >= 6
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {result?.longTermYield >= 8
                                            ? "EXCELLENT"
                                            : result?.longTermYield >= 6
                                              ? "GOOD"
                                              : "POOR"}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span>Best Investment Strategy:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {result?.bestStrategy}
                                      </span>
                                      <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800">
                                        RECOMMENDED
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>

                        {reportUnlocked && (
                          <div className="mt-6 flex justify-center">
                            <Button
                              size="lg"
                              onClick={() => handleDownloadReport()}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Full Report
                            </Button>
                          </div>
                        )}
                      </div>

                      {!reportUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-background/80 to-background/95 backdrop-blur-sm rounded-lg p-8">
                          <div className="bg-background/95 rounded-xl p-8 shadow-lg border border-border/10 max-w-md mx-auto text-center">
                            <Lock className="w-12 h-12 text-primary mb-6 mx-auto" />
                            <h3 className="text-2xl font-semibold mb-3">
                              Unlock Full Report
                            </h3>
                            <p className="text-muted-foreground mb-6 text-center max-w-sm mx-auto">
                              Get access to the complete property analysis and
                              investment insights
                            </p>
                            <Button
                              onClick={() => setShowPaymentModal(true)}
                              size="lg"
                              className="w-full"
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Unlock Full Report for R49
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button variant="outline" onClick={handleNewCalculation}>
                        New Calculation
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        <div className="flex justify-center my-4">
          <ChevronDown className="text-[#1BA3FF] h-16 w-16 animate-bounce" />
        </div>
        <div className="py-16 space-y-24">
          <section className="container px-4">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Stop The Guessing Game
                <br />Make The Right Offer, The First Time
              </h2>
              <p className="text-xl text-muted-foreground">
                Property buyers like you face these challenges every day.
                We've built the solution you've been looking for.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="bg-card rounded-lg p-6 shadow-sm border border-border/50 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Hours Wasted on Research
                </h3>
                <p className="text-muted-foreground">
                  You spend countless hours researching properties, comparing
                  prices, and trying to determine if a deal is worth pursuing.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border border-border/50 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Uncertain ROI Calculations
                </h3>
                <p className="text-muted-foreground">
                  Without accurate data, you're left guessing about potential
                  returns, rental yields, and whether the asking price is fair.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 shadow-sm border border-border/50 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Missing Great Opportunities
                </h3>
                <p className="text-muted-foreground">
                  Analysis paralysis means you might miss out on properties with
                  excellent potential while others snap them up.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-muted/30 py-16">
            <div className="container px-4">
              <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Make Confident Investment Decisions in Minutes
                </h2>
                <p className="text-xl text-muted-foreground">
                  Our Deal Score™ gives you the clarity you need to act quickly
                  and confidently.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        Instant Property Analysis
                      </h3>
                      <p className="text-muted-foreground">
                        Get a comprehensive deal score in seconds, not days.
                        Know immediately if a property is worth pursuing.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        Data-Driven Insights
                      </h3>
                      <p className="text-muted-foreground">
                        Make decisions based on real market data, not hunches.
                        Compare properties against area averages and historical
                        trends.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        Financing Clarity
                      </h3>
                      <p className="text-muted-foreground">
                        Understand exactly what a property will cost you monthly
                        and what returns you can expect, both short and long
                        term.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-lg overflow-hidden shadow-lg w-1/2 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-lg blur opacity-75"></div>
                  <div className="relative bg-transparent rounded-lg overflow-hidden">
                    <img
                      src="images/Deal Score Promo Image.png"
                      alt="Property analysis form"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-primary/5 py-16 border-y">
            <div className="container px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    R2.8B+
                  </div>
                  <p className="text-muted-foreground">
                    Property Value Analyzed
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    12,500+
                  </div>
                  <p className="text-muted-foreground">Investors Helped</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    18.5%
                  </div>
                  <p className="text-muted-foreground">
                    Average ROI Improvement
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    9.2/10
                  </div>
                  <p className="text-muted-foreground">Investor Satisfaction</p>
                </div>
              </div>
            </div>
          </section>

          <section className="container px-4">
            <div className="max-w-4xl mx-auto bg-card rounded-lg p-8 md:p-12 shadow-lg border border-border/50 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to Make Smarter Property Investments?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of successful investors who are finding better
                deals, maximizing returns, and building wealth through property.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8">
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8">
                  See How It Works
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unlock Full Report</DialogTitle>
            <DialogDescription>
              Access the complete property analysis including market insights,
              investment potential, and detailed recommendations.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-16px font-medium">Report Price:</span>
              <span className="text-xl font-bold">R49</span>
            </div>

            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="card"
                  id="card"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="card"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <CreditCard className="mb-3 h-6 w-6" />
                  Card
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="instant-eft"
                  id="instant-eft"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="instant-eft"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Wallet className="mb-3 h-6 w-6" />
                  Instant EFT
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              onClick={handlePayment}
              disabled={processingPayment}
              className="w-full"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay R49`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AreaRateProgressDialog
        open={showAreaRateDialog}
        onOpenChange={setShowAreaRateDialog}
        status={areaRateStatus}
        error={areaRateError}
      />
    </div>
  );
}