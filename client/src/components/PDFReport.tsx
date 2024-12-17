import { useEffect, useRef } from "react";
import html2pdf from 'html2pdf.js';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatter } from '../utils/formatting';

interface PDFReportProps {
  data: {
    address: string;
    bedrooms?: string;
    bathrooms?: string;
    longTermMonthly: number;
    shortTermMonthly: number;
    longTermAnnual: number;
    shortTermAnnual: number;
    shortTermAfterFees: number;
    breakEvenOccupancy: number;
    shortTermNightly: number;
    managementFee: number;
    annualOccupancy: number;
  };
  onClose: () => void;
}

// Helper functions for revenue calculations
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEASONALITY_FACTORS = [2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03];

const OCCUPANCY_RATES = {
  low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 65],
  medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 80],
  high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
};

function calculateMonthlyRevenue(
  scenario: 'low' | 'medium' | 'high',
  month: number,
  nightly: number,
  hasManagementFee: boolean,
  managementFeePercent: number
): number {
  const occupancyRate = OCCUPANCY_RATES[scenario][month] / 100;
  const daysInMonth = new Date(2024, month + 1, 0).getDate();
  const seasonalRate = nightly * SEASONALITY_FACTORS[month];
  const feeAdjustedRate = hasManagementFee ? seasonalRate * 0.85 : seasonalRate * 0.97;

  let revenue = feeAdjustedRate * daysInMonth * occupancyRate;
  if (hasManagementFee) {
    revenue *= (1 - managementFeePercent);
  }
  return revenue;
}

function calculateMonthlyAverage(
  scenario: 'low' | 'medium' | 'high',
  nightly: number,
  hasManagementFee: boolean,
  managementFeePercent: number
): number {
  const total = Array(12).fill(0)
    .reduce((sum, _, month) => sum + calculateMonthlyRevenue(scenario, month, nightly, hasManagementFee, managementFeePercent), 0);
  return total / 12;
}

function calculateAnnualRevenue(
  scenario: 'low' | 'medium' | 'high',
  nightly: number,
  hasManagementFee: boolean,
  managementFeePercent: number
): number {
  return Array(12).fill(0)
    .reduce((sum, _, month) => sum + calculateMonthlyRevenue(scenario, month, nightly, hasManagementFee, managementFeePercent), 0);
}

