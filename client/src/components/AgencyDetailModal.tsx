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
  TestTube,
  ToggleLeft,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AgencyLogoUpload } from "./AgencyLogoUpload";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function TestBillingButton({ agencyId }: { agencyId: string }) {
  const [testAmount, setTestAmount] = useState("10");
  const { toast } = useToast();
  
  const testBillingMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(testAmount);
      const response = await fetch(`/api/admin/agencies/${agencyId}/test-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Test billing failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Billing Successful",
        description: `R${testAmount} charged successfully. Transaction ID: ${data.transactionId}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Billing Failed", 
        description: error.message || "Failed to process test billing",
        variant: "destructive",
      });
    },
  });

  const handleTestPayment = () => {
    const amount = parseFloat(testAmount);
    if (amount < 2 || amount > 10000) {
      toast({
        title: "Invalid Amount",
        description: "Test amount must be between R2 and R10,000",
        variant: "destructive",
      });
      return;
    }
    testBillingMutation.mutate();
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="font-medium mb-2">Test Billing</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Enter amount to test payment method functionality
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="testAmount">Amount (ZAR)</Label>
            <Input
              id="testAmount"
              type="number"
              min="2"
              max="10000"
              step="1"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Start with R10, increase if Z2 error occurs
            </p>
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleTestPayment}
              disabled={testBillingMutation.isPending}
              className="w-full"
            >
              {testBillingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <TestTube className="mr-2 h-4 w-4" />
              Test R{testAmount} Charge
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Testing Strategy:</strong> Start with R{testAmount}. If you get "Z2 - below merchant limit", try R50, R100, R200, etc. until you find the minimum that works.
        </p>
      </div>
    </div>
  );
}



