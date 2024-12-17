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
                </tr>
              </thead>
              <tbody>
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
                </tr>
                <tr className="border-b">
                  <td className="py-2">Revenue Low</td>
                  {Array(12).fill(0).map((_, i) => (
                    <td key={i} className="text-right py-2">
                      {formatter.format(calculateMonthlyRevenue('low', i))}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2">Revenue Medium</td>
                  {Array(12).fill(0).map((_, i) => (
                    <td key={i} className="text-right py-2">
                      {formatter.format(calculateMonthlyRevenue('medium', i))}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2">Revenue High</td>
                  {Array(12).fill(0).map((_, i) => (
                    <td key={i} className="text-right py-2">
                      {formatter.format(calculateMonthlyRevenue('high', i))}
                    </td>
                  ))}
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

const OCCUPANCY_RATES = {
  low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 70],
  medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 85],
  high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
};

function calculateMonthlyRevenue(
  scenario: 'low' | 'medium' | 'high',
  month: number,
  nightly: number,
  hasManagementFee: boolean,
  managementFeePercent: number
): number {
  const occupancyRate = OCCUPANCY_RATES[scenario][month] / 100;
  const daysInMonth = new Date(2024, month + 1, 0).getDate();
  
  // Apply platform fee adjustment
  const adjustedRate = hasManagementFee
    ? nightly * 0.85  // 15% Airbnb fee for professionally managed
    : nightly * 0.97; // 3% fee for self-managed
  
  let revenue = adjustedRate * daysInMonth * occupancyRate;
  
  // Apply management fee if present
  if (hasManagementFee) {
    revenue *= (1 - managementFeePercent);
  }
  
  return revenue;
}
