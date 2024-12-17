import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonData {
  longTermMonthly: number;
  shortTermMonthly: number;
  longTermAnnual: number;
  shortTermAnnual: number;
  breakEvenOccupancy: number;
}

export default function ComparisonChart({ data }: { data: ComparisonData }) {
  const chartData = [
    {
      name: 'Monthly Income',
      'Long Term': data.longTermMonthly,
      'Short Term': data.shortTermMonthly,
    },
    {
      name: 'Annual Income',
      'Long Term': data.longTermAnnual,
      'Short Term': data.shortTermAnnual,
    },
  ];

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Long Term" fill="#1BA3FF" />
          <Bar dataKey="Short Term" fill="#114D9D" />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Break-even Analysis</h3>
        <p className="text-sm text-gray-600">
          Required occupancy for short-term to match long-term: {data.breakEvenOccupancy}%
        </p>
      </div>
    </div>
  );
}
