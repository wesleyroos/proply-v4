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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { Ban, Trash2, Users, Building2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectUser } from "@db/schema";

interface AdminUser extends SelectUser {
  isAdmin: boolean;
  accessCode: string | null;
  accessCodeUsedAt: string | null;
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  proUsers: number;
  freeUsers: number;
  corporateUsers: number;
  individualUsers: number;
  monthlyApiCalls: number;
}

export default function AdminPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user?.isAdmin,
  });

  const userActionMutation = useMutation({
    mutationFn: async ({ 
      userId, 
      action, 
      plan 
    }: { 
      userId: number; 
      action: 'suspend' | 'unsuspend' | 'change-plan';
      plan?: 'free' | 'pro';
    }) => {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: plan ? { 'Content-Type': 'application/json' } : undefined,
        body: plan ? JSON.stringify({ plan }) : undefined,
        credentials: 'include'
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
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "..." : stats?.totalUsers}</div>
            <div className="text-xs text-muted-foreground">
              {statsLoading ? "..." : `${stats?.proUsers} Pro • ${stats?.freeUsers} Free`}
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
              {statsLoading ? "..." : stats?.corporateUsers + stats?.individualUsers}
            </div>
            <div className="text-xs text-muted-foreground">
              {statsLoading ? "..." : `${stats?.corporateUsers} Corporate • ${stats?.individualUsers} Individual`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Usage (This Month)</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? "..." : stats?.monthlyApiCalls}
            </div>
            <div className="text-xs text-muted-foreground">
              Total API calls this month
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <p className="text-muted-foreground">Loading users...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Access Code</TableHead>
                  <TableHead>Redeemed At</TableHead>
                  <TableHead>Status Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell>{userData.id}</TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>
                      {userData.firstName} {userData.lastName}
                    </TableCell>
                    <TableCell className="capitalize">{userData.userType}</TableCell>
                    <TableCell>{userData.company || "-"}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        (userData.isAdmin || userData.subscriptionStatus === "pro")
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      )}>
                        {(userData.isAdmin || userData.subscriptionStatus === "pro") ? "Pro" : "Free"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {userData.accessCode || "-"}
                    </TableCell>
                    <TableCell>
                      {userData.accessCodeUsedAt 
                        ? new Date(userData.accessCodeUsedAt).toLocaleDateString() 
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {userData.subscriptionStatus === "pro" && userData.subscriptionExpiryDate && (
                        <span className="block text-xs">
                          Subscription expires: {new Date(userData.subscriptionExpiryDate).toLocaleDateString()}
                        </span>
                      )}
                      {userData.accessCode && (
                        <span className="block text-xs">
                          Access code: {userData.accessCode}
                        </span>
                      )}
                      {userData.isAdmin && (
                        <span className="block text-xs text-blue-600 font-medium">
                          Full admin access
                        </span>
                      )}
                      {!userData.isAdmin && userData.subscriptionStatus !== "pro" && !userData.accessCode && (
                        <span className="block text-xs text-gray-500">
                          Free plan
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          defaultValue={userData.subscriptionStatus}
                          onValueChange={(value) => 
                            userActionMutation.mutate({
                              userId: userData.id,
                              action: 'change-plan',
                              plan: value as 'free' | 'pro'
                            })
                          }
                          disabled={userData.isAdmin || userData.id === user.id}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free Plan</SelectItem>
                            <SelectItem value="pro">Pro Plan</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => userActionMutation.mutate({
                            userId: userData.id,
                            action: userData.subscriptionStatus === 'suspended' ? 'unsuspend' : 'suspend'
                          })}
                          disabled={userData.isAdmin || userData.id === user.id}
                          className={userData.subscriptionStatus === 'suspended' ? 'text-green-600 hover:text-green-600' : ''}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          {userData.subscriptionStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={userData.isAdmin || userData.id === user.id}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user
                                account and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(userData.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}