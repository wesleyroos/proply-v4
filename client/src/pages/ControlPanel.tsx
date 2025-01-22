import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, AlertTriangle, RefreshCcw, Plus } from 'lucide-react';

export function ControlPanel() {
  const [integrations] = useState([
    {
      agencyName: "Sothebys Atlantic Seaboard",
      apiProvider: "PropData",
      status: "active",
      lastSync: "2025-01-22 13:30",
      properties: 156,
      reportsGenerated: 42,
      monthlyBilling: "R0.00"
    },
    {
      agencyName: "Quay1",
      apiProvider: "PropCtrl",
      status: "pending",
      lastSync: "-",
      properties: 0,
      reportsGenerated: 0,
      monthlyBilling: "R0.00"
    }
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Syndicator Control Panel</h1>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Integration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="text-lg">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold p-4">
            1 / 5
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg">Total Properties Synced</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold p-4">
            156
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-lg">Reports Generated</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold p-4">
            42
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader className="border-b">
          <CardTitle>Active Integrations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Agency</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Syndicator</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Last Sync</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Properties</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Reports</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {integrations.map((integration, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{integration.agencyName}</td>
                    <td className="px-6 py-4 text-sm">{integration.apiProvider}</td>
                    <td className="px-6 py-4">
                      <Badge variant={integration.status === 'active' ? 'default' : 'secondary'} className="flex items-center gap-1">
                        {integration.status === 'active' ? <BadgeCheck className="w-4 h-4" /> : null}
                        {integration.status === 'active' ? 'Active' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">{integration.lastSync}</td>
                    <td className="px-6 py-4 text-sm">{integration.properties}</td>
                    <td className="px-6 py-4 text-sm">{integration.reportsGenerated}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="p-1">
                          <RefreshCcw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1 text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Available Syndicators</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              <li className="py-2 flex justify-between items-center">
                <span>PropData</span>
                <Badge variant="default">Connected</Badge>
              </li>
              <li className="py-2 flex justify-between items-center">
                <span>PropCtrl</span>
                <span className="text-gray-400">Coming Soon</span>
              </li>
              <li className="py-2 flex justify-between items-center">
                <span>RealtyPA</span>
                <span className="text-gray-400">Coming Soon</span>
              </li>
              <li className="py-2 flex justify-between items-center">
                <span>Fusion</span>
                <span className="text-gray-400">Coming Soon</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              <li className="py-2 text-sm">
                <p className="text-gray-900">PropData sync completed</p>
                <p className="text-gray-500">22 January 2025, 13:30</p>
              </li>
              <li className="py-2 text-sm">
                <p className="text-gray-900">New property synced: 123 Main Road</p>
                <p className="text-gray-500">22 January 2025, 13:25</p>
              </li>
              <li className="py-2 text-sm">
                <p className="text-gray-900">Report generated for Sothebys</p>
                <p className="text-gray-500">22 January 2025, 13:20</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ControlPanel;