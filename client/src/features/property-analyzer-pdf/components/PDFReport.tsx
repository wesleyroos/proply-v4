
import React from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PropertyData, ReportSelections } from '../types/propertyReport';
import { formatCurrency, formatPercentage } from '../utils/formatting';

interface PDFReportProps {
  data: PropertyData;
  selections: ReportSelections;
  companyLogo?: string;
}

export function PDFReport({ data, selections, companyLogo }: PDFReportProps) {
  return (
    <ScrollArea className="h-full w-full">
      <div className="pdf-content bg-white p-8 a4-page">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Analysis Report</h1>
            <p className="text-gray-500 mt-2">{new Date().toLocaleDateString()}</p>
          </div>
          {companyLogo && (
            <img src={companyLogo} alt="Company Logo" className="h-16 object-contain" />
          )}
        </div>

        {/* Property Details */}
        {selections.propertyDetails && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Property Details</h2>
            <div className="grid grid-cols-2 gap-6">
              {selections.propertyDetails.address && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="mt-1 text-lg">{data.propertyDetails.address}</p>
                </div>
              )}
              
              {selections.propertyDetails.propertyDescription && (
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{data.propertyDetails.propertyDescription}</p>
                </div>
              )}

              {selections.propertyDetails.propertyPhoto && data.propertyDetails.propertyPhoto && (
                <div className="col-span-2">
                  <img 
                    src={data.propertyDetails.propertyPhoto} 
                    alt="Property" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 col-span-2">
                {selections.propertyDetails.bedrooms && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Bedrooms</h3>
                    <p className="mt-1 text-lg">{data.propertyDetails.bedrooms}</p>
                  </div>
                )}

                {selections.propertyDetails.bathrooms && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Bathrooms</h3>
                    <p className="mt-1 text-lg">{data.propertyDetails.bathrooms}</p>
                  </div>
                )}

                {selections.propertyDetails.floorArea && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Floor Area</h3>
                    <p className="mt-1 text-lg">{data.propertyDetails.floorArea} m²</p>
                  </div>
                )}

                {selections.propertyDetails.parkingSpaces && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Parking Spaces</h3>
                    <p className="mt-1 text-lg">{data.propertyDetails.parkingSpaces}</p>
                  </div>
                )}

                {selections.propertyDetails.propertyRatePerSquareMeter && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Property Rate per m²</h3>
                    <p className="mt-1 text-lg">{formatCurrency(data.propertyDetails.ratePerSquareMeter)}</p>
                  </div>
                )}

                {selections.propertyDetails.areaRatePerSquareMeter && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Area Rate per m²</h3>
                    <p className="mt-1 text-lg">{formatCurrency(data.propertyDetails.areaRate)}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Financial Metrics */}
        {selections.financialMetrics && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Financial Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {selections.financialMetrics.purchasePrice && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Purchase Price</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.propertyDetails.purchasePrice)}</p>
                </div>
              )}

              {selections.financialMetrics.depositAmount && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Deposit</h3>
                  <p className="mt-1 text-lg">
                    {formatCurrency(data.financialMetrics.depositAmount)} ({data.financialMetrics.depositPercentage}%)
                  </p>
                </div>
              )}

              {selections.financialMetrics.interestRate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Interest Rate</h3>
                  <p className="mt-1 text-lg">{data.financialMetrics.interestRate}%</p>
                </div>
              )}

              {selections.financialMetrics.loanTerm && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Loan Term</h3>
                  <p className="mt-1 text-lg">{data.financialMetrics.loanTerm} years</p>
                </div>
              )}

              {selections.financialMetrics.monthlyBondRepayment && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monthly Bond Payment</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.financialMetrics.monthlyBondRepayment)}</p>
                </div>
              )}

              {selections.financialMetrics.totalCapitalRequired && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Capital Required</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.financialMetrics.totalCapitalRequired)}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Operating Expenses */}
        {selections.operatingExpenses && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Operating Expenses</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {selections.operatingExpenses.monthlyLevies && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monthly Levies</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.operatingExpenses.monthlyLevies)}</p>
                </div>
              )}

              {selections.operatingExpenses.monthlyRatesTaxes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monthly Rates & Taxes</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.operatingExpenses.monthlyRatesTaxes)}</p>
                </div>
              )}

              {selections.operatingExpenses.otherMonthlyExpenses && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Other Monthly Expenses</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.operatingExpenses.otherMonthlyExpenses)}</p>
                </div>
              )}

              {selections.operatingExpenses.maintenancePercent && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Maintenance</h3>
                  <p className="mt-1 text-lg">{formatPercentage(data.operatingExpenses.maintenancePercent)}%</p>
                </div>
              )}

              {selections.operatingExpenses.managementFee && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Management Fee</h3>
                  <p className="mt-1 text-lg">{formatPercentage(data.operatingExpenses.managementFee)}%</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Rental Performance */}
        {selections.rentalPerformance && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Rental Performance</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {selections.rentalPerformance.shortTermNightlyRate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Short-Term Nightly Rate</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.performance.shortTermNightlyRate)}</p>
                </div>
              )}

              {selections.rentalPerformance.annualOccupancy && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Annual Occupancy</h3>
                  <p className="mt-1 text-lg">{formatPercentage(data.performance.annualOccupancy)}%</p>
                </div>
              )}

              {selections.rentalPerformance.shortTermAnnualRevenue && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Short-Term Annual Revenue</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.performance.shortTermAnnualRevenue)}</p>
                </div>
              )}

              {selections.rentalPerformance.longTermAnnualRevenue && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Long-Term Annual Revenue</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.performance.longTermAnnualRevenue)}</p>
                </div>
              )}

              {selections.rentalPerformance.platformFee && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Platform Fee</h3>
                  <p className="mt-1 text-lg">{formatPercentage(data.performance.platformFee)}%</p>
                </div>
              )}

              {selections.rentalPerformance.feeAdjustedRate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fee Adjusted Rate</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.performance.feeAdjustedRate)}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Investment Metrics */}
        {selections.investmentMetrics && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Investment Performance</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {selections.investmentMetrics.grossYield && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Gross Yield</h3>
                  <p className="mt-1 text-lg">{formatPercentage(data.investmentMetrics.shortTerm[0].grossYield)}%</p>
                </div>
              )}

              {selections.investmentMetrics.netYield && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Net Yield</h3>
                  <p className="mt-1 text-lg">{formatPercentage(data.investmentMetrics.shortTerm[0].netYield)}%</p>
                </div>
              )}

              {selections.investmentMetrics.returnOnEquity && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Return on Equity</h3>
                  <p className="mt-1 text-lg">{formatPercentage(data.investmentMetrics.shortTerm[0].returnOnEquity)}%</p>
                </div>
              )}

              {selections.investmentMetrics.capRate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cap Rate</h3>
                  <p className="mt-1 text-lg">{formatPercentage(data.investmentMetrics.shortTerm[0].capRate)}%</p>
                </div>
              )}

              {selections.investmentMetrics.cashOnCashReturn && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cash on Cash Return</h3>
                  <p className="mt-1 text-lg">{formatPercentage(data.investmentMetrics.shortTerm[0].cashOnCashReturn)}%</p>
                </div>
              )}

              {selections.investmentMetrics.irr && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">IRR</h3>
                  <p className="mt-1 text-lg">{formatPercentage(data.investmentMetrics.shortTerm[0].irr)}%</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Cashflow Analysis */}
        {selections.cashflowAnalysis && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Cashflow Projections</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {selections.cashflowAnalysis.year1 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Year 1</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.netOperatingIncome.year1.annualCashflow)}</p>
                </div>
              )}

              {selections.cashflowAnalysis.year5 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Year 5</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.netOperatingIncome.year5.annualCashflow)}</p>
                </div>
              )}

              {selections.cashflowAnalysis.year10 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Year 10</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.netOperatingIncome.year10.annualCashflow)}</p>
                </div>
              )}

              {selections.cashflowAnalysis.netWorthChange && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Net Worth Change</h3>
                  <p className="mt-1 text-lg">{formatCurrency(data.netOperatingIncome.year20.netWorthChange)}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
