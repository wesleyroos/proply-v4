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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toISOString(),
      signups: Math.floor(Math.random() * 100) + 50,
      reports: Math.floor(Math.random() * 80) + 30,
      priceLabsApi: Math.floor(Math.random() * 200) + 100,
      tpnApi: Math.floor(Math.random() * 50),
      fhiApi: Math.floor(Math.random() * 30),
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
    </div>
  );
};

export default AnalyticsDashboard;
