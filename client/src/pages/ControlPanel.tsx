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
  CreditCard,
  Upload,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AddAgencyModal } from "@/components/AddAgencyModal";
import { AgencyLogoUpload } from "@/components/AgencyLogoUpload";
import { AgencyStatsModal } from "@/components/AgencyStatsModal";
import { AgencyDetailModal } from "@/components/AgencyDetailModal";

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
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

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
            Manage agencies, billing, and payment methods
          </p>
        </div>
        <AddAgencyModal />
      </div>

      {/* Billing Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R45,250</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agencies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agencies.length}</div>
            <p className="text-xs text-muted-foreground">
              {agencies.filter(a => a.status === 'active').length} with active billing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              This month across all agencies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              6 active, 2 pending setup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PayFast Billing Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Monthly Billing Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Reports (1-50)</span>
                <span className="text-sm">R200 each</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Reports (51-100)</span>
                <span className="text-sm">R180 each</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Reports (101-150)</span>
                <span className="text-sm">R160 each</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Reports (151+)</span>
                <span className="text-sm">R140 each</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center font-medium">
                  <span>Current Month Total</span>
                  <span>R45,250</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              PayFast Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Live Environment</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Merchant ID</span>
                <span className="text-sm font-mono">24039609</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Tokenization</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Auto Billing</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Monthly
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Next Billing</span>
                <span className="text-sm">July 1, 2025</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                          <div className="text-sm text-muted-foreground">{agency.branchName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{agency.provider}</TableCell>
                    <TableCell>{getStatusBadge(agency.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">•••• 4532</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">127 reports</div>
                        <div className="text-muted-foreground">R160 each</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">R20,320</div>
                        <div className="text-muted-foreground">Due July 1</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {agency.lastSync ? format(new Date(agency.lastSync), 'MMM d, HH:mm') : 'Never'}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAgency(agency);
                          setDetailModalOpen(true);
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No agencies configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Management and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">INV-2025-006-001</div>
                  <div className="text-sm text-muted-foreground">Sotheby's Atlantic Seaboard</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">R20,320</div>
                  <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">INV-2025-006-002</div>
                  <div className="text-sm text-muted-foreground">Pam Golding City Bowl</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">R12,600</div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">INV-2025-006-003</div>
                  <div className="text-sm text-muted-foreground">NOX Properties</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">R8,400</div>
                  <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              PayFast Transaction Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Live Payment Gateway</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Tokenization Service</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Automated Billing</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Scheduled</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Webhook Notifications</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Receiving</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Last Transaction</span>
                <span className="text-sm">June 15, 14:32</span>
              </div>
              {agencies.length > 0 && agencies[0].lastSync && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Next Billing Run</span>
                  <span className="text-sm text-orange-600">July 1, 09:00</span>
                </div>
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

      {/* Agency Detail Modal */}
      <AgencyDetailModal
        agency={selectedAgency}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAgency(null);
        }}
        onStatsClick={(agencyName) => {
          setSelectedAgencyName(agencyName);
          setStatsModalOpen(true);
        }}
      />
    </div>
  );
}

export default ControlPanel;