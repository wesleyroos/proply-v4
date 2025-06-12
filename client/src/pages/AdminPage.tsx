import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { SelectUser } from "@db/schema";
import NotificationsMenu from "@/components/NotificationsMenu";
import { Switch } from "@/components/ui/switch";
import { AdminInvitationModal } from "@/components/AdminInvitationModal";
import { PendingInvitations } from "@/components/PendingInvitations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  UserPlus,
} from "lucide-react";

// Utils
import { cn } from "@/lib/utils";

// Types
interface AdminUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  userType: string;
  subscriptionStatus: string;
  role: string;
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
  propertyCount: number;
  rentCompareCount: number;
  suspended?: boolean;
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
  totalProperties: number;
  paProperties: number;
  rcProperties: number;
  activePayfastSubscriptions: number;
  manuallyUpgradedPro: number;
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
    <CardContent className="p-6">
      <div className="flex items-center space-x-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{mainValue}</p>
        <p className="text-sm text-muted-foreground">{subValue}</p>
      </div>
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
  const [isYocoTestMode, setIsYocoTestMode] = useState(() => {
    return localStorage.getItem('yoco_test_mode') === 'true';
  });
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

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
      action: "suspend" | "unsuspend" | "change-plan" | "send-reset-link" | "delete";
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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const handleSort = (key: keyof AdminUser) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const SortIndicator = ({ column }: { column: keyof AdminUser }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === "asc" ? 
      <ChevronUp className="inline h-4 w-4" /> : 
      <ChevronDown className="inline h-4 w-4" />;
  };

  const handleSandboxToggle = (checked: boolean) => {
    const message = checked 
      ? "Enable PayFast sandbox mode? This will use test payment processing."
      : "Disable PayFast sandbox mode? This will use live payment processing.";
    
    if (window.confirm(message)) {
      setIsSandboxMode(checked);
      localStorage.setItem('payfast_sandbox_mode', checked.toString());
      toast({
        title: checked ? "Sandbox Mode Enabled" : "Sandbox Mode Disabled",
        description: checked 
          ? "PayFast is now in test mode - no real payments will be processed."
          : "PayFast is now in live mode - real payments will be processed.",
        duration: 3000,
      });
    } else {
      setIsSandboxMode(!checked);
    }
  };

  const handleYocoTestToggle = (checked: boolean) => {
    const message = checked 
      ? "Enable Yoco test mode? This will use test payment processing for agency billing."
      : "Disable Yoco test mode? This will use live payment processing for agency billing.";
    
    if (window.confirm(message)) {
      setIsYocoTestMode(checked);
      localStorage.setItem('yoco_test_mode', checked.toString());
      toast({
        title: checked ? "Yoco Test Mode Enabled" : "Yoco Test Mode Disabled",
        description: checked 
          ? "Yoco is now in test mode - agency billing will use test credentials."
          : "Yoco is now in live mode - agency billing will use live credentials.",
        duration: 3000,
      });
    } else {
      setIsYocoTestMode(!checked);
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
          <CardHeader>
            <CardTitle className="text-yellow-800">PayFast Environment</CardTitle>
            <CardDescription className="text-yellow-700">
              Control whether PayFast operates in sandbox (test) or live mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="sandbox-mode"
                checked={isSandboxMode}
                onCheckedChange={handleSandboxToggle}
              />
              <label htmlFor="sandbox-mode" className="text-sm font-medium text-yellow-800">
                {isSandboxMode ? "Sandbox Mode (Test)" : "Live Mode (Production)"}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Yoco Test Mode Toggle Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Yoco Environment</CardTitle>
            <CardDescription className="text-blue-700">
              Control whether Yoco operates in test or live mode for agency billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="yoco-test-mode"
                checked={isYocoTestMode}
                onCheckedChange={handleYocoTestToggle}
              />
              <label htmlFor="yoco-test-mode" className="text-sm font-medium text-blue-800">
                {isYocoTestMode ? "Test Mode (Agency Billing)" : "Live Mode (Agency Billing)"}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total Users"
            icon={Users}
            mainValue={statsLoading ? "..." : stats?.totalUsers || 0}
            subValue={
              statsLoading
                ? "..."
                : `${stats?.proUsers || 0} Pro • ${stats?.freeUsers || 0} Free`
            }
          />
          <StatCard
            title="User Types"
            icon={Building2}
            mainValue={
              statsLoading
                ? "..."
                : (stats?.corporateUsers || 0) + (stats?.individualUsers || 0)
            }
            subValue={
              statsLoading
                ? "..."
                : `${stats?.corporateUsers || 0} Corporate • ${stats?.individualUsers || 0} Individual`
            }
          />
          <StatCard
            title="API Usage"
            icon={Crown}
            mainValue={statsLoading ? "..." : stats?.monthlyApiCalls || 0}
            subValue={`${statsLoading ? "..." : stats?.totalApiCalls || 0} total calls`}
          />
          <StatCard
            title="Report Generation"
            icon={FileText}
            mainValue={statsLoading ? "..." : stats?.monthlyReportsGenerated || 0}
            subValue={`${
              statsLoading ? "..." : stats?.totalReportsGenerated || 0
            } total reports`}
          />
          <StatCard
            title="Pro Subscriptions"
            icon={CreditCard}
            mainValue={statsLoading ? "..." : stats?.activePayfastSubscriptions || 0}
            subValue={`${
              statsLoading ? "..." : stats?.manuallyUpgradedPro || 0
            } manually upgraded`}
          />
          <StatCard
            title="Total Properties"
            icon={Building2}
            mainValue={statsLoading ? "..." : stats?.totalProperties || 0}
            subValue={statsLoading 
              ? "..." 
              : `${stats?.paProperties || 0} PA • ${stats?.rcProperties || 0} RC`}
          />
        </div>

        {/* Users Management Card */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsInvitationModalOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
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
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="mt-4">
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
                                onClick={() => handleSort("role")}
                                className="cursor-pointer"
                              >
                                Role <SortIndicator column="role" />
                              </TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead
                                onClick={() => handleSort("subscriptionStatus")}
                                className="cursor-pointer"
                              >
                                Plan <SortIndicator column="subscriptionStatus" />
                              </TableHead>
                              <TableHead>Access Code</TableHead>
                              <TableHead
                                onClick={() => handleSort("reportsGenerated")}
                                className="cursor-pointer"
                              >
                                Reports <SortIndicator column="reportsGenerated" />
                              </TableHead>
                              <TableHead
                                onClick={() => handleSort("pricelabsApiCallsTotal")}
                                className="cursor-pointer"
                              >
                                API Calls <SortIndicator column="pricelabsApiCallsTotal" />
                              </TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedUsers.map((user) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.id}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  {user.firstName || user.lastName
                                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                    : "—"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {user.role === "system_admin" && (
                                      <Shield className="h-4 w-4 text-red-600" />
                                    )}
                                    {user.role === "franchise_admin" && (
                                      <Building2 className="h-4 w-4 text-blue-600" />
                                    )}
                                    {user.role === "branch_admin" && (
                                      <Users className="h-4 w-4 text-green-600" />
                                    )}
                                    {!user.role && <Users className="h-4 w-4 text-gray-400" />}
                                    <span className={cn(
                                      "px-2 py-1 rounded-full text-xs font-medium",
                                      user.role === "system_admin" && "bg-red-100 text-red-800",
                                      user.role === "franchise_admin" && "bg-blue-100 text-blue-800",
                                      user.role === "branch_admin" && "bg-green-100 text-green-800",
                                      !user.role && "bg-gray-100 text-gray-800"
                                    )}>
                                      {user.role === "system_admin" ? "System Admin" :
                                       user.role === "franchise_admin" ? "Franchise Admin" :
                                       user.role === "branch_admin" ? "Branch Admin" :
                                       "User"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{user.company || "—"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {user.subscriptionStatus === "pro" ? (
                                      <Crown className="h-4 w-4 text-yellow-600" />
                                    ) : null}
                                    <span className={cn(
                                      "px-2 py-1 rounded-full text-xs font-medium",
                                      user.subscriptionStatus === "pro"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    )}>
                                      {user.subscriptionStatus}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {user.accessCode ? (
                                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                      {user.accessCode}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>Total: {user.reportsGenerated}</div>
                                    <div className="text-muted-foreground">
                                      RC: {user.rcReports} | PA: {user.paReports}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>Total: {user.pricelabsApiCallsTotal}</div>
                                    <div className="text-muted-foreground">
                                      RC: {user.rcApiCalls} | PA: {user.paApiCalls}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          userActionMutation.mutate({
                                            userId: user.id,
                                            action: "send-reset-link",
                                          });
                                        }}
                                      >
                                        <Settings className="mr-2 h-4 w-4" />
                                        Send Password Reset
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const newPlan = user.subscriptionStatus === "pro" ? "free" : "pro";
                                          userActionMutation.mutate({
                                            userId: user.id,
                                            action: "change-plan",
                                            plan: newPlan,
                                          });
                                        }}
                                      >
                                        <Crown className="mr-2 h-4 w-4" />
                                        {user.subscriptionStatus === "pro" ? "Downgrade to Free" : "Upgrade to Pro"}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const action = user.suspended ? "unsuspend" : "suspend";
                                          if (window.confirm(`Are you sure you want to ${action} this user?`)) {
                                            userActionMutation.mutate({
                                              userId: user.id,
                                              action,
                                            });
                                          }
                                        }}
                                        className="text-destructive"
                                      >
                                        <Ban className="mr-2 h-4 w-4" />
                                        {user.suspended ? "Unsuspend" : "Suspend"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to permanently delete ${user.email}? This action cannot be undone.`)) {
                                            userActionMutation.mutate({
                                              userId: user.id,
                                              action: "delete",
                                            });
                                          }
                                        }}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete User
                                      </DropdownMenuItem>
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
              </TabsContent>
              
              <TabsContent value="invitations" className="mt-4">
                <PendingInvitations />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <AdminInvitationModal 
          open={isInvitationModalOpen}
          onOpenChange={setIsInvitationModalOpen}
        />
      </div>
    </div>
  );
}