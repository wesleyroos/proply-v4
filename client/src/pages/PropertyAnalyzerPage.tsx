import { useState } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
} from "@/components/ui/sidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
    netOperatingIncome: {
      year1: number;
      year2: number;
      year3: number;
      year4: number;
      year5: number;
      year10: number;
      year20: number;
    } | null;
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
      <div className="group/sidebar-wrapper flex min-h-svh">
        <Sidebar variant="floating" collapsible="icon">
          <SidebarHeader>
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <span className="text-lg font-semibold">Property Analyzer</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {/* Sidebar navigation can be added here */}
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col bg-background">
          {/* Progress Steps */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="h-14 px-6 flex items-center">
              <nav className="flex items-center space-x-6">
                {['Property Details', 'Financing', 'Operating Expenses', 'Revenue Performance', 'Escalation/Misc'].map((label, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    {index < 4 && (
                      <div className="ml-4 h-px w-8 bg-muted" />
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="h-full px-4 py-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto">
                {/* Main Column */}
                <div className="md:col-span-8 space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <PropertyAnalyzerForm onAnalysisComplete={handleAnalysisComplete} />
                    </CardContent>
                  </Card>

                  {analysisError && (
                    <Card className="border-destructive/50 bg-destructive/10">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-5 w-5" />
                          <p className="text-sm font-medium">Error: {analysisError}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                        netOperatingIncome={analysisResult.analysis.netOperatingIncome}
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
                        netOperatingIncome={analysisResult.analysis.netOperatingIncome}
                      />
                    </div>
                  )}
                </div>

                {/* Side Column */}
                <div className="md:col-span-4">
                  {analysisResult && (
                    <div className="space-y-6">
                      <Card>
                        <CardContent className="p-6">
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
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-8 space-y-4 text-sm text-muted-foreground">
                <p className="font-semibold">DISCLAIMER:</p>
                <p>
                  The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While we make best efforts to ensure the accuracy and reliability of all data presented, including sourcing information from trusted third-party providers, we cannot guarantee its absolute accuracy or completeness.
                </p>
                <p>
                  This report is intended to serve as a general guide and should not be considered as financial, investment, legal, or professional advice. Any decisions made based on this information are solely the responsibility of the user. Property investment carries inherent risks, and market conditions can change rapidly.
                </p>
                <p>
                  By using this report, you acknowledge that the calculations and projections are indicative only and based on the information available at the time of generation. Factors beyond our control, including but not limited to market fluctuations, regulatory changes, and economic conditions, may impact actual outcomes.
                </p>
                <p className="text-xs mt-6">
                  © {new Date().getFullYear()} Proply Tech (Pty) Ltd. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
