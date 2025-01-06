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
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    try {
      setGenerating(true);

      // Extract rental performance data
      const rentalPerformanceData = extractRentalPerformanceData(data);

      // Define sections to include in the PDF
      const selectedSections = {
        "Property Details": ["address", "bedrooms", "bathrooms", "floorArea", "parkingSpaces", "purchasePrice", "ratePerM2"],
        "Financing Details": ["deposit", "interestRate", "loanTerm", "monthlyBond"],
        "Operating Expenses": ["monthlyExpenses", "maintenance", "managementFees"],
        "Investment Metrics": ["yields", "returns", "cashflow"],
        "Company Branding": ["companyLogo"]
      };

      // Generate PDF with the extracted data
      const doc = await generatePropertyReport({
        ...data,
        rentalPerformanceData
      }, selectedSections, companyLogo);

      const filename = `${data.propertyDetails.address.split(',')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`;

      await doc.save(filename);

      toast({
        title: "Success",
        description: "PDF report has been generated successfully!",
        duration: 5000,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF report. Please try again.",
        duration: 5000,
      });
    } finally {
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