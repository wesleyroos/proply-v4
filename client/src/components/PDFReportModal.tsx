import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { generatePropertyReport } from "@/utils/pdfGenerator";
import { useToast } from "@/hooks/use-toast";

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
    ]
  },
  {
    title: "Financing Details",
    sections: [
      { id: "deposit", label: "Deposit & Bond Details", checked: true },
      { id: "interestRate", label: "Interest Rate", checked: true },
      { id: "loanTerm", label: "Loan Term", checked: true },
      { id: "monthlyBond", label: "Monthly Bond Payment", checked: true },
    ]
  },
  {
    title: "Revenue Performance",
    sections: [
      { id: "shortTerm", label: "Short-Term Rental Performance", checked: true },
      { id: "longTerm", label: "Long-Term Rental Performance", checked: true },
      { id: "occupancyRate", label: "Occupancy Rate", checked: true },
    ]
  },
  {
    title: "Investment Metrics",
    sections: [
      { id: "yields", label: "Yield Analysis", checked: true },
      { id: "returns", label: "Return Metrics", checked: true },
      { id: "cashflow", label: "Cashflow Analysis", checked: true },
    ]
  },
  {
    title: "Operating Expenses",
    sections: [
      { id: "monthlyExpenses", label: "Monthly Expenses", checked: true },
      { id: "maintenance", label: "Maintenance Costs", checked: true },
      { id: "managementFees", label: "Management Fees", checked: true },
    ]
  },
  {
    title: "Company Branding",
    sections: [
      { id: "companyLogo", label: "Include Company Logo", checked: true },
    ]
  }
];

export function PDFReportModal({ open, onOpenChange, data }: PDFReportModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>(defaultSectionGroups);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const generatePDF = async () => {
    if (generating) return;

    try {
      setGenerating(true);
      const selectedSections = sectionGroups.reduce((acc, group) => {
        acc[group.title] = group.sections
          .filter(section => section.checked)
          .map(section => section.id);
        return acc;
      }, {} as Record<string, string[]>);

      const logo = user?.companyLogo || logoPreviewUrl;
      const doc = await generatePropertyReport(data, selectedSections, logo);
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
        description: error instanceof Error ? error.message : "Failed to generate PDF report. Please try again.",
        duration: 5000,
      });
    } finally {
      setGenerating(false);
    }
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

                {group.title === "Company Branding" && (
                  <div className="mt-4">
                    {(user?.companyLogo || logoPreviewUrl) ? (
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