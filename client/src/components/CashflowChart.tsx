
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

  const chartData = years.map((year, index) => {
    const yearKey = `year${year}` as keyof typeof netOperatingIncome;
    const annualCashflow = netOperatingIncome[yearKey].annualCashflow;
    
    // Calculate cumulative by summing all annual cashflows up to this year
    let cumulativeCashflow = 0;
    for (let i = 0; i <= index; i++) {
      const y = years[i];
      const yKey = `year${y}` as keyof typeof netOperatingIncome;
      cumulativeCashflow += netOperatingIncome[yKey].annualCashflow;
    }

    return {
      year: `Year ${year}`,
      'Annual Cashflow': annualCashflow,
      'Cumulative Cashflow': cumulativeCashflow
    };
  });

  // Calculate min and max values for YAxis domain
  const minValue = Math.min(
    ...chartData.map(d => Math.min(d['Annual Cashflow'], d['Cumulative Cashflow']))
  );
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d['Annual Cashflow'], d['Cumulative Cashflow']))
  );
  // Add 10% padding to the domain
  const domainPadding = (maxValue - minValue) * 0.1;

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 60, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis 
            domain={[Math.floor(minValue - domainPadding), Math.ceil(maxValue + domainPadding)]}
            tickFormatter={(value: number) => formatter(value)} 
          />
          <Tooltip 
            formatter={(value: number) => formatter(value)}
            labelStyle={{ color: '#374151' }}
            contentStyle={{ 
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
          <Legend />
          <Bar 
            dataKey="Annual Cashflow"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
            barSize={40}
          />
          <Line
            type="monotone"
            dataKey="Cumulative Cashflow"
            stroke="#82ca9d"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
