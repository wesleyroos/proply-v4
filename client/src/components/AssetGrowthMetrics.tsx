import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface AssetGrowthMetrics {
  propertyValue: number;
  annualAppreciation: number;
  loanBalance: number;
  totalInterestPaid: number;
  interestToPrincipalRatio: number;
  totalEquity: number;
  equityFromRepayment: number;
  netWorthChange: number;
}

interface AssetGrowthMetricsProps {
  metrics: Record<string, {
    propertyValue: number;
    annualAppreciation: number;
    loanBalance: number;
    totalInterestPaid: number;
    interestToPrincipalRatio: number;
    totalEquity: number;
    equityFromRepayment: number;
    netWorthChange: number;
  }>;
}

export default function AssetGrowthMetrics({
  metrics
}: AssetGrowthMetricsProps) {
  const years = [1, 2, 3, 4, 5, 10, 20];

  const MetricLabel = ({ label, tooltip }: { label: string; tooltip: string }) => (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      <Tooltip delayDuration={0}>
        <TooltipTrigger>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px] text-sm">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Asset Growth & Equity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-6">Metric</th>
                {years.map(year => (
                  <th key={year} className="text-right py-3 px-6">Year {year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Property Value */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Property Value"
                    tooltip="The projected property value based on the annual appreciation rate."
                  />
                </td>
                {years.map(year => {
                  const yearMetrics = metrics[`year${year}`];
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(yearMetrics.propertyValue).toLocaleString()}
                        <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Annual Appreciation */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Annual Appreciation"
                    tooltip="The amount of value added to the property each year based on the appreciation rate."
                  />
                </td>
                {years.map(year => {
                  const yearMetrics = metrics[`year${year}`];
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(yearMetrics.annualAppreciation).toLocaleString()}
                        <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Loan Balance */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Loan Balance"
                    tooltip="The remaining loan balance at the end of each year based on the amortization schedule."
                  />
                </td>
                {years.map(year => {
                  const yearMetrics = metrics[`year${year}`];
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(yearMetrics.loanBalance).toLocaleString()}
                        <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Total Interest Paid */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Total Interest Paid"
                    tooltip="The cumulative amount of interest paid on the loan up to this point."
                  />
                </td>
                {years.map(year => {
                  const yearMetrics = metrics[`year${year}`];
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(yearMetrics.totalInterestPaid).toLocaleString()}
                        <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Interest-to-Principal Ratio */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Interest-to-Principal Ratio"
                    tooltip="The percentage of your monthly payment that goes towards interest vs principal. A decreasing ratio indicates more of your payment going to principal over time."
                  />
                </td>
                {years.map(year => {
                  const yearMetrics = metrics[`year${year}`];
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {yearMetrics.interestToPrincipalRatio.toFixed(1)}%
                        <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                      </div>
                    </td>
                  );
                })}
              </tr>

              

              {/* Total Equity */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Total Equity"
                    tooltip="The total equity in the property, including initial deposit, loan repayment, and appreciation."
                  />
                </td>
                {years.map(year => {
                  const yearMetrics = metrics[`year${year}`];
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(yearMetrics.totalEquity).toLocaleString()}
                        <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Equity Build-up (from loan repayment) */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Loan Repayment Equity"
                    tooltip="The amount of equity built through loan repayment alone (excluding appreciation)."
                  />
                </td>
                {years.map(year => {
                  const yearMetrics = metrics[`year${year}`];
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(yearMetrics.equityFromRepayment).toLocaleString()}
                        <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}