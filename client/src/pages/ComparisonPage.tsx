import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PropertyForm from "../components/PropertyForm";
import ComparisonChart from "../components/ComparisonChart";
import { useUser } from "../hooks/use-user";
import { useQueryClient } from "@tanstack/react-query"; // Added import


export default function ComparisonPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [address, setAddress] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null,
  );
  const [revenueData, setRevenueData] = useState<any>(null); // Added revenueData state
  const queryClient = useQueryClient(); // Added useQueryClient hook

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
    setAddress(data.address); // Update address when form is submitted
    // Scroll to results after a brief delay to ensure rendering
    setTimeout(() => {
      const yOffset = -20;
      const element = document.getElementById("comparison-results");
      if (element) {
        const y =
          element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 100);

    // Calculate comparison metrics
    // Long term calculation (simple monthly × 12)
    const longTermMonthly = parseFloat(data.longTermRental);
    const longTermAnnual = longTermMonthly * 12;

    // Short term calculations
    const shortTermNightly = parseFloat(data.shortTermNightly);
    const occupancyRate = parseFloat(data.annualOccupancy) / 100;
    const managementFee = parseFloat(data.managementFee) / 100;

    // Define SEASONALITY_FACTORS constant
    const SEASONALITY_FACTORS = [
      2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03,
    ];

    // Calculate annual revenue with seasonality
    const shortTermAnnual = Array(12).fill(0).reduce((sum, _, month) => {
      const daysInMonth = new Date(2024, month + 1, 0).getDate();
      const seasonalMultiplier = SEASONALITY_FACTORS[month];
      return sum + (shortTermNightly * seasonalMultiplier * daysInMonth * occupancyRate);
    }, 0);
    const shortTermMonthly = shortTermAnnual / 12;

    // Calculate platform fees (Airbnb/booking fees)
    const platformFeeRate = managementFee > 0 ? 0.15 : 0.03; // 15% if managed, 3% if self-managed
    const platformFeeAmount = shortTermAnnual * platformFeeRate;
    const shortTermAfterPlatformFee = shortTermAnnual * (1 - platformFeeRate);

    // Calculate management fee based on revenue after platform fees 
    const managementFeeAmount = managementFee > 0 ? shortTermAfterPlatformFee * managementFee : 0;
    const shortTermAfterFees = shortTermAfterPlatformFee - managementFeeAmount;

    // Calculate break-even occupancy based on net revenue after all fees
    const platformFeeMultiplier = managementFee > 0 ? 0.85 : 0.97; // 15% or 3% platform fee
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

    //Added to fetch revenue data after comparison data is set.  Assumes data.bedrooms is available.
    fetch(`/api/revenue/${data.bedrooms}`) // Replace with your actual API endpoint
      .then(res => res.json())
      .then(data => {
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

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#262626] mb-6">
          Proply Rent Compare
        </h1>

        <div className="max-w-4xl space-y-6">
          <Card>
            <CardContent className="pt-6">
              <PropertyForm onSubmit={handleCompare} queryClient={queryClient} /> {/* Pass queryClient */}
            </CardContent>
          </Card>

          {comparisonData && (
            <Card id="comparison-results"> {/* Added ID for scrolling */}
              <CardContent className="pt-6">
                <ComparisonChart data={comparisonData} address={address} />
                {revenueData && (
                  <div>
                    <h2 className="text-xl font-medium mb-4">Revenue Performance Data</h2>
                    <div className="mt-4 space-y-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left py-3 px-4">Metric</th>
                              {["25th", "50th", "75th", "90th"].map(percentile => (
                                <th key={percentile} className="text-right py-3 px-4">{percentile} Percentile</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-3 px-4">Average Daily Rate</td>
                              {["25", "50", "75", "90"].map(percentile => (
                                <td key={percentile} className="text-right py-3 px-4">{formatter.format(revenueData[percentile].adr)}</td>
                              ))}
                            </tr>
                            <tr className="border-b bg-gray-50">
                              <td className="py-3 px-4">RevPAR</td>
                              {["25", "50", "75", "90"].map(percentile => (
                                <td key={percentile} className="text-right py-3 px-4">{formatter.format(revenueData[percentile].revpar)}</td>
                              ))}
                            </tr>
                            <tr className="border-b">
                              <td className="py-3 px-4">RevPAM</td>
                              {["25", "50", "75", "90"].map(percentile => (
                                <td key={percentile} className="text-right py-3 px-4">{formatter.format(revenueData[percentile].revpam)}</td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="font-medium">Market Performance</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Average Lead Time:</span>
                              <span>{revenueData["50"].leadTime} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Average Stay Length:</span>
                              <span>{revenueData["50"].stayLength} days</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Active Listings:</span>
                              <span>{revenueData["50"].activeListings}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Average Occupancy:</span>
                              <span>{revenueData["50"].occupancy.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium">Market Indicators</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Rate Position:</span>
                              <span>{revenueData["50"].ratePosition}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>RevPAR Position:</span>
                              <span>{revenueData["50"].revparPosition}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Seasonality Index:</span>
                              <span>{revenueData["50"].seasonalityIndex}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Demand Score:</span>
                              <span>{revenueData["50"].demandScore}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}