
import { UpgradeModal } from "@/components/UpgradeModal";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { formatter } from "../utils/formatting";
import { Trash2, Calculator, ArrowUpDown, Eye, ChevronUp, ChevronDown, BarChart3, Sparkles, Search, FileText } from "lucide-react";
import { PropertyPreviewModal } from "@/components/PropertyPreviewModal";
import { useProAccess } from "@/hooks/use-pro-access";
import { PropertyComparisonModal } from "@/components/PropertyComparisonModal";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

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
  propertyType: 'rent_compare' | 'property_analyzer';
  createdAt: string;
}

interface AnalyzerProperty {
  id: number;
  userId?: number;
  address: string;
  purchasePrice: number;
  bedrooms: number;
  bathrooms: number;
  floorArea: number;
  parkingSpaces: number;
  monthlyLevies: number;
  monthlyRatesTaxes: number;
  shortTermGrossYield: string | null;
  longTermGrossYield: string | null;
  longTermAnnualRevenue: number | null;
  shortTermAnnualRevenue: number | null;
  createdAt: string;
  userEmail?: string | null;
  userName?: string | null;
}

type PropertyType = 'rent_compare' | 'property_analyzer';
type SortField = keyof AnalyzerProperty;
type SortDirection = 'asc' | 'desc';

