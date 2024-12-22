import { useState, useRef } from "react";
import { useLocation } from "wouter";
import html2pdf from "html2pdf.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { findCostFromTable, bondCostsTable, transferCostsTable } from "@/lib/costTables";
import { AlertCircle, BarChart3, TrendingUp, Building2 } from "lucide-react";
import AnalyzerIndicator from "@/components/AnalyzerIndicator";
import CashflowMetrics from "@/components/CashflowMetrics";
import InvestmentMetrics from "@/components/InvestmentMetrics";
import RentalPerformance from "@/components/RentalPerformance";
import AssetGrowthMetrics from "@/components/AssetGrowthMetrics";
import PerformanceProjections from "@/components/PerformanceProjections";
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
  managementFee: number;
  loanTerm: number;
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
    revenueProjections?: {
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

export default function PropertyAnalyzerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [removeVat, setRemoveVat] = useState(false);
  const [removeTransferDuty, setRemoveTransferDuty] = useState(false);
  const [reportSections, setReportSections] = useState({
    locationPhoto: true,
    dealStructure: true,
    revenuePerformance: true,
    sizeAndRate: true,
    cashflowMetrics: true,
    investmentMetrics: true,
    performanceProjections: true,
  });
  const reportRef = useRef<HTMLDivElement>(null);

  const handleSaveAnalysis = async (analysisResult: AnalysisResult, formData: any) => {
    try {
      const response = await fetch("/api/property-analyses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: analysisResult.address,
          purchasePrice: analysisResult.analysis.purchasePrice,
          deposit: analysisResult.deposit,
          shortTermRevenue: analysisResult.analysis.shortTermAnnualRevenue,
          longTermRevenue: analysisResult.analysis.longTermAnnualRevenue,
          shortTermGrossYield: analysisResult.shortTermGrossYield,
          longTermGrossYield: analysisResult.longTermGrossYield,
          monthlyBondRepayment: analysisResult.monthlyBondRepayment,
          interestRate: analysisResult.interestRate,
          loanTerm: analysisResult.loanTerm,
          propertyPhoto: formData.propertyPhoto,
          propertyDescription: analysisResult.propertyDescription,
          floorArea: analysisResult.floorArea,
          shortTermNightlyRate: analysisResult.shortTermNightlyRate,
          annualOccupancy: analysisResult.annualOccupancy,
          managementFee: analysisResult.managementFee,
          revenueProjections: analysisResult.analysis.revenueProjections,
          operatingExpenses: analysisResult.analysis.operatingExpenses,
          netOperatingIncome: analysisResult.analysis.netOperatingIncome
        }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to save analysis");
      }

      toast({
        title: "Analysis Saved",
        description: "Your property analysis has been saved successfully.",
      });

      setLocation("/properties");
    } catch (error) {
      console.error("Error saving analysis:", error);
      toast({
        title: "Error",
        description: "Failed to save analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateReport = async () => {
    if (!reportRef.current || !analysisResult) return;

    const reportContent = reportRef.current.cloneNode(true) as HTMLElement;

    Object.entries(reportSections).forEach(([section, include]) => {
      if (!include) {
        const sectionElement = reportContent.querySelector(`[data-section="${section}"]`);
        if (sectionElement) {
          sectionElement.remove();
        }
      }
    });

    const opt = {
      margin: 1,
      filename: `Property Analysis - ${analysisResult.address}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(reportContent).save();
      toast({
        title: "Report Generated",
        description: "Your property analysis report has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      setFormData({
        ...formData,
        propertyPhoto: formData.propertyPhoto
      });

      const requestBody = {
        address: formData.address,
        propertyUrl: formData.propertyUrl,
        purchasePrice: Number(formData.purchasePrice),
        floorArea: Number(formData.floorArea),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        parkingSpaces: Number(formData.parkingSpaces || 0),
        depositType: formData.depositType,
        deposit: Number(formData.depositAmount),
        depositPercentage: Number(formData.depositPercentage),
        interestRate: Number(formData.interestRate),
        loanTerm: Number(formData.loanTerm),
        monthlyLevies: Number(formData.monthlyLevies || 0),
        monthlyRatesTaxes: Number(formData.monthlyRatesTaxes || 0),
        otherMonthlyExpenses: Number(formData.otherMonthlyExpenses || 0),
        maintenancePercent: Number(formData.maintenancePercent || 0),
        managementFee: Number(formData.managementFee || 0),
        shortTermNightlyRate: Number(formData.airbnbNightlyRate || 0),
        annualOccupancy: Number(formData.occupancyRate || 0),
        longTermRental: Number(formData.longTermRental || 0),
        leaseCycleGap: Number(formData.leaseCycleGap || 0),
        annualIncomeGrowth: Number(formData.annualIncomeGrowth || 0),
        annualExpenseGrowth: Number(formData.annualExpenseGrowth || 0),
        annualPropertyAppreciation: Number(formData.annualPropertyAppreciation || 0),
        ratePerSquareMeter: Number(formData.cmaRatePerSqm || 0),
        propertyDescription: formData.comments || "",
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        managementFee: requestBody.managementFee,
        loanTerm: requestBody.loanTerm
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
          <div ref={reportRef}>
            {/* Analysis Results Header */}
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Analysis Results
                </h2>
                <p className="text-muted-foreground">
                  Based on your provided property details
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleSaveAnalysis(analysisResult, formData)}
                  className="bg-[#1BA3FF] hover:bg-[#114D9D]"
                >
                  Save Analysis
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Generate Report</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Generate Property Report</DialogTitle>
                      <DialogDescription>
                        Select the sections you want to include in your report.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        {Object.entries(reportSections).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={value}
                              onCheckedChange={(checked) =>
                                setReportSections(prev => ({
                                  ...prev,
                                  [key]: !!checked
                                }))
                              }
                            />
                            <label
                              htmlFor={key}
                              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={generateReport}>Generate PDF</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location and Photo */}
              <Card data-section="locationPhoto">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-500" />
                    Location & Photo
                  </CardTitle>
                  <CardDescription>
                    {analysisResult.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden">
                    <PropertyMap address={analysisResult.address} />
                  </div>
                  {formData?.propertyPhoto && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-slate-600">Property Photo</h3>
                      <div className="rounded-lg overflow-hidden mt-2">
                        <img
                          src={formData.propertyPhoto instanceof File ? 
                            URL.createObjectURL(formData.propertyPhoto) : 
                            typeof formData.propertyPhoto === 'string' ? 
                              formData.propertyPhoto : undefined
                          }
                          alt="Property"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Performance */}
              <Card data-section="revenuePerformance">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Revenue Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RentalPerformance
                    shortTermAnnualRevenue={analysisResult.analysis.shortTermAnnualRevenue}
                    longTermAnnualRevenue={analysisResult.analysis.longTermAnnualRevenue}
                    shortTermGrossYield={analysisResult.shortTermGrossYield}
                    longTermGrossYield={analysisResult.longTermGrossYield}
                    shortTermNightlyRate={analysisResult.shortTermNightlyRate}
                    annualOccupancy={analysisResult.annualOccupancy}
                    managementFee={analysisResult.managementFee}
                  />
                </CardContent>
              </Card>

              {/* Size and Rate */}
              <Card data-section="sizeAndRate">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-cyan-500" />
                    Size and Rate/m²
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                        R{(
                          analysisResult.analysis.purchasePrice /
                          (analysisResult.floorArea || 1)
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cashflow Metrics */}
              <Card data-section="cashflowMetrics">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800">
                    Cashflow Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CashflowMetrics
                    shortTermNightly={analysisResult.shortTermNightlyRate}
                    longTermMonthly={analysisResult.analysis.longTermAnnualRevenue ? analysisResult.analysis.longTermAnnualRevenue / 12 : 0}
                    monthlyBondRepayment={analysisResult.monthlyBondRepayment}
                    managementFee={analysisResult.managementFee}
                    revenueProjections={analysisResult.analysis.revenueProjections}
                    operatingExpenses={analysisResult.analysis.operatingExpenses}
                    netOperatingIncome={analysisResult.analysis.netOperatingIncome}
                  />
                </CardContent>
              </Card>

              {/* Investment Metrics */}
              <Card data-section="investmentMetrics">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800">
                    Investment Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <InvestmentMetrics
                    purchasePrice={analysisResult.analysis.purchasePrice}
                    deposit={analysisResult.deposit}
                    monthlyBondRepayment={analysisResult.monthlyBondRepayment}
                    shortTermNightly={analysisResult.shortTermNightlyRate}
                    longTermMonthly={analysisResult.analysis.longTermAnnualRevenue ? analysisResult.analysis.longTermAnnualRevenue / 12 : 0}
                    revenueProjections={analysisResult.analysis.revenueProjections}
                    operatingExpenses={analysisResult.analysis.operatingExpenses}
                    netOperatingIncome={analysisResult.analysis.netOperatingIncome}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Performance Projections */}
            <div className="mt-6">
              <Card data-section="performanceProjections">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800">
                    Performance Projections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PerformanceProjections
                    revenueProjections={analysisResult.analysis.revenueProjections}
                    operatingExpenses={analysisResult.analysis.operatingExpenses}
                    netOperatingIncome={analysisResult.analysis.netOperatingIncome}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}