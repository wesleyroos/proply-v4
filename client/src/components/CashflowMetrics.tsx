
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, BarChart3, HelpCircle } from "lucide-react";
import { formatter } from "@/utils/rentalPerformance";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CashflowChart from "@/components/CashflowChart";

interface CashflowMetricsProps {
  shortTermNightly: number;
  longTermMonthly: number;
  monthlyBondRepayment: number;
  managementFee: number;
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
    year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
  } | null;
}

export default function CashflowMetrics({
  shortTermNightly,
  longTermMonthly,
  monthlyBondRepayment,
  managementFee,
  revenueProjections,
  operatingExpenses,
  netOperatingIncome,
}: CashflowMetricsProps) {
  const years = [1, 2, 3, 4, 5, 10, 20];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="h-5 w-5 text-purple-500" />
          Cashflow Metrics
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
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Annual Revenue
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Calculated as: Nightly Rate × 365 days × Occupancy Rate × (1 - Platform Fee)</p>
                          <p className="mt-1 text-sm text-gray-400">Annual revenue grows by 8% each year to account for market appreciation</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(revenueProjections.shortTerm?.[`year${year}`])}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Net Operating Expenses */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Net Operating Expenses
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Sum of monthly expenses:</p>
                          <ul className="list-disc ml-4 mt-1">
                            <li>Levies</li>
                            <li>Rates & Taxes</li>
                            <li>Management Fees ({managementFee}%)</li>
                            <li>Maintenance Reserve</li>
                          </ul>
                          <p className="mt-1 text-sm text-gray-400">Expenses increase by 6% annually</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(operatingExpenses[`year${year}`])}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Net Operating Income */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Net Operating Income
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Annual Revenue - Operating Expenses</p>
                          <p className="mt-1 text-sm text-gray-400">This is your property's income before considering the bond payment</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(netOperatingIncome?.[`year${year}`]?.value || 0)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Annual Bond Payment */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Annual Bond Payment
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Monthly Bond Payment × 12</p>
                          <p className="mt-1 text-sm text-gray-400">This is fixed throughout the loan term assuming a fixed interest rate</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(monthlyBondRepayment * 12)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Annual Cashflow */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Annual Cashflow
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Net Operating Income - Annual Bond Payment</p>
                          <p className="mt-1 text-sm text-gray-400">This represents your actual cash profit/loss after paying all expenses including the bond</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map(year => {
                      const yearKey = `year${year}` as keyof typeof netOperatingIncome;
                      const noiValue = netOperatingIncome?.[yearKey]?.value || 0;
                      const annualDebtService = monthlyBondRepayment * 12;
                      const annualCashflow = noiValue - annualDebtService;

                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(annualCashflow)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Cumulative Cashflow */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Cumulative Cashflow
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Sum of all Annual Cashflows up to this year</p>
                          <p className="mt-1 text-sm text-gray-400">Shows your total cash profit/loss since purchase, helps visualize when you break even</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map((year, index) => {
                      let cumulativeCashflow = 0;

                      for (let i = 0; i <= index; i++) {
                        const y = years[i];
                        const yearKey = `year${y}` as keyof typeof netOperatingIncome;
                        const noiValue = netOperatingIncome?.[yearKey]?.value || 0;
                        const annualDebtService = monthlyBondRepayment * 12;
                        const annualCashflow = noiValue - annualDebtService;
                        cumulativeCashflow += annualCashflow;
                      }

                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(cumulativeCashflow)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
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
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Annual Revenue
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Calculated as: Monthly Rate × 12 months × (1 + Annual Growth Rate)^(year -1)</p>
                          <p className="mt-1 text-sm text-gray-400">Annual revenue grows by 8% each year to account for market appreciation</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map(year => {
                      const revenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(revenue)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Net Operating Expenses */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Net Operating Expenses
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Sum of monthly expenses:</p>
                          <ul className="list-disc ml-4 mt-1">
                            <li>Levies</li>
                            <li>Rates & Taxes</li>
                            <li>Management Fees ({managementFee}%)</li>
                            <li>Maintenance Reserve</li>
                          </ul>
                          <p className="mt-1 text-sm text-gray-400">Expenses increase by 6% annually</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map(year => {
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(expenses)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Net Operating Income */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Net Operating Income
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Annual Revenue - Operating Expenses</p>
                          <p className="mt-1 text-sm text-gray-400">This is your property's income before considering the bond payment</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map(year => {
                      const revenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      const income = revenue - expenses;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(income)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Annual Bond Payment */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Annual Bond Payment
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Monthly Bond Payment × 12</p>
                          <p className="mt-1 text-sm text-gray-400">This is fixed throughout the loan term assuming a fixed interest rate</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(monthlyBondRepayment * 12)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Annual Cashflow */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Annual Cashflow
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Net Operating Income - Annual Bond Payment</p>
                          <p className="mt-1 text-sm text-gray-400">This represents your actual cash profit/loss after paying all expenses including the bond</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map(year => {
                      const revenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      const bondPayment = monthlyBondRepayment * 12;
                      const cashflow = revenue - expenses - bondPayment;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(cashflow)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Cumulative Cashflow */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium flex items-center gap-2">
                      Cumulative Cashflow
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Sum of all Annual Cashflows up to this year</p>
                          <p className="mt-1 text-sm text-gray-400">Shows your total cash profit/loss since purchase, helps visualize when you break even</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {years.map((year, index) => {
                      let cumulativeCashflow = 0;
                      for (let i = 0; i <= index; i++) {
                        const y = years[i];
                        const revenue = longTermMonthly * 12 * Math.pow(1.08, y - 1);
                        const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, y - 1);
                        const bondPayment = monthlyBondRepayment * 12;
                        cumulativeCashflow += revenue - expenses - bondPayment;
                      }
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(cumulativeCashflow)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
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

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Cashflow Projections</h3>
          </div>
          <CashflowChart netOperatingIncome={netOperatingIncome} />
        </div>
      </CardContent>
    </Card>
  );
}
