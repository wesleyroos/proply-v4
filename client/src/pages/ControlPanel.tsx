import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Database,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings,
  BarChart3,
  CreditCard,
  FlaskConical,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AddAgencyModal } from "@/components/AddAgencyModal";
import { AgencyDetailModal } from "@/components/AgencyDetailModal";
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

const fetchAgencies = async (): Promise<AgenciesData> => {
  const response = await fetch('/api/agencies');
  if (!response.ok) {
    throw new Error('Failed to fetch agencies');
  }
  return response.json();
};

const triggerSync = async (agencyId: string) => {
  const response = await fetch(`/api/agencies/${agencyId}/sync`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to trigger sync');
  }
  return response.json();
};

const toggleBilling = async (agencyId: string, enabled: boolean) => {
  const response = await fetch(`/api/admin/agencies/${agencyId}/billing`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ billingEnabled: enabled }),
  });
  if (!response.ok) {
    throw new Error('Failed to toggle billing');
  }
  return response.json();
};

export function ControlPanel() {
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedAgencyName, setSelectedAgencyName] = useState('');
  const queryClient = useQueryClient();

  const { data: testModeSetting } = useQuery({
    queryKey: ['system-settings', 'payfast_test_mode'],
    queryFn: async () => {
      const res = await fetch('/api/system-settings/payfast_test_mode');
      if (!res.ok) return { value: 'false' };
      return res.json();
    },
  });
  const isTestMode = testModeSetting?.value === 'true';

  const testModeMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch('/api/system-settings/payfast_test_mode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: enabled ? 'true' : 'false' }),
      });
      if (!res.ok) throw new Error('Failed to update setting');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-settings', 'payfast_test_mode'] }),
  });

  const { data: agenciesData, isLoading, error, refetch } = useQuery({
    queryKey: ['agencies'],
    queryFn: fetchAgencies,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'inactive':
        return <Clock className="h-4 w-4 text-gray-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
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
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleSync = async (agencyId: string) => {
    try {
      await triggerSync(agencyId);
      refetch();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleBillingToggle = async (agencyId: string, enabled: boolean) => {
    try {
      await toggleBilling(agencyId, enabled);
      refetch();
    } catch (error) {
      console.error('Billing toggle failed:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
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
            Manage agencies, billing, and payment methods
          </p>
        </div>
        <AddAgencyModal />
      </div>

      {/* PayFast Mode */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4" />
            PayFast Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Sandbox / Test Mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isTestMode
                  ? 'Using PayFast sandbox — no real charges will be made'
                  : 'Using PayFast live — real charges are active'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isTestMode && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Sandbox</Badge>
              )}
              <Switch
                checked={isTestMode}
                onCheckedChange={(checked) => testModeMutation.mutate(checked)}
                disabled={testModeMutation.isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agency Integrations Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Agency Integrations & Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Syndication Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Monthly Reports</TableHead>
                <TableHead>Current Billing</TableHead>
                <TableHead>Last Sync</TableHead>
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
                          <div className="text-sm text-muted-foreground">
                            {agency.branchName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {agency.logoUrl && (
                          <img
                            src={agency.logoUrl}
                            alt={agency.provider}
                            className="w-6 h-6 object-contain"
                          />
                        )}
                        <span className="capitalize">{agency.provider}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(agency.status)}
                        {getStatusBadge(agency.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {agency.hasPaymentMethod ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {agency.paymentMethodInfo?.cardBrand || 'Card'} ••••{agency.paymentMethodInfo?.lastFour}
                            </span>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">No payment method</span>
                            <Badge variant="outline">Setup Required</Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAgencyName(agency.franchiseName || agency.name);
                          setStatsModalOpen(true);
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        View Stats
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {agency.billingEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBillingToggle(agency.id, !agency.billingEnabled)}
                        >
                          {agency.billingEnabled ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(agency.lastSync)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agency.autoSyncEnabled ? "default" : "secondary"}>
                        {agency.autoSyncEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(agency.id)}
                          disabled={agency.status === 'syncing'}
                        >
                          <RefreshCw
                            className={`h-4 w-4 ${
                              agency.status === 'syncing' ? 'animate-spin' : ''
                            }`}
                          />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAgency(agency);
                            setDetailModalOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No agencies configured. Add your first agency to get started.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Sync History */}
      {recentSyncs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>New Listings</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSyncs.map((sync) => (
                  <TableRow key={sync.id}>
                    <TableCell>{getStatusBadge(sync.status)}</TableCell>
                    <TableCell>{formatDate(sync.startedAt)}</TableCell>
                    <TableCell>{formatDate(sync.completedAt)}</TableCell>
                    <TableCell>{sync.newListings}</TableCell>
                    <TableCell>{sync.updatedListings}</TableCell>
                    <TableCell>
                      {sync.errors > 0 ? (
                        <span className="text-red-600">{sync.errors}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Agency Stats Modal */}
      <AgencyStatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        agencyName={selectedAgencyName}
      />

      {/* Agency Detail Modal */}
      <AgencyDetailModal
        agency={selectedAgency}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAgency(null);
        }}
        onStatsClick={(agencyName: string) => {
          setSelectedAgencyName(agencyName);
          setStatsModalOpen(true);
        }}
      />
    </div>
  );
}

export default ControlPanel;