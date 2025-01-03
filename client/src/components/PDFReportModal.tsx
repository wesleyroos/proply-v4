import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import { useUser } from "@/hooks/use-user";
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

interface SectionGroup {
  title: string;
  sections: ReportSection[];
}

const defaultSectionGroups: SectionGroup[] = [
  {
    title: "Property Details",
    sections: [
      { id: "address", label: "Address", checked: true },
      { id: "purchasePrice", label: "Purchase Price", checked: true },
      { id: "floorArea", label: "Floor Area", checked: true },
      { id: "ratePerM2", label: "Rate per m²", checked: true },
      { id: "areaRateM2", label: "Area Rate/m²", checked: true },
      { id: "rateDifference", label: "Rate/m² Difference", checked: true },
    ]
  },
  {
    title: "Financing Details",
    sections: [
      { id: "deposit", label: "Deposit & Bond Details", checked: true },
      { id: "interestRate", label: "Interest Rate", checked: true },
      { id: "loanTerm", label: "Loan Term", checked: true },
      { id: "bondRegistration", label: "Bond Registration", checked: true },
      { id: "transferCosts", label: "Transfer Costs", checked: true },
    ]
  },
  {
    title: "Revenue Performance",
    sections: [
      { id: "shortTermY1", label: "Short-Term Rental (Year 1)", checked: true },
      { id: "longTermY1", label: "Long-Term Rental (Year 1)", checked: true },
      { id: "monthlyRates", label: "Monthly Seasonal Rates", checked: true },
    ]
  },
  {
    title: "Financial Projections",
    sections: [
      { id: "cashflow", label: "Annual Cashflow Projections", checked: true },
      { id: "propertyValue", label: "Property Value Projections", checked: true },
      { id: "loanBalance", label: "Loan Balance Over Time", checked: true },
      { id: "netWorth", label: "Net Worth Change", checked: true },
    ]
  },
  {
    title: "Performance Metrics",
    sections: [
      { id: "investmentMetrics", label: "Investment Metrics Year 1", checked: true },
      { id: "operatingFinancials", label: "Operating Financials", checked: true },
      { id: "totalInterest", label: "Total Interest Paid Over Time", checked: true },
    ]
  },
  {
    title: "Visualizations",
    sections: [
      { id: "cashflowChart", label: "Cashflow Charts", checked: true },
      { id: "revenueChart", label: "Revenue Charts", checked: true },
      { id: "propertyValueChart", label: "Property Value Charts", checked: true },
    ]
  },
  {
    title: "Branding",
    sections: [
      { id: "companyLogo", label: "Include Company Logo", checked: true },
      { id: "poweredByProply", label: "Include 'Powered by Proply'", checked: true },
    ]
  }
];

export function PDFReportModal({ open, onOpenChange, data }: PDFReportModalProps) {
  const { user } = useUser();
  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>(defaultSectionGroups);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
    }
  };

  const generatePDF = async () => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          ${getSelectedSections("Branding").includes("companyLogo") && (user?.companyLogo || logoFile) ? `
            <img src="${user?.companyLogo || (logoFile ? URL.createObjectURL(logoFile) : '')}" 
                 alt="Company Logo" 
                 style="height: 60px; object-fit: contain;" />
          ` : ''}
          ${getSelectedSections("Branding").includes("poweredByProply") ? `
            <div style="text-align: right;">
              <img src="/proply-logo.png" alt="Proply Logo" style="height: 30px;" />
              <p style="margin: 0; font-size: 12px; color: #666;">Powered by Proply</p>
            </div>
          ` : ''}
        </div>

        <h1 style="color: #1a365d; margin-bottom: 20px;">Property Analysis Report</h1>

        ${getSelectedSections("Property Details").includes("address") ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Property Details</h2>
            <p><strong>Address:</strong> ${data.address}</p>
            ${getSelectedSections("Property Details").includes("purchasePrice") ? 
              `<p><strong>Purchase Price:</strong> ${formatter.format(data.purchasePrice)}</p>` : ''}
            ${getSelectedSections("Property Details").includes("floorArea") ? 
              `<p><strong>Floor Area:</strong> ${data.floorArea}m²</p>` : ''}
          </div>
        ` : ''}

        ${getSelectedSections("Revenue Performance").includes("shortTermY1") ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Short-Term Rental Performance (Year 1)</h2>
            <p><strong>Monthly Revenue:</strong> ${formatter.format(data.shortTermMonthly)}</p>
            <p><strong>Annual Revenue:</strong> ${formatter.format(data.shortTermAnnual)}</p>
            <p><strong>Revenue After Fees:</strong> ${formatter.format(data.shortTermAfterFees)}</p>
            <p><strong>Occupancy Rate:</strong> ${data.annualOccupancy}%</p>
          </div>
        ` : ''}

        ${getSelectedSections("Revenue Performance").includes("longTermY1") ? `
          <div style="margin-bottom: 30px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Long-Term Rental Performance (Year 1)</h2>
            <p><strong>Monthly Revenue:</strong> ${formatter.format(data.longTermMonthly)}</p>
            <p><strong>Annual Revenue:</strong> ${formatter.format(data.longTermAnnual)}</p>
          </div>
        ` : ''}

        ${getSelectedSections("Performance Metrics").includes("operatingFinancials") ? `
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

  const getSelectedSections = (groupTitle: string): string[] => {
    const group = sectionGroups.find(g => g.title === groupTitle);
    return group ? group.sections.filter(s => s.checked).map(s => s.id) : [];
  };

  const toggleSection = (groupTitle: string, sectionId: string) => {
    setSectionGroups(sectionGroups.map(group => {
      if (group.title === groupTitle) {
        return {
          ...group,
          sections: group.sections.map(section =>
            section.id === sectionId ? { ...section, checked: !section.checked } : section
          )
        };
      }
      return group;
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Generate PDF Report</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          {sectionGroups.map((group) => (
            <Card key={group.title}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">{group.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {group.sections.map((section) => (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={section.id} 
                        checked={section.checked}
                        onCheckedChange={() => toggleSection(group.title, section.id)}
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

                {group.title === "Branding" && !user?.companyLogo && !logoFile && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      No company logo found. Upload your logo to include it in the report.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          <Button onClick={generatePDF} className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            Generate PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}