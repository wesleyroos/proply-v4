import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Building2, TrendingUp } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import PropertyAnalyzerForm from "@/components/PropertyAnalyzerForm";
import PropertyMap from "@/components/PropertyMap";
import RentalPerformance from "@/components/RentalPerformance";
import CashflowMetrics from "@/components/CashflowMetrics";
import InvestmentMetrics from "@/components/InvestmentMetrics";
import { findCostFromTable, bondCostsTable, transferCostsTable } from "@/lib/costTables";

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
    <div className="bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8 px-6 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-800">
              Property Analysis
            </h1>
          </div>

          <div className="grid gap-8">
            {/* Analysis Form */}
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
                {/* Summary Section */}
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Property Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-slate-600" />
                          Property Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Location</h3>
                            <p className="mt-1 text-lg text-slate-900">{analysisResult.address}</p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Purchase Price</h3>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                              R{analysisResult.analysis.purchasePrice.toLocaleString()}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-medium text-slate-500">Deposit</h3>
                              <p className="mt-1 text-lg text-slate-900">
                                R{analysisResult.deposit?.toLocaleString()}
                                <span className="ml-1 text-sm text-slate-500">
                                  ({analysisResult.depositPercentage}%)
                                </span>
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-slate-500">Monthly Bond</h3>
                              <p className="mt-1 text-lg text-slate-900">
                                R{analysisResult.monthlyBondRepayment?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Revenue Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-slate-600" />
                          Revenue Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Short-Term Revenue (Annual)</h3>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                              R{analysisResult.analysis.shortTermAnnualRevenue?.toLocaleString()}
                              <span className="ml-2 text-base font-normal text-emerald-600">
                                {analysisResult.shortTermGrossYield?.toFixed(1)}% yield
                              </span>
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {analysisResult.annualOccupancy}% occupancy at R{analysisResult.shortTermNightlyRate?.toLocaleString()}/night
                            </p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-slate-500">Long-Term Revenue (Annual)</h3>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                              R{analysisResult.analysis.longTermAnnualRevenue?.toLocaleString()}
                              <span className="ml-2 text-base font-normal text-emerald-600">
                                {analysisResult.longTermGrossYield?.toFixed(1)}% yield
                              </span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Transaction Costs */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Bond Registration</h3>
                          <p className="mt-1 text-lg text-slate-900">
                            R{findCostFromTable(analysisResult.analysis.purchasePrice, bondCostsTable).total.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Transfer Costs</h3>
                          <p className="mt-1 text-lg text-slate-900">
                            R{(() => {
                              const costs = findCostFromTable(analysisResult.analysis.purchasePrice, transferCostsTable);
                              let total = includeTransferDuty ? costs.total : (costs.total - costs.transferDuty);
                              if (!includeVAT) {
                                total = total / 1.15;
                              }
                              return total.toLocaleString();
                            })()}
                          </p>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="noTransferDuty"
                                checked={!includeTransferDuty}
                                onCheckedChange={(checked) => setIncludeTransferDuty(!checked)}
                              />
                              <label htmlFor="noTransferDuty" className="text-sm text-slate-600">
                                No transfer duty
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="removeVAT"
                                checked={!includeVAT}
                                onCheckedChange={(checked) => setIncludeVAT(!checked)}
                              />
                              <label htmlFor="removeVAT" className="text-sm text-slate-600">
                                Remove VAT
                              </label>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Total Capital Required</h3>
                          <p className="mt-1 text-xl font-bold text-slate-900">
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
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Analysis */}
                  <div className="space-y-6">
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
                  </div>

                  {/* Disclaimer */}
                  <div className="text-sm text-slate-500 bg-slate-50 p-6 rounded-lg">
                    <p className="font-medium mb-2">Disclaimer</p>
                    <p className="mb-2">
                      The information provided is for general guidance only and should not be considered as financial advice. 
                      Property investments carry inherent risks and actual results may vary.
                    </p>
                    <p>
                      Proply Tech (Pty) Ltd assumes no liability for investment decisions made based on this analysis.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}