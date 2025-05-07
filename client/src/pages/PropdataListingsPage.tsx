import { useState } from "react";
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
import { Loader2, Search, ArrowUpDown, RefreshCw, Home, Bed, Bath, Car, Binary, Calendar, DollarSign, Database } from "lucide-react";
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
  agentPhone: string | null;
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
}

type SortField = 'address' | 'price' | 'propertyType' | 'bedrooms' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function PropdataListingsPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'createdAt',
    direction: 'desc'
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all");

  // Query to fetch PropData listings
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/propdata/fetch-listings'],
    enabled: !!user?.isAdmin, // Only fetch if user is admin
  });
  
  // Extract listings from response
  const listings = data?.results as PropdataListing[] || [];

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
  };

  const sortData = (data: PropdataListing[]) => {
    return [...data].sort((a, b) => {
      const { field, direction } = sortConfig;
      const aValue = a[field];
      const bValue = b[field];
      
      let comparison = 0;
      
      if (field === 'createdAt' || field === 'price' || field === 'bedrooms') {
        // Numeric or date comparison
        comparison = Number(aValue) - Number(bValue);
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

  const filterBySearchTerm = (data: PropdataListing[]) => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(listing =>
      listing.address.toLowerCase().includes(term) ||
      listing.propdataId.toLowerCase().includes(term) ||
      (listing.agentId && listing.agentId.toLowerCase().includes(term))
    );
  };

  // Process the data with all filters and sorting
  const processData = (data: PropdataListing[]) => {
    let processed = [...data];
    processed = filterByStatus(processed);
    processed = filterByPropertyType(processed);
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
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={async () => {
              try {
                // Default incremental sync
                const response = await fetch('/api/propdata/listings/sync', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    forceFullSync: false, 
                    maxPages: 5
                  }),
                });
                
                if (response.ok) {
                  const result = await response.json();
                  alert(`Sync completed: ${result.message}`);
                  refetch();
                } else {
                  alert('Failed to sync with PropData API: ' + (await response.text()));
                }
              } catch (error) {
                console.error('Error syncing with PropData:', error);
                alert('Failed to sync with PropData API. See console for details.');
              }
            }}
            variant="default"
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            Quick Sync
          </Button>
          
          <Button
            onClick={async () => {
              if (!confirm("This will perform a full sync of ALL PropData listings, which may take some time. Continue?")) {
                return;
              }
              
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
                } else {
                  alert('Failed to sync with PropData API: ' + (await response.text()));
                }
              } catch (error) {
                console.error('Error syncing with PropData:', error);
                alert('Failed to sync with PropData API. See console for details.');
              }
            }}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Full Sync
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter and search property listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
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

            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPropertyTypeFilter("all");
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
            {data?.total ? `${data.total} total properties found (showing ${listings.length})` : 'Loading properties...'}
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
                      <TableHead>Status</TableHead>
                      <TableHead onClick={() => handleSort('createdAt')} className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          Listed Date
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPageData().map((listing) => (
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
                            {listing.floorSize !== null && (
                              <div className="flex items-center ml-2">
                                <Binary className="h-3 w-3 mr-1 text-muted-foreground" />
                                {listing.floorSize}m²
                              </div>
                            )}
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
                            {format(new Date(listing.createdAt), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {getTotalPages() > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
                          className={currentPage === getTotalPages() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
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
    </div>
  );
}