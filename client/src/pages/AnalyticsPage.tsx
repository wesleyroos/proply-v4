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
import { Loader2 } from "lucide-react";

const timePeriods = [
  { value: "all", label: "All Time" },
  { value: "1year", label: "1 Year" },
  { value: "90days", label: "90 Days" },
  { value: "30days", label: "30 Days" },
  { value: "7days", label: "7 Days" },
];

const generateMockData = (days = 30) => {
  const monthlySubscriptions = 5; // 5 subscriptions at R2000 each = R10,000/month
  const targetMonthlyApiReports = 150; // 150 reports at R200 each = R30,000/month
  const dailyApiReports = Math.ceil(targetMonthlyApiReports / 30); // ~5 per day

  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    // Add some daily variation to API reports (±2)
    const apiReports = dailyApiReports + Math.floor(Math.random() * 4) - 2;

    return {
      date: date.toISOString(),
      signups: Math.floor(Math.random() * 3), // Much lower daily signups
      reports: Math.floor(Math.random() * 10) + 5, // Reduced report generation
      priceLabsApi: Math.floor(Math.random() * 20) + 10,
      tpnApi: Math.floor(Math.random() * 5),
      fhiApi: Math.floor(Math.random() * 5),
      apiReports,
      activeSubscribers: monthlySubscriptions,
      apiRevenue: apiReports * 200,
      subscriptionRevenue: (monthlySubscriptions * 2000) / 30, // Daily portion of monthly revenue
      totalRevenue: apiReports * 200 + (monthlySubscriptions * 2000) / 30,
    };
  }).reverse();
};

const AnalyticsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [loading, setLoading] = useState(false);
  const data = generateMockData();

  const chartConfig = {
    width: "100%",
    height: 300,
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
  };

  const monthlyTotals = {
    apiRevenue: data.reduce((sum, day) => sum + day.apiRevenue, 0),
    subscriptionRevenue: data.reduce(
      (sum, day) => sum + day.subscriptionRevenue,
      0,
    ),
    totalRevenue: data.reduce((sum, day) => sum + day.totalRevenue, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#262626]">
          Analytics Dashboard
        </h1>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {timePeriods.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">API Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#8B5CF6]">
              R{monthlyTotals.apiRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              From API-as-a-Service Reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              Subscription Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#1BA3FF]">
              R{monthlyTotals.subscriptionRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              From Monthly Subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#262626]">
              R{monthlyTotals.totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Combined Monthly Revenue
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
