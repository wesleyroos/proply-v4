import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProAccess } from "@/hooks/use-pro-access";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import PDFReport from "./PDFReport";
import { formatter } from "../utils/formatting";

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

interface ComparisonChartProps {
  data: ComparisonData;
  address: string;
}

export default function ComparisonChart({ data, address }: ComparisonChartProps) {
  const [showPDFReport, setShowPDFReport] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const isProUser = useProAccess();
  const { toast } = useToast();

  const handleGeneratePDF = () => {
    if (!isProUser) {
      toast({
        title: "Pro Feature",
        description: "Upgrade to Pro to access detailed PDF reports and advanced analytics.",
        duration: 5000,
      });
      return;
    }
    setIsGeneratingPDF(true);
    setShowPDFReport(true);
  };

  const blurredContentStyle = !isProUser ? {
    filter: 'blur(4px)',
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    position: 'relative' as const
  } : {};

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">{data.title}</h2>
            <p className="text-muted-foreground">{address}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {data.bedrooms} bed • {data.bathrooms} bath
            </p>
          </div>
          <Button onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
            {isGeneratingPDF ? "Generating..." : "Generate PDF Report"}
          </Button>
        </div>

        {/* Basic Comparison - Visible to all users */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TooltipProvider>
            <div>
              <h3 className="font-medium mb-2">Short-Term Monthly</h3>
              <p className="text-2xl font-bold">
                {formatter.format(data.shortTermMonthly)}
              </p>
              <p className="text-sm text-muted-foreground">After all fees</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Long-Term Monthly</h3>
              <p className="text-2xl font-bold">
                {formatter.format(data.longTermMonthly)}
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Break-Even Occupancy</h3>
              <p className="text-2xl font-bold">{data.breakEvenOccupancy}%</p>
              <p className="text-sm text-muted-foreground">
                Required occupancy rate
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Short-Term Nightly</h3>
              <p className="text-2xl font-bold">
                {formatter.format(data.shortTermNightly)}
              </p>
            </div>
          </TooltipProvider>
        </div>

        {/* Advanced Analysis Section - Blurred for free users */}
        <div style={blurredContentStyle} className="relative">
          {!isProUser && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Card className="p-6 text-center bg-white/90 shadow-lg">
                <h3 className="text-xl font-bold mb-2">Pro Feature</h3>
                <p className="mb-4 text-muted-foreground">
                  Upgrade to access detailed occupancy analysis and revenue scenarios
                </p>
                <Link href="/subscription">
                  <Button>Upgrade to Pro</Button>
                </Link>
              </Card>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Occupancy Analysis</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h4 className="font-medium">Current</h4>
                  <p className="text-xl font-bold">{data.annualOccupancy}%</p>
                  <p className="text-sm text-muted-foreground">Annual average</p>
                </div>
                <div>
                  <h4 className="font-medium">Break-Even</h4>
                  <p className="text-xl font-bold">{data.breakEvenOccupancy}%</p>
                  <p className="text-sm text-muted-foreground">Required rate</p>
                </div>
                <div>
                  <h4 className="font-medium">Difference</h4>
                  <p className="text-xl font-bold">
                    {(data.annualOccupancy - data.breakEvenOccupancy).toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Safety margin</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Short-Term Rental Scenarios</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <h4 className="font-medium">Conservative</h4>
                  <p className="text-xl font-bold">
                    {formatter.format(data.shortTermMonthly * 0.8)}
                  </p>
                  <p className="text-sm text-muted-foreground">Monthly average</p>
                </div>
                <div>
                  <h4 className="font-medium">Expected</h4>
                  <p className="text-xl font-bold">
                    {formatter.format(data.shortTermMonthly)}
                  </p>
                  <p className="text-sm text-muted-foreground">Monthly average</p>
                </div>
                <div>
                  <h4 className="font-medium">Optimistic</h4>
                  <p className="text-xl font-bold">
                    {formatter.format(data.shortTermMonthly * 1.2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Monthly average</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPDFReport && (
        <PDFReport
          data={{ ...data, address }}
          onClose={() => {
            setShowPDFReport(false);
            setIsGeneratingPDF(false);
          }}
        />
      )}
    </>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEASONALITY_FACTORS = [2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03];

const OCCUPANCY_RATES = {
  low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 65],
  medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 80],
  high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
};

function getSeasonalMultiplier(month: number): number {
  return SEASONALITY_FACTORS[month];
}

function getSeasonalNightlyRate(baseRate: number, month: number): number {
  return baseRate * getSeasonalMultiplier(month);
}

function getFeeAdjustedRate(rate: number, hasManagementFee: boolean): number {
  return hasManagementFee
    ? rate * 0.85  // 15% Airbnb fee for professionally managed
    : rate * 0.97; // 3% fee for self-managed
}

function calculateMonthlyRevenue(
  scenario: 'low' | 'medium' | 'high',
  month: number,
  nightly: number,
  hasManagementFee: boolean,
  managementFeePercent: number
): number {
  const occupancyRate = OCCUPANCY_RATES[scenario][month] / 100;
  const daysInMonth = new Date(2024, month + 1, 0).getDate();

  // Apply seasonal adjustment and platform fee
  const seasonalRate = getSeasonalNightlyRate(nightly, month);
  const feeAdjustedRate = getFeeAdjustedRate(seasonalRate, hasManagementFee);

  let revenue = feeAdjustedRate * daysInMonth * occupancyRate;

  // Apply management fee if present
  if (hasManagementFee) {
    revenue *= (1 - managementFeePercent);
  }

  return revenue;
}