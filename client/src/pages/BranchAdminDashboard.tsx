import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Building2,
  FileText,
  Users,
} from "lucide-react";

interface BranchMetrics {
  totalAgents: number;
  listingsByStatus: {
    active: number;
    pending: number;
    sold: number;
    total: number;
  };
  reportsThisMonth: number;
  reportsLastMonth: number;
  branchName: string;
  agentReportCoverage: {
    agent_name: string;
    listings_count: number;
    reports_count: number;
    coverage: number; // percentage
  }[];
}

export default function BranchAdminDashboard() {
  const { user } = useUser();
  const [showCoverage, setShowCoverage] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<BranchMetrics>({
    queryKey: ["/api/branch/metrics", user?.branchId],
    queryFn: async () => {
      const response = await fetch(`/api/branch/${user?.branchId}/metrics`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    enabled: !!user?.branchId && user?.role === 'branch_admin',
  });

  // Show access denied if user is loaded but not branch admin
  if (user && user.role !== 'branch_admin') {
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

  // Show loading while user data is being fetched
  if (!user) {
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
              <div className="text-2xl font-bold">{metrics.listingsByStatus.total.toLocaleString()}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="default">{metrics.listingsByStatus.active} Active</Badge>
                <Badge variant="secondary">{metrics.listingsByStatus.pending} Pending</Badge>
                <Badge variant="outline">{metrics.listingsByStatus.sold} Sold</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Property listings for {metrics.branchName}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports This Month</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.reportsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Generated this month ({metrics.reportsLastMonth} last month)
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

        {/* Property Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Property Reports</CardTitle>
            <CardDescription>
              Agent performance with valuation reports (Active, Pending, Sold listings only)
            </CardDescription>
            <div className="flex items-center space-x-2 mt-4">
              <Switch
                id="coverage-toggle"
                checked={showCoverage}
                onCheckedChange={setShowCoverage}
              />
              <Label htmlFor="coverage-toggle">
                {showCoverage ? "Show Coverage %" : "Show Report Count"}
              </Label>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.agentReportCoverage.map((agent, index) => (
                <div key={agent.agent_name || index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{agent.agent_name}</span>
                      <Badge variant="secondary">
                        {agent.listings_count} listings
                      </Badge>
                    </div>
                    {showCoverage ? (
                      <span className="text-sm font-medium">{agent.coverage}%</span>
                    ) : (
                      <span className="text-sm font-medium">{agent.reports_count} reports</span>
                    )}
                  </div>
                  {showCoverage && (
                    <Progress value={agent.coverage} className="h-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}