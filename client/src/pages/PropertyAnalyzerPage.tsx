import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { useProAccess } from "@/hooks/use-pro-access";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { findCostFromTable, bondCostsTable, transferCostsTable } from "@/lib/costTables";
import { AlertCircle, BarChart3, TrendingUp, Building2, ArrowUpRight, Save, FileText, Info } from "lucide-react";
import AnalyzerIndicator from "@/components/AnalyzerIndicator";
import CashflowMetrics from "@/components/CashflowMetrics";
import InvestmentMetrics from "@/components/InvestmentMetrics";
import RentalPerformance from "@/components/RentalPerformance";
import AssetGrowthMetrics from "@/components/AssetGrowthMetrics";
import { useUser } from "@/hooks/use-user";
import PropertyAnalyzerForm from "@/components/PropertyAnalyzerForm";
import PropertyMap from "@/components/PropertyMap";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CashflowChart from "@/components/CashflowChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface YearlyMetrics {
  grossYield: number;
  netYield: number;
  returnOnEquity: number;
  annualReturn: number;
  capRate: number;
  cashOnCashReturn: number;
  roiWithoutAppreciation: number;
  roiWithAppreciation: number;
  irr: number;
  netWorthChange: number;
}

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
  managementFee: number;
  loanTerm: number;
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
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
    operatingExpenses: {
      year1: number;
      year2: number;
      year3: number;
      year4: number;
      year5: number;
      year10: number;
      year20: number;
    };
    netOperatingIncome: {
      year1: {
        value: number;
        annualCashflow: number;
        cumulativeRentalIncome: number;
        netWorthChange: number;
      };
      year2: {
        value: number;
        annualCashflow: number;
        cumulativeRentalIncome: number;
        netWorthChange: number;
      };
      year3: {
        value: number;
        annualCashflow: number;
        cumulativeRentalIncome: number;
        netWorthChange: number;
      };
      year4: {
        value: number;
        annualCashflow: number;
        cumulativeRentalIncome: number;
        netWorthChange: number;
      };
      year5: {
        value: number;
        annualCashflow: number;
        cumulativeRentalIncome: number;
        netWorthChange: number;
      };
      year10: {
        value: number;
        annualCashflow: number;
        cumulativeRentalIncome: number;
        netWorthChange: number;
      };
      year20: {
        value: number;
        annualCashflow: number;
        cumulativeRentalIncome: number;
        netWorthChange: number;
      };
    } | null;
    investmentMetrics: {
      year1: YearlyMetrics;
      year2: YearlyMetrics;
      year3: YearlyMetrics;
      year4: YearlyMetrics;
      year5: YearlyMetrics;
      year10: YearlyMetrics;
      year20: YearlyMetrics;
    };
  };
  netOperatingIncome: {
    year1: {
      value: number;
      annualCashflow: number;
      cumulativeRentalIncome: number;
      netWorthChange: number;
    };
    year2: {
      value: number;
      annualCashflow: number;
      cumulativeRentalIncome: number;
      netWorthChange: number;
    };
    year3: {
      value: number;
      annualCashflow: number;
      cumulativeRentalIncome: number;
      netWorthChange: number;
    };
    year4: {
      value: number;
      annualCashflow: number;
      cumulativeRentalIncome: number;
      netWorthChange: number;
    };
    year5: {
      value: number;
      annualCashflow: number;
      cumulativeRentalIncome: number;
      netWorthChange: number;
    };
    year10: {
      value: number;
      annualCashflow: number;
      cumulativeRentalIncome: number;
      netWorthChange: number;
    };
    year20: {
      value: number;
      annualCashflow: number;
      cumulativeRentalIncome: number;
      netWorthChange: number;
    };
  } | null;
  address: string;
  propertyPhotoUrl?: string;
}

