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
          <div>
            <h2 className="text-2xl font-bold">{property.address}</h2>
            <p className="text-muted-foreground">{property.propertyDescription}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Purchase Price</h3>
                <div className="text-2xl font-bold">{formatter.format(property.purchasePrice)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Monthly Bond Payment</h3>
                <div className="text-2xl font-bold">
                  {formatter.format(property.monthlyBondRepayment || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Rate per m²</h3>
                <div className="text-2xl font-bold">
                  {formatter.format(property.ratePerSquareMeter || 0)}
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
                    <div>
                      <p className="text-sm text-muted-foreground">Year 1 NOI</p>
                      <p className="font-medium">
                        {formatter.format(property.netOperatingIncome?.year1?.value || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Operating Expenses</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Levies</p>
                      <p className="font-medium">{formatter.format(property.monthlyLevies || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rates & Taxes</p>
                      <p className="font-medium">{formatter.format(property.monthlyRatesTaxes || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Other Monthly Expenses</p>
                      <p className="font-medium">{formatter.format(property.otherMonthlyExpenses || 0)}</p>
                    </div>
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
