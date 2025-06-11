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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
          </CardHeader>
          <CardContent>
            <div className="max-w-2xl">
              <Table>
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="py-2">Agent</TableHead>
                    <TableHead className="text-center py-2 w-20">Listings</TableHead>
                    <TableHead className="text-center py-2 w-20">Reports</TableHead>
                    <TableHead className="text-center py-2 w-24">Coverage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.agentReportCoverage.map((agent, index) => (
                    <TableRow key={agent.agent_name || index} className="h-8">
                      <TableCell className="font-medium py-1">
                        {agent.agent_name}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        {agent.listings_count}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        {agent.reports_count}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <Badge 
                          variant={agent.coverage > 50 ? "default" : agent.coverage > 20 ? "secondary" : "destructive"}
                          className="text-xs px-2 py-0"
                        >
                          {agent.coverage}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}