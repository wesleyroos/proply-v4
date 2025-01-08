import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Building2, TrendingUp } from "lucide-react";
import PropertyMap from "@/components/PropertyMap";
import { PropertyData, ReportSelections } from '../types/propertyReport';
import { formatCurrency, formatPercentage } from '../utils/formatting';

interface PDFReportProps {
  data: PropertyData;
  selections: ReportSelections;
  companyLogo?: string;
}

export const PDFReport = forwardRef<HTMLDivElement, PDFReportProps>(({ 
  data,
  selections,
  companyLogo
}, ref) => {
  const isSelected = (section: string, item: string): boolean => {
    return selections[section]?.[item] ?? false;
  };

  const showCharts = isSelected('dataVisualizations', 'charts');
  const selectedMetricsType = data.investmentMetrics.shortTerm ? 'shortTerm' : 'longTerm';
  const metricsData = data.investmentMetrics[selectedMetricsType][0] || {};

  return (
    <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto">
      {/* Header with Branding */}
      <div className="flex justify-between items-center border-b pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Property Analysis Report</h1>
          <p className="text-gray-600">{data.propertyDetails.address}</p>
          <p className="text-sm text-gray-500">Generated on {format(new Date(), 'dd MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-8">
          {companyLogo && (
            <img src={companyLogo} alt="Company Logo" className="h-12 object-contain" />
          )}
          <div className="text-right">
            <p className="text-sm font-semibold">Powered by</p>
            <p className="text-lg font-bold text-primary">Proply</p>
          </div>
        </div>
      </div>

      {/* Property Details Section */}
      {isSelected('propertyDetails', 'map') && (
        <div className="mb-8">
          <PropertyMap 
            address={data.propertyDetails.address}
            mapClassName="w-full h-[300px] rounded-lg overflow-hidden"
          />
        </div>
      )}

      {/* Property Information */}
      {isSelected('propertyDetails', 'propertyPhoto') && data.propertyDetails.propertyPhoto && (
        <div className="mb-8">
          <img 
            src={data.propertyDetails.propertyPhoto} 
            alt="Property" 
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-8">
        {isSelected('propertyDetails', 'bedrooms') && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600">Bedrooms</h3>
            <p className="text-xl font-bold">{data.propertyDetails.bedrooms}</p>
          </div>
        )}
        {isSelected('propertyDetails', 'bathrooms') && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600">Bathrooms</h3>
            <p className="text-xl font-bold">{data.propertyDetails.bathrooms}</p>
          </div>
        )}
        {isSelected('propertyDetails', 'floorArea') && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600">Floor Area</h3>
            <p className="text-xl font-bold">{data.propertyDetails.floorArea} m²</p>
          </div>
        )}
        {isSelected('propertyDetails', 'parkingSpaces') && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600">Parking Spaces</h3>
            <p className="text-xl font-bold">{data.propertyDetails.parkingSpaces}</p>
          </div>
        )}
      </div>

      {/* Deal Structure */}
      {Object.values(selections.dealStructure || {}).some(Boolean) && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Deal Structure
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {isSelected('dealStructure', 'purchasePrice') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Purchase Price</h3>
                  <p className="text-xl font-bold">
                    {formatCurrency(data.propertyDetails.purchasePrice)}
                  </p>
                </div>
              )}
              {isSelected('dealStructure', 'depositAmount') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Deposit Amount</h3>
                  <p className="text-xl font-bold">
                    {formatCurrency(data.dealStructure.depositAmount)}
                  </p>
                </div>
              )}
              {isSelected('dealStructure', 'depositPercentage') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Deposit Percentage</h3>
                  <p className="text-xl font-bold">
                    {formatPercentage(data.dealStructure.depositPercentage)}
                  </p>
                </div>
              )}
              {isSelected('dealStructure', 'interestRate') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Interest Rate</h3>
                  <p className="text-xl font-bold">
                    {formatPercentage(data.dealStructure.interestRate)}
                  </p>
                </div>
              )}
              {isSelected('dealStructure', 'loanTerm') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Loan Term</h3>
                  <p className="text-xl font-bold">{data.dealStructure.loanTerm} years</p>
                </div>
              )}
              {isSelected('dealStructure', 'monthlyBondRepayment') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Monthly Bond Repayment</h3>
                  <p className="text-xl font-bold">
                    {formatCurrency(data.dealStructure.monthlyBondRepayment)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operating Expenses */}
      {Object.values(selections.operatingExpenses || {}).some(Boolean) && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Operating Expenses
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {isSelected('operatingExpenses', 'monthlyLevies') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Monthly Levies</h3>
                  <p className="text-xl font-bold">
                    {formatCurrency(data.operatingExpenses.monthlyLevies)}
                  </p>
                </div>
              )}
              {isSelected('operatingExpenses', 'monthlyRatesTaxes') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Monthly Rates & Taxes</h3>
                  <p className="text-xl font-bold">
                    {formatCurrency(data.operatingExpenses.monthlyRatesTaxes)}
                  </p>
                </div>
              )}
              {isSelected('operatingExpenses', 'maintenancePercentage') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Maintenance Percentage</h3>
                  <p className="text-xl font-bold">
                    {formatPercentage(data.operatingExpenses.maintenancePercentage)}
                  </p>
                </div>
              )}
              {isSelected('operatingExpenses', 'managementFee') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Management Fee</h3>
                  <p className="text-xl font-bold">
                    {formatPercentage(data.operatingExpenses.managementFee)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investment Metrics */}
      {Object.values(selections.investmentMetrics || {}).some(Boolean) && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Investment Metrics
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {isSelected('investmentMetrics', 'grossYield') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Gross Yield</h3>
                  <p className="text-xl font-bold">
                    {formatPercentage(metricsData.grossYield)}
                  </p>
                </div>
              )}
              {isSelected('investmentMetrics', 'netYield') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Net Yield</h3>
                  <p className="text-xl font-bold">
                    {formatPercentage(metricsData.netYield)}
                  </p>
                </div>
              )}
              {isSelected('investmentMetrics', 'returnOnEquity') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Return on Equity</h3>
                  <p className="text-xl font-bold">
                    {formatPercentage(metricsData.returnOnEquity)}
                  </p>
                </div>
              )}
              {isSelected('investmentMetrics', 'annualReturn') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Annual Return</h3>
                  <p className="text-xl font-bold">
                    {formatPercentage(metricsData.annualReturn)}
                  </p>
                </div>
              )}
              {isSelected('investmentMetrics', 'capRate') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Cap Rate</h3>
                  <p className="text-xl font-bold">
                    {formatPercentage(metricsData.capRate)}
                  </p>
                </div>
              )}
              {isSelected('investmentMetrics', 'cashOnCashReturn') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Cash on Cash Return</h3>
                  <p className="text-xl font-bold">
                    {formatPercentage(metricsData.cashOnCashReturn)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cashflow Analysis */}
      {Object.values(selections.cashflowAnalysis || {}).some(Boolean) && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cashflow Analysis
            </h2>
            {showCharts && (
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Object.entries(data.cashflow).map(([year, values]) => ({
                    year,
                    Annual: values.annualCashflow,
                    Cumulative: values.cumulativeRentalIncome
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="Annual" stroke="#8884d8" />
                    <Line type="monotone" dataKey="Cumulative" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
  );
});

PDFReport.displayName = 'PDFReport';