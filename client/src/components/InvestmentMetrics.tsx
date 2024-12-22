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
    year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
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

  type YearKey = keyof typeof netOperatingIncome;

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
                  {/* Annual Revenue */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Annual Revenue"
                        tooltip="Total revenue generated from the property annually, calculated based on occupancy rates and rental prices."
                      />
                    </td>
                    {years.map(year => {
                      const yearKey = `year${year}` as keyof typeof revenueProjections.shortTerm;
                      const revenue = revenueProjections.shortTerm?.[yearKey] || 0;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(revenue)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Net Operating Expenses */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Net Operating Expenses"
                        tooltip="Total operating costs including maintenance, management fees, and other property-related expenses."
                      />
                    </td>
                    {years.map(year => {
                      const yearKey = `year${year}` as keyof typeof operatingExpenses;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(operatingExpenses[yearKey])}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Net Operating Income */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Net Operating Income"
                        tooltip="Income generated after deducting operating expenses but before debt service (mortgage payments). NOI = Annual Revenue - Operating Expenses"
                      />
                    </td>
                    {years.map(year => {
                      const yearKey = `year${year}` as YearKey;
                      // Access NOI directly from netOperatingIncome data structure
                      const noi = netOperatingIncome?.[yearKey]?.value;
                      console.log(`NOI for year ${year}:`, { 
                        yearKey,
                        netOperatingIncome: netOperatingIncome?.[yearKey],
                        value: noi 
                      });
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(noi || 0)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Annual Bond Payment */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Annual Bond Payment"
                        tooltip="Total annual mortgage payments including principal and interest."
                      />
                    </td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(monthlyBondRepayment * 12)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Annual Cashflow */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Annual Cashflow"
                        tooltip="Net cash generated annually after all operating expenses and debt service."
                      />
                    </td>
                    {years.map(year => {
                      const yearKey = `year${year}` as YearKey;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(netOperatingIncome?.[yearKey]?.annualCashflow || 0)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Cumulative Cashflow */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Cumulative Cashflow"
                        tooltip="Total accumulated cash flow from rental operations since purchase."
                      />
                    </td>
                    {years.map(year => {
                      const yearKey = `year${year}` as YearKey;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(netOperatingIncome?.[yearKey]?.cumulativeRentalIncome || 0)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Net Worth Change */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Net Worth Change"
                        tooltip="Total change in net worth from property ownership, combining equity build-up from loan repayment, cumulative rental income, and property value appreciation."
                      />
                    </td>
                    {years.map(year => {
                      const yearKey = `year${year}` as YearKey;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(netOperatingIncome?.[yearKey]?.netWorthChange || 0)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
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
                  {/* Annual Revenue */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Annual Revenue"
                        tooltip="Total revenue generated from the property annually, calculated based on occupancy rates and rental prices."
                      />
                    </td>
                    {years.map(year => {
                      const annualRevenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(annualRevenue)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Net Operating Expenses */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Net Operating Expenses"
                        tooltip="Total operating costs including maintenance, management fees, and other property-related expenses."
                      />
                    </td>
                    {years.map(year => {
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(expenses)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Net Operating Income */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Net Operating Income"
                        tooltip="Income generated after deducting operating expenses but before debt service (mortgage payments)."
                      />
                    </td>
                    {years.map(year => {
                      const annualRevenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      const noi = annualRevenue - expenses;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(noi)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Annual Bond Payment */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Annual Bond Payment"
                        tooltip="Total annual mortgage payments including principal and interest."
                      />
                    </td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(monthlyBondRepayment * 12)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated metric"/>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Annual Cashflow */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Annual Cashflow"
                        tooltip="Net cash generated annually after all operating expenses and debt service."
                      />
                    </td>
                    {years.map(year => {
                      const annualRevenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      const annualCashflow = annualRevenue - expenses - (monthlyBondRepayment * 12);
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(annualCashflow)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>


                  {/* Cumulative Cashflow */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Cumulative Cashflow"
                        tooltip="Total accumulated cash flow from rental operations since purchase."
                      />
                    </td>
                    {years.map(year => {
                      let cumulativeCashflow = 0;
                      for (let i = 1; i <= year; i++) {
                        const annualRevenue = longTermMonthly * 12 * Math.pow(1.08, i - 1);
                        const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, i - 1);
                        cumulativeCashflow += annualRevenue - expenses - (monthlyBondRepayment * 12);
                      }
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(cumulativeCashflow)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated metric"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Net Worth Change */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <MetricLabel 
                        label="Net Worth Change"
                        tooltip="Total change in net worth from property ownership, combining equity build-up from loan repayment, cumulative rental income, and property value appreciation."
                      />
                    </td>
                    {years.map(year => {
                      const appreciation = purchasePrice * Math.pow(1.05, year) - purchasePrice;
                      const annualRevenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      let cumulativeCashflow = 0;
                      for (let i = 1; i <= year; i++) {
                        const ar = longTermMonthly * 12 * Math.pow(1.08, i - 1);
                        const e = monthlyBondRepayment * 12 * Math.pow(1.06, i - 1);
                        cumulativeCashflow += ar - e - (monthlyBondRepayment * 12);
                      }
                      const netWorthChange = appreciation + cumulativeCashflow;


                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(netWorthChange)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated metric"/>
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