import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { formatter } from "@/utils/rentalPerformance";

interface CashflowChartProps {
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

export default function CashflowChart({ netOperatingIncome }: CashflowChartProps) {
  if (!netOperatingIncome) return null;

  const years = [1, 2, 3, 4, 5, 10, 20];
  
  const chartData = years.map(year => {
    const yearKey = `year${year}` as keyof typeof netOperatingIncome;
    return {
      year: `Year ${year}`,
      'Annual Cashflow': netOperatingIncome[yearKey].annualCashflow,
      'Cumulative Cashflow': netOperatingIncome[yearKey].cumulativeRentalIncome
    };
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Cashflow Projections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value: number) => formatter(value)} />
              <Tooltip formatter={(value: number) => formatter(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Annual Cashflow" 
                stroke="#8884d8"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="Cumulative Cashflow" 
                stroke="#82ca9d"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
