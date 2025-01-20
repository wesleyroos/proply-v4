import React, { useState } from "react";
import { PDFGenerator } from "./components/PDFGenerator";
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
  const { toast } = useToast();

  const handleGeneratePDF = async (selections: ReportSelections) => {
    setIsGenerating(true);
    try {
      // Create a filtered version of the data based on selections
      const filteredData: PropertyData = {
        ...data,
        operatingExpenses: selections.operatingExpenses?.managementFee 
          ? data.operatingExpenses 
          : { ...data.operatingExpenses, managementFee: 0 },
        // Add other conditional fields based on selections
      };

      await generatePDF(filteredData, selections, companyLogo);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Property Report</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          <PDFGenerator
            onGeneratePDF={handleGeneratePDF}
            isGenerating={isGenerating}
            companyLogo={companyLogo}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}