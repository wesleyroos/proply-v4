import React from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PropertyData, ReportSelections } from '../types/propertyReport';

interface PDFReportProps {
  data: PropertyData;
  selections: ReportSelections;
  companyLogo?: string;
}

export function PDFReport({ data, selections, companyLogo }: PDFReportProps) {
  return (
    <ScrollArea className="h-full w-full">
      <div className="pdf-content bg-white p-8 a4-page">
        {/* Header with logo */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Property Analysis Report</h1>
          {companyLogo && (
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className="h-12 object-contain"
            />
          )}
        </div>

        {/* Property Details Section */}
        {selections.propertyDetails && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Property Details</h2>
            <div className="space-y-4">
              {selections.propertyDetails.address && (
                <div>
                  <h3 className="font-medium">Address</h3>
                  <p>{data.propertyDetails.address}</p>
                </div>
              )}

              {selections.propertyDetails.propertyPhoto && data.propertyDetails.propertyPhoto && (
                <div>
                  <h3 className="font-medium mb-2">Property Photo</h3>
                  <img 
                    src={data.propertyDetails.propertyPhoto} 
                    alt="Property" 
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selections.propertyDetails.bedrooms && (
                  <div>
                    <h3 className="font-medium">Bedrooms</h3>
                    <p>{data.propertyDetails.bedrooms}</p>
                  </div>
                )}

                {selections.propertyDetails.bathrooms && (
                  <div>
                    <h3 className="font-medium">Bathrooms</h3>
                    <p>{data.propertyDetails.bathrooms}</p>
                  </div>
                )}

                {selections.propertyDetails.floorArea && (
                  <div>
                    <h3 className="font-medium">Floor Area</h3>
                    <p>{data.propertyDetails.floorArea} m²</p>
                  </div>
                )}

                {selections.propertyDetails.parkingSpaces && (
                  <div>
                    <h3 className="font-medium">Parking Spaces</h3>
                    <p>{data.propertyDetails.parkingSpaces}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Financial Metrics Section */}
        {selections.financialMetrics && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Financial Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {selections.financialMetrics.purchasePrice && (
                <div>
                  <h3 className="font-medium">Purchase Price</h3>
                  <p>R {data.financialMetrics.purchasePrice.toLocaleString()}</p>
                </div>
              )}

              {selections.financialMetrics.depositAmount && (
                <div>
                  <h3 className="font-medium">Deposit</h3>
                  <p>R {data.financialMetrics.depositAmount.toLocaleString()} ({data.financialMetrics.depositPercentage}%)</p>
                </div>
              )}

              {selections.financialMetrics.interestRate && (
                <div>
                  <h3 className="font-medium">Interest Rate</h3>
                  <p>{data.financialMetrics.interestRate}%</p>
                </div>
              )}

              {selections.financialMetrics.loanTerm && (
                <div>
                  <h3 className="font-medium">Loan Term</h3>
                  <p>{data.financialMetrics.loanTerm} years</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Operating Expenses Section */}
        {selections.operatingExpenses && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Operating Expenses</h2>
            <div className="grid grid-cols-2 gap-4">
              {selections.operatingExpenses.monthlyLevies && (
                <div>
                  <h3 className="font-medium">Monthly Levies</h3>
                  <p>R {data.operatingExpenses.monthlyLevies.toLocaleString()}</p>
                </div>
              )}

              {selections.operatingExpenses.monthlyRatesTaxes && (
                <div>
                  <h3 className="font-medium">Monthly Rates & Taxes</h3>
                  <p>R {data.operatingExpenses.monthlyRatesTaxes.toLocaleString()}</p>
                </div>
              )}

              {selections.operatingExpenses.maintenancePercent && (
                <div>
                  <h3 className="font-medium">Maintenance</h3>
                  <p>{data.operatingExpenses.maintenancePercent}% of rental income</p>
                </div>
              )}

              {selections.operatingExpenses.managementFee && (
                <div>
                  <h3 className="font-medium">Management Fee</h3>
                  <p>{data.operatingExpenses.managementFee}% of rental income</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Performance Metrics Section */}
        {selections.rentalPerformance && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <div className="space-y-6">
              {selections.rentalPerformance.shortTerm && (
                <div>
                  <h3 className="font-medium mb-2">Short Term Rental Analysis</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nightly Rate</p>
                      <p>R {data.performance.shortTermNightlyRate.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Occupancy</p>
                      <p>{data.performance.annualOccupancy}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Revenue</p>
                      <p>R {data.performance.shortTermAnnualRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Yield</p>
                      <p>{data.performance.shortTermGrossYield.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              )}

              {selections.rentalPerformance.longTerm && (
                <div>
                  <h3 className="font-medium mb-2">Long Term Rental Analysis</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Revenue</p>
                      <p>R {data.performance.longTermAnnualRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Yield</p>
                      <p>{data.performance.longTermGrossYield.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}