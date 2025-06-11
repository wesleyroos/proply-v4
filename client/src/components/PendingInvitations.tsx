import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  MoreHorizontal, 
  Mail, 
  Trash2, 
  Clock, 
  CheckCircle,
  XCircle,
  Building2,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PendingInvitation {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "franchise_admin" | "branch_admin";
  status: "pending" | "expired";
  franchiseId?: number;
  branchId?: number;
  franchiseName?: string;
  branchName?: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: string;
}

export function PendingInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery<PendingInvitation[]>({
    queryKey: ["/api/admin/invitations"],
    queryFn: async () => {
      const response = await fetch("/api/admin/invitations", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch invitations");
      return response.json();
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to cancel invitation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation Cancelled",
        description: "The invitation has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Cancel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await fetch(`/api/admin/invitations/${invitationId}/resend`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to resend invitation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation Resent",
        description: "The invitation has been resent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Resend",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (invitation: PendingInvitation) => {
    const isExpired = new Date(invitation.expiresAt) < new Date();
    
    if (isExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Expired
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const isFramchise = role === "franchise_admin";
    return (
      <Badge variant={isFramchise ? "default" : "outline"} className="flex items-center gap-1">
        {isFramchise ? <Building2 className="h-3 w-3" /> : <Users className="h-3 w-3" />}
        {isFramchise ? "Franchise Admin" : "Branch Admin"}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading invitations...</div>;
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="text-center p-8">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">No Pending Invitations</h3>
        <p className="text-muted-foreground">
          All sent invitations have been accepted or expired.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invitee</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Agency</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const isExpired = new Date(invitation.expiresAt) < new Date();
            
            return (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">
                  {invitation.firstName} {invitation.lastName}
                </TableCell>
                <TableCell>{invitation.email}</TableCell>
                <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {invitation.franchiseName || "Unknown Franchise"}
                    </div>
                    {invitation.branchName && invitation.branchName !== invitation.franchiseName && (
                      <div className="text-sm text-muted-foreground">
                        {invitation.branchName}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(invitation)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    by {invitation.invitedBy}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })}
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
                      <DropdownMenuItem
                        onClick={() => resendInvitationMutation.mutate(invitation.id)}
                        disabled={isExpired || resendInvitationMutation.isPending}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Invitation
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (window.confirm("Are you sure you want to cancel this invitation?")) {
                            cancelInvitationMutation.mutate(invitation.id);
                          }
                        }}
                        className="text-destructive"
                        disabled={cancelInvitationMutation.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancel Invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}