import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { formatter } from "@/utils/rentalPerformance";

interface YearlyMetrics {
  value: number;
  annualCashflow: number;
  cumulativeRentalIncome: number;
  netWorthChange: number;
}

interface PerformanceProjectionsProps {
  netOperatingIncome: {
    year1: YearlyMetrics;
    year2: YearlyMetrics;
    year3: YearlyMetrics;
    year4: YearlyMetrics;
    year5: YearlyMetrics;
    year10: YearlyMetrics;
    year20: YearlyMetrics;
  } | null;
}

export default function PerformanceProjections({
  netOperatingIncome,
}: PerformanceProjectionsProps) {
  if (!netOperatingIncome) return null;

  const years = [1, 2, 3, 4, 5, 10, 20];

  // Prepare data for the chart
  const cashflowData = years.map(year => {
    const yearKey = `year${year}` as keyof typeof netOperatingIncome;
    const yearData = netOperatingIncome[yearKey];

    return {
      year: `Year ${year}`,
      'Annual Cashflow': yearData.annualCashflow,
      'Cumulative Income': yearData.cumulativeRentalIncome,
    };
  });

  const formatYAxisTick = (value: number) => {
    return formatter(value);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Performance Projections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Annual & Cumulative Cashflow</h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={cashflowData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={formatYAxisTick} />
                <Tooltip formatter={(value) => formatter(value as number)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Annual Cashflow" 
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={true}
                />
                <Line 
                  type="monotone" 
                  dataKey="Cumulative Income" 
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}