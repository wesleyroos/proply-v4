import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import { PropertyData, generatePropertyReport, ReportSections } from "@/utils/pdfGenerator";

interface PDFGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PropertyData;
  capturedMapImage?: string;
}

// Section groups configuration
const defaultSectionGroups = [
  {
    title: "Property Details",
    sections: [
      { id: "propertyDetails", label: "Property Details", checked: true },
    ]
  },
  {
    title: "Deal Structure",
    sections: [
      { id: "dealStructure", label: "Deal Structure", checked: true },
    ]
  },
  {
    title: "Operating Expenses",
    sections: [
      { id: "operatingExpenses", label: "Operating Expenses", checked: true },
    ]
  },
  {
    title: "Rental Performance",
    sections: [
      { id: "rentalPerformance", label: "Rental Performance", checked: true },
    ]
  },
  {
    title: "Investment Metrics",
    sections: [
      { id: "investmentMetrics", label: "Investment Metrics", checked: true },
    ]
  },
  {
    title: "Cashflow Analysis",
    sections: [
      { id: "cashflowAnalysis", label: "Cashflow Analysis", checked: true },
    ]
  }
];

export function PDFGenerator({ open, onOpenChange, data, capturedMapImage }: PDFGeneratorProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [sectionGroups, setSectionGroups] = useState(defaultSectionGroups);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Handle logo file upload
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

  // Toggle section selection
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

  // Capture map image
  const captureMap = async (): Promise<string | null> => {
    if (!mapRef.current) return null;

    try {
      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: true,
        onclone: (clonedDoc) => {
          const clonedMap = clonedDoc.querySelector('#map-container');
          if (clonedMap instanceof HTMLElement) {
            clonedMap.style.display = 'block';
            clonedMap.style.height = '300px';
            clonedMap.style.width = '100%';
          }
        }
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing map:', error);
      return null;
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    if (generating) return;

    try {
      setGenerating(true);

      // Prepare selected sections
      const selectedSections: ReportSections = {};
      sectionGroups.forEach(group => {
        selectedSections[group.title] = group.sections
          .filter(section => section.checked)
          .map(section => section.id);
      });

      // Prepare PDF data with map image
      const pdfData: PropertyData = {
        ...data,
        propertyDetails: {
          ...data.propertyDetails,
          mapImage: capturedMapImage
        }
      };

      const doc = await generatePropertyReport(
        pdfData,
        selectedSections,
        logoPreviewUrl || user?.companyLogo
      );

      const filename = `${data.propertyDetails.address.split(',')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`;
      doc.save(filename);

      onOpenChange(false);
      toast({
        title: "Success",
        description: "PDF report generated successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
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
          {/* Hidden map container for capturing */}
          <div ref={mapRef} id="map-container" style={{ display: 'none' }}>
            {/* Map will be rendered here when needed */}
          </div>

          {sectionGroups.map((group) => (
            <Card key={group.title}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">{group.title}</h3>
                <div className="grid gap-4">
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