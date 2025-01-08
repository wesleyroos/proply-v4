import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Building2, TrendingUp, BarChart3 } from "lucide-react";
import PropertyMap from "@/components/PropertyMap";

interface PDFReportProps {
  data: {
    propertyDetails: {
      address: string;
      bedrooms: number;
      bathrooms: number;
      floorArea: number;
      parkingSpaces: number;
      purchasePrice: number;
      ratePerSquareMeter: number;
      propertyPhoto?: string;
    };
    dealStructure: {
      depositAmount: number;
      depositPercentage: number;
      interestRate: number;
      loanTerm: number;
      monthlyBondRepayment: number;
      bondRegistration: number;
      transferCosts: number;
    };
    operatingExpenses: {
      monthlyLevies: number;
      monthlyRatesTaxes: number;
      otherMonthlyExpenses: number;
      maintenancePercentage: number;
      managementFee: number;
    };
    performance: {
      shortTermNightlyRate: number;
      annualOccupancy: number;
      shortTermAnnualRevenue: number;
      longTermAnnualRevenue: number;
      shortTermGrossYield: number;
      longTermGrossYield: number;
    };
    investmentMetrics: Record<string, {
      grossYield: number;
      netYield: number;
      returnOnEquity: number;
      annualReturn: number;
      capRate: number;
      cashOnCashReturn: number;
      irr: number;
      netWorthChange: number;
    }>;
    cashflow: {
      [key: string]: {
        annualCashflow: number;
        cumulativeRentalIncome: number;
      };
    };
  };
  selections: Record<string, Record<string, boolean>>;
  companyLogo?: string;
}

// Format currency values consistently
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `R${(value / 1000).toFixed(0)}k`;
  }
  return `R${value.toFixed(0)}`;
};

// Format percentage values consistently
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const PDFReport = forwardRef<HTMLDivElement, PDFReportProps>(({ 
  data,
  selections,
  companyLogo
}, ref) => {
  const isSelected = (section: string, item: string): boolean => {
    return selections[section]?.[item] ?? false;
  };

  const showCharts = isSelected('dataVisualizations', 'charts');

  return (
    <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto">
      {/* Header with Branding */}
      <div className="flex justify-between items-center border-b pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Property Analysis Report</h1>
          <p className="text-gray-600">{data.propertyDetails.address}</p>
          <p className="text-sm text-gray-500">Generated on {format(new Date(), 'dd MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-8">
          {companyLogo && (
            <img src={companyLogo} alt="Company Logo" className="h-12 object-contain" />
          )}
          <div className="text-right">
            <p className="text-sm font-semibold">Powered by</p>
            <p className="text-lg font-bold text-primary">Proply</p>
          </div>
        </div>
      </div>

      {/* Property Details Section */}
      {isSelected('propertyDetails', 'map') && (
        <div className="mb-8">
          <PropertyMap 
            address={data.propertyDetails.address}
            className="w-full h-[300px] rounded-lg overflow-hidden"
          />
        </div>
      )}

      {/* Property Information */}
      {isSelected('propertyDetails', 'propertyPhoto') && data.propertyDetails.propertyPhoto && (
        <div className="mb-8">
          <img 
            src={data.propertyDetails.propertyPhoto} 
            alt="Property" 
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-8">
        {isSelected('propertyDetails', 'bedrooms') && (
          <div>
            <h3 className="text-sm font-semibold text-gray-600">Bedrooms</h3>
            <p className="text-xl font-bold">{data.propertyDetails.bedrooms}</p>
          </div>
        )}
        {/* Similar blocks for bathrooms, floor area, parking spaces */}
      </div>

      {/* Deal Structure */}
      {selections.dealStructure && Object.values(selections.dealStructure).some(Boolean) && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Deal Structure
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {/* Purchase Price */}
              {isSelected('dealStructure', 'purchasePrice') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Purchase Price</h3>
                  <p className="text-xl font-bold">
                    {formatCurrency(data.propertyDetails.purchasePrice)}
                  </p>
                </div>
              )}
              {/* Similar blocks for other deal structure items */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operating Expenses */}
      {/* Similar structure to Deal Structure section */}

      {/* Rental Performance */}
      {/* Similar structure to Deal Structure section */}

      {/* Investment Metrics */}
      {/* Similar structure to Deal Structure section */}

      {/* Cashflow Analysis */}
      {selections.cashflowAnalysis && Object.values(selections.cashflowAnalysis).some(Boolean) && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cashflow Analysis
            </h2>
            {showCharts && (
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Object.entries(data.cashflow).map(([year, values]) => ({
                    year,
                    Annual: values.annualCashflow,
                    Cumulative: values.cumulativeRentalIncome
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="Annual" stroke="#8884d8" />
                    <Line type="monotone" dataKey="Cumulative" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Cashflow metrics table */}
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="mt-12 pt-6 border-t text-sm text-gray-600">
        <h3 className="font-semibold text-gray-800 mb-2">DISCLAIMER</h3>
        <p className="mb-4">
          This report is generated based on provided data and market assumptions.
          While we strive for accuracy, all projections are estimates and actual
          results may vary. Property investment carries inherent risks and professional
          advice should be sought before making investment decisions.
        </p>
        <p className="text-center text-xs text-gray-500 mt-8">
          © {new Date().getFullYear()} Property Analysis Report
        </p>
      </div>
    </div>
  );
});

PDFReport.displayName = 'PDFReport';
