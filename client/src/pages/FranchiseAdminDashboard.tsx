import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser, usePermissions } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Building2, FileText, TrendingUp, AlertCircle, CheckCircle, Send, Download, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function StatCard({ title, value, sub, icon: Icon }: { title: string; value: React.ReactNode; sub?: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function FranchiseAdminDashboard() {
  const { user } = useUser();
  const { isFranchiseAdmin } = usePermissions();
  const fid = user?.franchiseId;

  if (!isFranchiseAdmin()) {
    return (
      <div className="p-8">
        <Card><CardContent className="pt-6"><p className="text-destructive">Access denied.</p></CardContent></Card>
      </div>
    );
  }

  const fetchOpts = { credentials: "include" as const };

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/franchise/metrics", fid],
    queryFn: () => fetch(`/api/franchise/${fid}/metrics`, fetchOpts).then(r => r.json()),
    enabled: !!fid,
  });

  const { data: noReports = [], isLoading: noReportsLoading } = useQuery<any[]>({
    queryKey: ["/api/franchise/listings-without-reports", fid],
    queryFn: () => fetch(`/api/franchise/${fid}/listings-without-reports`, fetchOpts).then(r => r.json()),
    enabled: !!fid,
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<any[]>({
    queryKey: ["/api/franchise/agent-leaderboard", fid],
    queryFn: () => fetch(`/api/franchise/${fid}/agent-leaderboard`, fetchOpts).then(r => r.json()),
    enabled: !!fid,
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery<any[]>({
    queryKey: ["/api/franchise/activity", fid],
    queryFn: () => fetch(`/api/franchise/${fid}/activity`, fetchOpts).then(r => r.json()),
    enabled: !!fid,
  });

  const { data: chartData = [] } = useQuery<any[]>({
    queryKey: ["/api/franchise/reports-per-month", fid],
    queryFn: () => fetch(`/api/franchise/${fid}/reports-per-month`, fetchOpts).then(r => r.json()),
    enabled: !!fid,
  });

  if (metricsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const coveragePct = metrics?.coveragePct ?? 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your Proply report overview</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Listings" value={metrics?.activeListings ?? 0} icon={Building2} />
        <StatCard title="Reports Generated" value={metrics?.totalReports ?? 0} sub="All time" icon={FileText} />
        <StatCard title="This Month" value={metrics?.reportsThisMonth ?? 0} sub="Reports generated" icon={TrendingUp} />
        <StatCard
          title="Report Coverage"
          value={`${coveragePct}%`}
          sub={`${metrics?.listingsWithReport ?? 0} of ${metrics?.activeListings ?? 0} active listings`}
          icon={CheckCircle}
        />
      </div>

      {/* Coverage bar */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Report coverage across active listings</span>
            <span className="text-sm text-muted-foreground">{coveragePct}%</span>
          </div>
          <Progress value={coveragePct} className="h-3" />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> {metrics?.listingsWithReport ?? 0} with report</span>
            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-orange-400" /> {metrics?.listingsWithoutReport ?? 0} missing</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="missing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="missing">Missing Reports ({metrics?.listingsWithoutReport ?? 0})</TabsTrigger>
          <TabsTrigger value="agents">Agent Leaderboard</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="chart">Reports Over Time</TabsTrigger>
        </TabsList>

        {/* Listings without reports */}
        <TabsContent value="missing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                Active listings without a Proply report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {noReportsLoading ? (
                <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : noReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                  All active listings have reports. Great work!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Address</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Listed</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {noReports.map((listing: any) => (
                      <TableRow key={listing.propdata_id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{listing.address}</TableCell>
                        <TableCell className="text-sm">{listing.agent_name || "—"}</TableCell>
                        <TableCell className="text-sm">{listing.property_type || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {listing.price ? `R${Number(listing.price).toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {listing.listing_date
                            ? formatDistanceToNow(new Date(listing.listing_date), { addSuffix: true })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" asChild>
                            <a href={`/report/${listing.propdata_id}`} target="_blank" rel="noopener noreferrer">
                              View
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent leaderboard */}
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agent Report Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : leaderboard.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No agent data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Active Listings</TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead>Coverage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((agent: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{agent.agent_name}</TableCell>
                        <TableCell>{agent.active_listings}</TableCell>
                        <TableCell>{agent.reports_generated}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={parseInt(agent.coverage_pct)} className="h-2 w-20" />
                            <span className="text-sm">{agent.coverage_pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent activity */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Report Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : activity.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No activity yet</p>
              ) : (
                <div className="space-y-3">
                  {activity.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className="flex-shrink-0">
                        {item.activity_type === "sent"
                          ? <Send className="w-4 h-4 text-blue-500" />
                          : <Download className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.activity_type === "sent"
                            ? `Sent to ${item.recipient_email}`
                            : "Downloaded"}
                          {item.agent_name ? ` · ${item.agent_name}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chart */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reports Generated Per Month</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No report data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="reports" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
