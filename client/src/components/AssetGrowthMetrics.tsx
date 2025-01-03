import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
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
}

export default function AssetGrowthMetrics({
  purchasePrice,
  deposit,
  loanAmount,
  interestRate,
  loanTerm,
  annualAppreciation,
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

    const remainingPayments = totalPayments - monthsPaid;
    if (remainingPayments <= 0) return 0;

    try {
      return (loanAmount * (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, monthsPaid))) 
        / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    } catch (error) {
      return 0;
    }
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
                  const propertyValue = purchasePrice * Math.pow(1 + (annualAppreciation / 100), year);
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(propertyValue).toLocaleString()}
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
                  const startValue = purchasePrice * Math.pow(1 + (annualAppreciation / 100), year - 1);
                  const endValue = purchasePrice * Math.pow(1 + (annualAppreciation / 100), year);
                  const appreciationAmount = endValue - startValue;
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(appreciationAmount).toLocaleString()}
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
                  const monthsPaid = year * 12;
                  const loanBalance = calculateLoanBalance(monthsPaid);
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(loanBalance).toLocaleString()}
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
                  const monthsPaid = year * 12;
                  const monthlyPayment = calculateMonthlyPayment();
                  const totalPaid = monthsPaid * monthlyPayment;
                  const principalPaid = loanAmount - calculateLoanBalance(monthsPaid);
                  const interestPaid = totalPaid - principalPaid;
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(Math.max(0, interestPaid)).toLocaleString()}
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
                  const monthsPaid = year * 12;
                  const monthlyPayment = calculateMonthlyPayment();
                  const loanBalance = calculateLoanBalance(monthsPaid);
                  const interestPayment = loanBalance * monthlyRate;
                  const principalPayment = monthlyPayment - interestPayment;
                  const ratio = principalPayment > 0 ? (interestPayment / principalPayment) * 100 : 0;
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {ratio.toFixed(1)}%
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
                  const propertyValue = purchasePrice * Math.pow(1 + (annualAppreciation / 100), year);
                  const loanBalance = calculateLoanBalance(year * 12);
                  const totalEquity = propertyValue - loanBalance;
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(Math.max(0, totalEquity)).toLocaleString()}
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
                  const monthsPaid = year * 12;
                  const loanBalance = calculateLoanBalance(monthsPaid);
                  const equityFromRepayment = loanAmount - loanBalance;
                  return (
                    <td key={year} className="text-right py-3 px-6">
                      <div className="flex items-center justify-end gap-2">
                        R{Math.round(Math.max(0, equityFromRepayment)).toLocaleString()}
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