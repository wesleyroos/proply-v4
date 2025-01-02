import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { formatter } from "../utils/formatting";
import { Building2, Coins, TrendingUp, Home, BarChart3, PiggyBank } from "lucide-react";
import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface PropertyAnalyzerModalProps {
  property: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyAnalyzerModal({ property, open, onOpenChange }: PropertyAnalyzerModalProps) {
  if (!property) return null;
  const mapRef = useRef<HTMLDivElement>(null);

  // Calculate the actual property rate per square meter
  const calculateRatePerSqm = () => {
    if (!property.floorArea || property.floorArea === 0) return 0;
    return property.purchasePrice / property.floorArea;
  };

  useEffect(() => {
    if (!open || !property.address) return;

    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
    });

    loader.load().then(() => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: property.address }, (results, status) => {
        if (status === "OK" && results && results[0] && mapRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: results[0].geometry.location,
            zoom: 15,
          });

          new google.maps.Marker({
            map,
            position: results[0].geometry.location,
          });
        }
      });
    });
  }, [open, property.address]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto bg-gradient-to-b from-background to-background/95">
        <div className="space-y-6 py-6">
          {/* Header Info with Enhanced Styling */}
          <div className="border-b pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                  {property.address}
                </h2>
                <p className="text-muted-foreground text-sm mb-4 max-w-2xl">
                  {property.propertyDescription}
                </p>
              </div>
              {property.propertyPhoto && (
                <img 
                  src={property.propertyPhoto} 
                  alt={property.address}
                  className="w-32 h-32 object-cover rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>

          {/* Key Financial Metrics - Enhanced Layout with Icons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-background/50 to-background border-primary/10 hover:border-primary/20 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Coins className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-medium">Purchase Price</h3>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatter.format(property.purchasePrice)}
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">Property Rate per m²</p>
                  <p className="font-medium text-foreground">
                    {formatter.format(calculateRatePerSqm())}/m²
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Google Map */}
            <Card className="bg-gradient-to-br from-background/50 to-background border-primary/10 hover:border-primary/20 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Home className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-medium">Location</h3>
                </div>
                <div 
                  ref={mapRef} 
                  className="w-full h-[200px] rounded-lg overflow-hidden"
                  style={{ border: '1px solid var(--border)' }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Investment Performance Metrics with Enhanced Visual Design */}
          <Card className="bg-gradient-to-br from-background/50 to-background border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Investment Performance</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Cap Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {(property.investmentMetrics?.shortTerm?.[0]?.capRate || 0).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Cash on Cash Return</p>
                    <p className="text-2xl font-bold text-foreground">
                      {(property.investmentMetrics?.shortTerm?.[0]?.cashOnCashReturn || 0).toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Gross Yield (Short Term)</p>
                    <p className="text-2xl font-bold text-foreground">
                      {(property.shortTermGrossYield || 0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Gross Yield (Long Term)</p>
                    <p className="text-2xl font-bold text-foreground">
                      {(property.longTermGrossYield || 0)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Analysis - Enhanced with Icons and Better Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-background/50 to-background border-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Short-Term Rental Analysis</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Annual Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatter.format(property.shortTermAnnualRevenue || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {property.annualOccupancy || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-background/50 to-background border-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-6">
                  <PiggyBank className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Long-Term Rental Analysis</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Annual Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatter.format(property.longTermAnnualRevenue || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatter.format((property.longTermAnnualRevenue || 0) / 12)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Details with Enhanced Visual Hierarchy */}
          <Card className="bg-gradient-to-br from-background/50 to-background border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <Home className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Property Details</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Floor Area</p>
                  <p className="text-lg font-semibold">{property.floorArea} m²</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bedrooms</p>
                  <p className="text-lg font-semibold">{property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bathrooms</p>
                  <p className="text-lg font-semibold">{property.bathrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Parking Spaces</p>
                  <p className="text-lg font-semibold">{property.parkingSpaces || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}