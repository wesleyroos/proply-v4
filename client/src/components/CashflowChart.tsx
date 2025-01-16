import { Line, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
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
  longTermNetOperatingIncome?: {
    year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
  } | null;
}

export default function CashflowChart({ netOperatingIncome, longTermNetOperatingIncome }: CashflowChartProps) {
  if (!netOperatingIncome) return null;

  const years = [1, 2, 3, 4, 5, 10, 20];

  let shortTermCumulativeTotal = 0;
  let longTermCumulativeTotal = 0;

  const chartData = years.map((year) => {
    const yearKey = `year${year}` as keyof typeof netOperatingIncome;

    // Short-term calculations
    const shortTermAnnual = netOperatingIncome[yearKey].annualCashflow;
    shortTermCumulativeTotal += shortTermAnnual;

    // Long-term calculations
    const longTermAnnual = longTermNetOperatingIncome?.[yearKey]?.annualCashflow ?? 0;
    longTermCumulativeTotal += longTermAnnual;

    return {
      year: `Year ${year}`,
      'Short-Term Annual': shortTermAnnual,
      'Short-Term Cumulative': shortTermCumulativeTotal,
      'Long-Term Annual': longTermAnnual,
      'Long-Term Cumulative': longTermCumulativeTotal
    };
  });

  // Calculate min and max values for YAxis domain
  const allValues = chartData.flatMap(d => [
    d['Short-Term Annual'],
    d['Short-Term Cumulative'],
    d['Long-Term Annual'],
    d['Long-Term Cumulative']
  ]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // Calculate rounded min and max for cleaner intervals
  const roundedMin = Math.floor(minValue / 100000) * 100000;
  const roundedMax = Math.ceil(maxValue / 100000) * 100000;

  // Generate 10 evenly spaced ticks
  const numberOfTicks = 10;
  const interval = (roundedMax - roundedMin) / (numberOfTicks - 1);
  const ticks = Array.from({ length: numberOfTicks }, (_, i) => 
    Math.round(roundedMin + (interval * i))
  );

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 60, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis 
            domain={[roundedMin, roundedMax]}
            ticks={ticks}
            tickFormatter={(value: number) => formatter(value).replace('R', 'R ')} 
            style={{ fontSize: '12px' }}
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
          {/* Zero reference line */}
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          {/* Short-term metrics */}
          <Bar 
            dataKey="Short-Term Annual"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
            barSize={20}
            name="Short-Term Annual"
          />
          <Line 
            type="monotone"
            dataKey="Short-Term Cumulative"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Short-Term Cumulative"
          />
          {/* Long-term metrics */}
          <Bar 
            dataKey="Long-Term Annual"
            fill="#82ca9d"
            radius={[4, 4, 0, 0]}
            barSize={20}
            name="Long-Term Annual"
          />
          <Line 
            type="monotone"
            dataKey="Long-Term Cumulative"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Long-Term Cumulative"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}