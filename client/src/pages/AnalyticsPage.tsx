import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Loader2, BarChart3, FileText } from "lucide-react";
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

// API fetch function for report generation stats
const fetchReportStats = async () => {
  const response = await fetch('/api/report-generation-stats');
  if (!response.ok) {
    throw new Error('Failed to fetch report generation stats');
  }
  return response.json();
};

const AnalyticsDashboard = () => {
  const { data: agencyCount, isLoading, error } = useQuery({
    queryKey: ['agency-interactions'],
    queryFn: fetchAgencyInteractions,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: reportStats, isLoading: reportStatsLoading } = useQuery({
    queryKey: ['report-generation-stats'],
    queryFn: fetchReportStats,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#262626]">
          Analytics Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <Card className="w-full max-w-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {reportStatsLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold">{reportStats?.totalReports || 0}</div>
                <p className="text-xs text-muted-foreground">Total reports generated</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This month: {reportStats?.currentMonthReports || 0} reports
                </p>
                {reportStats?.topAgencies && reportStats.topAgencies.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Top agencies this month:</p>
                    {reportStats.topAgencies.slice(0, 3).map((agency: any) => (
                      <div key={agency.agencyName} className="text-xs text-muted-foreground">
                        {agency.agencyName}: {agency.reports} reports
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;