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

// Define types at the top level
interface FormData {
  address: string;
  purchasePrice: string;
  size: string;
  areaRate: string;
  bedrooms: string;
  propertyCondition: string;
  nightlyRate: string;
  occupancy: string;
  longTermRental: string;
  depositAmount: string;
  depositPercentage: string;
  interestRate: string;
  loanTerm: string;
}

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

interface DealScoreData {
  dealScore: number;
  priceDiff: number;
  pricePerSqmDiff: number;
  propertyCondition: string;
  shortTermYield: number;
  longTermYield: number;
  priceVsMarketScore: number;
  pricePerSqmScore: number;
  propertyConditionScore: number;
  shortTermYieldScore: number;
  longTermYieldScore: number;
  weightedPriceVsMarket: number;
  weightedPricePerSqm: number;
  weightedPropertyCondition: number;
  weightedShortTermYield: number;
  weightedLongTermYield: number;
}

interface PropertyMetrics {
  shortTerm: {
    monthly: number;
    yearly: number;
    yield: number;
  };
  longTerm: {
    monthly: number;
    yearly: number;
    yield: number;
  };
  isShortTermRecommended: boolean;
}

// Helper functions for score calculations
const calculateScore = (value: number, min: number, max: number, lowScore: number, highScore: number): number => {
  if (value <= min) return lowScore;
  if (value >= max) return highScore;
  return lowScore + ((value - min) / (max - min)) * (highScore - lowScore);
};

const calculatePropertyConditionScore = (condition: string): number => {
  switch (condition) {
    case "excellent": return 90;
    case "good": return 70; 
    case "fair": return 50;
    case "poor": return 30;
    default: return 50;
  }
};

