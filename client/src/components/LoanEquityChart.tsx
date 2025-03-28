import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface LoanEquityChartProps {
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  purchasePrice: number;
  annualAppreciation?: number;
}

interface DataPoint {
  year: number;
  loanBalance: number;
  equity: number;
}

const LoanEquityChart: React.FC<LoanEquityChartProps> = ({
  loanAmount,
  interestRate,
  loanTerm,
  purchasePrice,
  annualAppreciation = 5 // Default 5% annual appreciation
}) => {
  // Calculate monthly payment
  const monthlyInterestRate = interestRate / 100 / 12;
  const numberOfPayments = loanTerm * 12;
  const monthlyPayment = loanAmount * (
    monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)
  ) / (
    Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1
  );

  // Generate data for each year of the loan term
  const generateData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    
    let remainingBalance = loanAmount;
    let propertyValue = purchasePrice;
    
    // Add initial state (year 0)
    data.push({
      year: 0,
      loanBalance: remainingBalance,
      equity: propertyValue - remainingBalance
    });
    
    // Calculate loan balance and equity for each year
    for (let year = 1; year <= loanTerm; year++) {
      // Calculate loan balance after one year of payments
      for (let month = 0; month < 12; month++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance -= principalPayment;
      }
      
      // Calculate property value with appreciation
      propertyValue *= (1 + annualAppreciation / 100);
      
      // Add data point for this year
      data.push({
        year,
        loanBalance: Math.max(0, remainingBalance), // Ensure we don't go below zero
        equity: propertyValue - Math.max(0, remainingBalance)
      });
    }
    
    return data;
  };

  const data = generateData();

  const formatAmount = (value: number) => {
    return `R${(value / 1000).toFixed(0)}k`;
  };

  return (
    <div className="w-full h-80 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ 
              value: 'Years', 
              position: 'insideBottomRight', 
              offset: -10 
            }} 
          />
          <YAxis 
            tickFormatter={formatAmount} 
            label={{ 
              value: 'Amount (Rand)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' } 
            }} 
          />
          <Tooltip 
            formatter={(value: number) => [`R${value.toLocaleString()}`, undefined]} 
            labelFormatter={(label) => `Year ${label}`} 
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="loanBalance" 
            name="Loan Balance" 
            stroke="#ff0000" 
            activeDot={{ r: 8 }} 
          />
          <Line 
            type="monotone" 
            dataKey="equity" 
            name="Equity" 
            stroke="#4CAF50" 
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LoanEquityChart;