export default function PropertiesPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<PropertyType>('property_analyzer');
  const [propertyToDelete, setPropertyToDelete] = useState<Property | AnalyzerProperty | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewProperty, setPreviewProperty] = useState<Property | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedPropertiesForComparison, setSelectedPropertiesForComparison] = useState<AnalyzerProperty[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { hasAccess: hasProAccess } = useProAccess();
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'address',
    direction: 'asc'
  });
  const [isDeletingProperties, setIsDeletingProperties] = useState(false);

  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: !!user && activeTab === 'rent_compare',
  });

  const { data: analyzerProperties, isLoading: isLoadingAnalyzer } = useQuery<AnalyzerProperty[]>({
    queryKey: ['/api/property-analyzer/properties'],
    enabled: !!user && activeTab === 'property_analyzer',
  });

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    setIsDeletingProperties(true);
    const endpoint = activeTab === 'rent_compare'
      ? `/api/properties/${propertyToDelete.id}`
      : `/api/property-analyzer/properties/${propertyToDelete.id}`;

    // Optimistically update UI
    queryClient.setQueryData<(Property | AnalyzerProperty)[]>(
      [activeTab === 'rent_compare' ? '/api/properties' : '/api/property-analyzer/properties'],
      (oldData) => oldData?.filter(p => p.id !== propertyToDelete.id) ?? []
    );

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setPropertyToDelete(null);
      setDeleteError(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({
        queryKey: [activeTab === 'rent_compare' ? '/api/properties' : '/api/property-analyzer/properties']
      });
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete property');
    } finally {
      setIsDeletingProperties(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedProperties.length) return;

    setIsDeletingProperties(true);
    // Optimistically update UI by removing selected properties from the list
    const endpoint = activeTab === 'rent_compare' ? '/api/properties' : '/api/property-analyzer/properties';
    queryClient.setQueryData<(Property | AnalyzerProperty)[]>([endpoint], (oldData) => {
      return oldData?.filter(p => !selectedProperties.includes(p.id)) ?? [];
    });

    try {
      // Create an array of delete promises for parallel execution
      const deletePromises = selectedProperties.map(propertyId => {
        const endpoint = activeTab === 'rent_compare'
          ? `/api/properties/${propertyId}`
          : `/api/property-analyzer/properties/${propertyId}`;

        return fetch(endpoint, {
          method: 'DELETE',
          credentials: 'include'
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Failed to delete property ${propertyId}`);
          }
          return propertyId;
        });
      });

      // Execute all delete operations in parallel
      await Promise.all(deletePromises);

      // Clear selection and errors after successful deletion
      setSelectedProperties([]);
      setDeleteError(null);
    } catch (error) {
      console.error('Error deleting properties:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({
        queryKey: [endpoint]
      });
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete properties');
    } finally {
      setIsDeletingProperties(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (showDeleteConfirmation && selectedProperties.length > 0) {
      await handleDeleteSelected();
    } else if (propertyToDelete) {
      await handleDelete();
    }
    setShowDeleteConfirmation(false);
    setPropertyToDelete(null);
  };

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortConfig.direction === 'asc' ?
      <ChevronUp className="h-4 w-4 ml-1" /> :
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const filteredAndSortedProperties = useMemo(() => {
    if (!analyzerProperties) return [];

    let filtered = analyzerProperties;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = analyzerProperties.filter(property =>
        property.address.toLowerCase().includes(searchLower)
      );
    }

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [analyzerProperties, searchTerm, sortConfig]);

  const calculateRatePerSqm = (property: AnalyzerProperty) => {
    if (!property.floorArea || property.floorArea === 0) return 0;
    return property.purchasePrice / property.floorArea;
  };

  return (
    <div className="p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Properties</h1>
          <div className="flex gap-2">
            <Link href="/dashboard/rent-compare">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Rent Compare
              </Button>
            </Link>
            <Link href="/dashboard/property-analyzer">
              <Button variant="outline" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Property Analyzer
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search properties..."
            className="w-full px-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PropertyType)} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="property_analyzer" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Property Analyzer
          </TabsTrigger>
          <TabsTrigger value="rent_compare" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Rent Compare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="property_analyzer">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {selectedProperties.length > 0 ? (
                  <div className="p-4 border-b flex items-center justify-between bg-muted/50">
                    <div className="text-sm text-muted-foreground">
                      {selectedProperties.length} {selectedProperties.length === 1 ? 'property' : 'properties'} selected
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          selectedProperties.forEach(id => {
                            window.open(`/properties/analyzer/${id}`, '_blank');
                          });
                        }}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        View Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (hasProAccess) {
                            const selectedProps = filteredAndSortedProperties.filter(p =>
                              selectedProperties.includes(p.id)
                            );
                            setSelectedPropertiesForComparison(selectedProps);
                          } else {
                            setShowUpgradeModal(true);
                          }
                        }}
                        className="flex items-center gap-2"
                        disabled={selectedProperties.length < 2}
                      >
                        <BarChart3 className="h-4 w-4" />
                        Compare Properties
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                          PRO
                        </span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-b bg-muted/50">
                    <div className="text-sm text-muted-foreground">
                      {filteredAndSortedProperties.length} {filteredAndSortedProperties.length === 1 ? 'property' : 'properties'} in total
                    </div>
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedProperties.length === filteredAndSortedProperties.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProperties(filteredAndSortedProperties.map(p => p.id));
                              } else {
                                setSelectedProperties([]);
                              }
                            }}
                          />
                          <span onClick={() => handleSort('address')} className="cursor-pointer hover:bg-muted/75">
                            <div className="flex items-center">
                              Address
                              <SortIcon field="address" />
                            </div>
                          </span>
                        </div>
                      </th>
                      <th onClick={() => handleSort('purchasePrice')} className="py-3 px-4 text-right cursor-pointer hover:bg-muted/75">
                        <div className="flex items-center justify-end">
                          Purchase Price
                          <SortIcon field="purchasePrice" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('floorArea')} className="py-3 px-4 text-right cursor-pointer hover:bg-muted/75">
                        <div className="flex items-center justify-end">
                          Area (m²)
                          <SortIcon field="floorArea" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('bedrooms')} className="py-3 px-4 text-center cursor-pointer hover:bg-muted/75">
                        <div className="flex items-center justify-center">
                          Beds
                          <SortIcon field="bedrooms" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('bathrooms')} className="py-3 px-4 text-center cursor-pointer hover:bg-muted/75">
                        <div className="flex items-center justify-center">
                          Baths
                          <SortIcon field="bathrooms" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('shortTermGrossYield')} className="py-3 px-4 text-right cursor-pointer hover:bg-muted/75">
                        <div className="flex items-center justify-end">
                          ST Yield
                          <SortIcon field="shortTermGrossYield" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('longTermGrossYield')} className="py-3 px-4 text-right cursor-pointer hover:bg-muted/75">
                        <div className="flex items-center justify-end">
                          LT Yield
                          <SortIcon field="longTermGrossYield" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('shortTermAnnualRevenue')} className="py-3 px-4 text-right cursor-pointer hover:bg-muted/75">
                        <div className="flex items-center justify-end">
                          ST Revenue
                          <SortIcon field="shortTermAnnualRevenue" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('longTermAnnualRevenue')} className="py-3 px-4 text-right cursor-pointer hover:bg-muted/75">
                        <div className="flex items-center justify-end">
                          LT Revenue
                          <SortIcon field="longTermAnnualRevenue" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('ratePerSquareMeter')} className="py-3 px-4 text-right cursor-pointer hover:bg-muted/75">
                        <div className="flex items-center justify-end">
                          Rate/m²
                          <SortIcon field="ratePerSquareMeter" />
                        </div>
                      </th>
                      {user?.isAdmin && (
                        <>
                          <th onClick={() => handleSort('createdAt')} className="py-3 px-4 text-right cursor-pointer hover:bg-muted/75">
                            <div className="flex items-center justify-end">
                              Run On
                              <SortIcon field="createdAt" />
                            </div>
                          </th>
                          <th className="py-3 px-4 text-right">Run By</th>
                        </>
                      )}
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingAnalyzer ? (
                      <tr>
                        <td colSpan={user?.isAdmin ? 13 : 11} className="text-center py-8 text-muted-foreground">
                          Loading properties...
                        </td>
                      </tr>
                    ) : !filteredAndSortedProperties.length ? (
                      <tr>
                        <td colSpan={user?.isAdmin ? 13 : 11} className="text-center py-8 text-muted-foreground">
                          No properties analyzed yet.{' '}
                          <Link href="/dashboard/property-analyzer" className="text-primary hover:underline">
                            Analyze your first property
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedProperties.map((property) => (
                        <tr key={property.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedProperties.includes(property.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedProperties([...selectedProperties, property.id]);
                                  } else {
                                    setSelectedProperties(selectedProperties.filter(id => id !== property.id));
                                  }
                                }}
                              />
                              <div className="max-w-[200px]">
                                <div className="font-medium truncate">{property.address}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {formatter.format(property.purchasePrice)}
                          </td>
                          <td className="py-3 px-4 text-right">{property.floorArea}</td>
                          <td className="py-3 px-4 text-center">{property.bedrooms}</td>
                          <td className="py-3 px-4 text-center">{property.bathrooms}</td>
                          <td className="py-3 px-4 text-right">
                            {property.shortTermGrossYield ?? '--'}%
                          </td>
                          <td className="py-3 px-4 text-right">
                            {property.longTermGrossYield ?? '--'}%
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {formatter.format(property.shortTermAnnualRevenue || 0)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {formatter.format(property.longTermAnnualRevenue || 0)}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {formatter.format(calculateRatePerSqm(property))}
                          </td>
                          {user?.isAdmin && (
                            <>
                              <td className="py-3 px-4 text-right whitespace-nowrap text-sm text-muted-foreground">
                                {new Date(property.createdAt).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-3 px-4 text-right text-sm text-muted-foreground max-w-[140px]">
                                <div className="truncate text-right" title={property.userEmail || ''}>
                                  {property.userName || property.userEmail || `User ${property.userId}`}
                                </div>
                              </td>
                            </>
                          )}
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Link href={`/properties/analyzer/${property.id}`}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setPropertyToDelete(property)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rent_compare">
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
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingProperties ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          Loading properties...
                        </td>
                      </tr>
                    ) : !properties?.length ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          No properties analyzed yet.{' '}
                          <Link href="/dashboard/rent-compare" className="text-primary hover:underline">
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
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => setPreviewProperty(property)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setPropertyToDelete(property)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!propertyToDelete || showDeleteConfirmation} onOpenChange={(open) => {
        if (!open) {
          setPropertyToDelete(null);
          setShowDeleteConfirmation(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedProperties.length > 0 ? (
                `This action cannot be undone. This will permanently delete ${selectedProperties.length} ${
                  selectedProperties.length === 1 ? 'property' : 'properties'
                } and remove them from our servers.`
              ) : (
                propertyToDelete && `This action cannot be undone. This will permanently delete the property "${propertyToDelete.address}" and remove it from our servers.`
              )}
              {deleteError && (
                <p className="mt-2 text-red-600">{deleteError}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingProperties} onClick={() => {
              setShowDeleteConfirmation(false);
              setPropertyToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300"
              onClick={handleDeleteConfirmed}
              disabled={isDeletingProperties}
            >
              {isDeletingProperties ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <PropertyComparisonModal
        properties={selectedPropertiesForComparison}
        open={selectedPropertiesForComparison.length > 0}
        onOpenChange={(open) => !open && setSelectedPropertiesForComparison([])}
      />

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
      <PropertyPreviewModal
        property={previewProperty}
        open={!!previewProperty}
        onOpenChange={(open) => !open && setPreviewProperty(null)}
      />
    </div>
  );
}