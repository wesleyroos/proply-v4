import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Building2, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddAgencyData {
  propdataKey: string;
  branchName: string;
  franchiseName: string | null;
}

interface AddAgencyModalProps {
  children?: React.ReactNode;
}

export function AddAgencyModal({ children }: AddAgencyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [propdataKey, setPropdataKey] = useState("");
  const [branchName, setBranchName] = useState("");
  const [franchiseName, setFranchiseName] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Add agency integration
  const addAgencyMutation = useMutation({
    mutationFn: async (agencyData: AddAgencyData) => {
      const response = await fetch('/api/agencies/add-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agencyData),
      });
      if (!response.ok) throw new Error('Failed to add agency');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Agency added successfully",
        description: `${data.franchiseName} integration has been created.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      handleReset();
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add agency",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!propdataKey.trim() || !branchName.trim()) {
      toast({
        title: "Please fill required fields",
        description: "PropData key and branch name are required.",
        variant: "destructive",
      });
      return;
    }

    addAgencyMutation.mutate({
      propdataKey: propdataKey.trim(),
      branchName: branchName.trim(),
      franchiseName: franchiseName.trim() || branchName.trim(), // Use branch name as franchise name for standalone agencies
    });
  };

  const handleReset = () => {
    setPropdataKey("");
    setBranchName("");
    setFranchiseName("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Agency
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Add New Agency
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* PropData Key */}
          <div className="space-y-2">
            <Label htmlFor="propdataKey" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              PropData Access Key
            </Label>
            <Input
              id="propdataKey"
              placeholder="Enter unique PropData key"
              value={propdataKey}
              onChange={(e) => setPropdataKey(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Unique key provided by PropData for accessing this agency's listings.
            </p>
          </div>

          {/* Branch Name */}
          <div className="space-y-2">
            <Label htmlFor="branchName">Branch/Agency Name</Label>
            <Input
              id="branchName"
              placeholder="e.g., Atlantic Seaboard or NOX Properties"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The specific branch or agency name that PropData will use to identify this office.
            </p>
          </div>

          {/* Franchise Name */}
          <div className="space-y-2">
            <Label htmlFor="franchiseName">Franchise Name (Optional)</Label>
            <Input
              id="franchiseName"
              placeholder="e.g., Pam Golding Properties (leave empty for independent agencies)"
              value={franchiseName}
              onChange={(e) => setFranchiseName(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Only needed if this branch belongs to a larger franchise group.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={addAgencyMutation.isPending}
              className="flex-1"
            >
              {addAgencyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Agency...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Agency
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}