import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowUpDown, RefreshCw, Home, Bed, Bath, Car, Binary, Calendar, DollarSign, Database, Eye, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { format } from "date-fns";
import PropertyDetailModal, { PropertyDetailListing } from "@/components/PropertyDetailModal";

// Define PropData listing type based on database schema
interface PropdataListing {
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
  agentName: string | null;
  agentEmail: string | null;
  agentPhone: string | null;
  listingDate: string | null; // When the property was actually listed by Sotheby's
  lastModified: string;
  createdAt: string;
  updatedAt: string;
  // Optional fields that might be nested in JSON
  images?: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    suburb?: string;
    city?: string;
    province?: string;
  };
  features?: string[];
  listingData?: any; // Raw PropData API response
}

interface PaginatedResponse {
  listings: PropdataListing[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

type SortField = 'address' | 'price' | 'propertyType' | 'bedrooms' | 'createdAt' | 'listingDate' | 'agentName';
type SortDirection = 'asc' | 'desc';

export default function PropdataListingsPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'listingDate',
    direction: 'desc'
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [selectedProperty, setSelectedProperty] = useState<PropertyDetailListing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const [isFullSyncing, setIsFullSyncing] = useState(false);

  // Query to fetch PropData listings from database with pagination
  const { data: paginatedData, isLoading, error, refetch } = useQuery<PaginatedResponse>({
    queryKey: ['/api/propdata/listings', currentPage, itemsPerPage, sortConfig, statusFilter, propertyTypeFilter, agentFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortConfig.field,
        sortOrder: sortConfig.direction,
        status: statusFilter,
        propertyType: propertyTypeFilter,
        agent: agentFilter,
        search: searchTerm
      });
      
      const response = await fetch(`/api/propdata/listings?${params}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      
      return response.json();
    },
    enabled: !!user?.isAdmin, // Only fetch if user is admin
  });

  // Query to fetch sync status and last sync information
  const { data: syncStatus, refetch: refetchSyncStatus } = useQuery({
    queryKey: ['/api/propdata/listings/sync-status'],
    queryFn: async () => {
      const response = await fetch('/api/propdata/listings/sync-status', {
        credentials: 'include',
      });
      if (!response.ok) {
        return null;
      }
      return response.json();
    },
    enabled: !!user?.isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds to show updated sync status
  });
  
  // Extract listings and pagination from response
  const listings = paginatedData?.listings || [];
  const pagination = paginatedData?.pagination;
  
  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, propertyTypeFilter, agentFilter]);

  // Current data is directly from backend pagination
  const currentData = listings;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prevConfig) => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === 'asc'
          ? 'desc'
          : 'asc',
    }));
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const sortData = (data: PropdataListing[]) => {
    return [...data].sort((a, b) => {
      const { field, direction } = sortConfig;
      let aValue: any;
      let bValue: any;
      
      // Handle special field mappings
      if (field === 'agentName') {
        aValue = a.agentName || '';
        bValue = b.agentName || '';
      } else if (field === 'listingDate') {
        aValue = a.listingDate || a.createdAt;
        bValue = b.listingDate || b.createdAt;
      } else {
        aValue = a[field];
        bValue = b[field];
      }
      
      let comparison = 0;
      
      if (field === 'createdAt' || field === 'listingDate' || field === 'price' || field === 'bedrooms') {
        // Numeric or date comparison
        comparison = Number(new Date(aValue)) - Number(new Date(bValue));
      } else {
        // String comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };

  const filterByStatus = (data: PropdataListing[]) => {
    if (statusFilter === "all") return data;
    return data.filter(listing => listing.status.toLowerCase() === statusFilter.toLowerCase());
  };

  const filterByPropertyType = (data: PropdataListing[]) => {
    if (propertyTypeFilter === "all") return data;
    return data.filter(listing => listing.propertyType.toLowerCase() === propertyTypeFilter.toLowerCase());
  };

  const filterByAgent = (data: PropdataListing[]) => {
    if (agentFilter === "all") return data;
    return data.filter(listing => 
      listing.agentName && listing.agentName.toLowerCase().includes(agentFilter.toLowerCase())
    );
  };

  const filterBySearchTerm = (data: PropdataListing[]) => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(listing =>
      listing.address.toLowerCase().includes(term) ||
      listing.propdataId.toLowerCase().includes(term) ||
      (listing.agentId && listing.agentId.toLowerCase().includes(term)) ||
      (listing.agentName && listing.agentName.toLowerCase().includes(term))
    );
  };

  // Process the data with all filters and sorting
  const processData = (data: PropdataListing[]) => {
    let processed = [...data];
    processed = filterByStatus(processed);
    processed = filterByPropertyType(processed);
    processed = filterByAgent(processed);
    processed = filterBySearchTerm(processed);
    return sortData(processed);
  };

  const getPageData = () => {
    if (!listings) return [];
    
    const processed = processData(listings);
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processed.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = () => {
    if (!listings) return 0;
    const processed = processData(listings);
    return Math.ceil(processed.length / itemsPerPage);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'withdrawn':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      case 'expired':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle opening the property detail modal
  const handleViewProperty = (property: PropdataListing) => {
    // Convert PropdataListing to PropertyDetailListing
    const detailProperty: PropertyDetailListing = {
      ...property,
      listingData: property.listingData || {},
    };
    
    setSelectedProperty(detailProperty);
    setIsModalOpen(true);
  };

  if (!user?.isAdmin) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">Access Denied</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              You do not have permission to view this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">PropData Listings</h1>
          <p className="text-muted-foreground">
            View and manage property listings from PropData integration.
          </p>
        </div>
        <div className="space-x-2">
          <Button
            onClick={async () => {
              setIsQuickSyncing(true);
              try {
                // Use the new quick sync endpoint
                const response = await fetch('/api/propdata/listings/quick-sync', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                
                if (response.ok) {
                  const result = await response.json();
                  alert(`Quick sync completed: ${result.newListings} new, ${result.updatedListings} updated`);
                  refetch();
                  refetchSyncStatus();
                } else {
                  alert('Failed to perform quick sync: ' + (await response.text()));
                }
              } catch (error) {
                console.error('Error performing quick sync:', error);
                alert('Failed to perform quick sync. See console for details.');
              } finally {
                setIsQuickSyncing(false);
              }
            }}
            variant="default"
            className="gap-2"
            disabled={isQuickSyncing || isFullSyncing}
          >
            {isQuickSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isQuickSyncing ? 'Syncing...' : 'Quick Sync'}
          </Button>
          
          <Button
            onClick={async () => {
              if (!confirm("This will perform a full sync of ALL PropData listings, which may take some time. Continue?")) {
                return;
              }
              
              setIsFullSyncing(true);
              try {
                const response = await fetch('/api/propdata/listings/sync', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    forceFullSync: true, 
                    maxPages: 20
                  }),
                });
                
                if (response.ok) {
                  const result = await response.json();
                  alert(`Full sync completed: ${result.message}`);
                  refetch();
                  refetchSyncStatus();
                } else {
                  alert('Failed to sync with PropData API: ' + (await response.text()));
                }
              } catch (error) {
                console.error('Error syncing with PropData:', error);
                alert('Failed to sync with PropData API. See console for details.');
              } finally {
                setIsFullSyncing(false);
              }
            }}
            variant="outline"
            className="gap-2"
            disabled={isQuickSyncing || isFullSyncing}
          >
            {isFullSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isFullSyncing ? 'Full Syncing...' : 'Full Sync'}
          </Button>
        </div>
      </div>

      {/* Last Sync Status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        {syncStatus ? (
          <span>
            Last sync: {format(new Date(syncStatus.completedAt || syncStatus.startedAt), 'PPp')}
            {syncStatus.status === 'running' && (
              <span className="ml-2 text-blue-600">(Auto-sync in progress...)</span>
            )}
            {syncStatus.status === 'completed' && syncStatus.newListings !== undefined && (
              <span className="ml-2 text-green-600">
                ({syncStatus.newListings} new, {syncStatus.updatedListings} updated)
              </span>
            )}
          </span>
        ) : (
          <span>No sync history available</span>
        )}
        <span className="ml-4 text-xs">
          Auto-sync runs every 5 minutes
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter and search property listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by address or ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="land">Land</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {Array.from(new Set(listings
                  .filter(listing => listing.agentName)
                  .map(listing => listing.agentName)
                )).sort().map((agentName) => (
                  <SelectItem key={agentName} value={agentName!}>
                    {agentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPropertyTypeFilter("all");
              setAgentFilter("all");
              setSortConfig({ field: 'createdAt', direction: 'desc' });
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property Listings</CardTitle>
          <CardDescription>
            {listings.length > 0 ? `${listings.length} total properties found` : 'Loading properties...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading listings. Please try again.
            </div>
          ) : listings && listings.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => handleSort('address')} className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          Address
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('price')} className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          Price
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('propertyType')} className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          Type
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('bedrooms')} className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          Beds
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead onClick={() => handleSort('listingDate')} className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          Listed Date
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('agentName')} className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          Agent
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            {listing.address}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {listing.propdataId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {formatCurrency(listing.price)}
                          </div>
                        </TableCell>
                        <TableCell>{listing.propertyType}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4 text-muted-foreground" />
                            {listing.bedrooms}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 text-xs">
                            <div className="flex items-center">
                              <Bath className="h-3 w-3 mr-1 text-muted-foreground" />
                              {listing.bathrooms}
                            </div>
                            {listing.parkingSpaces !== null && (
                              <div className="flex items-center ml-2">
                                <Car className="h-3 w-3 mr-1 text-muted-foreground" />
                                {listing.parkingSpaces}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {(() => {
                              const propertyType = listing.propertyType.toLowerCase();
                              const isApartment = propertyType.includes('apartment') || 
                                                propertyType.includes('penthouse') || 
                                                propertyType.includes('studio');
                              const isVacantLand = propertyType.includes('vacant') || 
                                                 propertyType.includes('land');
                              const isHouse = propertyType.includes('house') || 
                                            propertyType.includes('freestanding') || 
                                            propertyType.includes('duplex') || 
                                            propertyType.includes('townhouse') ||
                                            propertyType.includes('freehold');

                              if (isVacantLand) {
                                // Vacant land: show only land size
                                return listing.landSize ? (
                                  <div>Land: {listing.landSize}m²</div>
                                ) : <span className="text-muted-foreground">-</span>;
                              } else if (isApartment) {
                                // Apartments: show only floor/building size
                                return listing.floorSize ? (
                                  <div>Floor: {listing.floorSize}m²</div>
                                ) : <span className="text-muted-foreground">-</span>;
                              } else if (isHouse) {
                                // Houses: show both floor and land size
                                return (
                                  <>
                                    {listing.floorSize && (
                                      <div>Floor: {listing.floorSize}m²</div>
                                    )}
                                    {listing.landSize && (
                                      <div>Land: {listing.landSize}m²</div>
                                    )}
                                    {!listing.floorSize && !listing.landSize && (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </>
                                );
                              } else {
                                // Default: show floor size primarily, land size if no floor size
                                return listing.floorSize ? (
                                  <div>Floor: {listing.floorSize}m²</div>
                                ) : listing.landSize ? (
                                  <div>Land: {listing.landSize}m²</div>
                                ) : <span className="text-muted-foreground">-</span>;
                              }
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(listing.status)}>
                            {listing.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {listing.listingDate 
                              ? format(new Date(listing.listingDate), 'MMM d, yyyy')
                              : format(new Date(listing.createdAt), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {listing.agentName ? (
                              <div>
                                <div className="font-medium">{listing.agentName}</div>
                                {listing.agentPhone && (
                                  <div className="text-xs text-muted-foreground">{listing.agentPhone}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewProperty(listing)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex justify-center w-full">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={!pagination.hasPrevious}
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground px-2">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No property listings found. There may be no PropData listings in the database yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Detail Modal */}
      <PropertyDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={selectedProperty}
      />
    </div>
  );
}