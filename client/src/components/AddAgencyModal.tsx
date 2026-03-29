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
import { Plus, Loader2, Building2, Search, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropDataBranch {
  id: number;
  name: string;
  address: string | null;
}

interface PropDataResult {
  id: number;
  name: string;
  branches: PropDataBranch[];
}

type Step = "search" | "select" | "confirm";

export function AddAgencyModal({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("search");
  const [searchName, setSearchName] = useState("");
  const [results, setResults] = useState<PropDataResult[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<PropDataResult | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<PropDataBranch | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/agencies/search-franchise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Search failed");
      }
      return res.json() as Promise<{ results: PropDataResult[] }>;
    },
    onSuccess: (data) => {
      setResults(data.results);
      setStep("select");
    },
    onError: (error: any) => {
      toast({
        title: "Agency not found",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFranchise || !selectedBranch) throw new Error("No selection");
      const res = await fetch("/api/agencies/add-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propdataKey: String(selectedBranch.id),
          branchName: selectedBranch.name,
          franchiseName: selectedFranchise.name,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add agency");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Agency added",
        description: `${selectedFranchise?.name} — ${selectedBranch?.name} is now syncing.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add agency",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setStep("search");
    setSearchName("");
    setResults([]);
    setSelectedFranchise(null);
    setSelectedBranch(null);
  };

  const handleSelectBranch = (franchise: PropDataResult, branch: PropDataBranch) => {
    setSelectedFranchise(franchise);
    setSelectedBranch(branch);
    setStep("confirm");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}>
      <DialogTrigger asChild>
        {children || (
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Agency
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Add Agency Integration
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: Search */}
        {step === "search" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Search for the agency by name to find them in PropData.
            </p>
            <div className="space-y-2">
              <Label htmlFor="searchName">Agency Name</Label>
              <Input
                id="searchName"
                placeholder="e.g., Prospr Real Estate"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchName.trim()) {
                    searchMutation.mutate(searchName.trim());
                  }
                }}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => searchMutation.mutate(searchName.trim())}
              disabled={!searchName.trim() || searchMutation.isPending}
            >
              {searchMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching PropData...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" />Search</>
              )}
            </Button>
          </div>
        )}

        {/* STEP 2: Select branch */}
        {step === "select" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} found. Select the branch to add.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setStep("search")}>
                ← Back
              </Button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {results.map((franchise) => (
                <div key={franchise.id} className="border rounded-lg p-3 space-y-2">
                  <p className="font-medium text-sm">{franchise.name}</p>
                  {franchise.branches.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No branches found</p>
                  ) : (
                    franchise.branches.map((branch) => (
                      <button
                        key={branch.id}
                        onClick={() => handleSelectBranch(franchise, branch)}
                        className="w-full text-left flex items-start justify-between rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors border"
                      >
                        <span>
                          <span className="font-medium">{branch.name}</span>
                          {branch.address && (
                            <span className="block text-xs text-muted-foreground">{branch.address}</span>
                          )}
                          <span className="block text-xs text-muted-foreground">ID: {branch.id}</span>
                        </span>
                        <Plus className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === "confirm" && selectedFranchise && selectedBranch && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-green-500" />
                Ready to add
              </div>
              <div><span className="text-muted-foreground">Franchise:</span> {selectedFranchise.name}</div>
              <div><span className="text-muted-foreground">Branch:</span> {selectedBranch.name}</div>
              {selectedBranch.address && (
                <div><span className="text-muted-foreground">Address:</span> {selectedBranch.address}</div>
              )}
              <div><span className="text-muted-foreground">PropData branch ID:</span> {selectedBranch.id}</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Listings for this branch will start syncing automatically within 5 minutes.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" />Add Agency</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