function PDFReport({ data, onClose }: PDFReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reportRef.current) {
      const opt = {
        margin: 0.5,
        filename: `Property-Analysis-${data.address.split(',')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      html2pdf()
        .set(opt)
        .from(reportRef.current)
        .save()
        .then(() => onClose())
        .catch((error) => {
          console.error('PDF generation failed:', error);
          onClose(); // Make sure we still close even if there's an error
        });
    }
  }, []);

  return (
    <div ref={reportRef} className="bg-white p-12 w-[210mm] min-h-[297mm] relative">
      {/* Header with logos */}
      <div className="flex justify-between items-center mb-12 pb-6 border-b">
        <div className="flex-1">
          {/* Placeholder for client logo */}
          <div className="w-40 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border border-gray-200">
            Your Logo
          </div>
        </div>
        <div className="flex-1 text-right">
          <img src="/proply-logo.png" alt="Powered by Proply" className="h-10 ml-auto" />
          <div className="text-sm text-gray-500 mt-2">Powered by Proply</div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">
        Proply Rent Compare
      </h1>

      {/* Property Details */}
      <div className="mb-12 break-inside-avoid page-break-inside-avoid">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-medium">{data.address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Bedrooms</p>
            <p className="font-medium">{data.bedrooms || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Bathrooms</p>
            <p className="font-medium">{data.bathrooms || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-12 break-inside-avoid page-break-inside-avoid">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-semibold mb-4">Long-Term Rental Strategy</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-xl font-bold">{formatter.format(data.longTermMonthly)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Annual Revenue</p>
                  <p className="text-xl font-bold">{formatter.format(data.longTermAnnual)}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-4">Short-Term Rental Strategy</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Projected Annual Revenue</p>
                  <p className="text-xl font-bold">{formatter.format(data.shortTermAfterFees)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Average Monthly Revenue</p>
                  <p className="text-xl font-bold">{formatter.format(data.shortTermMonthly)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="mb-12 break-inside-avoid page-break-inside-avoid">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analysis</h2>
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-base font-semibold mb-4">Occupancy Analysis</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Projected Occupancy Rate</p>
                <p className="text-lg font-semibold">{data.annualOccupancy}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Break-even Occupancy Rate</p>
                <p className="text-lg font-semibold">{data.breakEvenOccupancy}%</p>
              </div>
              <div className="text-sm text-gray-600 mt-4">
                {data.annualOccupancy > data.breakEvenOccupancy 
                  ? `At ${data.annualOccupancy}% projected occupancy, short-term rental strategy shows higher potential returns.`
                  : `At ${data.annualOccupancy}% projected occupancy, long-term rental strategy may be more suitable.`}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-base font-semibold mb-4">Revenue Breakdown</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Average Nightly Rate</p>
                <p className="text-lg font-semibold">{formatter.format(data.shortTermNightly)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Platform Fees</p>
                <p className="text-lg font-semibold text-red-600">
                  -{formatter.format(data.shortTermAnnual * (data.managementFee > 0 ? 0.15 : 0.03))}
                </p>
              </div>
              {data.managementFee > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Management Fees ({(data.managementFee * 100).toFixed(1)}%)</p>
                  <p className="text-lg font-semibold text-red-600">
                    -{formatter.format(data.shortTermAnnual * data.managementFee)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Short-Term Rental Scenarios */}
      <div className="mb-12 break-inside-avoid page-break-inside-avoid">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Short-Term Rental Scenarios</h2>
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left py-3 px-6 min-w-[120px] bg-gray-50">Scenario</th>
                <th className="text-right py-3 px-6 min-w-[100px] bg-gray-50">Monthly Average</th>
                <th className="text-right py-3 px-6 min-w-[120px] bg-gray-50">Annual Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b bg-[#FF6B6B]/10">
                <td className="py-3 px-6 text-[#FF6B6B] font-medium">Conservative (Low)</td>
                <td className="text-right py-3 px-6">
                  {formatter.format(calculateMonthlyAverage('low', data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                </td>
                <td className="text-right py-3 px-6">
                  {formatter.format(calculateAnnualRevenue('low', data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                </td>
              </tr>
              <tr className="border-b bg-[#4ECDC4]/10">
                <td className="py-3 px-6 text-[#4ECDC4] font-medium">Moderate (Medium)</td>
                <td className="text-right py-3 px-6">
                  {formatter.format(calculateMonthlyAverage('medium', data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                </td>
                <td className="text-right py-3 px-6">
                  {formatter.format(calculateAnnualRevenue('medium', data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                </td>
              </tr>
              <tr className="border-b bg-[#45B7D1]/10">
                <td className="py-3 px-6 text-[#45B7D1] font-medium">Optimistic (High)</td>
                <td className="text-right py-3 px-6">
                  {formatter.format(calculateMonthlyAverage('high', data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                </td>
                <td className="text-right py-3 px-6">
                  {formatter.format(calculateAnnualRevenue('high', data.shortTermNightly, data.managementFee > 0, data.managementFee))}
                </td>
              </tr>
              <tr className="border-b bg-[#FFE66D]/10">
                <td className="py-3 px-6 text-[#B8860B] font-medium">Long Term Rental</td>
                <td className="text-right py-3 px-6 font-medium">{formatter.format(data.longTermMonthly)}</td>
                <td className="text-right py-3 px-6 font-medium">{formatter.format(data.longTermAnnual)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 h-[300px] break-inside-avoid page-break-inside-avoid">
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
              <Line type="monotone" dataKey="low" stroke="#FF6B6B" name="Conservative" />
              <Line type="monotone" dataKey="medium" stroke="#4ECDC4" name="Moderate" />
              <Line type="monotone" dataKey="high" stroke="#45B7D1" name="Optimistic" />
              <Line type="monotone" dataKey="longTerm" stroke="#FFE66D" strokeDasharray="5 5" name="Long Term" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-6 border-t text-sm text-gray-500">
        <p className="mb-3">
          Report generated on {new Date().toLocaleDateString()} by Proply
        </p>
        <p className="text-xs leading-relaxed max-w-3xl">
          Disclaimer: This analysis is based on current market data and projections. 
          Actual results may vary based on market conditions, property management, 
          and other factors beyond our control.
        </p>
      </div>
      
      {/* Page Number */}
      <div className="absolute bottom-8 right-8 text-sm text-gray-400">
        Page 1
      </div>
    </div>
  );
}

export default PDFReport;
