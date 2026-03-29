import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { Link } from "wouter";
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
  ArrowLeft,
  FileText,
} from "lucide-react";
import CashflowMetrics from "@/components/CashflowMetrics";
import InvestmentMetrics from "@/components/InvestmentMetrics";
import RentalPerformance from "@/components/RentalPerformance";
import AssetGrowthMetrics from "@/components/AssetGrowthMetrics";
import PropertyMap from "@/components/PropertyMap";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertyAnalyzerPDF } from "@/features/property-analyzer-pdf/PropertyAnalyzerPDF";

export default function PropertyAnalyzerDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useUser();
  const [removeVat, setRemoveVat] = useState(false);
  const [removeTransferDuty, setRemoveTransferDuty] = useState(false);
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);
  const [pdfData, setPDFData] = useState<any>(null);

  const { data: property, isLoading, error } = useQuery({
    queryKey: ["/api/property-analyzer/properties", id],
    queryFn: async () => {
      const res = await fetch(`/api/property-analyzer/properties/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch property");
      return res.json();
    },
    enabled: !!id,
  });

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

  if (isLoading) {
    return (
      <div className="px-4 py-6 flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading property analysis...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="px-4 py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">
                Property not found or failed to load.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const purchasePrice = Number(property.purchasePrice);
  const floorArea = Number(property.floorArea);
  const deposit = Number(property.depositAmount);
  const depositPercentage = Number(property.depositPercentage);
  const interestRate = Number(property.interestRate);
  const loanTerm = Number(property.loanTerm);
  const monthlyBondRepayment = Number(property.monthlyBondRepayment || 0);
  const shortTermNightlyRate = Number(property.shortTermNightlyRate || 0);
  const annualOccupancy = Number(property.annualOccupancy || 0);
  const managementFee = Number(property.managementFee || 0);
  const shortTermGrossYield = Number(property.shortTermGrossYield || 0);
  const longTermGrossYield = Number(property.longTermGrossYield || 0);
  const shortTermAnnualRevenue = Number(property.shortTermAnnualRevenue || 0);
  const longTermAnnualRevenue = Number(property.longTermAnnualRevenue || 0);
  const cmaRatePerSqm = Number(property.ratePerSquareMeter || 0);
  const propertyRatePerSqm = floorArea > 0 ? purchasePrice / floorArea : 0;
  const rateDifference = cmaRatePerSqm - propertyRatePerSqm;

  const revenueProjections = property.revenueProjections || {};
  const operatingExpenses = property.operatingExpenses || {};
  const netOperatingIncome = property.netOperatingIncome || null;
  const investmentMetrics = property.investmentMetrics || {};

  const bondRegistration = calculateBondRegistration(purchasePrice, !removeVat);
  const transferCosts = calculateTransferCosts(
    purchasePrice,
    !removeVat,
    !removeTransferDuty,
  );
  const totalCapitalRequired = deposit + bondRegistration + transferCosts;

  const handleExportPDF = () => {
    setPDFData({
      propertyDetails: {
        address: property.address,
        propertyPhoto: property.propertyPhoto || null,
        mapImage: null,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        floorArea,
        parkingSpaces: Number(property.parkingSpaces || 0),
        purchasePrice,
        ratePerSquareMeter: cmaRatePerSqm,
        areaRate: propertyRatePerSqm,
        rateDifference,
        propertyDescription: property.propertyDescription,
      },
      analysis: {
        netOperatingIncome,
        longTermNetOperatingIncome: null,
        revenueProjections,
      },
      performance: {
        shortTermNightlyRate,
        annualOccupancy,
        shortTermAnnualRevenue,
        longTermAnnualRevenue,
        shortTermGrossYield,
        longTermGrossYield,
      },
      financialMetrics: {
        depositAmount: deposit,
        depositPercentage,
        interestRate,
        loanTerm,
        monthlyBondRepayment,
        bondRegistration,
        transferCosts,
        totalCapitalRequired,
      },
      expenses: {
        monthlyLevies: Number(property.monthlyLevies || 0),
        monthlyRatesTaxes: Number(property.monthlyRatesTaxes || 0),
        otherMonthlyExpenses: Number(property.otherMonthlyExpenses || 0),
        maintenancePercent: Number(property.maintenancePercent || 0),
        managementFee,
      },
      rentalPerformance: {
        shortTermNightlyRate,
        annualOccupancy,
        shortTermAnnualRevenue,
        longTermAnnualRevenue,
        shortTermGrossYield,
        longTermGrossYield,
        platformFee: managementFee > 0 ? 15 : 3,
      },
      investmentMetrics,
      netOperatingIncome,
      revenueProjections,
    });
    setShowPDFGenerator(true);
  };

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/properties">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Analysis Results</h1>
            <p className="text-muted-foreground mt-1">{property.address}</p>
          </div>
        </div>
        <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <div className="space-y-6">
        {/* Top 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Location & Photo */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  Location & Photo
                </CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  {property.address}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden">
                  <PropertyMap address={property.address} />
                </div>
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
                  {property.propertyDescription || "No description available"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">
                    Purchase Price
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-slate-800">
                    R{purchasePrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">
                    Deposit
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-slate-800">
                    R{deposit.toLocaleString()}
                    <span className="ml-2 text-base font-semibold text-indigo-600">
                      ({depositPercentage}%)
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
                    {interestRate}%
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">
                    Loan Term
                  </h3>
                  <p className="mt-2 text-lg font-bold text-slate-800">
                    {loanTerm} years
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">
                    Monthly Bond Payment
                  </h3>
                  <p className="mt-2 text-lg font-bold text-slate-800">
                    R{monthlyBondRepayment.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">
                    Bond Registration
                  </h3>
                  <p className="mt-2 text-lg font-bold text-slate-800">
                    R{bondRegistration.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-600">
                  Transfer Costs
                </h3>
                <p className="mt-2 text-lg font-bold text-slate-800">
                  R{transferCosts.toLocaleString()}
                </p>
                <div className="space-y-2 mt-2">
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
                <h3 className="text-base font-bold text-slate-800">
                  Total Capital Required
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  R{totalCapitalRequired.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Performance + Size/Rate */}
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
                        <p className="text-2xl font-bold text-slate-800">
                          R{shortTermAnnualRevenue.toLocaleString()}
                        </p>
                        <p className="text-base text-slate-600">
                          R
                          {Math.round(
                            shortTermAnnualRevenue / 12,
                          ).toLocaleString()}
                          /month
                        </p>
                      </div>
                      <p className="text-sm flex items-center gap-2">
                        <span className="font-semibold text-emerald-600 text-base">
                          {shortTermGrossYield.toFixed(2)}% Gross Yield
                        </span>
                      </p>
                      <div className="pt-2 border-t border-blue-100">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-slate-600">Nightly Rate:</p>
                          <p className="text-sm font-medium">
                            R{shortTermNightlyRate.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-slate-600">
                            Fee-adjusted Rate:
                          </p>
                          <p className="text-sm font-medium">
                            R
                            {Math.round(
                              shortTermNightlyRate *
                                (1 - (managementFee > 0 ? 0.15 : 0.03)),
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-slate-600">Platform Fee:</p>
                          <p className="text-sm font-medium text-red-600">
                            {managementFee > 0 ? "15" : "3"}%
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-slate-600">
                            Management Fee:
                          </p>
                          <p className="text-sm font-medium">{managementFee}%</p>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-sm text-slate-600">Occupancy:</p>
                          <p className="text-sm font-medium">
                            {annualOccupancy}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50/50">
                    <h3 className="text-sm font-bold text-purple-600 mb-3">
                      Long Term Rental (Year 1)
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-2xl font-bold text-slate-800">
                          R{" "}
                          {longTermAnnualRevenue.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-base text-slate-600">
                          R{Math.round(longTermAnnualRevenue / 12).toLocaleString()}{" "}
                          /month
                        </p>
                      </div>
                      <p className="text-sm flex items-center gap-2">
                        <span className="font-semibold text-emerald-600 text-base">
                          {longTermGrossYield.toFixed(2)}% Gross Yield
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
                      <h3 className="text-sm font-semibold text-slate-600">
                        Floor Area
                      </h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        {floorArea} m²
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">
                        Current Property Rate/m²
                      </h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R
                        {propertyRatePerSqm.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">
                        Area Rate/m²
                      </h3>
                      <p className="mt-2 text-lg font-bold text-slate-800">
                        R{cmaRatePerSqm.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-600">
                        Rate/m² Difference
                      </h3>
                      <div className="flex items-center gap-2">
                        <p
                          className={`mt-2 text-lg font-bold ${rateDifference > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          R
                          {Math.abs(rateDifference).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <span
                          className={`text-sm font-medium ${rateDifference > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          ({rateDifference > 0 ? "less" : "more"} than avg.)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lower sections */}
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
                shortTermNightly={shortTermNightlyRate}
                longTermMonthly={longTermAnnualRevenue / 12}
                managementFee={managementFee}
              />
            </CardContent>
          </Card>

          <CashflowMetrics
            shortTermNightly={shortTermNightlyRate}
            longTermMonthly={longTermAnnualRevenue / 12}
            monthlyBondRepayment={monthlyBondRepayment}
            managementFee={managementFee}
            revenueProjections={{
              shortTerm: (revenueProjections as any)?.shortTerm || null,
              longTerm: (revenueProjections as any)?.longTerm || null,
            }}
            operatingExpenses={operatingExpenses as any}
            longTermOperatingExpenses={(property.longTermOperatingExpenses || {}) as any}
            netOperatingIncome={netOperatingIncome}
            longTermNetOperatingIncome={null}
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
                yearlyMetrics={investmentMetrics as any}
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
            purchasePrice={purchasePrice}
            deposit={deposit}
            loanAmount={purchasePrice - deposit}
            interestRate={interestRate}
            loanTerm={loanTerm || 20}
            annualAppreciation={5}
          />
        </div>
      </div>

      <Dialog open={showPDFGenerator} onOpenChange={setShowPDFGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Generate Property Analysis Report</DialogTitle>
          </DialogHeader>
          {pdfData && (
            <PropertyAnalyzerPDF
              data={pdfData}
              companyLogo={user?.settings?.companyLogo || ""}
              onClose={() => setShowPDFGenerator(false)}
              isOpen={showPDFGenerator}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
