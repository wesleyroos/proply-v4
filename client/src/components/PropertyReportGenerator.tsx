import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PropertyReport } from "./PropertyReport";
import html2pdf from 'html2pdf.js';

type Year = 'year1' | 'year2' | 'year3' | 'year4' | 'year5' | 'year10' | 'year20';

interface PropertyData {
  propertyDetails: {
    address: string;
    description: string;
    bedrooms: string | number;
    bathrooms: string | number;
    floorArea: number;
    parkingSpaces: number;
    purchasePrice: number;
    ratePerSquareMeter: number;
    propertyPhoto?: string | null;
  };
  financialMetrics: {
    depositAmount: number;
    depositPercentage: number;
    interestRate: number;
    loanTerm: number;
    monthlyBondRepayment: number;
    bondRegistration: number;
    transferCosts: number;
  };
  expenses: {
    monthlyLevies: number;
    monthlyRatesTaxes: number;
    otherMonthlyExpenses: number;
    maintenancePercent: number;
    managementFee: number;
  };
  performance: {
    shortTermNightlyRate: number;
    annualOccupancy: number;
    shortTermAnnualRevenue: number;
    longTermAnnualRevenue: number;
    shortTermGrossYield: number;
    longTermGrossYield: number;
  };
  investmentMetrics: Record<Year, YearlyMetrics>;
  operatingExpenses: Record<Year, number>;
  netOperatingIncome: Record<Year, {
    value: number;
    annualCashflow: number;
    cumulativeRentalIncome: number;
    netWorthChange: number;
  }>;
  revenueProjections: {
    shortTerm: Record<Year, number>;
    longTerm: Record<Year, number>;
  };
  monthlyPerformance?: {
    [month: string]: {
      nightlyRate: number;
      occupancy: number;
      revenue: number;
    };
  };
  propertyValue?: Record<Year, number>;
  loanBalance?: Record<Year, number>;
  equityBuildUp?: Record<Year, number>;
  appreciation?: Record<Year, {
    value: number;
    percentage: number;
    rand: number;
  }>;
}

interface YearlyMetrics {
  grossYield: number;
  netYield: number;
  returnOnEquity: number;
  annualReturn: number;
  capRate: number;
  cashOnCashReturn: number;
  roiWithoutAppreciation: number;
  roiWithAppreciation: number;
  irr: number;
  netWorthChange: number;
}

interface PropertyReportGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PropertyData;
  companyLogo?: string;
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
    title: "Deal Summary",
    sections: [
      { id: "propertyDetails", label: "Property Details", checked: true },
      { id: "dealStructure", label: "Deal Structure", checked: true },
      { id: "sizeAndRate", label: "Size and Rate/m²", checked: true }
    ]
  },
  {
    title: "Income Performance",
    sections: [
      { id: "shortTermYear1", label: "Short-Term Rental (Year 1)", checked: true },
      { id: "longTermYear1", label: "Long-Term Rental (Year 1)", checked: true },
      { id: "airbnbPerformance", label: "Airbnb Performance - Year 1", checked: true },
      { id: "monthlyOccupancy", label: "Monthly Occupancy & Revenue", checked: true }
    ]
  },
  {
    title: "Cashflow Metrics",
    sections: [
      { id: "revenue", label: "Revenue", checked: true },
      { id: "operatingExpenses", label: "Operating Expenses", checked: true },
      { id: "noi", label: "Net Operating Income", checked: true },
      { id: "bondPayment", label: "Bond Payment", checked: true },
      { id: "annualCashflow", label: "Annual Cashflow", checked: true },
      { id: "cumulativeCashflow", label: "Cumulative Cashflow", checked: true },
      { id: "equityBuildUp", label: "Equity Buildup", checked: true }
    ]
  },
  {
    title: "Investment Metrics",
    sections: [
      { id: "grossYield", label: "Gross Yield", checked: true },
      { id: "netYield", label: "Net Yield", checked: true },
      { id: "roe", label: "Return on Equity", checked: true },
      { id: "annualReturn", label: "Annual Return", checked: true },
      { id: "capRate", label: "Cap Rate", checked: true },
      { id: "cashOnCash", label: "Cash on Cash Return", checked: true },
      { id: "roi", label: "ROI", checked: true },
      { id: "irr", label: "IRR", checked: true }
    ]
  },
  {
    title: "Property Value",
    sections: [
      { id: "loanBalance", label: "Loan Balance", checked: true },
      { id: "equityBuildup", label: "Equity Buildup", checked: true },
      { id: "propertyValue", label: "Property Value", checked: true },
      { id: "appreciation", label: "Appreciation", checked: true }
    ]
  },
  {
    title: "Branding",
    sections: [
      { id: "companyBranding", label: "Include Company Branding", checked: true },
      { id: "proplyBranding", label: "Include Proply Branding", checked: true }
    ]
  }
];

const tableHeaderStyle = `
  background-color: #2c5282;
  color: white;
  padding: 8px;
  font-weight: bold;
  text-align: left;
`;

const tableCellStyle = `
  padding: 8px;
  border: 1px solid #e2e8f0;
`;

const tableStyle = `
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background-color: white;
`;

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});


export function PropertyReportGenerator({
  open,
  onOpenChange,
  data,
  companyLogo
}: PropertyReportGeneratorProps) {
  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>(defaultSectionGroups);
  const [generating, setGenerating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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

  const isSectionChecked = (groupTitle: string, sectionId: string): boolean => {
    const group = sectionGroups.find(g => g.title === groupTitle);
    const section = group?.sections.find(s => s.id === sectionId);
    return section?.checked || false;
  };

  const generatePDF = async () => {
    try {
      setGenerating(true);

      // Show the report modal first to ensure content is rendered
      setShowReport(true);

      // Wait for the content to be rendered
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!reportRef.current) {
        throw new Error("Report content not found");
      }

      const options = {
        filename: `${data.propertyDetails.address.split(',')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          windowWidth: 1200
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Generate PDF from the rendered content
      const element = reportRef.current.cloneNode(true) as HTMLElement;
      document.body.appendChild(element);
      element.style.width = '1200px';

      await html2pdf()
        .set(options)
        .from(element)
        .save();

      document.body.removeChild(element);

      toast({
        title: "Success",
        description: "PDF report has been generated successfully!",
        duration: 5000,
      });

      // Close both modals after successful generation
      setShowReport(false);
      onOpenChange(false);
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

  const previewReport = () => {
    try {
      setShowReport(true);
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to show report preview. Please try again.",
        duration: 5000,
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Generate Property Analysis Report</DialogTitle>
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
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-4">
              <Button
                onClick={previewReport}
                variant="outline"
                className="flex-1"
              >
                Preview Report
              </Button>
              <Button
                onClick={generatePDF}
                disabled={generating}
                className="flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                {generating ? 'Generating PDF...' : 'Export as PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PropertyReport
        ref={reportRef}
        open={showReport}
        onOpenChange={setShowReport}
        data={data}
        companyLogo={companyLogo}
      />
    </>
  );
}