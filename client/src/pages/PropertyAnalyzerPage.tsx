import { useState } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, BarChart3, TrendingUp, Building2, MapPin, HelpCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import PropertyAnalyzerForm from "@/components/PropertyAnalyzerForm";
import PropertyMap from "@/components/PropertyMap";
import RentalPerformance from "@/components/RentalPerformance";
import CashflowMetrics from "@/components/CashflowMetrics";
import InvestmentMetrics from "@/components/InvestmentMetrics";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnalysisResult {
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  propertyDescription: string | null;
  deposit: number;
  depositPercentage: number;
  interestRate: number;
  loanTerm: number;
  monthlyBondRepayment: number;
  floorArea: number;
  ratePerSquareMeter: number;
  shortTermNightlyRate: number | null;
  annualOccupancy: number | null;
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
    operatingExpenses: {
      year1: number;
      year2: number;
      year3: number;
      year4: number;
      year5: number;
      year10: number;
      year20: number;
    };
    revenueProjections: {
      shortTerm: {
        year1: number;
        year2: number;
        year3: number;
        year4: number;
        year5: number;
        year10: number;
        year20: number;
      } | null;
    };
    netOperatingIncome?: number; //Adding this to handle potential missing field
  };
  address: string;
  propertyPhotoUrl?: string;
}

import { findCostFromTable, bondCostsTable, transferCostsTable } from "@/lib/costTables";

export default function PropertyAnalyzerPage() {
  const { user } = useUser();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [includeTransferDuty, setIncludeTransferDuty] = useState<boolean>(true);
  const [includeVAT, setIncludeVAT] = useState<boolean>(true);

  const handleAnalysisComplete = async (formData: any) => {
    try {
      setAnalysisError(null);
      setFormData(formData);

      // Prepare request body with explicit number conversion
      const requestBody = {
        purchasePrice: Number(formData.purchasePrice),
        shortTermNightlyRate: Number(formData.airbnbNightlyRate || 0),
        annualOccupancy: Number(formData.occupancyRate || 0),
        longTermRental: Number(formData.longTermRental || 0),
        leaseCycleGap: Number(formData.leaseCycleGap || 0),
        propertyDescription: formData.comments || null,
        address: formData.address,
        deposit: Number(formData.depositAmount),
        interestRate: Number(formData.interestRate),
        loanTerm: Number(formData.loanTerm),
        floorArea: Number(formData.floorArea),
        ratePerSquareMeter: Number(formData.cmaRatePerSqm),
        monthlyLevies: Number(formData.monthlyLevies || 0),
        monthlyRatesTaxes: Number(formData.monthlyRatesTaxes || 0),
        otherMonthlyExpenses: Number(formData.otherMonthlyExpenses || 0),
        maintenancePercent: Number(formData.maintenancePercent || 0),
        managementFee: Number(formData.managementFee || 0),
        incomeGrowthRate: 8,
        expenseGrowthRate: 6
      };

      console.log('Analysis Request:', requestBody);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || response.statusText;
        throw new Error(errorMessage);
      }

      setAnalysisResult({
        ...data,
        shortTermNightlyRate: requestBody.shortTermNightlyRate,
        annualOccupancy: requestBody.annualOccupancy,
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Failed to analyze property data"
      );
      setAnalysisResult(null);
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <SidebarInset>
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-foreground mb-6">
              Property Analyzer
            </h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="md:col-span-2 lg:col-span-3">
                <Card>
                  <CardContent className="p-6">
                    <PropertyAnalyzerForm
                      onAnalysisComplete={handleAnalysisComplete}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Metrics Grid - Attempting to re-integrate original components */}
              <div className="space-y-6 md:col-span-2 lg:col-span-2">
                {analysisResult && (
                  <>
                    <InvestmentMetrics data={analysisResult.analysis} />
                    <CashflowMetrics data={analysisResult.analysis} />
                  </>
                )}
              </div>

              {/* Side Column - Attempting to re-integrate original components */}
              <div className="space-y-6">
                {analysisResult && (
                  <RentalPerformance
                    shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                    longTermMonthly={
                      analysisResult.analysis.longTermAnnualRevenue
                        ? analysisResult.analysis.longTermAnnualRevenue / 12
                        : 0
                    }
                    managementFee={Number(formData?.managementFee) || 0}
                  />
                )}
                {/* Other components from original would go here, but are omitted in the provided 'modified' code */}
              </div>
            </div>


            {/* Disclaimer Section -  Re-integrated with some modifications to handle missing data */}
            <div className="mt-8 text-sm text-muted-foreground space-y-4">
              <p className="font-semibold mb-4">DISCLAIMER:</p>
              <p>
                The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While we make best efforts to ensure the accuracy and reliability of all data presented, including sourcing information from trusted third-party providers, we cannot guarantee its absolute accuracy or completeness.
              </p>
              <p>
                This report is intended to serve as a general guide and should not be considered as financial, investment, legal, or professional advice. Any decisions made based on this information are solely the responsibility of the user. Property investment carries inherent risks, and market conditions can change rapidly.
              </p>
              <p>
                Proply Tech (Pty) Ltd and its affiliates expressly disclaim any and all liability for any direct, indirect, incidental, or consequential damages arising from the use of this information. Actual results may vary significantly from the projections and estimates presented.
              </p>
              <p>
                By using this report, you acknowledge that the calculations and projections are indicative only and based on the information available at the time of generation. Factors beyond our control, including but not limited to market fluctuations, regulatory changes, and economic conditions, may impact actual outcomes.
              </p>
              <p className="text-xs mt-6">
                © {new Date().getFullYear()} Proply Tech (Pty) Ltd. All rights reserved.
              </p>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}