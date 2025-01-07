import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { generatePropertyReport } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

// Matches all available data from PropertyAnalyzerPage
const defaultSectionGroups = [
  {
    title: "Property Details",
    sections: [
      { id: "propertyAddress", label: "Property Address", checked: true },
      { id: "propertySpecs", label: "Property Specifications", checked: true },
      { id: "propertyPhoto", label: "Property Photo", checked: true },
      { id: "propertyPrice", label: "Purchase Price & Rate/m²", checked: true }
    ]
  },
  {
    title: "Deal Structure",
    sections: [
      { id: "depositDetails", label: "Deposit Information", checked: true },
      { id: "loanDetails", label: "Loan Details", checked: true },
      { id: "bondPayments", label: "Bond Payments", checked: true },
      { id: "registrationCosts", label: "Registration & Transfer Costs", checked: true }
    ]
  },
  {
    title: "Operating Expenses",
    sections: [
      { id: "monthlyExpenses", label: "Monthly Fixed Expenses", checked: true },
      { id: "maintenanceCosts", label: "Maintenance Costs", checked: true },
      { id: "managementFees", label: "Management Fees", checked: true }
    ]
  },
  {
    title: "Rental Performance",
    sections: [
      { id: "shortTermRental", label: "Short-Term Rental Analysis", checked: true },
      { id: "longTermRental", label: "Long-Term Rental Analysis", checked: true },
      { id: "occupancyRates", label: "Occupancy Rates", checked: true },
      { id: "grossYields", label: "Gross Yields", checked: true }
    ]
  },
  {
    title: "Investment Metrics",
    sections: [
      { id: "yearOneMetrics", label: "Year 1 Performance", checked: true },
      { id: "yearlyProjections", label: "5-Year Projections", checked: true },
      { id: "longTermProjections", label: "10-20 Year Outlook", checked: true },
      { id: "returnMetrics", label: "ROI & IRR Analysis", checked: true }
    ]
  },
  {
    title: "Cashflow Analysis",
    sections: [
      { id: "annualCashflow", label: "Annual Cashflow", checked: true },
      { id: "cumulativeIncome", label: "Cumulative Rental Income", checked: true },
      { id: "netWorthChanges", label: "Net Worth Changes", checked: true }
    ]
  },
  {
    title: "Company Branding",
    sections: [
      { id: "companyLogo", label: "Include Company Logo", checked: true }
    ]
  }
];

interface PDFReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    propertyDetails: {
      address: string;
      bedrooms?: string;
      bathrooms?: string;
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
    investmentMetrics?: {
      year1: {
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
      };
      // same structure for other years
    };
    netOperatingIncome?: {
      year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    };
  };
  capturedMapImage?: string;
}

export function PDFReportModal({ 
  open, 
  onOpenChange, 
  data,
  capturedMapImage 
}: PDFReportModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [sectionGroups, setSectionGroups] = useState(defaultSectionGroups);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSection = (groupTitle: string, sectionId: string) => {
    setSectionGroups(prevGroups => {
      return prevGroups.map(group => {
        if (group.title === groupTitle) {
          return {
            ...group,
            sections: group.sections.map(section =>
              section.id === sectionId ? { ...section, checked: !section.checked } : section
            )
          };
        }
        return group;
      });
    });
  };

  const generatePDF = async () => {
    if (generating) return;

    try {
      setGenerating(true);

      // Verify we have the map image
      if (!capturedMapImage) {
        toast({
          variant: "destructive",
          title: "Missing Map",
          description: "Map image is not available. Please try reopening the analyzer.",
          duration: 3000,
        });
        return;
      }

      const selectedSections = sectionGroups.reduce((acc, group) => {
        acc[group.title] = group.sections
          .filter(section => section.checked)
          .map(section => section.id);
        return acc;
      }, {} as Record<string, string[]>);

      // Prepare PDF data with the pre-captured map image
      const pdfData = {
        ...data,
        propertyDetails: {
          ...data.propertyDetails,
          areaRatePerSquareMeter: 45000,
          ratePerSquareMeter: Math.round(data.propertyDetails.purchasePrice / data.propertyDetails.floorArea),
          mapImage: capturedMapImage
        }
      };

      const doc = await generatePropertyReport(pdfData, selectedSections, logoPreviewUrl || user?.companyLogo);
      const filename = `${data.propertyDetails.address.split(',')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`;
      doc.save(filename);

      onOpenChange(false);
      toast({
        title: "Success",
        description: "PDF report has been generated successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF report",
        duration: 5000,
      });
    } finally {
      setGenerating(false);
    }
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

                {group.title === "Company Branding" && (
                  <div className="mt-4">
                    {(logoPreviewUrl || user?.companyLogo) ? (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="mb-4">
                          <img
                            src={logoPreviewUrl || user?.companyLogo}
                            alt="Company Logo"
                            className="h-12 object-contain"
                          />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-update"
                        />
                        <label
                          htmlFor="logo-update"
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 w-fit"
                        >
                          <Upload className="w-4 h-4" />
                          Update Logo
                        </label>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">
                          No company logo found. Upload your logo to include it in the report.
                        </p>
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
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button
            onClick={generatePDF}
            className="w-full"
            disabled={generating}
          >
            <FileText className="w-4 h-4 mr-2" />
            {generating ? 'Generating PDF...' : 'Generate PDF Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}