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
  ShieldAlert,
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
  accessCodeUsedAt: string | null;
  pricelabsApiCallsTotal: number;
  pricelabsApiCallsMonth: number;
  reportsGenerated: number;
  lastLoginAt: string | null;
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
  const { user } = useUser();
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
    onSuccess: (data, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: data.message || "User updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update user",
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
        description:
          error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="container py-6">
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
          user.userType?.toLowerCase().includes(query),
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
    <div className="w-full p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        {user?.isAdmin && <NotificationsMenu />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.totalUsers}
            </div>
            <div className="text-xs text-muted-foreground">
              {statsLoading
                ? "..."
                : `${stats?.proUsers} Pro • ${stats?.freeUsers} Free`}
            </div>
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
            <div className="text-xs text-muted-foreground">
              {statsLoading
                ? "..."
                : `${stats?.corporateUsers} Corporate • ${stats?.individualUsers} Individual`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Usage</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.monthlyApiCalls}
                </div>
                <div className="text-xs text-muted-foreground">
                  Calls this month
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.totalApiCalls}
                </div>
                <div className="text-xs text-muted-foreground">Total calls</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Report Generation
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.monthlyReportsGenerated}
                </div>
                <div className="text-xs text-muted-foreground">
                  Reports this month
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stats?.totalReportsGenerated || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total reports
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  // Refetch both queries concurrently
                  Promise.all([refetchUsers(), refetchStats()]);
                }}
                className={cn(
                  "transition-transform",
                  (usersLoading || statsLoading) && "animate-spin",
                )}
              >
                <RefreshCcw className="h-4 w-4" />
                <span className="sr-only">Refresh data</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            {usersLoading ? (
              <p className="text-muted-foreground p-4">Loading users...</p>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <div className="min-w-[1500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          onClick={() => handleSort("id")}
                          className="cursor-pointer whitespace-nowrap min-w-[80px]"
                        >
                          ID <SortIndicator column="id" />
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("email")}
                          className="cursor-pointer whitespace-nowrap min-w-[200px]"
                        >
                          Email <SortIndicator column="email" />
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[200px]">
                          Name
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("userType")}
                          className="cursor-pointer whitespace-nowrap min-w-[120px]"
                        >
                          User Type <SortIndicator column="userType" />
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[150px]">
                          Company
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("subscriptionStatus")}
                          className="cursor-pointer whitespace-nowrap min-w-[100px]"
                        >
                          Plan <SortIndicator column="subscriptionStatus" />
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[120px]">
                          Access Code
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[120px]">
                          Redeemed At
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("pricelabsApiCallsTotal")}
                          className="cursor-pointer whitespace-nowrap min-w-[150px]"
                        >
                          API Usage{" "}
                          <SortIndicator column="pricelabsApiCallsTotal" />
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("reportsGenerated")}
                          className="cursor-pointer whitespace-nowrap min-w-[120px]"
                        >
                          Reports <SortIndicator column="reportsGenerated" />
                        </TableHead>
                        <TableHead
                          onClick={() => handleSort("lastLoginAt")}
                          className="cursor-pointer whitespace-nowrap min-w-[150px]"
                        >
                          Last Login <SortIndicator column="lastLoginAt" />
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[200px]">
                          Status Details
                        </TableHead>
                        <TableHead className="whitespace-nowrap min-w-[100px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterAndSortData(users || []).map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell className="whitespace-nowrap">
                            {userData.id}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {userData.email}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {userData.firstName} {userData.lastName}
                          </TableCell>
                          <TableCell className="capitalize whitespace-nowrap">
                            {userData.userType}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {userData.company || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-xs font-medium",
                                userData.isAdmin ||
                                  userData.subscriptionStatus === "pro"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800",
                              )}
                            >
                              {userData.isAdmin ||
                              userData.subscriptionStatus === "pro"
                                ? "Pro"
                                : "Free"}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {userData.accessCode || "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {userData.accessCodeUsedAt
                              ? new Date(
                                  userData.accessCodeUsedAt,
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-xs">
                              {userData.pricelabsApiCallsMonth} calls this month
                              <br />
                              {userData.pricelabsApiCallsTotal} total calls
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-xs font-medium">
                              {userData.reportsGenerated || 0} reports
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {userData.lastLoginAt
                              ? new Date(userData.lastLoginAt).toLocaleString()
                              : "Never"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {userData.subscriptionStatus === "pro" &&
                              userData.subscriptionExpiryDate && (
                                <span className="block text-xs">
                                  Subscription expires:{" "}
                                  {new Date(
                                    userData.subscriptionExpiryDate,
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            {userData.isAdmin && (
                              <span className="block text-xs text-blue-600 font-medium">
                                Full admin access
                              </span>
                            )}
                            {!userData.isAdmin &&
                              userData.subscriptionStatus !== "pro" &&
                              !userData.accessCode && (
                                <span className="block text-xs text-gray-500">
                                  Free plan
                                </span>
                              )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
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
                                  disabled={
                                    userData.isAdmin ||
                                    userData.id === user?.id ||
                                    userData.subscriptionStatus === "pro"
                                  }
                                >
                                  <Shield className="h-4 w-4 mr-2" />
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
                                  disabled={
                                    userData.isAdmin ||
                                    userData.id === user?.id ||
                                    userData.subscriptionStatus === "free"
                                  }
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Downgrade to Free
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    userActionMutation.mutate({
                                      userId: userData.id,
                                      action:
                                        userData.subscriptionStatus ===
                                        "suspended"
                                          ? "unsuspend"
                                          : "suspend",
                                    })
                                  }
                                  disabled={
                                    userData.isAdmin || userData.id === user?.id
                                  }
                                  className={
                                    userData.subscriptionStatus === "suspended"
                                      ? "text-green-600"
                                      : "text-yellow-600"
                                  }
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  {userData.subscriptionStatus === "suspended"
                                    ? "Unsuspend"
                                    : "Suspend"}
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      disabled={
                                        userData.isAdmin ||
                                        userData.id === user?.id
                                      }
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
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
                                        permanently delete the user account and
                                        all associated data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
