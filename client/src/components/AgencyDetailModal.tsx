import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCcw,
  Database,
  BarChart3,
  Upload,
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AgencyLogoUpload } from "./AgencyLogoUpload";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface PaymentMethod {
  id: number;
  cardBrand: string;
  cardLastFour: string;
  expiryMonth: number;
  expiryYear: number;
  isPrimary: boolean;
  addedAt: string;
  addedBy?: string;
}

interface ReportStats {
  currentMonth: number;
  previousMonth: number;
  totalReports: number;
  monthlyStats: {
    month: string;
    monthName: string;
    reports: number;
  }[];
  reportTypes: {
    reportType: string;
    count: number;
  }[];
}

interface AgencyDetailModalProps {
  agency: Agency | null;
  isOpen: boolean;
  onClose: () => void;
  onStatsClick: (agencyName: string) => void;
}

export function AgencyDetailModal({ agency, isOpen, onClose, onStatsClick }: AgencyDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment methods for this agency
  const { data: paymentMethods } = useQuery({
    queryKey: ['/api/payment-methods', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return { paymentMethods: [] };
      const response = await fetch(`/api/agencies/${agency.id}/payment-methods`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 404) return { paymentMethods: [] };
        throw new Error('Failed to fetch payment methods');
      }
      return response.json();
    },
    enabled: !!agency?.id && isOpen
  });

  // Fetch report statistics for this agency
  const { data: reportStats } = useQuery({
    queryKey: ['/api/report-stats', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return null;
      const response = await fetch(`/api/agencies/${agency.id}/report-stats`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch report statistics');
      }
      return response.json();
    },
    enabled: !!agency?.id && isOpen
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
      const response = await fetch(`/api/admin/agencies/${agencyId}/billing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingEnabled: enabled }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `Failed to update billing status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Billing updated",
        description: `Billing ${variables.enabled ? 'enabled' : 'disabled'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
    },
    onError: (error: any) => {
      toast({
        title: "Billing update failed",
        description: error.message || "Failed to update billing status",
        variant: "destructive",
      });
    },
  });

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

  if (!agency) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building className="h-5 w-5" />
            {agency.franchiseName || agency.name}
            {getStatusBadge(agency.status)}
          </DialogTitle>
          <DialogDescription>
            {agency.branchName && (
              <span className="text-muted-foreground">{agency.branchName} • </span>
            )}
            Manage agency integration and view detailed information
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Agency Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agency Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Provider:</span>
                    <span>{agency.provider}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Properties:</span>
                    <span>{agency.totalProperties.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Last Sync:</span>
                    <span>{agency.lastSync ? format(new Date(agency.lastSync), 'MMM d, yyyy HH:mm') : 'Never'}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Auto-sync:</span>
                    {agency.autoSyncEnabled ? (
                      <span className="text-green-600">Every {agency.syncFrequency}</span>
                    ) : (
                      <span className="text-muted-foreground">Disabled</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Logo:</span>
                    {agency.logoUrl ? (
                      <span className="text-green-600">Uploaded</span>
                    ) : (
                      <span className="text-muted-foreground">Not uploaded</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Billing:</span>
                    {agency.billingEnabled ? (
                      <Badge variant="secondary">Enabled</Badge>
                    ) : (
                      <span className="text-muted-foreground">Disabled</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Last Sync Results */}
          {agency.lastSyncResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Last Sync Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {agency.lastSyncResult.newListings}
                    </div>
                    <div className="text-sm text-green-700">New Listings</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {agency.lastSyncResult.updatedListings}
                    </div>
                    <div className="text-sm text-blue-700">Updated Listings</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {agency.lastSyncResult.errors}
                    </div>
                    <div className="text-sm text-red-700">Errors</div>
                  </div>
                </div>
                {agency.lastSyncResult.errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{agency.lastSyncResult.errorMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethods?.paymentMethods?.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.paymentMethods.map((method: PaymentMethod) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {method.cardBrand} •••• {method.cardLastFour}
                            {method.isPrimary && (
                              <Badge variant="secondary" className="ml-2">Primary</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          Added {format(new Date(method.addedAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No payment methods added yet</p>
                  <p className="text-sm">Payment methods will appear here once added through the Settings page</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => syncMutation.mutate({ agencyId: agency.id })}
              disabled={syncMutation.isPending || agency.status === 'syncing'}
              variant="outline"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Quick Sync
            </Button>

            <Button
              onClick={() => syncMutation.mutate({ agencyId: agency.id, forceFullSync: true })}
              disabled={syncMutation.isPending || agency.status === 'syncing'}
              variant="outline"
            >
              <Database className="mr-2 h-4 w-4" />
              Full Sync
            </Button>

            <Button
              onClick={() => {
                onStatsClick(agency.franchiseName || agency.name);
                onClose();
              }}
              variant="outline"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Stats
            </Button>

            {agency.mainBranchId && (
              <div className="flex items-center">
                <AgencyLogoUpload
                  agencyId={parseInt(agency.mainBranchId)}
                  agencyName={agency.franchiseName || agency.name}
                  currentLogoUrl={agency.logoUrl}
                />
              </div>
            )}

            <Button
              onClick={() => {
                billingToggleMutation.mutate({ 
                  agencyId: agency.id, 
                  enabled: !agency.billingEnabled 
                });
              }}
              disabled={billingToggleMutation.isPending}
              variant={agency.billingEnabled ? "destructive" : "default"}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {agency.billingEnabled ? 'Disable' : 'Enable'} Billing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}