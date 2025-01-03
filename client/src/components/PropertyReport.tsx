import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ComposedChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    propertyDetails: {
      address: string;
      description: string;
      bedrooms: number | string;
      bathrooms: number | string;
      floorArea: number;
      parkingSpaces: number;
      purchasePrice: number;
      ratePerSquareMeter: number;
      propertyPhoto?: string | null;
    };
    financialMetrics: {
      depositAmount: number;
      depositPercentage: number;
      interestRate: number;
      loanTerm: number;
      monthlyBondRepayment: number;
      bondRegistration: number;
      transferCosts: number;
      annualAppreciation?: number;
      loanAmount?: number;
    };
    performance: {
      shortTermNightlyRate: number;
      annualOccupancy: number;
      shortTermAnnualRevenue: number;
      longTermAnnualRevenue: number;
      shortTermGrossYield: number;
      longTermGrossYield: number;
    };
    investmentMetrics?: Record<string, {
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
    }>;
    netOperatingIncome?: Record<string, {
      value: number;
      annualCashflow: number;
      cumulativeRentalIncome: number;
      netWorthChange: number;
    }>;
  };
  companyLogo?: string;
}

// Format currency values
const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `R${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `R${(value / 1000).toFixed(0)}k`;
  }
  return `R${value.toFixed(0)}`;
};

export function PropertyReport({ open, onOpenChange, data, companyLogo }: Props) {
  // Process cashflow data for chart
  const cashflowData = [1, 2, 3, 4, 5, 10, 20].map(year => ({
    year: `Year ${year}`,
    Annual: data?.netOperatingIncome?.[`year${year}`]?.annualCashflow || 0,
    Cumulative: data?.netOperatingIncome?.[`year${year}`]?.cumulativeRentalIncome || 0
  }));

  // Process asset data for chart
  const calculateLoanBalance = (initialLoan: number, rate: number, years: number) => {
    const monthlyRate = rate / 12 / 100;
    const months = years * 12;
    const monthlyPayment = (initialLoan * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    let balance = initialLoan;
    for (let i = 0; i < years * 12; i++) {
      const interest = balance * monthlyRate;
      const principal = monthlyPayment - interest;
      balance = balance - principal;
    }
    return Math.max(0, balance);
  };

  const assetData = [1, 2, 3, 4, 5, 10, 20].map(year => {
    const appreciation = Math.pow(1 + (data?.financialMetrics?.annualAppreciation || 5) / 100, year);
    const propertyValue = data?.propertyDetails?.purchasePrice * appreciation;
    const loanBalance = calculateLoanBalance(
      data?.financialMetrics?.loanAmount || 0,
      data?.financialMetrics?.interestRate || 0,
      year
    );

    return {
      year: `Year ${year}`,
      Value: propertyValue,
      Loan: loanBalance,
      Equity: propertyValue - loanBalance
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="bg-white p-8">
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Property Analysis Report</h1>
              <p className="text-gray-600">{data?.propertyDetails?.address}</p>
              <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            {companyLogo && (
              <div className="px-4 py-2">
                <img src={companyLogo} alt="Company Logo" className="h-12 object-contain" />
              </div>
            )}
          </div>

          {/* Key Metrics Summary */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Purchase Price</p>
              <p className="text-2xl font-bold">
                {formatCurrency(data?.propertyDetails?.purchasePrice)}
              </p>
              <p className="text-gray-500 text-sm">
                {formatCurrency(data?.propertyDetails?.ratePerSquareMeter)}/m²
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Required Capital</p>
              <p className="text-2xl font-bold">
                {formatCurrency(data?.financialMetrics?.depositAmount)}
              </p>
              <p className="text-gray-500 text-sm">{data?.financialMetrics?.depositPercentage}% deposit</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Monthly Bond</p>
              <p className="text-2xl font-bold">
                {formatCurrency(data?.financialMetrics?.monthlyBondRepayment)}
              </p>
              <p className="text-gray-500 text-sm">{data?.financialMetrics?.interestRate}% interest</p>
            </div>
          </div>

          {/* Revenue Performance */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Short-Term Rental</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">Annual Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data?.performance?.shortTermAnnualRevenue)}
                  </p>
                  <p className="text-green-600">{data?.performance?.shortTermGrossYield.toFixed(2)}% Yield</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Nightly Rate</p>
                    <p className="font-semibold">
                      {formatCurrency(data?.performance?.shortTermNightlyRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Occupancy</p>
                    <p className="font-semibold">{data?.performance?.annualOccupancy}%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Long-Term Rental</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600">Annual Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(data?.performance?.longTermAnnualRevenue)}
                  </p>
                  <p className="text-green-600">{data?.performance?.longTermGrossYield.toFixed(2)}% Yield</p>
                </div>
                <div>
                  <p className="text-gray-600">Monthly Rental</p>
                  <p className="font-semibold">
                    {formatCurrency(data?.performance?.longTermAnnualRevenue / 12)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cashflow Chart */}
          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cashflow Projections</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="Annual" name="Annual Cashflow" fill="#8884d8" />
                  <Line type="monotone" dataKey="Cumulative" name="Cumulative Cashflow" stroke="#82ca9d" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Asset Growth Chart */}
          <div className="bg-white p-6 rounded-lg shadow mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Asset Growth & Equity</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={assetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="Value" name="Property Value" stroke="#8884d8" />
                  <Line type="monotone" dataKey="Loan" name="Loan Balance" stroke="#ff8042" />
                  <Line type="monotone" dataKey="Equity" name="Total Equity" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 20-Year Summary */}
          <div className="grid grid-cols-4 gap-6 mt-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <p className="text-gray-600">Total Return</p>
              <p className="text-2xl font-bold">
                {formatCurrency(data?.netOperatingIncome?.year20?.netWorthChange || 0)}
              </p>
              <p className="text-green-600">
                {(((data?.netOperatingIncome?.year20?.netWorthChange || 0) /
                  (data?.propertyDetails?.purchasePrice * 0.2)) * 100).toFixed(0)}% ROI
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-600">Final Value</p>
              <p className="text-2xl font-bold">{formatCurrency(assetData[6].Value)}</p>
              <p className="text-blue-600">
                {((assetData[6].Value / data?.propertyDetails?.purchasePrice - 1) * 100).toFixed(0)}% Growth
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <p className="text-gray-600">IRR</p>
              <p className="text-2xl font-bold">
                {data?.investmentMetrics?.year20?.irr.toFixed(2) ?? 'N/A'}%
              </p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-lg">
              <p className="text-gray-600">Cash on Cash</p>
              <p className="text-2xl font-bold">
                {data?.investmentMetrics?.year20?.cashOnCashReturn.toFixed(2) ?? 'N/A'}%
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-12 pt-6 border-t text-sm text-gray-600">
            <h3 className="font-semibold text-gray-800 mb-2">DISCLAIMER</h3>
            <p className="mb-4">
              This report is generated based on provided data and market assumptions.
              While we strive for accuracy, all projections are estimates and actual
              results may vary. Property investment carries inherent risks and professional
              advice should be sought before making investment decisions.
            </p>
            <p className="text-center text-xs text-gray-500 mt-8">
              © {new Date().getFullYear()} Property Analysis Report
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}