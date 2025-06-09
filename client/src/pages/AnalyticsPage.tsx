import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Loader2, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// API fetch function for agency interactions
const fetchAgencyInteractions = async () => {
  const response = await fetch('/api/agencies');
  if (!response.ok) {
    throw new Error('Failed to fetch agency data');
  }
  const data = await response.json();
  return data.agencies?.length || 0;
};



const AnalyticsDashboard = () => {
  const { data: agencyCount, isLoading, error } = useQuery({
    queryKey: ['agency-interactions'],
    queryFn: fetchAgencyInteractions,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });



  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#262626]">
          Analytics Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agency Interactions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-sm text-red-500">Failed to load</div>
            ) : (
              <div className="text-2xl font-bold">{agencyCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total agency connections
            </p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PriceLabs API Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {priceLabsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : priceLabsError ? (
              <div className="text-sm text-red-500">Failed to load</div>
            ) : (
              <div className="space-y-2">
                {priceLabsData?.monthlyUsage?.length > 0 ? (
                  priceLabsData.monthlyUsage.slice(0, 6).map((month: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{month.month.trim()}:</span>
                      <span className="font-semibold">{month.totalCalls} calls</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No API calls recorded yet</div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Monthly API call breakdown
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
