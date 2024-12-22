import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
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
  // Debug logging
  console.log("InvestmentMetrics received props:", {
    purchasePrice,
    deposit,
    monthlyBondRepayment,
    shortTermNightly,
    longTermMonthly,
    revenueProjections,
    operatingExpenses,
    netOperatingIncome
  });

  const years = [1, 2, 3, 4, 5, 10, 20];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Investment Metrics (Debugging)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-6">Year</th>
                <th className="text-right py-3 px-6">Revenue</th>
                <th className="text-right py-3 px-6">Operating Expenses</th>
                <th className="text-right py-3 px-6">NOI</th>
              </tr>
            </thead>
            <tbody>
              {years.map(year => {
                const yearKey = `year${year}` as keyof typeof netOperatingIncome;
                const revenue = revenueProjections.shortTerm?.[yearKey] || 0;
                const expenses = operatingExpenses[yearKey];
                const noi = netOperatingIncome?.[yearKey]?.value || 0;

                // Debug logging for each year's calculations
                console.log(`Year ${year} metrics:`, {
                  revenue,
                  expenses,
                  noi,
                  rawNoiData: netOperatingIncome?.[yearKey]
                });

                return (
                  <tr key={year} className="hover:bg-gray-50">
                    <td className="py-3 px-6">Year {year}</td>
                    <td className="text-right py-3 px-6">{formatter(revenue)}</td>
                    <td className="text-right py-3 px-6">{formatter(expenses)}</td>
                    <td className="text-right py-3 px-6">{formatter(noi)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}