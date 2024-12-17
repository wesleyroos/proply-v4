import { useEffect, useRef } from "react";
import html2pdf from 'html2pdf.js';
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

export default function PDFReport({ data, onClose }: PDFReportProps) {
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

      html2pdf().set(opt).from(reportRef.current).save().then(() => {
        onClose();
      });
    }
  }, []);

  return (
    <div ref={reportRef} className="bg-white p-8 w-[210mm]">
      {/* Header with logos */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b">
        <div className="flex-1">
          {/* Placeholder for client logo */}
          <div className="w-32 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
            Your Logo
          </div>
        </div>
        <div className="flex-1 text-right">
          <img src="/proply-logo.png" alt="Powered by Proply" className="h-8 ml-auto" />
          <div className="text-sm text-gray-500 mt-1">Powered by Proply</div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Property Investment Analysis Report
      </h1>

      {/* Property Details */}
      <div className="mb-8">
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
      <div className="mb-8">
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
      <div className="mb-8">
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

      {/* Footer */}
      <div className="mt-12 pt-4 border-t text-sm text-gray-500">
        <p className="mb-2">
          Report generated on {new Date().toLocaleDateString()} by Proply
        </p>
        <p className="text-xs">
          Disclaimer: This analysis is based on current market data and projections. 
          Actual results may vary based on market conditions, property management, 
          and other factors beyond our control.
        </p>
      </div>
    </div>
  );
}
