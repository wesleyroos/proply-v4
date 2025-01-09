import React, { useState } from 'react';
import { PDFGenerator } from './components/PDFGenerator';
import { PDFReport } from './components/PDFReport';
import { PropertyData, ReportSelections } from './types/propertyReport';

interface PropertyAnalyzerPDFProps {
  data: PropertyData;
  companyLogo?: string;
  onClose: () => void;
}

export function PropertyAnalyzerPDF({ data, companyLogo, onClose }: PropertyAnalyzerPDFProps) {
  const [selections, setSelections] = useState<ReportSelections>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async (selectedOptions: ReportSelections) => {
    setIsGenerating(true);
    setSelections(selectedOptions);
    
    try {
      // PDF generation logic will be handled by PDFGenerator component
      // This component just orchestrates the process
    } catch (error) {
      console.error('Error generating PDF:', error);
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
        isGenerating={isGenerating}
      />
      
      <div className="border rounded-lg p-4 bg-white">
        <PDFReport
          data={data}
          selections={selections}
          companyLogo={companyLogo}
        />
      </div>
    </div>
  );
}

export default PropertyAnalyzerPDF;
