import React, { useState } from 'react';
import { ReportSectionManager } from './components/ReportSectionManager';
import { PDFPreview } from './components/PDFPreview';
import { PropertyData, ReportSelections } from './types/propertyReport';
import { generatePDF } from './services/PDFService';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PropertyAnalyzerPDFProps {
  data: PropertyData;
  companyLogo?: string;
  onClose: () => void;
  isOpen: boolean;
}

export function PropertyAnalyzerPDF({
  data,
  companyLogo,
  onClose,
  isOpen
}: PropertyAnalyzerPDFProps) {
  // State management
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Handle PDF generation
  const handleGeneratePDF = async (selections: ReportSelections) => {
    setIsGenerating(true);

    try {
      // Generate the PDF with selected sections
      await generatePDF(data, selections, companyLogo);

      // Show success message
      toast({
        title: "Success",
        description: "PDF report generated successfully",
        duration: 3000,
      });

      // Close the dialog
      onClose();
    } catch (error) {
      // Handle any errors
      console.error("Error generating PDF:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "Failed to generate PDF report",
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle preview toggle
  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Property Report</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          {/* Report Section Manager */}
          <ReportSectionManager
            onGeneratePDF={handleGeneratePDF}
            onPreview={handlePreview}
            isGenerating={isGenerating}
            companyLogo={companyLogo}
          />

          {/* Preview Dialog */}
          {showPreview && (
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Report Preview</DialogTitle>
                </DialogHeader>
                <PDFPreview
                  data={data}
                  companyLogo={companyLogo}
                  onClose={() => setShowPreview(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}