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
      year4: number;
      year5: number;
      year10: number;
      year20: number;
    } | null;
  };
  operatingExpenses: {
    year1: number;
    year2: number;
    year4: number;
    year5: number;
    year10: number;
    year20: number;
  };
  netOperatingIncome: {
    year1: number;
    year2: number;
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
                    <th className="text-right py-3 px-6">Year 1</th>
                    <th className="text-right py-3 px-6">Year 2</th>
                    <th className="text-right py-3 px-6">Year 4</th>
                    <th className="text-right py-3 px-6">Year 5</th>
                    <th className="text-right py-3 px-6">Year 10</th>
                    <th className="text-right py-3 px-6">Year 20</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium">Annual Revenue</td>
                    {revenueProjections.shortTerm ? (
                      <>
                        <td className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(revenueProjections.shortTerm.year1)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                        <td className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(revenueProjections.shortTerm.year2)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                        <td className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(revenueProjections.shortTerm.year4)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                        <td className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(revenueProjections.shortTerm.year5)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                        <td className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(revenueProjections.shortTerm.year10)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                        <td className="text-right py-3 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {formatter(revenueProjections.shortTerm.year20)}
                            <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                          </div>
                        </td>
                      </>
                    ) : (
                      <td colSpan={6} className="text-center py-3 px-6 text-gray-500">
                        No revenue projections available
                      </td>
                    )}
                  </tr>
                  {/* Net Operating Expenses and Income */}
                  <>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-6 font-medium">Net Operating Expenses</td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(operatingExpenses.year1)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(operatingExpenses.year2)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(operatingExpenses.year4)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(operatingExpenses.year5)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(operatingExpenses.year10)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(operatingExpenses.year20)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-6 font-medium">Net Operating Income</td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(netOperatingIncome?.year1 || 0)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(netOperatingIncome?.year2 || 0)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(netOperatingIncome?.year4 || 0)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(netOperatingIncome?.year5 || 0)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(netOperatingIncome?.year10 || 0)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter(netOperatingIncome?.year20 || 0)}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    </tr>
                    {/* Annual Bond Payment */}
                    <tr className="hover:bg-gray-50">
                      <td className="py-3 px-6 font-medium">Annual Bond Payment</td>
                      {[1, 2, 4, 5, 10, 20].map((year) => (
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
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter((netOperatingIncome?.year1 || 0) - (monthlyBondRepayment * 12))}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter((netOperatingIncome?.year2 || 0) - (monthlyBondRepayment * 12))}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter((netOperatingIncome?.year4 || 0) - (monthlyBondRepayment * 12))}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter((netOperatingIncome?.year5 || 0) - (monthlyBondRepayment * 12))}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter((netOperatingIncome?.year10 || 0) - (monthlyBondRepayment * 12))}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                      <td className="text-right py-3 px-6">
                        <div className="flex items-center justify-end gap-2">
                          {formatter((netOperatingIncome?.year20 || 0) - (monthlyBondRepayment * 12))}
                          <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                        </div>
                      </td>
                    </tr>
                  </>
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="long-term" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-600">
                  Monthly Revenue
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-800 flex items-center gap-2">
                  {formatter(longTermMonthly)}
                  <span className="h-2 w-2 rounded-full bg-red-500" title="Calculated by analysis engine"/>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-600">
                  Monthly Expenses
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {formatter(longTermExpenses)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Bond Payment
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-600">
                  Net Cashflow
                </h3>
                <p className={`mt-2 text-2xl font-bold ${longTermNetCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatter(longTermNetCashflow)}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