export default function DealScorePage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    address: "",
    purchasePrice: "",
    size: "",
    areaRate: "",
    bedrooms: "",
    propertyCondition: "excellent",
    nightlyRate: "",
    occupancy: "",
    longTermRental: "",
    depositAmount: "",
    depositPercentage: "",
    interestRate: "11.75",
    loanTerm: "20",
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
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [dealScoreData, setDealScoreData] = useState<DealScoreData | null>(null);

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

  const handlePrefill = () => {
    setFormData({
      address: "27 Leeuwen St, Cape Town City Centre, 8001",
      purchasePrice: formatWithThousandSeparators("3500000"),
      size: formatWithThousandSeparators("85"),
      areaRate: formatWithThousandSeparators("45000"),
      bedrooms: "2",
      propertyCondition: "excellent",
      nightlyRate: formatWithThousandSeparators("2500"),
      occupancy: "70",
      longTermRental: formatWithThousandSeparators("25000"),
      depositAmount: formatWithThousandSeparators("350000"),
      depositPercentage: "10",
      interestRate: "11",
      loanTerm: "20",
    });
  };

  const formatWithThousandSeparators = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, '');
    if (!numericValue) return '';
    const parts = numericValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
  };

  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, '');
  };

  const parseFormattedValue = (value: string): number => {
    if (!value) return 0;
    return Number(value.toString().replace(/[^\d.]/g, '')) || 0;
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

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsCalculating(true);
    setTimeout(() => {
      setSubmittedData(formData);
      setShowResults(true);
      setIsCalculating(false);
      calculateDealScore();
    }, 1000);
  };

  const calculateDealScore = () => {
    if (!submittedData) return;

    try {
      // Parse numeric values with default fallbacks
      const purchasePrice = parseFormattedValue(submittedData.purchasePrice);
      const size = parseFormattedValue(submittedData.size);
      const areaRate = parseFormattedValue(submittedData.areaRate);  
      const nightlyRate = parseFormattedValue(submittedData.nightlyRate);
      const occupancy = parseFormattedValue(submittedData.occupancy);
      const longTermRental = parseFormattedValue(submittedData.longTermRental);

      // Validate key inputs
      if (purchasePrice <= 0 || size <= 0 || areaRate <= 0) {
        toast({
          title: "Invalid input values", 
          description: "Please check price, size and area rate values",
          variant: "destructive",
        });
        return;
      }

      // Calculate market price and differences
      const marketPrice = size * areaRate;
      const priceDiff = ((purchasePrice - marketPrice) / marketPrice) * 100;
      const pricePerSqmDiff = ((purchasePrice / size) - areaRate) / areaRate * 100;

      // Calculate rental yields
      const annualShortTermRevenue = nightlyRate * 365 * (occupancy / 100); 
      const annualLongTermRevenue = longTermRental * 12;
      const shortTermYield = (annualShortTermRevenue / purchasePrice) * 100;
      const longTermYield = (annualLongTermRevenue / purchasePrice) * 100;

      // Score calculations (0-100 scale)
      const priceVsMarketScore = calculateScore(priceDiff, -10, 10, 30, 70);
      const pricePerSqmScore = calculateScore(pricePerSqmDiff, -10, 10, 30, 70);
      const propertyConditionScore = calculatePropertyConditionScore(submittedData.propertyCondition);
      const shortTermYieldScore = calculateScore(shortTermYield, 0, 20, 30, 70);
      const longTermYieldScore = calculateScore(longTermYield, 0, 20, 30, 70);

      // Apply weightings
      const weightedPriceVsMarket = priceVsMarketScore * 0.3; // 30%
      const weightedPricePerSqm = pricePerSqmScore * 0.2; // 20%
      const weightedPropertyCondition = propertyConditionScore * 0.1; // 10%
      const weightedShortTermYield = shortTermYieldScore * 0.2; // 20%
      const weightedLongTermYield = longTermYieldScore * 0.2; // 20%

      // Calculate final score
      const finalScore = Math.round(
        weightedPriceVsMarket +
        weightedPricePerSqm +
        weightedPropertyCondition +
        weightedShortTermYield +
        weightedLongTermYield
      );

      // Store calculated values
      const scoreData = {
        dealScore: finalScore,
        priceDiff,
        pricePerSqmDiff,
        propertyCondition: submittedData.propertyCondition,
        shortTermYield,
        longTermYield,
        priceVsMarketScore,
        pricePerSqmScore,
        propertyConditionScore,
        shortTermYieldScore,
        longTermYieldScore,
        weightedPriceVsMarket,
        weightedPricePerSqm,
        weightedPropertyCondition,
        weightedShortTermYield,
        weightedLongTermYield
      };

      setDealScoreData(scoreData);

      // Only set window property in development
      if (process.env.NODE_ENV === 'development') {
        (window as any).dealScoreData = scoreData;
      }
    } catch (error) {
      console.error('Error calculating deal score:', error);
      toast({
        title: "Calculation Error",
        description: "An error occurred while calculating the deal score",
        variant: "destructive",
      });
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

      const formattedBedrooms = bedrooms.toLowerCase() === "studio" ? "0" :
                               bedrooms.toLowerCase() === "room" ? "-1" :
                               Math.floor(Number(bedrooms)).toString();

      const response = await fetch(
        `/api/revenue-data?address=${encodeURIComponent(address)}&bedrooms=${formattedBedrooms}`
      );

      const data = await response.json();

      if (data.KPIsByBedroomCategory?.[formattedBedrooms]) {
        const result = data.KPIsByBedroomCategory[formattedBedrooms];
        setRevenueData({
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
          }
        });
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

  return (
    <PageTransition>
      <div className="container p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Deal Score Calculator</h1>
          <Button onClick={handlePrefill} variant="outline">
            Prefill Demo Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 1 && "Property Details"}
                  {currentStep === 2 && "Rental Details"}
                  {currentStep === 3 && "Financing Details"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">

                  <div className="flex justify-between gap-4 mt-6">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(currentStep - 1)}
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

          {dealScoreData && (
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Deal Score Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">
                      Deal Score: {dealScoreData.dealScore}
                    </h2>
                    <Badge
                      className={`
                        ${
                          dealScoreData.dealScore >= 70
                            ? "bg-green-500"
                            : dealScoreData.dealScore >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }
                        text-white px-4 py-1
                      `}
                    >
                      {dealScoreData.dealScore >= 70
                        ? "Good Deal"
                        : dealScoreData.dealScore >= 50
                        ? "Fair Deal"
                        : "Poor Deal"}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Price Analysis</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">vs Market Price</p>
                          <p className="font-medium">
                            {dealScoreData.priceDiff.toFixed(1)}%
                            {dealScoreData.priceDiff > 0 ? " above" : " below"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">vs Area Rate</p>
                          <p className="font-medium">
                            {dealScoreData.pricePerSqmDiff.toFixed(1)}%
                            {dealScoreData.pricePerSqmDiff > 0 ? " above" : " below"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Yield Analysis</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Short Term Yield</p>
                          <p className="font-medium">{dealScoreData.shortTermYield.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Long Term Yield</p>
                          <p className="font-medium">{dealScoreData.longTermYield.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Score Breakdown</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Price vs Market (30%)</span>
                          <span>{dealScoreData.weightedPriceVsMarket.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price per m² (20%)</span>
                          <span>{dealScoreData.weightedPricePerSqm.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Property Condition (10%)</span>
                          <span>{dealScoreData.weightedPropertyCondition.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Short Term Yield (20%)</span>
                          <span>{dealScoreData.weightedShortTermYield.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Long Term Yield (20%)</span>
                          <span>{dealScoreData.weightedLongTermYield.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Modals */}
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
        />

        {/* Revenue Data Dialog */}
        <Dialog open={showPercentileDialog} onOpenChange={setShowPercentileDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Revenue Data</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {revenueData && Object.entries(revenueData).map(([percentile, data]) => (
                <Button
                  key={percentile}
                  onClick={() => applyPercentileData(percentile as "25" | "50" | "75" | "90")}
                  variant="outline"
                  className="p-4"
                >
                  <div>
                    <div className="font-semibold mb-1">{percentile}th Percentile</div>
                    <div className="text-sm text-gray-500">
                      ADR: R{data.adr.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Occupancy: {data.occupancy.toFixed(0)}%
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}