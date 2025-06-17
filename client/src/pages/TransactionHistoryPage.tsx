import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Search, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Copy,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  transactionId: string;
  invoiceId: string;
  agencyId: string;
  agencyName: string;
  amount: string;
  status: string;
  payfastTransactionId: string;
  payfastPaymentId: string;
  processedAt: string;
  errorMessage: string | null;
  gatewayResponse: any;
}

interface TransactionStats {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
}

export default function TransactionHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agencyFilter, setAgencyFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  // Fetch transaction data
  const { data: transactionData, isLoading } = useQuery({
    queryKey: ["/api/admin/transactions", statusFilter, agencyFilter, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (agencyFilter) params.append("agency", agencyFilter);
      if (dateFilter) params.append("date", dateFilter);

      const response = await fetch(`/api/admin/transactions?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      return response.json();
    },
  });

  const transactions: Transaction[] = transactionData?.transactions || [];
  const stats: TransactionStats = transactionData?.stats || {
    totalTransactions: 0,
    totalAmount: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    successRate: 0,
  };

  const formatCurrency = (amount: string) => {
    return `R${parseFloat(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground">
          View and manage all payment transactions across agencies
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4" />
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency((stats.totalAmount || 0).toString())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulTransactions} of {stats.totalTransactions} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Failed Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedTransactions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="agency-filter">Agency</Label>
              <Input
                id="agency-filter"
                placeholder="Search agency..."
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter("all");
                  setAgencyFilter("");
                  setDateFilter("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>PayFast ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.transactionId}>
                      <TableCell className="font-mono text-sm">
                        {transaction.transactionId.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.invoiceId}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.agencyName}</div>
                          <div className="text-sm text-muted-foreground">{transaction.agencyId}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                        {transaction.errorMessage && (
                          <div className="text-xs text-red-600 mt-1">
                            {transaction.errorMessage}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {transaction.payfastTransactionId !== 'unknown' 
                          ? transaction.payfastTransactionId 
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.processedAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Transaction ID</h4>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{selectedTransaction.transactionId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedTransaction.transactionId);
                        toast({ title: "Transaction ID copied to clipboard" });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Status</h4>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Amount</h4>
                  <span className="text-lg font-medium">{formatCurrency(selectedTransaction.amount)}</span>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Processed Date</h4>
                  <span>{format(new Date(selectedTransaction.processedAt), 'MMM dd, yyyy HH:mm:ss')}</span>
                </div>
              </div>

              <Separator />

              {/* Agency Information */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Agency Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Agency Name:</span>
                    <div className="font-medium">{selectedTransaction.agencyName}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Agency ID:</span>
                    <div className="font-mono text-sm">{selectedTransaction.agencyId}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Information */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Invoice ID:</span>
                    <div className="font-mono text-sm">{selectedTransaction.invoiceId}</div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">PayFast Transaction ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {selectedTransaction.payfastTransactionId !== 'unknown' 
                          ? selectedTransaction.payfastTransactionId 
                          : 'N/A'
                        }
                      </span>
                      {selectedTransaction.payfastTransactionId !== 'unknown' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedTransaction.payfastTransactionId);
                            toast({ title: "PayFast ID copied to clipboard" });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {selectedTransaction.payfastPaymentId && (
                    <div>
                      <span className="text-sm text-muted-foreground">PayFast Payment ID:</span>
                      <div className="font-mono text-sm">{selectedTransaction.payfastPaymentId}</div>
                    </div>
                  )}
                  {selectedTransaction.paymentMethodId && (
                    <div>
                      <span className="text-sm text-muted-foreground">Payment Method ID:</span>
                      <div className="font-mono text-sm">{selectedTransaction.paymentMethodId}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Information */}
              {selectedTransaction.errorMessage && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Error Information</h4>
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-800">{selectedTransaction.errorMessage}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Gateway Response */}
              {selectedTransaction.gatewayResponse && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">PayFast Gateway Response</h4>
                    <div className="bg-gray-50 border rounded-md p-3">
                      <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(selectedTransaction.gatewayResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}