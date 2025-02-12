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
  const isManaged = managementFee > 0;
  const platformFeeRate = isManaged ? 0.15 : 0.03;

  // Calculate annual revenue
  const daysInYear = 365;
  const occupancyRate = 0.65; // Using medium scenario
  const grossRevenue = shortTermNightly * daysInYear * occupancyRate;

  // Calculate fees
  const platformFee = grossRevenue * platformFeeRate;
  const managementFeeAmount = isManaged ? (grossRevenue - platformFee) * (managementFee / 100) : 0;
  const netRevenue = grossRevenue - platformFee - managementFeeAmount;

  return (
    <div className="space-y-8">
      {/* Revenue Breakdown Table */}
      <div className="rounded-lg border border-gray-200">
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
                  {formatter(grossRevenue)}
                </td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-red-600">
                  Less Platform Fee ({(platformFeeRate * 100).toFixed(0)}%)
                </td>
                <td className="text-right py-3 px-4 text-red-600">
                  {formatter(-platformFee)}
                </td>
              </tr>
              {isManaged && (
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-red-600">
                    Less Management Fee ({managementFee}%)
                  </td>
                  <td className="text-right py-3 px-4 text-red-600">
                    {formatter(-managementFeeAmount)}
                  </td>
                </tr>
              )}
              <tr className="border-b bg-gray-50 font-medium">
                <td className="py-3 px-4">Final Annual Revenue</td>
                <td className="text-right py-3 px-4">
                  {formatter(netRevenue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}