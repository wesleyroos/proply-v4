
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building2, TrendingUp, Users, Calendar, PiggyBank, Percent } from "lucide-react";
import { formatter } from "../utils/formatting";

interface DashboardProps {
  userRole: 'investor' | 'manager' | 'agent';
  metrics: {
    totalProperties: number;
    totalValue: number;
    averageROI: number;
    occupancyRate?: number;
    monthlyRevenue?: number;
    clientCount?: number;
  };
  properties: any[];
}

export default function RoleDashboard({ userRole, metrics, properties }: DashboardProps) {
  const renderInvestorMetrics = () => (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(metrics.totalValue)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.averageROI}%</div>
        </CardContent>
      </Card>
      {/* Add more investor-specific metrics */}
    </div>
  );

  const renderManagerMetrics = () => (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.occupancyRate}%</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatter.format(metrics.monthlyRevenue || 0)}</div>
        </CardContent>
      </Card>
      {/* Add more manager-specific metrics */}
    </div>
  );

  const renderAgentMetrics = () => (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.clientCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Properties</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalProperties}</div>
        </CardContent>
      </Card>
      {/* Add more agent-specific metrics */}
    </div>
  );

  return (
    <div className="space-y-6">
      {userRole === 'investor' && renderInvestorMetrics()}
      {userRole === 'manager' && renderManagerMetrics()}
      {userRole === 'agent' && renderAgentMetrics()}
      
      {/* Common Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={properties}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatter.format(value)} />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
