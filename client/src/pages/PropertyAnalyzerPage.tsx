import { useState } from "react";
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
import {
  AlertCircle,
  BarChart3,
  TrendingUp,
  Building2,
  MapPin,
  HelpCircle,
} from "lucide-react";
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

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || response.statusText);
      }

      setAnalysisResult({
        ...data,
        shortTermNightlyRate: requestBody.shortTermNightlyRate,
        annualOccupancy: requestBody.annualOccupancy,
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisError(error instanceof Error ? error.message : "Failed to analyze property data");
      setAnalysisResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#262626] mb-6">
          Property Analyzer
        </h1>

        <div className="max-w-5xl space-y-6">
          <Card>
            <CardContent className="pt-6">
              <PropertyAnalyzerForm onAnalysisComplete={handleAnalysisComplete} />
            </CardContent>
          </Card>

          {analysisError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm font-medium">Error: {analysisError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {analysisResult && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Location and Photo Column */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-indigo-500" />
                      Location & Photo
                    </CardTitle>
                    <CardDescription className="text-sm font-semibold text-slate-600">
                      {analysisResult.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg overflow-hidden">
                      <PropertyMap address={analysisResult.address} />
                    </div>

                    {formData?.propertyPhoto && (
                      <div className="mt-4">
                        <h3 className="text-sm font-semibold text-slate-600">
                          Property Photo
                        </h3>
                        <div className="rounded-lg overflow-hidden mt-2">
                          <img
                            src={URL.createObjectURL(formData.propertyPhoto)}
                            alt="Property"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Deal Structure */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-indigo-500" />
                      Deal Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">
                        Property Description
                      </h3>
                      <p className="mt-2 text-slate-700">
                        {analysisResult.propertyDescription || "No description available"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-600">
                          Purchase Price
                        </h3>
                        <p className="mt-2 text-2xl font-bold text-slate-800">
                          R{analysisResult.analysis.purchasePrice.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-600">
                          Deposit
                        </h3>
                        <p className="mt-2 text-lg font-bold text-slate-800">
                          R{analysisResult.deposit?.toLocaleString() || "0"}
                          <span className="ml-2 text-base font-semibold text-indigo-600">
                            ({analysisResult.depositPercentage || "0"}%)
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-600">
                          Interest Rate
                        </h3>
                        <p className="mt-2 text-lg font-bold text-slate-800">
                          {analysisResult.interestRate || "0"}%
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-600">
                          Term
                        </h3>
                        <p className="mt-2 text-lg font-bold text-slate-800">
                          {analysisResult.loanTerm || "0"} years
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-600">
                          Monthly Bond Repayment
                        </h3>
                        <p className="mt-2 text-lg font-bold text-slate-800">
                          R{analysisResult.monthlyBondRepayment?.toLocaleString() || "0"}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-600">
                          Bond Registration
                        </h3>
                        <p className="mt-2 text-lg font-bold text-slate-800">
                          R{findCostFromTable(analysisResult.analysis.purchasePrice, bondCostsTable).total.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">
                        Transfer Costs
                      </h3>
                      <div className="flex items-center gap-4">
                        <p className="mt-2 text-lg font-bold text-slate-800">
                          R{(() => {
                            const costs = findCostFromTable(analysisResult.analysis.purchasePrice, transferCostsTable);
                            let total = includeTransferDuty ? costs.total : (costs.total - costs.transferDuty);
                            if (!includeVAT) {
                              total = total / 1.15;
                            }
                            return total.toLocaleString();
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="noTransferDuty"
                          checked={!includeTransferDuty}
                          onCheckedChange={(checked) => setIncludeTransferDuty(!checked)}
                        />
                        <label htmlFor="noTransferDuty" className="text-sm font-medium">
                          No transfer duty
                        </label>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="removeVAT"
                          checked={!includeVAT}
                          onCheckedChange={(checked) => setIncludeVAT(!checked)}
                        />
                        <label htmlFor="removeVAT" className="text-sm font-medium">
                          Remove VAT
                        </label>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-bold text-slate-800">
                        Total Capital Required
                      </h3>
                      <p className="mt-2 text-2xl font-bold text-slate-800">
                        R{(() => {
                          const bondCosts = findCostFromTable(analysisResult.analysis.purchasePrice, bondCostsTable).total;
                          const transferCosts = findCostFromTable(analysisResult.analysis.purchasePrice, transferCostsTable);
                          let transferTotal = includeTransferDuty ? transferCosts.total : (transferCosts.total - transferCosts.transferDuty);
                          if (!includeVAT) {
                            transferTotal = transferTotal / 1.15;
                          }
                          return ((analysisResult.deposit || 0) + bondCosts + transferTotal).toLocaleString();
                        })()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Revenue Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 rounded-lg bg-blue-50/50">
                        <h3 className="text-sm font-bold text-blue-600 mb-3">
                          Short-Term Rental (Year 1)
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-2xl font-bold text-slate-800">
                              R{analysisResult.analysis.shortTermAnnualRevenue?.toLocaleString() || "0"}
                            </p>
                            <p className="text-base text-slate-600">
                              R{Math.round((analysisResult.analysis.shortTermAnnualRevenue || 0) / 12).toLocaleString()}/month
                            </p>
                          </div>
                          <p className="text-sm">
                            <span className="font-semibold text-emerald-600 text-base">
                              {analysisResult.shortTermGrossYield?.toFixed(2) || "0"}% Gross Yield
                            </span>
                          </p>
                          <div className="pt-2 border-t border-blue-100">
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Nightly Rate:</span>{" "}
                              R{analysisResult.shortTermNightlyRate?.toLocaleString() || "0"}
                            </p>
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Occupancy:</span>{" "}
                              {analysisResult.annualOccupancy || "0"}%
                            </p>
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Management Fee:</span>{" "}
                              {formData?.managementFee || "0"}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-purple-50/50">
                        <h3 className="text-sm font-bold text-purple-600 mb-3">
                          Long-Term Rental (Year 1)
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-2xl font-bold text-slate-800">
                              R{analysisResult.analysis.longTermAnnualRevenue?.toLocaleString() || "0"}
                            </p>
                            <p className="text-base text-slate-600">
                              R{Math.round((analysisResult.analysis.longTermAnnualRevenue || 0) / 12).toLocaleString()}/month
                            </p>
                          </div>
                          <p className="text-sm">
                            <span className="font-semibold text-emerald-600 text-base">
                              {analysisResult.longTermGrossYield?.toFixed(2) || "0"}% Gross Yield
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Analysis Sections */}
              <RentalPerformance
                shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                longTermMonthly={analysisResult.analysis.longTermAnnualRevenue ? analysisResult.analysis.longTermAnnualRevenue / 12 : 0}
                managementFee={Number(formData?.managementFee) || 0}
              />

              <CashflowMetrics
                shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                longTermMonthly={analysisResult.analysis.longTermAnnualRevenue ? analysisResult.analysis.longTermAnnualRevenue / 12 : 0}
                monthlyBondRepayment={analysisResult.monthlyBondRepayment || 0}
                managementFee={Number(formData?.managementFee) || 0}
                revenueProjections={analysisResult.analysis.revenueProjections}
                operatingExpenses={analysisResult.analysis.operatingExpenses}
              />

              <InvestmentMetrics
                purchasePrice={analysisResult.analysis.purchasePrice}
                deposit={analysisResult.deposit}
                monthlyBondRepayment={analysisResult.monthlyBondRepayment}
                shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                longTermMonthly={analysisResult.analysis.longTermAnnualRevenue ? analysisResult.analysis.longTermAnnualRevenue / 12 : 0}
                revenueProjections={analysisResult.analysis.revenueProjections}
                operatingExpenses={analysisResult.analysis.operatingExpenses}
              />

              {/* Disclaimer */}
              <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-full text-sm text-gray-600 space-y-4">
                  <p className="font-semibold">DISCLAIMER:</p>
                  <p>
                    The information contained in this report is provided for informational purposes only. While we make best efforts to ensure accuracy, we cannot guarantee its absolute precision or completeness.
                  </p>
                  <p>
                    This report should not be considered as financial, investment, legal, or professional advice. Property investment carries inherent risks, and market conditions can change rapidly.
                  </p>
                  <p>
                    Proply Tech (Pty) Ltd and its affiliates expressly disclaim any liability for damages arising from the use of this information. Actual results may vary from projections presented.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}