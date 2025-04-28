import React from "react";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

export function RiskIndexShowcase() {
  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-indigo-700 to-blue-500 text-white">
        <h3 className="text-xl font-bold mb-2 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Proply Risk Index™
        </h3>
        <p className="text-white/80 text-sm">Comprehensive property risk assessment</p>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Risk Score</span>
            <span className="text-sm font-bold text-green-600">Low Risk (82/100)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: "82%" }}></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            {
              title: "Flood Risk",
              score: "Very Low",
              icon: CheckCircle2,
              color: "text-green-600",
              description: "Property is elevated 16m above sea level",
            },
            {
              title: "Crime Risk",
              score: "Medium",
              icon: AlertTriangle,
              color: "text-yellow-600",
              description: "Above average property crime in area",
            },
            {
              title: "Fire Risk",
              score: "Low",
              icon: CheckCircle2,
              color: "text-green-600",
              description: "No vegetation within 100m of property",
            },
          ].map((risk, i) => (
            <div key={i} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
              <risk.icon className={`h-5 w-5 mt-0.5 ${risk.color}`} />
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{risk.title}</span>
                  <span className={`text-xs font-bold ${risk.color}`}>{risk.score}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{risk.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}