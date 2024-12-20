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
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
    year10: number;
    year20: number;
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
  // Calculate expenses for both rental strategies
  const longTermExpenses = monthlyBondRepayment;
  const longTermNetCashflow = longTermMonthly - longTermExpenses;

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
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium">Annual Revenue</td>
                    {revenueProjections.shortTerm ? (
                      <>
                        {years.map(year => (
                          <td key={year} className="text-right py-3 px-6">
                            <div className="flex items-center justify-end gap-2">
                              {formatter(revenueProjections.shortTerm[`year${year}`])}
                              <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                            </div>
                          </td>
                        ))}
                      </>
                    ) : (
                      <td colSpan={7} className="text-center py-3 px-6 text-gray-500">
                        No revenue projections available
                      </td>
                    )}
                  </tr>
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
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium">Net Operating Income</td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(netOperatingIncome?.[`year${year}`] || 0)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    ))}
                  </tr>
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
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium">Annual Cashflow</td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter((netOperatingIncome?.[`year${year}`] || 0) - (monthlyBondRepayment * 12))}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium">Cumulative Cashflow</td>
                    {years.map((year, index) => {
                      let cumulativeCashflow = 0;
                      const previousYears = years.slice(0, index + 1);
                      previousYears.forEach(y => {
                        cumulativeCashflow += (netOperatingIncome?.[`year${y}`] || 0) - (monthlyBondRepayment * 12);
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
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium">Annual Revenue</td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(longTermMonthly * 12 * Math.pow(1.08, year - 1))}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium">Net Operating Expenses</td>
                    {years.map(year => (
                      <td key={year} className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(monthlyBondRepayment * 12 * Math.pow(1.06, year - 1))}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium">Net Operating Income</td>
                    {years.map(year => {
                      const revenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(revenue - expenses)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
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
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium">Annual Cashflow</td>
                    {years.map(year => {
                      const revenue = longTermMonthly * 12 * Math.pow(1.08, year - 1);
                      const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, year - 1);
                      const bondPayment = monthlyBondRepayment * 12;
                      return (
                        <td key={year} className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(revenue - expenses - bondPayment)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium">Cumulative Cashflow</td>
                    {years.map((year, index) => {
                      let cumulativeCashflow = 0;
                      const previousYears = years.slice(0, index + 1);
                      previousYears.forEach(y => {
                        const revenue = longTermMonthly * 12 * Math.pow(1.08, y - 1);
                        const expenses = monthlyBondRepayment * 12 * Math.pow(1.06, y - 1);
                        const bondPayment = monthlyBondRepayment * 12;
                        cumulativeCashflow += revenue - expenses - bondPayment;
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
        </Tabs>
      </CardContent>
    </Card>
  );
}