import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { formatter } from "../utils/formatting";
import { Building2, Coins, TrendingUp, Home, BarChart3, PiggyBank } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import html2canvas from 'html2canvas';

interface PropertyAnalyzerModalProps {
  property: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMapImageCapture?: (imageData: string) => void;
}

export function PropertyAnalyzerModal({ 
  property, 
  open, 
  onOpenChange,
  onMapImageCapture 
}: PropertyAnalyzerModalProps) {
  if (!property) return null;

  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [captureAttempts, setCaptureAttempts] = useState(0);
  const MAX_CAPTURE_ATTEMPTS = 3;

  // Calculate the actual property rate per square meter
  const calculateRatePerSqm = () => {
    if (!property.floorArea || property.floorArea === 0) return 0;
    return property.purchasePrice / property.floorArea;
  };

  const captureMap = async () => {
    if (!mapRef.current || !mapLoaded) return;

    try {
      // Store original dimensions.  Using getComputedStyle for more reliable dimensions
      const originalStyle = mapRef.current.getAttribute('style');
      const computedStyle = window.getComputedStyle(mapRef.current);
      const originalWidth = computedStyle.width;
      const originalHeight = computedStyle.height;

      // Set explicit dimensions for capture.  Using inline styles for better control
      mapRef.current.style.width = '600px';
      mapRef.current.style.height = '400px';
      mapRef.current.style.position = 'relative';

      // Wait for any transitions to complete - Increased timeout for more complex maps
      await new Promise(resolve => setTimeout(resolve, 3000));

      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2,
        width: 600,
        height: 400,
        logging: true,
      });

      const mapImage = canvas.toDataURL('image/png', 1.0);

      // Validate captured image - More robust check
      if (mapImage && mapImage.length > 5000) { // Increased minimum length for validation
        console.log('Map captured successfully');
        onMapImageCapture?.(mapImage);
        setCaptureAttempts(0); // Reset attempts on success
      } else {
        console.error('Invalid map capture - retrying:', mapImage ? mapImage.length : 'No image data');
        if (captureAttempts < MAX_CAPTURE_ATTEMPTS) {
          setCaptureAttempts(prev => prev + 1);
          setTimeout(captureMap, 2000); // Increased retry delay
        }
      }

      // Restore original dimensions
      if (originalStyle) {
        mapRef.current.setAttribute('style', originalStyle);
      } else {
        mapRef.current.style.width = originalWidth;
        mapRef.current.style.height = originalHeight;
      }
    } catch (error) {
      console.error('Error capturing map:', error);
      if (captureAttempts < MAX_CAPTURE_ATTEMPTS) {
        setCaptureAttempts(prev => prev + 1);
        setTimeout(captureMap, 2000); // Increased retry delay
      }
    }
  };

  useEffect(() => {
    if (!open || !property.address) return;

    let isMounted = true;
    let map: google.maps.Map | null = null;
    let marker: google.maps.Marker | null = null;
    let mapLoadTimeout: NodeJS.Timeout;

    const initializeMap = async () => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: property.address }, (results, status) => {
        if (status === "OK" && results && results[0] && mapRef.current) {
          map = new google.maps.Map(mapRef.current, {
            center: results[0].geometry.location,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          marker = new google.maps.Marker({
            map,
            position: results[0].geometry.location,
          });
          setMapLoaded(true);
          // Capture after map is loaded with a delay to allow for rendering
          mapLoadTimeout = setTimeout(captureMap, 3000); // Increased timeout
        } else {
          console.error("Geocoding failed:", status);
        }
      });
    };


    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
    });

    loader.load().then(() => {
      if (!isMounted) return;
      initializeMap();
    });

    return () => {
      isMounted = false;
      setMapLoaded(false);
      setCaptureAttempts(0);
      clearTimeout(mapLoadTimeout); // Clear timeout on unmount
      if (map) {
        map.setMap(null); // Clear the map to prevent memory leaks.
      }
      if (marker) {
        marker.setMap(null); // Clear the marker to prevent memory leaks.
      }
    };
  }, [open, property.address]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] overflow-y-auto bg-gradient-to-b from-background to-background/95">
        <div className="space-y-6 py-6">
          {/* Header */}
          <div className="border-b pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                  Analysis Summary
                </h2>
              </div>
              {property.propertyPhoto && (
                <img 
                  src={property.propertyPhoto} 
                  alt="Property"
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
                  <h3 className="text-sm font-medium">Purchase Price & Details</h3>
                </div>
                <div className="text-2xl font-bold text-foreground mb-4">
                  {formatter.format(property.purchasePrice)}
                </div>
                <div className="space-y-4 border-t border-border/50 pt-4">
                  {property.propertyDescription && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="font-medium text-foreground mt-1">{property.propertyDescription}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Property Rate per m²</p>
                    <p className="font-medium text-foreground">
                      {formatter.format(calculateRatePerSqm())}/m²
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Floor Area</p>
                      <p className="font-medium">{property.floorArea} m²</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                      <p className="font-medium">{property.bedrooms || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                      <p className="font-medium">{property.bathrooms || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Parking</p>
                      <p className="font-medium">{property.parkingSpaces || 0}</p>
                    </div>
                  </div>
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
                <p className="text-sm text-muted-foreground mb-4">{property.address}</p>
                <div 
                  ref={mapRef} 
                  id="property-analysis-map"
                  className="w-full h-[200px] rounded-lg overflow-hidden"
                  style={{ 
                    border: '1px solid var(--border)',
                    width: '100%',  
                    height: '300px' 
                  }}
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
                    <p className="text-sm text-muted-foreground mb-2">Nightly Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatter.format(property.shortTermNightlyRate || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatter.format((property.shortTermAnnualRevenue || 0) / 12)}
                    </p>
                  </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}