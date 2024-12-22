import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  formatter,
  getSeasonalNightlyRate,
  getFeeAdjustedRate,
  calculateMonthlyRevenue,
  OCCUPANCY_RATES,
} from "../utils/rentalPerformance";

interface RentalPerformanceProps {
  shortTermNightly: number;
  longTermMonthly: number;
  managementFee: number;
}

export default function RentalPerformance({
  shortTermNightly,
  longTermMonthly,
  managementFee,
}: RentalPerformanceProps) {
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const isManaged = managementFee > 0;

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="mt-6 h-[300px] max-w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{ left: 25 }}
            data={Array(12)
              .fill(0)
              .map((_, i) => ({
                month: new Date(2024, i).toLocaleString("default", {
                  month: "short",
                }),
                low: calculateMonthlyRevenue(
                  "low",
                  i,
                  shortTermNightly,
                  isManaged,
                ),
                medium: calculateMonthlyRevenue(
                  "medium",
                  i,
                  shortTermNightly,
                  isManaged,
                ),
                high: calculateMonthlyRevenue(
                  "high",
                  i,
                  shortTermNightly,
                  isManaged,
                ),
                longTerm: longTermMonthly,
              }))}
          >
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatter} width={80} />
            <RechartsTooltip formatter={formatter} />
            <Legend />
            <Line
              type="monotone"
              dataKey="low"
              stroke="#FF6B6B"
              name="Revenue Low"
            />
            <Line
              type="monotone"
              dataKey="medium"
              stroke="#4ECDC4"
              name="Revenue Medium"
            />
            <Line
              type="monotone"
              dataKey="high"
              stroke="#45B7D1"
              name="Revenue High"
            />
            <Line
              type="monotone"
              dataKey="longTerm"
              stroke="#FFE66D"
              strokeDasharray="5 5"
              name="Long Term Rental"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
