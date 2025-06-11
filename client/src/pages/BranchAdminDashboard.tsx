import { useQuery } from "@tanstack/react-query";
import { useUser, usePermissions } from "@/hooks/use-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  FileText,
  Users,
} from "lucide-react";

interface BranchMetrics {
  totalAgents: number;
  activeListings: number;
  reportsGenerated: number;
  branchName: string;
  agentReportCoverage: {
    agentName: string;
    listingsCount: number;
    reportsCount: number;
    coverage: number; // percentage
  }[];
}

export default function BranchAdminDashboard() {
  const { user } = useUser();
  const { isBranchAdmin } = usePermissions();

  const { data: metrics, isLoading: metricsLoading } = useQuery<BranchMetrics>({
    queryKey: ["/api/branch/metrics", user?.branchId],
    queryFn: async () => {
      const response = await fetch(`/api/branch/${user?.branchId}/metrics`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    enabled: !!user?.branchId,
  });

  // Redirect if not branch admin
  if (!isBranchAdmin()) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Access denied. Branch admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (metricsLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-20 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branch Dashboard</h1>
          <p className="text-muted-foreground">
            {metrics.branchName} - Key metrics overview
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeListings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Active property listings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports This Month</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.reportsGenerated}</div>
              <p className="text-xs text-muted-foreground">
                Generated this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                Active agents
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agent Report Coverage */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Report Coverage</CardTitle>
            <CardDescription>
              How many of each agent's listings have reports generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.agentReportCoverage.map((agent) => (
                <div key={agent.agentName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{agent.agentName}</span>
                      <Badge variant="secondary">
                        {agent.reportsCount}/{agent.listingsCount} listings
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{agent.coverage}%</span>
                  </div>
                  <Progress value={agent.coverage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}