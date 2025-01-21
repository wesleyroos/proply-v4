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
  if (properties.length > 5) {
    properties = properties.slice(0, 5);
  }

  const metrics = [
    { label: "Purchase Price", key: "purchasePrice", format: (val: number) => formatter.format(val) },
    { label: "Size (m²)", key: "floorArea", format: (val: number) => val.toString() },
    { label: "Bedrooms", key: "bedrooms", format: (val: number) => val.toString() },
    { label: "Bathrooms", key: "bathrooms", format: (val: number) => val.toString() },
    { label: "Rate/m²", key: "purchasePrice", format: (val: number, prop: any) => 
      formatter.format(prop.floorArea ? val / prop.floorArea : 0) },
    { label: "Short Term Yield", key: "shortTermGrossYield", format: (val: number | null) => 
      val ? `${val}%` : '--' },
    { label: "Long Term Yield", key: "longTermGrossYield", format: (val: number | null) => 
      val ? `${val}%` : '--' },
    { label: "Short Term Revenue", key: "shortTermAnnualRevenue", format: (val: number | null) => 
      val ? formatter.format(val) : '--' },
    { label: "Long Term Revenue", key: "longTermAnnualRevenue", format: (val: number | null) => 
      val ? formatter.format(val) : '--' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Property Comparison</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-4 text-left font-medium w-[200px]">Metric</th>
                {properties.map((property) => (
                  <th key={property.id} className="py-2 px-4 text-left font-medium min-w-[200px]">
                    <div className="truncate">{property.address}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.label} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4 text-muted-foreground">{metric.label}</td>
                  {properties.map((property) => (
                    <td key={property.id} className="py-2 px-4">
                      {metric.format(property[metric.key as keyof typeof property], property)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}