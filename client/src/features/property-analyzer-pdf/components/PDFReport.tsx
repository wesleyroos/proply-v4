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
        {/* Header Section */}
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
          <Card className="p-6 mb-8 border rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selections.propertyDetails.address && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="mt-1 text-lg text-gray-900">{data.propertyDetails.address}</p>
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
                    <p className="mt-1 text-lg text-gray-900">{data.propertyDetails.bedrooms}</p>
                  </div>
                )}

                {selections.propertyDetails.bathrooms && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Bathrooms</h3>
                    <p className="mt-1 text-lg text-gray-900">{data.propertyDetails.bathrooms}</p>
                  </div>
                )}

                {selections.propertyDetails.floorArea && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Floor Area</h3>
                    <p className="mt-1 text-lg text-gray-900">{data.propertyDetails.floorArea} m²</p>
                  </div>
                )}

                {selections.propertyDetails.parkingSpaces && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Parking Spaces</h3>
                    <p className="mt-1 text-lg text-gray-900">{data.propertyDetails.parkingSpaces}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Financial Details */}
        {selections.financialMetrics && (
          <Card className="p-6 mb-8 border rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Financial Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {selections.financialMetrics.purchasePrice && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Purchase Price</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatCurrency(data.propertyDetails.purchasePrice)}</p>
                </div>
              )}

              {selections.financialMetrics.depositAmount && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Deposit</h3>
                  <p className="mt-1 text-lg text-gray-900">
                    {formatCurrency(data.financialMetrics.depositAmount)} ({data.financialMetrics.depositPercentage}%)
                  </p>
                </div>
              )}

              {selections.financialMetrics.monthlyBondRepayment && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monthly Bond Payment</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatCurrency(data.financialMetrics.monthlyBondRepayment)}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Operating Expenses */}
        {selections.operatingExpenses && (
          <Card className="p-6 mb-8 border rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Operating Expenses</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {selections.operatingExpenses.monthlyLevies && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Monthly Levies</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatCurrency(data.operatingExpenses.monthlyLevies)}</p>
                </div>
              )}

              {selections.operatingExpenses.monthlyRatesTaxes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Rates & Taxes</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatCurrency(data.operatingExpenses.monthlyRatesTaxes)}</p>
                </div>
              )}

              {selections.operatingExpenses.maintenancePercent && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Maintenance</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatPercentage(data.operatingExpenses.maintenancePercent)}% of rental income</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Rental Performance */}
        {selections.rentalPerformance?.shortTerm && (
          <Card className="p-6 mb-8 border rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Short-Term Rental Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Nightly Rate</h3>
                <p className="mt-1 text-lg text-gray-900">{formatCurrency(data.performance.shortTermNightlyRate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Annual Occupancy</h3>
                <p className="mt-1 text-lg text-gray-900">{formatPercentage(data.performance.annualOccupancy)}%</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Annual Revenue</h3>
                <p className="mt-1 text-lg text-gray-900">{formatCurrency(data.performance.shortTermAnnualRevenue)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Investment Metrics */}
        {selections.investmentMetrics && (
          <Card className="p-6 mb-8 border rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Investment Performance</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {selections.investmentMetrics.grossYield && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Gross Yield</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatPercentage(data.investmentMetrics.shortTerm[0].grossYield)}%</p>
                </div>
              )}

              {selections.investmentMetrics.netYield && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Net Yield</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatPercentage(data.investmentMetrics.shortTerm[0].netYield)}%</p>
                </div>
              )}

              {selections.investmentMetrics.capRate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cap Rate</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatPercentage(data.investmentMetrics.shortTerm[0].capRate)}%</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Cashflow Analysis */}
        {selections.cashflowAnalysis && (
          <Card className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Cashflow Projections</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {selections.cashflowAnalysis.year1 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Year 1</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatCurrency(data.netOperatingIncome.year1.annualCashflow)}</p>
                </div>
              )}

              {selections.cashflowAnalysis.year5 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Year 5</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatCurrency(data.netOperatingIncome.year5.annualCashflow)}</p>
                </div>
              )}

              {selections.cashflowAnalysis.year10 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Year 10</h3>
                  <p className="mt-1 text-lg text-gray-900">{formatCurrency(data.netOperatingIncome.year10.annualCashflow)}</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}