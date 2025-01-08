import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { InfoIcon, Loader2 } from "lucide-react";
import MapView from './MapView';
import { formatter } from '../utils/formatting';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ComparisonData {
  title: string;
  longTermMonthly: number;
  shortTermMonthly: number;
  longTermAnnual: number;
  shortTermAnnual: number;
  shortTermAfterFees: number;
  breakEvenOccupancy: number;
  shortTermNightly: number;
  managementFee: number;
  annualOccupancy: number;
  bedrooms?: string;
  bathrooms?: string;
}

interface ComparisonChartProps {
  data: ComparisonData;
  address: string;
}

export default function ComparisonChart({ data, address }: ComparisonChartProps) {
  const [showCalculations, setShowCalculations] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const chartData = [
    {
      name: 'Monthly Income',
      'Long Term': data.longTermMonthly,
      'Short Term': data.shortTermMonthly,
    },
    {
      name: 'Annual Income',
      'Long Term': data.longTermAnnual,
      'Short Term': data.shortTermAnnual,
    },
  ];

  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  return (
    <TooltipProvider>
      <div id="comparison-results" className="space-y-6">
        <div className="flex justify-end gap-4">
          <div className="flex items-center gap-4">
            {saveMessage && (
              <div className={`px-4 py-2 rounded ${
                saveMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {saveMessage.text}
              </div>
            )}
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/properties', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                      title: data.title,
                      address,
                      bedrooms: data.bedrooms || '',
                      bathrooms: data.bathrooms || '',
                      longTermRental: data.longTermMonthly.toString(),
                      annualEscalation: '0',
                      shortTermNightly: data.shortTermNightly.toString(),
                      annualOccupancy: data.annualOccupancy.toString(),
                      managementFee: (data.managementFee * 100).toString(),
                      longTermMonthly: data.longTermMonthly,
                      longTermAnnual: data.longTermAnnual,
                      shortTermMonthly: data.shortTermMonthly,
                      shortTermAnnual: data.shortTermAnnual,
                      shortTermAfterFees: data.shortTermAfterFees,
                      breakEvenOccupancy: data.breakEvenOccupancy,
                    }),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to save property');
                  }

                  setSaveMessage({ type: 'success', text: 'Property saved successfully' });
                  setTimeout(() => setSaveMessage(null), 3000);
                } catch (error) {
                  console.error('Error saving property:', error);
                  setSaveMessage({ type: 'error', text: 'Failed to save property' });
                  setTimeout(() => setSaveMessage(null), 3000);
                }
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Save Property
            </Button>
          </div>
        </div>
        <MapView address={address} />
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Property Details</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Title</p>
              <p className="font-medium">{data.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bedrooms</p>
              <p className="font-medium">{data.bedrooms || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bathrooms</p>
              <p className="font-medium">{data.bathrooms || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Short-Term Nightly Rate</p>
              <p className="font-medium">{formatter.format(data.shortTermNightly)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Annual Occupancy</p>
              <p className="font-medium">{data.annualOccupancy}%</p>
            </div>
            {data.managementFee > 0 && (
              <div>
                <p className="text-sm text-gray-600">Management Fee</p>
                <p className="font-medium">{(data.managementFee * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-[#1BA3FF] mb-2">Long-Term Rental</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">Monthly Revenue</h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Monthly rental income
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-bold mt-1">{formatter.format(data.longTermMonthly)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">Annual Revenue</h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Annual rental income
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xl font-bold mt-1">{formatter.format(data.longTermAnnual)}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold text-[#114D9D] mb-2">Short-Term Rental</h3>
            <div className="space-y-2">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">Annual Revenue</h3>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Total annual revenue before fees
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold mt-1">{formatter.format(data.shortTermAnnual)}</p>
                </div>
                <div className="mt-1 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm text-gray-600">Monthly Revenue</h3>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Average monthly income before fees
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-base text-gray-900">{formatter.format(data.shortTermMonthly)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      Airbnb Fee ({data.managementFee > 0 ? "15.0%" : "3.0%"})
                    </h3>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Platform fee based on management type
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold mt-1 text-red-600">
                    -{formatter.format(data.shortTermAnnual * (data.managementFee > 0 ? 0.15 : 0.03))}
                  </p>
                </div>
                {data.managementFee > 0 && (
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">Management Fee ({(data.managementFee * 100).toFixed(1)}%)</h3>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoIcon className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Property management fee amount
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xl font-bold mt-1 text-red-600">-{formatter.format(data.shortTermAnnual * data.managementFee)}</p>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">Final Annual Revenue</h3>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Total annual revenue after all fees and deductions
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xl font-bold mt-1">{formatter.format(data.shortTermAfterFees)}</p>
                </div>
                <Dialog open={showCalculations} onOpenChange={setShowCalculations}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Calculation Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-[#1BA3FF] mb-3">Long-Term Rental Calculations</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm mb-2">Simple annual calculation based on monthly rental income:</p>
                            <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                              <li>Monthly Revenue: {formatter.format(data.longTermMonthly)}</li>
                              <li>Annual Revenue = Monthly × 12 = {formatter.format(data.longTermAnnual)}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#114D9D] mb-3">Short-Term Rental Calculations</h4>
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-sm font-medium mb-2">Fee Structure:</h5>
                            <ul className="list-disc list-inside text-sm space-y-1 text-gray-600">
                              <li>Platform Fee: {data.managementFee > 0 ? "15%" : "3%"}</li>
                              {data.managementFee > 0 && (
                                <li>Management Fee: {(data.managementFee * 100).toFixed(1)}%</li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-sm font-medium mb-2">Calculation Steps:</h5>
                            <ol className="list-decimal list-inside text-sm space-y-1 text-gray-600">
                              <li>Base nightly rate: {formatter.format(data.shortTermNightly)}</li>
                              <li>After platform fees: {formatter.format(data.shortTermNightly * (data.managementFee > 0 ? 0.85 : 0.97))}</li>
                              <li>Annual revenue: {formatter.format(data.shortTermAnnual)}</li>
                              {data.managementFee > 0 && (
                                <>
                                  <li>Management fee amount: {formatter.format(data.shortTermAnnual * data.managementFee)}</li>
                                  <li>Final annual revenue: {formatter.format(data.shortTermAfterFees)}</li>
                                </>
                              )}
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="link"
          className="text-sm text-gray-600 hover:text-gray-900 underline decoration-gray-600 hover:decoration-gray-900 -mt-2 mb-4"
          onClick={() => setShowCalculations(true)}
        >
          How do we calculate this?
        </Button>
        <div id="occupancy-analysis" className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Occupancy Analysis</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Projected Occupancy</span>
                <span className="text-sm font-medium">{data.annualOccupancy}%</span>
              </div>
              <div
                className="relative"
              >
                <Progress value={data.annualOccupancy} className="h-2" />
                <div
                  className="absolute top-0 h-4 w-0.5 bg-red-500 transform -translate-y-1"
                  style={{ left: `${data.breakEvenOccupancy}%` }}
                  title="Break-even point"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-2 bg-primary rounded-full"></div>
                <span>Projected {data.annualOccupancy}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-3 bg-red-500"></div>
                <span>Break-even {data.breakEvenOccupancy}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Your short-term rental needs {data.breakEvenOccupancy}% occupancy to match long-term rental income.
              {data.annualOccupancy > data.breakEvenOccupancy
                ? ` At ${data.annualOccupancy}% projected occupancy, short-term rental is more profitable.`
                : ` At ${data.annualOccupancy}% projected occupancy, long-term rental may be more suitable.`}
            </p>
          </div>
        </div>
        <div id="revenue-comparison-chart" className="mt-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={Array(12).fill(0).map((_, i) => ({
                month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
                low: calculateMonthlyRevenue('low', i, data.shortTermNightly, data.managementFee > 0, data.managementFee),
                medium: calculateMonthlyRevenue('medium', i, data.shortTermNightly, data.managementFee > 0, data.managementFee),
                high: calculateMonthlyRevenue('high', i, data.shortTermNightly, data.managementFee > 0, data.managementFee),
                longTerm: data.longTermMonthly,
              }))}
            >
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatter.format(value)} />
              <RechartsTooltip formatter={(value) => formatter.format(value as number)} />
              <Legend />
              <Line type="monotone" dataKey="low" stroke="#FF6B6B" name="Revenue Low" />
              <Line type="monotone" dataKey="medium" stroke="#4ECDC4" name="Revenue Medium" />
              <Line type="monotone" dataKey="high" stroke="#45B7D1" name="Revenue High" />
              <Line type="monotone" dataKey="longTerm" stroke="#FFE66D" strokeDasharray="5 5" name="Long Term Rental" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div id="monthly-revenue-table" className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="border-b">
                <th className="text-left py-3 px-6 min-w-[120px] bg-gray-50">Metric</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Jan</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Feb</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Mar</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Apr</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">May</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Jun</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Jul</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Aug</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Sep</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Oct</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Nov</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Dec</th>
                <th className="text-right py-3 px-6 min-w-[120px] bg-gray-50 border-l">Total</th>
                <th className="text-right py-3 px-6 min-w-[120px] bg-gray-50">Monthly Avg</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Nightly Rate</td>
                {Array(12).fill(0).map((_, i) => (
                  <td key={i} className="text-right py-3 px-6 whitespace-nowrap">
                    {formatter.format(getSeasonalNightlyRate(data.shortTermNightly, i))}
                  </td>
                ))}
                <td colSpan={2}></td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Fee-Adjusted Rate</td>
                {Array(12).fill(0).map((_, i) => (
                  <td key={i} className="text-right py-3 px-6 whitespace-nowrap">
                    {formatter.format(getFeeAdjustedRate(getSeasonalNightlyRate(data.shortTermNightly, i), data.managementFee > 0))}
                  </td>
                ))}
                <td colSpan={2}></td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Occupancy Low</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">65%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">65%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">60%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">55%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">50%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">50%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">50%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">50%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">60%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">65%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">65%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">70%</td>
                <td colSpan={2}></td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Occupancy Medium</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">80%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">78%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">73%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">68%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">63%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">60%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">60%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">60%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">70%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">75%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">75%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">85%</td>
                <td colSpan={2}></td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3 px-6">Occupancy High</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">95%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">90%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">85%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">80%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">75%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">70%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">70%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">70%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">80%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">85%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">85%</td>
                <td className="text-right py-3 px-6 whitespace-nowrap">95%</td>
                <td colSpan={2}></td>
              </tr>
              <tr className="border-b bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20">
                <td className="py-3 px-6 text-[#FF6B6B] font-medium">Revenue Low</td>
                {Array(12).fill(0).map((_, i) => (
                  <td key={i} className="text-right py-3 px-6 whitespace-nowrap">
                    {formatter.format(calculateMonthlyRevenue('low', i, data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                  </td>
                ))}
                <td className="text-right py-3 px-6 border-l font-semibold">
                  {formatter.format(
                    Array(12).fill(0)
                      .reduce((sum, _, i) => sum + calculateMonthlyRevenue('low', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0)
                  )}
                </td>
                <td className="text-right py-3 px-6 font-semibold">
                  {formatter.format(
                    Array(12).fill(0)
                      .reduce((sum, _, i) => sum + calculateMonthlyRevenue('low', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0) / 12
                  )}
                </td>
              </tr>
              <tr className="border-b bg-[#4ECDC4]/10 hover:bg-[#4ECDC4]/20">
                <td className="py-3 px-6 text-[#4ECDC4] font-medium">Revenue Medium</td>
                {Array(12).fill(0).map((_, i) => (
                  <td key={i} className="text-right py-3 px-6 whitespace-nowrap">
                    {formatter.format(calculateMonthlyRevenue('medium', i, data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                  </td>
                ))}
                <td className="text-right py-3 px-6 border-l font-semibold">
                  {formatter.format(
                    Array(12).fill(0)
                      .reduce((sum, _, i) => sum + calculateMonthlyRevenue('medium', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0)
                  )}
                </td>
                <td className="text-right py-3 px-6 font-semibold">
                  {formatter.format(
                    Array(12).fill(0)
                      .reduce((sum, _, i) => sum + calculateMonthlyRevenue('medium', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0) / 12
                  )}
                </td>
              </tr>
              <tr className="border-b bg-[#45B7D1]/10 hover:bg-[#45B7D1]/20">
                <td className="py-3 px-6 text-[#45B7D1] font-medium">Revenue High</td>
                {Array(12).fill(0).map((_, i) => (
                  <td key={i} className="text-right py-3 px-6 whitespace-nowrap">
                    {formatter.format(calculateMonthlyRevenue('high', i, data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                  </td>
                ))}
                <td className="text-right py-3 px-6 border-l font-semibold">
                  {formatter.format(
                    Array(12).fill(0)
                      .reduce((sum, _, i) => sum + calculateMonthlyRevenue('high', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0)
                  )}
                </td>
                <td className="text-right py-3 px-6 font-semibold">
                  {formatter.format(
                    Array(12).fill(0)
                      .reduce((sum, _, i) => sum + calculateMonthlyRevenue('high', i, data.shortTermNightly, data.managementFee > 0, data.managementFee), 0) / 12
                  )}
                </td>
              </tr>
              <tr className="border-b bg-[#FFE66D]/10 hover:bg-[#FFE66D]/20">
                <td className="py-3 px-6 text-[#B8860B] font-medium">Long Term Rental</td>
                {Array(12).fill(0).map((_, i) => (
                  <td key={i} className="text-right py-3 px-6 whitespace-nowrap">
                    {formatter.format(data.longTermMonthly)}
                  </td>
                ))}
                <td className="text-right py-3 px-6 border-l font-semibold">
                  {formatter.format(data.longTermAnnual)}
                </td>
                <td className="text-right py-3 px-6 font-semibold">
                  {formatter.format(data.longTermMonthly)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div id="performance-metrics-table" className="mt-6">
          <Button
            variant="link"
            className="text-sm text-gray-600 hover:text-gray-900 mt-8 w-full text-left"
            onClick={() => setShowDisclaimer(!showDisclaimer)}
          >
            {showDisclaimer ? "Hide Disclaimer ▴" : "Show Disclaimer ▾"}
          </Button>
          {showDisclaimer && (
            <div className="mt-4 text-sm text-gray-600 space-y-4">
              <p>
                The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While we make best efforts to ensure the accuracy and reliability of all data presented, including sourcing information from trusted third-party providers, we cannot guarantee its absolute accuracy or completeness.
              </p>
              <p>
                This report is intended to serve as a general guide and should not be considered as financial, investment, legal, or professional advice. Property rental strategy decisions should be made after careful consideration of all relevant factors, including but not limited to local market conditions, regulations, and personal circumstances.
              </p>
              <p>
                Proply Tech (Pty) Ltd and its affiliates expressly disclaim any and all liability for any direct, indirect, incidental, or consequential damages arising from the use of this information. Actual rental income, occupancy rates, and management costs may vary significantly from the projections and estimates presented.
              </p>
              <p>
                By using this report, you acknowledge that the calculations and projections are indicative only and based on the information available at the time of generation. Factors beyond our control, including but not limited to seasonal demand, regulatory changes, platform policies, and economic conditions, may impact actual outcomes.
              </p>
              <p className="text-xs mt-4">
                © Proply Tech (Pty) Ltd. All rights reserved.
              </p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEASONALITY_FACTORS = [2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03];

const OCCUPANCY_RATES = {
  low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 65],
  medium: [80, 78, 73, 73, 68, 63, 60, 70, 75, 75, 80],
  high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
};

function getSeasonalMultiplier(month: number): number {
  return SEASONALITY_FACTORS[month];
}

function getSeasonalNightlyRate(baseRate: number, month: number): number {
  return baseRate * getSeasonalMultiplier(month);
}

function getFeeAdjustedRate(rate: number, hasManagementFee: boolean): number {
  return hasManagementFee
    ? rate * 0.85  // 15% Airbnb fee for professionally managed
    : rate * 0.97; // 3% fee for self-managed
}

function calculateMonthlyRevenue(
  scenario: 'low' | 'medium' | 'high',
  month: number,
  nightly: number,
  hasManagementFee: boolean,
  managementFeePercent: number
): number {
  const occupancyRate = OCCUPANCY_RATES[scenario][month] / 100;
  const daysInMonth = new Date(2024, month + 1, 0).getDate();

  // Apply seasonal adjustment and platform fee
  const seasonalRate = getSeasonalNightlyRate(nightly, month);
  const feeAdjustedRate = getFeeAdjustedRate(seasonalRate, hasManagementFee);

  let revenue = feeAdjustedRate * daysInMonth * occupancyRate;

  // Apply management fee if present
  if (hasManagementFee) {
    revenue *= (1 - managementFeePercent);
  }

  return revenue;
}