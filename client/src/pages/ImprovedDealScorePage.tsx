"use client";

import { useState, useEffect, useRef } from "react";
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
  ChevronRight,
  MapPin,
  Home,
  Calendar,
  DollarSign,
  Banknote,
  Percent,
  Building,
  Calculator,
  Star,
  LineChart,
  PieChart,
  BarChart,
  Zap,
  Sparkles,
  ExternalLink,
  Lightbulb,
  Landmark,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { DealScoreReport } from "./DealScoreReportPage";
import { HTMLToPDFButton } from "@/components/pdf/html-to-pdf-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

export default function ImprovedDealScorePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // Form is now a single step
  const [formData, setFormData] = useState({
    // Property Details
    address: "",
    purchasePrice: "",
    size: "",
    areaRate: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    propertyCondition: "excellent",

    // Default values for other fields
    nightlyRate: "",
    occupancy: "",
    longTermRental: "",
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

  interface DealResult {
    score: number;
    rating: string;
    color: string;
    percentageDifference: number;
    askingPrice: number;
    estimatedValue: number;
    propertyRate: number;
    areaRate: number;
    propertyCondition: string;
    shortTermYield: number | null;
    longTermYield: number | null;
    bestStrategy: string;
  }

  const [result, setResult] = useState<DealResult | null>(null);
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
  const [dealReport, setDealReport] = useState<DealScoreReport | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const reportRef = useRef<HTMLDivElement>(null);

  const fillDemoData = () => {
    setDemoClicks((prev) => {
      if (prev === 2) {
        setFormData({
          address: "27 Leeuwen St, Cape Town City Centre, 8001",
          purchasePrice: "3,500,000",
          size: "85",
          areaRate: "45,000",
          bedrooms: "2",
          bathrooms: "2",
          parking: "1",
          propertyCondition: "excellent",
          nightlyRate: "2,500",
          occupancy: "70",
          longTermRental: "25,000",
          depositAmount: "350,000",
          depositPercentage: "10",
          interestRate: "11.75",
          loanTerm: "20",
        });
        return 0;
      }
      return prev + 1;
    });
  };

  // Using default value of 11% for prime rate
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      interestRate: "11",
    }));
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

  const formatPrice = (value: number, decimals = 0): string => {
    return value.toLocaleString("en-ZA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    let numericValue = value;

    if (field === "bedrooms" || field === "bathrooms" || field === "parking") {
      if (value.toLowerCase() === "studio" && field === "bedrooms") {
        numericValue = "0";
      } else if (value.toLowerCase() === "room" && field === "bedrooms") {
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
      const purchasePrice = Number(parseFormattedNumber(formData.purchasePrice));
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
      const purchasePrice = Number(parseFormattedNumber(formData.purchasePrice));
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

  const validateForm = (showErrors = false): string[] => {
    const requiredFields = ["address", "purchasePrice", "size", "areaRate", "bedrooms", "bathrooms", "parking"];
    const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData]);
    
    if (showErrors && missingFields.length > 0) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields to continue.",
        variant: "destructive",
      });
    }
    
    return missingFields;
  };

  const checkRequiredFields = (field: string): boolean => {
    if (!formData[field as keyof typeof formData]) {
      return true;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const missingFields = validateForm(true);
    if (missingFields.length > 0) {
      return;
    }

    setIsCalculating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    calculateDealScore();
  };

  const calculateDealScore = () => {
    // Get property rate
    const propertyRate =
      Number(parseFormattedNumber(formData.purchasePrice)) / Number(parseFormattedNumber(formData.size));
    const priceDiff =
      ((propertyRate - Number(parseFormattedNumber(formData.areaRate))) /
        Number(parseFormattedNumber(formData.areaRate))) *
      100;

    // Set default values for calculations
    const purchasePrice = Number(parseFormattedNumber(formData.purchasePrice));
    const propertySize = Number(parseFormattedNumber(formData.size));
    const bedrooms = Number(parseFormattedNumber(formData.bedrooms));
    const bathrooms = Number(parseFormattedNumber(formData.bathrooms));
    const parking = Number(parseFormattedNumber(formData.parking));

    // Default rental yields (based on property value & area)
    const estimatedLongTermRental = purchasePrice * 0.005; // Estimate 0.5% of purchase price as monthly rental
    const estimatedNightlyRate = purchasePrice / 1000; // Rough estimate

    // Set default values for financing
    const depositPercentage = 10; // 10% deposit
    const depositAmount = purchasePrice * (depositPercentage / 100);
    const interestRate = 11; // 11% interest rate
    const loanTerm = 20; // 20 year loan term
    const loanAmount = purchasePrice - depositAmount;
    const monthlyPayment =
      (loanAmount * (interestRate / 100 / 12) * Math.pow(1 + interestRate / 100 / 12, loanTerm * 12)) /
      (Math.pow(1 + interestRate / 100 / 12, loanTerm * 12) - 1);

    // Calculate yields
    let shortTermYield = null;
    let longTermYield = null;

    // Set occupancy to 65% as a default
    const occupancyRate = 65;

    // Calculate long term yield
    longTermYield = ((estimatedLongTermRental * 12) / purchasePrice) * 100;

    // Calculate short term yield
    const annualRevenueShortTerm = estimatedNightlyRate * 365 * (occupancyRate / 100);
    shortTermYield = (annualRevenueShortTerm / purchasePrice) * 100;

    // Calculate annual rental for long term
    const annualRentalLongTerm = estimatedLongTermRental * 12;

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

    const estimatedValue = Number(parseFormattedNumber(formData.areaRate)) * Number(parseFormattedNumber(formData.size));

    // Estimated monthly costs (simplified)
    const monthlyRates = (purchasePrice * 0.001) / 12; // Rough estimate of rates
    const levy = purchasePrice * 0.0015; // Rough estimate of levy
    const estimatedMonthlyCosts = monthlyRates + levy;

    // Calculate cash flow
    const cashFlowShortTerm = annualRevenueShortTerm / 12 - monthlyPayment - estimatedMonthlyCosts;
    const cashFlowLongTerm = estimatedLongTermRental - monthlyPayment - estimatedMonthlyCosts;

    // Determine best investment strategy
    const bestInvestmentStrategy = shortTermYield > (longTermYield || 0) ? "Short-Term Rental" : "Long-Term Rental";

    // Example comparable properties (dummy data)
    const avgComparableSalesPrice = estimatedValue * 0.98; // Average slightly below the estimated value

    // Report date
    const reportDate = new Date().toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Create the comprehensive report
    const report: DealScoreReport = {
      // Property Details
      address: formData.address,
      askingPrice: purchasePrice,
      propertySize: propertySize,
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      parking: parking,
      propertyCondition: formData.propertyCondition,

      // Deal Score Metrics
      score: Math.round(score),
      rating: rating,
      color: color,
      estimatedValue: estimatedValue,
      percentageDifference: ((estimatedValue - purchasePrice) / purchasePrice) * 100,

      // Area Information
      areaRate: Number(parseFormattedNumber(formData.areaRate)),
      recentSalesRange: `R${Math.round(estimatedValue * 0.9).toLocaleString()} - R${Math.round(
        estimatedValue * 1.1
      ).toLocaleString()}`,

      // Rental Information
      nightlyRate: estimatedNightlyRate,
      occupancyRate: occupancyRate,
      monthlyLongTerm: estimatedLongTermRental,

      // Calculated Financial Metrics
      pricePerSqM: propertyRate,
      shortTermYield: shortTermYield || 0,
      longTermYield: longTermYield || 0,
      bestInvestmentStrategy: bestInvestmentStrategy,

      // Municipal Information
      municipalValue: estimatedValue * 0.9, // Municipal value typically lower than market
      monthlyRates: monthlyRates,
      levy: levy,
      estimatedMonthlyCosts: estimatedMonthlyCosts,

      // Rental Calculations
      monthlyRevenue: estimatedLongTermRental,
      annualRevenueShortTerm: annualRevenueShortTerm,
      annualRentalLongTerm: annualRentalLongTerm,
      vacancyRate: 100 - occupancyRate,
      netAnnualIncome: annualRevenueShortTerm - estimatedMonthlyCosts * 12,

      // Mortgage Calculations
      depositAmount: depositAmount,
      depositPercentage: depositPercentage,
      interestRate: interestRate,
      loanAmount: loanAmount,
      loanTerm: loanTerm,
      monthlyPayment: monthlyPayment,
      cashFlowShortTerm: cashFlowShortTerm,
      cashFlowLongTerm: cashFlowLongTerm,

      // Comparable Properties
      avgComparableSalesPrice: avgComparableSalesPrice,
      comparableProperties: [
        {
          similarity: "Similar",
          address: `${Math.floor(Math.random() * 100)} ${formData.address.split(",")[0].split(" ").pop()}`,
          salePrice: Math.round(estimatedValue * (0.95 + Math.random() * 0.1)),
          size: Math.round(propertySize * (0.9 + Math.random() * 0.2)),
          pricePerSqM: Math.round(propertyRate * (0.95 + Math.random() * 0.1)),
          bedrooms: bedrooms,
          saleDate: new Date(Date.now() - Math.random() * 15552000000).toLocaleDateString("en-ZA"), // Random date in last 6 months
        },
        {
          similarity: "Comparable",
          address: `${Math.floor(Math.random() * 100)} ${formData.address.split(",")[0].split(" ").pop()}`,
          salePrice: Math.round(estimatedValue * (0.9 + Math.random() * 0.2)),
          size: Math.round(propertySize * (0.85 + Math.random() * 0.3)),
          pricePerSqM: Math.round(propertyRate * (0.9 + Math.random() * 0.2)),
          bedrooms: bedrooms + (Math.random() > 0.5 ? 1 : -1),
          saleDate: new Date(Date.now() - Math.random() * 31104000000).toLocaleDateString("en-ZA"), // Random date in last year
        },
      ],

      // Metadata
      reportDate: reportDate,
    };

    // Update both states
    setResult({
      score: Math.round(score),
      rating,
      color,
      percentageDifference: ((estimatedValue - purchasePrice) / purchasePrice) * 100,
      askingPrice: purchasePrice,
      estimatedValue,
      propertyRate,
      areaRate: Number(parseFormattedNumber(formData.areaRate)),
      propertyCondition: formData.propertyCondition,
      shortTermYield,
      longTermYield,
      bestStrategy: bestInvestmentStrategy,
    });

    setDealReport(report);
    setIsCalculating(false);
    setShowResult(true);
  };

  const handleAreaRateSearch = async () => {
    if (!formData.address) {
      toast({
        title: "Address required",
        description: "Please enter a property address to search for area rates.",
        variant: "destructive",
      });
      return;
    }

    setAreaRateStatus("loading");
    setShowAreaRateDialog(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Set the area rate to a valid amount for demo purposes
    setFormData((prev) => ({
      ...prev,
      areaRate: "45,000", // Example area rate
    }));

    setAreaRateStatus("success");
  };

  const handlePaymentProcessing = async () => {
    setProcessingPayment(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setProcessingPayment(false);
    setShowPaymentModal(false);
    setReportUnlocked(true);

    toast({
      title: "Payment Successful",
      description: "Your report has been unlocked.",
      variant: "default",
    });
  };

  const handleNewCalculation = () => {
    setShowResult(false);
    setResult(null);
    setDealReport(null);
    setReportUnlocked(false);
  };

  const renderAreaRateDialog = () => {
    return (
      <Dialog open={showAreaRateDialog} onOpenChange={setShowAreaRateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {areaRateStatus === "error"
                ? "Error Finding Area Rates"
                : areaRateStatus === "success"
                ? "Area Rate Found"
                : "Finding Area Rates..."}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {areaRateStatus === "loading" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-medium">Searching area rates for</p>
                  <p className="text-muted-foreground">{formData.address}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-center text-muted-foreground">This may take a moment...</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress-indeterminate"></div>
                  </div>
                </div>
              </div>
            ) : areaRateStatus === "error" ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <AlertCircle className="h-16 w-16 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium">We couldn't find area rates for this address</p>
                  <p className="text-sm text-muted-foreground">{areaRateError}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium">Area Rate Found!</p>
                  <p className="text-2xl font-bold">R{formatWithThousandSeparators(formData.areaRate)} / m²</p>
                  <p className="text-sm text-muted-foreground">
                    This is the average price per square meter for properties in this area.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant={areaRateStatus === "error" ? "outline" : "default"}
              onClick={() => setShowAreaRateDialog(false)}
            >
              {areaRateStatus === "error" ? "Try Manual Input" : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderStepCounter = () => {
    return (
      <div className="mb-6 text-center mx-auto">
        <div className="flex items-center justify-center">
          <div 
            className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white font-medium"
          >
            1
          </div>
          <div className="h-1 w-20 mx-1 bg-muted"></div>
          <div 
            className="flex items-center justify-center h-12 w-12 rounded-full bg-muted text-muted-foreground font-medium"
            style={{ opacity: 0.5 }}
          >
            2
          </div>
        </div>
        <div className="text-sm mt-2 text-muted-foreground">
          Enter property details to calculate your deal score
        </div>
      </div>
    );
  };

  const renderFormStep = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label 
              htmlFor="address" 
              className="mb-1 block"
              data-error={checkRequiredFields('address')}
            >
              Property Address <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
              <Input
                id="address"
                placeholder="Enter full property address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="pl-9"
                style={{
                  borderColor: checkRequiredFields('address') ? 'var(--destructive)' : undefined,
                }}
              />
            </div>
            {checkRequiredFields('address') && (
              <p className="text-xs text-destructive mt-1">Address is required</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label 
              htmlFor="purchasePrice" 
              className="mb-1 block"
              data-error={checkRequiredFields('purchasePrice')}
            >
              Purchase Price <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <div className="absolute left-2.5 top-2.5 text-muted-foreground/70">R</div>
              <Input
                id="purchasePrice"
                placeholder="0"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                className="pl-7"
                style={{
                  borderColor: checkRequiredFields('purchasePrice') ? 'var(--destructive)' : undefined,
                }}
              />
            </div>
            {checkRequiredFields('purchasePrice') && (
              <p className="text-xs text-destructive mt-1">Purchase price is required</p>
            )}
          </div>
          <div>
            <Label 
              htmlFor="size"
              className="mb-1 block"
              data-error={checkRequiredFields('size')}
            >
              Property Size (m²) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="size"
                placeholder="0"
                value={formData.size}
                onChange={(e) => handleInputChange("size", e.target.value)}
                style={{
                  borderColor: checkRequiredFields('size') ? 'var(--destructive)' : undefined,
                }}
              />
              <div className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">m²</div>
            </div>
            {checkRequiredFields('size') && (
              <p className="text-xs text-destructive mt-1">Property size is required</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label
              htmlFor="bedrooms"
              className="mb-1 block"
              data-error={checkRequiredFields('bedrooms')}
            >
              Bedrooms <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bedrooms"
              placeholder="0"
              value={formData.bedrooms}
              onChange={(e) => handleInputChange("bedrooms", e.target.value)}
              style={{
                borderColor: checkRequiredFields('bedrooms') ? 'var(--destructive)' : undefined,
              }}
            />
            {checkRequiredFields('bedrooms') && (
              <p className="text-xs text-destructive mt-1">Required</p>
            )}
          </div>
          <div>
            <Label
              htmlFor="bathrooms"
              className="mb-1 block"
              data-error={checkRequiredFields('bathrooms')}
            >
              Bathrooms <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bathrooms"
              placeholder="0"
              value={formData.bathrooms}
              onChange={(e) => handleInputChange("bathrooms", e.target.value)}
              style={{
                borderColor: checkRequiredFields('bathrooms') ? 'var(--destructive)' : undefined,
              }}
            />
            {checkRequiredFields('bathrooms') && (
              <p className="text-xs text-destructive mt-1">Required</p>
            )}
          </div>
          <div>
            <Label
              htmlFor="parking"
              className="mb-1 block"
              data-error={checkRequiredFields('parking')}
            >
              Parking <span className="text-destructive">*</span>
            </Label>
            <Input
              id="parking"
              placeholder="0"
              value={formData.parking}
              onChange={(e) => handleInputChange("parking", e.target.value)}
              style={{
                borderColor: checkRequiredFields('parking') ? 'var(--destructive)' : undefined,
              }}
            />
            {checkRequiredFields('parking') && (
              <p className="text-xs text-destructive mt-1">Required</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label 
                htmlFor="areaRate" 
                className="block"
                data-error={checkRequiredFields('areaRate')}
              >
                Area Rate (R/m²) <span className="text-destructive">*</span>
              </Label>
              <Button variant="link" size="sm" className="px-0 h-6" onClick={handleAreaRateSearch}>
                Find Area Rate
              </Button>
            </div>
            <div className="relative">
              <div className="absolute left-2.5 top-2.5 text-muted-foreground/70">R</div>
              <Input
                id="areaRate"
                placeholder="0"
                value={formData.areaRate}
                onChange={(e) => handleInputChange("areaRate", e.target.value)}
                className="pl-7"
                style={{
                  borderColor: checkRequiredFields('areaRate') ? 'var(--destructive)' : undefined,
                }}
              />
              <div className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">/m²</div>
            </div>
            {checkRequiredFields('areaRate') && (
              <p className="text-xs text-destructive mt-1">Area rate is required</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Average price per square meter in the area
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderComprehensiveReport = () => {
    if (!dealReport) return null;

    return (
      <div id="deal-score-report" className="space-y-8" ref={reportRef}>
        <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-bold">{dealReport.address}</h2>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {dealReport.bedrooms} Beds
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {dealReport.bathrooms} Baths
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {dealReport.propertySize} m²
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {dealReport.parking} Parking
                </Badge>
              </div>
            </div>
            
            <div className="relative min-w-[140px]">
              <div className="w-36 h-36 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-white flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-primary">{dealReport.score}</div>
                  <div className={`text-sm font-medium ${dealReport.color.replace('bg-', 'text-')}`}>
                    {dealReport.rating}
                  </div>
                </div>
              </div>
              
              <svg className="absolute inset-0 w-36 h-36">
                <circle
                  className="text-muted/20 stroke-current"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                  r="68"
                  cx="72"
                  cy="72"
                />
                <circle
                  className={`${dealReport.color.replace('bg-', 'text-')} stroke-current`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="68"
                  cx="72"
                  cy="72"
                  strokeDasharray={`${dealReport.score * 4.27} 427`}
                  strokeDashoffset="0"
                />
              </svg>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">Deal Analysis</span>
                </div>
                <Badge className={dealReport.percentageDifference >= 0 ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                  {dealReport.percentageDifference >= 0 ? 'Undervalued' : 'Overvalued'}
                </Badge>
              </div>
              
              <div className="mt-2">
                <p className="text-sm">
                  This property is <span className={`font-bold ${dealReport.percentageDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(dealReport.percentageDifference).toFixed(1)}% {dealReport.percentageDifference >= 0 ? 'below' : 'above'}
                  </span> the estimated market value.
                </p>
              </div>
              
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Asking Price</p>
                  <p className="font-semibold">R{formatPrice(dealReport.askingPrice)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Market Value</p>
                  <p className="font-semibold">R{formatPrice(dealReport.estimatedValue)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Property Rate</p>
                  <p className="font-semibold">R{formatPrice(dealReport.pricePerSqM)}/m²</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Area Rate</p>
                  <p className="font-semibold">R{formatPrice(dealReport.areaRate)}/m²</p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full w-full"></div>
                  <div 
                    className="absolute top-0 h-full w-1 bg-black rounded-full transform -translate-x-1/2 shadow-md"
                    style={{ left: `${dealReport.score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>Poor</span>
                  <span>Average</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="financials" className="flex items-center gap-1.5">
              <Banknote className="h-4 w-4" />
              <span>Financials</span>
            </TabsTrigger>
            <TabsTrigger value="rental" className="flex items-center gap-1.5">
              <Landmark className="h-4 w-4" />
              <span>Rental</span>
            </TabsTrigger>
            <TabsTrigger value="comparables" className="flex items-center gap-1.5">
              <Building className="h-4 w-4" />
              <span>Comparables</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Key Property Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Value Difference</span>
                      <Badge variant={dealReport.percentageDifference >= 0 ? "success" : "destructive"}>
                        {dealReport.percentageDifference >= 0 ? '+' : ''}{dealReport.percentageDifference.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>Price vs Area average</span>
                        <span className="font-medium">
                          {dealReport.pricePerSqM < dealReport.areaRate ? 'Below average' : 'Above average'}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (dealReport.pricePerSqM / dealReport.areaRate) * 100)} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Below</span>
                        <span>Average</span>
                        <span>Above</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>Property condition</span>
                        <span className="font-medium capitalize">
                          {dealReport.propertyCondition}
                        </span>
                      </div>
                      <Progress 
                        value={
                          dealReport.propertyCondition === 'excellent' ? 100 :
                          dealReport.propertyCondition === 'good' ? 75 :
                          dealReport.propertyCondition === 'fair' ? 50 : 25
                        } 
                        className="h-2"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium">Best Investment Strategy</span>
                        </div>
                        <Badge variant="outline">
                          {dealReport.bestInvestmentStrategy}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Short-Term Yield</span>
                          <span className="font-medium">{dealReport.shortTermYield.toFixed(1)}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Long-Term Yield</span>
                          <span className="font-medium">{dealReport.longTermYield.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="text-sm font-medium">Monthly Payment</div>
                        <div className="text-lg font-bold">R{formatPrice(dealReport.monthlyPayment, 0)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{dealReport.loanTerm} year term at {dealReport.interestRate}%</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="text-sm font-medium">Monthly Cash Flow</div>
                        <div className={`text-lg font-bold ${dealReport.cashFlowShortTerm >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R{formatPrice(Math.abs(dealReport.cashFlowShortTerm), 0)}
                          {dealReport.cashFlowShortTerm < 0 ? ' deficit' : ''}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Based on {dealReport.bestInvestmentStrategy}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Price Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Price per m²</span>
                    <span className="font-medium">R{formatPrice(dealReport.pricePerSqM, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Area average</span>
                    <span className="font-medium">R{formatPrice(dealReport.areaRate, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Difference</span>
                    <span className={`font-medium ${dealReport.pricePerSqM <= dealReport.areaRate ? 'text-green-600' : 'text-red-600'}`}>
                      {((dealReport.pricePerSqM - dealReport.areaRate) / dealReport.areaRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-primary" />
                    Yield Potential
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Short-term</span>
                    <Badge className={
                      dealReport.shortTermYield >= 12 ? 'bg-green-500' : 
                      dealReport.shortTermYield >= 8 ? 'bg-yellow-500' : 'bg-red-500'
                    }>
                      {dealReport.shortTermYield.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Long-term</span>
                    <Badge className={
                      dealReport.longTermYield >= 8 ? 'bg-green-500' : 
                      dealReport.longTermYield >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                    }>
                      {dealReport.longTermYield.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Best Strategy</span>
                    <span className="font-medium">{dealReport.bestInvestmentStrategy}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-primary" />
                    Monthly Costs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Bond payment</span>
                    <span className="font-medium">R{formatPrice(dealReport.monthlyPayment, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rates & taxes</span>
                    <span className="font-medium">R{formatPrice(dealReport.monthlyRates, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Levy</span>
                    <span className="font-medium">R{formatPrice(dealReport.levy, 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="financials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Breakdown</CardTitle>
                <CardDescription>Financial analysis of your investment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Purchase Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm">Purchase price</span>
                        <span className="font-medium">R{formatPrice(dealReport.askingPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm">Deposit ({dealReport.depositPercentage}%)</span>
                        <span className="font-medium">R{formatPrice(dealReport.depositAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm">Loan amount</span>
                        <span className="font-medium">R{formatPrice(dealReport.loanAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm">Interest rate</span>
                        <span className="font-medium">{dealReport.interestRate}%</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm">Loan term</span>
                        <span className="font-medium">{dealReport.loanTerm} years</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm font-medium">Monthly payment</span>
                        <span className="font-bold">R{formatPrice(dealReport.monthlyPayment)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Monthly Cash Flow</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm">Monthly income ({dealReport.bestInvestmentStrategy})</span>
                        <span className="font-medium text-green-600">
                          R{
                            formatPrice(
                              dealReport.bestInvestmentStrategy.includes("Short-Term") 
                                ? dealReport.annualRevenueShortTerm / 12 
                                : dealReport.monthlyLongTerm
                            )
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm">Bond payment</span>
                        <span className="font-medium text-red-600">-R{formatPrice(dealReport.monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm">Rates & taxes</span>
                        <span className="font-medium text-red-600">-R{formatPrice(dealReport.monthlyRates)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm">Levy</span>
                        <span className="font-medium text-red-600">-R{formatPrice(dealReport.levy)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm font-medium">Net cash flow</span>
                        <span className={`font-bold ${dealReport.bestInvestmentStrategy.includes("Short-Term") 
                          ? (dealReport.cashFlowShortTerm >= 0 ? 'text-green-600' : 'text-red-600') 
                          : (dealReport.cashFlowLongTerm >= 0 ? 'text-green-600' : 'text-red-600')
                        }`}>
                          {dealReport.bestInvestmentStrategy.includes("Short-Term") 
                            ? (dealReport.cashFlowShortTerm >= 0 ? 'R' : '-R') + formatPrice(Math.abs(dealReport.cashFlowShortTerm))
                            : (dealReport.cashFlowLongTerm >= 0 ? 'R' : '-R') + formatPrice(Math.abs(dealReport.cashFlowLongTerm))
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h4 className="font-medium mb-3">Return on Investment</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-primary/5">
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">Gross Yield</div>
                        <div className="text-xl font-bold">
                          {dealReport.bestInvestmentStrategy.includes("Short-Term") 
                            ? dealReport.shortTermYield.toFixed(1) 
                            : dealReport.longTermYield.toFixed(1)
                          }%
                        </div>
                        <div className="text-xs mt-1">Annual rental income / Property price</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-primary/5">
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">Cash on Cash Return</div>
                        <div className="text-xl font-bold">
                          {(
                            (dealReport.bestInvestmentStrategy.includes("Short-Term") 
                              ? dealReport.cashFlowShortTerm 
                              : dealReport.cashFlowLongTerm
                            ) * 12 / dealReport.depositAmount * 100
                          ).toFixed(1)}%
                        </div>
                        <div className="text-xs mt-1">Annual cash flow / Initial investment</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-primary/5">
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">Cap Rate</div>
                        <div className="text-xl font-bold">
                          {(
                            ((dealReport.bestInvestmentStrategy.includes("Short-Term") 
                              ? dealReport.annualRevenueShortTerm 
                              : dealReport.annualRentalLongTerm
                            ) - (dealReport.monthlyRates + dealReport.levy) * 12) / dealReport.askingPrice * 100
                          ).toFixed(1)}%
                        </div>
                        <div className="text-xs mt-1">Net operating income / Property value</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-primary/5">
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">Break-Even Ratio</div>
                        <div className="text-xl font-bold">
                          {(
                            ((dealReport.monthlyPayment + dealReport.monthlyRates + dealReport.levy) / 
                            (dealReport.bestInvestmentStrategy.includes("Short-Term") 
                              ? dealReport.annualRevenueShortTerm / 12 
                              : dealReport.monthlyLongTerm
                            )) * 100
                          ).toFixed(0)}%
                        </div>
                        <div className="text-xs mt-1">Total expenses / Gross income</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rental" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rental Analysis</CardTitle>
                <CardDescription>Short-term vs long-term rental comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium flex items-center gap-2">
                        <Badge className="bg-blue-500">Short-Term</Badge>
                        Rental Analysis
                      </h4>
                      <Badge variant="outline" className={
                        dealReport.shortTermYield >= 12 ? 'text-green-600 border-green-200' : 
                        dealReport.shortTermYield >= 8 ? 'text-yellow-600 border-yellow-200' : 
                        'text-red-600 border-red-200'
                      }>
                        {dealReport.shortTermYield.toFixed(1)}% Yield
                      </Badge>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Average nightly rate</span>
                          <span className="font-medium">R{formatPrice(dealReport.nightlyRate, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Annual occupancy</span>
                          <span className="font-medium">{dealReport.occupancyRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Monthly revenue</span>
                          <span className="font-medium">R{formatPrice(dealReport.annualRevenueShortTerm / 12, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Annual revenue</span>
                          <span className="font-medium">R{formatPrice(dealReport.annualRevenueShortTerm, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Monthly cash flow</span>
                          <span className={`font-bold ${dealReport.cashFlowShortTerm >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {dealReport.cashFlowShortTerm >= 0 ? 'R' : '-R'}{formatPrice(Math.abs(dealReport.cashFlowShortTerm), 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Pros</h5>
                      <ul className="space-y-1">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Higher potential returns ({dealReport.shortTermYield.toFixed(1)}% yield)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Flexibility to use the property yourself occasionally</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Potential for price adjustments during peak seasons</span>
                        </li>
                      </ul>
                      
                      <h5 className="text-sm font-medium mt-4">Cons</h5>
                      <ul className="space-y-1">
                        <li className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Higher management requirements or fees</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Unpredictable occupancy rates</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Higher wear and tear on property</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium flex items-center gap-2">
                        <Badge className="bg-green-500">Long-Term</Badge>
                        Rental Analysis
                      </h4>
                      <Badge variant="outline" className={
                        dealReport.longTermYield >= 8 ? 'text-green-600 border-green-200' : 
                        dealReport.longTermYield >= 6 ? 'text-yellow-600 border-yellow-200' : 
                        'text-red-600 border-red-200'
                      }>
                        {dealReport.longTermYield.toFixed(1)}% Yield
                      </Badge>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Monthly rental</span>
                          <span className="font-medium">R{formatPrice(dealReport.monthlyLongTerm, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Annual vacancy</span>
                          <span className="font-medium">8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Effective monthly</span>
                          <span className="font-medium">R{formatPrice(dealReport.monthlyLongTerm * 0.92, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Annual revenue</span>
                          <span className="font-medium">R{formatPrice(dealReport.annualRentalLongTerm, 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Monthly cash flow</span>
                          <span className={`font-bold ${dealReport.cashFlowLongTerm >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {dealReport.cashFlowLongTerm >= 0 ? 'R' : '-R'}{formatPrice(Math.abs(dealReport.cashFlowLongTerm), 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Pros</h5>
                      <ul className="space-y-1">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Stable, predictable income</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Lower management effort and costs</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                          <span>Tenant responsible for minor maintenance</span>
                        </li>
                      </ul>
                      
                      <h5 className="text-sm font-medium mt-4">Cons</h5>
                      <ul className="space-y-1">
                        <li className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Lower potential returns ({dealReport.longTermYield.toFixed(1)}% yield)</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Limited access to the property</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                          <span>Potential tenant issues</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Recommended Strategy</h4>
                  </div>
                  <p className="text-sm">
                    Based on the analysis, the <span className="font-bold">{dealReport.bestInvestmentStrategy}</span> strategy 
                    provides the best financial returns for this property. 
                    {dealReport.bestInvestmentStrategy.includes("Short-Term") ? (
                      <>
                        {' '}With a potential yield of <span className="font-bold">{dealReport.shortTermYield.toFixed(1)}%</span> compared to 
                        {' '}<span className="font-bold">{dealReport.longTermYield.toFixed(1)}%</span> for long-term rental, 
                        this property is well-suited for short-term letting.
                      </>
                    ) : (
                      <>
                        {' '}While the short-term yield of <span className="font-bold">{dealReport.shortTermYield.toFixed(1)}%</span> is attractive,
                        the stable income and lower management requirements of long-term rental make it the more practical choice for this property.
                      </>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comparables" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comparable Properties</CardTitle>
                <CardDescription>Recent sales in the area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border">
                    <div>
                      <h4 className="font-medium">Market Comparison</h4>
                      <p className="text-sm text-muted-foreground">Average prices of comparable properties in the area</p>
                    </div>
                    <div className="flex flex-col items-center md:items-end">
                      <div className="text-sm text-muted-foreground">Average Comparable Sale Price</div>
                      <div className="text-2xl font-bold">R{formatPrice(dealReport.avgComparableSalesPrice)}</div>
                      <div className={`text-sm ${dealReport.askingPrice <= dealReport.avgComparableSalesPrice ? 'text-green-600' : 'text-red-600'}`}>
                        {dealReport.askingPrice <= dealReport.avgComparableSalesPrice ? 'Good value' : 'Above market average'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-muted-foreground font-normal border-b">
                          <th className="text-left pb-2 font-medium">Address</th>
                          <th className="text-left pb-2 font-medium">Size</th>
                          <th className="text-right pb-2 font-medium">Price</th>
                          <th className="text-right pb-2 font-medium">R/m²</th>
                          <th className="text-center pb-2 font-medium">Beds</th>
                          <th className="text-left pb-2 font-medium">Sale Date</th>
                          <th className="text-left pb-2 font-medium">Similarity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dealReport.comparableProperties.map((property, index) => (
                          <tr key={index} className="border-b last:border-b-0">
                            <td className="py-3 text-sm">{property.address}</td>
                            <td className="py-3 text-sm">{property.size} m²</td>
                            <td className="py-3 text-sm text-right">R{formatPrice(property.salePrice)}</td>
                            <td className="py-3 text-sm text-right">R{formatPrice(property.pricePerSqM)}</td>
                            <td className="py-3 text-sm text-center">{property.bedrooms}</td>
                            <td className="py-3 text-sm">{property.saleDate}</td>
                            <td className="py-3 text-sm">
                              <Badge variant="outline" className={
                                property.similarity === 'Similar' 
                                  ? 'border-green-200 text-green-700 bg-green-50' 
                                  : 'border-blue-200 text-blue-700 bg-blue-50'
                              }>
                                {property.similarity}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/30">
                          <td className="py-3 text-sm font-medium">{dealReport.address.split(',')[0]}</td>
                          <td className="py-3 text-sm">{dealReport.propertySize} m²</td>
                          <td className="py-3 text-sm text-right font-medium">R{formatPrice(dealReport.askingPrice)}</td>
                          <td className="py-3 text-sm text-right">R{formatPrice(dealReport.pricePerSqM)}</td>
                          <td className="py-3 text-sm text-center">{dealReport.bedrooms}</td>
                          <td className="py-3 text-sm">Current</td>
                          <td className="py-3 text-sm">
                            <Badge className="bg-primary">Subject Property</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <Alert className="bg-blue-50 border-blue-100">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Value Analysis</AlertTitle>
                    <AlertDescription className="text-sm">
                      This property is priced <span className={dealReport.percentageDifference >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {Math.abs(dealReport.percentageDifference).toFixed(1)}% {dealReport.percentageDifference >= 0 ? 'below' : 'above'}
                      </span> its estimated market value based on recent comparable sales and area rates.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderPaymentModal = () => {
    return (
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock Full Report</DialogTitle>
            <DialogDescription>
              Get access to the complete property analysis and investment insights
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                  <span className="text-sm font-medium">Credit Card</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="payfast"
                  id="payfast"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="payfast"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Wallet className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">PayFast</span>
                </Label>
              </div>
            </RadioGroup>

            <div className="rounded-md bg-muted p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Deal Score Report</div>
                <div className="text-sm">R49</div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Includes full property analysis, rental yield calculations, investment metrics, and comparable sales data
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={handlePaymentProcessing}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay R49</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 flex flex-col relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#8884_1px,transparent_1px),linear-gradient(to_bottom,#8884_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          <div className="absolute -top-[150px] -left-[150px] w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl"></div>
          <div className="absolute top-[20%] -right-[100px] w-[200px] h-[200px] rounded-full bg-blue-400/10 blur-3xl"></div>
          <div className="absolute -bottom-[150px] left-[20%] w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl"></div>
          
          <div className="absolute top-0 left-0 w-full h-full">
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
        </div>
        
        {/* Header */}
        <header className="relative z-10 container mx-auto py-6 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img
                src="/proply-logo-auth.png"
                alt="Proply Logo"
                className="h-8 w-auto"
              />
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
              <Button size="sm" variant="outline" className="gap-1.5 mr-2">
                Sign In
              </Button>
              <Button size="sm" className="gap-1.5">
                Sign Up
              </Button>
            </nav>
            <Button size="icon" variant="ghost" className="md:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </Button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 relative z-10 container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-[800px] mx-auto text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              Property Deal Score™
            </h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto">
              Analyze any property in seconds and get an instant investment score based on advanced market data.
            </p>
          </div>
          
          <Card className={`mx-auto ${showResult ? 'max-w-5xl' : 'max-w-2xl'} bg-background/95 backdrop-blur-sm shadow-xl border-primary/10`}>
            {!showResult ? (
              <CardContent className="p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-center mb-2">Calculate Your Deal Score</h2>
                  <p className="text-center text-muted-foreground">
                    Enter property details to get an instant analysis of your investment potential
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {renderStepCounter()}
                  {renderFormStep()}
                  
                  <Button type="submit" className="w-full mt-6" size="lg" disabled={isCalculating}>
                    {isCalculating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating Your Deal Score...
                      </>
                    ) : (
                      <>
                        Calculate Deal Score
                        <Calculator className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
                
                <div className="mt-6 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={fillDemoData}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Use demo data (click 3x)
                  </button>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-6 md:p-8 relative">
                {renderComprehensiveReport()}
                
                {/* Payment overlay when not unlocked */}
                {!reportUnlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-background/40 via-background/90 to-background/95 backdrop-blur-sm rounded-lg z-10">
                    <div className="bg-background shadow-lg rounded-xl p-8 border border-primary/10 max-w-md mx-auto text-center">
                      <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">
                        Unlock Complete Report
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Get access to the full property analysis with rental yields, investment metrics, and comparable sales data
                      </p>
                      
                      <div className="bg-muted/50 p-4 rounded-lg mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Deal Score</span>
                          <Badge className={dealReport?.color || 'bg-blue-500'}>
                            {dealReport?.score || 0}/100
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          We've analyzed this property and calculated its investment potential
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            Market valuation
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            Rental yields
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            Investment metrics
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full bg-primary text-white hover:bg-primary/90"
                        size="lg"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Unlock Full Report for R49
                      </Button>
                      
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={handleNewCalculation}
                        >
                          New Calculation
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Download button when report is unlocked */}
                {reportUnlocked && (
                  <div className="flex justify-center mt-8">
                    <div className="space-y-4 w-full max-w-md">
                      <HTMLToPDFButton
                        elementId="deal-score-report"
                        filename={`Proply_Deal_Score_${dealReport?.address?.split(',')[0] || 'Report'}.pdf`}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        size="lg"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Full Report
                      </HTMLToPDFButton>
                      
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={handleNewCalculation}
                      >
                        <Calculator className="mr-2 h-4 w-4" />
                        Calculate New Property
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </main>
        
        {/* Features Section */}
        <section className="relative z-10 container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Use Property Deal Score?</h2>
            <p className="text-muted-foreground text-lg">
              Make confident property investment decisions with our comprehensive analysis tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/50 backdrop-blur-sm border-primary/10 hover:shadow-md transition-all">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Advanced Market Analysis</CardTitle>
                <CardDescription>
                  Compare property prices with current market rates to spot undervalued opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Price per square meter comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Area rate benchmarking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Recent comparable sales data</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-white/50 backdrop-blur-sm border-primary/10 hover:shadow-md transition-all">
              <CardHeader>
                <LineChart className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Rental Yield Calculations</CardTitle>
                <CardDescription>
                  Compare short-term and long-term rental strategies to maximize your returns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Short-term rental projections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Long-term rental estimates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Strategy recommendations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-white/50 backdrop-blur-sm border-primary/10 hover:shadow-md transition-all">
              <CardHeader>
                <PieChart className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Investment Metrics</CardTitle>
                <CardDescription>
                  Analyze comprehensive financial metrics to evaluate investment potential
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Cash flow projections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Return on investment calculations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-sm">Mortgage payment estimations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="relative z-10 bg-gradient-to-r from-primary/10 to-blue-500/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Find Your Next Investment Property?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Use our Deal Score calculator to evaluate property investments instantly and make data-driven decisions.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="relative z-10 bg-muted/30 border-t border-muted py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <img
                  src="/proply-logo-auth.png"
                  alt="Proply Logo"
                  className="h-8 w-auto"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Property investment intelligence platform
                </p>
              </div>
              <div className="flex gap-8">
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-medium">Product</h4>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">Features</a>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">Pricing</a>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">API</a>
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-medium">Company</h4>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">About</a>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">Blog</a>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">Contact</a>
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-sm font-medium">Legal</h4>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">Privacy</a>
                  <a href="#" className="text-xs text-muted-foreground hover:text-primary">Terms</a>
                </div>
              </div>
            </div>
            <div className="border-t border-muted mt-8 pt-4 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Proply. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
      
      {renderAreaRateDialog()}
      {renderPaymentModal()}
    </>
  );
}