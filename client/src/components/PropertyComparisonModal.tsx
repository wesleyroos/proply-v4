
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { formatter } from "../utils/formatting";

interface Property {
  id: number;
  address: string;
  purchasePrice: number;
  floorArea: number;
  shortTermGrossYield: string | null;
  longTermGrossYield: string | null;
  shortTermAnnualRevenue: number | null;
  longTermAnnualRevenue: number | null;
}

interface PropertyComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
}

export function PropertyComparisonModal({
  open,
  onOpenChange,
  properties,
}: PropertyComparisonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Property Comparison</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(150px,1fr))] gap-4">
          <div className="font-medium">Metric</div>
          {properties.map((property) => (
            <div key={property.id} className="font-medium truncate">
              {property.address}
            </div>
          ))}

          <div className="text-muted-foreground">Purchase Price</div>
          {properties.map((property) => (
            <div key={property.id}>{formatter.format(property.purchasePrice)}</div>
          ))}

          <div className="text-muted-foreground">Size (m²)</div>
          {properties.map((property) => (
            <div key={property.id}>{property.floorArea}</div>
          ))}

          <div className="text-muted-foreground">Short Term Yield</div>
          {properties.map((property) => (
            <div key={property.id}>{property.shortTermGrossYield ?? '--'}%</div>
          ))}

          <div className="text-muted-foreground">Long Term Yield</div>
          {properties.map((property) => (
            <div key={property.id}>{property.longTermGrossYield ?? '--'}%</div>
          ))}

          <div className="text-muted-foreground">Short Term Revenue</div>
          {properties.map((property) => (
            <div key={property.id}>
              {formatter.format(property.shortTermAnnualRevenue || 0)}
            </div>
          ))}

          <div className="text-muted-foreground">Long Term Revenue</div>
          {properties.map((property) => (
            <div key={property.id}>
              {formatter.format(property.longTermAnnualRevenue || 0)}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
