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
  CircleDollarSign,
  Landmark,
  Receipt,
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

  // We're not fetching prime rate due to auth issues in public page
  // Using default value of 11% instead
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

  const formatPrice = (value: number, decimals: number = 0): string => {
    return value.toLocaleString("en-ZA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
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

  const calculateDealScoreWithUpdatedData = (
    nightlyRate: string,
    occupancyRate: string,
    longTermRental?: string,
  ) => {
    // This function uses real data from PriceLabs API and rental data to recalculate the deal score
    console.log("Running calculation with values:", {
      nightlyRate,
      occupancyRate,
      longTermRental,
      parsedLongTermRental: longTermRental ? Number(parseFormattedNumber(longTermRental)) : undefined
    });
    
    calculateDealScore(
      Number(parseFormattedNumber(nightlyRate)),
      Number(parseFormattedNumber(occupancyRate)),
      longTermRental ? Number(parseFormattedNumber(longTermRental)) : undefined,
    );
  };

  const calculateDealScore = (
    customNightlyRate?: number,
    customOccupancy?: number,
    customLongTermRental?: number,
  ) => {
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

    // Determine whether to use custom data from API or default estimates
    let estimatedLongTermRental;
    
    console.log("DIRECT PARAMETER - customLongTermRental:", customLongTermRental);
    console.log("FORM DATA - formData.longTermRental:", formData.longTermRental);
    
    // Check each possible source with detailed logging
    if (customLongTermRental) {
      console.log("USING: Direct parameter:", customLongTermRental);
      estimatedLongTermRental = customLongTermRental;
    } 
    else if (formData.longTermRental && Number(parseFormattedNumber(formData.longTermRental)) > 0) {
      console.log("USING: Form data:", formData.longTermRental, "→", Number(parseFormattedNumber(formData.longTermRental)));
      estimatedLongTermRental = Number(parseFormattedNumber(formData.longTermRental));
    } 
    else {
      const estimatedValue = purchasePrice * 0.005;
      console.log("USING: Estimate (0.5% of purchase price):", estimatedValue);
      estimatedLongTermRental = estimatedValue;
    }
    
    console.log("Purchase price:", purchasePrice, "formData.purchasePrice:", formData.purchasePrice);
    console.log("FINAL long term rental choice:", estimatedLongTermRental);

    // Use custom nightly rate if provided, otherwise use estimate
    let estimatedNightlyRate = customNightlyRate || purchasePrice / 1000; // Use API data if available, otherwise rough estimate

    // Use custom occupancy if provided, otherwise use default (65%)
    const propertyOccupancyRate = customOccupancy || 65;

    // Set default values for financing
    const depositPercentage = 10; // 10% deposit
    const depositAmount = purchasePrice * (depositPercentage / 100);
    const interestRate = 11; // 11% interest rate
    const loanTerm = 20; // 20 year loan term
    const loanAmount = purchasePrice - depositAmount;
    const monthlyPayment =
      (loanAmount *
        (interestRate / 100 / 12) *
        Math.pow(1 + interestRate / 100 / 12, loanTerm * 12)) /
      (Math.pow(1 + interestRate / 100 / 12, loanTerm * 12) - 1);

    // Calculate yields
    let shortTermYield = null;
    let longTermYield = null;

    // Calculate long term yield
    longTermYield = ((estimatedLongTermRental * 12) / purchasePrice) * 100;

    // Calculate short term yield
    const annualRevenueShortTerm =
      estimatedNightlyRate * 365 * (propertyOccupancyRate / 100);
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
    const monthlyRates = (purchasePrice * 0.001) / 12; // Rough estimate of rates
    const levy = purchasePrice * 0.0015; // Rough estimate of levy
    const estimatedMonthlyCosts = monthlyRates + levy;

    // Calculate cash flow
    const cashFlowShortTerm =
      annualRevenueShortTerm / 12 - monthlyPayment - estimatedMonthlyCosts;
    const cashFlowLongTerm =
      estimatedLongTermRental - monthlyPayment - estimatedMonthlyCosts;

    // Determine best investment strategy
    const bestInvestmentStrategy =
      shortTermYield > (longTermYield || 0)
        ? "Short-Term Rental"
        : "Long-Term Rental";

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
      percentageDifference:
        ((estimatedValue - purchasePrice) / purchasePrice) * 100,

      // Area Information
      areaRate: Number(parseFormattedNumber(formData.areaRate)),
      recentSalesRange: `R${Math.round(estimatedValue * 0.9).toLocaleString()} - R${Math.round(estimatedValue * 1.1).toLocaleString()}`,

      // Rental Information
      nightlyRate: estimatedNightlyRate,
      occupancyRate: propertyOccupancyRate,
      monthlyLongTerm: estimatedLongTermRental,
      
      // DEBUG INFO - remove later
      _debugRentalSource: customLongTermRental ? "API parameter" : 
                         (formData.longTermRental && Number(parseFormattedNumber(formData.longTermRental)) > 0) ? "form data" : 
                         "estimate",

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
      vacancyRate: 100 - propertyOccupancyRate,
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
          saleDate: new Date(
            Date.now() - Math.random() * 15552000000,
          ).toLocaleDateString("en-ZA"), // Random date in last 6 months
        },
        {
          similarity: "Comparable",
          address: `${Math.floor(Math.random() * 100)} ${formData.address.split(",")[0].split(" ").pop()}`,
          salePrice: Math.round(estimatedValue * (0.9 + Math.random() * 0.2)),
          size: Math.round(propertySize * (0.85 + Math.random() * 0.3)),
          pricePerSqM: Math.round(propertyRate * (0.9 + Math.random() * 0.2)),
          bedrooms: bedrooms + (Math.random() > 0.5 ? 1 : -1),
          saleDate: new Date(
            Date.now() - Math.random() * 31104000000,
          ).toLocaleDateString("en-ZA"), // Random date in last year
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
      percentageDifference:
        ((estimatedValue - purchasePrice) / purchasePrice) * 100,
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
    setShowResult(true);
    setIsCalculating(false);
  };

  const handleFetchAreaRate = async () => {
    if (!formData.address || !formData.size) {
      toast({
        title: "Missing Information",
        description: "Please enter the property address and size first.",
        variant: "destructive",
      });
      return;
    }

    setShowAreaRateDialog(true);
    setAreaRateStatus("loading");

    try {
      const response = await fetch("/api/deal-advisor/area-rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: formData.address,
          propertyType: "residential",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch area rate");
      }

      const data = await response.json();

      if (data.areaRate) {
        setFormData((prev) => ({
          ...prev,
          areaRate: formatWithThousandSeparators(data.areaRate.toString()),
        }));
        setAreaRateStatus("success");

        setTimeout(() => {
          setShowAreaRateDialog(false);
        }, 1500);
      } else {
        throw new Error("No area rate returned");
      }
    } catch (error) {
      console.error("Error fetching area rate:", error);
      setAreaRateStatus("error");
      setAreaRateError((error as Error).message);
    }
  };

  const handleFetchRentalAmount = async () => {
    if (
      !formData.address ||
      !formData.size ||
      !formData.bedrooms ||
      !formData.propertyCondition
    ) {
      toast({
        title: "Missing Information",
        description:
          "Please enter the property address, size, bedrooms, and condition first.",
        variant: "destructive",
      });
      return;
    }

    setShowRentalAmountDialog(true);
    setRentalAmountStatus("loading");

    try {
      const response = await fetch("/api/deal-advisor/rental-amount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: formData.address,
          propertySize: Number(parseFormattedNumber(formData.size)),
          bedrooms: Number(parseFormattedNumber(formData.bedrooms)),
          condition: formData.propertyCondition,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch rental amount");
      }

      const data = await response.json();

      if (data.rentalAmount) {
        setFormData((prev) => ({
          ...prev,
          longTermRental: formatWithThousandSeparators(
            data.rentalAmount.toString(),
          ),
        }));
        setRentalAmountStatus("success");

        setTimeout(() => {
          setShowRentalAmountDialog(false);
        }, 1500);
      } else {
        throw new Error("No rental rate returned");
      }
    } catch (error) {
      console.error("Error fetching rental amount:", error);
      setRentalAmountStatus("error");
      setRentalAmountError((error as Error).message);
    }
  };

  const handlePayment = async () => {
    setProcessingPayment(true);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Prepare the bedrooms format first so we can use it later
      const bedrooms = formData.bedrooms || "1"; // Default to 1 if not specified
      const formattedBedrooms =
          bedrooms.toLowerCase() === "studio"
            ? "0"
            : bedrooms.toLowerCase() === "room"
              ? "-1"
              : Math.floor(Number(parseFormattedNumber(bedrooms))).toString();
      
      // Start both API calls in parallel
      const fetchPricelabsData = async () => {
        // Fetch revenue data from PriceLabs API
        const address = formData.address;

        toast({
          title: "Fetching Revenue Data",
          description: "Getting accurate nightly rate and occupancy data...",
        });

        // Add test=true parameter to avoid real API calls during testing
        const response = await fetch(
          `/api/public-revenue-data?address=${encodeURIComponent(address)}&bedrooms=${formattedBedrooms}&test=true`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch revenue data: ${response.statusText}`);
        }

        return await response.json();
      };

      const fetchRentalData = async () => {
        // Don't show the rental amount dialog, we'll handle it silently
        setRentalAmountStatus("loading");

        try {
          const response = await fetch("/api/deal-advisor/rental-amount", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              address: formData.address,
              propertySize: Number(parseFormattedNumber(formData.size)),
              bedrooms: Number(parseFormattedNumber(formData.bedrooms)),
              condition: formData.propertyCondition,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to fetch rental amount");
          }

          return await response.json();
        } catch (error) {
          console.error("Error fetching rental amount:", error);
          setRentalAmountStatus("error");
          setRentalAmountError((error as Error).message);
          return null;
        }
      };

      // Execute both API calls in parallel
      const [pricelabsData, rentalData] = await Promise.all([
        fetchPricelabsData(),
        fetchRentalData()
      ]);

      // Process PriceLabs data
      let updatedNightlyRate = formData.nightlyRate;
      let updatedOccupancy = formData.occupancy;

      if (
        pricelabsData.KPIsByBedroomCategory &&
        pricelabsData.KPIsByBedroomCategory[formattedBedrooms]
      ) {
        const kpiData = pricelabsData.KPIsByBedroomCategory[formattedBedrooms];
        // Use 75th percentile for nightly rate as default (good properties)
        updatedNightlyRate = kpiData.ADR75PercentileAvg.toString();
        updatedOccupancy = kpiData.AvgAdjustedOccupancy.toString();
      }

      // Process rental amount data
      let updatedLongTermRental = formData.longTermRental;
      console.log("BEFORE: longTermRental value:", updatedLongTermRental);
      
      if (rentalData && rentalData.rentalAmount) {
        try {
          console.log("API returned rental amount:", rentalData.rentalAmount);
          // Ensure we have a string before calling toString()
          const rentalAmountStr = String(rentalData.rentalAmount);
          updatedLongTermRental = formatWithThousandSeparators(rentalAmountStr);
          console.log("AFTER formatting:", updatedLongTermRental);
          setRentalAmountStatus("success");
        } catch (error) {
          console.error("Error formatting rental amount:", error);
          // If there's a formatting error, still use the numeric value directly
          updatedLongTermRental = String(rentalData.rentalAmount);
        }
      }

      // Update form data with all the new values at once
      setFormData((prev) => ({
        ...prev,
        nightlyRate: formatWithThousandSeparators(updatedNightlyRate),
        occupancy: updatedOccupancy,
        longTermRental: updatedLongTermRental,
      }));

      // Recalculate the deal score with the new data
      console.log("Calling calculateDealScoreWithUpdatedData with", {
        updatedNightlyRate,
        updatedOccupancy, 
        updatedLongTermRental
      });
      
      // If we received data from the API, explicitly use the API response value
      // instead of the formatted string to avoid any formatting issues
      const rentalAmount = rentalData && rentalData.rentalAmount 
        ? rentalData.rentalAmount.toString() 
        : updatedLongTermRental;
        
      console.log("Before calculation - rental amount:", rentalAmount);
      
      calculateDealScoreWithUpdatedData(
        updatedNightlyRate, 
        updatedOccupancy, 
        rentalAmount
      );

      setProcessingPayment(false);
      setShowPaymentModal(false);
      setReportUnlocked(true);

      toast({
        title: "Payment Successful",
        description:
          "You now have full access to the comprehensive property report with real revenue data.",
      });
    } catch (error) {
      console.error("Error during payment or data fetching:", error);
      setProcessingPayment(false);

      toast({
        title: "Error",
        description:
          "We couldn't fetch revenue data. Using estimated values instead.",
        variant: "destructive",
      });

      // Still unlock the report but use estimated values
      setShowPaymentModal(false);
      setReportUnlocked(true);
    }
  };

  const handleNewCalculation = () => {
    setShowResult(false);
    setFormData({
      address: "",
      purchasePrice: "",
      size: "",
      areaRate: "",
      bedrooms: "",
      bathrooms: "",
      parking: "",
      propertyCondition: "excellent",
      nightlyRate: "",
      occupancy: "",
      longTermRental: "",
      depositAmount: "",
      depositPercentage: "10",
      interestRate: "11",
      loanTerm: "20",
    });
    setResult(null);
    setReportUnlocked(false);
    setDealReport(null);
  };

  const checkRequiredFields = (field: string) => {
    if (
      field === "address" ||
      field === "purchasePrice" ||
      field === "size" ||
      field === "areaRate"
    ) {
      const numericValue = parseFormattedNumber(
        formData[field as keyof typeof formData] as string,
      );
      return missingFields.includes(field);
    }
    return false;
  };

  const validateForm = (showToast = false) => {
    const requiredFields = ["address", "purchasePrice", "size", "areaRate"];
    const missingFields = requiredFields.filter((field) => {
      const numericValue = parseFormattedNumber(
        formData[field as keyof typeof formData] as string,
      );
      return numericValue === "" || numericValue === "0";
    });

    if (missingFields.length > 0 && showToast) {
      toast({
        title: "Missing Information",
        description: `Please fill in the following fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
    }

    return missingFields;
  };

  // Initial validation without toast
  const missingFields = validateForm(false);

  const renderStepCounter = () => {
    return (
      <div className="mb-8 w-full">
        <div className="flex flex-col space-y-3">
          <div className="text-lg font-semibold mb-1">Property Details</div>
          <p className="text-muted-foreground text-sm">
            Enter the essential property information to calculate the deal score
          </p>
        </div>
      </div>
    );
  };

  const renderFormStep = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label
              htmlFor="address"
              className="mb-1 block"
              data-error={checkRequiredFields("address")}
            >
              Property Address
              <span className="text-red-500">*</span>
            </Label>
            <div className="flex">
              <Input
                id="address"
                placeholder="Enter the full property address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className={`flex-1 ${checkRequiredFields("address") ? "border-red-500" : ""}`}
                required
              />
            </div>
            {checkRequiredFields("address") && (
              <p className="text-red-500 text-xs mt-1">
                Please enter the property address
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="purchasePrice"
              className="mb-1 block"
              data-error={checkRequiredFields("purchasePrice")}
            >
              Asking Price
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
                className={`pl-7 ${checkRequiredFields("purchasePrice") ? "border-red-500" : ""}`}
                required
              />
            </div>
            {checkRequiredFields("purchasePrice") && (
              <p className="text-red-500 text-xs mt-1">
                Please enter the asking price
              </p>
            )}
          </div>

          <div>
            <Label
              htmlFor="size"
              className="mb-1 block"
              data-error={checkRequiredFields("size")}
            >
              Property Size
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="size"
                placeholder="0"
                value={formData.size}
                onChange={(e) => handleInputChange("size", e.target.value)}
                className={`pr-10 ${checkRequiredFields("size") ? "border-red-500" : ""}`}
                required
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label
                htmlFor="areaRate"
                data-error={checkRequiredFields("areaRate")}
              >
                Area Rate per m²
                <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 text-xs px-2 text-primary"
                onClick={handleFetchAreaRate}
              >
                Fetch Area Rate
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-muted-foreground">R</span>
              </div>
              <Input
                id="areaRate"
                placeholder="0"
                value={formData.areaRate}
                onChange={(e) => handleInputChange("areaRate", e.target.value)}
                className={`pl-7 ${checkRequiredFields("areaRate") ? "border-red-500" : ""}`}
                required
              />
            </div>
            {checkRequiredFields("areaRate") && (
              <p className="text-red-500 text-xs mt-1">
                Please enter the area rate per square meter
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="bedrooms" className="mb-1 block">
              Bedrooms
            </Label>
            <Input
              id="bedrooms"
              placeholder="0"
              value={formData.bedrooms}
              onChange={(e) => handleInputChange("bedrooms", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bathrooms" className="mb-1 block">
              Bathrooms
            </Label>
            <Input
              id="bathrooms"
              placeholder="0"
              value={formData.bathrooms}
              onChange={(e) => handleInputChange("bathrooms", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="parking" className="mb-1 block">
              Parking Spaces
            </Label>
            <Input
              id="parking"
              placeholder="0"
              value={formData.parking}
              onChange={(e) => handleInputChange("parking", e.target.value)}
            />
          </div>
        </div>

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
              <SelectValue placeholder="Select condition" />
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

  const renderComprehensiveReport = () => {
    if (!dealReport) return null;

    return (
      <div id="deal-score-report" className="space-y-8">
        {/* Property Title and Summary */}
        <div className="pb-8 text-center">
          <h2 className="text-2xl font-medium mb-5">{dealReport.address}</h2>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-6">
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm">
              {dealReport.bedrooms} Beds
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm">
              {dealReport.bathrooms} Baths
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm">
              {dealReport.propertySize} m²
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm">
              {dealReport.parking} Parking
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1 text-sm capitalize">
              {dealReport.propertyCondition} Condition
            </Badge>
          </div>

          <div className="grid grid-cols-4 max-w-3xl mx-auto mb-6">
            <div className="flex flex-col items-center">
              <span className="text-sm text-slate-500">Asking Price</span>
              <span className="text-xl font-bold">
                R{formatPrice(dealReport.askingPrice)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-slate-500">Price per m²</span>
              <span className="text-xl font-bold">
                R{formatPrice(dealReport.pricePerSqM)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-slate-500">Area Rate</span>
              <span className="text-xl font-bold">
                R{formatPrice(dealReport.areaRate)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm text-slate-500">
                Estimated Market Value
              </span>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold">
                  R{formatPrice(dealReport.estimatedValue)}
                </span>
                
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-700">
              This property is{" "}
              <span className={dealReport.percentageDifference >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {Math.abs(dealReport.percentageDifference).toFixed(1)}%{" "}
                {dealReport.percentageDifference >= 0 ? "below" : "above"}
              </span>{" "}
              the estimated market value
            </p>
          </div>
        </div>

        {/* Deal Score and Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Deal Score Card */}
          <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white">
            <div className="p-6 flex flex-col items-center">
              <h3 className="text-slate-700 font-medium mb-4">Deal Score</h3>
              <div className="relative mb-3 w-36 h-36">
                <svg className="w-36 h-36" viewBox="0 0 128 128">
                  <circle
                    className="text-slate-100 stroke-current"
                    strokeWidth="12"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className={`${dealReport.score >= 75 ? "text-green-500" : dealReport.score >= 60 ? "text-blue-500" : dealReport.score >= 40 ? "text-amber-500" : "text-red-500"} stroke-current`}
                    strokeWidth="12"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                    strokeDasharray={`${dealReport.score * 3.51} 351`}
                    strokeDashoffset="0"
                    transform="rotate(-90 64 64)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-5xl font-bold">
                  {dealReport.score}
                </div>
              </div>
              <div
                className={`text-xl font-semibold ${dealReport.score >= 75 ? "text-green-600" : dealReport.score >= 60 ? "text-blue-600" : dealReport.score >= 40 ? "text-amber-600" : "text-red-600"}`}
              >
                {dealReport.rating}
              </div>
            </div>
          </div>

          {/* Market Value Card */}
          <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-white mr-2" />
                  <h4 className="font-semibold text-white">Market Value</h4>
                </div>
                <Badge
                  className={
                    dealReport.percentageDifference >= 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {dealReport.percentageDifference >= 0
                    ? "Undervalued"
                    : "Overvalued"}
                </Badge>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-500 mb-4">
                Based on area rate of R{formatPrice(dealReport.areaRate)}/m² for
                properties in this area
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Asking Price</p>
                  <p className="font-medium">
                    R{formatPrice(dealReport.askingPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Estimated Value</p>
                  <p className="font-medium">
                    R{formatPrice(dealReport.estimatedValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rental Yield Card */}
          <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white">
            <div className="bg-gradient-to-r from-purple-600 to-violet-500 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-white mr-2" />
                  <h4 className="font-semibold text-white">Rental Yield</h4>
                </div>
                <Badge
                  className={
                    dealReport.bestInvestmentStrategy === "Short-Term Rental"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-indigo-100 text-indigo-800"
                  }
                >
                  {dealReport.bestInvestmentStrategy === "Short-Term Rental"
                    ? "Short-Term"
                    : "Long-Term"}
                </Badge>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-500 mb-4">
                {dealReport.bestInvestmentStrategy === "Short-Term Rental"
                  ? "Short-term rental offers the best returns for this property"
                  : "Long-term rental is the optimal strategy for this property"}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm text-slate-500">Short-Term Yield</p>
                  <p className="font-medium text-lg">
                    {dealReport.shortTermYield.toFixed(1)}%
                  </p>
                  <div className="text-xs text-slate-500">
                    <div>Monthly: R{formatPrice((dealReport.nightlyRate * 30 * dealReport.occupancyRate / 100))}</div>
                    <div>Annual: R{formatPrice((dealReport.nightlyRate * 365 * dealReport.occupancyRate / 100))}</div>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm text-slate-500">Long-Term Yield</p>
                  <p className="font-medium text-lg">
                    {dealReport.longTermYield.toFixed(1)}%
                  </p>
                  <div className="text-xs text-slate-500">
                    <div>Monthly: R{formatPrice(dealReport.monthlyLongTerm)}</div>
                    <div className="text-xs text-gray-500">Source: {dealReport._debugRentalSource} | Raw value: {dealReport.monthlyLongTerm}</div>
                    <div>Annual: R{formatPrice(dealReport.monthlyLongTerm * 12)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accordion for detailed sections */}
        <Accordion
          type="single"
          collapsible
          className="w-full flex flex-col items-center"
        >
          <AccordionItem value="item-1" className="w-full">
            <AccordionTrigger className="text-lg font-medium justify-start">
              Property Details
            </AccordionTrigger>
            <AccordionContent className="flex flex-col items-center">
              <div className="mb-6 w-full">
                <h3 className="text-xl font-bold mb-4 text-left">
                  Property Overview
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Address and Location Card */}
                  <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                    <div className="bg-gradient-to-r from-purple-600 to-violet-500 px-4 py-3">
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 text-white mr-2" />
                        <h4 className="font-semibold text-white">
                          Location Details
                        </h4>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Full Address
                          </p>
                          <p className="font-medium">
                            {dealReport.address}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Neighborhood
                          </p>
                          <p className="font-medium">
                            {dealReport.address.split(",")[1]?.trim() || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Specifications Card */}
                  <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3">
                      <div className="flex items-center">
                        <Home className="h-5 w-5 text-white mr-2" />
                        <h4 className="font-semibold text-white">
                          Property Specifications
                        </h4>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Size</p>
                          <p className="font-medium">
                            {dealReport.propertySize} m²
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Condition
                          </p>
                          <p className="font-medium capitalize">
                            {dealReport.propertyCondition}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Bedrooms
                          </p>
                          <p className="font-medium">{dealReport.bedrooms}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Bathrooms
                          </p>
                          <p className="font-medium">{dealReport.bathrooms}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Parking
                          </p>
                          <p className="font-medium">
                            {dealReport.parking} spaces
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold mt-8 mb-4 text-left">
                  Pricing Analysis
                </h3>
                <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3">
                    <div className="flex items-center">
                      <CircleDollarSign className="h-5 w-5 text-white mr-2" />
                      <h4 className="font-semibold text-white">
                        Market Position
                      </h4>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            Asking Price
                          </p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.askingPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Estimated Value
                          </p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.estimatedValue)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            Price per m²
                          </p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.pricePerSqM)}
                          </p>
                          <Badge
                            className={`w-fit mt-1 ${dealReport.pricePerSqM <= dealReport.areaRate ? "bg-green-500" : "bg-red-500"}`}
                          >
                            {dealReport.pricePerSqM <= dealReport.areaRate
                              ? "Below"
                              : "Above"}{" "}
                            Area Average
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Area Average Rate
                          </p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.areaRate)}/m²
                          </p>
                          
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/20 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Info className="h-4 w-4 text-primary mr-2" />
                        <span className="font-medium">Price Evaluation</span>
                      </div>
                      <p className="text-sm">
                        This property is priced{" "}
                        <span
                          className={`font-semibold ${dealReport.percentageDifference >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {Math.abs(dealReport.percentageDifference).toFixed(1)}
                          %{" "}
                          {dealReport.percentageDifference >= 0
                            ? "below"
                            : "above"}
                        </span>{" "}
                        its estimated market value of R
                        {formatPrice(dealReport.estimatedValue)} based on the
                        average price per square meter in the area.
                        {dealReport.percentageDifference >= 0
                          ? " This indicates a potential value opportunity."
                          : " This premium may be justified by unique property features or location advantages."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="w-full">
            <AccordionTrigger className="text-lg font-medium justify-start">
              Rental Analysis
            </AccordionTrigger>
            <AccordionContent className="flex flex-col items-center">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 text-left">
                  Rental Potential
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Short-Term Rental Card */}
                  <div
                    className={`rounded-xl overflow-hidden shadow-md transition-all hover:shadow-lg ${dealReport.bestInvestmentStrategy === "Short-Term Rental" ? "border-2 border-primary ring-2 ring-primary/20" : "border border-gray-200"}`}
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-white mr-2" />
                        <h4 className="font-semibold text-white">
                          Short-Term (Airbnb)
                        </h4>
                      </div>
                      {dealReport.bestInvestmentStrategy ===
                        "Short-Term Rental" && (
                        <Badge className="bg-white text-blue-600 hover:bg-gray-100">
                          RECOMMENDED
                        </Badge>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-slate-800">
                          R{formatPrice(dealReport.annualRevenueShortTerm / 12)}
                          <span className="text-base font-normal text-slate-500">
                            /month
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500">
                          Based on {dealReport.occupancyRate}% occupancy & R
                          {formatPrice(dealReport.nightlyRate)} avg nightly rate
                        </p>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">
                            Annual yield:
                          </span>
                          <span className="font-medium text-emerald-600">
                            {dealReport.shortTermYield.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">
                            Yearly income:
                          </span>
                          <span className="font-medium">
                            R{formatPrice(dealReport.annualRevenueShortTerm)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">
                            Management fee:
                          </span>
                          <span className="font-medium">15-20%</span>
                        </div>
                      </div>

                      {dealReport.bestInvestmentStrategy ===
                        "Short-Term Rental" && (
                        <div className="text-xs text-blue-600 italic">
                          Best option for this property ✓
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Long-Term Rental Card */}
                  <div
                    className={`rounded-xl overflow-hidden shadow-md transition-all hover:shadow-lg ${dealReport.bestInvestmentStrategy === "Long-Term Rental" ? "border-2 border-primary ring-2 ring-primary/20" : "border border-gray-200"}`}
                  >
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-400 px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center">
                        <Home className="h-5 w-5 text-white mr-2" />
                        <h4 className="font-semibold text-white">
                          Long-Term Rental
                        </h4>
                      </div>
                      {dealReport.bestInvestmentStrategy ===
                        "Long-Term Rental" && (
                        <Badge className="bg-white text-indigo-600 hover:bg-gray-100">
                          RECOMMENDED
                        </Badge>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-slate-800">
                          R{formatPrice(dealReport.monthlyLongTerm)}
                          <span className="text-base font-normal text-slate-500">
                            /month
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500">
                          Standard 12-month lease
                        </p>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">
                            Annual yield:
                          </span>
                          <span className="font-medium text-emerald-600">
                            {dealReport.longTermYield.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">
                            Yearly income:
                          </span>
                          <span className="font-medium">
                            R{formatPrice(dealReport.annualRentalLongTerm)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-600">
                            Management fee:
                          </span>
                          <span className="font-medium">8-10%</span>
                        </div>
                      </div>

                      {dealReport.bestInvestmentStrategy ===
                        "Long-Term Rental" && (
                        <div className="text-xs text-indigo-600 italic">
                          Best option for this property ✓
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp
                      className={`h-5 w-5 ${dealReport.bestInvestmentStrategy === "Short-Term Rental" ? "text-blue-500" : "text-indigo-500"}`}
                    />
                    <h4 className="font-semibold text-lg">
                      Investment Strategy Analysis
                    </h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {dealReport.bestInvestmentStrategy === "Short-Term Rental"
                      ? `This property offers better returns as a short-term rental, with a yield of ${dealReport.shortTermYield.toFixed(1)}% compared to ${dealReport.longTermYield.toFixed(1)}% for long-term. The premium location and amenities make it attractive for holiday or business travelers.`
                      : `This property is best suited for long-term rental, offering stable returns of ${dealReport.longTermYield.toFixed(1)}% compared to ${dealReport.shortTermYield.toFixed(1)}% for short-term. The location and property characteristics appeal more to residential tenants seeking stability.`}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="w-full">
            <AccordionTrigger className="text-lg font-medium justify-start">
              Financial Analysis
            </AccordionTrigger>
            <AccordionContent className="flex flex-col items-center">
              <div className="mb-6 w-full">
                <h3 className="text-xl font-bold mb-4 text-left">
                  Financial Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Financing Card */}
                  <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-3">
                      <div className="flex items-center">
                        <Landmark className="h-5 w-5 text-white mr-2" />
                        <h4 className="font-semibold text-white">
                          Financing Details
                        </h4>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Purchase Price
                          </p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.askingPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Deposit
                          </p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.depositAmount)} (
                            {dealReport.depositPercentage}%)
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Loan Amount
                          </p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.loanAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Interest Rate
                          </p>
                          <p className="font-medium">
                            {dealReport.interestRate}%
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Loan Term
                          </p>
                          <p className="font-medium">
                            {dealReport.loanTerm} years
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Monthly Payment
                          </p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.monthlyPayment)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Expenses Card */}
                  <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                    <div className="bg-gradient-to-r from-rose-500 to-pink-400 px-4 py-3">
                      <div className="flex items-center">
                        <Receipt className="h-5 w-5 text-white mr-2" />
                        <h4 className="font-semibold text-white">
                          Monthly Expenses
                        </h4>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Bond Payment
                          </p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.monthlyPayment)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Rates & Taxes
                          </p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.monthlyRates)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Levy</p>
                          <p className="font-medium">
                            R{formatPrice(dealReport.levy)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Fixed Costs
                          </p>
                          <p className="font-medium">
                            R
                            {formatPrice(
                              dealReport.monthlyPayment +
                                dealReport.estimatedMonthlyCosts,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold mt-8 mb-4 text-left">
                  Cash Flow Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Short-Term Cash Flow Card */}
                  <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-3">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-white mr-2" />
                        <h4 className="font-semibold text-white">
                          Short-Term Rental
                        </h4>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">
                          Monthly Revenue
                        </p>
                        <p className="font-medium">
                          R{formatPrice(dealReport.annualRevenueShortTerm / 12)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">
                          Monthly Expenses
                        </p>
                        <p className="font-medium">
                          R
                          {formatPrice(
                            dealReport.monthlyPayment +
                              dealReport.estimatedMonthlyCosts,
                          )}
                        </p>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center">
                        <p className="font-medium">Monthly Cash Flow</p>
                        <p
                          className={`font-medium ${dealReport.cashFlowShortTerm >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          R{formatPrice(dealReport.cashFlowShortTerm)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Long-Term Cash Flow Card */}
                  <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-400 px-4 py-3">
                      <div className="flex items-center">
                        <Home className="h-5 w-5 text-white mr-2" />
                        <h4 className="font-semibold text-white">
                          Long-Term Rental
                        </h4>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">
                          Monthly Revenue
                        </p>
                        <p className="font-medium">
                          R{formatPrice(dealReport.monthlyLongTerm)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">
                          Monthly Expenses
                        </p>
                        <p className="font-medium">
                          R
                          {formatPrice(
                            dealReport.monthlyPayment +
                              dealReport.estimatedMonthlyCosts,
                          )}
                        </p>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center">
                        <p className="font-medium">Monthly Cash Flow</p>
                        <p
                          className={`font-medium ${dealReport.cashFlowLongTerm >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          R{formatPrice(dealReport.cashFlowLongTerm)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Return on Investment Card */}
                  <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-400 px-4 py-3">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-white mr-2" />
                        <h4 className="font-semibold text-white">
                          Return on Investment
                        </h4>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">
                          Cash on Cash Return
                        </p>
                        <p className="font-medium">
                          {(
                            ((dealReport.cashFlowShortTerm * 12) /
                              dealReport.depositAmount) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-slate-600">Cap Rate</p>
                        <p className="font-medium">
                          {(
                            ((dealReport.annualRevenueShortTerm -
                              dealReport.estimatedMonthlyCosts * 12) /
                              dealReport.askingPrice) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center">
                        <p className="font-medium">Best Strategy</p>
                        <p className="font-medium text-primary">
                          {dealReport.bestInvestmentStrategy}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="w-full">
            <AccordionTrigger className="text-lg font-medium justify-start">
              Comparable Properties
            </AccordionTrigger>
            <AccordionContent className="flex flex-col items-center">
              <div className="mb-6 w-full">
                <h3 className="text-xl font-bold mb-4 text-left">
                  Market Comparisons
                </h3>

                <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 mb-6">
                  <div className="bg-gradient-to-r from-slate-700 to-gray-600 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BarChart3 className="h-5 w-5 text-white mr-2" />
                        <h4 className="font-semibold text-white">
                          Recently Sold Properties
                        </h4>
                      </div>
                      <div>
                        <Badge className="bg-white text-slate-700 hover:bg-gray-100">
                          Average: R
                          {formatPrice(dealReport.avgComparableSalesPrice)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">
                              Address
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">
                              Sale Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">
                              Size
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">
                              Price/m²
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">
                              Beds
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">
                              Sale Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider">
                              Similarity
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {dealReport.comparableProperties.map(
                            (property, index) => (
                              <tr
                                key={index}
                                className={index % 2 === 0 ? "bg-muted/20" : ""}
                              >
                                <td className="px-4 py-3 text-sm">
                                  {property.address}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  R{formatPrice(property.salePrice)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {property.size} m²
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  R{formatPrice(property.pricePerSqM)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {property.bedrooms}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {property.saleDate}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge
                                    className={
                                      property.similarity === "Similar"
                                        ? "bg-green-500"
                                        : "bg-blue-500"
                                    }
                                  >
                                    {property.similarity}
                                  </Badge>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
                  <div className="bg-gradient-to-r from-cyan-600 to-sky-500 px-4 py-3">
                    <div className="flex items-center">
                      <Info className="h-5 w-5 text-white mr-2" />
                      <h4 className="font-semibold text-white">
                        Market Position Analysis
                      </h4>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div className="rounded-lg bg-muted/20 p-4">
                        <h5 className="font-medium mb-2">
                          Price Range in Area
                        </h5>
                        <p className="text-sm text-slate-700">
                          Properties similar to this one are typically selling
                          in the range of {dealReport.recentSalesRange}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/20 p-4">
                        <h5 className="font-medium mb-2">Value Assessment</h5>
                        <p className="text-sm text-slate-700">
                          This property is{" "}
                          <span
                            className={
                              dealReport.percentageDifference >= 0
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {Math.abs(dealReport.percentageDifference).toFixed(
                              1,
                            )}
                            %{" "}
                            {dealReport.percentageDifference >= 0
                              ? "below"
                              : "above"}
                          </span>{" "}
                          the estimated market value
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/20 rounded-lg">
                      <p className="text-sm">
                        {dealReport.percentageDifference >= 0
                          ? `The current asking price of R${formatPrice(dealReport.askingPrice)} positions this property as a potential value buy, being ${Math.abs(dealReport.percentageDifference).toFixed(1)}% below the estimated market value of R${formatPrice(dealReport.estimatedValue)}. This represents a promising investment opportunity if the property condition aligns with your inspection.`
                          : `The current asking price of R${formatPrice(dealReport.askingPrice)} is ${Math.abs(dealReport.percentageDifference).toFixed(1)}% higher than the estimated market value of R${formatPrice(dealReport.estimatedValue)}. This premium pricing may warrant negotiation based on comparable properties in the area and current market conditions.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Report Footer */}
        <div className="pt-6 border-t text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center">
            <img
              src="/proply-favicon.png"
              alt="Proply Logo"
              className="h-4 w-4 mr-2"
            />
            <span>Proply Deal Score™ Report - Generated on {dealReport.reportDate}</span>
          </div>
        </div>
      </div>
    );
  };

  // Rental Amount Progress Dialog Component
  const RentalAmountProgressDialog = () => {
    return (
      <Dialog
        open={showRentalAmountDialog}
        onOpenChange={setShowRentalAmountDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Fetching Rental Amount</DialogTitle>
            <DialogDescription>
              {rentalAmountStatus === "loading" &&
                "Analyzing rental data for similar properties in the area..."}
              {rentalAmountStatus === "success" &&
                "Successfully retrieved rental data!"}
              {rentalAmountStatus === "error" &&
                `Error fetching data: ${rentalAmountError || "Unknown error"}`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 flex flex-col items-center justify-center">
            {rentalAmountStatus === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-center text-sm text-muted-foreground">
                  This may take a few moments as we analyze comparable
                  properties
                </p>
              </div>
            )}

            {rentalAmountStatus === "success" && (
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <p className="text-center text-green-600 font-medium">
                  Rental data updated successfully!
                </p>
              </div>
            )}

            {rentalAmountStatus === "error" && (
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <p className="text-center text-red-600 font-medium">
                  Failed to fetch rental data.
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  {rentalAmountError ||
                    "An unknown error occurred. Please try again."}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
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

        <div className="flex-1 relative z-10 flex flex-col items-center justify-center pt-8">
          <div className="container flex flex-col items-center px-2 py-8 text-center md:py-16 lg:py-24 max-w-[1600px]">
            <div className="w-full max-w-[1400px] space-y-4">
              <h1 className="text-3xl font-bold sm:text-4xl md:text5xl lg:text-6xl">
                Proply Deal Score™
              </h1>
              <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl">
                Enter the property details below to get an instant deal score
                based on market data, area rates, and rental yields.
              </p>
            </div>

            <Card
              className={`mx-auto mt-12 w-full ${showResult ? "max-w-[1200px]" : "max-w-[600px]"} bg-background rounded-lg p-6`}
            >
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
                    <Button type="submit" className="ml-auto">
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
                  {/* Render the comprehensive report */}
                  {renderComprehensiveReport()}

                  {/* Download button when report is unlocked */}
                  {reportUnlocked && (
                    <div className="mt-8 flex justify-center">
                      <HTMLToPDFButton
                        elementId="deal-score-report"
                        filename={`Proply_Deal_Score_${dealReport?.address?.split(",")[0] || "Report"}.pdf`}
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
            </Card>
          </div>
        </div>
        <div className="flex justify-center my-4">
          <ChevronDown className="text-[#1BA3FF] h-16 w-16 animate-bounce" />
        </div>
        <div className="py-16 space-y-24 flex flex-col items-center justify-center w-full">
          <section className="container px-4 mx-auto max-w-7xl">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Stop The Guessing Game
                <br />
                Make The Right Offer, The First Time
              </h2>
              <p className="text-xl text-muted-foreground">
                Property buyers like you face these challenges every day. We've
                built the solution you've been looking for.
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

          <section className="bg-muted/30 py-16 w-full">
            <div className="container px-4 mx-auto max-w-7xl">
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

          <section className="bg-primary/5 py-16 border-y w-full">
            <div className="container px-4 mx-auto max-w-7xl">
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

          <section className="container px-4 mx-auto max-w-7xl">
            <div className="max-w-4xl mx-auto bg-card rounded-lg p-8 md:p-12 shadow-lg border border-border/50 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to Make Smarter Property Investments?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of successful investors who are finding better
                deals, maximizing returns, and building wealth through property.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="text-lg px-8 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 border-blue-500 text-blue-500 hover:bg-blue-50"
                >
                  See How It Works
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

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
    </>
  );
}
