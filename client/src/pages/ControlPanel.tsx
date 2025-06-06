import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Loader2
} from 'lucide-react';
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Agency {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'syncing' | 'error' | 'inactive';
  lastSync: string | null;
  totalProperties: number;
  lastSyncResult: {
    newListings: number;
    updatedListings: number;
    errors: number;
    errorMessage?: string | null;
  } | null;
  autoSyncEnabled: boolean;
  syncFrequency: string;
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
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Agency
        </Button>
      </div>

      {/* Agency Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {agencies.map((agency) => (
          <Card key={agency.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{agency.name}</CardTitle>
                {getStatusBadge(agency.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                via {agency.provider}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Sync:</span>
                <span className="font-medium">
                  {agency.lastSync ? format(new Date(agency.lastSync), 'MMM d, HH:mm') : 'Never'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Properties:</span>
                <span className="font-medium">{agency.totalProperties}</span>
              </div>
              {agency.lastSyncResult && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Result:</span>
                    <span className="font-medium">
                      +{agency.lastSyncResult.newListings} new, {agency.lastSyncResult.updatedListings} updated
                    </span>
                  </div>
                  {agency.lastSyncResult.errors > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Errors:</span>
                      <span className="font-medium text-red-600">{agency.lastSyncResult.errors}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Auto-sync:</span>
                <span className="font-medium">
                  {agency.autoSyncEnabled ? `Every ${agency.syncFrequency}` : 'Disabled'}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  disabled={syncMutation.isPending || agency.status === 'syncing'}
                  onClick={() => syncMutation.mutate({ agencyId: agency.id })}
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCcw className="w-3 h-3 mr-1" />
                  )}
                  Quick Sync
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={syncMutation.isPending || agency.status === 'syncing'}
                  onClick={() => syncMutation.mutate({ agencyId: agency.id, forceFullSync: true })}
                >
                  <Database className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
}

export default ControlPanel;