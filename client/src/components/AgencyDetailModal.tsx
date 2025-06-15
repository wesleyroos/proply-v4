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
  Globe,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
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
  const { data: paymentMethods, isLoading: loadingPayments } = useQuery({
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
  const { data: reportStats, isLoading: loadingReports } = useQuery({
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
      const response = await fetch('/api/sync-agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agencyId, forceFullSync })
      });
      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sync started",
        description: "Agency data synchronization has been initiated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agencies'] });
    },
    onError: (error) => {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to start sync",
        variant: "destructive",
      });
    }
  });

  // Billing toggle mutation
  const billingToggleMutation = useMutation({
    mutationFn: async ({ agencyId, enabled }: { agencyId: string; enabled: boolean }) => {
      const response = await fetch('/api/toggle-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agencyId, enabled })
      });
      if (!response.ok) throw new Error('Failed to toggle billing');
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Billing updated",
        description: `Billing has been ${variables.enabled ? 'enabled' : 'disabled'} for this agency.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agencies'] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update billing status",
        variant: "destructive",
      });
    }
  });

  if (!agency) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'syncing': return 'text-blue-600 bg-blue-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  const getTrendText = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff === 0) return "No change from last month";
    const sign = diff > 0 ? "+" : "";
    const color = diff > 0 ? "text-green-600" : "text-red-600";
    return <span className={color}>{sign}{diff} from last month</span>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {agency.logoUrl && (
              <img 
                src={agency.logoUrl} 
                alt={`${agency.name} logo`}
                className="w-10 h-10 object-contain rounded"
              />
            )}
            <div className="flex-1">
              <div className="text-xl font-bold">{agency.franchiseName || agency.name}</div>
              {agency.branchName && (
                <div className="text-sm text-muted-foreground">{agency.branchName}</div>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(agency.status)}`}>
              {agency.status === 'syncing' && <Loader2 className="h-3 w-3 animate-spin" />}
              {agency.status === 'active' && <CheckCircle className="h-3 w-3" />}
              {agency.status === 'error' && <XCircle className="h-3 w-3" />}
              {agency.status === 'inactive' && <Activity className="h-3 w-3" />}
              {agency.status.charAt(0).toUpperCase() + agency.status.slice(1)}
            </div>
          </DialogTitle>
          <DialogDescription>
            Comprehensive agency management dashboard with real-time sync status and billing controls
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Properties</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{agency.totalProperties.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Provider</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{agency.provider}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Auto-sync</span>
                  </div>
                  <div className="text-lg font-semibold mt-1">
                    {agency.autoSyncEnabled ? (
                      <span className="text-green-600">Every {agency.syncFrequency}</span>
                    ) : (
                      <span className="text-gray-500">Disabled</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Last Sync</span>
                  </div>
                  <div className="text-sm font-medium mt-1">
                    {agency.lastSync ? format(new Date(agency.lastSync), 'MMM d, HH:mm') : 'Never'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sync Results */}
            {agency.lastSyncResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Last Synchronization Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-muted-foreground">New:</span>
                      <span className="font-bold text-green-600">{agency.lastSyncResult.newListings}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="font-bold text-blue-600">{agency.lastSyncResult.updatedListings}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-muted-foreground">Errors:</span>
                      <span className="font-bold text-red-600">{agency.lastSyncResult.errors}</span>
                    </div>
                  </div>
                  {agency.lastSyncResult.errorMessage && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">Error Details:</p>
                      <p className="text-sm text-red-600 mt-1">{agency.lastSyncResult.errorMessage}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Agency Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => syncMutation.mutate({ agencyId: agency.id })}
                    disabled={syncMutation.isPending || agency.status === 'syncing'}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Quick Sync
                  </Button>

                  <Button
                    onClick={() => syncMutation.mutate({ agencyId: agency.id, forceFullSync: true })}
                    disabled={syncMutation.isPending || agency.status === 'syncing'}
                    variant="outline"
                    size="sm"
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
                    size="sm"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Detailed Stats
                  </Button>

                  {agency.mainBranchId && (
                    <AgencyLogoUpload
                      agencyId={parseInt(agency.mainBranchId)}
                      agencyName={agency.franchiseName || agency.name}
                      currentLogoUrl={agency.logoUrl}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-6 space-y-6">
            {loadingReports ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading report statistics...
                </CardContent>
              </Card>
            ) : reportStats ? (
              <>
                {/* Report Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Current Month</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{reportStats.currentMonth}</div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        {getTrendIcon(reportStats.currentMonth, reportStats.previousMonth)}
                        {getTrendText(reportStats.currentMonth, reportStats.previousMonth)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Previous Month</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{reportStats.previousMonth}</div>
                      <p className="text-xs text-muted-foreground">
                        Reports generated last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{reportStats.totalReports}</div>
                      <p className="text-xs text-muted-foreground">
                        All time report generations
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Chart */}
                {reportStats.monthlyStats && reportStats.monthlyStats.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Report Generation Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={reportStats.monthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="monthName" 
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              fontSize={12}
                            />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(label) => `Month: ${label}`}
                              formatter={(value) => [`${value} reports`, 'Reports Generated']}
                            />
                            <Bar dataKey="reports" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Report Types */}
                {reportStats.reportTypes && reportStats.reportTypes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Report Types Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reportStats.reportTypes.map((type, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <span className="font-medium">{type.reportType}</span>
                            <Badge variant="secondary" className="text-sm">
                              {type.count} reports
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground">No Report Data Available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Report statistics will appear here once the agency starts generating reports
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="billing" className="mt-6 space-y-6">
            {/* Billing Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Billing for {agency.franchiseName || agency.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {agency.billingEnabled ? 
                        'Billing is currently enabled for this agency' : 
                        'Billing is currently disabled for this agency'
                      }
                    </p>
                  </div>
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
                    {billingToggleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CreditCard className="mr-2 h-4 w-4" />
                    {agency.billingEnabled ? 'Disable Billing' : 'Enable Billing'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading payment methods...
                  </div>
                ) : paymentMethods?.paymentMethods?.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.paymentMethods.map((method: PaymentMethod) => (
                      <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                          </div>
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
                          {method.addedBy && (
                            <div className="text-xs text-muted-foreground">
                              by {method.addedBy}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium text-muted-foreground">No Payment Methods</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Payment methods can be added through the Settings page
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}