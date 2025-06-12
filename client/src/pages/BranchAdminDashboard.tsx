import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useRef, useEffect } from "react";
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
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  newListingsThisMonth: number;
  newListingsLastMonth: number;
  listingsPerMonth: {
    month: string;
    count: number;
  }[];
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
  const [persistedData, setPersistedData] = useState<BranchMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Keep previous data visible during transitions
  useEffect(() => {
    if (metrics && !isFetching) {
      setPersistedData(metrics);
    }
  }, [metrics, isFetching]);

  // Use persisted data when fetching new data
  const displayData = isFetching && persistedData ? persistedData : metrics;

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

  const filteredAndSortedAgents = displayData?.agentReportCoverage
    ?.filter(agent => 
      agent.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false
    )
    ?.slice()
    .sort((a, b) => {
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
      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
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

  if (!displayData) {
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
            {displayData.branchName} - Key metrics overview
          </p>
        </div>

        {/* Key Metrics Cards - Compact 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Total Listings</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{displayData.listingsByStatus.total.toLocaleString()}</div>
              <div className="flex gap-1 mt-1 flex-wrap">
                <Badge variant="default" className="text-xs px-1.5 py-0.5">{displayData.listingsByStatus.active} Active</Badge>
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">{displayData.listingsByStatus.pending} Pending</Badge>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">{displayData.listingsByStatus.sold} Sold</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">New Listings</CardTitle>
              <Plus className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{displayData.newListingsThisMonth}</div>
              <div className="flex items-center gap-1 mt-1">
                {displayData.newListingsThisMonth >= displayData.newListingsLastMonth ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <p className="text-xs text-muted-foreground">
                  {displayData.newListingsLastMonth} last month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Reports Generated</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{displayData.reportsThisMonth}</div>
              <div className="flex items-center gap-1 mt-1">
                {displayData.reportsThisMonth >= displayData.reportsLastMonth ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <p className="text-xs text-muted-foreground">
                  {displayData.reportsLastMonth} last month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{displayData.totalAgents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                With property listings
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
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search agents by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
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
                  {filteredAndSortedAgents?.map((agent, index) => (
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