import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface AssetGrowthMetricsProps {
  purchasePrice: number;
  deposit: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  annualAppreciation: number;
  onCalculate: (metrics: number[][]) => void; // Added callback function
}

export default function AssetGrowthMetrics({
  purchasePrice,
  deposit,
  loanAmount,
  interestRate,
  loanTerm,
  annualAppreciation,
  onCalculate, // Added callback prop
}: AssetGrowthMetricsProps) {
  const years = [1, 2, 3, 4, 5, 10, 20];
  const monthlyRate = (interestRate > 0 ? interestRate : 0) / 100 / 12;
  const totalPayments = loanTerm * 12;

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

  // Helper function to calculate loan balance for a given period
  const calculateLoanBalance = (monthsPaid: number): number => {
    if (loanAmount <= 0 || monthlyRate <= 0) return 0;
    if (monthsPaid >= totalPayments) return 0;

    const monthlyPayment = calculateMonthlyPayment();
    const remainingPayments = totalPayments - monthsPaid;
    return monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -remainingPayments)) / monthlyRate);
  };

  // Helper function to calculate monthly payment
  const calculateMonthlyPayment = (): number => {
    if (loanAmount <= 0 || monthlyRate <= 0) return 0;

    try {
      return (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) 
        / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    } catch (error) {
      return 0;
    }
  };

  // Create data for the chart and for the console log
  const allMetrics = years.map(year => {
    const propertyValue = purchasePrice * Math.pow(1 + (annualAppreciation / 100), year);
    const loanBalance = calculateLoanBalance(year * 12);
    const totalEquity = propertyValue - loanBalance;
    const monthsPaid = year * 12;
    const monthlyPayment = calculateMonthlyPayment();
    const totalPaid = monthsPaid * monthlyPayment;
    const principalPaid = loanAmount - loanBalance;
    const interestPaid = totalPaid - principalPaid;
    const interestPayment = loanBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    const ratio = principalPayment > 0 ? (interestPayment / principalPayment) * 100 : 0;
    const equityFromRepayment = loanAmount - loanBalance;

    return [propertyValue, annualAppreciation, loanBalance, interestPaid, ratio, totalEquity, equityFromRepayment];
  });

  onCalculate(allMetrics); // Call the callback function

  const chartData = years.map((year, index) => ({
    year: `Year ${year}`,
    'Property Value': allMetrics[index][0],
    'Loan Balance': allMetrics[index][2],
    'Total Equity': allMetrics[index][5]
  }));

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Asset Growth & Equity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[400px]" id="asset-growth-chart">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `R${(value / 1000000).toFixed(1)}M`} />
              <RechartsTooltip formatter={(value) => `R${value.toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="Property Value" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} />
              <Area type="monotone" dataKey="Loan Balance" fill="#82ca9d" stroke="#82ca9d" fillOpacity={0.3} />
              <Line type="monotone" dataKey="Total Equity" stroke="#ff7300" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
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
                {years.map((year, index) => (
                  <td key={year} className="text-right py-3 px-6">
                    <div className="flex items-center justify-end gap-2">
                      R{Math.round(allMetrics[index][0]).toLocaleString()}
                      <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Annual Appreciation */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Annual Appreciation"
                    tooltip="The amount of value added to the property each year based on the appreciation rate."
                  />
                </td>
                {years.map((year, index) => (
                  <td key={year} className="text-right py-3 px-6">
                    <div className="flex items-center justify-end gap-2">
                      R{Math.round(allMetrics[index][1]).toLocaleString()}
                      <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Loan Balance */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Loan Balance"
                    tooltip="The remaining loan balance at the end of each year based on the amortization schedule."
                  />
                </td>
                {years.map((year, index) => (
                  <td key={year} className="text-right py-3 px-6">
                    <div className="flex items-center justify-end gap-2">
                      R{Math.round(allMetrics[index][2]).toLocaleString()}
                      <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Total Interest Paid */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Total Interest Paid"
                    tooltip="The cumulative amount of interest paid on the loan up to this point."
                  />
                </td>
                {years.map((year, index) => (
                  <td key={year} className="text-right py-3 px-6">
                    <div className="flex items-center justify-end gap-2">
                      R{Math.round(Math.max(0, allMetrics[index][3])).toLocaleString()}
                      <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Interest-to-Principal Ratio */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Interest-to-Principal Ratio"
                    tooltip="The percentage of your monthly payment that goes towards interest vs principal. A decreasing ratio indicates more of your payment going to principal over time."
                  />
                </td>
                {years.map((year, index) => (
                  <td key={year} className="text-right py-3 px-6">
                    <div className="flex items-center justify-end gap-2">
                      {allMetrics[index][4].toFixed(1)}%
                      <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Total Equity */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Total Equity"
                    tooltip="The total equity in the property, including initial deposit, loan repayment, and appreciation."
                  />
                </td>
                {years.map((year, index) => (
                  <td key={year} className="text-right py-3 px-6">
                    <div className="flex items-center justify-end gap-2">
                      R{Math.round(Math.max(0, allMetrics[index][5])).toLocaleString()}
                      <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Equity Build-up (from loan repayment) */}
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-6">
                  <MetricLabel 
                    label="Loan Repayment Equity"
                    tooltip="The amount of equity built through loan repayment alone (excluding appreciation)."
                  />
                </td>
                {years.map((year, index) => (
                  <td key={year} className="text-right py-3 px-6">
                    <div className="flex items-center justify-end gap-2">
                      R{Math.round(Math.max(0, allMetrics[index][6])).toLocaleString()}
                      <span className="h-2 w-2 rounded-full bg-red-500" title="Analyzer engine metric"/>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}