import React, { useState } from "react";
import { PDFGenerator } from "./components/PDFGenerator";
import { PDFPreview } from "./components/PDFPreview";
import { PropertyData, ReportSelections } from "./types/propertyReport";
import { generatePDF } from "./services/PDFService";
import { useToast } from "@/hooks/use-toast";
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
  isOpen,
}: PropertyAnalyzerPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleGeneratePDF = async (selections: ReportSelections) => {
    setIsGenerating(true);
    try {
      await generatePDF(data, selections, companyLogo);
      toast({
        title: "Success",
        description: "PDF report generated successfully",
        duration: 3000,
      });
      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF report",
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
          <PDFGenerator
            onGeneratePDF={handleGeneratePDF}
            onPreview={handlePreview}
            isGenerating={isGenerating}
            companyLogo={companyLogo}
          />

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
