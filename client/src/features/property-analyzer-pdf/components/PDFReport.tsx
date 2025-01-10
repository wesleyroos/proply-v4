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

        {/* Property Overview */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Property Overview</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="mt-1 text-lg">{data.propertyDetails.address}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Property URL</h3>
              <p className="mt-1 text-lg">{data.propertyDetails.propertyUrl}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Purchase Price</h3>
              <p className="mt-1 text-lg">{formatCurrency(data.propertyDetails.purchasePrice)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Property Rate per m²</h3>
              <p className="mt-1 text-lg">{formatCurrency(data.propertyDetails.currentPropertyRatePerSqm)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Area Rate per m²</h3>
              <p className="mt-1 text-lg">{formatCurrency(data.propertyDetails.areaRatePerSqm)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Rate Difference</h3>
              <p className="mt-1 text-lg">{formatCurrency(data.propertyDetails.rateDifference)}</p>
            </div>
          </div>
        </Card>

        {/* Financial Overview */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Financial Overview</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Deposit Amount</h3>
              <p className="mt-1 text-lg">{formatCurrency(data.financialMetrics.depositAmount)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Deposit Percentage</h3>
              <p className="mt-1 text-lg">{data.financialMetrics.depositPercentage}%</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Interest Rate</h3>
              <p className="mt-1 text-lg">{data.financialMetrics.interestRate}%</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Monthly Bond Payment</h3>
              <p className="mt-1 text-lg">{formatCurrency(data.financialMetrics.monthlyBondRepayment)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Capital Required</h3>
              <p className="mt-1 text-lg">{formatCurrency(data.financialMetrics.totalCapitalRequired)}</p>
            </div>
          </div>
        </Card>

        {/* Rental Performance */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Rental Performance</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Short-Term</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Nightly Rate</h4>
                  <p className="mt-1">{formatCurrency(data.performance.shortTermNightlyRate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Annual Revenue</h4>
                  <p className="mt-1">{formatCurrency(data.performance.shortTermAnnualRevenue)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Gross Yield</h4>
                  <p className="mt-1">{formatPercentage(data.performance.shortTermGrossYield)}%</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Long-Term</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Monthly Rate</h4>
                  <p className="mt-1">{formatCurrency(data.performance.longTermMonthlyRate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Annual Revenue</h4>
                  <p className="mt-1">{formatCurrency(data.performance.longTermAnnualRevenue)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Gross Yield</h4>
                  <p className="mt-1">{formatPercentage(data.performance.longTermGrossYield)}%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Investment Metrics */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Investment Metrics</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Short-Term</h3>
              <div className="space-y-4">
                {data.investmentMetrics.shortTerm.map((metric, index) => (
                  <div key={index}>
                    <h4 className="text-sm font-medium text-gray-500">Year {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-500">Net Yield</p>
                        <p>{formatPercentage(metric.netYield)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ROE</p>
                        <p>{formatPercentage(metric.returnOnEquity)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Cap Rate</p>
                        <p>{formatPercentage(metric.capRate)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">IRR</p>
                        <p>{formatPercentage(metric.irr)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Long-Term</h3>
              <div className="space-y-4">
                {data.investmentMetrics.longTerm.map((metric, index) => (
                  <div key={index}>
                    <h4 className="text-sm font-medium text-gray-500">Year {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-sm text-gray-500">Net Yield</p>
                        <p>{formatPercentage(metric.netYield)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ROE</p>
                        <p>{formatPercentage(metric.returnOnEquity)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Cap Rate</p>
                        <p>{formatPercentage(metric.capRate)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">IRR</p>
                        <p>{formatPercentage(metric.irr)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Revenue Projections */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Revenue Projections</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Short-Term</h3>
              <div className="space-y-4">
                {Object.entries(data.revenueProjections.shortTerm).map(([year, value]) => (
                  <div key={year}>
                    <h4 className="text-sm font-medium text-gray-500">Year {year.replace('year', '')}</h4>
                    <p className="mt-1">{formatCurrency(value)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Long-Term</h3>
              <div className="space-y-4">
                {Object.entries(data.revenueProjections.longTerm).map(([year, value]) => (
                  <div key={year}>
                    <h4 className="text-sm font-medium text-gray-500">Year {year.replace('year', '')}</h4>
                    <p className="mt-1">{formatCurrency(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}