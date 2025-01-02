import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useProAccess } from "@/hooks/use-pro-access"; // Added import
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatter } from "../utils/formatting";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, ArrowUpRight, ArrowDownRight, Percent, Calculator, Home, ChartBar, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

export default function DashboardPage() {
  const { user } = useUser();
  const hasProAccess = useProAccess();
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch('/api/properties', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      return data;
    }
  });

  // Calculate portfolio metrics
  const metrics = properties?.reduce((acc, property) => {
    return {
      totalProperties: acc.totalProperties + 1,
      avgShortTerm: acc.avgShortTerm + property.shortTermAfterFees,
      avgLongTerm: acc.avgLongTerm + (property.longTermMonthly * 12),
      avgBreakEven: acc.avgBreakEven + property.breakEvenOccupancy,
      avgOccupancy: acc.avgOccupancy + property.annualOccupancy
    };
  }, {
    totalProperties: 0,
    avgShortTerm: 0,
    avgLongTerm: 0,
    avgBreakEven: 0,
    avgOccupancy: 0
  });

  if (metrics && metrics.totalProperties > 0) {
    metrics.avgShortTerm = metrics.avgShortTerm / metrics.totalProperties;
    metrics.avgLongTerm = metrics.avgLongTerm / metrics.totalProperties;
    metrics.avgBreakEven = metrics.avgBreakEven / metrics.totalProperties;
    metrics.avgOccupancy = metrics.avgOccupancy / metrics.totalProperties;
  }

  // Separate properties by rental strategy
  const shortTermProperties = properties?.filter(p => p.shortTermAfterFees > p.longTermMonthly * 12) || [];
  const longTermProperties = properties?.filter(p => p.shortTermAfterFees <= p.longTermMonthly * 12) || [];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName || user?.username}!</h1>

        {!hasProAccess && (
          <Button size="sm" variant="default" asChild className="bg-gradient-to-r from-[#1BA3FF] to-[#114D9D] text-white hover:opacity-90">
            <Link href="/pricing">
              <Sparkles className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Link>
          </Button>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card className="bg-gradient-to-br from-[#1BA3FF]/10 to-background hover:from-[#1BA3FF]/20 transition-colors cursor-pointer">
          <Link href="/property-analyzer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#1BA3FF]" />
                  <h3 className="font-medium">Property Analyzer</h3>
                </div>
                <ArrowRight className="h-4 w-4 text-[#1BA3FF]" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Analyze new investment opportunities
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-gradient-to-br from-[#1BA3FF]/10 to-background hover:from-[#1BA3FF]/20 transition-colors cursor-pointer">
          <Link href="/rent-compare">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChartBar className="h-5 w-5 text-[#1BA3FF]" />
                  <h3 className="font-medium">Rent Compare</h3>
                </div>
                <ArrowRight className="h-4 w-4 text-[#1BA3FF]" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Compare rental strategies
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-gradient-to-br from-[#1BA3FF]/10 to-background hover:from-[#1BA3FF]/20 transition-colors cursor-pointer">
          <Link href="/properties">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-[#1BA3FF]" />
                  <h3 className="font-medium">Properties</h3>
                </div>
                <ArrowRight className="h-4 w-4 text-[#1BA3FF]" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                View all analyzed properties
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Portfolio Metrics */}
      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalProperties || 0}</div>
            <p className="text-xs text-muted-foreground">
              Properties analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Short-Term Revenue</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatter.format(metrics.avgShortTerm) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per year after fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Long-Term Revenue</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatter.format(metrics.avgLongTerm) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per year
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Break-Even</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${metrics.avgBreakEven.toFixed(1)}%` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Required occupancy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Property Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Short-Term Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              Short-Term Rentals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading properties...</p>
            ) : !shortTermProperties.length ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No short-term rental properties yet.</p>
                <Link href="/property-analyzer">
                  <Button variant="outline" className="text-primary hover:text-primary/80">
                    Analyze your first property
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {shortTermProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="font-medium">{property.address}</h3>
                      <p className="text-sm text-muted-foreground">
                        {property.bedrooms} bed • {property.bathrooms} bath
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatter.format(property.shortTermAfterFees)} /year
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {property.annualOccupancy}% occupancy
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Long-Term Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-blue-500" />
              Long-Term Rentals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading properties...</p>
            ) : !longTermProperties.length ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No long-term rental properties yet.</p>
                <Link href="/property-analyzer">
                  <Button variant="outline" className="text-primary hover:text-primary/80">
                    Analyze your first property
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {longTermProperties.map((property) => (
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
                        {formatter.format(property.longTermMonthly)} /month
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