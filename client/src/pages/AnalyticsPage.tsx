import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from "lucide-react";

interface AnalyticsData {
  totalUsers: number;
  adminUsers: number;
  proUsers: number;
  freeUsers: number;
  corporateUsers: number;
  individualUsers: number;
  totalApiCalls: number;
  monthlyApiCalls: number;
  monthlyReportsGenerated: number;
  totalReportsGenerated: number;
  dailyAnalytics: {
    date: string;
    analyses: number;
    properties: number;
  }[];
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[#262626] mb-6">Analytics Dashboard</h1>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Platform-wide user count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{analytics?.totalUsers || 0}</p>
              <div className="text-sm text-muted-foreground">
                <div>Pro: {analytics?.proUsers || 0}</div>
                <div>Free: {analytics?.freeUsers || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Types</CardTitle>
            <CardDescription>Distribution by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <div>Corporate: {analytics?.corporateUsers || 0}</div>
                <div>Individual: {analytics?.individualUsers || 0}</div>
                <div>Admin: {analytics?.adminUsers || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Usage</CardTitle>
            <CardDescription>Total and monthly calls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{analytics?.totalApiCalls || 0}</p>
              <div className="text-sm text-muted-foreground">
                This Month: {analytics?.monthlyApiCalls || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports Generated</CardTitle>
            <CardDescription>Total and monthly reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{analytics?.totalReportsGenerated || 0}</p>
              <div className="text-sm text-muted-foreground">
                This Month: {analytics?.monthlyReportsGenerated || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Analyses and properties over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics?.dailyAnalytics || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="analyses"
                  stroke="#1BA3FF"
                  name="Analyses"
                />
                <Line
                  type="monotone"
                  dataKey="properties"
                  stroke="#114D9D"
                  name="Properties"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}