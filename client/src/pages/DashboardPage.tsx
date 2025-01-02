import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useProAccess } from "@/hooks/use-pro-access";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatter } from "../utils/formatting";
import { Building2, Calculator, Home, ChartBar, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardMap from "@/components/DashboardMap";
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
  createdAt: string;
  type: 'analyzer' | 'compare';
  shortTermGrossYield?: number | null;
  longTermGrossYield?: number | null;
}

export default function DashboardPage() {
  const { user } = useUser();
  const hasProAccess = useProAccess();

  // Fetch property analyzer properties
  const { data: analyzerProperties, isLoading: isLoadingAnalyzer } = useQuery<Property[]>({
    queryKey: ['/api/property-analyzer/properties', user?.id],
    enabled: !!user,
  });

  // Fetch rent compare properties
  const { data: compareProperties, isLoading: isLoadingCompare } = useQuery<Property[]>({
    queryKey: ['/api/rent-compare/properties', user?.id],
    enabled: !!user,
  });

  // Calculate total properties and breakdown
  const analyzerCount = analyzerProperties?.length || 0;
  const compareCount = compareProperties?.length || 0;
  const totalProperties = analyzerCount + compareCount;

  // Combine properties for map
  const allProperties = [
    ...(analyzerProperties?.map(p => ({ ...p, type: 'analyzer' as const })) || []),
    ...(compareProperties?.map(p => ({ ...p, type: 'compare' as const })) || []),
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName || user?.username}!</h1>

        {!hasProAccess && (
          <Button size="sm" variant="default" asChild className="bg-primary hover:opacity-90">
            <Link href="/pricing">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Link>
          </Button>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/10">
          <Link href="/property-analyzer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Property Analyzer</h3>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Analyze new investment opportunities
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/10">
          <Link href="/rent-compare">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChartBar className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Rent Compare</h3>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Compare rental strategies
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/10">
          <Link href="/properties">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">Properties</h3>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                View all analyzed properties
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Portfolio Metrics */}
      <div className="mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <div className="flex gap-4 mt-2">
              <p className="text-xs text-muted-foreground">
                {analyzerCount} property analyses
              </p>
              <p className="text-xs text-muted-foreground">
                {compareCount} rental comparisons
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Map */}
      {allProperties.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Property Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardMap properties={allProperties} />
          </CardContent>
        </Card>
      )}

      {/* Property Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Property Analyzer Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Property Analyzer Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAnalyzer ? (
              <p className="text-muted-foreground">Loading properties...</p>
            ) : !analyzerProperties?.length ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No analyzed properties yet.</p>
                <Link href="/property-analyzer">
                  <Button variant="outline" className="text-primary hover:text-primary/80">
                    Analyze your first property
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {analyzerProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="font-medium">{property.address}</h3>
                      <p className="text-sm text-muted-foreground">
                        {property.bedrooms} bed • {property.bathrooms} bath
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                        <p className="text-xs text-muted-foreground">
                          ST Yield: {typeof property.shortTermGrossYield === 'number' ? `${property.shortTermGrossYield.toFixed(1)}%` : '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          LT Yield: {typeof property.longTermGrossYield === 'number' ? `${property.longTermGrossYield.toFixed(1)}%` : '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ST Revenue: {formatter.format(property.shortTermAfterFees)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          LT Revenue: {formatter.format(property.longTermMonthly * 12)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rent Compare Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar className="h-4 w-4 text-primary" />
              Rent Compare Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCompare ? (
              <p className="text-muted-foreground">Loading properties...</p>
            ) : !compareProperties?.length ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No comparison analyses yet.</p>
                <Link href="/rent-compare">
                  <Button variant="outline" className="text-primary hover:text-primary/80">
                    Compare your first property
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {compareProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="font-medium">{property.address}</h3>
                      <p className="text-sm text-muted-foreground">
                        {property.bedrooms} bed • {property.bathrooms} bath
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatter.format(property.longTermMonthly * 12)} /year
                      </p>
                      <p className="text-xs text-muted-foreground">
                        vs {formatter.format(property.shortTermAnnual)} short-term
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}