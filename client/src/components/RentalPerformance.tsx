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

  const calculateScenarioRevenue = (scenario: 'low' | 'medium' | 'high') => {
    const monthlyRevenues = MONTHS.map((_, i) => 
      calculateMonthlyRevenue(scenario, i, shortTermNightly, isManaged)
    );
    const total = monthlyRevenues.reduce((sum, rev) => sum + rev, 0);
    const average = total / 12;
    return { monthlyRevenues, total, average };
  };

  const scenarios = {
    low: calculateScenarioRevenue('low'),
    medium: calculateScenarioRevenue('medium'),
    high: calculateScenarioRevenue('high'),
  };

  return (
    <div className="space-y-8">
      {/* Chart */}
      <div className="h-[300px] w-full">
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

      {/* Detailed Monthly Performance Table */}
      <div className="mt-6 rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Metric</th>
                {MONTHS.map(month => (
                  <th key={month} className="text-right py-3 px-4">{month}</th>
                ))}
                <th className="text-right py-3 px-4 border-l">Annual</th>
                <th className="text-right py-3 px-4">Monthly Avg</th>
              </tr>
            </thead>
            <tbody>
              {/* Nightly Rate */}
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Nightly Rate</td>
                {MONTHS.map((_, i) => (
                  <td key={i} className="text-right py-3 px-4">
                    {formatter(getSeasonalNightlyRate(shortTermNightly, i))}
                  </td>
                ))}
                <td className="text-right py-3 px-4 border-l">-</td>
                <td className="text-right py-3 px-4">{formatter(shortTermNightly)}</td>
              </tr>

              {/* Platform Fee */}
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">
                  Platform Fee ({isManaged ? "15" : "3"}%)
                </td>
                {MONTHS.map((_, i) => {
                  const nightlyRate = getSeasonalNightlyRate(shortTermNightly, i);
                  return (
                    <td key={i} className="text-right py-3 px-4">
                      {isManaged ? "15" : "3"}%
                    </td>
                  );
                })}
                <td className="text-right py-3 px-4 border-l">-</td>
                <td className="text-right py-3 px-4 text-red-600">
                  {formatter(-shortTermNightly * (isManaged ? 0.15 : 0.03))}
                </td>
              </tr>

              {/* Fee-adjusted Rate */}
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Fee-adjusted Rate</td>
                {MONTHS.map((_, i) => {
                  const nightlyRate = getSeasonalNightlyRate(shortTermNightly, i);
                  const platformFeeRate = isManaged ? 0.15 : 0.03;
                  const adjustedRate = nightlyRate * (1 - platformFeeRate);
                  return (
                    <td key={i} className="text-right py-3 px-4">
                      {formatter(adjustedRate)}
                    </td>
                  );
                })}
                <td className="text-right py-3 px-4 border-l">-</td>
                <td className="text-right py-3 px-4">
                  {formatter(getFeeAdjustedRate(shortTermNightly, isManaged))}
                </td>
              </tr>

              {/* Occupancy Rates */}
              {Object.entries(OCCUPANCY_RATES).map(([scenario, rates]) => (
                <tr key={`occupancy-${scenario}`} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">
                    Occupancy {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
                  </td>
                  {rates.map((rate, i) => (
                    <td key={i} className="text-right py-3 px-4">{rate}%</td>
                  ))}
                  <td className="text-right py-3 px-4 border-l">-</td>
                  <td className="text-right py-3 px-4">
                    {(rates.reduce((sum, rate) => sum + rate, 0) / 12).toFixed(1)}%
                  </td>
                </tr>
              ))}

              {/* Revenue Scenarios */}
              {(["low", "medium", "high"] as const).map((scenario) => {
                const monthlyRevenues = MONTHS.map((_, i) => 
                  calculateMonthlyRevenue(scenario, i, shortTermNightly, isManaged)
                );
                const total = monthlyRevenues.reduce((sum, rev) => sum + rev, 0);
                const average = total / 12;
                const bgColor = scenario === 'low' ? 'bg-[#FF6B6B]/5' : 
                               scenario === 'medium' ? 'bg-[#4ECDC4]/5' : 
                               'bg-[#45B7D1]/5';
                const textColor = scenario === 'low' ? 'text-[#FF6B6B]' : 
                                 scenario === 'medium' ? 'text-[#4ECDC4]' : 
                                 'text-[#45B7D1]';

                return (
                  <tr key={`revenue-${scenario}`} className={`border-b ${bgColor} hover:bg-opacity-20`}>
                    <td className={`py-3 px-4 font-medium ${textColor}`}>
                      Revenue {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
                    </td>
                    {monthlyRevenues.map((revenue, i) => (
                      <td key={i} className="text-right py-3 px-4">
                        {formatter(revenue)}
                      </td>
                    ))}
                    <td className="text-right py-3 px-4 border-l font-medium">
                      {formatter(total)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {formatter(average)}
                    </td>
                  </tr>
                );
              })}

              {/* Long Term Rental */}
              <tr className="border-b bg-[#FFE66D]/5 hover:bg-[#FFE66D]/10">
                <td className="py-3 px-4 font-medium text-[#B8860B]">
                  Long Term Rental
                </td>
                {MONTHS.map((_, i) => (
                  <td key={i} className="text-right py-3 px-4">
                    {formatter(longTermMonthly)}
                  </td>
                ))}
                <td className="text-right py-3 px-4 border-l font-medium">
                  {formatter(longTermMonthly * 12)}
                </td>
                <td className="text-right py-3 px-4 font-medium">
                  {formatter(longTermMonthly)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
