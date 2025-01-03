import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePropertyReport } from "@/utils/pdfGenerator";

interface PropertyReportGeneratorProps {
  data: any;
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
      { id: "airbnbPerformance", label: "Airbnb Performance - Year 1", checked: true }
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
      { id: "cumulativeCashflow", label: "Cumulative Cashflow", checked: true }
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

export function PropertyReportGenerator({
  data,
  companyLogo
}: PropertyReportGeneratorProps) {
  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>(defaultSectionGroups);
  const [generating, setGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
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

  const getSelectedSections = () => {
    const selected: { [key: string]: boolean } = {};
    sectionGroups.forEach(group => {
      group.sections.forEach(section => {
        selected[section.id] = section.checked;
      });
    });
    return selected;
  };

  const validateData = () => {
    if (!data?.propertyDetails?.address) {
      throw new Error("Property details are missing");
    }
    if (!data?.performance) {
      throw new Error("Performance data is missing");
    }
    if (!data?.financialMetrics) {
      throw new Error("Financial metrics are missing");
    }
  };

  const generatePDF = async () => {
    try {
      setGenerating(true);

      // Validate data first
      validateData();

      const selectedSections = getSelectedSections();
      const doc = generatePropertyReport(data, companyLogo, selectedSections);

      const filename = `${data.propertyDetails.address.split(',')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`;
      doc.save(filename);

      toast({
        title: "Success",
        description: "PDF report has been generated successfully!",
        duration: 5000,
      });

      setShowOptions(false);
    } catch (error) {
      console.error('PDF generation error:', error);

      // Show error toast with specific message
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF report. Please ensure all required data is available.",
        duration: 5000,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowOptions(true)}
        className="w-full"
      >
        <FileText className="w-4 h-4 mr-2" />
        Generate PDF Report
      </Button>

      <Dialog open={showOptions} onOpenChange={setShowOptions}>
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

            <Button
              onClick={generatePDF}
              disabled={generating}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              {generating ? 'Generating PDF...' : 'Export as PDF'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}