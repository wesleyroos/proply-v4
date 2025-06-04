import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home,
  Bed,
  Bath,
  Car,
  Ruler,
  Map,
  DollarSign,
  Calendar,
  Phone,
  User,
  Image as ImageIcon,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  Loader2,
} from "lucide-react";
import { initGoogleMaps } from "@/lib/maps";

// TypeScript declarations for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface PropertyLocation {
  latitude?: number;
  longitude?: number;
  suburb?: string;
  city?: string;
  province?: string;
}

// Define PropData listing type based on our database structure
export interface PropertyDetailListing {
  id: number;
  propdataId: string;
  agencyId: number;
  status: string;
  address: string;
  price: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number | null;
  floorSize: number | null;
  landSize: number | null;
  agentId: string | null;
  agentPhone: string | null;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
  // Optional fields that might be nested in JSON
  images?: string[];
  location?: PropertyLocation;
  features?: string[];
  listingData?: any; // The raw PropData data
}

interface PropertyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyDetailListing | null;
}

export default function PropertyDetailModal({
  isOpen,
  onClose,
  property,
}: PropertyDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [valuationReport, setValuationReport] = useState<any>(null);
  const [savedValuationData, setSavedValuationData] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Reset valuation report when property changes or modal closes, and load existing valuation
  useEffect(() => {
    setValuationReport(null);
    setSavedValuationData(null);
    setActiveTab("overview");
    setMapLoaded(false);
    
    // Load existing valuation if property is available
    if (property?.id && isOpen) {
      loadExistingValuation(property.id.toString());
    }
  }, [property?.id, isOpen]);

  // Initialize Google Maps when modal opens and property address is available
  useEffect(() => {
    if (isOpen && property?.address) {
      initializeMap();
    }
  }, [isOpen, property?.address]);

  const initializeMap = async () => {
    if (!property?.address || !mapRef.current) return;

    try {
      await initGoogleMaps();
      
      // Ensure Google Maps is loaded
      if (!window.google?.maps) {
        console.error("Google Maps API not loaded");
        return;
      }
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: property.address }, (results: any, status: any) => {
        if (status === "OK" && results && results[0] && mapRef.current) {
          const map = new window.google.maps.Map(mapRef.current, {
            center: results[0].geometry.location,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          new window.google.maps.Marker({
            map,
            position: results[0].geometry.location,
            title: property.address,
          });
          
          setMapLoaded(true);
        } else {
          console.error("Geocoding failed:", status);
        }
      });
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
    }
  };

  // Load existing valuation from database
  const loadExistingValuation = async (propertyId: string) => {
    try {
      const response = await fetch(`/api/valuation-reports/${propertyId}`);
      if (response.ok) {
        const savedValuation = await response.json();
        setValuationReport(savedValuation.valuationData);
        setSavedValuationData(savedValuation); // Store the complete saved data including calculated fields
      }
      // If 404, no existing valuation - that's fine
    } catch (error) {
      console.error("Error loading existing valuation:", error);
    }
  };

  // Save valuation to database
  const saveValuationToDatabase = async (valuationData: any) => {
    if (!property) return;
    
    try {
      const saveData = {
        propertyId: property.id.toString(),
        address: property.address,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        floorSize: property.floorSize,
        landSize: property.landSize,
        propertyType: property.propertyType,
        parkingSpaces: property.parkingSpaces,
        valuationData,
        imagesAnalyzed: 10
      };

      const response = await fetch('/api/valuation-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save valuation: ${response.statusText}`);
      }

      console.log("Valuation saved to database successfully");
    } catch (error) {
      console.error("Error saving valuation to database:", error);
    }
  };

  // Get property images
  const getPropertyImages = () => {
    if (!property) return [];
    
    const images: string[] = [];
    
    // First, try to get images from the stored images array (already processed)
    if (property.images && property.images.length > 0) {
      return property.images;
    }
    
    // If not available, extract from listingData
    if (property.listingData) {
      // Get header images (hero shots)
      if (property.listingData.header_images && Array.isArray(property.listingData.header_images)) {
        property.listingData.header_images.forEach((img: any) => {
          if (typeof img === 'string') {
            images.push(img);
          } else if (img && img.image) {
            images.push(img.image);
          }
        });
      }
      
      // Get listing images (full gallery)
      if (property.listingData.listing_images && Array.isArray(property.listingData.listing_images)) {
        property.listingData.listing_images.forEach((img: any) => {
          if (typeof img === 'string') {
            images.push(img);
          } else if (img && img.image) {
            images.push(img.image);
          }
        });
      }
    }
    
    return images;
  };

  const propertyImages = getPropertyImages();

  // Arrow key navigation for full-screen viewer
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isFullScreenOpen || propertyImages.length === 0) return;
      
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setFullScreenImageIndex((prev) => 
          prev === 0 ? propertyImages.length - 1 : prev - 1
        );
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setFullScreenImageIndex((prev) => 
          prev === propertyImages.length - 1 ? 0 : prev + 1
        );
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setIsFullScreenOpen(false);
      }
    };

    if (isFullScreenOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullScreenOpen, propertyImages.length]);

  if (!property) return null;

  const openFullScreen = (index: number) => {
    setFullScreenImageIndex(index);
    setIsFullScreenOpen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreenOpen(false);
  };

  const nextFullScreenImage = () => {
    setFullScreenImageIndex((prev) => 
      prev === propertyImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevFullScreenImage = () => {
    setFullScreenImageIndex((prev) => 
      prev === 0 ? propertyImages.length - 1 : prev - 1
    );
  };

  const generateValuationReport = async () => {
    if (!property) return;

    setIsGeneratingReport(true);
    try {
      const requestData = {
        address: property.address,
        propertyType: property.propertyType,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parkingSpaces: property.parkingSpaces,
        floorSize: property.floorSize,
        landSize: property.landSize,
        price: property.price,
        images: propertyImages.slice(0, 10), // Analyze first 10 images for comprehensive coverage
        location: property.location
      };

      const response = await fetch('/api/generate-valuation-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const report = await response.json();
      setValuationReport(report);
      setActiveTab('valuation'); // Switch to valuation tab
      
      // Save the valuation report to database
      await saveValuationToDatabase(report);
    } catch (error) {
      console.error('Error generating valuation report:', error);
      alert('Failed to generate valuation report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const scrollLeft = () => {
    setCurrentImageIndex((prev) => Math.max(0, prev - 1));
  };

  const scrollRight = () => {
    const maxStartIndex = Math.max(0, propertyImages.length - Math.floor(800 / 100)); // Approximate images that fit
    setCurrentImageIndex((prev) => Math.min(maxStartIndex, prev + 1));
  };

  // Calculate how many images can fit in the available space (approximately)
  const imagesPerView = Math.floor(800 / 100); // Assuming 800px width and 100px per image including gap

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{property?.address}</span>
                <Badge
                  variant="outline"
                  className="ml-2 bg-green-50 text-green-700 border-green-200"
                >
                  {property?.status}
                </Badge>
              </div>
              <Button
                onClick={generateValuationReport}
                disabled={isGeneratingReport}
                variant="default"
                size="sm"
                className="gap-2"
              >
                {isGeneratingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileBarChart className="h-4 w-4" />
                )}
                {isGeneratingReport ? 'Generating...' : 'Generate Report'}
              </Button>
            </DialogTitle>
            <DialogDescription>
              Property ID: {property?.propdataId} • Last Modified:{" "}
              {property?.lastModified && formatDate(property.lastModified)}
            </DialogDescription>
          </DialogHeader>

          {/* Property Image Gallery */}
          {propertyImages.length > 0 ? (
            <div className="relative mb-4">
              <div className="flex items-center gap-2">
                {currentImageIndex > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={scrollLeft}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                
                <div className="flex gap-2 overflow-hidden flex-1">
                  {propertyImages.slice(currentImageIndex, currentImageIndex + imagesPerView).map((image, index) => (
                    <div 
                      key={currentImageIndex + index}
                      className="w-24 h-24 rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                      onClick={() => openFullScreen(currentImageIndex + index)}
                    >
                      <img
                        src={image}
                        alt={`Property ${property?.address} - Image ${currentImageIndex + index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                {currentImageIndex + imagesPerView < propertyImages.length && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={scrollRight}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {propertyImages.length > imagesPerView && (
                <div className="text-center mt-2">
                  <span className="text-xs text-muted-foreground">
                    Showing {currentImageIndex + 1}-{Math.min(currentImageIndex + imagesPerView, propertyImages.length)} of {propertyImages.length} images
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md overflow-hidden h-[100px] bg-muted mb-4 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                <p className="text-sm">No images available</p>
              </div>
            </div>
          )}

          {/* Key Property Details */}
          <div className="flex flex-wrap gap-6 my-4 justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {property && formatCurrency(property.price)}
                </div>
                <div className="text-xs text-muted-foreground">Asking Price</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold">{property?.propertyType}</div>
                <div className="text-xs text-muted-foreground">Property Type</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Bed className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold">{property?.bedrooms}</div>
                <div className="text-xs text-muted-foreground">Bedrooms</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Bath className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold">{property?.bathrooms}</div>
                <div className="text-xs text-muted-foreground">Bathrooms</div>
              </div>
            </div>

            {property?.parkingSpaces !== null && (
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{property?.parkingSpaces}</div>
                  <div className="text-xs text-muted-foreground">Parking</div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Details in Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="agent">Contact</TabsTrigger>
              <TabsTrigger value="valuation">Valuation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Property Specs Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Property Specs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Column 1 */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-muted-foreground text-sm">Property Type</span>
                          <div className="font-medium">{property?.propertyType || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Bedrooms</span>
                          <div className="font-medium">{property?.bedrooms || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Bathrooms</span>
                          <div className="font-medium">{property?.bathrooms || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Parking</span>
                          <div className="font-medium">{property?.parkingSpaces !== null ? property?.parkingSpaces : 'N/A'}</div>
                        </div>
                      </div>
                      
                      {/* Column 2 */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-muted-foreground text-sm">Size</span>
                          <div className="font-medium">{property?.floorSize ? `${property.floorSize} m²` : 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Price/m²</span>
                          <div className="font-medium">
                            {(() => {
                              // Use saved calculated value if available, otherwise calculate live
                              if (savedValuationData?.pricePerSquareMeter) {
                                return `R ${Math.round(parseFloat(savedValuationData.pricePerSquareMeter)).toLocaleString()}`;
                              }
                              if (property?.price && property?.floorSize) {
                                return `R ${Math.round(property.price / property.floorSize).toLocaleString()}`;
                              }
                              return 'N/A';
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Map className="h-5 w-5" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {property?.address ? (
                      <div className="h-48 w-full rounded-b-lg overflow-hidden">
                        <div 
                          ref={mapRef}
                          className="w-full h-full"
                          style={{ 
                            border: '1px solid var(--border)',
                            borderRadius: '0 0 0.5rem 0.5rem'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-full rounded-b-lg overflow-hidden bg-muted flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Map className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Location not available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Property Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Property ID:</span>
                    <span className="font-medium">{property?.propdataId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agency ID:</span>
                    <span className="font-medium">{property?.agencyId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{property?.createdAt && formatDate(property.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">{property?.updatedAt && formatDate(property.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {property?.features && Array.isArray(property.features) && property.features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="agent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Agent Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {property?.agentId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agent ID:</span>
                      <span className="font-medium">{property.agentId}</span>
                    </div>
                  )}
                  {property?.agentPhone && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Phone:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{property.agentPhone}</span>
                        <Button size="sm" variant="outline">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="valuation" className="space-y-4">
              {valuationReport ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileBarChart className="h-5 w-5" />
                      Estimated Value Range
                    </CardTitle>
                    <CardDescription>
                      AI-powered property valuation based on specifications and imagery
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Valuation Summary */}
                      {valuationReport.summary && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-2">Analysis Summary</h4>
                          <p className="text-blue-800 text-sm">{valuationReport.summary}</p>
                        </div>
                      )}

                      {/* Valuation Table */}
                      {valuationReport.valuations && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground">
                            <div>Estimate Type</div>
                            <div>Formula Used</div>
                            <div>Outcome</div>
                          </div>
                          {valuationReport.valuations.map((valuation: any, index: number) => (
                            <div key={index} className="grid grid-cols-3 gap-4 py-3 border-b last:border-b-0">
                              <div className="font-medium">{valuation.type}</div>
                              <div className="text-sm text-muted-foreground">{valuation.formula}</div>
                              <div className="font-semibold text-lg">{formatCurrency(valuation.value)}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Property Features Analysis */}
                      {valuationReport.features && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">Property Features Analysis</h4>
                          <p className="text-green-800 text-sm">{valuationReport.features}</p>
                        </div>
                      )}

                      {/* Market Context */}
                      {valuationReport.marketContext && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h4 className="font-medium text-yellow-900 mb-2">Market Context</h4>
                          <p className="text-yellow-800 text-sm">{valuationReport.marketContext}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileBarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Generate Valuation Report</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Generate Report" to get an AI-powered property valuation analysis
                    </p>
                    <Button
                      onClick={generateValuationReport}
                      disabled={isGeneratingReport}
                      className="gap-2"
                    >
                      {isGeneratingReport ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileBarChart className="h-4 w-4" />
                      )}
                      {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Full Screen Image Viewer */}
      {isFullScreenOpen && propertyImages.length > 0 && (
        <Dialog open={isFullScreenOpen} onOpenChange={closeFullScreen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
            <div className="relative w-full h-[80vh] bg-black flex items-center justify-center">
              <img
                src={propertyImages[fullScreenImageIndex]}
                alt={`Property ${property?.address} - Full screen ${fullScreenImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              
              {/* Navigation buttons */}
              {propertyImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0 h-12 w-12 p-0"
                    onClick={prevFullScreenImage}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0 h-12 w-12 p-0"
                    onClick={nextFullScreenImage}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              
              {/* Close button */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-0 h-8 w-8 p-0"
                onClick={closeFullScreen}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm">
                {fullScreenImageIndex + 1} / {propertyImages.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}