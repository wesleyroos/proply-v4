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

  const nextImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === property.images!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images!.length - 1 : prev - 1
      );
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
        {property.images && property.images.length > 0 ? (
          <div className="relative rounded-md overflow-hidden h-[300px] bg-muted mb-4">
            <img
              src={property.images[currentImageIndex]}
              alt={`Property ${property.address}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full h-8 w-8 p-0"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full h-8 w-8 p-0"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>
        ) : (
          <div className="rounded-md overflow-hidden h-[300px] bg-muted mb-4 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
              <p>No images available</p>
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
                {property.features && property.features.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.features.map((feature, index) => (
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