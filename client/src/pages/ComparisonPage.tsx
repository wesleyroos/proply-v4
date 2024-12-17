import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PropertyForm from "../components/PropertyForm";
import ComparisonChart from "../components/ComparisonChart";
import { useUser } from "../hooks/use-user";

export default function ComparisonPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);

  interface ComparisonData {
    longTermMonthly: number;
    shortTermMonthly: number;
    longTermAnnual: number;
    shortTermAnnual: number;
    shortTermAfterFees: number;
    breakEvenOccupancy: number;
    shortTermNightly: number;
    managementFee: number;
  }

  const handleCompare = (data: any) => {
    // Calculate comparison metrics
    // Long term calculation (simple monthly × 12)
    const longTermMonthly = parseFloat(data.longTermRental);
    const longTermAnnual = longTermMonthly * 12;
    
    // Short term calculations
    const shortTermNightly = parseFloat(data.shortTermNightly);
    const occupancyRate = parseFloat(data.annualOccupancy) / 100;
    const managementFee = parseFloat(data.managementFee) / 100;
    
    // Calculate platform fees (Airbnb/booking fees)
    const platformFeeRate = managementFee > 0 ? 0.15 : 0.03; // 15% if managed, 3% if self-managed
    const feeAdjustedNightlyRate = shortTermNightly * (1 - platformFeeRate);
    
    // Calculate base annual revenue after platform fees
    const shortTermMonthly = (feeAdjustedNightlyRate * 365 * occupancyRate) / 12;
    const shortTermAnnual = shortTermMonthly * 12;
    
    // Calculate and apply management fee if present
    const managementFeeAmount = managementFee > 0 ? shortTermAnnual * managementFee : 0;
    const shortTermAfterFees = shortTermAnnual - managementFeeAmount;
    
    // Calculate break-even occupancy
    const breakEvenOccupancy = (longTermAnnual / (shortTermNightly * 365)) * 100;

    setComparisonData({
      longTermMonthly,
      shortTermMonthly,
      longTermAnnual,
      shortTermAnnual,
      shortTermAfterFees,
      breakEvenOccupancy: Math.round(breakEvenOccupancy * 10) / 10,
      shortTermNightly, 
      managementFee,
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-4">
      <nav className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => setLocation("/")}>
          Back
        </Button>
        <h1 className="text-xl font-bold text-[#262626] ml-4">
          Property Comparison
        </h1>
      </nav>

      <div className="max-w-lg mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <PropertyForm onSubmit={handleCompare} />
          </CardContent>
        </Card>

        {comparisonData && (
          <Card>
            <CardContent className="pt-6">
              <ComparisonChart data={comparisonData} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}