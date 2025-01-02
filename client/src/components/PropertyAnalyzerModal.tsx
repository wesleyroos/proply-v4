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
          {/* Header Info */}
          <div>
            <h2 className="text-2xl font-bold">{property.address}</h2>
            <p className="text-muted-foreground">{property.propertyDescription}</p>
            {property.propertyUrl && (
              <a href={property.propertyUrl} target="_blank" rel="noopener noreferrer" 
                className="text-primary hover:underline">
                View Property Listing
              </a>
            )}
          </div>

          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Purchase Price</h3>
                <div className="text-2xl font-bold">{formatter.format(property.purchasePrice)}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Rate per m²: {formatter.format(property.ratePerSquareMeter)}/m²
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Monthly Bond Payment</h3>
                <div className="text-2xl font-bold">
                  {formatter.format(property.monthlyBondRepayment || 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Interest Rate: {property.interestRate}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Net Operating Income (Year 1)</h3>
                <div className="text-2xl font-bold">
                  {formatter.format(property.netOperatingIncome?.year1?.value || 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Details */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Property Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Floor Area</p>
                  <p className="font-medium">{property.floorArea} m²</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bedrooms</p>
                  <p className="font-medium">{property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bathrooms</p>
                  <p className="font-medium">{property.bathrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parking</p>
                  <p className="font-medium">{property.parkingSpaces || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Financial Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Deposit Amount</p>
                  <p className="font-medium">{formatter.format(property.depositAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deposit Percentage</p>
                  <p className="font-medium">{property.depositPercentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interest Rate</p>
                  <p className="font-medium">{property.interestRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Loan Term</p>
                  <p className="font-medium">{property.loanTerm} years</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Analysis */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Revenue Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Short-Term Rental</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Nightly Rate</p>
                      <p className="font-medium">
                        {formatter.format(property.shortTermNightlyRate || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Occupancy</p>
                      <p className="font-medium">{property.annualOccupancy || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Revenue</p>
                      <p className="font-medium">
                        {formatter.format(property.shortTermAnnualRevenue || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Yield</p>
                      <p className="font-medium">{property.shortTermGrossYield || 0}%</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Long-Term Rental</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Revenue</p>
                      <p className="font-medium">
                        {formatter.format(property.longTermAnnualRevenue || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Yield</p>
                      <p className="font-medium">{property.longTermGrossYield || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operating Expenses */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Operating Expenses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Levies</p>
                  <p className="font-medium">{formatter.format(property.monthlyLevies || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rates & Taxes</p>
                  <p className="font-medium">{formatter.format(property.monthlyRatesTaxes || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Other Expenses</p>
                  <p className="font-medium">{formatter.format(property.otherMonthlyExpenses || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Maintenance (%)</p>
                  <p className="font-medium">{property.maintenancePercent || 0}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Management Fee</p>
                  <p className="font-medium">{property.managementFee || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Metrics */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Investment Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Short-Term Rental</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Cap Rate</p>
                      <p className="font-medium">
                        {(property.investmentMetrics?.shortTerm?.[0]?.capRate || 0).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cash on Cash Return</p>
                      <p className="font-medium">
                        {(property.investmentMetrics?.shortTerm?.[0]?.cashOnCashReturn || 0).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Revenue Projections</h4>
                  <div className="space-y-2">
                    {Object.entries(property.revenueProjections || {}).map(([year, data]: [string, any]) => (
                      <div key={year}>
                        <p className="text-sm text-muted-foreground">Year {year}</p>
                        <p className="font-medium">{formatter.format(data.value || 0)}</p>
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