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
      <div className="flex h-screen">
        <Sidebar />
        <SidebarInset className="flex-1 overflow-auto bg-[#FFFFFF]">
          <div className="max-w-[1500px] mx-auto px-6 py-6">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center space-x-14">
                {[1, 2, 3, 4, 5, 6].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      step === 1 ? 'bg-blue-500 text-white' : 'bg-gray-100'
                    }`}>
                      {step}
                    </div>
                    {index < 5 && (
                      <div className="w-10 h-[2px] bg-gray-200 ml-4" />
                    )}
                  </div>
                ))}
              </div>
              <button className="text-blue-500 hover:text-blue-600">Previous</button>
            </div>

            <div className="grid gap-8 md:grid-cols-12">
              <div className="md:col-span-8 lg:col-span-9">
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <PropertyAnalyzerForm
                      onAnalysisComplete={handleAnalysisComplete}
                    />
                  </div>

                  {analysisResult && (
                    <div className="space-y-6">
                      <InvestmentMetrics 
                        purchasePrice={analysisResult.analysis.purchasePrice}
                        deposit={analysisResult.deposit}
                        monthlyBondRepayment={analysisResult.monthlyBondRepayment}
                        shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                        longTermMonthly={
                          analysisResult.analysis.longTermAnnualRevenue
                            ? analysisResult.analysis.longTermAnnualRevenue / 12
                            : 0
                        }
                        revenueProjections={analysisResult.analysis.revenueProjections}
                        operatingExpenses={analysisResult.analysis.operatingExpenses}
                        netOperatingIncome={analysisResult.analysis.netOperatingIncome || null}
                      />
                      <CashflowMetrics
                        shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                        longTermMonthly={
                          analysisResult.analysis.longTermAnnualRevenue
                            ? analysisResult.analysis.longTermAnnualRevenue / 12
                            : 0
                        }
                        monthlyBondRepayment={analysisResult.monthlyBondRepayment}
                        managementFee={Number(formData?.managementFee) || 0}
                        revenueProjections={analysisResult.analysis.revenueProjections}
                        operatingExpenses={analysisResult.analysis.operatingExpenses}
                        netOperatingIncome={analysisResult.analysis.netOperatingIncome || null}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Side Column */}
              <div className="md:col-span-4 lg:col-span-3">
                <div className="space-y-6">
                  {analysisResult && (
                    <>
                      <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-semibold mb-4">Rental Performance</h3>
                        <RentalPerformance
                          shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                          longTermMonthly={
                            analysisResult.analysis.longTermAnnualRevenue
                              ? analysisResult.analysis.longTermAnnualRevenue / 12
                              : 0
                          }
                          managementFee={Number(formData?.managementFee) || 0}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>


            {/* Disclaimer Section */}
            <div className="mt-8 mb-6 text-sm text-muted-foreground space-y-4 max-w-[1500px] mx-auto px-6">
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