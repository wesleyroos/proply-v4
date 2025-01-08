/**
 * @deprecated This component is being phased out.
 * Use PDFGenerator.tsx instead for PDF generation functionality.
 * This file will be removed in future updates.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePropertyReport } from "@/utils/pdfGenerator";
import { extractRentalPerformanceData } from "@/utils/chartCapture";

interface PropertyReportGeneratorProps {
  data: any;
  companyLogo?: string;
}

export function PropertyReportGenerator({
  data,
  companyLogo
}: PropertyReportGeneratorProps) {
  console.log('PropertyReportGenerator: Initializing with data:', JSON.stringify(data, null, 2));
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    try {
      console.log('generatePDF: Starting PDF generation process.');
      setGenerating(true);

      console.log('generatePDF: Extracting rental performance data.');
      const rentalPerformanceData = extractRentalPerformanceData(data);
      console.log('generatePDF: Rental performance data extracted:', JSON.stringify(rentalPerformanceData, null, 2));

      console.log('generatePDF: Defining sections for the PDF.');
      const selectedSections = {
        "Property Details": ["address", "bedrooms", "bathrooms", "floorArea", "parkingSpaces", "purchasePrice", "ratePerM2"],
        "Financing Details": ["deposit", "interestRate", "loanTerm", "monthlyBond"],
        "Operating Expenses": ["monthlyExpenses", "maintenance", "managementFees"],
        "Investment Metrics": ["yields", "returns", "cashflow"],
        "Company Branding": ["companyLogo"]
      };

      console.log('generatePDF: Generating PDF report.');
      const doc = await generatePropertyReport({
        ...data,
        rentalPerformanceData
      }, selectedSections, companyLogo);
      console.log('generatePDF: PDF report generated.');

      const filename = `${data.propertyDetails.address.split(',')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`;

      console.log('generatePDF: Saving PDF as:', filename);
      await doc.save(filename);
      console.log('generatePDF: PDF saved successfully.');

      toast({
        title: "Success",
        description: "PDF report has been generated successfully!",
        duration: 5000,
      });
    } catch (error) {
      console.error('generatePDF: PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF report. Please try again.",
        duration: 5000,
      });
    } finally {
      console.log('generatePDF: PDF generation process complete.');
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={generating}
      className="w-full"
    >
      <FileText className="w-4 h-4 mr-2" />
      {generating ? 'Generating PDF...' : 'Export as PDF'}
    </Button>
  );
}