import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control Panel</h1>
          <p className="text-muted-foreground mt-2">
            Manage and monitor syndicator integrations
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Integration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 / 5</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Properties Synced
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reports Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Integrations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium">Agency</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Syndicator</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Last Sync</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Properties</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Reports</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {integrations.map((integration, i) => (
                    <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{integration.agencyName}</td>
                      <td className="p-4 align-middle">{integration.apiProvider}</td>
                      <td className="p-4 align-middle">
                        <Badge variant={integration.status === 'active' ? 'default' : 'secondary'} className="flex w-fit items-center gap-1">
                          {integration.status === 'active' ? <BadgeCheck className="w-4 h-4" /> : null}
                          {integration.status === 'active' ? 'Active' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">{integration.lastSync}</td>
                      <td className="p-4 align-middle">{integration.properties}</td>
                      <td className="p-4 align-middle">{integration.reportsGenerated}</td>
                      <td className="p-4 align-middle">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <RefreshCcw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
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
            <CardHeader>
              <CardTitle>Available Syndicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">PropData</span>
                  <Badge>Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">PropCtrl</span>
                  <span className="text-muted-foreground">Coming Soon</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">RealtyPA</span>
                  <span className="text-muted-foreground">Coming Soon</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Fusion</span>
                  <span className="text-muted-foreground">Coming Soon</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">PropData sync completed</p>
                  <p className="text-sm text-muted-foreground">22 January 2025, 13:30</p>
                </div>
                <div>
                  <p className="font-medium">New property synced: 123 Main Road</p>
                  <p className="text-sm text-muted-foreground">22 January 2025, 13:25</p>
                </div>
                <div>
                  <p className="font-medium">Report generated for Sothebys</p>
                  <p className="text-sm text-muted-foreground">22 January 2025, 13:20</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;