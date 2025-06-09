import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp, Users, FileText, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// API fetch function
const fetchAnalyticsData = async () => {
  const response = await fetch('/api/analytics');
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data');
  }
  return response.json();
};

const AnalyticsDashboard = () => {
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalyticsData,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const chartConfig = {
    width: "100%",
    height: 300,
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <Activity className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Analytics Unavailable</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Unable to load analytics data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#262626]">
          Analytics Dashboard
        </h1>
      </div>

      {/* Key Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.activeUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly API Calls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.monthlyApiCalls || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalReportsGenerated || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.monthlyReportsGenerated || 0} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily User Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer {...chartConfig}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                    formatter={(value) => [value, "Signups"]}
                  />
                  <Bar
                    dataKey="signups"
                    fill="#1BA3FF"
                    barSize={20}
                    name="Signups"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Reports Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer {...chartConfig}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                    formatter={(value) => [value, "Reports"]}
                  />
                  <Bar
                    dataKey="reports"
                    fill="#10B981"
                    barSize={20}
                    name="Reports"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer {...chartConfig}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="priceLabsApi"
                    fill="#8B5CF6"
                    stackId="a"
                    barSize={20}
                    name="PriceLabs API"
                  />
                  <Bar
                    dataKey="tpnApi"
                    fill="#10B981"
                    stackId="a"
                    barSize={20}
                    name="TPN API"
                  />
                  <Bar
                    dataKey="fhiApi"
                    fill="#1BA3FF"
                    stackId="a"
                    barSize={20}
                    name="FHI API"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Related Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API-as-a-Service Reports</CardTitle>
            <CardDescription>
              Reports generated through third-party API calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer {...chartConfig}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                    formatter={(value) => [value, "API Reports"]}
                  />
                  <Bar
                    dataKey="apiReports"
                    fill="#8B5CF6"
                    barSize={20}
                    name="API Reports"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Subscribers</CardTitle>
            <CardDescription>
              Monthly paying users (R2000/month)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer {...chartConfig}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                    formatter={(value) => [value, "Subscribers"]}
                  />
                  <Bar
                    dataKey="activeSubscribers"
                    fill="#1BA3FF"
                    barSize={20}
                    name="Active Subscribers"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>
              Combined revenue from subscriptions and API usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer {...chartConfig}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                  />
                  <YAxis
                    tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    labelFormatter={(date) =>
                      new Date(date).toLocaleDateString()
                    }
                    formatter={(value) => [
                      `R${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="subscriptionRevenue"
                    fill="#1BA3FF"
                    stackId="a"
                    name="Subscription Revenue"
                  />
                  <Bar
                    dataKey="apiRevenue"
                    fill="#8B5CF6"
                    stackId="a"
                    name="API Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
