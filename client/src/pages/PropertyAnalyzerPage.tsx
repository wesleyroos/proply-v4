import { useState, useMemo } from "react";
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
import { AlertCircle, BarChart3, TrendingUp, Building2, MapPin } from "lucide-react";
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
  term: number | null;
  monthlyBondRepayment: number | null;
  floorArea: number | null;
  ratePerSquareMeter: number | null;
  shortTermNightlyRate: number | null;
  annualOccupancy: number | null;
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
  };
  address: string;
  propertyPhotoUrl?: string;
}

import { findCostFromTable, bondCostsTable, transferCostsTable } from "@/lib/costTables";
export default function PropertyAnalyzerPage() {
  const { user } = useUser();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [includeTransferDuty, setIncludeTransferDuty] = useState<boolean>(true);

  const handleAnalysisComplete = async (formData: any) => {
    try {
      setAnalysisError(null);
      setFormData(formData);

      // Ensure all numbers are properly parsed and validated
      const requestBody = {
        purchasePrice: Number(formData.purchasePrice),
        shortTermNightlyRate: Number(formData.airbnbNightlyRate) || undefined,
        annualOccupancy: Number(formData.occupancyRate) || undefined,
        longTermRental: Number(formData.longTermRental) || undefined,
        leaseCycleGap: Number(formData.leaseCycleGap) || undefined,
        propertyDescription: formData.comments || null,
        address: formData.address,
        deposit: Number(formData.depositAmount),
        interestRate: Number(formData.interestRate),
        term: Number(formData.term),
        floorArea: Number(formData.floorArea),
        ratePerSquareMeter: Number(formData.cmaRatePerSqm),
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
                      <MapPin className="h-5 w-5 text-indigo-500" />
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
                                src={URL.createObjectURL(
                                  formData.propertyPhoto,
                                )}
                                alt="Property"
                                className="w-full h-auto object-cover"
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
                        {analysisResult.term || "0"} years
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">
                        Monthly Bond Repayment
                      </h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R
                        {analysisResult.monthlyBondRepayment?.toLocaleString() ||
                          "0"}
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

                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">
                        Transfer Costs
                      </h3>
                      <div className="mt-2 space-y-2">
                        <p className="text-lg font-bold text-slate-800">
                          R{(() => {
                            const costs = findCostFromTable(analysisResult.analysis.purchasePrice, transferCostsTable);
                            return includeTransferDuty 
                              ? costs.total.toLocaleString()
                              : (costs.total - costs.transferDuty).toLocaleString();
                          })()}
                        </p>
                        <Select
                          value={includeTransferDuty ? "with" : "without"}
                          onValueChange={(value) => setIncludeTransferDuty(value === "with")}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Transfer duty option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="with">With Transfer Duty</SelectItem>
                            <SelectItem value="without">No Transfer Duty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                        const transferTotal = includeTransferDuty ? transferCosts.total : (transferCosts.total - transferCosts.transferDuty);
                        return ((analysisResult.deposit || 0) + bondCosts + transferTotal).toLocaleString();
                      })()}
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
                            <p className="text-2xl font-bold text-slate-800">
                              R
                              {analysisResult.analysis.shortTermAnnualRevenue?.toLocaleString() ||
                                "0"}
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
                            <span className="font-semibold text-emerald-600 text-base">
                              {analysisResult.shortTermGrossYield?.toFixed(2) ||
                                "0"}
                              % Gross Yield
                            </span>
                          </p>
                          <div className="pt-2 border-t border-blue-100">
                            <p className="text-sm text-slate-600">
                              Nightly Rate:{" "}
                              <span className="font-medium">
                                R
                                {analysisResult.shortTermNightlyRate?.toLocaleString() ||
                                  "0"}
                              </span>
                            </p>
                            <p className="text-sm text-slate-600">
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
                            <p className="text-2xl font-bold text-slate-800">
                              R
                              {analysisResult.analysis.longTermAnnualRevenue?.toLocaleString() ||
                                "0"}
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
                            <span className="font-semibold text-emerald-600 text-base">
                              {analysisResult.longTermGrossYield?.toFixed(2) ||
                                "0"}
                              % Gross Yield
                            </span>
                          </p>
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
                          <h3 className="text-sm font-semibold text-slate-600">
                            Floor Area
                          </h3>
                          <p className="mt-2 text-lg font-bold text-slate-800">
                            {analysisResult.floorArea || "0"} m²
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-600">
                            Current Property Rate/m²
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
                          <h3 className="text-sm font-semibold text-slate-600">
                            Area Rate/m²
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
                                <h3 className="text-sm font-semibold text-slate-600">
                                  Rate/m² Difference
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
          </>
        )}
      </div>
    </div>
  );
}