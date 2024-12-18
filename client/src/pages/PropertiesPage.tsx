import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatter } from "../utils/formatting";

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
  createdAt: string;
}

export default function PropertiesPage() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <Link href="/compare">
          <Button>Compare New Property</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left">Property</th>
                  <th className="py-3 px-4 text-right">Short-Term Rate</th>
                  <th className="py-3 px-4 text-right">Long-Term Monthly</th>
                  <th className="py-3 px-4 text-right">Short-Term Annual</th>
                  <th className="py-3 px-4 text-right">Break-even</th>
                  <th className="py-3 px-4 text-right">Added</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading properties...
                    </td>
                  </tr>
                ) : !properties?.length ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No properties analyzed yet.{' '}
                      <Link href="/compare" className="text-primary hover:underline">
                        Compare your first property
                      </Link>
                    </td>
                  </tr>
                ) : (
                  properties.map((property) => (
                    <tr key={property.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{property.title}</div>
                          <div className="text-sm text-muted-foreground">{property.address}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {property.bedrooms} bed • {property.bathrooms} bath
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div>{formatter.format(property.shortTermNightly)}</div>
                        <div className="text-sm text-muted-foreground">{property.annualOccupancy}% occupancy</div>
                      </td>
                      <td className="py-3 px-4 text-right">{formatter.format(property.longTermMonthly)}</td>
                      <td className="py-3 px-4 text-right">{formatter.format(property.shortTermAfterFees)}</td>
                      <td className="py-3 px-4 text-right">{property.breakEvenOccupancy}%</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {new Date(property.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
