import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import html2pdf from "html2pdf.js";
import { formatter } from "@/utils/formatting";

interface PDFReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
}

interface ReportSection {
  id: string;
  label: string;
  checked: boolean;
}

const defaultSections: ReportSection[] = [
  { id: "propertyDetails", label: "Property Details", checked: true },
  { id: "address", label: "Address", checked: true },
  { id: "purchasePrice", label: "Purchase Price", checked: true },
  { id: "floorArea", label: "Floor Area", checked: true },
  { id: "ratePerM2", label: "Rate per m²", checked: true },
  { id: "areaRateM2", label: "Area Rate/m²", checked: true },
  { id: "rateDifference", label: "Rate/m² Difference", checked: true },
  { id: "financing", label: "Financing Details", checked: true },
  { id: "shortTermY1", label: "Short-Term Rental (Year 1)", checked: true },
  { id: "longTermY1", label: "Long-Term Rental (Year 1)", checked: true },
  { id: "monthlyRates", label: "Monthly Seasonal Rates", checked: true },
  { id: "cashflow", label: "Annual Cashflow Projections", checked: true },
  { id: "propertyValue", label: "Property Value Projections", checked: true },
  { id: "loanBalance", label: "Loan Balance Over Time", checked: true },
  { id: "netWorth", label: "Net Worth Change", checked: true },
  { id: "investmentMetrics", label: "Investment Metrics Year 1", checked: true },
  { id: "operatingFinancials", label: "Operating Financials", checked: true },
  { id: "totalInterest", label: "Total Interest Paid Over Time", checked: true },
  { id: "visualizations", label: "Data Visualizations", checked: true },
];

export function PDFReportModal({ open, onOpenChange, data }: PDFReportModalProps) {
  const [sections, setSections] = useState<ReportSection[]>(defaultSections);

  const generatePDF = async () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #1a365d; margin-bottom: 20px;">Property Analysis Report</h1>

        ${sections.find(s => s.id === "propertyDetails")?.checked ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Property Details</h2>
            ${sections.find(s => s.id === "address")?.checked ? 
              `<p><strong>Address:</strong> ${data.address}</p>` : ''}
            ${sections.find(s => s.id === "purchasePrice")?.checked ? 
              `<p><strong>Purchase Price:</strong> ${formatter.format(data.purchasePrice)}</p>` : ''}
            ${sections.find(s => s.id === "floorArea")?.checked ? 
              `<p><strong>Floor Area:</strong> ${data.floorArea}m²</p>` : ''}
          </div>
        ` : ''}

        ${sections.find(s => s.id === "shortTermY1")?.checked ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Short-Term Rental Performance (Year 1)</h2>
            <p><strong>Monthly Revenue:</strong> ${formatter.format(data.shortTermMonthly)}</p>
            <p><strong>Annual Revenue:</strong> ${formatter.format(data.shortTermAnnual)}</p>
            <p><strong>Revenue After Fees:</strong> ${formatter.format(data.shortTermAfterFees)}</p>
            <p><strong>Occupancy Rate:</strong> ${data.annualOccupancy}%</p>
          </div>
        ` : ''}

        ${sections.find(s => s.id === "longTermY1")?.checked ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Long-Term Rental Performance (Year 1)</h2>
            <p><strong>Monthly Revenue:</strong> ${formatter.format(data.longTermMonthly)}</p>
            <p><strong>Annual Revenue:</strong> ${formatter.format(data.longTermAnnual)}</p>
          </div>
        ` : ''}

        ${sections.find(s => s.id === "operatingFinancials")?.checked ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Operating Financials</h2>
            <p><strong>Management Fee:</strong> ${data.managementFee}%</p>
            <p><strong>Break-even Occupancy:</strong> ${data.breakEvenOccupancy}%</p>
          </div>
        ` : ''}

        <footer style="margin-top: 40px; text-align: center; color: #718096; font-size: 0.875rem;">
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <p>This report is for informational purposes only.</p>
        </footer>
      </div>
    `;

    const opt = {
      margin: 1,
      filename: `${data.address.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, checked: !section.checked } : section
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate PDF Report</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={section.id} 
                      checked={section.checked}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <label 
                      htmlFor={section.id} 
                      className="text-sm cursor-pointer"
                    >
                      {section.label}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Button onClick={generatePDF} className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            Generate PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}