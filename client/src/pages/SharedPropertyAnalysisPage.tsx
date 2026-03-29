import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  BedDouble,
  Bath,
  Ruler,
  Home,
} from "lucide-react";
import CashflowMetrics from "@/components/CashflowMetrics";
import InvestmentMetrics from "@/components/InvestmentMetrics";
import RentalPerformance from "@/components/RentalPerformance";
import AssetGrowthMetrics from "@/components/AssetGrowthMetrics";
import MapView from "@/components/MapView";

export default function SharedPropertyAnalysisPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [removeVat, setRemoveVat] = useState(false);
  const [removeTransferDuty, setRemoveTransferDuty] = useState(false);

  const { data: property, isLoading, error } = useQuery({
    queryKey: ["/api/property-analyzer/shared", token],
    queryFn: async () => {
      const res = await fetch(`/api/property-analyzer/shared/${token}`);
      if (!res.ok) throw new Error("Analysis not found");
      return res.json();
    },
    enabled: !!token,
  });

  const calculateBondRegistration = (purchasePrice: number, includeVat = true) => {
    const costs = findCostFromTable(purchasePrice, bondCostsTable);
    if (!costs) return 0;
    return includeVat ? costs.total : costs.total - costs.vat;
  };

  const calculateTransferCosts = (
    purchasePrice: number,
    includeVat = true,
    includeTransferDuty = true,
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading analysis…</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="border-red-200 bg-red-50 max-w-md w-full">
          <CardContent className="pt-6 flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              This shared analysis could not be found or may have expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const purchasePrice            = Number(property.purchasePrice);
  const floorArea                = Number(property.floorArea);
  const deposit                  = Number(property.depositAmount);
  const depositPercentage        = Number(property.depositPercentage);
  const interestRate             = Number(property.interestRate);
  const loanTerm                 = Number(property.loanTerm);
  const monthlyBondRepayment     = Number(property.monthlyBondRepayment     || 0);
  const shortTermNightlyRate     = Number(property.shortTermNightlyRate     || 0);
  const annualOccupancy          = Number(property.annualOccupancy          || 0);
  const managementFee            = Number(property.managementFee            || 0);
  const shortTermGrossYield      = Number(property.shortTermGrossYield      || 0);
  const longTermGrossYield       = Number(property.longTermGrossYield       || 0);
  const shortTermAnnualRevenue   = Number(property.shortTermAnnualRevenue   || 0);
  const longTermAnnualRevenue    = Number(property.longTermAnnualRevenue    || 0);
  const cmaRatePerSqm            = Number(property.ratePerSquareMeter       || 0);
  const propertyRatePerSqm       = floorArea > 0 ? purchasePrice / floorArea : 0;
  const rateDifference           = cmaRatePerSqm - propertyRatePerSqm;
  const annualPropertyAppreciation = Number(property.annualPropertyAppreciation || 5);

  const revenueProjections         = property.revenueProjections          || {};
  const operatingExpenses          = property.operatingExpenses           || {};
  const rawNoi                     = property.netOperatingIncome;
  const netOperatingIncome         = rawNoi && (rawNoi as any).year1 ? rawNoi : null;
  const rawLongTermNoi             = property.longTermNetOperatingIncome;
  const longTermNetOperatingIncome = rawLongTermNoi && (rawLongTermNoi as any).year1 ? rawLongTermNoi : null;
  const longTermOperatingExpenses  = property.longTermOperatingExpenses   || {};
  const investmentMetrics          = property.investmentMetrics           || {};

  const bondRegistration     = calculateBondRegistration(purchasePrice, !removeVat);
  const transferCosts        = calculateTransferCosts(purchasePrice, !removeVat, !removeTransferDuty);
  const totalCapitalRequired = deposit + bondRegistration + transferCosts;

  const analysisDate = new Date(property.createdAt || Date.now()).toLocaleDateString("en-ZA", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Branded header ── */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <img src="/proply-logo-1.png" alt="Proply" className="h-8 object-contain" />
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-semibold text-slate-700">Property Analysis Report</p>
            <p className="text-[10px] text-slate-400">
              {new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-8 space-y-5">

        {/* ── Hero card ── */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-lg">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">
                Property Analysis Report
              </p>
              <h1 className="text-2xl font-bold text-white leading-tight">
                {property.propertyDescription || property.address}
              </h1>
              <p className="text-slate-300 mt-1.5 text-sm">{property.address}</p>
              <div className="flex flex-wrap items-center gap-2 mt-5">
                {[
                  { icon: <BedDouble className="h-3 w-3" />, label: `${property.bedrooms} Bedrooms` },
                  { icon: <Bath className="h-3 w-3" />,      label: `${property.bathrooms} Bathrooms` },
                  { icon: <Ruler className="h-3 w-3" />,     label: `${floorArea} m²` },
                  { icon: <TrendingUp className="h-3 w-3" />,label: `${annualOccupancy}% Target Occupancy` },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-[11px] font-medium px-3 py-1.5 rounded-full"
                  >
                    {chip.icon} {chip.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-slate-500 text-[10px] uppercase tracking-wide">Analysis Date</p>
              <p className="text-slate-200 text-sm font-semibold mt-1">{analysisDate}</p>
            </div>
          </div>
        </div>

        {/* ── KPI tiles ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Purchase Price",
              value: `R ${purchasePrice.toLocaleString()}`,
              sub:   `Deposit: ${depositPercentage}%`,
              bar:   "bg-slate-400",
              color: "text-slate-800",
            },
            {
              label: "Monthly Bond",
              value: `R ${monthlyBondRepayment.toLocaleString()}`,
              sub:   `${interestRate}% over ${loanTerm} years`,
              bar:   "bg-blue-500",
              color: "text-blue-700",
            },
            {
              label: "Total Capital Required",
              value: `R ${totalCapitalRequired.toLocaleString()}`,
              sub:   "Deposit + bond reg + transfer",
              bar:   "bg-amber-500",
              color: "text-amber-700",
            },
            {
              label: "Short-Term Gross Yield",
              value: `${shortTermGrossYield.toFixed(2)}%`,
              sub:   `Long-term: ${longTermGrossYield.toFixed(2)}%`,
              bar:   "bg-emerald-500",
              color: "text-emerald-700",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`h-1 ${kpi.bar}`} />
              <div className="p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                <p className={`text-xl font-bold mt-2 leading-tight ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Revenue comparison ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Short-Term */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="font-bold text-white text-[15px]">Short-Term Rental</h3>
              <p className="text-blue-200 text-xs mt-0.5">Airbnb / short-stay platform</p>
            </div>
            <div className="px-6 py-4 divide-y divide-slate-100">
              <RevRow label="Nightly Rate"    value={`R ${shortTermNightlyRate.toLocaleString()}`} />
              <RevRow label="Annual Occupancy" value={`${annualOccupancy}%`} />
              <RevRow label="Platform Fee"    value={managementFee > 0 ? "15%" : "3%"} />
              {managementFee > 0 && (
                <RevRow label="Management Fee" value={`${managementFee}%`} />
              )}
              <div className="flex justify-between pt-3.5 pb-0.5">
                <span className="text-[13px] font-bold text-slate-800">Annual Revenue</span>
                <span className="text-[15px] font-bold text-blue-700">
                  R {shortTermAnnualRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[12px] text-slate-500">Gross Yield</span>
                <span className="text-[13px] font-bold text-emerald-600">{shortTermGrossYield.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Long-Term */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h3 className="font-bold text-white text-[15px]">Long-Term Rental</h3>
              <p className="text-purple-200 text-xs mt-0.5">Traditional lease arrangement</p>
            </div>
            <div className="px-6 py-4 divide-y divide-slate-100">
              <RevRow label="Monthly Rental" value={`R ${Math.round(longTermAnnualRevenue / 12).toLocaleString()}`} />
              <div className="flex justify-between pt-3.5 pb-0.5">
                <span className="text-[13px] font-bold text-slate-800">Annual Revenue</span>
                <span className="text-[15px] font-bold text-purple-700">
                  R {longTermAnnualRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[12px] text-slate-500">Gross Yield</span>
                <span className="text-[13px] font-bold text-emerald-600">{longTermGrossYield.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Deal Structure ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-[15px]">Deal Structure</h3>
          </div>
          <div className="px-6 py-5 space-y-5">
            {property.propertyDescription && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Property Description</p>
                <p className="mt-1.5 text-slate-700 text-sm">{property.propertyDescription}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <Stat label="Purchase Price"       value={`R ${purchasePrice.toLocaleString()}`} large />
              <Stat label="Deposit"              value={`R ${deposit.toLocaleString()}`} sub={`${depositPercentage}%`} large />
              <Stat label="Interest Rate"        value={`${interestRate}%`} />
              <Stat label="Loan Term"            value={`${loanTerm} years`} />
              <Stat label="Monthly Bond Payment" value={`R ${monthlyBondRepayment.toLocaleString()}`} />
              <Stat label="Bond Registration"    value={`R ${bondRegistration.toLocaleString()}`} />
            </div>

            {/* Transfer costs with toggles */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Transfer Costs</p>
                  <p className="mt-1.5 text-lg font-bold text-slate-800">R {transferCosts.toLocaleString()}</p>
                </div>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <Checkbox
                      id="removeVat"
                      checked={removeVat}
                      onCheckedChange={(v) => setRemoveVat(v as boolean)}
                    />
                    Remove VAT
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <Checkbox
                      id="removeTransferDuty"
                      checked={removeTransferDuty}
                      onCheckedChange={(v) => setRemoveTransferDuty(v as boolean)}
                    />
                    Remove Transfer Duty
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-slate-200 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Total Capital Required</span>
              <span className="text-xl font-bold text-amber-700">R {totalCapitalRequired.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Size & Rate/m² ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-[15px]">Size &amp; Rate per m²</h3>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <Stat label="Floor Area"       value={`${floorArea} m²`} />
            <Stat label="Property Rate/m²" value={`R ${propertyRatePerSqm.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <Stat label="Area Rate/m²"     value={`R ${cmaRatePerSqm.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Rate Difference</p>
              <p className={`mt-1.5 text-lg font-bold ${rateDifference > 0 ? "text-emerald-600" : "text-red-600"}`}>
                {rateDifference > 0 ? "+" : "−"} R {Math.abs(rateDifference).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {rateDifference > 0 ? "Below area average" : "Above area average"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Rental Performance ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="font-bold text-slate-800 text-[15px]">Rental Performance</h3>
          </div>
          <div className="px-6 py-5">
            <RentalPerformance
              shortTermNightly={shortTermNightlyRate}
              longTermMonthly={longTermAnnualRevenue / 12}
              managementFee={managementFee}
            />
          </div>
        </div>

        {/* ── Cashflow Metrics ── */}
        <CashflowMetrics
          shortTermNightly={shortTermNightlyRate}
          longTermMonthly={longTermAnnualRevenue / 12}
          monthlyBondRepayment={monthlyBondRepayment}
          managementFee={managementFee}
          revenueProjections={{
            shortTerm: (revenueProjections as any)?.shortTerm || null,
            longTerm:  (revenueProjections as any)?.longTerm  || null,
          }}
          operatingExpenses={operatingExpenses as any}
          longTermOperatingExpenses={longTermOperatingExpenses as any}
          netOperatingIncome={netOperatingIncome}
          longTermNetOperatingIncome={longTermNetOperatingIncome}
        />

        {/* ── Investment Metrics ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-green-500" />
            <h3 className="font-bold text-slate-800 text-[15px]">Investment Metrics</h3>
          </div>
          <div className="px-6 py-5">
            <InvestmentMetrics
              yearlyMetrics={investmentMetrics as any}
              metricDescriptions={{
                grossYield:      { title: "Gross Yield",         explanation: "Annual gross rental income as a percentage of the property's purchase price",                             calculationMethod: "(Annual Gross Rental Income / Property Purchase Price) × 100" },
                netYield:        { title: "Net Yield",           explanation: "Annual net rental income (after expenses) as a percentage of the property's purchase price",              calculationMethod: "(Annual Net Operating Income / Property Purchase Price) × 100" },
                returnOnEquity:  { title: "Return on Equity",    explanation: "Annual return relative to the equity invested in the property",                                            calculationMethod: "(Annual Net Operating Income / Total Equity Invested) × 100" },
                annualReturn:    { title: "Annual Return",       explanation: "Total return including rental income and property appreciation for the year",                              calculationMethod: "((Net Operating Income + Property Value Increase) / Initial Investment) × 100" },
                capRate:         { title: "Cap Rate",            explanation: "Net operating income as a percentage of property value, indicating potential return regardless of financing", calculationMethod: "(Net Operating Income / Current Property Value) × 100" },
                cashOnCashReturn:{ title: "Cash on Cash Return", explanation: "Annual pre-tax cash flow relative to total cash invested",                                                calculationMethod: "(Annual Pre-tax Cash Flow / Total Cash Invested) × 100" },
                irr:             { title: "IRR",                 explanation: "The discount rate that makes the net present value of all cash flows equal to zero",                      calculationMethod: "Complex calculation using all future cash flows and initial investment" },
                netWorthChange:  { title: "Net Worth Change",    explanation: "Total change in net worth including equity buildup, appreciation, and rental income",                     calculationMethod: "Property Value Increase + Loan Principal Paid + Cumulative Rental Income" },
              }}
            />
          </div>
        </div>

        {/* ── Asset Growth ── */}
        <AssetGrowthMetrics
          purchasePrice={purchasePrice}
          deposit={deposit}
          loanAmount={purchasePrice - deposit}
          interestRate={interestRate}
          loanTerm={loanTerm || 20}
          annualAppreciation={annualPropertyAppreciation}
        />

        {/* ── Location Map ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Home className="h-4 w-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-[15px]">Location</h3>
            <p className="text-[12px] text-slate-400 ml-1">{property.address}</p>
          </div>
          <div className="h-[300px]">
            <MapView address={property.address} />
          </div>
        </div>

      </div>

      {/* ── Branded footer ── */}
      <footer className="bg-white border-t border-slate-200 mt-8">
        <div className="px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src="/proply-logo-1.png" alt="Proply" className="h-7 object-contain opacity-70" />
            <p className="text-[12px] text-slate-500 text-center">
              This report was generated using{" "}
              <span className="font-semibold text-slate-700">Proply</span> — South Africa's property
              investment intelligence platform.
            </p>
            <p className="text-[11px] text-slate-400 whitespace-nowrap">
              © {new Date().getFullYear()} Proply Tech (Pty) Ltd
            </p>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 text-center leading-relaxed">
            Disclaimer: All figures are indicative only and based on inputs provided at the time of
            analysis. This report does not constitute financial, legal, or investment advice.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Tiny helpers ─────────────────────────────────────────────────────────────
function RevRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className="text-[12px] font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  large,
}: {
  label: string;
  value: string;
  sub?: string;
  large?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1.5 font-bold text-slate-800 ${large ? "text-xl" : "text-base"}`}>
        {value}
        {sub && (
          <span className="ml-1.5 text-sm font-semibold text-indigo-600">({sub})</span>
        )}
      </p>
    </div>
  );
}
