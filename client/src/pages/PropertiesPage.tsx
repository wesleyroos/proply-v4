import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatter } from "../utils/formatting";
import { Trash2, ChevronDown, ChevronUp, Calculator, ArrowUpDown } from "lucide-react";
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
import type { SelectUser } from "@db/schema";

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
  propertyType: 'rent_compare' | 'property_analyzer';
  createdAt: string;
}

interface AnalyzerProperty {
  id: number;
  address: string;
  purchasePrice: number;
  bedrooms: number;
  bathrooms: number;
  netOperatingIncome: {
    year1: {
      value: number;
    };
  };
  investmentMetrics: {
    shortTerm: Array<{
      capRate: number;
      cashOnCashReturn: number;
    }>;
  };
  createdAt: string;
}

type PropertyType = 'rent_compare' | 'property_analyzer';

export default function PropertiesPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<PropertyType>('rent_compare');
  const [propertyToDelete, setPropertyToDelete] = useState<Property | AnalyzerProperty | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Property | keyof AnalyzerProperty;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Query for rent compare properties
  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties', user?.id],
    enabled: !!user && activeTab === 'rent_compare',
  });

  // Query for property analyzer results
  const { data: analyzerProperties, isLoading: isLoadingAnalyzer } = useQuery<AnalyzerProperty[]>({
    queryKey: ['/api/property-analyzer/properties', user?.id],
    enabled: !!user && activeTab === 'property_analyzer',
  });

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    try {
      const endpoint = activeTab === 'rent_compare'
        ? `/api/properties/${propertyToDelete.id}`
        : `/api/property-analyzer/${propertyToDelete.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Invalidate the appropriate query
      queryClient.invalidateQueries({
        queryKey: activeTab === 'rent_compare'
          ? ['/api/properties']
          : ['/api/property-analyzer/properties']
      });

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
          <div className="flex gap-2">
            <Link href="/compare">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Rent Compare
              </Button>
            </Link>
            <Link href="/analyzer">
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
          <TabsTrigger value="rent_compare" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Rent Compare
          </TabsTrigger>
          <TabsTrigger value="property_analyzer" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Property Analyzer
          </TabsTrigger>
        </TabsList>

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
                          <Link href="/compare" className="text-primary hover:underline">
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
        </TabsContent>

        <TabsContent value="property_analyzer">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left">Property</th>
                      <th className="py-3 px-4 text-right">Purchase Price</th>
                      <th className="py-3 px-4 text-right">Net Operating Income (Year 1)</th>
                      <th className="py-3 px-4 text-right">Cap Rate</th>
                      <th className="py-3 px-4 text-right">Cash on Cash Return</th>
                      <th className="py-3 px-4 text-right">Added</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingAnalyzer ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          Loading properties...
                        </td>
                      </tr>
                    ) : !analyzerProperties?.length ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          No properties analyzed yet.{' '}
                          <Link href="/analyzer" className="text-primary hover:underline">
                            Analyze your first property
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      analyzerProperties.map((property) => (
                        <tr key={property.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="text-sm text-muted-foreground">{property.address}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {property.bedrooms} bed • {property.bathrooms} bath
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatter.format(Number(property.purchasePrice))}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatter.format(property.netOperatingIncome?.year1?.value || 0)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {(property.investmentMetrics?.shortTerm?.[0]?.capRate || 0).toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right">
                            {(property.investmentMetrics?.shortTerm?.[0]?.cashOnCashReturn || 0).toFixed(2)}%
                          </td>
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
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!propertyToDelete} onOpenChange={() => setPropertyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the property
              {propertyToDelete && ` "${propertyToDelete.address}"`} and remove it from our servers.
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