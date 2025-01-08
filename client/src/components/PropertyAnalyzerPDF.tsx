import React, { useRef, useState } from 'react';
import { PDFReport } from './PDFReport';
import { PDFGenerator } from './PDFGenerator';
import { PDFReportModal } from './PDFReportModal';
import { PropertyData, ReportSelections } from '../types/propertyReport';
import { PDFGenerationService } from '../services/pdfService';

interface PropertyAnalyzerPDFProps {
  data: PropertyData;
  companyLogo?: string;
}

export function PropertyAnalyzerPDF({ data, companyLogo }: PropertyAnalyzerPDFProps) {
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selections, setSelections] = useState<ReportSelections>({});
  const reportRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const handleGeneratePDF = async (selectedSections: ReportSelections) => {
    setSelections(selectedSections);
    
    if (!reportRef.current) {
      throw new Error('Report element not found');
    }

    const pdfService = new PDFGenerationService();
    await pdfService.generateAndDownload(
      reportRef.current,
      mapRef.current,
      data,
      selectedSections,
      `Property-Analysis-${data.propertyDetails.address.split(',')[0]}.pdf`
    );
  };

  return (
    <>
      <PDFGenerator
        open={showPDFGenerator}
        onOpenChange={setShowPDFGenerator}
        data={data}
        companyLogo={companyLogo}
        onGeneratePDF={handleGeneratePDF}
      />

      <PDFReportModal
        open={showPreview}
        onOpenChange={setShowPreview}
        data={data}
        selections={selections}
        companyLogo={companyLogo}
      />

      <div className="hidden">
        <PDFReport
          ref={reportRef}
          data={data}
          selections={selections}
          companyLogo={companyLogo}
        />
      </div>
    </>
  );
}
