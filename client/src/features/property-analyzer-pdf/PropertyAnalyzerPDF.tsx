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
  // Validate all incoming data
  console.log("Validating PDF data:", {
    propertyDetails: data?.propertyDetails,
    financialMetrics: data?.financialMetrics,
    expenses: data?.expenses,
    rentalPerformance: data?.rentalPerformance,
    investmentMetrics: data?.investmentMetrics,
    netOperatingIncome: data?.netOperatingIncome,
    revenueProjections: data?.revenueProjections
  });

  if (!data) {
    console.error("PDF data is null or undefined");
    toast({
      variant: "destructive",
      title: "Error",
      description: "Invalid PDF data structure",
      duration: 5000,
    });
    return null;
  }
  const [isGenerating, setIsGenerating] = useState(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Generate Property Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Top Section (Dropdown or other content handled elsewhere) */}
          <div className="flex items-start space-x-6">
            <div className="flex-1">
              {/* Dropdown for report templates is handled elsewhere */}
            </div>
          </div>

          {/* PDF Generator Component */}
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
