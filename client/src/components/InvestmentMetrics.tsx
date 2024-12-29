import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatter } from "@/utils/rentalPerformance";
import AnalyzerIndicator from "./AnalyzerIndicator";

interface MetricDescription {
  title: string;
  explanation: string;
  calculationMethod: string;
}

interface YearlyMetrics {
  grossYield: number;
  netYield: number;
  returnOnEquity: number;
  annualReturn: number;
  capRate: number;
  cashOnCashReturn: number;
  roiWithoutAppreciation: number;
  roiWithAppreciation: number;
  irr: number;
  netWorthChange: number;
}

interface InvestmentMetricsProps {
  yearlyMetrics: {
    shortTerm: YearlyMetrics[];
    longTerm: YearlyMetrics[];
  };
  metricDescriptions: Record<keyof YearlyMetrics, MetricDescription>;
}

const years = [1, 2, 3, 4, 5, 10, 20];
const yearToIndex = new Map([
  [1, 0],
  [2, 1],
  [3, 2],
  [4, 3],
  [5, 4],
  [10, 5],
  [20, 6],
]);

export default function InvestmentMetrics({
  yearlyMetrics,
  metricDescriptions,
}: InvestmentMetricsProps) {
  // Helper function to format percentages
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  // Helper function to get metric value for a specific year and rental type
  const getMetricValue = (year: number, metric: keyof YearlyMetrics, rentalType: 'shortTerm' | 'longTerm') => {
    const index = yearToIndex.get(year);
    if (index === undefined) return 0;
    return yearlyMetrics[rentalType][index][metric];
  };

  // List of metrics to display in order
  const metricsToDisplay: Array<{
    key: keyof YearlyMetrics;
    format: (value: number) => string;
  }> = [
    { key: "grossYield", format: formatPercentage },
    { key: "netYield", format: formatPercentage },
    { key: "returnOnEquity", format: formatPercentage },
    { key: "annualReturn", format: formatPercentage },
    { key: "capRate", format: formatPercentage },
    { key: "cashOnCashReturn", format: formatPercentage },
    { key: "roiWithoutAppreciation", format: formatPercentage },
    { key: "roiWithAppreciation", format: formatPercentage },
    { key: "irr", format: formatPercentage },
    { key: "netWorthChange", format: formatter },
  ];

  const MetricsTable = ({ rentalType }: { rentalType: 'shortTerm' | 'longTerm' }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left py-3 px-4">Metric</th>
            {years.map((year) => (
              <th key={year} className="text-right py-3 px-4">
                Year {year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metricsToDisplay.map(({ key, format }) => (
            <tr key={key} className="border-b hover:bg-muted/50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span>{metricDescriptions[key].title}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px] p-4">
                      <p className="font-medium mb-2">{metricDescriptions[key].explanation}</p>
                      <p className="text-sm text-muted-foreground">
                        Calculation: {metricDescriptions[key].calculationMethod}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </td>
              {years.map((year) => (
                <td key={year} className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>{format(getMetricValue(year, key, rentalType))}</span>
                    <AnalyzerIndicator />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="shortTerm">
          <TabsList className="mb-4">
            <TabsTrigger value="shortTerm">Short-term Rental</TabsTrigger>
            <TabsTrigger value="longTerm">Long-term Rental</TabsTrigger>
          </TabsList>
          <TabsContent value="shortTerm">
            <MetricsTable rentalType="shortTerm" />
          </TabsContent>
          <TabsContent value="longTerm">
            <MetricsTable rentalType="longTerm" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}