function TestPaymentForm({ agencyId }: { agencyId: string }) {
  const [testAmount, setTestAmount] = useState("10.00");
  const { toast } = useToast();
  
  const queryClient = useQueryClient();
  
  const testPaymentMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      const response = await fetch(`/api/admin/agencies/${agencyId}/test-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Test payment failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Test Payment Successful",
        description: `R${testAmount} charged in ${data.mode?.toUpperCase() || 'UNKNOWN'} mode. Transaction ID: ${data.transactionId}`,
      });
      
      // Invalidate queries to refresh invoice list and transaction history
      queryClient.invalidateQueries({ queryKey: ['/api/report-stats', agencyId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Test Payment Failed",
        description: error.message || "Failed to process test payment",
        variant: "destructive",
      });
    },
  });

  const handleTestPayment = () => {
    const amount = parseFloat(testAmount);
    if (amount < 2 || amount > 1000) {
      toast({
        title: "Invalid Amount",
        description: "Test amount must be between R2 and R1000",
        variant: "destructive",
      });
      return;
    }
    testPaymentMutation.mutate({ amount });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="testAmount">Test Amount (ZAR)</Label>
          <Input
            id="testAmount"
            type="number"
            min="2"
            max="1000"
            step="1.00"
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            placeholder="10.00"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Minimum R2, Maximum R1000 (PayFast requirement)
          </p>
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleTestPayment}
            disabled={testPaymentMutation.isPending}
            className="w-full"
          >
            {testPaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CreditCard className="mr-2 h-4 w-4" />
            Test Payment
          </Button>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This will charge the stored payment method with the test amount. 
          You can refund this transaction if needed. Use this to verify the payment method works before automated billing.
        </p>
      </div>
    </div>
  );
}

interface Agency {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'syncing' | 'error' | 'inactive';
  lastSync: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  productAnalyzerEnabled?: boolean;
  productRentCompareEnabled?: boolean;
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
  invoices: {
    id: string;
    month: string;
    monthName: string;
    reportCount: number;
    amount: number;
    invoiceDate: string;
    status: 'upcoming' | 'paid' | 'overdue';
    dueDate: string;
  }[];
}

interface AgencyDetailModalProps {
  agency: Agency | null;
  isOpen: boolean;
  onClose: () => void;
  onStatsClick: (agencyName: string) => void;
}

function AgencyColorPicker({ agencyId, agencyName, currentColor }: { agencyId: number; agencyName: string; currentColor?: string | null }) {
  const [color, setColor] = useState(currentColor || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isValid = /^#[0-9a-fA-F]{6}$/.test(color);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/primary-color`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ primaryColor: color }),
      });
      if (!res.ok) throw new Error("Failed to save");
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      toast({ title: "Brand color saved", description: `Primary color updated for ${agencyName}.` });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded border border-slate-200 flex-shrink-0" style={{ background: isValid ? color : "#e2e8f0" }} />
      <Input
        value={color}
        onChange={(e) => setColor(e.target.value)}
        placeholder="#1ba2ff"
        className="h-8 w-28 text-xs font-mono"
        maxLength={7}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={saving || !isValid}
        className="h-8 text-xs"
      >
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function AgencyProductToggles({ agencyId, agencyName, analyzerEnabled, rentCompareEnabled }: {
  agencyId: number;
  agencyName: string;
  analyzerEnabled: boolean;
  rentCompareEnabled: boolean;
}) {
  const [analyzer, setAnalyzer] = useState(analyzerEnabled);
  const [rentCompare, setRentCompare] = useState(rentCompareEnabled);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const save = async (nextAnalyzer: boolean, nextRentCompare: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/products`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productAnalyzerEnabled: nextAnalyzer, productRentCompareEnabled: nextRentCompare }),
      });
      if (!res.ok) throw new Error("Failed to save");
      queryClient.invalidateQueries({ queryKey: ["/api/agencies"] });
      toast({ title: "Products updated", description: `Product access updated for ${agencyName}.` });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
      // revert
      setAnalyzer(analyzerEnabled);
      setRentCompare(rentCompareEnabled);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (product: "analyzer" | "rentCompare") => {
    const nextAnalyzer = product === "analyzer" ? !analyzer : analyzer;
    const nextRentCompare = product === "rentCompare" ? !rentCompare : rentCompare;
    setAnalyzer(nextAnalyzer);
    setRentCompare(nextRentCompare);
    save(nextAnalyzer, nextRentCompare);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Property Analyzer</p>
          <p className="text-xs text-muted-foreground">AI-powered investment analysis tool</p>
        </div>
        <Switch checked={analyzer} onCheckedChange={() => toggle("analyzer")} disabled={saving} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Rent Compare</p>
          <p className="text-xs text-muted-foreground">Rental market comparison tool</p>
        </div>
        <Switch checked={rentCompare} onCheckedChange={() => toggle("rentCompare")} disabled={saving} />
      </div>
    </div>
  );
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

  // Invoice download handler
  const handleDownloadInvoice = async (invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceNumber}/download`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download invoice');
      }

      // Create blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Your invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download invoice PDF",
        variant: "destructive",
      });
    }
  };

  if (!agency) return null;

  // Billing calculation functions
  const calculateBillingAmount = (reportCount: number) => {
    let total = 0;
    let remaining = reportCount;

    // Tier 1: 1-50 reports at R200 each
    if (remaining > 0) {
      const tier1Count = Math.min(remaining, 50);
      total += tier1Count * 200;
      remaining -= tier1Count;
    }

    // Tier 2: 51-100 reports at R180 each
    if (remaining > 0) {
      const tier2Count = Math.min(remaining, 50);
      total += tier2Count * 180;
      remaining -= tier2Count;
    }

    // Tier 3: 101-150 reports at R160 each
    if (remaining > 0) {
      const tier3Count = Math.min(remaining, 50);
      total += tier3Count * 160;
      remaining -= tier3Count;
    }

    // Tier 4: 151-200 reports at R140 each
    if (remaining > 0) {
      const tier4Count = Math.min(remaining, 50);
      total += tier4Count * 140;
      remaining -= tier4Count;
    }

    // Tier 5: 200+ reports - custom pricing (for now, use R140)
    if (remaining > 0) {
      total += remaining * 140;
    }

    return total;
  };

  const getCurrentTier = (reportCount: number) => {
    if (reportCount <= 50) return { tier: 1, price: 200, remaining: 50 - reportCount };
    if (reportCount <= 100) return { tier: 2, price: 180, remaining: 100 - reportCount };
    if (reportCount <= 150) return { tier: 3, price: 160, remaining: 150 - reportCount };
    if (reportCount <= 200) return { tier: 4, price: 140, remaining: 200 - reportCount };
    return { tier: 5, price: 140, remaining: 0 };
  };

  const getNextTierBenefit = (reportCount: number) => {
    if (reportCount < 50) return { nextTier: 2, nextPrice: 180, reportsNeeded: 51 - reportCount };
    if (reportCount < 100) return { nextTier: 3, nextPrice: 160, reportsNeeded: 101 - reportCount };
    if (reportCount < 150) return { nextTier: 4, nextPrice: 140, reportsNeeded: 151 - reportCount };
    if (reportCount < 200) return { nextTier: 5, nextPrice: 140, reportsNeeded: 201 - reportCount };
    return null;
  };

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Invoices
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
                    <>
                      <AgencyLogoUpload
                        agencyId={parseInt(agency.mainBranchId)}
                        agencyName={agency.franchiseName || agency.name}
                        currentLogoUrl={agency.logoUrl}
                      />
                      <AgencyColorPicker
                        agencyId={parseInt(agency.mainBranchId)}
                        agencyName={agency.franchiseName || agency.name}
                        currentColor={agency.primaryColor}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {agency.mainBranchId && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ToggleLeft className="h-4 w-4" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AgencyProductToggles
                    agencyId={parseInt(agency.mainBranchId)}
                    agencyName={agency.franchiseName || agency.name}
                    analyzerEnabled={agency.productAnalyzerEnabled ?? false}
                    rentCompareEnabled={agency.productRentCompareEnabled ?? false}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="usage" className="mt-6 space-y-6">
            {loadingReports ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading usage statistics...
                </CardContent>
              </Card>
            ) : reportStats ? (
              <>
                {/* Current Month Billing - Most Prominent */}
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Current Month Usage & Billing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-3xl font-bold text-blue-600">{reportStats.currentMonth}</div>
                        <div className="text-sm text-muted-foreground">Property Reports Generated</div>
                        <div className="flex items-center gap-1 mt-1 text-xs">
                          {getTrendIcon(reportStats.currentMonth, reportStats.previousMonth)}
                          {getTrendText(reportStats.currentMonth, reportStats.previousMonth)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-3xl font-bold text-green-600">
                          R{calculateBillingAmount(reportStats.currentMonth).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Current Month Charges</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Will be billed on 1st of next month
                        </div>
                      </div>

                      <div>
                        {(() => {
                          const currentTier = getCurrentTier(reportStats.currentMonth);
                          const nextTier = getNextTierBenefit(reportStats.currentMonth);
                          return (
                            <div>
                              <div className="text-lg font-bold">
                                Tier {currentTier.tier} - R{currentTier.price}/report
                              </div>
                              <div className="text-sm text-muted-foreground">Current pricing tier</div>
                              {nextTier && (
                                <div className="text-xs text-green-600 mt-1">
                                  {nextTier.reportsNeeded} more reports for R{nextTier.nextPrice}/report
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Previous Month Billing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Previous Month Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-2xl font-bold">{reportStats.previousMonth}</div>
                        <div className="text-sm text-muted-foreground">Property Reports Generated</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          R{calculateBillingAmount(reportStats.previousMonth).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Amount Billed</div>
                      </div>
                      <div>
                        <div className="text-lg font-medium">
                          Tier {getCurrentTier(reportStats.previousMonth).tier}
                        </div>
                        <div className="text-sm text-muted-foreground">Final pricing tier</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Structure */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 border rounded-lg bg-gray-50">
                          <div className="font-medium">Tier 1</div>
                          <div className="text-sm text-muted-foreground">1-50 reports</div>
                          <div className="text-lg font-bold text-blue-600">R200 each</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-green-50">
                          <div className="font-medium">Tier 2</div>
                          <div className="text-sm text-muted-foreground">51-100 reports</div>
                          <div className="text-lg font-bold text-green-600">R180 each</div>
                          <div className="text-xs text-green-600">10% discount</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-green-50">
                          <div className="font-medium">Tier 3</div>
                          <div className="text-sm text-muted-foreground">101-150 reports</div>
                          <div className="text-lg font-bold text-green-600">R160 each</div>
                          <div className="text-xs text-green-600">20% discount</div>
                        </div>
                        <div className="p-4 border rounded-lg bg-green-50">
                          <div className="font-medium">Tier 4</div>
                          <div className="text-sm text-muted-foreground">151-200 reports</div>
                          <div className="text-lg font-bold text-green-600">R140 each</div>
                          <div className="text-xs text-green-600">30% discount</div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mt-4">
                        * Volume discounts applied automatically. Custom pricing available for 200+ reports per month.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Usage Trends Chart */}
                {reportStats.monthlyStats && reportStats.monthlyStats.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Usage Trends</CardTitle>
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
                              formatter={(value, name) => [
                                `${value} reports (R${calculateBillingAmount(Number(value)).toLocaleString()})`,
                                'Usage & Billing'
                              ]}
                            />
                            <Bar dataKey="reports" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All-Time Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>All-Time Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-2xl font-bold">{reportStats.totalReports}</div>
                        <div className="text-sm text-muted-foreground">Total Property Reports Generated</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          R{calculateBillingAmount(reportStats.totalReports).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Value Generated</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground">No Usage Data Available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Usage statistics and billing information will appear here once the agency starts generating property reports
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6 space-y-6">
            {loadingReports ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading invoice history...
                </CardContent>
              </Card>
            ) : reportStats?.invoices && reportStats.invoices.length > 0 ? (
              <>
                {/* Invoice Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Total Invoices</span>
                      </div>
                      <div className="text-2xl font-bold mt-1">{reportStats.invoices.length}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Upcoming</span>
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {reportStats.invoices.filter((inv: any) => inv.status === 'upcoming').length}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Paid</span>
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {reportStats.invoices.filter((inv: any) => inv.status === 'paid').length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Invoices Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium">Invoice ID</th>
                            <th className="text-left py-3 px-2 font-medium">Period</th>
                            <th className="text-right py-3 px-2 font-medium">Reports</th>
                            <th className="text-right py-3 px-2 font-medium">Amount</th>
                            <th className="text-left py-3 px-2 font-medium">Billing Date</th>
                            <th className="text-left py-3 px-2 font-medium">Status</th>
                            <th className="text-right py-3 px-2 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportStats.invoices.map((invoice: any) => (
                            <tr key={invoice.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-2 font-mono text-sm">{invoice.id}</td>
                              <td className="py-3 px-2">{invoice.monthName}</td>
                              <td className="py-3 px-2 text-right">{invoice.reportCount}</td>
                              <td className="py-3 px-2 text-right font-medium">
                                R{invoice.amount.toLocaleString()}
                              </td>
                              <td className="py-3 px-2">
                                {format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}
                              </td>
                              <td className="py-3 px-2">
                                <Badge 
                                  variant={
                                    invoice.status === 'paid' ? 'default' :
                                    invoice.status === 'upcoming' ? 'secondary' :
                                    'destructive'
                                  }
                                  className={
                                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    invoice.status === 'upcoming' ? 'bg-orange-100 text-orange-800' :
                                    'bg-red-100 text-red-800'
                                  }
                                >
                                  {invoice.status === 'upcoming' ? 'Upcoming' : 
                                   invoice.status === 'paid' ? 'Paid' : 'Overdue'}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-right">
                                {invoice.status === 'paid' ? (
                                  <button 
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    onClick={() => handleDownloadInvoice(invoice.id)}
                                  >
                                    Download
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-sm">Download</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Next Invoice Preview */}
                {reportStats.currentMonth > 0 && (
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-800">
                        <Calendar className="h-5 w-5" />
                        Next Invoice Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Current Month Usage</div>
                          <div className="text-lg font-bold">{reportStats.currentMonth} reports</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Estimated Amount</div>
                          <div className="text-lg font-bold text-orange-600">
                            R{calculateBillingAmount(reportStats.currentMonth).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Invoice Date</div>
                          <div className="text-lg font-medium">
                            {format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Due Date</div>
                          <div className="text-lg font-medium">
                            {format(new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium text-muted-foreground">No Invoices Available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Invoice history will appear here once the agency starts generating property reports
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
                  <div className="space-y-4">
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
                    
                    {/* Test Billing Button */}
                    {agency.billingEnabled && (
                      <div className="pt-4 border-t">
                        <TestBillingButton agencyId={agency.id} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium text-muted-foreground">No Payment Methods</p>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                      Add a card to enable automated billing
                    </p>
                    {agency.mainBranchId && (
                      <Button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/payfast/create-tokenize-url', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ branchId: parseInt(agency.mainBranchId!) }),
                            });
                            const data = await res.json();
                            if (data.tokenizeUrl) {
                              window.open(data.tokenizeUrl, '_blank');
                            } else {
                              alert(data.error || 'Failed to create tokenization URL');
                            }
                          } catch (err) {
                            alert('Failed to create tokenization URL');
                          }
                        }}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Add Payment Method
                      </Button>
                    )}
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