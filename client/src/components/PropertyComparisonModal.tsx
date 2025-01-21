
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent } from "./ui/card";
import { formatter } from "../utils/formatting";
import { ScrollArea } from "./ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ComposedChart } from 'recharts';

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

export function PropertyComparisonModal({
  open,
  onOpenChange,
  properties,
}: PropertyComparisonModalProps) {
  if (properties.length > 5) {
    properties = properties.slice(0, 5);
  }

  const getBestValue = (properties: Property[], key: string, isHigherBetter: boolean = true) => {
    const values = properties.map(p => p[key as keyof Property]);
    return isHigherBetter ? Math.max(...values as number[]) : Math.min(...values as number[]);
  };

  const metrics = [
    { 
      label: "Purchase Price", 
      key: "purchasePrice", 
      format: (val: number) => formatter.format(val),
      category: "basic",
      isHigherBetter: false
    },
    { 
      label: "Size (m²)", 
      key: "floorArea", 
      format: (val: number) => val.toString(),
      category: "basic",
      isHigherBetter: true
    },
    { 
      label: "Rate/m²", 
      key: "purchasePrice", 
      format: (val: number, prop: any) => formatter.format(prop.floorArea ? val / prop.floorArea : 0),
      category: "basic",
      isHigherBetter: false
    },
    { 
      label: "Short Term Yield", 
      key: "shortTermGrossYield", 
      format: (val: number | null) => val ? `${val}%` : '--',
      category: "performance",
      isHigherBetter: true
    },
    { 
      label: "Long Term Yield", 
      key: "longTermGrossYield", 
      format: (val: number | null) => val ? `${val}%` : '--',
      category: "performance",
      isHigherBetter: true
    },
    { 
      label: "Short Term Revenue", 
      key: "shortTermAnnualRevenue", 
      format: (val: number | null) => val ? formatter.format(val) : '--',
      category: "performance",
      isHigherBetter: true
    },
    { 
      label: "Long Term Revenue", 
      key: "longTermAnnualRevenue", 
      format: (val: number | null) => val ? formatter.format(val) : '--',
      category: "performance",
      isHigherBetter: true
    },
  ];

  const categories = {
    basic: "Basic Information",
    performance: "Performance Metrics"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Property Comparison</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-full max-h-[calc(90vh-120px)]">
          <div className="p-4">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
                  <div className="mb-4">
                    <Legend />
                  </div>
                  <div className="w-full h-[400px]">
                    <ComposedChart
                      width={1000}
                      height={400}
                      data={properties.map(p => ({
                        name: p.address.split(',')[0],
                        'Purchase Price': p.purchasePrice,
                        'Short Term Revenue': p.shortTermAnnualRevenue,
                        'Long Term Revenue': p.longTermAnnualRevenue,
                        'Short Term Yield': Number(p.shortTermGrossYield),
                        'Long Term Yield': Number(p.longTermGrossYield)
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        yAxisId="left"
                        tickFormatter={(value) => formatter.format(value)}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name.includes('Yield')) {
                            return [`${value}%`, name];
                          }
                          return [formatter.format(value), name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Purchase Price" fill="#94a3b8" yAxisId="left" />
                      <Bar dataKey="Short Term Revenue" fill="#22c55e" yAxisId="left" />
                      <Bar dataKey="Long Term Revenue" fill="#3b82f6" yAxisId="left" />
                      <Line type="monotone" dataKey="Short Term Yield" stroke="#f59e0b" yAxisId="right" />
                      <Line type="monotone" dataKey="Long Term Yield" stroke="#8b5cf6" yAxisId="right" />
                    </ComposedChart>
                  </div>
                </CardContent>
              </Card>
              {Object.entries(categories).map(([category, title]) => (
                <Card key={category}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">{title}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="py-3 px-4 text-left font-medium text-muted-foreground w-[200px]">
                              Metric
                            </th>
                            {properties.map((property) => (
                              <th 
                                key={property.id} 
                                className="py-3 px-4 text-left font-medium min-w-[200px]"
                              >
                                <div className="truncate text-sm">{property.address}</div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {metrics
                            .filter(metric => metric.category === category)
                            .map((metric) => (
                              <tr 
                                key={metric.label} 
                                className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                              >
                                <td className="py-3 px-4 text-muted-foreground text-sm">
                                  {metric.label}
                                </td>
                                {properties.map((property) => (
                                  <td 
                                    key={property.id} 
                                    className={`py-3 px-4 text-sm font-medium ${
                                      getBestValue(properties, metric.key, metric.isHigherBetter) === property[metric.key as keyof typeof property]
                                        ? 'bg-green-100 text-green-800'
                                        : ''
                                    }`}
                                  >
                                    {metric.format(property[metric.key as keyof typeof property], property)}
                                  </td>
                                ))}
                              </tr>
                          ))}
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
