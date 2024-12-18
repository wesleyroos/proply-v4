import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatter } from "../utils/formatting";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: !!user,
  });
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Property;
    direction: 'asc' | 'desc';
  } | null>(null);

  const filteredProperties = properties?.filter(property => 
    property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProperties = filteredProperties?.sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    }
    
    return 0;
  });

  const handleSort = (key: keyof Property) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;
    
    try {
      const response = await fetch(`/api/properties/${propertyToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      setPropertyToDelete(null);
      setDeleteError(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete property');
    }
  };

  return (
    <div className="p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Properties</h1>
          <Link href="/compare">
            <Button>Compare New Property</Button>
          </Link>
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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th 
                    className="py-3 px-4 text-left cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-2">
                      Property
                      {sortConfig?.key === 'title' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-right cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('shortTermNightly')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Short-Term Rate
                      {sortConfig?.key === 'shortTermNightly' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-right cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('longTermMonthly')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Long-Term Monthly
                      {sortConfig?.key === 'longTermMonthly' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-right cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('longTermAnnual')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Long-Term Annual
                      {sortConfig?.key === 'longTermAnnual' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-right cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('shortTermAfterFees')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Short-Term Annual
                      {sortConfig?.key === 'shortTermAfterFees' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-right cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('breakEvenOccupancy')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Break-even
                      {sortConfig?.key === 'breakEvenOccupancy' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-right cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Added
                      {sortConfig?.key === 'createdAt' && (
                        sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
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
                  sortedProperties?.map((property) => (
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
                      <td className="py-3 px-4 text-right">{formatter.format(property.longTermMonthly * 12)}</td>
                      <td className="py-3 px-4 text-right">{formatter.format(property.shortTermAfterFees)}</td>
                      <td className="py-3 px-4 text-right">{property.breakEvenOccupancy}%</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {new Date(property.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setPropertyToDelete(property)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!propertyToDelete} onOpenChange={() => setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property
              {propertyToDelete && ` "${propertyToDelete.title}"`} and remove it from our servers.
              {deleteError && (
                <p className="mt-2 text-red-600">{deleteError}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}