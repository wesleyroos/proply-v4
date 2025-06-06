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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Loader2, CheckCircle, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FranchiseItem {
  id: string;
  name: string;
  branchCount?: number;
}

interface FranchiseResult {
  id: string;
  name: string;
  branches: {
    id: string;
    name: string;
    address?: string;
  }[];
}

interface AddAgencyModalProps {
  children?: React.ReactNode;
}

export function AddAgencyModal({ children }: AddAgencyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [availableFranchises, setAvailableFranchises] = useState<FranchiseItem[]>([]);
  const [searchResults, setSearchResults] = useState<FranchiseResult | null>(null);
  const [isLoadingFranchises, setIsLoadingFranchises] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAvailableList, setShowAvailableList] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load all available franchises
  const loadAvailableFranchises = async () => {
    setIsLoadingFranchises(true);
    try {
      const response = await fetch('/api/agencies/list-franchises', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to load franchises');
      
      const data = await response.json();
      setAvailableFranchises(data.franchises);
      setShowAvailableList(true);
    } catch (error) {
      toast({
        title: "Failed to load agencies",
        description: "Could not fetch available agencies from PropData",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFranchises(false);
    }
  };

  // Search for specific franchise
  const searchFranchise = async () => {
    if (!agencyName.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/agencies/search-franchise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: agencyName.trim() }),
      });
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Could not find franchise. Please check the name and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add agency integration
  const addAgencyMutation = useMutation({
    mutationFn: async (franchiseData: FranchiseResult) => {
      const response = await fetch('/api/agencies/add-integration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(franchiseData),
      });
      if (!response.ok) throw new Error('Failed to add agency');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Agency added successfully",
        description: `${data.franchiseName} integration is now active with ${data.branchCount} branches.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      setIsOpen(false);
      setAgencyName("");
      setSearchResults(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add agency",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const selectFranchise = async (franchise: FranchiseItem) => {
    setAgencyName(franchise.name);
    setShowAvailableList(false);
    await searchFranchise();
  };

  const handleReset = () => {
    setAgencyName("");
    setSearchResults(null);
    setShowAvailableList(false);
    setAvailableFranchises([]);
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Add New Agency Integration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search Step */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="agencyName">Agency/Franchise Name</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="agencyName"
                  placeholder="e.g., NOX, Pam Golding Properties"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchFranchise()}
                />
                <Button 
                  onClick={searchFranchise}
                  disabled={!agencyName.trim() || isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </Button>
              </div>
              <div className="text-center mt-2">
                <Button 
                  variant="outline"
                  onClick={loadAvailableFranchises}
                  disabled={isLoadingFranchises}
                  className="text-sm"
                >
                  {isLoadingFranchises ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Building2 className="w-4 h-4 mr-2" />
                  )}
                  Browse All Available Agencies
                </Button>
              </div>
            </div>
          </div>

          {/* Available Agencies List */}
          {showAvailableList && availableFranchises.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Available Agencies in PropData</h3>
                <Badge variant="outline">
                  {availableFranchises.length} agencies found
                </Badge>
              </div>
              
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agency Name</TableHead>
                      <TableHead>Branches</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableFranchises.map((franchise) => (
                      <TableRow key={franchise.id}>
                        <TableCell className="font-medium">{franchise.name}</TableCell>
                        <TableCell>{franchise.branchCount || 'Unknown'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => selectFranchise(franchise)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Found Franchise</h3>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {searchResults.branches.length} branches found
                </Badge>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{searchResults.name}</h4>
                <p className="text-sm text-muted-foreground">
                  PropData Franchise ID: {searchResults.id}
                </p>
              </div>

              {/* Branches Table */}
              <div>
                <h4 className="font-medium mb-2">Branches to be integrated:</h4>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch Name</TableHead>
                        <TableHead>Branch ID</TableHead>
                        <TableHead>Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.branches.map((branch) => (
                        <TableRow key={branch.id}>
                          <TableCell className="font-medium">{branch.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{branch.id}</TableCell>
                          <TableCell className="text-sm">{branch.address || "N/A"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => addAgencyMutation.mutate(searchResults)}
                  disabled={addAgencyMutation.isPending}
                  className="flex-1"
                >
                  {addAgencyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Integration...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Integration
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Search Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}