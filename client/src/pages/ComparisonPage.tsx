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
  const [address, setAddress] = useState<string>("");
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
    annualOccupancy: number;
  }

  const handleCompare = (data: any) => {
    setAddress(data.address); // Update address when form is submitted
    // Scroll to results after a brief delay to ensure rendering
    setTimeout(() => {
      const yOffset = -20; 
      const element = document.getElementById('comparison-results');
      if (element) {
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
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
    
    // Calculate platform fees (Airbnb/booking fees)
    const platformFeeRate = managementFee > 0 ? 0.15 : 0.03; // 15% if managed, 3% if self-managed
    const feeAdjustedNightlyRate = shortTermNightly * (1 - platformFeeRate);
    
    // Calculate base annual revenue after platform fees
    const shortTermMonthly = (feeAdjustedNightlyRate * 365 * occupancyRate) / 12;
    const shortTermAnnual = shortTermMonthly * 12;
    
    // Calculate and apply management fee if present
    const managementFeeAmount = managementFee > 0 ? shortTermAnnual * managementFee : 0;
    const shortTermAfterFees = shortTermAnnual - managementFeeAmount;
    
    // Calculate break-even occupancy based on net revenue after all fees
    const platformFeeMultiplier = managementFee > 0 ? 0.85 : 0.97; // 15% or 3% platform fee
    const managementFeeMultiplier = 1 - managementFee;
    const netDailyRateNeeded = longTermAnnual / (365 * platformFeeMultiplier * managementFeeMultiplier);
    const breakEvenOccupancy = (netDailyRateNeeded / shortTermNightly) * 100;

    setComparisonData({
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
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#262626] mb-6">
          Property Comparison
        </h1>

        <div className="max-w-4xl space-y-6">
        <Card>
          <CardContent className="pt-6">
            <PropertyForm onSubmit={handleCompare} />
          </CardContent>
        </Card>

        {comparisonData && (
          <Card>
            <CardContent className="pt-6">
              <ComparisonChart data={comparisonData} address={address} />
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
}