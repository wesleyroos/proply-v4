import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
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
  annualOccupancy:number;
  monthlyRatesTaxes:number;
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
}: PerformanceProjectionsProps) {
  const years = [1, 2, 3, 4, 5, 10, 20];
  const loanAmount = purchasePrice - deposit;
  const monthlyRate = interestRate / 100 / 12;
  const totalPayments = loanTerm * 12;
  const annualAppreciation = 5; // 5% annual appreciation

  // Calculate loan balance, property value, and equity for each year
  const propertyValueData = years.map(year => {
    // Calculate remaining loan balance
    const monthsPaid = year * 12;
    const remainingBalance = (loanAmount * (Math.pow(1 + monthlyRate, totalPayments) 
      - Math.pow(1 + monthlyRate, monthsPaid))) 
      / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    // Calculate property value with appreciation
    const propertyValue = purchasePrice * Math.pow(1 + (annualAppreciation / 100), year);
    
    // Calculate equity (property value - remaining loan)
    const equity = propertyValue - remainingBalance;

    return {
      year: `Year ${year}`,
      'Property Value': propertyValue,
      'Loan Balance': remainingBalance,
      'Equity': equity,
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
        {/* Property Value vs Loan Balance Area Chart */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-700">Property Value, Loan Balance & Equity</h3>
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
                  dataKey="Equity" 
                  stackId="3"
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Comparison Chart */}
          <h3 className="text-lg font-semibold text-slate-700 mt-8">Revenue Comparison</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Short-Term', value: shortTermNightly * 365 * (annualOccupancy / 100) },
                { name: 'Long-Term', value: longTermMonthly * 12 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatter(value)} />
                <Tooltip formatter={(value) => formatter(value)} />
                <Bar dataKey="value" fill="#8884d8">
                  <LabelList dataKey="value" formatter={(value) => formatter(value)} position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Breakdown Pie Chart */}
          <h3 className="text-lg font-semibold text-slate-700 mt-8">Expense Breakdown</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Bond Payment', value: monthlyBondRepayment * 12 },
                    { name: 'Property Taxes', value: monthlyRatesTaxes * 12 },
                    { name: 'Maintenance', value: monthlyBondRepayment * 12 * 0.1 }, // Assuming 10% of bond payment
                    { name: 'Insurance', value: monthlyBondRepayment * 12 * 0.05 }, // Assuming 5% of bond payment
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { color: '#0088FE' },
                    { color: '#00C49F' },
                    { color: '#FFBB28' },
                    { color: '#FF8042' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatter(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Cash Flow Projection Line Chart */}
          <h3 className="text-lg font-semibold text-slate-700 mt-8">Cash Flow Projection</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={years.map(year => ({
                  year: `Year ${year}`,
                  cashFlow: (shortTermNightly * 365 * (annualOccupancy / 100) / 12 - monthlyBondRepayment) * 12,
                  accumulated: (shortTermNightly * 365 * (annualOccupancy / 100) / 12 - monthlyBondRepayment) * 12 * year
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => formatter(value)} />
                <Tooltip formatter={(value) => formatter(value)} />
                <Legend />
                <Line type="monotone" dataKey="cashFlow" name="Annual Cash Flow" stroke="#8884d8" />
                <Line type="monotone" dataKey="accumulated" name="Accumulated Cash Flow" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cumulative Equity Growth Line Chart */}
          <h3 className="text-lg font-semibold text-slate-700 mt-8">Cumulative Equity Growth</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={propertyValueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(value) => formatter(value)} />
                <Tooltip formatter={(value) => formatter(value)} />
                <Legend />
                <Line type="monotone" dataKey="Equity" name="Total Equity" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}