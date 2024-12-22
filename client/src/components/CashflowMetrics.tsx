import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { formatter } from "@/utils/rentalPerformance";

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
    year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
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
  // Detailed props debugging
  console.log('=== CashflowMetrics Component Debug ===');
  
  // Log all props
  console.log('All received props:', {
    shortTermNightly,
    longTermMonthly,
    monthlyBondRepayment,
    managementFee,
    revenueProjections,
    operatingExpenses,
    netOperatingIncome
  });
  
  // Specifically check NOI structure
  console.log('NOI Structure Check:', {
    isNull: netOperatingIncome === null,
    type: typeof netOperatingIncome,
    year1: netOperatingIncome?.year1,
    year1Value: netOperatingIncome?.year1?.value,
    allYears: Object.keys(netOperatingIncome || {})
  });

  // Debug first year's calculations
  const year1Debug = {
    revenue: revenueProjections.shortTerm?.year1 || 0,
    expenses: operatingExpenses.year1,
    noi: netOperatingIncome?.year1?.value,
    manualNOICalc: (revenueProjections.shortTerm?.year1 || 0) - operatingExpenses.year1
  };
  console.log('Year 1 Calculations:', year1Debug);
  
  const years = [1, 2, 3, 4, 5, 10, 20];

  return (
    <Card className="mt-6">
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
                    <td className="py-3 px-6 font-medium">Annual Revenue</td>
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
                    <td className="py-3 px-6 font-medium">Net Operating Expenses</td>
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
                    <td className="py-3 px-6 font-medium">Net Operating Income</td>
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
                    <td className="py-3 px-6 font-medium">Annual Bond Payment</td>
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
                    <td className="py-3 px-6 font-medium">Annual Cashflow</td>
                    {years.map(year => {
                      // Debug annual cashflow calculation
                      const yearKey = `year${year}` as keyof typeof netOperatingIncome;
                      const noiValue = netOperatingIncome?.[yearKey]?.value || 0;
                      const annualDebtService = monthlyBondRepayment * 12;
                      const annualCashflow = noiValue - annualDebtService;
                      
                      console.log(`Annual Cashflow Calculation - Year ${year}:`, {
                        yearKey,
                        noiValue,
                        monthlyBondRepayment,
                        annualDebtService,
                        annualCashflow,
                        netOperatingIncomeYear: netOperatingIncome?.[yearKey]
                      });

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
                    <td className="py-3 px-6 font-medium">Cumulative Cashflow</td>
                    {years.map((year, index) => {
                      let cumulativeCashflow = 0;
                      const yearlyFlows = [];
                      
                      for (let i = 0; i <= index; i++) {
                        const y = years[i];
                        const yearKey = `year${y}` as keyof typeof netOperatingIncome;
                        const noiValue = netOperatingIncome?.[yearKey]?.value || 0;
                        const annualDebtService = monthlyBondRepayment * 12;
                        const annualCashflow = noiValue - annualDebtService;
                        
                        yearlyFlows.push({
                          year: y,
                          noiValue,
                          annualDebtService,
                          annualCashflow
                        });
                        
                        cumulativeCashflow += annualCashflow;
                      }
                      
                      console.log(`Cumulative Cashflow Calculation - Up to Year ${year}:`, {
                        yearlyFlows,
                        cumulativeCashflow,
                        monthlyBondRepayment,
                        netOperatingIncomePresent: !!netOperatingIncome
                      });

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
                    <td className="py-3 px-6 font-medium">Annual Revenue</td>
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
                    <td className="py-3 px-6 font-medium">Net Operating Expenses</td>
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
                    <td className="py-3 px-6 font-medium">Net Operating Income</td>
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
                    <td className="py-3 px-6 font-medium">Annual Bond Payment</td>
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
                    <td className="py-3 px-6 font-medium">Annual Cashflow</td>
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
                    <td className="py-3 px-6 font-medium">Cumulative Cashflow</td>
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
      </CardContent>
    </Card>
  );
}
