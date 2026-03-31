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
import { Plus, Loader2, Building2, Search, Check, Link2, ChevronDown, ChevronUp } from "lucide-react";
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

type Step =
  | "choose-type"
  | "search"
  | "select"
  | "confirm"
  | "direct-setup"
  | "direct-confirm";

export function AddAgencyModal({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose-type");

  // PropData flow state
  const [searchName, setSearchName] = useState("");
  const [results, setResults] = useState<PropDataResult[]>([]);
  const [selectedFranchise, setSelectedFranchise] = useState<PropDataResult | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<PropDataBranch | null>(null);

  // Direct integration state
  const [directAgencyName, setDirectAgencyName] = useState("");
  const [directBranchName, setDirectBranchName] = useState("");
  const [directApiKey, setDirectApiKey] = useState("");
  const [directApiBaseUrl, setDirectApiBaseUrl] = useState("https://prospr.realestate/api/v1");
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const addDirectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/agencies/add-direct-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "Prospr",
          agencyName: directAgencyName.trim(),
          branchName: directBranchName.trim(),
          apiKey: directApiKey.trim(),
          apiBaseUrl: directApiBaseUrl.trim() || undefined,
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
        description: `${directAgencyName} is now integrated and will begin syncing shortly.`,
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
    setStep("choose-type");
    setSearchName("");
    setResults([]);
    setSelectedFranchise(null);
    setSelectedBranch(null);
    setDirectAgencyName("");
    setDirectBranchName("");
    setDirectApiKey("");
    setDirectApiBaseUrl("https://prospr.realestate/api/v1");
    setShowAdvanced(false);
  };

  const handleSelectBranch = (franchise: PropDataResult, branch: PropDataBranch) => {
    setSelectedFranchise(franchise);
    setSelectedBranch(branch);
    setStep("confirm");
  };

  const isDirectFormValid =
    directAgencyName.trim().length > 0 &&
    directBranchName.trim().length > 0 &&
    directApiKey.trim().length > 0;

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

        {/* STEP 0: Choose integration type */}
        {step === "choose-type" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              How does this agency syndicate their listings?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setStep("search")}
                className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <Search className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">PropData</span>
                <span className="text-xs text-muted-foreground">Agency lists through PropData syndication</span>
              </button>
              <button
                onClick={() => setStep("direct-setup")}
                className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <Link2 className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">Direct API</span>
                <span className="text-xs text-muted-foreground">Agency has their own API integration</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1 (PropData): Search */}
        {step === "search" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Search for the agency by name in PropData.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setStep("choose-type")}>
                ← Back
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchName">Agency Name</Label>
              <Input
                id="searchName"
                placeholder="e.g., Pam Golding"
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

        {/* STEP 2 (PropData): Select branch */}
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

        {/* STEP 3 (PropData): Confirm */}
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

        {/* STEP 1 (Direct): Setup form */}
        {step === "direct-setup" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Enter the agency details and API credentials.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setStep("choose-type")}>
                ← Back
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="directAgencyName">Agency Name</Label>
                <Input
                  id="directAgencyName"
                  placeholder="e.g., Prospr Real Estate"
                  value={directAgencyName}
                  onChange={(e) => setDirectAgencyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="directBranchName">Branch Name</Label>
                <Input
                  id="directBranchName"
                  placeholder="e.g., Prospr Cape Town"
                  value={directBranchName}
                  onChange={(e) => setDirectBranchName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="directApiKey">API Key</Label>
                <Input
                  id="directApiKey"
                  type="password"
                  placeholder="pk_..."
                  value={directApiKey}
                  onChange={(e) => setDirectApiKey(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Advanced
              </button>

              {showAdvanced && (
                <div className="space-y-2">
                  <Label htmlFor="directApiBaseUrl">API Base URL</Label>
                  <Input
                    id="directApiBaseUrl"
                    value={directApiBaseUrl}
                    onChange={(e) => setDirectApiBaseUrl(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => setStep("direct-confirm")}
                disabled={!isDirectFormValid}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 (Direct): Confirm */}
        {step === "direct-confirm" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-green-500" />
                Ready to add
              </div>
              <div><span className="text-muted-foreground">Agency:</span> {directAgencyName}</div>
              <div><span className="text-muted-foreground">Branch:</span> {directBranchName}</div>
              <div><span className="text-muted-foreground">Provider:</span> Prospr (Direct API)</div>
              <div><span className="text-muted-foreground">API Key:</span> {"•".repeat(8)}{directApiKey.slice(-4)}</div>
            </div>
            <p className="text-sm text-muted-foreground">
              The API key will be validated and an initial sync will start immediately.
            </p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => addDirectMutation.mutate()}
                disabled={addDirectMutation.isPending}
              >
                {addDirectMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" />Add Agency</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setStep("direct-setup")}>
                Back
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
