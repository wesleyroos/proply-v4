import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Line,
  ComposedChart,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  Home,
  PieChart,
  Building2,
  Hotel,
  Home as HomeIcon,
  Info,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  isLoading?: boolean;
}

const formatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Proply color palette
const colors = {
  primary: "#1BA3FF",
  success: "#82ca9d",
  warning: "#ffc658",
  info: "#8884d8",
  accent: "#ff7300",
  background: "#F8FAFC",
  text: "#1E293B",
  border: "#E2E8F0",
};

// Helper function to determine property type icon
const getPropertyTypeIcon = (address: string) => {
  const lowerAddress = address.toLowerCase();
  if (lowerAddress.includes("apartment")) return Building2;
  if (lowerAddress.includes("hotel")) return Hotel;
  return HomeIcon;
};

// Loading component
const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-[#1BA3FF]" />
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Loading comparison data...
      </p>
    </div>
  </div>
);

export function PropertyComparisonModal({
  open,
  onOpenChange,
  properties,
  isLoading = false,
}: PropertyComparisonModalProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const displayProperties = properties.slice(0, 5);

  const metrics = [
    {
      label: "Purchase Price",
      key: "purchasePrice",
      format: (val: number) => formatter.format(val),
      category: "basic",
      higherIsBetter: false,
      getValue: (prop: Property) => prop.purchasePrice,
      description: "The total purchase price of the property in ZAR",
    },
    {
      label: "Size (m²)",
      key: "floorArea",
      format: (val: number) => val.toString(),
      category: "basic",
      higherIsBetter: true,
      getValue: (prop: Property) => prop.floorArea,
      description: "Total floor area of the property in square meters",
    },
    {
      label: "Rate/m²",
      key: "ratePerMeter",
      format: (val: number) => formatter.format(val),
      category: "basic",
      higherIsBetter: false,
      getValue: (prop: Property) => prop.purchasePrice / prop.floorArea,
      description: "Cost per square meter of the property",
    },
    {
      label: "Short Term Yield",
      key: "shortTermGrossYield",
      format: (val: number | null) => (val ? `${val}%` : "--"),
      category: "performance",
      higherIsBetter: true,
      getValue: (prop: Property) => Number(prop.shortTermGrossYield),
      description: "Expected annual yield for short-term rentals",
    },
    {
      label: "Long Term Yield",
      key: "longTermGrossYield",
      format: (val: number | null) => (val ? `${val}%` : "--"),
      category: "performance",
      higherIsBetter: true,
      getValue: (prop: Property) => Number(prop.longTermGrossYield),
      description: "Expected annual yield for long-term rentals",
    },
    {
      label: "Short Term Revenue",
      key: "shortTermAnnualRevenue",
      format: (val: number | null) => (val ? formatter.format(val) : "--"),
      category: "performance",
      higherIsBetter: true,
      getValue: (prop: Property) => prop.shortTermAnnualRevenue || 0,
      description: "Projected annual revenue from short-term rentals",
    },
    {
      label: "Long Term Revenue",
      key: "longTermAnnualRevenue",
      format: (val: number | null) => (val ? formatter.format(val) : "--"),
      category: "performance",
      higherIsBetter: true,
      getValue: (prop: Property) => prop.longTermAnnualRevenue || 0,
      description: "Projected annual revenue from long-term rentals",
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
    const sortedValues = [...values].sort((a, b) =>
      higherIsBetter ? b - a : a - b,
    );
    const rank = sortedValues.indexOf(value);

    if (rank === 0) {
      return "bg-blue-50 dark:bg-blue-900/20";
    }
    return "";
  };

  const chartData = displayProperties.map((p) => ({
    name: p.address.split(",")[0],
    "Purchase Price": p.purchasePrice,
    "Short Term Revenue": p.shortTermAnnualRevenue,
    "Long Term Revenue": p.longTermAnnualRevenue,
    "Short Term Yield": Number(p.shortTermGrossYield),
    "Long Term Yield": Number(p.longTermGrossYield),
  }));

  if (!properties || properties.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 relative">
        {isLoading && <LoadingOverlay />}
        <AnimatePresence>
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
          >
            <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  Property Comparison
                </DialogTitle>
                <img
                  src="/proply-logo-auth.png"
                  alt="Proply Logo"
                  className="h-8 object-contain"
                />
              </div>
            </DialogHeader>

            <ScrollArea className="h-full max-h-[calc(90vh-120px)]">
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6">
                  <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                          <BarChart3 className="h-5 w-5 text-[#1BA3FF]" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Performance Overview
                          </h3>
                        </div>

                        {/* Legend above chart */}
                        <div className="mb-4 flex justify-center">
                          <div className="flex flex-wrap gap-4 justify-center items-center text-sm">
                            {[
                              {
                                label: "Purchase Price",
                                color: colors.primary,
                              },
                              {
                                label: "Short Term Revenue",
                                color: colors.success,
                              },
                              {
                                label: "Long Term Revenue",
                                color: colors.warning,
                              },
                              {
                                label: "Short Term Yield",
                                color: colors.info,
                              },
                              {
                                label: "Long Term Yield",
                                color: colors.accent,
                              },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className="w-3 h-3 rounded-sm"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {item.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="w-full h-[400px]">
                          <ResponsiveContainer width="100%" height={400}>
                            <ComposedChart
                              data={chartData}
                              margin={{
                                top: 20,
                                right: 80,
                                left: 80,
                                bottom: 60,
                              }}
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
                                tickFormatter={(value) =>
                                  formatter.format(value)
                                }
                                tick={{ fill: colors.text }}
                              />
                              <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickFormatter={(value) => `${value}%`}
                                tick={{ fill: colors.text }}
                              />
                              <RechartsTooltip
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
                                  boxShadow:
                                    "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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
                  </motion.div>
                  {Object.entries(categories).map(
                    ([category, { title, icon }], index) => (
                      <motion.div
                        key={category}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="text-[#1BA3FF]">{icon}</div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {title}
                              </h3>
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
                                        <div className="flex items-center gap-2">
                                          {React.createElement(
                                            getPropertyTypeIcon(
                                              property.address,
                                            ),
                                            {
                                              className:
                                                "h-4 w-4 text-[#1BA3FF]",
                                            },
                                          )}
                                          <div className="truncate text-sm">
                                            {property.address}
                                          </div>
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {metrics
                                    .filter(
                                      (metric) => metric.category === category,
                                    )
                                    .map((metric) => {
                                      const values = displayProperties.map(
                                        (prop) => metric.getValue(prop),
                                      );
                                      return (
                                        <tr
                                          key={metric.label}
                                          className="border-b border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">
                                            <div className="flex items-center gap-2">
                                              <span>{metric.label}</span>
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                                                  </TooltipTrigger>
                                                  <TooltipContent
                                                    side="right"
                                                    className="max-w-xs"
                                                  >
                                                    <p className="text-sm">
                                                      {metric.description}
                                                    </p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            </div>
                                          </td>
                                          {displayProperties.map((property) => {
                                            const value =
                                              metric.getValue(property);
                                            const isHighlighted =
                                              getBackgroundColor(
                                                value,
                                                values,
                                                metric.higherIsBetter,
                                              );

                                            return (
                                              <motion.td
                                                key={property.id}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={`py-3 px-4 text-sm font-medium text-gray-900 dark:text-white transition-all ${
                                                  isHighlighted
                                                }`}
                                              >
                                                <div className="flex items-center justify-between gap-2">
                                                  <span>
                                                    {metric.format(value)}
                                                  </span>
                                                  {isHighlighted && (
                                                    <motion.div
                                                      initial={{ scale: 0 }}
                                                      animate={{ scale: 1 }}
                                                      className="w-2 h-2 rounded-full bg-[#1BA3FF]"
                                                    />
                                                  )}
                                                </div>
                                              </motion.td>
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
                      </motion.div>
                    ),
                  )}
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
