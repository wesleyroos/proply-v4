import React, { useState } from 'react';
import { PDFGenerator } from './components/PDFGenerator';
import { PDFPreview } from './components/PDFPreview';
import { PropertyData, ReportSelections } from './types/propertyReport';
import { generatePDF } from './services/PDFService';
import { useToast } from "@/hooks/use-toast";

interface PropertyAnalyzerPDFProps {
  data: PropertyData;
  companyLogo?: string;
  onClose: () => void;
}

export function PropertyAnalyzerPDF({ data, companyLogo, onClose }: PropertyAnalyzerPDFProps) {
  const [selections, setSelections] = useState<ReportSelections>({
    propertyDetails: {
      address: true,
      propertyPhoto: true,
      map: true,
      bedrooms: true,
      bathrooms: true,
      floorArea: true,
      parkingSpaces: true,
      ratePerSquareMeter: true,
      propertyDescription: true
    },
    financialMetrics: {
      purchasePrice: true,
      depositAmount: true,
      interestRate: true,
      loanTerm: true,
      monthlyBondRepayment: true,
      bondRegistration: true,
      transferCosts: true
    },
    operatingExpenses: {
      monthlyLevies: true,
      monthlyRatesTaxes: true,
      otherMonthlyExpenses: true,
      maintenancePercent: true,
      managementFee: true
    },
    rentalPerformance: {
      shortTerm: true,
      longTerm: true
    },
    investmentMetrics: {
      grossYield: true,
      netYield: true,
      returnOnEquity: true,
      annualReturn: true,
      capRate: true,
      cashOnCashReturn: true,
      irr: true,
      netWorthChange: true
    },
    cashflowAnalysis: {
      year1: true,
      year2: true,
      year3: true,
      year5: true,
      year10: true,
      year20: true
    },
    includeWatermark: true,
    includeMap: true,
    includeBranding: true
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleGeneratePDF = async (selectedOptions: ReportSelections) => {
    setIsGenerating(true);
    setSelections(selectedOptions);

    try {
      await generatePDF(data, selectedOptions, companyLogo);
      toast({
        title: "Success",
        description: "PDF report generated successfully",
        duration: 3000,
      });
      onClose();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF report",
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <PDFGenerator
        data={data}
        companyLogo={companyLogo}
        onGeneratePDF={handleGeneratePDF}
        onPreview={() => setShowPreview(true)}
        isGenerating={isGenerating}
      />

      {showPreview && (
        <PDFPreview
          data={data}
          selections={selections}
          companyLogo={companyLogo}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

export default PropertyAnalyzerPDF;