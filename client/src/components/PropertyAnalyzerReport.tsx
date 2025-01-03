
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import html2pdf from "html2pdf.js";
import { formatter } from "@/utils/formatting";

interface ReportSection {
  id: string;
  label: string;
  checked: boolean;
}

interface PropertyAnalyzerReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  saved?: boolean;
}

export default function PropertyAnalyzerReport({ open, onOpenChange, data, saved }: PropertyAnalyzerReportProps) {
  const [sections, setSections] = useState<ReportSection[]>([
    { id: "dealSummary", label: "Deal Summary", checked: true },
    { id: "revenue", label: "Revenue Performance", checked: true },
    { id: "cashflow", label: "Cashflow Metrics", checked: true },
    { id: "investment", label: "Investment Metrics", checked: true },
    { id: "assetGrowth", label: "Asset Growth", checked: true }
  ]);

  const generateReport = () => {
    const content = document.createElement('div');
    content.style.padding = '20px';
    content.style.fontFamily = 'Arial, sans-serif';

    // Header
    content.innerHTML += `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h1 style="margin: 0;">Property Analysis Report</h1>
        <img src="/proply-logo.png" alt="Logo" style="height: 40px;"/>
      </div>
    `;

    if (sections.find(s => s.id === "dealSummary")?.checked) {
      content.innerHTML += `
        <div style="margin-bottom: 20px;">
          <h2>Deal Summary</h2>
          <p>Address: ${data.address}</p>
          <p>Purchase Price: ${formatter.format(data.analysis.purchasePrice)}</p>
          <p>Property Size: ${data.floorArea}m²</p>
          <p>Interest Rate: ${data.interestRate}%</p>
          <p>Loan Term: ${data.loanTerm} years</p>
        </div>
      `;
    }

    if (sections.find(s => s.id === "revenue")?.checked) {
      content.innerHTML += `
        <div style="margin-bottom: 20px;">
          <h2>Revenue Performance</h2>
          <p>Short-term Annual Revenue: ${formatter.format(data.analysis.shortTermAnnualRevenue)}</p>
          <p>Long-term Annual Revenue: ${formatter.format(data.analysis.longTermAnnualRevenue)}</p>
          <p>Short-term Gross Yield: ${data.shortTermGrossYield}%</p>
          <p>Long-term Gross Yield: ${data.longTermGrossYield}%</p>
        </div>
      `;
    }

    if (sections.find(s => s.id === "cashflow")?.checked) {
      content.innerHTML += `
        <div style="margin-bottom: 20px;">
          <h2>Cashflow Metrics</h2>
          <p>Monthly Bond Payment: ${formatter.format(data.monthlyBondRepayment)}</p>
          <p>Year 1 Net Operating Income: ${formatter.format(data.analysis.netOperatingIncome.year1.value)}</p>
          <p>Year 1 Annual Cashflow: ${formatter.format(data.analysis.netOperatingIncome.year1.annualCashflow)}</p>
        </div>
      `;
    }

    const options = {
      margin: 1,
      filename: `Property-Analysis-${data.address.split(",")[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(content).save();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Property Analysis Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            {sections.map((section) => (
              <div key={section.id} className="flex items-center space-x-2">
                <Checkbox
                  id={section.id}
                  checked={section.checked}
                  onCheckedChange={(checked) => {
                    setSections(sections.map(s => 
                      s.id === section.id ? { ...s, checked: !!checked } : s
                    ));
                  }}
                />
                <label htmlFor={section.id}>{section.label}</label>
              </div>
            ))}
          </div>
          <Button onClick={generateReport} disabled={!saved}>Generate Report</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
