import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import {
  Ban,
  Trash2,
  Users,
  Building2,
  Crown,
  MoreHorizontal,
  Shield,
  Settings,
  FileText,
  ChevronUp,
  ChevronDown,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectUser } from "@db/schema";
import NotificationsMenu from "@/components/NotificationsMenu";

interface AdminUser extends SelectUser {
  isAdmin: boolean;
  accessCode: string | null;
  accessCodeUsedAt: Date | null;
  pricelabsApiCallsTotal: number;
  pricelabsApiCallsMonth: number;
  reportsGenerated: number;
  lastLoginAt: Date | null;
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  proUsers: number;
  freeUsers: number;
  corporateUsers: number;
  individualUsers: number;
  monthlyApiCalls: number;
  totalApiCalls: number;
  totalReportsGenerated: number;
  monthlyReportsGenerated: number;
}

type SortConfig = {
  key: keyof AdminUser | "";
  direction: "asc" | "desc";
};

export default function AdminPage() {
  const { user, clearCache } = useUser();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "reportsGenerated",
    direction: "desc",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: users,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<UserStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user?.isAdmin,
  });

  const userActionMutation = useMutation({
    mutationFn: async ({
      userId,
      action,
      plan,
    }: {
      userId: number;
      action: "suspend" | "unsuspend" | "change-plan";
      plan?: "free" | "pro";
    }) => {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: plan ? { "Content-Type": "application/json" } : undefined,
        body: plan ? JSON.stringify({ plan }) : undefined,
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: data.message || "User updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: data.message || "User deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              You do not have access to this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filterAndSortData = (data: AdminUser[]) => {
    let filteredData = data;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = data.filter(
        (user) =>
          user.email?.toLowerCase().includes(query) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
          user.company?.toLowerCase().includes(query) ||
          user.userType?.toLowerCase().includes(query)
      );
    }

    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      if (sortConfig.key === "") return 0;

      const aValue = a[sortConfig.key] ?? "";
      const bValue = b[sortConfig.key] ?? "";

      if (aValue === bValue) return 0;

      if (sortConfig.direction === "asc") {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });
  };

  const handleSort = (key: keyof AdminUser) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "desc" };
    });
  };

  const SortIndicator = ({ column }: { column: keyof AdminUser }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          {user?.isAdmin && <NotificationsMenu />}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalUsers}
              </div>
              <p className="text-xs text-muted-foreground">
                {statsLoading
                  ? "..."
                  : `${stats?.proUsers} Pro • ${stats?.freeUsers} Free`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Types</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading
                  ? "..."
                  : (stats?.corporateUsers ?? 0) + (stats?.individualUsers ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {statsLoading
                  ? "..."
                  : `${stats?.corporateUsers} Corporate • ${stats?.individualUsers} Individual`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Usage</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.monthlyApiCalls}
              </div>
              <p className="text-xs text-muted-foreground">
                {`${statsLoading ? "..." : stats?.totalApiCalls} total calls`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.monthlyReportsGenerated}
              </div>
              <p className="text-xs text-muted-foreground">
                {`${statsLoading ? "..." : stats?.totalReportsGenerated} total reports`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table Card */}
        <Card className="mt-8">
          <CardHeader className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>All Users</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Actions <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        Promise.all([refetchUsers(), refetchStats()]);
                      }}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (window.confirm('This will log out all users. Are you sure?')) {
                          clearCache();
                        }
                      }}
                      className="text-destructive"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Clear Cache
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <div className="relative overflow-hidden">
            <div className="overflow-x-auto border-t">
              <div className="inline-block min-w-full align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        onClick={() => handleSort("id")}
                        className="cursor-pointer bg-muted/50"
                      >
                        ID <SortIndicator column="id" />
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("email")}
                        className="cursor-pointer bg-muted/50"
                      >
                        Email <SortIndicator column="email" />
                      </TableHead>
                      <TableHead className="bg-muted/50">Name</TableHead>
                      <TableHead className="bg-muted/50">User Type</TableHead>
                      <TableHead className="bg-muted/50">Company</TableHead>
                      <TableHead
                        onClick={() => handleSort("subscriptionStatus")}
                        className="cursor-pointer bg-muted/50"
                      >
                        Plan <SortIndicator column="subscriptionStatus" />
                      </TableHead>
                      <TableHead className="bg-muted/50">Access Code</TableHead>
                      <TableHead className="bg-muted/50">Redeemed At</TableHead>
                      <TableHead
                        onClick={() => handleSort("pricelabsApiCallsTotal")}
                        className="cursor-pointer bg-muted/50 text-right"
                      >
                        API Usage <SortIndicator column="pricelabsApiCallsTotal" />
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("reportsGenerated")}
                        className="cursor-pointer bg-muted/50 text-right"
                      >
                        Reports <SortIndicator column="reportsGenerated" />
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort("lastLoginAt")}
                        className="cursor-pointer bg-muted/50"
                      >
                        Last Login <SortIndicator column="lastLoginAt" />
                      </TableHead>
                      <TableHead className="bg-muted/50">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={12}
                          className="h-24 text-center"
                        >
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : (
                      filterAndSortData(users || []).map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell>{userData.id}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {userData.email}
                          </TableCell>
                          <TableCell>
                            {userData.firstName} {userData.lastName}
                          </TableCell>
                          <TableCell className="capitalize">
                            {userData.userType}
                          </TableCell>
                          <TableCell>{userData.company || "-"}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                userData.subscriptionStatus === "pro"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              )}
                            >
                              {userData.subscriptionStatus === "pro" ? "Pro" : "Free"}
                            </span>
                          </TableCell>
                          <TableCell>{userData.accessCode || "-"}</TableCell>
                          <TableCell>
                            {userData.accessCodeUsedAt
                              ? new Date(userData.accessCodeUsedAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs">
                              {userData.pricelabsApiCallsMonth} / mo
                              <br />
                              {userData.pricelabsApiCallsTotal} total
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {userData.reportsGenerated || 0}
                          </TableCell>
                          <TableCell>
                            {userData.lastLoginAt
                              ? new Date(userData.lastLoginAt).toLocaleString()
                              : "Never"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[200px]">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    userActionMutation.mutate({
                                      userId: userData.id,
                                      action: "change-plan",
                                      plan: "pro",
                                    })
                                  }
                                  disabled={userData.subscriptionStatus === "pro"}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Upgrade to Pro
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    userActionMutation.mutate({
                                      userId: userData.id,
                                      action: "change-plan",
                                      plan: "free",
                                    })
                                  }
                                  disabled={userData.subscriptionStatus !== "pro"}
                                >
                                  <Settings className="mr-2 h-4 w-4" />
                                  Downgrade to Free
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete User
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Are you sure?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete the user account and all
                                        associated data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          deleteMutation.mutate(userData.id)
                                        }
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}