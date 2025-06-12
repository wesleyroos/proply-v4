import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { 
  BadgeCheck, 
  AlertTriangle, 
  RefreshCcw, 
  Plus, 
  Database,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  MoreHorizontal,
  CreditCard,
  Upload
} from 'lucide-react';
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AddAgencyModal } from "@/components/AddAgencyModal";
import { AgencyLogoUpload } from "@/components/AgencyLogoUpload";
import { AgencyStatsModal } from "@/components/AgencyStatsModal";

interface Agency {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'syncing' | 'error' | 'inactive';
  lastSync: string | null;
  logoUrl?: string | null;
  franchiseName?: string;
  branchName?: string;
  mainBranchId?: string;
  totalProperties: number;
  lastSyncResult: {
    newListings: number;
    updatedListings: number;
    errors: number;
    errorMessage?: string | null;
  } | null;
  autoSyncEnabled: boolean;
  syncFrequency: string;
  billingEnabled?: boolean;
}

interface SyncHistory {
  id: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
  newListings: number;
  updatedListings: number;
  errors: number;
  errorMessage?: string | null;
}

interface AgenciesData {
  agencies: Agency[];
  recentSyncs: SyncHistory[];
}

export function ControlPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedAgencyName, setSelectedAgencyName] = useState<string>("");

  // Fetch agencies data
  const { data: agenciesData, isLoading, error } = useQuery<AgenciesData>({
    queryKey: ["/api/agencies"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async ({ agencyId, forceFullSync }: { agencyId: string; forceFullSync?: boolean }) => {
      const response = await fetch(`/api/agencies/${agencyId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceFullSync }),
      });
      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync completed",
        description: data.message || "Agency sync completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync agency data",
        variant: "destructive",
      });
    },
  });

  // Billing toggle mutation
  const billingToggleMutation = useMutation({
    mutationFn: async ({ agencyId, enabled }: { agencyId: string; enabled: boolean }) => {
      console.log('Billing toggle mutation called:', { agencyId, enabled });
      const response = await fetch(`/api/admin/agencies/${agencyId}/billing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingEnabled: enabled }),
      });
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || errorData.error || `Failed to update billing status: ${response.status}`);
      }
      const result = await response.json();
      console.log('Success response:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('Mutation successful:', data);
      toast({
        title: "Billing updated",
        description: `Billing ${variables.enabled ? 'enabled' : 'disabled'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast({
        title: "Billing update failed",
        description: error.message || "Failed to update billing status",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'syncing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-100 text-blue-800">Syncing</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span>Failed to load agency data</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const agencies = agenciesData?.agencies || [];
  const recentSyncs = agenciesData?.recentSyncs || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control Panel</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor agency integrations
          </p>
        </div>
        <AddAgencyModal />
      </div>

      {/* Agency Integrations Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Agency Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Syndication Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Last Result</TableHead>
                <TableHead>Auto-sync</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencies.length > 0 ? (
                agencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{agency.franchiseName || agency.name}</div>
                        {agency.branchName && (
                          <div className="text-sm text-muted-foreground">{agency.branchName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{agency.provider}</TableCell>
                    <TableCell>{getStatusBadge(agency.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {agency.logoUrl ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-green-700">Uploaded</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <span className="text-sm text-muted-foreground">None</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {agency.lastSync ? format(new Date(agency.lastSync), 'MMM d, HH:mm') : 'Never'}
                    </TableCell>
                    <TableCell>{agency.totalProperties.toLocaleString()}</TableCell>
                    <TableCell>
                      {agency.lastSyncResult ? (
                        <div className="text-sm">
                          <div>+{agency.lastSyncResult.newListings} new</div>
                          <div className="text-muted-foreground">{agency.lastSyncResult.updatedListings} updated</div>
                          {agency.lastSyncResult.errors > 0 && (
                            <div className="text-red-600">{agency.lastSyncResult.errors} errors</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {agency.autoSyncEnabled ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Every {agency.syncFrequency}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-muted-foreground">Disabled</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            disabled={syncMutation.isPending || agency.status === 'syncing'}
                            onClick={() => syncMutation.mutate({ agencyId: agency.id })}
                          >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Quick Sync
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            disabled={syncMutation.isPending || agency.status === 'syncing'}
                            onClick={() => syncMutation.mutate({ agencyId: agency.id, forceFullSync: true })}
                          >
                            <Database className="mr-2 h-4 w-4" />
                            Full Sync
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAgencyName(agency.franchiseName || agency.name);
                              setStatsModalOpen(true);
                            }}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Stats
                          </DropdownMenuItem>
                          
                          {agency.mainBranchId && (
                            <DropdownMenuItem asChild>
                              <div className="flex items-center">
                                <Upload className="mr-2 h-4 w-4" />
                                <AgencyLogoUpload
                                  agencyId={parseInt(agency.mainBranchId)}
                                  agencyName={agency.franchiseName || agency.name}
                                  currentLogoUrl={agency.logoUrl}
                                />
                              </div>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            onClick={(e) => {
                              console.log('Billing dropdown clicked for agency:', agency.id, 'current status:', agency.billingEnabled);
                              billingToggleMutation.mutate({ 
                                agencyId: agency.id, 
                                enabled: !agency.billingEnabled 
                              });
                            }}
                            disabled={billingToggleMutation.isPending}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            <span>{agency.billingEnabled ? 'Disable' : 'Enable'} Billing</span>
                            {agency.billingEnabled && (
                              <Badge variant="secondary" className="ml-auto">Enabled</Badge>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No agencies configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Status and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>PropData API</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Database</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Auto-sync Service</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Running</span>
                </div>
              </div>
              {agencies.length > 0 && agencies[0].lastSync && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-muted-foreground">Last Auto-sync</span>
                  <span className="text-sm">
                    {format(new Date(agencies[0].lastSync), 'HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Sync Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSyncs.length > 0 ? (
                recentSyncs.slice(0, 5).map((sync) => (
                  <div key={sync.id} className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(sync.status)}
                        <span className="font-medium capitalize">{sync.status}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(sync.startedAt), 'MMM d, HH:mm')}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      {sync.status === 'completed' && (
                        <>
                          <div>+{sync.newListings} new</div>
                          <div className="text-muted-foreground">{sync.updatedListings} updated</div>
                        </>
                      )}
                      {sync.errors > 0 && (
                        <div className="text-red-600">{sync.errors} errors</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No recent sync activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agency Stats Modal */}
      <AgencyStatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        agencyName={selectedAgencyName}
      />
    </div>
  );
}

export default ControlPanel;