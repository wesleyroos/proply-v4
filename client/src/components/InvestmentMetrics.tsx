import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    year1: YearlyMetrics;
    year2: YearlyMetrics;
    year3: YearlyMetrics;
    year4: YearlyMetrics;
    year5: YearlyMetrics;
    year10: YearlyMetrics;
    year20: YearlyMetrics;
  };
  metricDescriptions: Record<keyof YearlyMetrics, MetricDescription>;
}

const years = [1, 2, 3, 4, 5, 10, 20];

export default function InvestmentMetrics({
  yearlyMetrics,
  metricDescriptions,
}: InvestmentMetricsProps) {
  // Helper function to format percentages
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  // Helper function to get metric value for a specific year
  const getMetricValue = (year: number, metric: keyof YearlyMetrics) => {
    const yearKey = `year${year}` as keyof typeof yearlyMetrics;
    return yearlyMetrics[yearKey][metric];
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Investment Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                    <Tooltip>
                      <TooltipTrigger className="text-left flex items-center gap-2">
                        {metricDescriptions[key].title}
                        <AnalyzerIndicator />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px] p-4">
                        <p className="font-medium mb-2">{metricDescriptions[key].explanation}</p>
                        <p className="text-sm text-muted-foreground">
                          Calculation: {metricDescriptions[key].calculationMethod}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {years.map((year) => (
                    <td key={year} className="py-3 px-4 text-right">
                      {format(getMetricValue(year, key))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}