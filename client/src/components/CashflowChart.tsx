
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
    const shortTermAnnual = netOperatingIncome[yearKey].annualCashflow;
    const longTermAnnual = netOperatingIncome[yearKey].value - (409641.24); // Annual bond payment

    // Calculate cumulative for both terms
    let shortTermCumulative = 0;
    let longTermCumulative = 0;
    for (let i = 0; i <= index; i++) {
      const y = years[i];
      const yKey = `year${y}` as keyof typeof netOperatingIncome;
      shortTermCumulative += netOperatingIncome[yKey].annualCashflow;
      longTermCumulative += (netOperatingIncome[yKey].value - 409641.24);
    }

    return {
      year: `Year ${year}`,
      'Short Term Annual': shortTermAnnual,
      'Short Term Cumulative': shortTermCumulative,
      'Long Term Annual': longTermAnnual,
      'Long Term Cumulative': longTermCumulative
    };
  });

  // Calculate min and max values for YAxis domain
  const minValue = Math.min(
    ...chartData.map(d => Math.min(
      d['Short Term Annual'],
      d['Short Term Cumulative'],
      d['Long Term Annual'],
      d['Long Term Cumulative']
    ))
  );
  const maxValue = Math.max(
    ...chartData.map(d => Math.max(
      d['Short Term Annual'],
      d['Short Term Cumulative'],
      d['Long Term Annual'],
      d['Long Term Cumulative']
    ))
  );
  const domainPadding = (maxValue - minValue) * 0.1;

  return (
    <div className="h-[400px] w-full" id="cashflow-chart" data-testid="cashflow-chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 60, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis 
            domain={[Math.floor(minValue - domainPadding), Math.ceil(maxValue + domainPadding)]}
            tickFormatter={(value: number) => formatter(value).replace('R', 'R ')} 
            style={{
              fontSize: '12px'
            }}
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
            dataKey="Short Term Annual"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Bar 
            dataKey="Long Term Annual"
            fill="#82ca9d"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
          <Line
            type="monotone"
            dataKey="Short Term Cumulative"
            stroke="#8884d8"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Long Term Cumulative"
            stroke="#82ca9d"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
