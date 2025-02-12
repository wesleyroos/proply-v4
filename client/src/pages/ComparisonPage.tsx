import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PropertyForm from "../components/PropertyForm";
import ComparisonChart from "../components/ComparisonChart";
import { useUser } from "../hooks/use-user";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@radix-ui/react-dropdown-menu'
import { FileText, Sparkles } from 'lucide-react'


export default function ComparisonPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [address, setAddress] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null,
  );
  const [revenueData, setRevenueData] = useState<any>(null);
  const queryClient = useQueryClient();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false); // Added state for upgrade modal
  const hasProAccess = false; // Replace with actual logic to determine pro access


  interface ComparisonData {
    title: string;
    longTermMonthly: number;
    shortTermMonthly: number;
    longTermAnnual: number;
    shortTermAnnual: number;
    shortTermAfterFees: number;
    breakEvenOccupancy: number;
    shortTermNightly: number;
    managementFee: number;
    annualOccupancy: number;
    bedrooms?: string;
    bathrooms?: string;
  }

  const handleCompare = (data: any) => {
    setAddress(data.address);
    setTimeout(() => {
      const yOffset = -20;
      const element = document.getElementById("comparison-results");
      if (element) {
        const y =
          element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 100);

    const longTermMonthly = parseFloat(data.longTermRental);
    const longTermAnnual = longTermMonthly * 12;

    const shortTermNightly = parseFloat(data.shortTermNightly);
    const occupancyRate = parseFloat(data.annualOccupancy) / 100;
    const managementFee = parseFloat(data.managementFee) / 100;

    const SEASONALITY_FACTORS = [
      2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03,
    ];

    const shortTermAnnual = Array(12).fill(0).reduce((sum, _, month) => {
      const daysInMonth = new Date(2024, month + 1, 0).getDate();
      const seasonalMultiplier = SEASONALITY_FACTORS[month];
      return sum + (shortTermNightly * seasonalMultiplier * daysInMonth * occupancyRate);
    }, 0);
    const shortTermMonthly = shortTermAnnual / 12;

    const platformFeeRate = managementFee > 0 ? 0.15 : 0.03;
    const platformFeeAmount = shortTermAnnual * platformFeeRate;
    const shortTermAfterPlatformFee = shortTermAnnual * (1 - platformFeeRate);

    const managementFeeAmount = managementFee > 0 ? shortTermAfterPlatformFee * managementFee : 0;
    const shortTermAfterFees = shortTermAfterPlatformFee - managementFeeAmount;

    const platformFeeMultiplier = managementFee > 0 ? 0.85 : 0.97;
    const managementFeeMultiplier = 1 - managementFee;
    const netDailyRateNeeded =
      longTermAnnual / (365 * platformFeeMultiplier * managementFeeMultiplier);
    const breakEvenOccupancy = (netDailyRateNeeded / shortTermNightly) * 100;

    setComparisonData({
      title: data.title,
      longTermMonthly,
      shortTermMonthly,
      longTermAnnual,
      shortTermAnnual,
      shortTermAfterFees,
      breakEvenOccupancy: Math.round(breakEvenOccupancy * 10) / 10,
      shortTermNightly,
      managementFee,
      annualOccupancy: parseFloat(data.annualOccupancy),
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
    });

    console.log("Fetching revenue data for bedrooms:", data.bedrooms);
    fetch(`/api/revenue/${data.bedrooms}`)
      .then(res => res.json())
      .then(data => {
        console.log("Revenue API Response:", data);
        if (data.KPIsByBedroomCategory?.[data.bedrooms]) {
          const result = data.KPIsByBedroomCategory[data.bedrooms];
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
              revparPosition: result.RevPARPositionPercentile
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
              revparPosition: result.RevPARPositionPercentile
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
              revparPosition: result.RevPARPositionPercentile
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
              revparPosition: result.RevPARPositionPercentile
            },
          });
        }
      });
  };

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const generatePropertyPreviewPDF = async (data: ComparisonData | null, withBranding: boolean, user: any) => {
    //Implementation to generate PDF here.  This will likely involve a fetch call to an API endpoint.
    console.log("Generating PDF...", data, withBranding, user);
    // Placeholder for actual PDF generation logic
  };


  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#262626] mb-6">
          Proply Rent Compare
        </h1>

        <div className="max-w-4xl space-y-6">
          <Card>
            <CardContent className="pt-6">
              <PropertyForm onSubmit={handleCompare} queryClient={queryClient} />
            </CardContent>
          </Card>

          {comparisonData && (
            <Card id="comparison-results">
              <CardContent className="pt-6">
                <ComparisonChart data={comparisonData} address={address} />
                {revenueData && (
                  <div>
                    <h2 className="text-xl font-medium mb-4">Percentile Data</h2>
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                        <div>
                          <h4 className="font-medium mb-2">Market Stats</h4>
                          <p>RevPAR: {formatter.format(revenueData?.["50"].revpar || 0)}</p>
                          <p>RevPAM: {formatter.format(revenueData?.["50"].revpam || 0)}</p>
                          <p>Avg Lead Time: {revenueData?.["50"].leadTime || 0} days</p>
                          <p>Avg Length of Stay: {revenueData?.["50"].stayLength || 0} days</p>
                          <p>Active Listings: {revenueData?.["50"].activeListings || 0}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Market Position</h4>
                          <p>Rate Position: {revenueData?.["50"].ratePosition || 0}%</p>
                          <p>RevPAR Position: {revenueData?.["50"].revparPosition || 0}%</p>
                          <p>Seasonality Index: {revenueData?.["50"].seasonalityIndex || 0}</p>
                          <p>Demand Score: {revenueData?.["50"].demandScore || 0}</p>
                          <p>Occupancy: {revenueData?.["50"].occupancy.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {comparisonData && (
            <div className="flex justify-end gap-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/properties", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({
                          title: comparisonData.title,
                          address,
                          bedrooms: comparisonData.bedrooms || "",
                          bathrooms: comparisonData.bathrooms || "",
                          longTermRental: comparisonData.longTermMonthly.toString(),
                          annualEscalation: "0",
                          shortTermNightly: comparisonData.shortTermNightly.toString(),
                          annualOccupancy: comparisonData.annualOccupancy.toString(),
                          managementFee: (comparisonData.managementFee * 100).toString(),
                          longTermMonthly: comparisonData.longTermMonthly,
                          longTermAnnual: comparisonData.longTermAnnual,
                          shortTermMonthly: comparisonData.shortTermMonthly,
                          shortTermAnnual: comparisonData.shortTermAnnual,
                          shortTermAfterFees: comparisonData.shortTermAfterFees,
                          breakEvenOccupancy: comparisonData.breakEvenOccupancy,
                        }),
                      });

                      if (!response.ok) {
                        throw new Error("Failed to save property");
                      }

                      toast({
                        variant: "success",
                        title: "Success",
                        description: "Property saved successfully",
                        duration: 3000,
                      });
                    } catch (error) {
                      console.error("Error saving property:", error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to save property",
                        duration: 3000,
                      });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save Property
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 text-white">
                      <FileText className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => generatePropertyPreviewPDF(comparisonData, false, user)}>
                      <FileText className="mr-2" />
                      Without Branding
                    </DropdownMenuItem>
                    {hasProAccess ? (
                      <DropdownMenuItem onClick={() => generatePropertyPreviewPDF(comparisonData, true, user)}>
                        <FileText className="mr-2" />
                        With Branding
                        <div className="ml-2 flex items-center gap-1">
                          <span className="text-xs font-semibold text-[#3B82F6]">PRO</span>
                          <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                        </div>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => setShowUpgradeModal(true)}>
                        <FileText className="mr-2" />
                        With Branding
                        <div className="ml-2 flex items-center gap-1">
                          <span className="text-xs font-semibold text-[#3B82F6]">PRO</span>
                          <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                        </div>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}