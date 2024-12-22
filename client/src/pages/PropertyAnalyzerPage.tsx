import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { findCostFromTable, bondCostsTable, transferCostsTable } from "@/lib/costTables";
import { AlertCircle, BarChart3, TrendingUp, Building2, ArrowUpRight } from "lucide-react";
import AnalyzerIndicator from "@/components/AnalyzerIndicator";
import CashflowMetrics from "@/components/CashflowMetrics";
import InvestmentMetrics from "@/components/InvestmentMetrics";
import RentalPerformance from "@/components/RentalPerformance";
import { useUser } from "@/hooks/use-user";
import PropertyAnalyzerForm from "@/components/PropertyAnalyzerForm";
import PropertyMap from "@/components/PropertyMap";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnalysisResult {
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  propertyDescription: string | null;
  deposit: number | null;
  depositPercentage: number | null;
  interestRate: number | null;
  monthlyBondRepayment: number | null;
  floorArea: number | null;
  ratePerSquareMeter: number | null;
  shortTermNightlyRate: number | null;
  annualOccupancy: number | null;
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
    revenueProjections?: { shortTerm: number[] | null };
    operatingExpenses?: number;
    netOperatingIncome?: number;
  };
  address: string;
  propertyPhotoUrl?: string;
}

export default function PropertyAnalyzerPage() {
  const { user } = useUser();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [removeVat, setRemoveVat] = useState(false);
  const [removeTransferDuty, setRemoveTransferDuty] = useState(false);

  const calculateBondRegistration = (purchasePrice: number, includeVat: boolean = true) => {
    const costs = findCostFromTable(purchasePrice, bondCostsTable);
    if (!costs) return 0;
    return includeVat ? costs.total : costs.total - costs.vat;
  };

  const calculateTransferCosts = (purchasePrice: number, includeVat: boolean = true, includeTransferDuty: boolean = true) => {
    const costs = findCostFromTable(purchasePrice, transferCostsTable);
    if (!costs) return 0;
    let total = costs.total;
    if (!includeVat) total -= costs.vat;
    if (!includeTransferDuty) total -= costs.transferDuty;
    return total;
  };

  const handleAnalysisComplete = async (formData: any) => {
    try {
      setAnalysisError(null);
      console.log("Form data received:", formData); // Debug log
      setFormData({
        ...formData,
        propertyPhoto: formData.propertyPhoto
      });

      // Ensure all numbers are properly parsed and validated
      const requestBody = {
        // Property Details
        address: formData.address,
        propertyUrl: formData.propertyUrl,
        purchasePrice: Number(formData.purchasePrice),
        floorArea: Number(formData.floorArea),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        parkingSpaces: Number(formData.parkingSpaces || 0),
        
        // Financing Details
        depositType: formData.depositType,
        deposit: Number(formData.depositAmount),
        depositPercentage: Number(formData.depositPercentage),
        interestRate: Number(formData.interestRate),
        loanTerm: Number(formData.loanTerm),
        
        // Operating Expenses
        monthlyLevies: Number(formData.monthlyLevies || 0),
        monthlyRatesTaxes: Number(formData.monthlyRatesTaxes || 0),
        otherMonthlyExpenses: Number(formData.otherMonthlyExpenses || 0),
        maintenancePercent: Number(formData.maintenancePercent || 0),
        managementFee: Number(formData.managementFee || 0),
        
        // Revenue Performance
        shortTermNightlyRate: Number(formData.airbnbNightlyRate || 0),
        annualOccupancy: Number(formData.occupancyRate || 0),
        longTermRental: Number(formData.longTermRental || 0),
        leaseCycleGap: Number(formData.leaseCycleGap || 0),
        
        // Escalations
        annualIncomeGrowth: Number(formData.annualIncomeGrowth || 0),
        annualExpenseGrowth: Number(formData.annualExpenseGrowth || 0),
        annualPropertyAppreciation: Number(formData.annualPropertyAppreciation || 0),
        
        // Miscellaneous
        ratePerSquareMeter: Number(formData.cmaRatePerSqm || 0),
        propertyDescription: formData.comments || "",
      };

      console.log("Data being sent to analyzer:", requestBody);

      console.log(
        "Sending analysis request with body:",
        JSON.stringify(requestBody, null, 2),
      );

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Raw response from analyzer:", response);
      console.log("Parsed response data:", data);

      if (!response.ok) {
        const errorMessage = data.error || response.statusText;
        console.error("Analysis failed with error:", errorMessage);
        throw new Error(errorMessage);
      }

      // Include the nightly rate and occupancy from the request in the analysis result
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
          : "Failed to analyze property data",
      );
      setAnalysisResult(null);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Property Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Enter property details to generate analysis
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <PropertyAnalyzerForm onAnalysisComplete={handleAnalysisComplete} />

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
            {/* Analysis Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Analysis Results
              </h2>
              <p className="text-muted-foreground">
                Based on your provided property details
              </p>
            </div>

            {/* Deal Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Location and Photo Column */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-indigo-500" />
                      Location & Photo
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600">
                      {analysisResult.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysisResult && (
                      <>
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
                                src={formData.propertyPhoto instanceof File ? 
                                  URL.createObjectURL(formData.propertyPhoto) : 
                                  typeof formData.propertyPhoto === 'string' ? 
                                    formData.propertyPhoto : null
                                }
                                alt="Property"
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e) => {
                                  console.error('Error loading image:', e);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

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
                      {analysisResult.propertyDescription ||
                        "No description available"}
                    </p>
                  </div>

                  {/* Purchase Price and Deposit */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        Purchase Price
                        <AnalyzerIndicator />
                      </h3>
                      <p className="mt-2 text-2xl font-bold text-slate-800">
                        R{analysisResult.analysis.purchasePrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        Deposit
                        <AnalyzerIndicator />
                      </h3>
                      <p className="mt-2 text-2xl font-bold text-slate-800">
                        R{analysisResult.deposit?.toLocaleString() || "0"}
                        <span className="ml-2 text-base font-semibold text-indigo-600">
                          ({analysisResult.depositPercentage || "0"}%)
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Interest Rate and Term */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        Interest Rate
                        <AnalyzerIndicator />
                      </h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        {analysisResult.interestRate || "0"}%
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        Loan Term
                        <AnalyzerIndicator />
                      </h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        {analysisResult.loanTerm} years
                      </p>
                    </div>
                  </div>

                  {/* Monthly Bond Payment and Bond Registration */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        Monthly Bond Payment
                        <AnalyzerIndicator />
                      </h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R{analysisResult.monthlyBondRepayment?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        Bond Registration
                        <AnalyzerIndicator />
                      </h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R{calculateBondRegistration(analysisResult.analysis.purchasePrice, !removeVat).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Transfer Costs */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                      Transfer Costs
                      <AnalyzerIndicator />
                    </h3>
                    <p className="mt-2 text-lg font-bold text-slate-800">
                      R{calculateTransferCosts(
                        analysisResult.analysis.purchasePrice,
                        !removeVat,
                        !removeTransferDuty
                      ).toLocaleString()}
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="removeVat"
                            checked={removeVat}
                            onCheckedChange={(checked) => setRemoveVat(checked as boolean)}
                          />
                          <label
                            htmlFor="removeVat"
                            className="text-sm text-slate-600 cursor-pointer"
                          >
                            Remove VAT
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="removeTransferDuty"
                            checked={removeTransferDuty}
                            onCheckedChange={(checked) => setRemoveTransferDuty(checked as boolean)}
                          />
                          <label
                            htmlFor="removeTransferDuty"
                            className="text-sm text-slate-600 cursor-pointer"
                          >
                            Remove Transfer Duty
                          </label>
                        </div>
                      </div>
                      <div>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                          Get Connected with a Transfer Attorney
                        </Button>
                        <p className="mt-2 text-sm text-slate-600">
                          Get exclusive rates and professional guidance for your property transfer process through our network of trusted attorneys.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total Capital Required */}
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      Total Capital Required
                      <AnalyzerIndicator />
                    </h3>
                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      R{((analysisResult.deposit || 0) + 
                         calculateBondRegistration(analysisResult.analysis.purchasePrice, !removeVat) +
                         calculateTransferCosts(analysisResult.analysis.purchasePrice, !removeVat, !removeTransferDuty)
                        ).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Middle Column with Revenue and Size/Rate */}
              <div className="space-y-4">
                {/* Revenue Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Revenue Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-blue-50/50">
                        <h3 className="text-sm font-bold text-blue-600 mb-3">
                          Short-Term Rental (Year 1)
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <span>R{analysisResult.analysis.shortTermAnnualRevenue?.toLocaleString() ||
                              "0"}</span>
                            <span className="w-2 h-2 rounded-full bg-red-500" title="Data from analyzer engine" />
                            </p>
                            <p className="text-base text-slate-600">
                              R
                              {Math.round(
                                (analysisResult.analysis
                                  .shortTermAnnualRevenue || 0) / 12,
                              ).toLocaleString()}
                              /month
                            </p>
                          </div>
                          <p className="text-sm flex items-center gap-2">
                            <span className="font-semibold text-emerald-600 text-base flex items-center gap-2">
                              {analysisResult.shortTermGrossYield?.toFixed(2) ||
                                "0"}
                              % Gross Yield
                              <span className="w-2 h-2 rounded-full bg-red-500" title="Calculated by analysis engine" />
                            </span>
                          </p>
                          <div className="pt-2 border-t border-blue-100">
                            <p className="text-sm text-slate-600">
                              Nightly Rate:{" "}
                              <span className="font-medium flex items-center gap-2">
                                R
                                {analysisResult.shortTermNightlyRate?.toLocaleString() ||
                                  "0"}
                              </span>
                            </p>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-slate-600">Fee-adjusted Rate:</p>
                              <p className="text-sm font-medium flex items-center gap-2">
                                R{analysisResult.shortTermNightlyRate ? 
                                  Math.round(analysisResult.shortTermNightlyRate * 0.85).toLocaleString() : "0"}
                                <span className="w-2 h-2 rounded-full bg-red-500" title="Calculated by analysis engine" />
                              </p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-slate-600">Platform Fee:</p>
                              <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                                15%
                                <span className="w-2 h-2 rounded-full bg-red-500" title="Calculated by analysis engine" />
                              </p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-slate-600">Management Fee:</p>
                              <p className="text-sm font-medium flex items-center gap-2">
                                20%
                                <span className="w-2 h-2 rounded-full bg-red-500" title="Calculated by analysis engine" />
                              </p>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">
                              Occupancy:{" "}
                              <span className="font-medium">
                                {analysisResult.annualOccupancy || "0"}%
                              </span>
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
                            <p className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                              R
                              {analysisResult.analysis.longTermAnnualRevenue?.toLocaleString() ||
                                "0"}
                              <span className="w-2 h-2 rounded-full bg-red-500" title="Data from analyzer engine" />
                            </p>
                            <p className="text-base text-slate-600">
                              R
                              {Math.round(
                                (analysisResult.analysis
                                  .longTermAnnualRevenue || 0) / 12,
                              ).toLocaleString()}
                              /month
                            </p>
                          </div>
                          <p className="text-sm flex items-center gap-2">
                            <span className="font-semibold text-emerald-600 text-base flex items-center gap-2">
                              {analysisResult.longTermGrossYield?.toFixed(2) ||
                                "0"}
                              % Gross Yield
                              <span className="w-2 h-2 rounded-full bg-red-500" title="Calculated by analysis engine" />
                            </span>
                          </p>
                          
                          {/* No fee adjustment section needed for long-term rental */}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Size and Rate */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-cyan-500" />
                      Size and Rate/m²
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            Floor Area
                            <AnalyzerIndicator />
                          </h3>
                          <p className="mt-2 text-lg font-bold text-slate-800">
                            {analysisResult.floorArea || "0"} m²
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            Current Property Rate/m²
                            <AnalyzerIndicator />
                          </h3>
                          <p className="mt-2 text-lg font-bold text-slate-800">
                            R
                            {(
                              analysisResult.analysis.purchasePrice /
                              (analysisResult.floorArea || 1)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            Area Rate/m²
                            <AnalyzerIndicator />
                          </h3>
                          <p className="mt-2 text-lg font-bold text-slate-800">
                            R
                            {analysisResult.ratePerSquareMeter?.toLocaleString() ||
                              "0"}
                          </p>
                        </div>
                        <div>
                          {(() => {
                            const actualRate =
                              analysisResult.analysis.purchasePrice /
                              (analysisResult.floorArea || 1);
                            const areaRate =
                              analysisResult.ratePerSquareMeter || 0;
                            const difference = areaRate - actualRate;
                            const isPositive = difference > 0;

                            return (
                              <div>
                                <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                  Rate/m² Difference
                                  <AnalyzerIndicator />
                                </h3>
                                <Tooltip delayDuration={0}>
                                  <TooltipTrigger className="cursor-help">
                                    <p className="mt-2 text-lg font-bold">
                                      <span
                                        className={
                                          isPositive
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }
                                      >
                                        R{Math.abs(difference).toLocaleString()}{" "}
                                        {isPositive ? "above" : "below"} area
                                        rate (
                                        {(
                                          (Math.abs(difference) / actualRate) *
                                          100
                                        ).toFixed(1)}
                                        %)
                                      </span>
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[300px] text-sm">
                                    This shows how the property's price per
                                    square meter compares to the average rate in
                                    the area. A lower rate (
                                    {isPositive
                                      ? "currently higher"
                                      : "currently lower"}
                                    ) than the area average might indicate
                                    better value for money, while a higher rate
                                    could suggest premium features or location.
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Detailed Analysis Section */}
            <div className="space-y-6">
              {/* Rental Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Rental Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RentalPerformance
                    shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                    longTermMonthly={analysisResult.analysis.longTermAnnualRevenue ? analysisResult.analysis.longTermAnnualRevenue / 12 : 0}
                    managementFee={analysisResult.managementFee || 0}
                  />
                </CardContent>
              </Card>

              {/* Cashflow Metrics */}
              <CashflowMetrics 
                shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                longTermMonthly={analysisResult.analysis.longTermAnnualRevenue / 12 || 0}
                monthlyBondRepayment={analysisResult.monthlyBondRepayment || 0}
                managementFee={20}
                revenueProjections={{
                  shortTerm: analysisResult.analysis.revenueProjections?.shortTerm || null
                }}
                operatingExpenses={analysisResult.analysis.operatingExpenses}
                netOperatingIncome={analysisResult.analysis.netOperatingIncome}
              />
              
              {/* Investment Metrics */}
              <InvestmentMetrics 
                purchasePrice={analysisResult.analysis.purchasePrice}
                deposit={analysisResult.deposit}
                monthlyBondRepayment={analysisResult.monthlyBondRepayment}
                shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                longTermMonthly={analysisResult.analysis.longTermAnnualRevenue / 12 || 0}
                revenueProjections={{
                  shortTerm: analysisResult.analysis.revenueProjections?.shortTerm || null
                }}
                operatingExpenses={analysisResult.analysis.operatingExpenses}
                netOperatingIncome={analysisResult.analysis.netOperatingIncome}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}