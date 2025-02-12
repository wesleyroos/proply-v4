import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatter } from "../utils/rentalPerformance";

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
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const isManaged = managementFee > 0;
  const platformFeeRate = isManaged ? 0.15 : 0.03;

  const calculateMonthlyBreakdown = (month: number) => {
    // Base calculations
    const seasonalRate = shortTermNightly * (1 + (month >= 11 || month <= 1 ? 0.2 : 
                                               month >= 5 && month <= 7 ? -0.2 : 0));
    const occupancyRate = 0.65; // Using medium scenario
    const daysInMonth = new Date(2024, month + 1, 0).getDate();

    // Revenue calculations
    const grossRevenue = seasonalRate * daysInMonth * occupancyRate;
    const platformFee = grossRevenue * platformFeeRate;
    const managementFeeAmount = isManaged ? (grossRevenue - platformFee) * (managementFee / 100) : 0;
    const netRevenue = grossRevenue - platformFee - managementFeeAmount;

    return {
      month: MONTHS[month],
      grossRevenue,
      platformFee,
      managementFeeAmount,
      netRevenue
    };
  };

  const annualData = MONTHS.map((_, index) => calculateMonthlyBreakdown(index));
  const annualTotals = annualData.reduce(
    (acc, month) => ({
      grossRevenue: acc.grossRevenue + month.grossRevenue,
      platformFee: acc.platformFee + month.platformFee,
      managementFeeAmount: acc.managementFeeAmount + month.managementFeeAmount,
      netRevenue: acc.netRevenue + month.netRevenue
    }),
    { grossRevenue: 0, platformFee: 0, managementFeeAmount: 0, netRevenue: 0 }
  );

  return (
    <div className="space-y-8">
      {/* Revenue Chart */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{ left: 25 }}
            data={annualData}
          >
            <XAxis dataKey="month" />
            <YAxis tickFormatter={formatter} width={80} />
            <RechartsTooltip 
              formatter={(value: number) => formatter(value)}
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="grossRevenue"
              stroke="#4ECDC4"
              name="Gross Revenue"
            />
            <Line
              type="monotone"
              dataKey="netRevenue"
              stroke="#45B7D1"
              name="Net Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Breakdown Table */}
      <div className="mt-6 rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4">Revenue Breakdown</th>
                <th className="text-right py-3 px-4">Annual Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Annual Revenue</td>
                <td className="text-right py-3 px-4">
                  {formatter(annualTotals.grossRevenue)}
                </td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-red-600">
                  Less Platform Fee ({(platformFeeRate * 100).toFixed(0)}%)
                </td>
                <td className="text-right py-3 px-4 text-red-600">
                  {formatter(-annualTotals.platformFee)}
                </td>
              </tr>
              {isManaged && (
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-red-600">
                    Less Management Fee ({managementFee}%)
                  </td>
                  <td className="text-right py-3 px-4 text-red-600">
                    {formatter(-annualTotals.managementFeeAmount)}
                  </td>
                </tr>
              )}
              <tr className="border-b bg-gray-50 font-medium">
                <td className="py-3 px-4">Final Annual Revenue</td>
                <td className="text-right py-3 px-4">
                  {formatter(annualTotals.netRevenue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}