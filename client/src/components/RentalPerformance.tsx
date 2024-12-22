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

      {/* Simplified Revenue Table */}
      <div className="mt-6 rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Scenario</th>
                <th className="text-right py-3 px-4">Monthly Average</th>
                <th className="text-right py-3 px-4">Annual Total</th>
                <th className="text-right py-3 px-4">Platform Fee</th>
                <th className="text-right py-3 px-4">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(scenarios).map(([scenario, data], index) => {
                const platformFee = data.total * (isManaged ? 0.15 : 0.03);
                const netRevenue = data.total - platformFee;
                const bgColor = scenario === 'low' ? 'bg-[#FF6B6B]/5' : 
                               scenario === 'medium' ? 'bg-[#4ECDC4]/5' : 
                               'bg-[#45B7D1]/5';
                const textColor = scenario === 'low' ? 'text-[#FF6B6B]' : 
                                 scenario === 'medium' ? 'text-[#4ECDC4]' : 
                                 'text-[#45B7D1]';
                
                return (
                  <tr key={scenario} className={`border-b ${bgColor} hover:bg-opacity-20`}>
                    <td className={`py-3 px-4 font-medium ${textColor}`}>
                      {scenario.charAt(0).toUpperCase() + scenario.slice(1)} Season
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatter(data.average)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {formatter(data.total)}
                    </td>
                    <td className="text-right py-3 px-4 text-red-600">
                      {formatter(-platformFee)}
                    </td>
                    <td className="text-right py-3 px-4 font-medium">
                      {formatter(netRevenue)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-b bg-[#FFE66D]/5 hover:bg-[#FFE66D]/10">
                <td className="py-3 px-4 font-medium text-[#B8860B]">
                  Long Term Rental
                </td>
                <td className="text-right py-3 px-4">
                  {formatter(longTermMonthly)}
                </td>
                <td className="text-right py-3 px-4">
                  {formatter(longTermMonthly * 12)}
                </td>
                <td className="text-right py-3 px-4">
                  -
                </td>
                <td className="text-right py-3 px-4 font-medium">
                  {formatter(longTermMonthly * 12)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
