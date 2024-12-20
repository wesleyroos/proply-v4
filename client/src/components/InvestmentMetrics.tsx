import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, HelpCircle } from "lucide-react";
import { formatter } from "@/utils/rentalPerformance";

interface InvestmentMetricsProps {
  purchasePrice: number;
  deposit: number;
  monthlyBondRepayment: number;
  shortTermNightly: number;
  longTermMonthly: number;
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
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
    year10: number;
    year20: number;
  } | null;
}

export default function InvestmentMetrics({
  purchasePrice,
  deposit,
  monthlyBondRepayment,
  shortTermNightly,
  longTermMonthly,
  revenueProjections,
  operatingExpenses,
  netOperatingIncome,
}: InvestmentMetricsProps) {
  const years = [1, 2, 3, 4, 5, 10, 20];
  
  // Calculate investment metrics
  const calculateROI = (annualRevenue: number) => {
    return ((annualRevenue - (monthlyBondRepayment * 12)) / purchasePrice) * 100;
  };
  
  const calculateCapRate = (annualRevenue: number, annualExpenses: number) => {
    const noi = annualRevenue - annualExpenses;
    return (noi / purchasePrice) * 100;
  };
  
  const calculateCashOnCash = (annualCashflow: number) => {
    return (annualCashflow / deposit) * 100;
  };

  const MetricLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <Tooltip delayDuration={0}>
        <TooltipTrigger>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] text-sm">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Investment Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="short-term" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="short-term">Short-Term</TabsTrigger>
            <TabsTrigger value="long-term">Long-Term</TabsTrigger>
          </TabsList>
          
          {/* Short-Term Tab Content */}
          <TabsContent value="short-term" className="mt-4">
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-6">Metric</th>
                    {years.map(year => (
                      <th key={year} className="text-right py-3 px-6">Year {year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* ROI */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Return on Investment (%)"
                        tooltip="ROI measures the percentage return on your total investment (purchase price). It's calculated as (Annual Revenue - Annual Bond Payments) / Purchase Price × 100."
                      />
                    </td>
                    {years.map(year => {
                      const roi = revenueProjections.shortTerm ? 
                        calculateROI(revenueProjections.shortTerm[`year${year}` as keyof typeof revenueProjections.shortTerm]) : 0;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {roi.toFixed(2)}%
                            <span className="h-2 w-2 rounded-full bg-purple-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Cap Rate */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Cap Rate (%)"
                        tooltip="Capitalization Rate indicates the property's potential return regardless of financing. It's calculated as (Net Operating Income / Purchase Price) × 100. A higher cap rate suggests better income potential relative to price."
                      />
                    </td>
                    {years.map(year => {
                      const yearKey = `year${year}` as keyof typeof operatingExpenses;
                      const capRate = revenueProjections.shortTerm ? 
                        calculateCapRate(
                          revenueProjections.shortTerm[yearKey],
                          operatingExpenses[yearKey]
                        ) : 0;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {capRate.toFixed(2)}%
                            <span className="h-2 w-2 rounded-full bg-purple-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Cash-on-Cash Return */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Cash-on-Cash Return (%)"
                        tooltip="Cash-on-Cash Return measures the annual pre-tax cash flow relative to your initial cash investment (deposit). It's calculated as (Annual Cash Flow / Initial Cash Investment) × 100."
                      />
                    </td>
                    {years.map(year => {
                      const yearKey = `year${year}` as keyof typeof operatingExpenses;
                      const annualCashflow = netOperatingIncome ? 
                        netOperatingIncome[yearKey] - (monthlyBondRepayment * 12) : 0;
                      const cashOnCash = calculateCashOnCash(annualCashflow);
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {cashOnCash.toFixed(2)}%
                            <span className="h-2 w-2 rounded-full bg-purple-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Total Return Including Appreciation */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Total Return (%)"
                        tooltip="Total Return includes both rental income and projected property value appreciation (assumed at 5% annually). It's calculated as ((Property Value Appreciation + Annual Cash Flow) / Purchase Price) × 100."
                      />
                    </td>
                    {years.map(year => {
                      const yearKey = `year${year}` as keyof typeof operatingExpenses;
                      const appreciation = purchasePrice * Math.pow(1.05, year) - purchasePrice;
                      const totalCashflow = netOperatingIncome ? 
                        netOperatingIncome[yearKey] - (monthlyBondRepayment * 12) : 0;
                      const totalReturn = ((appreciation + totalCashflow) / purchasePrice) * 100;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {totalReturn.toFixed(2)}%
                            <span className="h-2 w-2 rounded-full bg-purple-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Long-Term Tab Content */}
          <TabsContent value="long-term" className="mt-4">
            <div className="rounded-lg border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-6">Metric</th>
                    {years.map(year => (
                      <th key={year} className="text-right py-3 px-6">Year {year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* ROI */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Return on Investment (%)"
                        tooltip="ROI measures the percentage return on your total investment (purchase price). It's calculated as (Annual Revenue - Annual Bond Payments) / Purchase Price × 100."
                      />
                    </td>
                    {years.map(year => {
                      const annualRevenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const roi = calculateROI(annualRevenue);
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {roi.toFixed(2)}%
                            <span className="h-2 w-2 rounded-full bg-purple-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Cap Rate */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Cap Rate (%)"
                        tooltip="Capitalization Rate indicates the property's potential return regardless of financing. It's calculated as (Net Operating Income / Purchase Price) × 100. A higher cap rate suggests better income potential relative to price."
                      />
                    </td>
                    {years.map(year => {
                      const annualRevenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      const capRate = calculateCapRate(annualRevenue, expenses);
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {capRate.toFixed(2)}%
                            <span className="h-2 w-2 rounded-full bg-purple-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Cash-on-Cash Return */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Cash-on-Cash Return (%)"
                        tooltip="Cash-on-Cash Return measures the annual pre-tax cash flow relative to your initial cash investment (deposit). It's calculated as (Annual Cash Flow / Initial Cash Investment) × 100."
                      />
                    </td>
                    {years.map(year => {
                      const annualRevenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      const cashflow = annualRevenue - expenses - (monthlyBondRepayment * 12);
                      const cashOnCash = calculateCashOnCash(cashflow);
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {cashOnCash.toFixed(2)}%
                            <span className="h-2 w-2 rounded-full bg-purple-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Total Return Including Appreciation */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Total Return (%)"
                        tooltip="Total Return includes both rental income and projected property value appreciation (assumed at 5% annually). It's calculated as ((Property Value Appreciation + Annual Cash Flow) / Purchase Price) × 100."
                      />
                    </td>
                    {years.map(year => {
                      const appreciation = purchasePrice * Math.pow(1.05, year) - purchasePrice;
                      const annualRevenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      const cashflow = annualRevenue - expenses - (monthlyBondRepayment * 12);
                      const totalReturn = ((appreciation + cashflow) / purchasePrice) * 100;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {totalReturn.toFixed(2)}%
                            <span className="h-2 w-2 rounded-full bg-purple-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
