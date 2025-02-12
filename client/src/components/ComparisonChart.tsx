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
import { FileText, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { useProAccess } from "@/hooks/use-pro-access";
import { UpgradeModal } from "./UpgradeModal";
import { InfoIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MapView from "./MapView";
import { formatter } from "../utils/formatting";
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
}

export default function ComparisonChart({
  data,
  address,
}: ComparisonChartProps) {
  const { hasAccess: hasProAccess } = useProAccess();
  const [showCalculations, setShowCalculations] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
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

  // Original simple chart data
  const basicChartData = [
    {
      name: "Monthly Income",
      "Long Term": data.longTermMonthly,
      "Short Term": data.shortTermMonthly,
    },
    {
      name: "Annual Income",
      "Long Term": data.longTermAnnual,
      "Short Term": data.shortTermAnnual,
    },
  ];

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

  const { toast } = useToast();

  return (
    <TooltipProvider>
      <div id="comparison-results" className="space-y-6">
        <div className="flex justify-end gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={async () => {
                try {
                  const response = await fetch("/api/properties", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                      title: data.title,
                      address,
                      bedrooms: data.bedrooms || "",
                      bathrooms: data.bathrooms || "",
                      longTermRental: data.longTermMonthly.toString(),
                      annualEscalation: "0",
                      shortTermNightly: data.shortTermNightly.toString(),
                      annualOccupancy: data.annualOccupancy.toString(),
                      managementFee: (data.managementFee * 100).toString(),
                      longTermMonthly: data.longTermMonthly,
                      longTermAnnual: data.longTermAnnual,
                      shortTermMonthly: data.shortTermMonthly,
                      shortTermAnnual: data.shortTermAnnual,
                      shortTermAfterFees: data.shortTermAfterFees,
                      breakEvenOccupancy: data.breakEvenOccupancy,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error("Failed to save property");
                  }

                  toast({
                    variant: "success",
                    title: "Success",
                    description: "Property saved successfully",
                    duration: 3000,
                  });
                } catch (error) {
                  console.error("Error saving property:", error);
                  toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to save property",
                    duration: 3000,
                  });
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Save Property
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => generatePropertyPreviewPDF(data, false, user)}>
                  <FileText className="mr-2" />
                  Without Branding
                </DropdownMenuItem>
                {hasProAccess ? (
                  <DropdownMenuItem onClick={() => generatePropertyPreviewPDF(data, true, user)}>
                    <FileText className="mr-2" />
                    With Branding
                    <div className="ml-2 flex items-center gap-1">
                      <span className="text-xs font-semibold text-[#3B82F6]">PRO</span>
                      <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                    </div>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setShowUpgradeModal(true)}>
                    <FileText className="mr-2" />
                    With Branding
                    <div className="ml-2 flex items-center gap-1">
                      <span className="text-xs font-semibold text-[#3B82F6]">PRO</span>
                      <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
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
                  {data.managementFee > 0 && <li>Deduct management fees ({(data.managementFee * 100).toFixed(1)}%)</li>}
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
        <div
          id="monthly-revenue-table"
          className="overflow-x-auto border rounded-lg shadow-sm"
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="border-b">
                <th className="text-left py-3 px-6 min-w-[120px] bg-gray-50">
                  Metric
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Jan
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Feb
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Mar
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Apr
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  May
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Jun
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Jul
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Aug
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Sep
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Oct
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Nov
                </th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">
                  Dec
                </th>
                <th className="text-right py-3 px-6 min-w-[120px] bg-gray-50 border-l">
                  Total
                </th>
                <th className="text-right py-3 px-6 min-w-[120px] bg-gray-50">
                  Monthly Avg
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Nightly Rate</td>
                {Array(12)
                  .fill(0)
                  .map((_, i) => (
                    <td
                      key={i}
                      className="text-right py-3 px-6 whitespace-nowrap"
                    >
                      {formatter.format(
                        getSeasonalNightlyRate(data.shortTermNightly, i),
                      )}
                    </td>
                  ))}
                <td colSpan={2}></td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Fee-Adjusted Rate</td>
                {Array(12)
                  .fill(0)
                  .map((_, i) => (
                    <td
                      key={i}
                      className="text-right py-3 px-6 whitespace-nowrap"
                    >
                      {formatter.format(
                        getFeeAdjustedRate(
                          getSeasonalNightlyRate(data.shortTermNightly, i),
                          data.managementFee > 0,
                        ),
                      )}
                    </td>
                  ))}
                <td colSpan={2}></td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Occupancy Low</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">65%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">65%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">60%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">55%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">50%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">50%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">50%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">50%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">60%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">65%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">65%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">70%</td>
                <td className="text-right py-3 px-6 border-l">-</td>
                <td className="text-right py-3 px-6">58.8%</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Occupancy Medium</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">80%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">78%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">73%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">68%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">63%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">60%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">60%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">60%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">70%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">75%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">75%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">85%</td>
                <td className="text-right py-3 px-6 border-l">-</td>
                <td className="text-right py-3 px-6">70.6%</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Occupancy High</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">95%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">90%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">85%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">80%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">75%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">70%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">70%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">70%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">80%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">85%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">85%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">95%</td>
                <td className="text-right py-3 px-6 border-l">-</td>
                <td className="text-right py-3 px-6">81.7%</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Days in Month</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">31</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">28</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">31</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">30</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">31</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">30</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">31</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">31</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">30</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">31</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">30</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">31</td>
                <td className="text-right py-3 px-6 border-l">365</td>
                <td className="text-right py-3 px-6">30.4</td>
              </tr>
              <tr className="border-b bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20">
                <td className="py-3 px-6 text-[#FF6B6B] font-medium">
                  Revenue Low
                  {data.managementFee > 0
                    ? ` (After ${data.managementFee * 100}% Fee)`
                    : ""}
                </td>
                {Array(12)
                  .fill(0)
                  .map((_, i) => {
                    const seasonalRate = getSeasonalNightlyRate(
                      data.shortTermNightly,
                      i,
                    );
                    const feeAdjustedRate = getFeeAdjustedRate(
                      seasonalRate,
                      data.managementFee > 0,
                    );
                    const daysInMonth = new Date(2024, i + 1, 0).getDate();
                    const occupancyRate = OCCUPANCY_RATES.low[i] / 100;
                    const revenue =
                      feeAdjustedRate * occupancyRate * daysInMonth;
                    const afterFee =
                      data.managementFee > 0
                        ? revenue * (1 - data.managementFee)
                        : revenue;
                    return (
                      <td
                        key={i}
                        className="text-right py-3 px-6 whitespace-nowrap"
                      >
                        {formatter.format(afterFee)}
                      </td>
                    );
                  })}
                <td className="text-right py-3 px-6 border-l font-semibold">
                  {formatter.format(
                    Array(12)
                      .fill(0)
                      .reduce((sum, _, i) => {
                        const seasonalRate = getSeasonalNightlyRate(
                          data.shortTermNightly,
                          i,
                        );
                        const feeAdjustedRate = getFeeAdjustedRate(
                          seasonalRate,
                          data.managementFee > 0,
                        );
                        const daysInMonth = new Date(2024, i + 1, 0).getDate();
                        const occupancyRate = OCCUPANCY_RATES.low[i] / 100;
                        const revenue =
                          feeAdjustedRate * occupancyRate * daysInMonth;
                        return (
                          sum +
                          (data.managementFee > 0
                            ? revenue * (1 - data.managementFee)
                            : revenue)
                        );
                      }, 0),
                  )}
                </td>
                <td className="text-right py-3 px-6 font-semibold">
                  {formatter.format(
                    Array(12)
                      .fill(0)
                      .reduce((sum, _, i) => {
                        const seasonalRate = getSeasonalNightlyRate(
                          data.shortTermNightly,
                          i,
                        );
                        const feeAdjustedRate = getFeeAdjustedRate(
                          seasonalRate,
                          data.managementFee > 0,
                        );
                        const daysInMonth = new Date(2024, i + 1, 0).getDate();
                        const occupancyRate = OCCUPANCY_RATES.low[i] / 100;
                        const revenue =
                          feeAdjustedRate * occupancyRate * daysInMonth;
                        return (
                          sum +
                          (data.managementFee > 0
                            ? revenue * (1 - data.managementFee)
                            : revenue)
                        );
                      }, 0) / 12,
                  )}
                </td>
              </tr>
              <tr className="border-b bg-[#4ECDC4]/10 hover:bg-[#4ECDC4]/20">
                <td className="py-3 px-6 text-[#4ECDC4] font-medium">
                  Revenue Medium
                  {data.managementFee > 0
                    ? ` (After ${data.managementFee * 100}% Fee)`
                    : ""}
                </td>
                {Array(12)
                  .fill(0)
                  .map((_, i) => {
                    const seasonalRate = getSeasonalNightlyRate(
                      data.shortTermNightly,
                      i,
                    );
                    const feeAdjustedRate = getFeeAdjustedRate(
                      seasonalRate,
                      data.managementFee > 0,
                    );
                    const daysInMonth = new Date(2024, i + 1, 0).getDate();
                    const occupancyRate = OCCUPANCY_RATES.medium[i] / 100;
                    const revenue =
                      feeAdjustedRate * occupancyRate * daysInMonth;
                    const afterFee =
                      data.managementFee > 0
                        ? revenue * (1 - data.managementFee)
                        : revenue;
                    return (
                      <td
                        key={i}
                        className="text-right py-3 px-6 whitespace-nowrap"
                      >
                        {formatter.format(afterFee)}
                      </td>
                    );
                  })}
                <td className="text-right py-3 px-6 border-l font-semibold">
                  {formatter.format(
                    Array(12)
                      .fill(0)
                      .reduce((sum, _, i) => {
                        const seasonalRate = getSeasonalNightlyRate(
                          data.shortTermNightly,
                          i,
                        );
                        const feeAdjustedRate = getFeeAdjustedRate(
                          seasonalRate,
                          data.managementFee > 0,
                        );
                        const daysInMonth = new Date(2024, i + 1, 0).getDate();
                        const occupancyRate = OCCUPANCY_RATES.medium[i] / 100;
                        const revenue =
                          feeAdjustedRate * occupancyRate * daysInMonth;
                        return (
                          sum +
                          (data.managementFee > 0
                            ? revenue * (1 - data.managementFee)
                            : revenue)
                        );
                      }, 0),
                  )}
                </td>
                <td className="text-right py-3 px-6 font-semibold">
                  {formatter.format(
                    Array(12)
                      .fill(0)
                      .reduce((sum, _, i) => {
                        const seasonalRate = getSeasonalNightlyRate(
                          data.shortTermNightly,
                          i,
                        );
                        const feeAdjustedRate = getFeeAdjustedRate(
                          seasonalRate,
                          data.managementFee > 0,
                        );
                        const daysInMonth = new Date(2024, i + 1, 0).getDate();
                        const occupancyRate = OCCUPANCY_RATES.medium[i] / 100;
                        const revenue =
                          feeAdjustedRate * occupancyRate * daysInMonth;
                        return (
                          sum +
                          (data.managementFee > 0
                            ? revenue * (1 - data.managementFee)
                            : revenue)
                        );
                      }, 0) / 12,
                  )}
                </td>
              </tr>
              <tr className="border-b bg-[#45B7D1]/10 hover:bg-[#45B7D1]/20">
                <td className="py-3 px-6 text-[#45B7D1] font-medium">
                  Revenue High
                  {data.managementFee > 0
                    ? ` (After ${data.managementFee * 100}% Fee)`
                    : ""}
                </td>
                {Array(12)
                  .fill(0)
                  .map((_, i) => {
                    const seasonalRate = getSeasonalNightlyRate(
                      data.shortTermNightly,
                      i,
                    );
                    const feeAdjustedRate = getFeeAdjustedRate(
                      seasonalRate,
                      data.managementFee > 0,
                    );
                    const daysInMonth = new Date(2024, i + 1, 0).getDate();
                    const occupancyRate = OCCUPANCY_RATES.high[i] / 100;
                    const revenue =
                      feeAdjustedRate * occupancyRate * daysInMonth;
                    const afterFee =
                      data.managementFee > 0
                        ? revenue * (1 - data.managementFee)
                        : revenue;
                    return (
                      <td
                        key={i}
                        className="text-right py-3 px-6 whitespace-nowrap"
                      >
                        {formatter.format(afterFee)}
                      </td>
                    );
                  })}
                <td className="text-right py-3 px-6 border-l font-semibold">
                  {formatter.format(
                    Array(12)
                      .fill(0)
                      .reduce((sum, _, i) => {
                        const seasonalRate = getSeasonalNightlyRate(
                          data.shortTermNightly,
                          i,
                        );
                        const feeAdjustedRate = getFeeAdjustedRate(
                          seasonalRate,
                          data.managementFee > 0,
                        );
                        const daysInMonth = new Date(2024, i + 1, 0).getDate();
                        const occupancyRate = OCCUPANCY_RATES.high[i] / 100;
                        const revenue =
                          feeAdjustedRate * occupancyRate * daysInMonth;
                        return (
                          sum +
                          (data.managementFee > 0
                            ? revenue * (1 - data.managementFee)
                            : revenue)
                        );
                      }, 0),
                  )}
                </td>
                <td className="text-right py-3 px-6 font-semibold">
                  {formatter.format(
                    Array(12)
                      .fill(0)
                      .reduce((sum, _, i) => {
                        const seasonalRate = getSeasonalNightlyRate(
                          data.shortTermNightly,
                          i,
                        );
                        const feeAdjustedRate = getFeeAdjustedRate(
                          seasonalRate,
                          data.managementFee > 0,
                        );
                        const daysInMonth = new Date(2024, i + 1, 0).getDate();
                        const occupancyRate = OCCUPANCY_RATES.high[i] / 100;
                        const revenue =
                          feeAdjustedRate * occupancyRate * daysInMonth;
                        return (
                          sum +
                          (data.managementFee > 0
                            ? revenue * (1 - data.managementFee)
                            : revenue)
                        );
                      }, 0) / 12,
                  )}
                </td>
              </tr>
              <tr className="border-b bg-[#FFE66D]/10 hover:bg-[#FFE66D]/20">
                <td className="py-3 px-6 text-[#B8860B] font-medium">
                  Long Term Rental
                </td>
                {Array(12)
                  .fill(0)
                  .map((_, i) => (
                    <td
                      key={i}
                      className="text-right py-3 px-6 whitespace-nowrap"
                    >
                      {formatter.format(data.longTermMonthly)}
                    </td>
                  ))}
                <td className="text-right py-3 px-6 border-l font-semibold">
                  {formatter.format(data.longTermAnnual)}
                </td>
                <td className="text-right py-3 px-6 font-semibold">
                  {formatter.format(data.longTermMonthly)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div id="performance-metrics-table" className="mt-6">
          <Button
            variant="link"
            className="text-sm text-gray-600 hover:text-gray-900 mt-8 w-full text-left"
            onClick={() => setShowDisclaimer(!showDisclaimer)}
          >
            {showDisclaimer ? "Hide Disclaimer ▴" : "Show Disclaimer ▾"}
          </Button>
          {showDisclaimer && (
            <div className="mt-4 text-sm text-gray-600 space-y-4">
              <p>
                The information contained in this report is provided by Proply
                Tech (Pty) Ltd for informational purposes only. While we make
                best efforts to ensure the accuracy and reliability of all data
                presented, including sourcing information from trusted
                third-party providers, we cannot guarantee its absolute accuracy
                or completeness.
              </p>
              <p>
                This report is intended to serve as a general guide and should
                not be considered as financial, investment, legal, or
                professional advice. Property rental strategy decisions should
                be made after careful consideration of all relevant factors,
                including but not limited to local market conditions,
                regulations, and personal circumstances.
              </p>
              <p>
                Proply Tech (Pty) Ltd and its affiliates expressly disclaim any
                and all liability for any direct, indirect, incidental, or
                consequential damages arising from the use of this information.
                Actual rental income, occupancy rates, and management costs may
                vary significantly from the projections and estimates presented.
              </p>
              <p>
                By using this report, you acknowledge that the calculations and
                projections are indicative only and based on the information
                available at the time of generation. Factors beyond our control,
                including but not limited to seasonal demand, regulatory
                changes, platform policies, and economic conditions, may impact
                actual outcomes.
              </p>
              <p className="text-xs mt-4">
                © Proply Tech (Pty) Ltd. All rights reserved.
              </p>
            </div>
          )}
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