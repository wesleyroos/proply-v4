import React from "react";
import { MapPin, Shield, BarChart3, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RiskIndexShowcase() {
  return (
    <div className="bg-white rounded-xl border shadow-lg overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-xl font-semibold mb-2">Property Risk Analysis</h3>
        <p className="text-gray-500">32 Acacia Avenue, Durbanville, Cape Town</p>
      </div>

      <div className="p-6">
        {/* Overall Risk Score */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-medium">Overall Risk Score</h4>
            <p className="text-sm text-gray-500">Comprehensive risk assessment</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Low Risk</Badge>
            <div className="text-2xl font-bold">32</div>
          </div>
        </div>

        {/* Risk Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            {
              title: "Crime",
              value: 28,
              status: "Low Risk",
              color: "green",
              icon: Shield,
            },
            {
              title: "Environmental",
              value: 45,
              status: "Medium Risk",
              color: "yellow",
              icon: BarChart3,
            },
            {
              title: "Natural Hazards",
              value: 22,
              status: "Low Risk",
              color: "green",
              icon: AlertTriangle,
            },
          ].map((item, i) => (
            <Card key={i} className="border">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full bg-${item.color}-100`}>
                      <item.icon className={`h-4 w-4 text-${item.color}-800`} />
                    </div>
                    <h5 className="font-medium">{item.title}</h5>
                  </div>
                  <div className="text-xl font-bold">{item.value}</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${item.color}-500 h-2 rounded-full`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-right">
                  <Badge
                    className={`bg-${item.color}-100 text-${item.color}-800 hover:bg-${item.color}-200`}
                  >
                    {item.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map Placeholder */}
        <div className="rounded-lg overflow-hidden border h-64 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p>Interactive property location map would appear here</p>
          </div>
        </div>

        {/* Risk Factors */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-lg font-medium mb-4">Key Risk Factors</h4>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-gray-500 mr-2">•</span>
              <span>Low crime rates compared to surrounding areas</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-500 mr-2">•</span>
              <span>Minimal flood risk due to elevated terrain</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-500 mr-2">•</span>
              <span>Moderate exposure to seasonal wind patterns</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-500 mr-2">•</span>
              <span>No significant geological hazards identified</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}