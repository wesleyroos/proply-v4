import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatter } from "../utils/formatting";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, ArrowUpRight, ArrowDownRight, Percent } from "lucide-react";

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

  // Prepare data for the revenue comparison chart
  const chartData = properties?.map(property => ({
    name: property.title,
    shortTerm: property.shortTermAfterFees,
    longTerm: property.longTermMonthly * 12
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Welcome, {user?.firstName || user?.username}!</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
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

      {/* Revenue Comparison Chart */}
      {properties && properties.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Revenue Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatter.format(value)}
                  />
                  <Bar dataKey="shortTerm" name="Short-Term" fill="#22c55e" />
                  <Bar dataKey="longTerm" name="Long-Term" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Properties</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading properties...</p>
          ) : !properties?.length ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No properties analyzed yet.</p>
              <Link href="/compare">
                <button className="text-primary hover:underline">
                  Compare your first property
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.slice(0, 5).map((property) => (
                <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{property.title}</h3>
                    <p className="text-sm text-muted-foreground">{property.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {property.bedrooms} bed • {property.bathrooms} bath
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ST: {formatter.format(property.shortTermAfterFees)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      LT: {formatter.format(property.longTermMonthly * 12)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
