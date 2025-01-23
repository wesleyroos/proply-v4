import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from "lucide-react";

interface SignupData {
  date: string;
  count: number;
}

const timePeriods = [
  { value: "all", label: "All Time" },
  { value: "1year", label: "1 Year" },
  { value: "90days", label: "90 Days" },
  { value: "30days", label: "30 Days" },
  { value: "7days", label: "7 Days" },
];

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days");

  const { data: signupData, isLoading: signupsLoading } = useQuery<SignupData[]>({
    queryKey: ['/api/analytics/signups', { period: selectedPeriod }],
  });

  const { data: reportData, isLoading: reportsLoading } = useQuery<SignupData[]>({
    queryKey: ['/api/analytics/reports', { period: selectedPeriod }],
  });

  if (signupsLoading || reportsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#262626]">User Signups</h1>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {timePeriods.map(period => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Signup Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={signupData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [value, "Signups"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1BA3FF"
                    name="Signups"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={reportData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [value, "Reports"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10B981"
                    name="Reports"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}