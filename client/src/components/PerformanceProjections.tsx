import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { formatter } from "@/utils/rentalPerformance";

interface PerformanceProjectionsProps {
  purchasePrice: number;
  deposit: number;
  interestRate: number;
  loanTerm: number;
  monthlyBondRepayment: number;
  shortTermNightly: number;
  longTermMonthly: number;
  revenueProjections: {
    shortTerm: {
      year1: number;
      year2: number;
      year3: number;
      year4: number;
      year5: number;
      year10: number;
      year20: number;
    } | null;
  };
  operatingExpenses: {
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
    year10: number;
    year20: number;
  };
  netOperatingIncome: {
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
    year10: number;
    year20: number;
  } | null;
  annualOccupancy: number;
  monthlyRatesTaxes: number;
  annualAppreciation: number;  // Added property appreciation rate from form
}

export default function PerformanceProjections({
  purchasePrice,
  deposit,
  interestRate,
  loanTerm,
  monthlyBondRepayment,
  shortTermNightly,
  longTermMonthly,
  revenueProjections,
  operatingExpenses,
  netOperatingIncome,
  annualOccupancy,
  monthlyRatesTaxes,
  annualAppreciation,
}: PerformanceProjectionsProps) {
  const years = [1, 2, 3, 4, 5, 10, 20];
  const loanAmount = purchasePrice - deposit;
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanTerm * 12;
  // Use the annualAppreciation passed from the form

  // Calculate loan balance, property value, and equity for each year using the same logic as AssetGrowthMetrics
  const propertyValueData = years.map(year => {
    const yearKey = `year${year}` as keyof typeof netOperatingIncome;
    
    // Calculate remaining loan balance using the same formula as AssetGrowthMetrics
    const monthsPaid = year * 12;
    const remainingPayments = totalPayments - monthsPaid;
    const loanBalance = remainingPayments > 0 
      ? (loanAmount * (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, monthsPaid))) 
        / (Math.pow(1 + monthlyRate, totalPayments) - 1)
      : 0;

    // Calculate property value
    const propertyValue = purchasePrice * Math.pow(1 + (annualAppreciation / 100), year);

    // Calculate total equity exactly as shown in the table
    const totalEquity = propertyValue - loanBalance;

    return {
      year: `Year ${year}`,
      'Property Value': propertyValue,
      'Loan Balance': loanBalance,
      'Total Equity': totalEquity,
    };
  });

  // Calculate annual and cumulative cashflow data
  const annualBondPayments = monthlyBondRepayment * 12;
  
  const cashflowData = years.map(year => {
    const yearKey = `year${year}` as keyof typeof netOperatingIncome;
    const annualCashflow = netOperatingIncome ? 
      (netOperatingIncome[yearKey] - annualBondPayments) : 0;

    // Calculate cumulative cashflow directly from netOperatingIncome
    const cumulativeCashflow = years
      .filter(y => y <= year)
      .reduce((acc, y) => {
        const prevYearKey = `year${y}` as keyof typeof netOperatingIncome;
        return acc + (netOperatingIncome?.[prevYearKey] ? 
          (netOperatingIncome[prevYearKey] - annualBondPayments) : 0);
      }, 0);

    return {
      year: `Year ${year}`,
      'Annual Cashflow': annualCashflow,
      'Cumulative Cashflow': cumulativeCashflow,
    };
  });

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Performance Projections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Property Value vs Loan Balance Area Chart */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Property Value, Loan Balance & Equity</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={propertyValueData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => formatter(value)} />
                  <Tooltip formatter={(value) => formatter(value)} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="Property Value" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Loan Balance" 
                    stackId="2"
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Total Equity" 
                    stackId="3"
                    stroke="#ffc658" 
                    fill="#ffc658" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Annual and Cumulative Cashflow Line Chart */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Annual & Cumulative Cashflow</h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={cashflowData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => formatter(value)} />
                  <Tooltip formatter={(value) => formatter(value)} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Annual Cashflow" 
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Cumulative Cashflow" 
                    stroke="#82ca9d"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
