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
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    active_count: number;
    pending_count: number;
    sold_count: number;
    archived_count: number;
    valuation_count: number;
    total_active_value: number;
    reports_count: number;
    coverage: number; // percentage
  }[];
}

type SortField = 'agent_name' | 'listings_count' | 'active_count' | 'pending_count' | 'sold_count' | 'archived_count' | 'valuation_count' | 'total_active_value' | 'reports_count' | 'coverage';
type SortDirection = 'asc' | 'desc';
type TimeFilter = '30' | '90' | '365' | 'all';

export default function BranchAdminDashboard() {
  const { user } = useUser();
  const [sortField, setSortField] = useState<SortField>('coverage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const { data: metrics, isLoading: metricsLoading, isFetching } = useQuery<BranchMetrics>({
    queryKey: ["/api/branch/metrics", user?.branchId, timeFilter],
    queryFn: async () => {
      const response = await fetch(`/api/branch/${user?.branchId}/metrics?timeFilter=${timeFilter}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    enabled: !!user?.branchId && user?.role === 'branch_admin',
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const sortedAgents = metrics?.agentReportCoverage.slice().sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'agent_name':
        aValue = a.agent_name || '';
        bValue = b.agent_name || '';
        // Always treat names as strings
        return sortDirection === 'asc' 
          ? (aValue as string).localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue as string);
      case 'listings_count':
        aValue = Number(a.listings_count) || 0;
        bValue = Number(b.listings_count) || 0;
        break;
      case 'active_count':
        aValue = Number(a.active_count) || 0;
        bValue = Number(b.active_count) || 0;
        break;
      case 'pending_count':
        aValue = Number(a.pending_count) || 0;
        bValue = Number(b.pending_count) || 0;
        break;
      case 'sold_count':
        aValue = Number(a.sold_count) || 0;
        bValue = Number(b.sold_count) || 0;
        break;
      case 'archived_count':
        aValue = Number(a.archived_count) || 0;
        bValue = Number(b.archived_count) || 0;
        break;
      case 'valuation_count':
        aValue = Number(a.valuation_count) || 0;
        bValue = Number(b.valuation_count) || 0;
        break;
      case 'total_active_value':
        aValue = Number(a.total_active_value) || 0;
        bValue = Number(b.total_active_value) || 0;
        break;
      case 'reports_count':
        aValue = Number(a.reports_count) || 0;
        bValue = Number(b.reports_count) || 0;
        break;
      case 'coverage':
        aValue = Number(a.coverage) || 0;
        bValue = Number(b.coverage) || 0;
        break;
      default:
        return 0;
    }

    // For numeric fields
    if (sortField !== 'agent_name') {
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }

    return 0;
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Property Reports</CardTitle>
                <CardDescription>
                  Agent performance with valuation reports across all listing statuses
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={timeFilter === '30' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('30')}
                  disabled={isFetching}
                >
                  {isFetching && timeFilter === '30' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Last 30 Days
                </Button>
                <Button
                  variant={timeFilter === '90' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('90')}
                  disabled={isFetching}
                >
                  {isFetching && timeFilter === '90' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Last 90 Days
                </Button>
                <Button
                  variant={timeFilter === '365' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('365')}
                  disabled={isFetching}
                >
                  {isFetching && timeFilter === '365' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Last Year
                </Button>
                <Button
                  variant={timeFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter('all')}
                  disabled={isFetching}
                >
                  {isFetching && timeFilter === 'all' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  All Time
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className={isFetching ? "opacity-60 transition-opacity duration-200" : "transition-opacity duration-200"}>
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead 
                      className="py-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('agent_name')}
                    >
                      <div className="flex items-center gap-1">
                        Agent
                        {getSortIcon('agent_name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center py-2 w-16 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('listings_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Total
                        {getSortIcon('listings_count')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center py-2 w-16 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('active_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Active
                        {getSortIcon('active_count')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center py-2 w-16 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('pending_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Pending
                        {getSortIcon('pending_count')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center py-2 w-16 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('sold_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Sold
                        {getSortIcon('sold_count')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center py-2 w-16 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('archived_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Archived
                        {getSortIcon('archived_count')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center py-2 w-16 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('valuation_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Valuation
                        {getSortIcon('valuation_count')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center py-2 w-24 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('total_active_value')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Active Value
                        {getSortIcon('total_active_value')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center py-2 w-16 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('reports_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Reports
                        {getSortIcon('reports_count')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center py-2 w-20 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('coverage')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Coverage
                        {getSortIcon('coverage')}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAgents?.map((agent, index) => (
                    <TableRow key={agent.agent_name || index} className="h-8">
                      <TableCell className="font-medium py-1">
                        {agent.agent_name}
                      </TableCell>
                      <TableCell className="text-center py-1 font-medium">
                        {agent.listings_count}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        {agent.active_count}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        {agent.pending_count}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        {agent.sold_count}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        {agent.archived_count}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        {agent.valuation_count}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <div className="text-sm font-medium">
                          {(() => {
                            const value = Number(agent.total_active_value) || 0;
                            if (value === 0) return 'R0';
                            const millions = value / 1000000;
                            return `R${millions.toFixed(1)}M`;
                          })()}
                        </div>
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