export default function PropertyAnalyzerPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [removeVat, setRemoveVat] = useState(false);
  const [removeTransferDuty, setRemoveTransferDuty] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [pdfData, setPDFData] = useState<any>(null);
  const [capturedMapImage, setCapturedMapImage] = useState<string | null>(null);
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);

  const { user } = useUser();
  const hasProAccess = useProAccess();
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const calculateBondRegistration = (purchasePrice: number, includeVat: boolean = true) => {
    const costs = findCostFromTable(purchasePrice, bondCostsTable);
    if (!costs) return 0;
    return includeVat ? costs.total : costs.total - costs.vat;
  };

  const calculateTransferCosts = (
    purchasePrice: number,
    includeVat: boolean = true,
    includeTransferDuty: boolean = true,
  ) => {
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
      setFormData(formData);

      const deposit = formData.depositType === "amount"
        ? parseFloat(formData.depositAmount)
        : (parseFloat(formData.purchasePrice) * parseFloat(formData.depositPercentage)) / 100;

      const requestBody = {
        address: formData.address,
        propertyUrl: formData.propertyUrl,
        purchasePrice: parseFloat(formData.purchasePrice),
        floorArea: parseFloat(formData.floorArea),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        parkingSpaces: parseInt(formData.parkingSpaces || 0),
        depositType: formData.depositType,
        deposit: deposit,
        depositPercentage: parseFloat(formData.depositPercentage),
        interestRate: parseFloat(formData.interestRate),
        loanTerm: parseInt(formData.loanTerm),
        monthlyLevies: parseFloat(formData.monthlyLevies || 0),
        monthlyRatesTaxes: parseFloat(formData.monthlyRatesTaxes || 0),
        otherMonthlyExpenses: parseFloat(formData.otherMonthlyExpenses || 0),
        maintenancePercent: parseFloat(formData.maintenancePercent || 0),
        managementFee: parseFloat(formData.managementFee || 0),
        shortTermNightlyRate: parseFloat(formData.airbnbNightlyRate || 0),
        annualOccupancy: parseFloat(formData.occupancyRate || 0),
        longTermRental: parseFloat(formData.longTermRental || 0),
        leaseCycleGap: parseInt(formData.leaseCycleGap || 0),
        annualIncomeGrowth: parseFloat(formData.annualIncomeGrowth || 0),
        annualExpenseGrowth: parseFloat(formData.annualExpenseGrowth || 0),
        annualPropertyAppreciation: parseFloat(formData.annualPropertyAppreciation || 0),
        ratePerSquareMeter: parseFloat(formData.cmaRatePerSqm || 0),
        propertyDescription: formData.comments || "",
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();
      setAnalysisResult({
        ...data,
        shortTermNightlyRate: requestBody.shortTermNightlyRate,
        annualOccupancy: requestBody.annualOccupancy,
        managementFee: requestBody.managementFee,
        loanTerm: requestBody.loanTerm,
      });

      setTimeout(() => {
        if (resultsRef.current) {
          const yOffset = -100;
          const y = resultsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisError(error instanceof Error ? error.message : "Failed to analyze property data");
      setAnalysisResult(null);
    }
  };

  const prepareAnalysisDataForSave = () => {
    if (!analysisResult || !formData || !user) {
      console.error("Missing required data:", {
        analysisResult: !!analysisResult,
        formData: !!formData,
        user: !!user,
      });
      return null;
    }

    const data = {
      userId: user.id,
      title: `${analysisResult.address} Analysis`,
      address: analysisResult.address,
      propertyUrl: formData.propertyUrl || "",
      propertyDescription: formData.comments || "",
      propertyPhoto: formData.propertyPhoto || "",
      purchasePrice: Number(analysisResult.analysis.purchasePrice),
      floorArea: Number(formData.floorArea),
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      parkingSpaces: Number(formData.parkingSpaces || 0),
      depositAmount: Number(analysisResult.deposit),
      depositPercentage: Number(analysisResult.depositPercentage),
      interestRate: Number(analysisResult.interestRate),
      loanTerm: Number(analysisResult.loanTerm),
      monthlyBondRepayment: Number(analysisResult.monthlyBondRepayment),
      monthlyLevies: Number(formData.monthlyLevies || 0),
      monthlyRatesTaxes: Number(formData.monthlyRatesTaxes || 0),
      otherMonthlyExpenses: Number(formData.otherMonthlyExpenses || 0),
      maintenancePercent: Number(formData.maintenancePercent || 0),
      managementFee: Number(formData.managementFee || 0),
      shortTermNightlyRate: Number(analysisResult.shortTermNightlyRate || 0),
      annualOccupancy: Number(analysisResult.annualOccupancy || 0),
      shortTermAnnualRevenue: Number(analysisResult.analysis.shortTermAnnualRevenue || 0),
      longTermAnnualRevenue: Number(analysisResult.analysis.longTermAnnualRevenue || 0),
      shortTermGrossYield: Number(analysisResult.shortTermGrossYield || 0),
      longTermGrossYield: Number(analysisResult.longTermGrossYield || 0),
      ratePerSquareMeter: Number(formData.cmaRatePerSqm || 0),
      revenueProjections: analysisResult.analysis.revenueProjections || {},
      operatingExpenses: analysisResult.analysis.operatingExpenses || {},
      netOperatingIncome: analysisResult.netOperatingIncome || {},
      investmentMetrics: analysisResult.analysis.investmentMetrics || {},
    };

    return data;
  };

  const handleGeneratePDF = async (selections: any) => {
    try {
      await generatePDF(pdfData, selections, user?.settings?.companyLogo || "");
      toast({
        title: "Success",
        description: "PDF report generated successfully!",
        duration: 3000,
      });
      setShowPDFGenerator(false);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF report",
        duration: 5000,
      });
    }
  };

  const handleSaveAnalysis = async () => {
    try {
      const dataToSave = prepareAnalysisDataForSave();
      if (!dataToSave) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Missing required data. Please ensure all fields are filled correctly.",
          duration: 5000,
        });
        return;
      }

      const response = await fetch("/api/property-analyzer/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
        credentials: "include",
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save analysis");
      }

      setAnalysisId(responseData.id);
      setTimeout(() => {
        toast({
          variant: "default",
          title: "Success",
          description: `Property analysis for ${dataToSave.address} has been saved!`,
          duration: 5000,
        });
      }, 500);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save analysis",
        duration: 7000,
      });
    }
  };

  useEffect(() => {
  }, [user, hasProAccess]);

  return (
    <div className="px-4 py-6">
      <div className="flex items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Property Analysis</h1>
          <p className="text-muted-foreground mt-1">Enter property details to generate analysis</p>
          {!hasProAccess && user && (
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-medium">{user.propertyAnalyzerUsage || 0} of 3</span>{" "}
              free analyses used
            </p>
          )}
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
          <div ref={resultsRef}>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Analysis Results
                  </h2>
                  <p className="text-muted-foreground">Based on your provided property details</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button onClick={handleSaveAnalysis} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Analysis
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={() => {
                            if (!analysisResult || !analysisId) return;

                            setPDFData({
                              propertyDetails: {
                                address: analysisResult.address,
                                propertyPhoto: formData?.propertyPhoto || null,
                                mapImage: capturedMapImage,
                                bedrooms: formData?.bedrooms,
                                bathrooms: formData?.bathrooms,
                                floorArea: Number(formData?.floorArea),
                                parkingSpaces: Number(formData?.parkingSpaces),
                                purchasePrice: analysisResult.analysis.purchasePrice,
                                ratePerSquareMeter: Number(formData?.cmaRatePerSqm),
                                areaRate: Number(analysisResult.ratePerSquareMeter),
                                rateDifference:
                                  Number(formData?.cmaRatePerSqm || 0) -
                                  Number(analysisResult.ratePerSquareMeter || 0),
                                propertyDescription: analysisResult.propertyDescription,
                              },
                              analysis: {
                                netOperatingIncome: analysisResult.analysis.netOperatingIncome,
                                revenueProjections: analysisResult.analysis.revenueProjections,
                              },
                              performance: {
                                shortTermNightlyRate: Number(analysisResult.shortTermNightlyRate),
                                annualOccupancy: Number(analysisResult.annualOccupancy),
                                shortTermAnnualRevenue: Number(
                                  analysisResult.analysis.shortTermAnnualRevenue,
                                ),
                                longTermAnnualRevenue: Number(
                                  analysisResult.analysis.longTermAnnualRevenue,
                                ),
                                shortTermGrossYield: Number(analysisResult.shortTermGrossYield),
                                longTermGrossYield: Number(analysisResult.longTermGrossYield),
                              },
                              financialMetrics: {
                                depositAmount: Number(analysisResult.deposit),
                                depositPercentage: Number(analysisResult.depositPercentage),
                                interestRate: Number(analysisResult.interestRate),
                                loanTerm: Number(analysisResult.loanTerm),
                                monthlyBondRepayment: Number(analysisResult.monthlyBondRepayment),
                                bondRegistration: calculateBondRegistration(
                                  analysisResult.analysis.purchasePrice,
                                  !removeVat,
                                ),
                                transferCosts: calculateTransferCosts(
                                  analysisResult.analysis.purchasePrice,
                                  !removeVat,
                                  !removeTransferDuty,
                                ),
                                totalCapitalRequired:
                                  (analysisResult.deposit || 0) +
                                  calculateBondRegistration(
                                    analysisResult.analysis.purchasePrice,
                                    !removeVat,
                                  ) +
                                  calculateTransferCosts(
                                    analysisResult.analysis.purchasePrice,
                                    !removeVat,
                                    !removeTransferDuty,
                                  ),
                              },
                              expenses: {
                                monthlyLevies: Number(formData?.monthlyLevies) || 0,
                                monthlyRatesTaxes: Number(formData?.monthlyRatesTaxes) || 0,
                                otherMonthlyExpenses: Number(formData?.otherMonthlyExpenses) || 0,
                                maintenancePercent: Number(formData?.maintenancePercent) || 0,
                                managementFee: Number(analysisResult.managementFee) || 0,
                              },
                              investmentMetrics: analysisResult.analysis.investmentMetrics,
                              netOperatingIncome: analysisResult.netOperatingIncome,
                              revenueProjections: analysisResult.analysis.revenueProjections,
                            });
                            setIsSubmitting(true);
                            setShowPDFGenerator(true);
                          }}
                          disabled={!analysisResult || !analysisId}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!analysisId && (
                      <TooltipContent>
                        <p>Please save the analysis first</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-6">
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
                          <div ref={mapRef}>
                            <PropertyMap address={analysisResult.address} />
                          </div>
                        </div>

                        {formData?.propertyPhoto && (
                          <div className="mt-4">
                            <h3 className="text-sm font-semibold text-slate-600">Property Photo</h3>
                            <div className="rounded-lg overflow-hidden mt-2">
                              <img
                                src={
                                  formData.propertyPhoto instanceof File
                                    ? URL.createObjectURL(formData.propertyPhoto)
                                    : typeof formData.propertyPhoto === "string"
                                      ? formData.propertyPhoto
                                      : null
                                }
                                alt="Property"
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e) => {
                                  console.error("Error loading image:", e);
                                  e.currentTarget.style.display = "none";
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-500" />
                    Deal Structure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600">Property Description</h3>
                    <p className="mt-2 text-slate-700">
                      {analysisResult.propertyDescription || "No description available"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        Purchase Price
                        <AnalyzerIndicator />
                      </h3>
                      <p className="mt-2 text-2xl font-bold text-slate-800">
                        R
                        {analysisResult.analysis.purchasePrice.toLocaleString()}
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

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        Monthly Bond Payment
                        <AnalyzerIndicator />
                      </h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R
                        {analysisResult.monthlyBondRepayment?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                        Bond Registration
                        <AnalyzerIndicator />
                      </h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R
                        {calculateBondRegistration(
                          analysisResult.analysis.purchasePrice,
                          !removeVat,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                      Transfer Costs
                      <AnalyzerIndicator />
                    </h3>
                    <p className="mt-2 text-lg font-bold text-slate-800">
                      R
                      {calculateTransferCosts(
                        analysisResult.analysis.purchasePrice,
                        !removeVat,
                        !removeTransferDuty,
                      ).toLocaleString()}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="removeVat"
                          checked={removeVat}
                          onCheckedChange={(checked) => setRemoveVat(checked as boolean)}
                        />
                        <label htmlFor="removeVat" className="text-sm text-slate-600">
                          VAT Registered (exclude VAT)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="removeTransferDuty"
                          checked={removeTransferDuty}
                          onCheckedChange={(checked) => setRemoveTransferDuty(checked as boolean)}
                        />
                        <label htmlFor="removeTransferDuty" className="text-sm text-slate-600">
                          Developer Sale (no transfer duty)
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    Investment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">Total Capital Required</h3>
                      <p className="mt-2 text-2xl font-bold text-slate-800">
                        R{" "}
                        {(
                          (analysisResult.deposit || 0) +
                          calculateBondRegistration(
                            analysisResult.analysis.purchasePrice,
                            !removeVat,
                          ) +
                          calculateTransferCosts(
                            analysisResult.analysis.purchasePrice,
                            !removeVat,
                            !removeTransferDuty,
                          )
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">Short-Term Gross Yield</h3>
                      <p className="mt-2 text-xl font-bold text-slate-800 flex items-center gap-2">
                        {analysisResult.shortTermGrossYield?.toFixed(1)}%
                        {analysisResult.shortTermGrossYield &&
                          analysisResult.shortTermGrossYield > 8 && (
                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                          )}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">Long-Term Gross Yield</h3>
                      <p className="mt-2 text-xl font-bold text-slate-800 flex items-center gap-2">
                        {analysisResult.longTermGrossYield?.toFixed(1)}%
                        {analysisResult.longTermGrossYield &&
                          analysisResult.longTermGrossYield > 7 && (
                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                          )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">ST Annual Revenue</h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R{" "}
                        {analysisResult.analysis.shortTermAnnualRevenue?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">LT Annual Revenue</h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R{" "}
                        {analysisResult.analysis.longTermAnnualRevenue?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">Rate per m²</h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R{" "}
                        {analysisResult.ratePerSquareMeter?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">CMA Rate</h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R {formData?.cmaRatePerSqm?.toLocaleString() || "0"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analysisResult.netOperatingIncome && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                        Short-Term Strategy Cash Flow Projections
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CashflowChart
                        data={analysisResult.netOperatingIncome}
                        yAxisLabel="Cash Flow (R)"
                        showTooltip={true}
                      />
                      <div className="mt-4 flex justify-center">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <span className="w-3 h-3 inline-block mr-1 bg-chart-1 rounded-sm"></span>
                            <span className="text-xs text-muted-foreground">Net Income</span>
                          </div>
                          <div className="flex items-center">
                            <span className="w-3 h-3 inline-block mr-1 bg-chart-2 rounded-sm"></span>
                            <span className="text-xs text-muted-foreground">Cumulative</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-indigo-500" />
                      Short-Term Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <RentalPerformance
                          shortTermNightlyRate={Number(analysisResult.shortTermNightlyRate)}
                          annualOccupancy={Number(analysisResult.annualOccupancy)}
                          shortTermAnnualRevenue={Number(
                            analysisResult.analysis.shortTermAnnualRevenue,
                          )}
                          longTermAnnualRevenue={Number(
                            analysisResult.analysis.longTermAnnualRevenue,
                          )}
                                                    platformFee={analysisResult.managementFee > 0 ? 15 : 3}
                        />
                      </div>

                      <div>
                        <CashflowMetrics
                          monthlyBondRepayment={Number(analysisResult.monthlyBondRepayment)}
                          monthlyLevies={Number(formData?.monthlyLevies)}
                          monthlyRatesTaxes={Number(formData?.monthlyRatesTaxes)}
                          otherMonthlyExpenses={Number(formData?.otherMonthlyExpenses)}
                          maintenancePercent={Number(formData?.maintenancePercent)}
                          managementFee={Number(analysisResult.managementFee)}
                          revenueProjections={analysisResult.analysis.revenueProjections}
                          netOperatingIncome={analysisResult.analysis.netOperatingIncome}
                        />
                      </div>

                      <div>
                        <InvestmentMetrics
                          revenueProjections={analysisResult.analysis.revenueProjections}
                          operatingExpenses={analysisResult.analysis.operatingExpenses}
                          netOperatingIncome={analysisResult.netOperatingIncome}
                          purchasePrice={analysisResult.analysis.purchasePrice}
                        />
                      </div>

                      <div>
                        <AssetGrowthMetrics
                          purchasePrice={analysisResult.analysis.purchasePrice}
                          annualIncomeGrowth={formData?.annualIncomeGrowth}
                          annualExpenseGrowth={formData?.annualExpenseGrowth}
                          annualPropertyAppreciation={formData?.annualPropertyAppreciation}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
        <Dialog open={showPDFGenerator} onOpenChange={setShowPDFGenerator}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Generate Property Analysis Report</DialogTitle>
            </DialogHeader>
            {isSubmitting && pdfData && (
              <PropertyAnalyzerPDF
                data={pdfData}
                companyLogo={user?.settings?.companyLogo || ""}
                onClose={() => {
                  setShowPDFGenerator(false);
                  setIsSubmitting(false);
                }}
                isOpen={showPDFGenerator}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}