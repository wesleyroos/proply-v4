import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser, usePermissions } from "@/hooks/use-user";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Home,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Download,
} from "lucide-react";
import { format } from "date-fns";

interface BranchMetrics {
  totalAgents: number;
  activeListings: number;
  reportsGenerated: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
  branchName: string;
}

interface AgentPerformance {
  id: number;
  name: string;
  email: string;
  listingsCount: number;
  reportsThisMonth: number;
  lastActivity: string;
  status: 'active' | 'inactive';
}

interface RecentActivity {
  id: number;
  type: 'report_generated' | 'listing_added' | 'listing_updated';
  description: string;
  agentName: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface PropertyListing {
  id: number;
  address: string;
  price: number;
  propertyType: string;
  agentName: string;
  listingDate: string;
  reportGenerated: boolean;
  status: string;
}

export default function BranchAdminDashboard() {
  const { user } = useUser();
  const { isBranchAdmin } = usePermissions();

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

  const { data: agents, isLoading: agentsLoading } = useQuery<AgentPerformance[]>({
    queryKey: ["/api/branch/agents", user?.branchId],
    queryFn: async () => {
      const response = await fetch(`/api/branch/${user?.branchId}/agents`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch agents");
      return response.json();
    },
    enabled: !!user?.branchId,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<RecentActivity[]>({
    queryKey: ["/api/branch/activity", user?.branchId],
    queryFn: async () => {
      const response = await fetch(`/api/branch/${user?.branchId}/activity`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch activity");
      return response.json();
    },
    enabled: !!user?.branchId,
  });

  const { data: topListings, isLoading: listingsLoading } = useQuery<PropertyListing[]>({
    queryKey: ["/api/branch/top-listings", user?.branchId],
    queryFn: async () => {
      const response = await fetch(`/api/branch/${user?.branchId}/top-listings`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch listings");
      return response.json();
    },
    enabled: !!user?.branchId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'report_generated': return <FileText className="w-4 h-4" />;
      case 'listing_added': return <Home className="w-4 h-4" />;
      case 'listing_updated': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (metricsLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branch Dashboard</h1>
          <p className="text-muted-foreground">
            {metrics?.branchName || 'Branch'} Performance Overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Branch Admin
          </Badge>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalAgents || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeListings || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.reportsGenerated || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics?.monthlyRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.monthlyGrowth ? `+${metrics.monthlyGrowth}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">vs last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="listings">Top Listings</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Agent Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agentsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Active Listings</TableHead>
                      <TableHead>Reports (Month)</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents?.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">
                          {agent.name}
                        </TableCell>
                        <TableCell>{agent.email}</TableCell>
                        <TableCell>{agent.listingsCount}</TableCell>
                        <TableCell>{agent.reportsThisMonth}</TableCell>
                        <TableCell>
                          {format(new Date(agent.lastActivity), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(agent.status)}>
                            {agent.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No agent data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Top Performing Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {listingsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property Address</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Listed Date</TableHead>
                      <TableHead>Report</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topListings?.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell className="font-medium">
                          {listing.address}
                        </TableCell>
                        <TableCell>{formatCurrency(listing.price)}</TableCell>
                        <TableCell>{listing.propertyType}</TableCell>
                        <TableCell>{listing.agentName}</TableCell>
                        <TableCell>
                          {format(new Date(listing.listingDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={listing.reportGenerated ? "default" : "secondary"}>
                            {listing.reportGenerated ? "Generated" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3" />
                            </Button>
                            {listing.reportGenerated && (
                              <Button size="sm" variant="outline">
                                <Download className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No listing data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.agentName} • {format(new Date(activity.timestamp), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <Badge variant={activity.status === 'success' ? 'default' : 'destructive'}>
                        {activity.status}
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Branch Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Advanced analytics coming soon</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Detailed performance charts and insights for your branch
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}