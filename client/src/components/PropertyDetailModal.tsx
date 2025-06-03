import React from "react";
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
} from "lucide-react";

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
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState("overview");

  if (!property) return null;

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

  // Extract images from PropData structure
  const getPropertyImages = () => {
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

  const nextImage = () => {
    if (propertyImages.length > 0) {
      setCurrentImageIndex((prev) => {
        const nextIndex = prev + 3;
        return nextIndex >= propertyImages.length ? 0 : nextIndex;
      });
    }
  };

  const prevImage = () => {
    if (propertyImages.length > 0) {
      setCurrentImageIndex((prev) => {
        const prevIndex = prev - 3;
        return prevIndex < 0 ? Math.max(0, Math.floor((propertyImages.length - 1) / 3) * 3) : prevIndex;
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>{property.address}</span>
            <Badge
              variant="outline"
              className="ml-2 bg-green-50 text-green-700 border-green-200"
            >
              {property.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Property ID: {property.propdataId} • Last Modified:{" "}
            {formatDate(property.lastModified)}
          </DialogDescription>
        </DialogHeader>

        {/* Property Image Gallery */}
        {propertyImages.length > 0 ? (
          <div className="relative mb-4">
            <div className="flex items-center gap-2">
              {propertyImages.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              
              <div className="flex gap-2 flex-1 justify-center">
                {propertyImages.slice(currentImageIndex, currentImageIndex + 3).map((image, index) => (
                  <div 
                    key={currentImageIndex + index}
                    className="w-24 h-24 rounded-md overflow-hidden bg-muted"
                  >
                    <img
                      src={image}
                      alt={`Property ${property.address} - Image ${currentImageIndex + index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {propertyImages.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {propertyImages.length > 3 && (
              <div className="text-center mt-2">
                <span className="text-xs text-muted-foreground">
                  {Math.floor(currentImageIndex / 3) + 1} of {Math.ceil(propertyImages.length / 3)} pages
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
                {formatCurrency(property.price)}
              </div>
              <div className="text-xs text-muted-foreground">Asking Price</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold">{property.propertyType}</div>
              <div className="text-xs text-muted-foreground">Property Type</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Bed className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold">{property.bedrooms}</div>
              <div className="text-xs text-muted-foreground">Bedrooms</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <Bath className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold">{property.bathrooms}</div>
              <div className="text-xs text-muted-foreground">Bathrooms</div>
            </div>
          </div>

          {property.parkingSpaces !== null && (
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-lg font-semibold">{property.parkingSpaces}</div>
                <div className="text-xs text-muted-foreground">Parking</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs for different data views */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-6"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="market">Market Analysis</TabsTrigger>
            <TabsTrigger value="investment">Investment</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>
                  Comprehensive information about this property
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Address</h3>
                    <p className="text-base">{property.address}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Location</h3>
                    <p className="text-base">
                      {property.location?.suburb || "N/A"}, {property.location?.city || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Floor Size</h3>
                    <p className="text-base">
                      {property.floorSize ? `${property.floorSize} m²` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Land Size</h3>
                    <p className="text-base">
                      {property.landSize ? `${property.landSize} m²` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Listed Date</h3>
                    <p className="text-base">{formatDate(property.lastModified)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">PropData ID</h3>
                    <p className="text-base">{property.propdataId}</p>
                  </div>
                  {property.agentPhone && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact</h3>
                      <p className="text-base">{property.agentPhone}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Agent Notes</h3>
                  <p className="text-base">
                    {property.listingData?.description || "No additional description available."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Agent Card */}
            {property.agentId && (
              <Card>
                <CardHeader>
                  <CardTitle>Listing Agent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">
                        {property.listingData?.agent?.full_name || "Agent Information"}
                      </h3>
                      {property.agentPhone && (
                        <p className="text-sm flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" /> {property.agentPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Property Features</CardTitle>
                <CardDescription>
                  Features and amenities of this property
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(property.features) && property.features.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.features.filter((f): f is string => typeof f === 'string' && f.trim().length > 0).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1 rounded-full">
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        </div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No feature information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Analysis Tab */}
          <TabsContent value="market" className="space-y-4">
            <Card className="bg-muted/20">
              <CardHeader>
                <CardTitle>Market Analysis</CardTitle>
                <CardDescription>
                  Coming soon - Market insights will be available in a future update
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Market analysis features are being developed. This section will include
                  comparable sales data, price trends, and suburb statistics.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investment Analysis Tab */}
          <TabsContent value="investment" className="space-y-4">
            <Card className="bg-muted/20">
              <CardHeader>
                <CardTitle>Investment Analysis</CardTitle>
                <CardDescription>
                  Coming soon - Investment projections will be available in a future update
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Investment analysis features are being developed. This section will include rental yield
                  projections, ROI calculations, and financing scenarios.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}