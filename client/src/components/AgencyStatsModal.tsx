import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, FileText, BarChart3, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface AgencyStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyName: string;
}

interface ReportStats {
  agencyName: string;
  totalReports: number;
  currentMonthReports: number;
  reports: Array<{
    id: number;
    propertyId: string;
    reportType: string;
    timestamp: string;
    userId: number | null;
  }>;
  monthlyStats: Array<{
    month: string;
    reports: number;
  }>;
  reportTypeStats: Array<{
    reportType: string;
    count: number;
  }>;
}

const fetchAgencyStats = async (agencyName: string): Promise<ReportStats> => {
  const response = await fetch(`/api/agency-report-stats/${encodeURIComponent(agencyName)}`);
  if (!response.ok) {
    throw new Error("Failed to fetch agency report statistics");
  }
  return response.json();
};

export const AgencyStatsModal: React.FC<AgencyStatsModalProps> = ({
  isOpen,
  onClose,
  agencyName,
}) => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["agency-stats", agencyName],
    queryFn: () => fetchAgencyStats(agencyName),
    enabled: isOpen && !!agencyName,
  });

  const formatReportType = (type: string) => {
    switch (type) {
      case "valuation":
        return "Valuation Report";
      case "pdf":
        return "PDF Report";
      case "rental":
        return "Rental Analysis";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, 'MMM yyyy');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Report Statistics - {agencyName}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading statistics...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            Error loading statistics: {(error as Error).message}
          </div>
        )}

        {stats && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalReports}</div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.currentMonthReports}</div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(), 'MMMM yyyy')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Report Types</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.reportTypeStats.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Different types
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Two-column layout for charts and report types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Report Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.monthlyStats.length > 0 ? (
                    <div className="space-y-2">
                      {stats.monthlyStats.slice(0, 6).map((month) => (
                        <div key={month.month} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{formatMonth(month.month)}</span>
                          <Badge variant="secondary">{month.reports} reports</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No monthly data available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Report Type Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Type Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.reportTypeStats.length > 0 ? (
                    <div className="space-y-2">
                      {stats.reportTypeStats.map((type) => (
                        <div key={type.reportType} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{formatReportType(type.reportType)}</span>
                          <Badge variant="outline">{type.count} reports</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No report type data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                {stats.reports.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property ID</TableHead>
                        <TableHead>Report Type</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.reports.slice(0, 10).map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono text-sm">
                            {report.propertyId}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {formatReportType(report.reportType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(report.timestamp), 'PPp')}
                          </TableCell>
                          <TableCell>
                            {report.userId ? `User ${report.userId}` : "System"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No reports found for this agency
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};