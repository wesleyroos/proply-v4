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
import { Loader2, Search, ArrowUpDown, RefreshCw, Home, Bed, Bath, Car, Binary, Calendar, DollarSign, Database, Eye, Clock, History, ChevronDown, ChevronUp, Image, Settings } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { format } from "date-fns";
import PropertyDetailModal, { PropertyDetailListing } from "@/components/PropertyDetailModal";

// Define PropData listing type based on database schema
interface PropdataListing {
  id: number;
  propdataId: string;
  branchId: number | null;
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
  monthlyLevy: number | null;
  sectionalTitleLevy: number | null;
  specialLevy: number | null;
  homeOwnerLevy: number | null;
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
  // Agency branch information
  franchiseName?: string;
  branchName?: string;
  agencyId?: number; // For compatibility with PropertyDetailModal
  // Valuation report information
  reportGenerated?: string;
  reportId?: number;
}

interface ApiResponse {
  total: number;
  results: PropdataListing[];
  next?: string;
  previous?: string;
}

type SortField = 'address' | 'price' | 'propertyType' | 'bedrooms' | 'createdAt' | 'listingDate' | 'agentName' | 'reportGenerated';
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
  const [isSyncLogOpen, setIsSyncLogOpen] = useState(false);
  const [syncLogs, setSyncLogs] = useState<Array<{
    timestamp: string;
    type: 'quick' | 'full' | 'image';
    message: string;
    details?: string;
  }>>([]);

  // Query to fetch PropData listings from database
  const { data, isLoading, error, refetch } = useQuery<PropdataListing[]>({
    queryKey: ['/api/propdata/listings'],
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
  
  // Extract listings from response
  const listings = data || [];

  // Function to add sync log entry
  const addSyncLog = (type: 'quick' | 'full' | 'image', message: string, details?: string) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    };
    setSyncLogs(prev => [newLog, ...prev.slice(0, 19)]); // Keep last 20 entries
  };

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
      let aValue: any;
      let bValue: any;
      
      // Handle special field mappings
      if (field === 'agentName') {
        aValue = a.agentName || '';
        bValue = b.agentName || '';
      } else if (field === 'listingDate') {
        aValue = a.listingDate || a.createdAt;
        bValue = b.listingDate || b.createdAt;
      } else if (field === 'reportGenerated') {
        aValue = a.reportGenerated || '';
        bValue = b.reportGenerated || '';
      } else {
        aValue = a[field];
        bValue = b[field];
      }
      
      let comparison = 0;
      
      if (field === 'createdAt' || field === 'listingDate' || field === 'reportGenerated' || field === 'price' || field === 'bedrooms') {
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
      agencyId: property.branchId || property.agencyId || 1, // Use branchId or fallback for compatibility
      listingData: property.listingData || {},
      monthlyLevy: property.monthlyLevy || null,
      sectionalTitleLevy: property.sectionalTitleLevy || null,
      specialLevy: property.specialLevy || null,
      homeOwnerLevy: property.homeOwnerLevy || null,
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
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSyncLogOpen(!isSyncLogOpen)}
            className="relative"
          >
            <History className="h-4 w-4 mr-2" />
            Sync Log
            {syncLogs.length > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground text-xs px-1 py-0 h-4 min-w-4">
                {syncLogs.length}
              </Badge>
            )}
            {isSyncLogOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="gap-2"
                disabled={isQuickSyncing || isFullSyncing}
              >
                {(isQuickSyncing || isFullSyncing) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                {isQuickSyncing ? 'Quick Syncing...' : isFullSyncing ? 'Full Syncing...' : 'Sync'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    addSyncLog('image', 'Starting image sync...');
                    const response = await fetch('/api/sync-missing-images', {
                      method: 'POST',
                      credentials: 'include',
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      addSyncLog('image', `Image sync completed: ${result.processedProperties} properties processed, ${result.totalImagesAdded} images added`);
                      alert(`Image sync completed: ${result.processedProperties} properties processed, ${result.totalImagesAdded} images added`);
                      refetch();
                    } else {
                      const errorText = await response.text();
                      addSyncLog('image', 'Image sync failed', errorText);
                      alert('Failed to sync images: ' + errorText);
                    }
                  } catch (error) {
                    console.error('Error syncing images:', error);
                    addSyncLog('image', 'Image sync error', error instanceof Error ? error.message : 'Unknown error');
                    alert('Failed to sync images. See console for details.');
                  }
                }}
                className="gap-2"
              >
                <Image className="h-4 w-4" />
                Sync Images
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={async () => {
                  setIsQuickSyncing(true);
                  try {
                    addSyncLog('quick', 'Starting quick sync...');
                    const response = await fetch('/api/propdata/listings/quick-sync', {
                      method: 'POST',
                      credentials: 'include',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      const message = `Quick sync completed: ${result.newListings} new, ${result.updatedListings} updated`;
                      let details = '';
                      if (result.updatedProperties && result.updatedProperties.length > 0) {
                        details = `Updated properties: ${result.updatedProperties.map((p: any) => `${p.propdataId} (${p.address})`).join(', ')}`;
                      }
                      addSyncLog('quick', message, details);
                      alert(message);
                      refetch();
                      refetchSyncStatus();
                    } else {
                      const errorText = await response.text();
                      addSyncLog('quick', 'Quick sync failed', errorText);
                      alert('Failed to perform quick sync: ' + errorText);
                    }
                  } catch (error) {
                    console.error('Error performing quick sync:', error);
                    addSyncLog('quick', 'Quick sync error', error instanceof Error ? error.message : 'Unknown error');
                    alert('Failed to perform quick sync. See console for details.');
                  } finally {
                    setIsQuickSyncing(false);
                  }
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Quick Sync
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={async () => {
                  if (!confirm("This will perform a full sync of ALL PropData listings, which may take some time. Continue?")) {
                    return;
                  }
                  
                  setIsFullSyncing(true);
                  try {
                    addSyncLog('full', 'Starting full sync...');
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
                      const message = `Full sync completed: ${result.message}`;
                      addSyncLog('full', message);
                      alert(message);
                      refetch();
                      refetchSyncStatus();
                    } else {
                      const errorText = await response.text();
                      addSyncLog('full', 'Full sync failed', errorText);
                      alert('Failed to sync with PropData API: ' + errorText);
                    }
                  } catch (error) {
                    console.error('Error syncing with PropData:', error);
                    addSyncLog('full', 'Full sync error', error instanceof Error ? error.message : 'Unknown error');
                    alert('Failed to sync with PropData API. See console for details.');
                  } finally {
                    setIsFullSyncing(false);
                  }
                }}
                className="gap-2"
              >
                <Database className="h-4 w-4" />
                Full Sync
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Sync Log Panel */}
      {isSyncLogOpen && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Sync History
            </CardTitle>
            <CardDescription>
              Detailed log of sync activities and property updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {syncLogs.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No sync activities yet. Click sync buttons to see activity logs here.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {syncLogs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {log.type === 'quick' && <RefreshCw className="h-4 w-4 text-blue-500" />}
                      {log.type === 'full' && <Database className="h-4 w-4 text-green-500" />}
                      {log.type === 'image' && <Image className="h-4 w-4 text-purple-500" />}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={log.type === 'quick' ? 'default' : log.type === 'full' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {log.type.charAt(0).toUpperCase() + log.type.slice(1)} Sync
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.message}</p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-1 break-all">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {syncLogs.length > 0 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSyncLogs([])}
                >
                  Clear Log
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                      <TableHead onClick={() => handleSort('reportGenerated')} className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          Report Generated
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('agentName')} className="cursor-pointer">
                        <div className="flex items-center gap-1">
                          Agent
                          <ArrowUpDown className="h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Agency Branch
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
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
                          {formatCurrency(listing.price)}
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
                            {listing.reportGenerated ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <Eye className="h-4 w-4" />
                                <div>
                                  <div className="font-medium text-xs">Report Generated</div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(listing.reportGenerated), 'MMM d, yyyy')}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">No Report</span>
                            )}
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
                          <div className="text-sm">
                            {listing.franchiseName ? (
                              <div>
                                <div className="font-medium text-xs">{listing.franchiseName}</div>
                                {listing.branchName && (
                                  <div className="text-xs text-muted-foreground">{listing.branchName}</div>
                                )}</div>
                            ) : listing.branchId ? (
                              <Badge variant="secondary" className="text-xs">
                                Branch {listing.branchId}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Sotheby's International Realty
                              </Badge>
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
              
              {getTotalPages() > 1 && (
                <div className="mt-4 flex justify-center w-full">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground px-2">
                      Page {currentPage} of {getTotalPages()}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
                      disabled={currentPage === getTotalPages()}
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