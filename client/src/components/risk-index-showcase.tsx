"use client";

import { useState } from "react";
import {
  Shield,
  AlertTriangle,
  Droplets,
  Cloud,
  Zap,
  MapPin,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { DemoRequestModal } from "@/components/DemoRequestModal";

export function RiskIndexShowcase() {
  const [activeProperty, setActiveProperty] = useState("property1");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false); // Added state for demo modal

  // Sample property data
  const properties = {
    property1: {
      address: "123 Waterfront Drive, Cape Town",
      score: 31,
      riskLevel: "Low",
      riskColor: "#4ade80",
      factors: [
        {
          name: "Security",
          value: 21,
          max: 50,
          percent: 42,
          level: "Medium",
          color: "#fbbf24",
        },
        {
          name: "Environmental",
          value: 21,
          max: 40,
          percent: 53,
          level: "Medium",
          color: "#fbbf24",
        },
        {
          name: "Flood",
          value: 10,
          max: 10,
          percent: 100,
          level: "High",
          color: "#ef4444",
        },
        {
          name: "Climate",
          value: 62,
          max: 270,
          percent: 23,
          level: "Low",
          color: "#4ade80",
        },
        {
          name: "Hail",
          value: 10,
          max: 30,
          percent: 33,
          level: "Medium",
          color: "#fbbf24",
        },
      ],
      insights: [
        "Property is in a flood-prone area - consider flood insurance",
        "Security risk is moderate - standard security measures recommended",
        "Climate risk is low with minimal expected impact over next 30 years",
      ],
    },
    property2: {
      address: "45 Highland Avenue, Johannesburg",
      score: 58,
      riskLevel: "Medium",
      riskColor: "#fbbf24",
      factors: [
        {
          name: "Security",
          value: 35,
          max: 50,
          percent: 70,
          level: "High",
          color: "#ef4444",
        },
        {
          name: "Environmental",
          value: 12,
          max: 40,
          percent: 30,
          level: "Low",
          color: "#4ade80",
        },
        {
          name: "Flood",
          value: 2,
          max: 10,
          percent: 20,
          level: "Low",
          color: "#4ade80",
        },
        {
          name: "Climate",
          value: 170,
          max: 270,
          percent: 63,
          level: "Medium",
          color: "#fbbf24",
        },
        {
          name: "Hail",
          value: 25,
          max: 30,
          percent: 83,
          level: "High",
          color: "#ef4444",
        },
      ],
      insights: [
        "High security risk area - enhanced security measures recommended",
        "Hail damage is common - specialized roof protection advised",
        "Low flood risk but moderate climate change impact expected",
      ],
    },
    property3: {
      address: "78 Coastal Road, Durban",
      score: 72,
      riskLevel: "High",
      riskColor: "#ef4444",
      factors: [
        {
          name: "Security",
          value: 20,
          max: 50,
          percent: 40,
          level: "Medium",
          color: "#fbbf24",
        },
        {
          name: "Environmental",
          value: 32,
          max: 40,
          percent: 80,
          level: "High",
          color: "#ef4444",
        },
        {
          name: "Flood",
          value: 9,
          max: 10,
          percent: 90,
          level: "High",
          color: "#ef4444",
        },
        {
          name: "Climate",
          value: 210,
          max: 270,
          percent: 78,
          level: "High",
          color: "#ef4444",
        },
        {
          name: "Hail",
          value: 8,
          max: 30,
          percent: 27,
          level: "Low",
          color: "#4ade80",
        },
      ],
      insights: [
        "Coastal property with high flood and storm surge risk",
        "Climate change impact expected to be severe within 10 years",
        "Environmental hazards present - detailed assessment recommended",
      ],
    },
  };

  const property = properties[activeProperty as keyof typeof properties];

  // Calculate total risk score
  const totalRiskValue = property.factors.reduce(
    (sum, factor) => sum + factor.value,
    0,
  );
  const totalRiskMax = property.factors.reduce(
    (sum, factor) => sum + factor.max,
    0,
  );

  // Function to get icon for each risk factor
  const getFactorIcon = (name: string) => {
    switch (name) {
      case "Security":
        return <Shield className="h-4 w-4" />;
      case "Environmental":
        return <AlertTriangle className="h-4 w-4" />;
      case "Flood":
        return <Droplets className="h-4 w-4" />;
      case "Climate":
        return <Cloud className="h-4 w-4" />;
      case "Hail":
        return <Zap className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  // Function to render recommendation buttons based on risk level
  const renderRecommendationButtons = () => {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="border-proply-blue text-proply-blue hover:bg-proply-blue/5"
          onClick={() => setIsDemoModalOpen(true)} // Updated to open demo modal
        >
          Request Assessment
        </Button>
        <Link href="/insurers">
          <Button
            variant="default"
            className="w-full bg-proply-blue hover:bg-proply-blue/90 text-white"
          >
            Find Out More
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border overflow-hidden">
      {/* Header with search */}
      <div className="p-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">Proply Risk Index™</h3>
            <p className="text-gray-500">
              Insurance-grade risk assessment for any property
            </p>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search any address..."
                className="pr-10"
                value={property.address}
                onChange={() => {}}
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Property selector */}
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="flex overflow-x-auto gap-2">
          <Button
            variant={activeProperty === "property1" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveProperty("property1")}
            className={
              activeProperty === "property1"
                ? "bg-proply-blue hover:bg-proply-blue/90"
                : ""
            }
          >
            <MapPin className="h-3 w-3 mr-1" /> Cape Town Property
          </Button>
          <Button
            variant={activeProperty === "property2" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveProperty("property2")}
            className={
              activeProperty === "property2"
                ? "bg-proply-blue hover:bg-proply-blue/90"
                : ""
            }
          >
            <MapPin className="h-3 w-3 mr-1" /> Johannesburg Property
          </Button>
          <Button
            variant={activeProperty === "property3" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveProperty("property3")}
            className={
              activeProperty === "property3"
                ? "bg-proply-blue hover:bg-proply-blue/90"
                : ""
            }
          >
            <MapPin className="h-3 w-3 mr-1" /> Durban Property
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column - Risk gauge and summary */}
          <div>
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 mb-4">
                {/* Background circle */}
                <div className="absolute inset-0 rounded-full border-[8px] border-gray-100"></div>

                {/* Progress arc */}
                <svg className="absolute inset-0" viewBox="0 0 100 100">
                  <path
                    d={`M50,10 A40,40 0 ${property.score > 50 ? 1 : 0},1 ${
                      50 + 40 * Math.sin((property.score / 100) * Math.PI * 2)
                    },${50 - 40 * Math.cos((property.score / 100) * Math.PI * 2)}`}
                    fill="none"
                    stroke={property.riskColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-5xl font-bold">{property.score}%</span>
                  <span
                    className="text-sm font-medium mt-1"
                    style={{ color: property.riskColor }}
                  >
                    {property.riskLevel} Risk
                  </span>
                </div>
              </div>

              <div className="text-center mb-6">
                <h4 className="font-medium text-lg">{property.address}</h4>
                <p className="text-sm text-gray-500">
                  Total Risk Score: {totalRiskValue}/{totalRiskMax}
                </p>
              </div>

              {/* Risk insights */}
              <div className="w-full border rounded-lg p-4 bg-gray-50">
                <h4 className="font-bold mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-proply-blue" />
                  Risk Insights
                </h4>
                <ul className="space-y-2">
                  {property.insights.map((insight, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <div className="min-w-[16px] h-4 flex items-center justify-center rounded-full bg-proply-blue text-white text-[10px] mt-0.5">
                        {i + 1}
                      </div>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right column - Risk factors */}
          <div>
            <h4 className="font-bold mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-proply-blue" />
              Risk Factor Analysis
            </h4>

            <div className="space-y-5">
              {property.factors.map((factor, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <span className="flex items-center gap-1.5">
                        {getFactorIcon(factor.name)}
                        <span className="font-medium">{factor.name}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {factor.value}/{factor.max}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${factor.color}20`,
                          color: factor.color,
                        }}
                      >
                        {factor.level}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 ease-out"
                      style={{
                        width: `${factor.percent}%`,
                        backgroundColor: factor.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="mt-8 border-t pt-6">
              <h4 className="font-bold mb-3">Insurance Recommendations</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2 bg-proply-blue/10 p-3 rounded-lg border border-proply-blue/20">
                  <Shield className="h-5 w-5 text-proply-blue" />
                  <span className="font-medium text-proply-blue">
                    {property.riskLevel === "High"
                      ? "Premium Coverage Recommended"
                      : property.riskLevel === "Medium"
                        ? "Standard Coverage Recommended"
                        : "Basic Coverage Recommended"}
                  </span>
                </div>
                {renderRecommendationButtons()}
              </div>
            </div>
          </div>
        </div>
      </div>
      <DemoRequestModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
}
