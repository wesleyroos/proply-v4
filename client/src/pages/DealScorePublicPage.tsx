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
import { Badge } from "@/components/ui/badge";
import { DealScoreReport } from "./DealScoreReportPage";
import { HTMLToPDFButton } from "@/components/pdf/html-to-pdf-button";


export default function DealScorePublicPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  // Form is now a single step
  const [formData, setFormData] = useState({
    // Property Details (Step 1 - simplified)
    address: "",
    purchasePrice: "",
    size: "",
    areaRate: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    propertyCondition: "excellent",

    // Default values for other fields (no longer shown in form)
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
    "loading" | "success" | "error"
  >("loading");
  const [showAreaRateDialog, setShowAreaRateDialog] = useState(false);
  const [areaRateError, setAreaRateError] = useState<string>();
  const [reportUnlocked, setReportUnlocked] = useState(false);
  const [rentalAmountStatus, setRentalAmountStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [showRentalAmountDialog, setShowRentalAmountDialog] = useState(false);
  const [rentalAmountError, setRentalAmountError] = useState<string>();
  const [dealReport, setDealReport] = useState<DealScoreReport | null>(null);


  const fillDemoData = () => {
    setDemoClicks((prev) => {
      if (prev === 2) {
        setFormData({
          address: "27 Leeuwen St, Cape Town City Centre, 8001",
          purchasePrice: "3500000",
          size: "85",
          areaRate: "45000",
          bedrooms: "2",
          bathrooms: "2",
          parking: "1",
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
  
  const formatPrice = (value: number, decimals: number = 0): string => {
    return value.toLocaleString('en-ZA', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
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

    setIsCalculating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    calculateDealScore();
  };

  const calculateDealScore = () => {
    // Get property rate
    const propertyRate =
      Number(parseFormattedNumber(formData.purchasePrice)) /
      Number(parseFormattedNumber(formData.size));
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
    let estimatedLongTermRental = purchasePrice * 0.005; // Estimate 0.5% of purchase price as monthly rental
    let estimatedNightlyRate = purchasePrice / 1000; // Rough estimate
    
    // Set default values for financing
    const depositPercentage = 10; // 10% deposit
    const depositAmount = purchasePrice * (depositPercentage / 100);
    const interestRate = 11; // 11% interest rate
    const loanTerm = 20; // 20 year loan term
    const loanAmount = purchasePrice - depositAmount;
    const monthlyPayment = (loanAmount * (interestRate/100/12) * Math.pow(1 + (interestRate/100/12), loanTerm * 12)) / (Math.pow(1 + (interestRate/100/12), loanTerm * 12) - 1);
    
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

    const estimatedValue =
      Number(parseFormattedNumber(formData.areaRate)) *
      Number(parseFormattedNumber(formData.size));
    
    // Estimated monthly costs (simplified)
    const monthlyRates = purchasePrice * 0.001 / 12; // Rough estimate of rates
    const levy = purchasePrice * 0.0015; // Rough estimate of levy
    const estimatedMonthlyCosts = monthlyRates + levy;
    
    // Calculate cash flow
    const cashFlowShortTerm = (annualRevenueShortTerm / 12) - monthlyPayment - estimatedMonthlyCosts;
    const cashFlowLongTerm = estimatedLongTermRental - monthlyPayment - estimatedMonthlyCosts;
    
    // Determine best investment strategy
    const bestInvestmentStrategy = shortTermYield > (longTermYield || 0) ? "Short-Term Rental" : "Long-Term Rental";
    
    // Example comparable properties (dummy data)
    const avgComparableSalesPrice = estimatedValue * 0.98; // Average slightly below the estimated value
    
    // Report date
    const reportDate = new Date().toLocaleDateString('en-ZA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
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
      recentSalesRange: `R${Math.round(estimatedValue * 0.9).toLocaleString()} - R${Math.round(estimatedValue * 1.1).toLocaleString()}`,
      
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
      netAnnualIncome: annualRevenueShortTerm - (estimatedMonthlyCosts * 12),
      
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
          address: `${Math.floor(Math.random() * 100)} ${formData.address.split(',')[0].split(' ').pop()}`,
          salePrice: Math.round(estimatedValue * (0.95 + Math.random() * 0.1)),
          size: Math.round(propertySize * (0.9 + Math.random() * 0.2)),
          pricePerSqM: Math.round(propertyRate * (0.95 + Math.random() * 0.1)),
          bedrooms: bedrooms,
          saleDate: new Date(Date.now() - Math.random() * 15552000000).toLocaleDateString('en-ZA'), // Random date in last 6 months
        },
        {
          similarity: "Comparable",
          address: `${Math.floor(Math.random() * 100)} ${formData.address.split(',')[0].split(' ').pop()}`,
          salePrice: Math.round(estimatedValue * (0.9 + Math.random() * 0.2)),
          size: Math.round(propertySize * (0.85 + Math.random() * 0.3)),
          pricePerSqM: Math.round(propertyRate * (0.9 + Math.random() * 0.2)),
          bedrooms: bedrooms + (Math.random() > 0.5 ? 1 : -1),
          saleDate: new Date(Date.now() - Math.random() * 31104000000).toLocaleDateString('en-ZA'), // Random date in last year
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
    
    // Set the comprehensive report
    setDealReport(report);
    
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

  // Form reset happens in handleNewCalculation

  const handleNewCalculation = () => {
    setShowResult(false);
    setReportUnlocked(false);
    setResult(null);
    setDealReport(null);
  };

  // Reference for PDF export
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadReport = () => {
    if (!dealReport) {
      toast({
        title: "Error",
        description: "No report data available to download",
        variant: "destructive",
      });
      return;
    }
    
    // The HTML-to-PDF button component will handle the actual PDF generation
    // based on the element ID "deal-score-report"
  };

  const getMissingFields = (): string[] => {
    const missingFields: string[] = [];

    const isFieldEmpty = (field: string): boolean => {
      if (!formData[field as keyof typeof formData]) return true;
      const value = formData[field as keyof typeof formData].toString();
      const numericValue = value.replace(/,/g, "");
      return numericValue === "" || numericValue === "0";
    };

    if (!formData.address) missingFields.push("Property Address");
    if (isFieldEmpty("purchasePrice")) missingFields.push("Purchase Price");
    if (isFieldEmpty("size")) missingFields.push("Size");
    if (isFieldEmpty("areaRate")) missingFields.push("Area Rate");
    if (isFieldEmpty("bedrooms")) missingFields.push("Bedrooms");
    if (isFieldEmpty("bathrooms")) missingFields.push("Bathrooms");
    if (isFieldEmpty("parking")) missingFields.push("Parking");
    if (!formData.propertyCondition) missingFields.push("Property Condition");

    return missingFields;
  };

  const renderFormStep = () => {
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
          <Label htmlFor="areaRate">Area Rate (R/m²)</Label>
          <div className="flex gap-2">
            <Input
              id="areaRate"
              type="text"
              inputMode="numeric"
              value={formData.areaRate}
              onChange={(e) => handleInputChange("areaRate", e.target.value)}
              placeholder="Area rate will be fetched automatically"
              required
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="default"
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
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="text"
            inputMode="numeric"
            value={formData.bathrooms}
            onChange={(e) => handleInputChange("bathrooms", e.target.value)}
            placeholder="Enter number of bathrooms"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parking">Parking Spaces</Label>
          <Input
            id="parking"
            type="text"
            inputMode="numeric"
            value={formData.parking}
            onChange={(e) => handleInputChange("parking", e.target.value)}
            placeholder="Enter number of parking spaces"
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
  };

  const renderStepCounter = () => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-center mb-2">Property Details</h2>
      <p className="text-sm text-muted-foreground text-center">
        Enter your property details below to get an instant deal score
      </p>
    </div>
  );

  const fetchRentalAmount = async () => {
    try {
      setRentalAmountStatus("loading");
      setShowRentalAmountDialog(true);
      setIsLoading(true);

      const response = await fetch("/api/deal-advisor/rental-amount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: formData.address,
          propertySize: parseFormattedNumber(formData.size),
          bedrooms: parseFormattedNumber(formData.bedrooms),
          condition: formData.propertyCondition,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch rental amount");
      }

      const data = await response.json();

      // Add a delay to show the progress dialog
      await new Promise((resolve) => setTimeout(resolve, 4000));

      setFormData((prev) => ({
        ...prev,
        longTermRental: formatWithThousandSeparators(data.rentalAmount.toString()),
      }));

      setRentalAmountStatus("success");
      toast({
        title: "Success",
        description: "Rental amount fetched successfully",
      });
    } catch (error) {
      setRentalAmountStatus("error");
      setRentalAmountError(
        error instanceof Error ? error.message : "Failed to fetch rental amount",
      );
      toast({
        title: "Error",
        description: "Failed to fetch rental amount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setShowRentalAmountDialog(false);
      }, 2000);
    }
  };

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

  // Function to render the comprehensive report
  const renderComprehensiveReport = () => {
    if (!dealReport) return null;
    
    return (
      <div
        id="deal-score-report"
        ref={reportRef}
        className="max-w-[1600px] mx-auto bg-white shadow-lg rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src="/proply-logo-auth.png" alt="Proply Logo" className="h-8 w-auto" />
            </div>
            <div className="text-sm opacity-80">Report generated: {new Date().toLocaleDateString('en-ZA', {day: '2-digit', month: 'long', year: 'numeric'})}</div>
          </div>
          <div className="mt-12 mb-6">
            <h1 className="text-3xl font-bold">Proply Deal Score™</h1>
            <p className="opacity-80 mt-2">{dealReport?.address}</p>
          </div>
        </div>

        {/* Deal Score Section */}
        <div className="p-8 border-b">
          <div className="text-center mb-8">
            <div className="flex justify-center mt-6">
              <div className="relative w-40 h-40">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 animate-pulse"></div>
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  <div className="text-6xl font-bold text-primary">{dealReport.score}%</div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <span 
                className={`inline-block px-4 py-1 rounded-full text-white font-medium ${dealReport.color || 'bg-green-500'}`}
              >
                {dealReport.rating}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Asking Price</div>
              <div className="text-xl font-bold">R{formatPrice(dealReport.askingPrice)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-500">Estimated Market Value</div>
              <div className="text-xl font-bold">R{formatPrice(dealReport.estimatedValue)}</div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-center mb-8">
            <span className="font-medium">This property is </span>
            <span className="text-green-600 font-bold">{dealReport.percentageDifference?.toFixed(1)}% below</span>
            <span className="font-medium"> the estimated market value</span>
          </div>

          <div className="relative h-4 mb-10 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full">
            <div
              className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-300 rounded-full transform -translate-x-1/2 shadow-md"
              style={{ left: `${dealReport.score}%` }}
            />
            <div className="absolute -bottom-6 left-0 text-xs">Poor</div>
            <div className="absolute -bottom-6 left-1/4 text-xs">Average</div>
            <div className="absolute -bottom-6 left-1/2 text-xs transform -translate-x-1/2">Good</div>
            <div className="absolute -bottom-6 left-3/4 text-xs">Great</div>
            <div className="absolute -bottom-6 right-0 text-xs">Excellent</div>
          </div>
        </div>

        {/* Key Deal Factors */}
        <div className="p-8 border-b">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Key Deal Factors</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                Price per m²:
              </span>
              <span className="font-medium">R{formatPrice(dealReport.pricePerSqM, 0)}/m²</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Area average:
              </span>
              <span className="font-medium">R{formatPrice(dealReport.areaRate, 0)}/m²</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Recent Area Sales:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{dealReport.recentSalesRange || "R3.4M - R3.7M (last 3 months)"}</span>
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                  WITHIN RANGE
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Property condition:
              </span>
              <span className="font-medium capitalize">{dealReport.propertyCondition}</span>
            </div>

            {reportUnlocked && (
              <>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Short-Term Yield:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealReport.shortTermYield?.toFixed(1)}%</span>
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      EXCELLENT
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Long-Term Yield:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealReport.longTermYield?.toFixed(1)}%</span>
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      EXCELLENT
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Best Investment Strategy:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealReport.bestInvestmentStrategy || "Short-Term"}</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
                      RECOMMENDED
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Property Details */}
        <div className="p-8 border-b">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Property Details</h2>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">General Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Type:</span>
                  <span className="font-medium">Apartment</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{dealReport.propertySize} m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bedrooms:</span>
                  <span className="font-medium">{dealReport.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bathrooms:</span>
                  <span className="font-medium">{dealReport.bathrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Parking:</span>
                  <span className="font-medium">{dealReport.parking}</span>
                </div>
              </div>
            </div>

            {reportUnlocked && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Financial Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Municipal Value:</span>
                    <span className="font-medium">R{formatPrice(dealReport.municipalValue || 3600000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rates:</span>
                    <span className="font-medium">R{formatPrice(dealReport.monthlyRates || 2850)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Levy:</span>
                    <span className="font-medium">R{formatPrice(dealReport.levy || 1950)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Monthly Costs:</span>
                    <span className="font-medium">R{formatPrice(dealReport.estimatedMonthlyCosts || 4800)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Investment Analysis */}
        {reportUnlocked && (
          <div className="p-8 border-b">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Investment Analysis</h2>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>

            <div className="space-y-6">
              {/* Short-term Rental Analysis */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Short-term Rental Analysis</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Nightly Rate</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.nightlyRate || 2500)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Occupancy Rate</div>
                    <div className="text-xl font-bold">{dealReport.occupancyRate || 70}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Monthly Revenue</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.monthlyRevenue || 52500)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Annual Revenue</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.annualRevenueShortTerm || 630000)}</div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-primary" />
                    Short-Term Yield:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealReport.shortTermYield?.toFixed(1)}%</span>
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      EXCELLENT
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Long-term Rental Analysis */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium">Long-term Rental Analysis</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Monthly Rental</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.monthlyLongTerm || 25000)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Annual Rental</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.annualRentalLongTerm || 300000)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Vacancy Rate</div>
                    <div className="text-xl font-bold">{dealReport.vacancyRate || 5}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Net Annual Income</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.netAnnualIncome || 285000)}</div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center p-3 bg-white rounded-lg">
                  <span className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-purple-600" />
                    Long-Term Yield:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{dealReport.longTermYield?.toFixed(1)}%</span>
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      EXCELLENT
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Mortgage Analysis */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium">Mortgage Analysis</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Purchase Price</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.askingPrice)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Deposit ({dealReport.depositPercentage || 10}%)</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.depositAmount || 350000)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Loan Amount</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.loanAmount || 3150000)}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Interest Rate</div>
                    <div className="text-xl font-bold">{dealReport.interestRate?.toFixed(2) || "11.75"}%</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Loan Term</div>
                    <div className="text-xl font-bold">{dealReport.loanTerm || 20} years</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Monthly Payment</div>
                    <div className="text-xl font-bold">R{formatPrice(dealReport.monthlyPayment || 33850)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparable Properties Section (only when unlocked) */}
        {reportUnlocked && (
          <div className="p-8 border-b">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Comparable Properties</h2>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Similarity</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/m²</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beds</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(dealReport.comparableProperties || []).map((property, index) => (
                    <tr key={index}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          property.similarity === "MOST SIMILAR" 
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {property.similarity}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{property.address}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">R{formatPrice(property.salePrice)}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{property.size} m²</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">R{formatPrice(property.pricePerSqM)}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{property.bedrooms}</td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{property.saleDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-center">
              <button className="text-primary font-medium flex items-center gap-1 mx-auto">
                View all comparable properties
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-8 text-center pdf-section">
          <p className="text-sm text-gray-500 mt-6">Report generated by Proply Deal Score™ on {new Date().toLocaleDateString('en-ZA', {day: '2-digit', month: 'long', year: 'numeric'})}</p>
          <p className="text-xs text-gray-400 mt-2">
            The information in this report is based on market data and should be used for informational purposes only.
            Proply does not guarantee the accuracy of the information provided.
          </p>
        </div>
      </div>
    );
  };

  const RentalAmountProgressDialog = () => {
    return (
      <Dialog open={showRentalAmountDialog} onOpenChange={setShowRentalAmountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fetching Rental Amount</DialogTitle>
            <DialogDescription>
              Analyzing property details and market data...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {rentalAmountStatus === "loading" && (
              <div className="flex items-center space-x-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Processing with OpenAI</p>
                  <p className="text-sm text-muted-foreground">
                    Calculating optimal rental amount based on property details...
                  </p>
                </div>
              </div>
            )}
            {rentalAmountStatus === "success" && (
              <div className="flex items-center space-x-4">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Rental Amount Retrieved</p>
                  <p className="text-sm text-muted-foreground">
                    Successfully calculated the optimal rental amount.
                  </p>
                </div>
              </div>
            )}
            {rentalAmountStatus === "error" && (
              <div className="flex items-center space-x-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Error</p>
                  <p className="text-sm text-muted-foreground">
                    {rentalAmountError || "Failed to fetch rental amount"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
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
            <h1 className="text-3xl font-bold sm:text-4xl md:text5xl lg:text-6xl">
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

                    <div className="flex justify-end mt-6">
                      <Button
                        type="submit"
                        className="ml-auto"
                      >
                        {isCalculating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            Calculate Deal Score
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    {/* Comprehensive Report Container */}
                    <div className="max-w-6xl mx-auto relative">
                      
                      {/* Complete Analysis Section - with payment overlay container */}
                      <div className="relative">
                        {/* Render the comprehensive report */}
                        {renderComprehensiveReport()}
                        
                        {/* Download button when report is unlocked */}
                        {reportUnlocked && (
                          <div className="mt-8 flex justify-center">
                            <HTMLToPDFButton
                              elementId="deal-score-report"
                              filename={`Proply_Deal_Score_${dealReport?.address?.split(',')[0] || 'Report'}.pdf`}
                              className="bg-blue-500 hover:bg-blue-600 text-white w-full max-w-md h-10 py-2 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium"
                            >
                              Download Full Report
                            </HTMLToPDFButton>
                          </div>
                        )}
                        
                        {/* Payment overlay when report is not unlocked */}
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
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Unlock Full Report for R49
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center mt-8">
                      <Button 
                        variant="link" 
                        className="underline"
                        onClick={handleNewCalculation}
                      >
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
                  <TrendingUp className="h-6 w-6 text-primary" />
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
                <Button size="lg" className="text-lg px-8 bg-blue-500 hover:bg-blue-600 text-white">
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 border-blue-500 text-blue-500 hover:bg-blue-50">
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
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
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
      <RentalAmountProgressDialog />
    </div>
  );
}