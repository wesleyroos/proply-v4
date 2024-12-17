import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
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
                    Base monthly rental income before annual escalation
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
                    Total yearly income including annual escalation rate
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xl font-bold">{formatter.format(data.longTermAnnual)}</p>
              
              <div className="mt-2 text-xs text-gray-500">
                <p>Calculation:</p>
                <p>Monthly × 12 × (1 + Escalation Rate)</p>
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
                    Average monthly income based on nightly rate and occupancy
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
                <p>Nightly Rate × 365 × Occupancy Rate ÷ 12</p>
                <p>Annual = Monthly × 12 × (1 - Management Fee)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip 
                formatter={(value) => formatter.format(value as number)}
              />
              <Legend />
              <Bar dataKey="Long Term" fill="#1BA3FF" />
              <Bar dataKey="Short Term" fill="#114D9D" />
            </BarChart>
          </ResponsiveContainer>
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
      </div>
    </TooltipProvider>
  );
}
