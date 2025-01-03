
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

export function PDFReportModal({ open, onOpenChange, data }: PDFReportModalProps) {
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [includeProjections, setIncludeProjections] = useState(true);
  const [includeMarketAnalysis, setIncludeMarketAnalysis] = useState(true);

  const generatePDF = async () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px;">
        <h1 style="color: #1a365d; margin-bottom: 20px;">Property Analysis Report</h1>
        <h2 style="color: #2d3748; margin-bottom: 15px;">${data.address}</h2>
        
        ${includeFinancials ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #4a5568; margin-bottom: 10px;">Financial Overview</h3>
            <p>Monthly Long-term Rental: ${formatter(data.longTermMonthly)}</p>
            <p>Monthly Short-term Rental: ${formatter(data.shortTermMonthly)}</p>
            <p>Annual Long-term Revenue: ${formatter(data.longTermAnnual)}</p>
            <p>Annual Short-term Revenue: ${formatter(data.shortTermAnnual)}</p>
          </div>
        ` : ''}
        
        ${includeProjections ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #4a5568; margin-bottom: 10px;">Performance Projections</h3>
            <p>Short-term After Fees: ${formatter(data.shortTermAfterFees)}</p>
            <p>Break-even Occupancy: ${data.breakEvenOccupancy}%</p>
            <p>Current Occupancy: ${data.annualOccupancy}%</p>
          </div>
        ` : ''}
        
        ${includeMarketAnalysis ? `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #4a5568; margin-bottom: 10px;">Market Analysis</h3>
            <p>Nightly Rate: ${formatter(data.shortTermNightly)}</p>
            <p>Management Fee: ${data.managementFee}%</p>
            <p>Bedrooms: ${data.bedrooms}</p>
            <p>Bathrooms: ${data.bathrooms}</p>
          </div>
        ` : ''}
      </div>
    `;

    const opt = {
      margin: 1,
      filename: `${data.address.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate PDF Report</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="financials" 
                  checked={includeFinancials}
                  onCheckedChange={setIncludeFinancials}
                />
                <label htmlFor="financials">Include Financial Overview</label>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="projections" 
                  checked={includeProjections}
                  onCheckedChange={setIncludeProjections}
                />
                <label htmlFor="projections">Include Performance Projections</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="market" 
                  checked={includeMarketAnalysis}
                  onCheckedChange={setIncludeMarketAnalysis}
                />
                <label htmlFor="market">Include Market Analysis</label>
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
