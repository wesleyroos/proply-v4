import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Ban, Trash2 } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  userType: string;
  company: string | null;
  firstName: string | null;
  lastName: string | null;
  subscriptionStatus: string;
  subscriptionExpiryDate: string | null;
  isAdmin: boolean;
}

export default function AdminPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  if (user && !user.isAdmin) {
    setLocation("/");
    return null;
  }

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin,
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: 'suspend' | 'unsuspend' }) => {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: action === 'suspend' ? "User Suspended" : "User Unsuspended",
        description: `The user has been ${action}ed successfully.`,
      });
    },
    onError: (error, { action }) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} user`,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully.",
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
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
                  <TableHead>Subscription</TableHead>
                  <TableHead>Admin</TableHead>
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
                    <TableCell className="capitalize">
                      {userData.subscriptionStatus}
                      {userData.subscriptionExpiryDate && (
                        <span className="block text-xs text-muted-foreground">
                          Expires: {new Date(userData.subscriptionExpiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{userData.isAdmin ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => suspendMutation.mutate({
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
