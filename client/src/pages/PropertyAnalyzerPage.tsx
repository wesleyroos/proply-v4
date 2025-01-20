import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  findCostFromTable,
  bondCostsTable,
  transferCostsTable,
} from "@/lib/costTables";
import {
  AlertCircle,
  BarChart3,
  TrendingUp,
  Building2,
  ArrowUpRight,
  Save,
  FileText,
  Info,
} from "lucide-react";
import AnalyzerIndicator from "@/components/AnalyzerIndicator";
import CashflowMetrics from "@/components/CashflowMetrics";
import InvestmentMetrics from "@/components/InvestmentMetrics";
import RentalPerformance from "@/components/RentalPerformance";
import AssetGrowthMetrics from "@/components/AssetGrowthMetrics";
import { useUser } from "@/hooks/use-user";
import PropertyAnalyzerForm from "@/components/PropertyAnalyzerForm";
import PropertyMap from "@/components/PropertyMap";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CashflowChart from "@/components/CashflowChart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertyAnalyzerPDF } from "@/features/property-analyzer-pdf/PropertyAnalyzerPDF";
import { generatePDF } from "@/features/property-analyzer-pdf/services/PDFService";
import { ReportSelections } from "@/features/property-analyzer-pdf/types/propertyReport";

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
  const [isDataReady, setIsDataReady] = useState(false);
  const { user } = useUser();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [removeVat, setRemoveVat] = useState(false);
  const [removeTransferDuty, setRemoveTransferDuty] = useState(false);
  const { toast } = useToast();
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  console.log("Preparing PDF Data:", {
    fullAnalysisResult: analysisResult,
    pdfDataStructure: {
      analysisNetOperatingIncome: analysisResult?.analysis?.netOperatingIncome,
      analysisLongTermNetOperatingIncome:
        analysisResult?.analysis?.longTermNetOperatingIncome,
      netOperatingIncome: analysisResult?.netOperatingIncome,
      revenueProjections: analysisResult?.analysis?.revenueProjections,
    },
  });

  const [pdfData, setPDFData] = useState<any>(null);
  const [capturedMapImage, setCapturedMapImage] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);
  const companyLogo = "/your-company-logo.png";

  const calculateBondRegistration = (
    purchasePrice: number,
    includeVat: boolean = true,
  ) => {
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
      console.log("Form data received:", formData);
      setFormData({
        ...formData,
        propertyPhoto: formData.propertyPhoto,
      });

      const deposit =
        formData.depositType === "amount"
          ? parseFloat(formData.depositAmount)
          : (parseFloat(formData.purchasePrice) *
              parseFloat(formData.depositPercentage)) /
            100;

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
        annualPropertyAppreciation: parseFloat(
          formData.annualPropertyAppreciation || 0,
        ),
        ratePerSquareMeter: parseFloat(formData.cmaRatePerSqm || 0),
        propertyDescription: formData.comments || "",
      };

      console.log("Data being sent to analyzer:", requestBody);

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
      console.log("Analysis response:", data);

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
          const y =
            resultsRef.current.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset;
          window.scrollTo({
            top: y,
            behavior: "smooth",
          });
        }
      }, 100);
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
      shortTermAnnualRevenue: Number(
        analysisResult.analysis.shortTermAnnualRevenue || 0,
      ),
      longTermAnnualRevenue: Number(
        analysisResult.analysis.longTermAnnualRevenue || 0,
      ),
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

  const handleGeneratePDF = async (selections: ReportSelections) => {
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
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF report",
        duration: 5000,
      });
    } finally {
    }
  };

  const handleSaveAnalysis = async () => {
    try {
      const dataToSave = prepareAnalysisDataForSave();
      if (!dataToSave) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Missing required data. Please ensure all fields are filled correctly.",
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
        description:
          error instanceof Error ? error.message : "Failed to save analysis",
        duration: 7000,
      });
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
          <div ref={resultsRef}>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Analysis Results
                  </h2>
                  <p className="text-muted-foreground">
                    Based on your provided property details
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleSaveAnalysis}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Analysis
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          // Update the pdfData preparation in the Export PDF button click handler:
                          onClick={() => {
                            if (!analysisResult || !analysisId) return;

                            // Add this console log right before setPDFData
                            console.log("Raw Analysis Result:", {
                              managementFee: analysisResult.managementFee,
                              fullAnalysisResult: analysisResult,
                            });

                            setPDFData({
                              propertyDetails: {
                                address: analysisResult.address,
                                propertyPhoto: formData?.propertyPhoto || null,
                                mapImage: capturedMapImage,
                                bedrooms: formData?.bedrooms,
                                bathrooms: formData?.bathrooms,
                                floorArea: Number(formData?.floorArea),
                                parkingSpaces: Number(formData?.parkingSpaces),
                                purchasePrice:
                                  analysisResult.analysis.purchasePrice,
                                propertyRatePerSquareMeter: Number(
                                  formData?.cmaRatePerSqm,
                                ),
                                areaRate: Number(
                                  analysisResult.ratePerSquareMeter,
                                ),
                                rateDifference:
                                  Number(formData?.cmaRatePerSqm || 0) -
                                  Number(
                                    analysisResult.ratePerSquareMeter || 0,
                                  ),
                                propertyDescription:
                                  analysisResult.propertyDescription,
                              },
                              // Add this new performance object
                              performance: {
                                shortTermNightlyRate: Number(
                                  analysisResult.shortTermNightlyRate,
                                ),
                                annualOccupancy: Number(
                                  analysisResult.annualOccupancy,
                                ),
                                shortTermAnnualRevenue: Number(
                                  analysisResult.analysis
                                    .shortTermAnnualRevenue,
                                ),
                                longTermAnnualRevenue: Number(
                                  analysisResult.analysis.longTermAnnualRevenue,
                                ),
                                shortTermGrossYield: Number(
                                  analysisResult.shortTermGrossYield,
                                ),
                                longTermGrossYield: Number(
                                  analysisResult.longTermGrossYield,
                                ),
                              },
                              financialMetrics: {
                                depositAmount: Number(analysisResult.deposit),
                                depositPercentage: Number(
                                  analysisResult.depositPercentage,
                                ),
                                interestRate: Number(
                                  analysisResult.interestRate,
                                ),
                                loanTerm: Number(analysisResult.loanTerm),
                                monthlyBondRepayment: Number(
                                  analysisResult.monthlyBondRepayment,
                                ),
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
                                // Changed from operatingExpenses to expenses
                                monthlyLevies: Number(formData?.monthlyLevies) || 0,
                                monthlyRatesTaxes: Number(
                                  formData?.monthlyRatesTaxes
                                ) || 0,
                                otherMonthlyExpenses: Number(
                                  formData?.otherMonthlyExpenses
                                ) || 0,
                                maintenancePercent: Number(
                                  formData?.maintenancePercent
                                ) || 0,
                                managementFee: Number(
                                  analysisResult.managementFee
                                ) || 0,
                              },
                              rentalPerformance: {
                                shortTermNightlyRate: Number(
                                  analysisResult.shortTermNightlyRate,
                                ),
                                annualOccupancy: Number(
                                  analysisResult.annualOccupancy,
                                ),
                                shortTermAnnualRevenue: Number(
                                  analysisResult.analysis
                                    .shortTermAnnualRevenue,
                                ),
                                longTermAnnualRevenue: Number(
                                  analysisResult.analysis.longTermAnnualRevenue,
                                ),
                                shortTermGrossYield: Number(
                                  analysisResult.shortTermGrossYield,
                                ),
                                longTermGrossYield: Number(
                                  analysisResult.longTermGrossYield,
                                ),
                                platformFee:
                                  analysisResult.managementFee > 0 ? 15 : 3,
                              },
                              investmentMetrics: {
                                shortTerm:
                                  analysisResult.analysis.investmentMetrics,
                                longTerm:
                                  analysisResult.analysis.investmentMetrics,
                              },
                              netOperatingIncome:
                                analysisResult.netOperatingIncome,
                              revenueProjections:
                                analysisResult.analysis.revenueProjections,
                            });
                            setIsDataReady(true); // Add this after setPDFData

                            // Add this console log after setPDFData
                            console.log("PDF Data being passed:", pdfData);

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                            <h3 className="text-sm font-semibold text-slate-600">
                              Property Photo
                            </h3>
                            <div className="rounded-lg overflow-hidden mt-2">
                              <img
                                src={
                                  formData.propertyPhoto instanceof File
                                    ? URL.createObjectURL(
                                        formData.propertyPhoto,
                                      )
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
                        {analysisResult.monthlyBondRepayment?.toLocaleString() ||
                          "0"}
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
                          onCheckedChange={(checked) =>
                            setRemoveVat(checked as boolean)
                          }
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
                          onCheckedChange={(checked) =>
                            setRemoveTransferDuty(checked as boolean)
                          }
                        />
                        <label
                          htmlFor="removeTransferDuty"
                          className="text-sm text-slate-600 cursor-pointer"
                        >
                          Remove Transfer Duty
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      Total Capital Required
                      <AnalyzerIndicator />
                    </h3>
                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      R
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
                </CardContent>
              </Card>

              <div className="space-y-4">
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
                              <span>
                                R
                                {analysisResult.analysis.shortTermAnnualRevenue?.toLocaleString() ||
                                  "0"}
                              </span>
                              <span
                                className="w-2 h-2 rounded-full bg-red-500"
                                title="Data from analyzer engine"
                              />
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
                              <span
                                className="w-2 h-2 rounded-full bg-red-500"
                                title="Calculated by analysis engine"
                              />
                            </span>
                          </p>
                          <div className="pt-2 border-t border-blue-100">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-slate-600">
                                Nightly Rate:
                              </p>
                              <p className="text-sm font-medium flex items-center gap-2">
                                R
                                {analysisResult.shortTermNightlyRate?.toLocaleString() ||
                                  "0"}
                                <span
                                  className="w-2 h-2 rounded-full bg-red-500"
                                  title="Calculated by analysis engine"
                                />
                              </p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-slate-600">
                                Fee-adjusted Rate:
                              </p>
                              <p className="text-sm font-medium flex items-center gap-2">
                                R
                                {analysisResult.shortTermNightlyRate
                                  ? Math.round(
                                      analysisResult.shortTermNightlyRate *
                                        (1 -
                                          (analysisResult.managementFee > 0
                                            ? 0.15
                                            : 0.03)),
                                    ).toLocaleString()
                                  : "0"}
                                <span
                                  className="w-2 h-2 rounded-full bg-red-500"
                                  title="Calculated by analysis engine"
                                />
                              </p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-slate-600">
                                Platform Fee:
                              </p>
                              <p className="text-sm font-medium text-red-600 flex items-center gap-2">
                                {analysisResult.managementFee > 0 ? "15" : "3"}%
                                <span
                                  className="w-2 h-2 rounded-full bg-red-500"
                                  title="Calculated by analysis engine"
                                />
                              </p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-slate-600">
                                Management Fee:
                              </p>
                              <p className="text-sm font-medium flex items-center gap-2">
                                {analysisResult.managementFee}%
                                <span
                                  className="w-2 h-2 rounded-full bg-red-500"
                                  title="Calculated by analysis engine"
                                />
                              </p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-slate-600">
                                Occupancy:
                              </p>
                              <p className="text-sm font-medium flex items-center gap-2">
                                {analysisResult.annualOccupancy || "0"}%
                                <span
                                  className="w-2 h-2 rounded-full bg-red-500"
                                  title="Calculated by analysis engine"
                                />
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-50/50">
                        <h3 className="text-sm font-bold text-purple-600 mb-3">
                          LongTerm Rental (Year 1)
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                              R{" "}
                              {analysisResult.analysis.longTermAnnualRevenue?.toLocaleString() ||
                                "0"}
                              <span
                                className="w-2 h-2 rounded-full bg-red-500"
                                title="Data from analyzer engine"
                              />
                            </p>
                            <p className="text-base text-slate600">
                              R{" "}
                              {Math.round(
                                (analysisResult.analysis
                                  .longTermAnnualRevenue || 0) / 12,
                              ).toLocaleString()}{" "}
                              /month
                            </p>
                          </div>
                          <p className="text-sm flex items-center gap-2">
                            <span className="font-semibold text-emerald-600 text-base flex items-center gap-2">
                              {analysisResult.longTermGrossYield?.toFixed(2) ||
                                "0"}
                              % Gross Yield
                              <span
                                className="w-2 h-2 rounded-full bg-red-500"
                                title="Calculated by analysis engine"
                              />
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                        <div>
                          <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            Area Rate/m²
                            <AnalyzerIndicator />
                          </h3>
                          <p className="mt-2 text-lg font-bold text-slate-800">
                            R{formData?.cmaRatePerSqm?.toLocaleString() || "0"}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                            Rate/m² Difference
                            <AnalyzerIndicator />
                          </h3>
                          <div className="flex items-center gap-2">
                            <p
                              className={`mt-2 text-lg font-bold ${analysisResult.rateDifference > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              R
                              {Math.abs(
                                analysisResult.rateDifference,
                              ).toLocaleString()}
                            </p>
                            <span
                              className={`text-sm font-medium ${analysisResult.rateDifference > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              (
                              {analysisResult.rateDifference > 0
                                ? "less"
                                : "more"}{" "}
                              than avg.)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
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
                    longTermMonthly={
                      analysisResult.analysis.longTermAnnualRevenue
                        ? analysisResult.analysis.longTermAnnualRevenue / 12
                        : 0
                    }
                    managementFee={analysisResult.managementFee || 0}
                  />
                </CardContent>
              </Card>

              <CashflowMetrics
                shortTermNightly={analysisResult.shortTermNightlyRate || 0}
                longTermMonthly={
                  analysisResult.analysis.longTermAnnualRevenue
                    ? analysisResult.analysis.longTermAnnualRevenue / 12
                    : 0
                }
                monthlyBondRepayment={analysisResult.monthlyBondRepayment || 0}
                managementFee={analysisResult.managementFee}
                revenueProjections={{
                  shortTerm:
                    analysisResult.analysis.revenueProjections?.shortTerm ||
                    null,
                }}
                operatingExpenses={analysisResult.analysis.operatingExpenses}
                netOperatingIncome={analysisResult.analysis.netOperatingIncome}
                longTermNetOperatingIncome={
                  analysisResult.analysis.longTermNetOperatingIncome
                }
              />

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    Investment Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <InvestmentMetrics
                    yearlyMetrics={analysisResult.analysis.investmentMetrics}
                    metricDescriptions={{
                      grossYield: {
                        title: "Gross Yield",
                        explanation:
                          "Annual gross rental income as a percentage of the property's purchase price",
                        calculationMethod:
                          "(Annual Gross Rental Income / Property Purchase Price) × 100",
                      },
                      netYield: {
                        title: "Net Yield",
                        explanation:
                          "Annual net rental income (after expenses) as a percentage of the property's purchase price",
                        calculationMethod:
                          "(Annual Net Operating Income / Property Purchase Price) × 100",
                      },
                      returnOnEquity: {
                        title: "Return on Equity",
                        explanation:
                          "Annual return relative to the equity invested in the property",
                        calculationMethod:
                          "(Annual Net Operating Income / Total Equity Invested) × 100",
                      },
                      annualReturn: {
                        title: "Annual Return",
                        explanation:
                          "Total return including rental income and property appreciation for the year",
                        calculationMethod:
                          "((Net Operating Income + Property Value Increase) / Initial Investment) × 100",
                      },
                      capRate: {
                        title: "Cap Rate",
                        explanation:
                          "Net operating income as a percentage of property value, indicating potential return regardless of financing",
                        calculationMethod:
                          "(Net Operating Income / Current Property Value) × 100",
                      },
                      cashOnCashReturn: {
                        title: "Cash on Cash Return",
                        explanation:
                          "Annual pre-tax cash flow relative to total cash invested",
                        calculationMethod:
                          "(Annual Pre-tax Cash Flow / Total Cash Invested) × 100",
                      },
                      irr: {
                        title: "Internal Rate of Return (IRR)",
                        explanation:
                          "The discount rate that makes the net present value of all cash flows equal to zero",
                        calculationMethod:
                          "Complex calculation using all future cash flows and initial investment",
                      },
                      netWorthChange: {
                        title: "Net Worth Change",
                        explanation:
                          "Total change in net worth including equity buildup, appreciation, and rental income",
                        calculationMethod:
                          "Property Value Increase + Loan Principal Paid + Cumulative Rental Income",
                      },
                    }}
                  />
                </CardContent>
              </Card>

              <AssetGrowthMetrics
                purchasePrice={analysisResult.analysis.purchasePrice}
                deposit={analysisResult.deposit || 0}
                loanAmount={
                  analysisResult.analysis.purchasePrice -
                  (analysisResult.deposit || 0)
                }
                interestRate={analysisResult.interestRate || 0}
                loanTerm={analysisResult.loanTerm || 20}
                annualAppreciation={formData?.annualPropertyAppreciation || 5}
              />
            </div>
          </div>
        )}
        <Dialog open={showPDFGenerator} onOpenChange={setShowPDFGenerator}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Generate Property Analysis Report</DialogTitle>
            </DialogHeader>
            {isDataReady && pdfData && (
              <PropertyAnalyzerPDF
                data={pdfData}
                companyLogo={user?.settings?.companyLogo || ""}
                onClose={() => {
                  setShowPDFGenerator(false);
                  setIsDataReady(false);
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