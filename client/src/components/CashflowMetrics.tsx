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
}

export default function CashflowMetrics({
  shortTermNightly,
  longTermMonthly,
  monthlyBondRepayment,
  managementFee,
}: CashflowMetricsProps) {
  // Calculate metrics
  const shortTermRevenue = Math.round(shortTermNightly * 30 * 0.7); // Assuming 70% occupancy
  const shortTermExpenses = monthlyBondRepayment + (shortTermRevenue * (managementFee / 100));
  const shortTermNetCashflow = shortTermRevenue - shortTermExpenses;

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-600">
                  Monthly Revenue
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {formatter(shortTermRevenue)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Based on 70% occupancy
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-600">
                  Monthly Expenses
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {formatter(shortTermExpenses)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Bond + Management Fee ({managementFee}%)
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-600">
                  Net Cashflow
                </h3>
                <p className={`mt-2 text-2xl font-bold ${shortTermNetCashflow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatter(shortTermNetCashflow)}
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="long-term" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-600">
                  Monthly Revenue
                </h3>
                <p className="mt-2 text-2xl font-bold text-slate-800">
                  {formatter(longTermMonthly)}
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
