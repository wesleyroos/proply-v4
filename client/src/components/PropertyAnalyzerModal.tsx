import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { formatter } from "../utils/formatting";

interface PropertyAnalyzerModalProps {
  property: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyAnalyzerModal({ property, open, onOpenChange }: PropertyAnalyzerModalProps) {
  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto">
        <div className="space-y-6 py-6">
          {/* Header Info with Improved Styling */}
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold mb-2">{property.address}</h2>
            <p className="text-muted-foreground text-sm mb-2">{property.propertyDescription}</p>
            {property.propertyUrl && (
              <a 
                href={property.propertyUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:underline text-sm"
              >
                View Property Listing →
              </a>
            )}
          </div>

          {/* Key Financial Metrics - Enhanced Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-background/50">
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Purchase Price</h3>
                <div className="text-2xl font-bold">{formatter.format(property.purchasePrice)}</div>
                <div className="mt-2 pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Rate per m²</p>
                  <p className="font-medium">{formatter.format(property.ratePerSquareMeter)}/m²</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50">
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Monthly Bond Payment</h3>
                <div className="text-2xl font-bold">
                  {formatter.format(property.monthlyBondRepayment || 0)}
                </div>
                <div className="mt-2 pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Interest Rate</p>
                  <p className="font-medium">{property.interestRate}% p.a.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50">
              <CardContent className="pt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Net Operating Income</h3>
                <div className="text-2xl font-bold">
                  {formatter.format(property.netOperatingIncome?.year1?.value || 0)}
                </div>
                <div className="mt-2 pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Year 1 Projection</p>
                  <p className="font-medium">Based on current market conditions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Details - Enhanced Card */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Property Specifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Floor Area</p>
                  <p className="text-lg font-semibold">{property.floorArea} m²</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                  <p className="text-lg font-semibold">{property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                  <p className="text-lg font-semibold">{property.bathrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parking Spaces</p>
                  <p className="text-lg font-semibold">{property.parkingSpaces || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details - Enhanced Layout */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Financial Structure</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Deposit Amount</p>
                  <p className="text-lg font-semibold">{formatter.format(property.depositAmount)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{property.depositPercentage}% of purchase price</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interest Rate</p>
                  <p className="text-lg font-semibold">{property.interestRate}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Annual percentage rate</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loan Term</p>
                  <p className="text-lg font-semibold">{property.loanTerm} years</p>
                  <p className="text-sm text-muted-foreground mt-1">Bond repayment period</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Analysis - Enhanced with Visual Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Short-Term Rental Analysis */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Short-Term Rental Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nightly Rate</p>
                    <p className="text-lg font-semibold">
                      {formatter.format(property.shortTermNightlyRate || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Occupancy</p>
                    <p className="text-lg font-semibold">{property.annualOccupancy || 0}%</p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Projected Annual Revenue</p>
                    <p className="text-lg font-semibold">
                      {formatter.format(property.shortTermAnnualRevenue || 0)}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Gross Yield</p>
                    <p className="text-lg font-semibold">{property.shortTermGrossYield || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Long-Term Rental Analysis */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Long-Term Rental Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Revenue</p>
                    <p className="text-lg font-semibold">
                      {formatter.format(property.longTermAnnualRevenue || 0)}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Gross Yield</p>
                    <p className="text-lg font-semibold">{property.longTermGrossYield || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operating Expenses - Enhanced Layout */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Monthly Operating Expenses</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Levies</p>
                  <p className="text-lg font-semibold">{formatter.format(property.monthlyLevies || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rates & Taxes</p>
                  <p className="text-lg font-semibold">{formatter.format(property.monthlyRatesTaxes || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Other Expenses</p>
                  <p className="text-lg font-semibold">{formatter.format(property.otherMonthlyExpenses || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Maintenance</p>
                  <p className="text-lg font-semibold">{property.maintenancePercent || 0}%</p>
                  <p className="text-sm text-muted-foreground mt-1">of property value per annum</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Management Fee</p>
                  <p className="text-lg font-semibold">{property.managementFee || 0}%</p>
                  <p className="text-sm text-muted-foreground mt-1">of rental income</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Performance Metrics */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Investment Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Key Performance Indicators</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Cap Rate</p>
                      <p className="text-lg font-semibold">
                        {(property.investmentMetrics?.shortTerm?.[0]?.capRate || 0).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cash on Cash Return</p>
                      <p className="text-lg font-semibold">
                        {(property.investmentMetrics?.shortTerm?.[0]?.cashOnCashReturn || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Revenue Projections</h4>
                  <div className="space-y-4">
                    {Object.entries(property.revenueProjections || {}).map(([year, data]: [string, any]) => (
                      <div key={year}>
                        <p className="text-sm text-muted-foreground">Year {year}</p>
                        <p className="text-lg font-semibold">{formatter.format(data.value || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}