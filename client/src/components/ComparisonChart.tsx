import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { formatter } from "../utils/formatting";
import MapView from "./MapView";

interface ComparisonData {
  title: string;
  longTermMonthly: number;
  shortTermMonthly: number;
  longTermAnnual: number;
  shortTermAnnual: number;
  shortTermAfterFees: number;
  breakEvenOccupancy: number;
  shortTermNightly: number;
  managementFee: number;
  annualOccupancy: number;
  bedrooms?: string;
  bathrooms?: string;
}

interface ComparisonChartProps {
  data: ComparisonData;
  address: string;
  handleExportPDF: (withBranding: boolean) => Promise<void>;
}

export default function ComparisonChart({
  data,
  address,
  handleExportPDF,
}: ComparisonChartProps) {
  const [showCalculations, setShowCalculations] = useState(false);
  const [removeSeasonality, setRemoveSeasonality] = useState(false);

  // Calculate annual revenue with or without seasonality
  const calculateAnnualRevenue = () => {
    if (removeSeasonality) {
      // Simple calculation without seasonality
      const daysInYear = 365;
      return data.shortTermNightly * daysInYear * (data.annualOccupancy / 100);
    }
    return data.shortTermAnnual;
  };

  const annualRevenue = calculateAnnualRevenue();
  const platformFeeAmount = annualRevenue * (data.managementFee > 0 ? 0.15 : 0.03);
  const afterPlatformFee = annualRevenue - platformFeeAmount;
  const managementFeeAmount = data.managementFee > 0 ? afterPlatformFee * data.managementFee : 0;
  const finalAnnualRevenue = afterPlatformFee - managementFeeAmount;

  // Data-driven monthly breakdown
  const monthlyChartData = Array(12).fill(0).map((_, i) => {
    const month = new Date(2024, i).toLocaleString("default", {
      month: "short",
    });
    const daysInMonth = new Date(2024, i + 1, 0).getDate();

    // Base nightly rate adjusted for platform fees
    const platformFee = data.managementFee > 0 ? 0.15 : 0.03;
    const feeAdjustedRate = data.shortTermNightly * (1 - platformFee);

    // Calculate revenue based on occupancy scenarios
    const lowRevenue =
      feeAdjustedRate * daysInMonth * (OCCUPANCY_RATES.low[i] / 100);
    const medRevenue =
      feeAdjustedRate * daysInMonth * (OCCUPANCY_RATES.medium[i] / 100);
    const highRevenue =
      feeAdjustedRate * daysInMonth * (OCCUPANCY_RATES.high[i] / 100);

    // Apply management fee if present
    const managementMultiplier = data.managementFee > 0 ? 1 - data.managementFee : 1;

    return {
      month,
      Conservative: lowRevenue * managementMultiplier,
      Moderate: medRevenue * managementMultiplier,
      Optimistic: highRevenue * managementMultiplier,
      "Long Term": data.longTermMonthly,
    };
  });

  return (
    <TooltipProvider>
      <div id="comparison-results" className="space-y-6">
        <MapView address={address} />
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Property Details</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Title</p>
              <p className="font-medium">{data.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bedrooms</p>
              <p className="font-medium">{data.bedrooms || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bathrooms</p>
              <p className="font-medium">{data.bathrooms || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Short-Term Nightly Rate</p>
              <p className="font-medium">
                {formatter.format(data.shortTermNightly)}{" "}
                <span className="text-base font-normal text-gray-600">
                  ({formatter.format(
                    data.shortTermNightly * (1 - (data.managementFee > 0 ? 0.15 : 0.03)),
                  )})
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Annual Occupancy</p>
              <p className="font-medium">{data.annualOccupancy}%</p>
            </div>
            {data.managementFee > 0 && (
              <div>
                <p className="text-sm text-gray-600">Management Fee</p>
                <p className="font-medium">
                  {(data.managementFee * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-[#1BA3FF] mb-2">
              Long-Term Rental
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    Revenue Breakdown
                  </h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>Annual revenue breakdown</TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Monthly Revenue</span>
                    <span className="font-medium">
                      {formatter.format(data.longTermMonthly)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Months per Year</span>
                    <span className="font-medium">× 12</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Annual Revenue</span>
                    <span>{formatter.format(data.longTermAnnual)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold text-[#114D9D] mb-2">
              Short-Term Rental
            </h3>
            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    Revenue Breakdown
                  </h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Annual revenue and fee breakdown
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Annual Revenue</span>
                    <span className="font-medium">
                      {formatter.format(annualRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id="removeSeasonality"
                      checked={removeSeasonality}
                      onCheckedChange={(checked) =>
                        setRemoveSeasonality(checked as boolean)
                      }
                    />
                    <label
                      htmlFor="removeSeasonality"
                      className="text-sm text-gray-600"
                    >
                      Remove Seasonality
                    </label>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>
                      Less Platform Fee ({data.managementFee > 0 ? "15.0%" : "3.0%"})
                    </span>
                    <span>-{formatter.format(platformFeeAmount)}</span>
                  </div>
                  {data.managementFee > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>
                        Less Management Fee ({(data.managementFee * 100).toFixed(1)}%)
                      </span>
                      <span>-{formatter.format(managementFeeAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Final Annual Revenue</span>
                    <span>{formatter.format(finalAnnualRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="link"
          className="text-sm text-gray-600 hover:text-gray-900 underline decoration-gray-600 hover:decoration-gray-900 -mt-2 mb-4"
          onClick={() => setShowCalculations(true)}
        >
          How do we calculate this?
        </Button>

        <Dialog open={showCalculations} onOpenChange={setShowCalculations}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Calculation Methodology</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Short-Term Rental Revenue</h3>
                <p>We calculate revenue using the following formula:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Base nightly rate × Days in month × Occupancy rate</li>
                  <li>Apply seasonal multipliers for each month</li>
                  <li>Deduct platform fees ({data.managementFee > 0 ? "15%" : "3%"})</li>
                  {data.managementFee > 0 && (
                    <li>Deduct management fees ({(data.managementFee * 100).toFixed(1)}%)</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Break-even Occupancy</h3>
                <p>Break-even occupancy is calculated by:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Determine required daily revenue to match long-term rental</li>
                  <li>Account for platform and management fees</li>
                  <li>Calculate required occupancy as percentage of year</li>
                </ul>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div id="occupancy-analysis" className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Occupancy Analysis</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">
                  Projected Occupancy
                </span>
                <span className="text-sm font-medium">
                  {data.annualOccupancy}%
                </span>
              </div>
              <div className="relative">
                <Progress value={data.annualOccupancy} className="h-2" />
                <div
                  className="absolute top-0 h-4 w-0.5 bg-red-500 transform -translate-y-1"
                  style={{ left: `${data.breakEvenOccupancy}%` }}
                  title="Break-even point"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-2 bg-primary rounded-full"></div>
                <span>Projected {data.annualOccupancy}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-3 bg-red-500"></div>
                <span>Break-even {data.breakEvenOccupancy}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Your short-term rental needs {data.breakEvenOccupancy}% occupancy
              to match long-term rental income.
              {data.annualOccupancy > data.breakEvenOccupancy
                ? ` At ${data.annualOccupancy}% projected occupancy, short-term rental is more profitable.`
                : ` At ${data.annualOccupancy}% projected occupancy, long-term rental may be more suitable.`}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatter.format(value)} />
                <RechartsTooltip
                  formatter={(value) => formatter.format(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Conservative"
                  stroke="#fca5a5"
                  strokeWidth={2}
                  name="Conservative (Low Season)"
                />
                <Line
                  type="monotone"
                  dataKey="Moderate"
                  stroke="#fdba74"
                  strokeWidth={2}
                  name="Moderate (Mid Season)"
                />
                <Line
                  type="monotone"
                  dataKey="Optimistic"
                  stroke="#86efac"
                  strokeWidth={2}
                  name="Optimistic (High Season)"
                />
                <Line
                  type="monotone"
                  dataKey="Long Term"
                  stroke="#93c5fd"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Long Term Rental"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

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
const SEASONALITY_FACTORS = [
  2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03,
];

const OCCUPANCY_RATES = {
  low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 65],
  medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 85],
  high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95],
};

function getSeasonalMultiplier(month: number): number {
  return SEASONALITY_FACTORS[month];
}

function getSeasonalNightlyRate(baseRate: number, month: number): number {
  return baseRate * getSeasonalMultiplier(month);
}

function getFeeAdjustedRate(rate: number, hasManagementFee: boolean): number {
  return hasManagementFee
    ? rate * 0.85 // 15% Airbnb fee for professionally managed
    : rate * 0.97; // 3% fee for self-managed
}

function calculateMonthlyRevenue(
  scenario: "low" | "medium" | "high",
  month: number,
  nightly: number,
  hasManagementFee: boolean,
  managementFeePercent: number,
): number {
  const occupancyRate = OCCUPANCY_RATES[scenario][month] / 100;
  const daysInMonth = new Date(2024, month + 1, 0).getDate();

  // Apply seasonal adjustment and platform fee
  const seasonalRate = getSeasonalNightlyRate(nightly, month);
  const feeAdjustedRate = getFeeAdjustedRate(seasonalRate, hasManagementFee);

  let revenue = feeAdjustedRate * daysInMonth * occupancyRate;

  // Apply management fee if present
  if (hasManagementFee) {
    revenue *= 1 - managementFeePercent;
  }

  return revenue;
}