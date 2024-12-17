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
    breakEvenOccupancy: number;
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
    
    // Adjust nightly rate based on management fee presence
    const feeAdjustedNightlyRate = managementFee > 0 
      ? shortTermNightly * 0.85  // 15% Airbnb fee for professionally managed
      : shortTermNightly * 0.97; // 3% fee for self-managed
    
    // Calculate monthly and annual revenue
    const shortTermMonthly = (feeAdjustedNightlyRate * 365 * occupancyRate) / 12;
    const shortTermAnnual = shortTermMonthly * 12;
    
    // Apply management fee if present
    const shortTermAfterFees = managementFee > 0 
      ? shortTermAnnual * (1 - managementFee)
      : shortTermAnnual;
    
    // Calculate break-even occupancy
    const breakEvenOccupancy = (longTermAnnual / (shortTermNightly * 365)) * 100;

    setComparisonData({
      longTermMonthly,
      shortTermMonthly,
      longTermAnnual,
      shortTermAnnual: shortTermAfterFees,
      breakEvenOccupancy: Math.round(breakEvenOccupancy * 10) / 10,
      shortTermNightly, // Add these new properties
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
