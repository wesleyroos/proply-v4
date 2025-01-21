import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, Home, PieChart } from "lucide-react";

interface Property {
  id: number;
  address: string;
  purchasePrice: number;
  floorArea: number;
  shortTermGrossYield: string | null;
  longTermGrossYield: string | null;
  shortTermAnnualRevenue: number | null;
  longTermAnnualRevenue: number | null;
}

interface PropertyComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
}

const formatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Proply color palette
const colors = {
  primary: "#1BA3FF", // Proply blue
  success: "#82ca9d", // Chart green
  warning: "#ffc658", // Chart orange
  info: "#8884d8", // Chart purple
  accent: "#ff7300", // Chart accent
  background: "#F8FAFC",
  text: "#1E293B",
  border: "#E2E8F0",
};

export function PropertyComparisonModal({
  open,
  onOpenChange,
  properties,
}: PropertyComparisonModalProps) {
  const displayProperties = properties.slice(0, 5);

  const metrics = [
    {
      label: "Purchase Price",
      key: "purchasePrice",
      format: (val: number) => formatter.format(val),
      category: "basic",
      higherIsBetter: false,
      getValue: (prop: Property) => prop.purchasePrice,
    },
    {
      label: "Size (m²)",
      key: "floorArea",
      format: (val: number) => val.toString(),
      category: "basic",
      higherIsBetter: true,
      getValue: (prop: Property) => prop.floorArea,
    },
    {
      label: "Rate/m²",
      key: "ratePerMeter",
      format: (val: number) => formatter.format(val),
      category: "basic",
      higherIsBetter: false,
      getValue: (prop: Property) => prop.purchasePrice / prop.floorArea,
    },
    {
      label: "Short Term Yield",
      key: "shortTermGrossYield",
      format: (val: number | null) => (val ? `${val}%` : "--"),
      category: "performance",
      higherIsBetter: true,
      getValue: (prop: Property) => Number(prop.shortTermGrossYield),
    },
    {
      label: "Long Term Yield",
      key: "longTermGrossYield",
      format: (val: number | null) => (val ? `${val}%` : "--"),
      category: "performance",
      higherIsBetter: true,
      getValue: (prop: Property) => Number(prop.longTermGrossYield),
    },
    {
      label: "Short Term Revenue",
      key: "shortTermAnnualRevenue",
      format: (val: number | null) => (val ? formatter.format(val) : "--"),
      category: "performance",
      higherIsBetter: true,
      getValue: (prop: Property) => prop.shortTermAnnualRevenue || 0,
    },
    {
      label: "Long Term Revenue",
      key: "longTermAnnualRevenue",
      format: (val: number | null) => (val ? formatter.format(val) : "--"),
      category: "performance",
      higherIsBetter: true,
      getValue: (prop: Property) => prop.longTermAnnualRevenue || 0,
    },
  ];

  const categories = {
    basic: {
      title: "Basic Information",
      icon: <Home className="h-5 w-5 text-[#1BA3FF]" />,
    },
    performance: {
      title: "Performance Metrics",
      icon: <PieChart className="h-5 w-5 text-[#1BA3FF]" />,
    },
  };

  const getBackgroundColor = (
    value: number,
    values: number[],
    higherIsBetter: boolean,
  ) => {
    if (value === null || value === undefined) return "";

    // Sort values to determine ranking
    const sortedValues = [...values].sort((a, b) =>
      higherIsBetter ? b - a : a - b,
    );

    // Find the position of the current value
    const rank = sortedValues.indexOf(value);

    // Calculate percentage (0-1) where 1 is best performance
    const percentage = 1 - rank / (sortedValues.length - 1);

    // Return different shades of blue based on performance
    // Use opacity to create the shade effect
    switch (true) {
      case percentage >= 0.8:
        return "bg-blue-200 dark:bg-blue-800/50"; // Best performance - darkest
      case percentage >= 0.6:
        return "bg-blue-100 dark:bg-blue-800/40";
      case percentage >= 0.4:
        return "bg-blue-50 dark:bg-blue-800/30";
      case percentage >= 0.2:
        return "bg-blue-25 dark:bg-blue-800/20"; // Lower performance - lighter
      default:
        return ""; // Lowest performance - no background
    }
  };

  const chartData = displayProperties.map((p) => ({
    name: p.address.split(",")[0],
    "Purchase Price": p.purchasePrice,
    "Short Term Revenue": p.shortTermAnnualRevenue,
    "Long Term Revenue": p.longTermAnnualRevenue,
    "Short Term Yield": Number(p.shortTermGrossYield),
    "Long Term Yield": Number(p.longTermGrossYield),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Property Comparison
            </DialogTitle>
            <div className="flex items-center gap-4">
              <Button
                onClick={async () => {
                  const doc = new jsPDF();
                  const pageWidth = doc.internal.pageSize.getWidth();
                  const pageHeight = doc.internal.pageSize.getHeight();
                  const margin = 20;
                  let currentY = margin;

                  // Section descriptions
                  const sectionDescriptions = {
                    overview:
                      "This section provides a visual representation of key metrics across all properties, allowing for quick performance comparison. The chart shows purchase prices, revenues, and yields side by side.",
                    properties:
                      "A summary table showing key metrics for each property, providing a quick overview of the main characteristics and performance indicators.",
                    basic:
                      "Detailed comparison of fundamental property characteristics including purchase price, size, and rate per square meter.",
                    performance:
                      "Analysis of revenue potential and returns, comparing both short-term and long-term rental scenarios across properties.",
                  };

                  // Helper function to add wrapped text
                  const addWrappedText = (
                    text: string,
                    x: number,
                    y: number,
                    maxWidth: number,
                  ) => {
                    // Use full page width minus small padding
                    const lines = doc.splitTextToSize(text, maxWidth - (margin * 0.5));
                    doc.setFontSize(10);
                    doc.setTextColor(80, 80, 80);
                    lines.forEach((line: string) => {
                      doc.text(line, x, y);
                      y += 6;
                    });
                    return y + 6;
                  };

                  // Add Proply logo
                  const logo = new Image();
                  logo.src = "/proply-logo-auth.png";
                  await new Promise((resolve) => {
                    logo.onload = () => {
                      const aspectRatio = logo.height / logo.width;
                      const logoWidth = 40;
                      const logoHeight = logoWidth * aspectRatio;
                      doc.addImage(
                        logo,
                        "PNG",
                        margin,
                        currentY,
                        logoWidth,
                        logoHeight,
                      );
                      currentY += logoHeight + 10;
                      resolve(null);
                    };
                  });

                  // Add title and date
                  doc.setFontSize(20);
                  doc.setTextColor(0, 0, 0); // Reset text color to black
                  doc.text("Property Comparison Report", margin, currentY);
                  currentY += 15;

                  doc.setFontSize(12);
                  doc.text(
                    `Generated on: ${new Date().toLocaleDateString()}`,
                    margin,
                    currentY,
                  );
                  currentY += 20;

                  // Performance Overview Section
                  doc.setFontSize(14);
                  doc.text("Performance Overview", margin, currentY);
                  currentY += 10;
                  currentY = addWrappedText(
                    sectionDescriptions.overview,
                    margin,
                    currentY,
                    pageWidth,
                  );

                  const chartElement =
                    document.querySelector(".recharts-wrapper");
                  if (chartElement) {
                    const canvas = await html2canvas(chartElement);
                    const chartImage = canvas.toDataURL("image/png");
                    const imgWidth = pageWidth - 2 * margin;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    doc.addImage(
                      chartImage,
                      "PNG",
                      margin,
                      currentY,
                      imgWidth,
                      imgHeight,
                    );
                    currentY += imgHeight + 20;
                  }

                  // Check if we need a new page
                  if (currentY > pageHeight - 100) {
                    doc.addPage();
                    currentY = margin;
                  }

                  // Properties Overview Section
                  doc.setFontSize(14);
                  doc.setTextColor(0, 0, 0);
                  doc.text("Properties Overview", margin, currentY);
                  currentY += 10;
                  currentY = addWrappedText(
                    sectionDescriptions.properties,
                    margin,
                    currentY,
                    pageWidth,
                  );

                  const overviewData = displayProperties.map((p) => [
                    p.address,
                    formatter.format(p.purchasePrice),
                    `${p.floorArea} m²`,
                    formatter.format(p.purchasePrice / p.floorArea), // Rate/m²
                    `${p.bedrooms || "-"} bed, ${p.bathrooms || "-"} bath`, // Beds & Baths
                  ]);

                  autoTable(doc, {
                    head: [
                      ["Address", "Price", "Size", "Rate/m²", "Beds & Baths"],
                    ], // Updated headers
                    body: overviewData,
                    startY: currentY,
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [27, 163, 255] },
                    margin: {
                      top: margin,
                      right: margin,
                      bottom: margin,
                      left: margin,
                    },
                  });

                  currentY = (doc as any).lastAutoTable.finalY + 20;

                  // Add metrics tables by category
                  Object.entries(categories).forEach(
                    ([category, { title }]) => {
                      if (currentY > pageHeight - 100) {
                        doc.addPage();
                        currentY = margin;
                      }

                      doc.setFontSize(14);
                      doc.setTextColor(0, 0, 0);
                      doc.text(title, margin, currentY);
                      currentY += 10;

                      // Add section description
                      currentY = addWrappedText(
                        sectionDescriptions[
                          category as keyof typeof sectionDescriptions
                        ],
                        margin,
                        currentY,
                        pageWidth,
                      );

                      const categoryMetrics = metrics.filter(
                        (m) => m.category === category,
                      );
                      const metricData = categoryMetrics.map((metric) => {
                        return [
                          metric.label,
                          ...displayProperties.map((prop) =>
                            metric.format(metric.getValue(prop)),
                          ),
                        ];
                      });

                      autoTable(doc, {
                        head: [
                          [
                            "Metric",
                            ...displayProperties.map(
                              (p) => p.address.split(",")[0],
                            ),
                          ],
                        ],
                        body: metricData,
                        startY: currentY,
                        styles: { fontSize: 10 },
                        headStyles: { fillColor: [27, 163, 255] },
                        margin: {
                          top: margin,
                          right: margin,
                          bottom: margin,
                          left: margin,
                        },
                      });

                      currentY = (doc as any).lastAutoTable.finalY + 20;
                    },
                  );

                  doc.save("property-comparison-report.pdf");
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Report
              </Button>
              <img
                src="/proply-logo-auth.png"
                alt="Proply Logo"
                className="h-8 object-contain"
              />
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(90vh-120px)]">
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-[#1BA3FF]" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Performance Overview
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Visual comparison of property prices, rental revenues, and
                    yields showing relative performance across selected
                    properties.
                  </p>

                  {/* Legend above chart */}
                  <div className="mb-4 flex justify-center">
                    <div className="flex flex-wrap gap-4 justify-center items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: colors.primary }}
                        ></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Purchase Price
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: colors.success }}
                        ></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Short Term Revenue
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: colors.warning }}
                        ></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Long Term Revenue
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3"
                          style={{ backgroundColor: colors.info }}
                        ></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Short Term Yield
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3"
                          style={{ backgroundColor: colors.accent }}
                        ></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Long Term Yield
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart
                        data={chartData}
                        margin={{ top: 20, right: 80, left: 80, bottom: 60 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={colors.border}
                          opacity={0.4}
                        />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fill: colors.text }}
                        />
                        <YAxis
                          yAxisId="left"
                          tickFormatter={(value) => formatter.format(value)}
                          tick={{ fill: colors.text }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: colors.text }}
                        />
                        <Tooltip
                          formatter={(value: any, name: string) => {
                            if (name.includes("Yield")) {
                              return [`${value}%`, name];
                            }
                            return [formatter.format(value), name];
                          }}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.98)",
                            borderRadius: "8px",
                            border: `1px solid ${colors.border}`,
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar
                          dataKey="Purchase Price"
                          fill={colors.primary}
                          yAxisId="left"
                        />
                        <Bar
                          dataKey="Short Term Revenue"
                          fill={colors.success}
                          yAxisId="left"
                        />
                        <Bar
                          dataKey="Long Term Revenue"
                          fill={colors.warning}
                          yAxisId="left"
                        />
                        <Line
                          type="monotone"
                          dataKey="Short Term Yield"
                          stroke={colors.info}
                          yAxisId="right"
                          strokeWidth={2}
                          dot={{ fill: colors.info, r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Long Term Yield"
                          stroke={colors.accent}
                          yAxisId="right"
                          strokeWidth={2}
                          dot={{ fill: colors.accent, r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {Object.entries(categories).map(([category, { title, icon }]) => (
                <Card
                  key={category}
                  className="border-gray-200 dark:border-gray-800 shadow-sm"
                >
                  <CardContent className="p-6">
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="text-gray-700 dark:text-gray-300">
                          {icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category === "basic"
                          ? "Key property details including price, size, and rate per square meter for easy comparison."
                          : "Financial metrics showing rental yields, revenues, and comparative performance indicators."}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-800">
                            <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-400 w-[200px]">
                              Metric
                            </th>
                            {displayProperties.map((property) => (
                              <th
                                key={property.id}
                                className="py-3 px-4 text-left font-medium min-w-[200px] text-gray-900 dark:text-white"
                              >
                                <div className="truncate text-sm">
                                  {property.address}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {metrics
                            .filter((metric) => metric.category === category)
                            .map((metric) => {
                              const values = displayProperties.map((prop) =>
                                metric.getValue(prop),
                              );
                              return (
                                <tr
                                  key={metric.label}
                                  className="border-b border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">
                                    {metric.label}
                                  </td>
                                  {displayProperties.map((property) => {
                                    const value = metric.getValue(property);
                                    return (
                                      <td
                                        key={property.id}
                                        className={`py-3 px-4 text-sm font-medium text-gray-900 dark:text-white transition-colors ${getBackgroundColor(
                                          value,
                                          values,
                                          metric.higherIsBetter,
                                        )}`}
                                      >
                                        {metric.format(value)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default PropertyComparisonModal;
