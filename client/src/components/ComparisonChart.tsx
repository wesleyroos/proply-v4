import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface ComparisonData {
  longTermMonthly: number;
  shortTermMonthly: number;
  longTermAnnual: number;
  shortTermAnnual: number;
  breakEvenOccupancy: number;
  shortTermNightly: number;
  managementFee: number;
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

  const formatter = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // Removed unused functions as calculations are now done inline

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-[#1BA3FF] mb-2">Long-Term Rental</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Monthly rental income
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xl font-bold">{formatter.format(data.longTermMonthly)}</p>

              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Annual Revenue</p>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Annual rental income (monthly × 12)
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xl font-bold">{formatter.format(data.longTermAnnual)}</p>

              <div className="mt-2 text-xs text-gray-500">
                <p>Calculation:</p>
                <p>Monthly × 12</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold text-[#114D9D] mb-2">Short-Term Rental</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Monthly Revenue (Average)</p>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Average monthly income based on fee-adjusted nightly rate and occupancy.
                    {data.managementFee > 0
                      ? "Professional management: 15% Airbnb fee applied"
                      : "Self-managed: 3% platform fee applied"}
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xl font-bold">{formatter.format(data.shortTermMonthly)}</p>

              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Annual Revenue (After Fees)</p>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Total yearly income after management fees
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xl font-bold">{formatter.format(data.shortTermAnnual)}</p>

              <div className="mt-2 text-xs text-gray-500">
                <p>Calculation:</p>
                <p>Adjusted Nightly Rate = {data.managementFee > 0
                  ? "Nightly Rate × 0.85 (15% Airbnb fee)"
                  : "Nightly Rate × 0.97 (3% platform fee)"}</p>
                <p>Monthly = (Adjusted Rate × 365 × Occupancy Rate) ÷ 12</p>
                {data.managementFee > 0 && (
                  <p>Annual = Monthly × 12 × (1 - Management Fee)</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Occupancy Analysis</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Break-even Occupancy</span>
                <span className="text-sm font-medium">{data.breakEvenOccupancy}%</span>
              </div>
              <Progress value={data.breakEvenOccupancy} className="h-2" />
            </div>
            <p className="text-sm text-gray-600">
              To match long-term rental income, your short-term rental needs to maintain at least {data.breakEvenOccupancy}% occupancy throughout the year.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Short-Term Rental Scenarios</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-right py-2">Jan</th>
                  <th className="text-right py-2">Feb</th>
                  <th className="text-right py-2">Mar</th>
                  <th className="text-right py-2">Apr</th>
                  <th className="text-right py-2">May</th>
                  <th className="text-right py-2">Jun</th>
                  <th className="text-right py-2">Jul</th>
                  <th className="text-right py-2">Aug</th>
                  <th className="text-right py-2">Sep</th>
                  <th className="text-right py-2">Oct</th>
                  <th className="text-right py-2">Nov</th>
                  <th className="text-right py-2">Dec</th>
                  <th className="text-right py-2 border-l">Total</th>
                  <th className="text-right py-2">Monthly Avg</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Nightly Rate</td>
                  {Array(12).fill(0).map((_, i) => (
                    <td key={i} className="text-right py-2">
                      {formatter.format(getSeasonalNightlyRate(data.shortTermNightly, i))}
                    </td>
                  ))}
                  <td colSpan={2}></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Fee-Adjusted Rate</td>
                  {Array(12).fill(0).map((_, i) => (
                    <td key={i} className="text-right py-2">
                      {formatter.format(getFeeAdjustedRate(getSeasonalNightlyRate(data.shortTermNightly, i), data.managementFee > 0))}
                    </td>
                  ))}
                  <td colSpan={2}></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Occupancy Low</td>
                  <td className="text-right">65%</td>
                  <td className="text-right">65%</td>
                  <td className="text-right">60%</td>
                  <td className="text-right">55%</td>
                  <td className="text-right">50%</td>
                  <td className="text-right">50%</td>
                  <td className="text-right">50%</td>
                  <td className="text-right">50%</td>
                  <td className="text-right">60%</td>
                  <td className="text-right">65%</td>
                  <td className="text-right">65%</td>
                  <td className="text-right">70%</td>
                  <td colSpan={2}></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Occupancy Medium</td>
                  <td className="text-right">80%</td>
                  <td className="text-right">78%</td>
                  <td className="text-right">73%</td>
                  <td className="text-right">68%</td>
                  <td className="text-right">63%</td>
                  <td className="text-right">60%</td>
                  <td className="text-right">60%</td>
                  <td className="text-right">60%</td>
                  <td className="text-right">70%</td>
                  <td className="text-right">75%</td>
                  <td className="text-right">75%</td>
                  <td className="text-right">85%</td>
                  <td colSpan={2}></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Occupancy High</td>
                  <td className="text-right">95%</td>
                  <td className="text-right">90%</td>
                  <td className="text-right">85%</td>
                  <td className="text-right">80%</td>
                  <td className="text-right">75%</td>
                  <td className="text-right">70%</td>
                  <td className="text-right">70%</td>
                  <td className="text-right">70%</td>
                  <td className="text-right">80%</td>
                  <td className="text-right">85%</td>
                  <td className="text-right">85%</td>
                  <td className="text-right">95%</td>
                  <td colSpan={2}></td>
                </tr>
                <tr className="border-b bg-[#FF6B6B]/10">
                  <td className="py-2 text-[#FF6B6B] font-medium">Revenue Low</td>
                  {Array(12).fill(0).map((_, i) => (
                    <td key={i} className="text-right py-2">
                      {formatter.format(calculateMonthlyRevenue('low', i, data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                    </td>
                  ))}
                  <td className="text-right py-2 border-l font-semibold">
                    {formatter.format(
                      Array(12).fill(0)
                        .reduce((sum, _, i) => sum + calculateMonthlyRevenue('low', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0)
                    )}
                  </td>
                  <td className="text-right py-2 font-semibold">
                    {formatter.format(
                      Array(12).fill(0)
                        .reduce((sum, _, i) => sum + calculateMonthlyRevenue('low', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0) / 12
                    )}
                  </td>
                </tr>
                <tr className="border-b bg-[#4ECDC4]/10">
                  <td className="py-2 text-[#4ECDC4] font-medium">Revenue Medium</td>
                  {Array(12).fill(0).map((_, i) => (
                    <td key={i} className="text-right py-2">
                      {formatter.format(calculateMonthlyRevenue('medium', i, data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                    </td>
                  ))}
                  <td className="text-right py-2 border-l font-semibold">
                    {formatter.format(
                      Array(12).fill(0)
                        .reduce((sum, _, i) => sum + calculateMonthlyRevenue('medium', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0)
                    )}
                  </td>
                  <td className="text-right py-2 font-semibold">
                    {formatter.format(
                      Array(12).fill(0)
                        .reduce((sum, _, i) => sum + calculateMonthlyRevenue('medium', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0) / 12
                    )}
                  </td>
                </tr>
                <tr className="border-b bg-[#45B7D1]/10">
                  <td className="py-2 text-[#45B7D1] font-medium">Revenue High</td>
                  {Array(12).fill(0).map((_, i) => (
                    <td key={i} className="text-right py-2">
                      {formatter.format(calculateMonthlyRevenue('high', i, data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                    </td>
                  ))}
                  <td className="text-right py-2 border-l font-semibold">
                    {formatter.format(
                      Array(12).fill(0)
                        .reduce((sum, _, i) => sum + calculateMonthlyRevenue('high', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0)
                    )}
                  </td>
                  <td className="text-right py-2 font-semibold">
                    {formatter.format(
                      Array(12).fill(0)
                        .reduce((sum, _, i) => sum + calculateMonthlyRevenue('high', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0) / 12
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Array(12).fill(0).map((_, i) => ({
                  month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
                  low: calculateMonthlyRevenue('low', i, data.shortTermNightly, data.managementFee > 0, data.managementFee),
                  medium: calculateMonthlyRevenue('medium', i, data.shortTermNightly, data.managementFee > 0, data.managementFee),
                  high: calculateMonthlyRevenue('high', i, data.shortTermNightly, data.managementFee > 0, data.managementFee),
                  longTerm: data.longTermMonthly,
                }))}
              >
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatter.format(value)} />
                <RechartsTooltip formatter={(value) => formatter.format(value as number)} />
                <Legend />
                <Line type="monotone" dataKey="low" stroke="#FF6B6B" name="Revenue Low" />
                <Line type="monotone" dataKey="medium" stroke="#4ECDC4" name="Revenue Medium" />
                <Line type="monotone" dataKey="high" stroke="#45B7D1" name="Revenue High" />
                <Line type="monotone" dataKey="longTerm" stroke="#FFE66D" strokeDasharray="5 5" name="Long Term Rental" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEASONALITY_FACTORS = [2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03];

const OCCUPANCY_RATES = {
  low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 65],
  medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 80],
  high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
};

function getSeasonalMultiplier(month: number): number {
  return SEASONALITY_FACTORS[month];
}

function getSeasonalNightlyRate(baseRate: number, month: number): number {
  return baseRate * getSeasonalMultiplier(month);
}

function getFeeAdjustedRate(rate: number, hasManagementFee: boolean): number {
  return hasManagementFee
    ? rate * 0.85  // 15% Airbnb fee for professionally managed
    : rate * 0.97; // 3% fee for self-managed
}

function calculateMonthlyRevenue(
  scenario: 'low' | 'medium' | 'high',
  month: number,
  nightly: number,
  hasManagementFee: boolean,
  managementFeePercent: number
): number {
  const occupancyRate = OCCUPANCY_RATES[scenario][month] / 100;
  const daysInMonth = new Date(2024, month + 1, 0).getDate();

  // Apply seasonal adjustment and platform fee
  const seasonalRate = getSeasonalNightlyRate(nightly, month);
  const feeAdjustedRate = getFeeAdjustedRate(seasonalRate, hasManagementFee);

  let revenue = feeAdjustedRate * daysInMonth * occupancyRate;

  // Apply management fee if present
  if (hasManagementFee) {
    revenue *= (1 - managementFeePercent);
  }

  return revenue;
}