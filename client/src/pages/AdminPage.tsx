import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { SelectUser } from "@db/schema";
import NotificationsMenu from "@/components/NotificationsMenu";
import { Switch } from "@/components/ui/switch";

// Components imports
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Icons
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
  CreditCard,
} from "lucide-react";

// Utils
import { cn } from "@/lib/utils";

// Types
interface AdminUser extends SelectUser {
  isAdmin: boolean;
  accessCode: string | null;
  accessCodeUsedAt: string | null;
  pricelabsApiCallsTotal: number;
  pricelabsApiCallsMonth: number;
  reportsGenerated: number;
  lastLoginAt: string | null;
  profileCreatedAt: string | null;
  rcReports: number;
  paReports: number;
  rcApiCalls: number;
  paApiCalls: number;
  propertyCount: number; // Add this line
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

const StatCard = ({
  title,
  icon: Icon,
  mainValue,
  subValue,
}: {
  title: string;
  icon: any;
  mainValue: string | number;
  subValue: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{mainValue}</div>
      <div className="text-xs text-muted-foreground">{subValue}</div>
    </CardContent>
  </Card>
);

export default function AdminPage() {
  const { user, clearCache } = useUser();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "reportsGenerated",
    direction: "desc",
  });
  const [isSandboxMode, setIsSandboxMode] = useState(() => {
    return localStorage.getItem('payfast_sandbox_mode') === 'true';
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
      return sortConfig.direction === "asc"
        ? aValue < bValue ? -1 : 1
        : aValue > bValue ? -1 : 1;
    });
  };

  const handleSort = (key: keyof AdminUser) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIndicator = ({ column }: { column: keyof AdminUser }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  const handleSandboxToggle = (checked: boolean) => {
    const newMode = checked ? 'Sandbox' : 'Live';
    const currentMode = isSandboxMode ? 'Sandbox' : 'Live';
    
    if (window.confirm(`Are you sure you want to switch from ${currentMode} to ${newMode} mode? This will affect how payments are processed.`)) {
      localStorage.setItem('payfast_sandbox_mode', checked.toString());
      setIsSandboxMode(checked);
      toast({
        title: "PayFast Mode Changed",
        description: `Switched to ${newMode} mode`,
        duration: 3000,
      });
    } else {
      // Reset the switch to its previous state if user cancels
      setIsSandboxMode(!checked);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">You do not have access to this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 space-y-6 container p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">User Management</h1>
          {user?.isAdmin && <NotificationsMenu />}
        </div>

        {/* PayFast Sandbox Toggle Card */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-yellow-800">PayFast Payment Mode</CardTitle>
                <CardDescription className="text-yellow-700">
                  Toggle between sandbox and live payment environments
                </CardDescription>
              </div>
              <div className="flex items-center space-x-3">
                <span className={cn(
                  "text-sm font-medium",
                  isSandboxMode ? "text-yellow-600" : "text-green-600"
                )}>
                  {isSandboxMode ? 'Sandbox Mode' : 'Live Mode'}
                </span>
                <Switch
                  checked={isSandboxMode}
                  onCheckedChange={handleSandboxToggle}
                  className="data-[state=checked]:bg-yellow-600"
                />
                <CreditCard className={cn(
                  "h-5 w-5",
                  isSandboxMode ? "text-yellow-600" : "text-green-600"
                )} />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            icon={Users}
            mainValue={statsLoading ? "..." : stats?.totalUsers}
            subValue={
              statsLoading
                ? "..."
                : `${stats?.proUsers} Pro • ${stats?.freeUsers} Free`
            }
          />
          <StatCard
            title="User Types"
            icon={Building2}
            mainValue={
              statsLoading
                ? "..."
                : (stats?.corporateUsers ?? 0) + (stats?.individualUsers ?? 0)
            }
            subValue={
              statsLoading
                ? "..."
                : `${stats?.corporateUsers} Corporate • ${stats?.individualUsers} Individual`
            }
          />
          <StatCard
            title="API Usage"
            icon={Crown}
            mainValue={statsLoading ? "..." : stats?.monthlyApiCalls}
            subValue={`${statsLoading ? "..." : stats?.totalApiCalls} total calls`}
          />
          <StatCard
            title="Report Generation"
            icon={FileText}
            mainValue={statsLoading ? "..." : stats?.monthlyReportsGenerated}
            subValue={`${
              statsLoading ? "..." : stats?.totalReportsGenerated
            } total reports`}
          />
        </div>

        {/* Users Table Card */}
        <Card className="overflow-hidden">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Actions <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        Promise.all([refetchUsers(), refetchStats()]);
                      }}
                      className={cn(
                        (usersLoading || statsLoading) && "animate-spin",
                      )}
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Refresh Data
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        if (
                          window.confirm("This will log out all users. Are you sure?")
                        ) {
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
          <CardContent className="p-0">
            {usersLoading ? (
              <p className="text-muted-foreground p-4">Loading users...</p>
            ) : (
              <div className="relative border rounded-md">
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            onClick={() => handleSort("id")}
                            className="cursor-pointer"
                          >
                            ID <SortIndicator column="id" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort("email")}
                            className="cursor-pointer"
                          >
                            Email <SortIndicator column="email" />
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead
                            onClick={() => handleSort("userType")}
                            className="cursor-pointer"
                          >
                            User Type <SortIndicator column="userType" />
                          </TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead
                            onClick={() => handleSort("subscriptionStatus")}
                            className="cursor-pointer"
                          >
                            Plan <SortIndicator column="subscriptionStatus" />
                          </TableHead>
                          <TableHead>Access Code</TableHead>
                          <TableHead>Redeemed At</TableHead>
                          <TableHead
                            onClick={() => handleSort("pricelabsApiCallsTotal")}
                            className="cursor-pointer min-w-[200px]"
                          >
                            API Usage{" "}
                            <SortIndicator column="pricelabsApiCallsTotal" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort("reportsGenerated")}
                            className="cursor-pointer"
                          >
                            Reports <SortIndicator column="reportsGenerated" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort("lastLoginAt")}
                            className="cursor-pointer"
                          >
                            Last Login <SortIndicator column="lastLoginAt" />
                          </TableHead>
                          <TableHead>Status Details</TableHead>
                          <TableHead
                            onClick={() => handleSort("profileCreatedAt")}
                            className="cursor-pointer whitespace-nowrap"
                          >
                            Profile Creation Date{" "}
                            <SortIndicator column="profileCreatedAt" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort("rcReports")}
                            className="cursor-pointer whitespace-nowrap"
                          >
                            RC Reports <SortIndicator column="rcReports" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort("paReports")}
                            className="cursor-pointer whitespace-nowrap"
                          >
                            PA Reports <SortIndicator column="paReports" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort("rcApiCalls")}
                            className="cursor-pointer whitespace-nowrap"
                          >
                            RC API <SortIndicator column="rcApiCalls" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort("paApiCalls")}
                            className="cursor-pointer whitespace-nowrap"
                          >
                            PA API <SortIndicator column="paApiCalls" />
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort("propertyCount")}
                            className="cursor-pointer whitespace-nowrap"
                          >
                            PA Properties <SortIndicator column="propertyCount" />
                          </TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterAndSortData(users || []).map((userData) => (
                          <TableRow key={userData.id}>
                            <TableCell>{userData.id}</TableCell>
                            <TableCell>{userData.email}</TableCell>
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
                            <TableCell>{userData.accessCode || "-"}</TableCell>
                            <TableCell>
                              {userData.accessCodeUsedAt
                                ? new Date(
                                    userData.accessCodeUsedAt,
                                  ).toLocaleDateString()
                                : "-"}
                            </TableCell>
                            <TableCell className="min-w-[200px]">
                              <span className="text-xs">
                                {userData.pricelabsApiCallsMonth} calls this month
                                <br />
                                {userData.pricelabsApiCallsTotal} total calls
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-medium">
                                {userData.reportsGenerated || 0} reports
                              </span>
                            </TableCell>
                            <TableCell>
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
                              {userData.profileCreatedAt
                                ? new Date(userData.profileCreatedAt).toLocaleString()
                                : "N/A"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {userData.rcReports || 0}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {userData.paReports || 0}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {userData.rcApiCalls || 0}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {userData.paApiCalls || 0}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {userData.propertyCount || 0}
                            </TableCell>
                            <TableCell>
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
                                          userData.subscriptionStatus === "suspended"
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}