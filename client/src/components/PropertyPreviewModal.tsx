
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatter } from "@/utils/formatting";

interface Property {
  id: number;
  title: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  longTermMonthly: number;
  shortTermAnnual: number;
  shortTermAfterFees: number;
  breakEvenOccupancy: number;
  shortTermNightly: number;
  annualOccupancy: number;
  managementFee: number;
  createdAt: string;
}

interface PropertyPreviewModalProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyPreviewModal({ property, open, onOpenChange }: PropertyPreviewModalProps) {
  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{property.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Property Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Address:</span> {property.address}</p>
                <p><span className="text-muted-foreground">Bedrooms:</span> {property.bedrooms}</p>
                <p><span className="text-muted-foreground">Bathrooms:</span> {property.bathrooms}</p>
                <p><span className="text-muted-foreground">Added:</span> {new Date(property.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Short-Term Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Nightly Rate:</span> {formatter.format(property.shortTermNightly)}</p>
                <p><span className="text-muted-foreground">Annual Occupancy:</span> {property.annualOccupancy}%</p>
                <p><span className="text-muted-foreground">Management Fee:</span> {property.managementFee}%</p>
                <p><span className="text-muted-foreground">Break-even Occupancy:</span> {property.breakEvenOccupancy}%</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium">Financial Comparison</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="text-muted-foreground mb-2">Long-Term Rental</h4>
                <p><span className="text-muted-foreground">Monthly Revenue:</span> {formatter.format(property.longTermMonthly)}</p>
                <p><span className="text-muted-foreground">Annual Revenue:</span> {formatter.format(property.longTermMonthly * 12)}</p>
              </div>
              <div>
                <h4 className="text-muted-foreground mb-2">Short-Term Rental</h4>
                <p><span className="text-muted-foreground">Monthly Average:</span> {formatter.format(property.shortTermAnnual / 12)}</p>
                <p><span className="text-muted-foreground">Annual Revenue:</span> {formatter.format(property.shortTermAnnual)}</p>
                <p><span className="text-muted-foreground">After Fees:</span> {formatter.format(property.shortTermAfterFees)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
