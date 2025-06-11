import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";

const invitationSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["franchise_admin", "branch_admin"], {
    required_error: "Please select a role"
  }),
  agencyId: z.string().min(1, "Please select an agency"),
});

type InvitationForm = z.infer<typeof invitationSchema>;

interface Agency {
  id: number;
  franchiseName: string;
  branchName: string;
  slug: string;
}

interface AdminInvitationModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AdminInvitationModal({ trigger, onSuccess, open: controlledOpen, onOpenChange }: AdminInvitationModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InvitationForm>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: undefined,
      agencyId: "",
    },
  });

  // Fetch available agencies
  const { data: agenciesData, isLoading: agenciesLoading } = useQuery<{agencies: Agency[]}>({
    queryKey: ["/api/agencies"],
    queryFn: async () => {
      const response = await fetch("/api/agencies", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch agencies");
      return response.json();
    },
  });

  const agencies = agenciesData?.agencies || [];

  const invitationMutation = useMutation({
    mutationFn: async (data: InvitationForm) => {
      const selectedAgency = agencies?.find(a => a.id.toString() === data.agencyId);
      if (!selectedAgency) throw new Error("Agency not found");

      const payload = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        franchiseId: data.role === "franchise_admin" ? selectedAgency.id : undefined,
        branchId: data.role === "branch_admin" ? selectedAgency.id : undefined,
      };

      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to send invitation");
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Admin invitation has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invitations"] });
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InvitationForm) => {
    invitationMutation.mutate(data);
  };

  const selectedRole = form.watch("role");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Invite Admin
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Agency Administrator</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="john.doe@agency.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select admin role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="franchise_admin">
                        Franchise Administrator
                        <div className="text-xs text-muted-foreground">
                          Access to all branches in franchise
                        </div>
                      </SelectItem>
                      <SelectItem value="branch_admin">
                        Branch Administrator
                        <div className="text-xs text-muted-foreground">
                          Access to single branch only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agencyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {selectedRole === "franchise_admin" ? "Franchise" : "Branch"}
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={`Select ${selectedRole === "franchise_admin" ? "franchise" : "branch"}`} 
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {agenciesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading agencies...
                        </SelectItem>
                      ) : (
                        agencies?.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id.toString()}>
                            <div>
                              <div className="font-medium">{agency.franchiseName}</div>
                              {agency.branchName && agency.branchName !== agency.franchiseName && (
                                <div className="text-xs text-muted-foreground">
                                  {agency.branchName}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={invitationMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={invitationMutation.isPending}
              >
                {invitationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}