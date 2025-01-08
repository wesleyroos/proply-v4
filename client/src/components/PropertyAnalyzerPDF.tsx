import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText, Upload } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

// Define property data interface
interface PropertyData {
  propertyDetails: {
    address: string;
    bedrooms?: string;
    bathrooms?: string;
    floorArea: number;
    parkingSpaces: number;
    purchasePrice: number;
    ratePerSquareMeter: number;
    propertyPhoto?: string | null;
    areaRatePerSquareMeter?: number;
    mapImage?: string | null;
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
}

interface PropertyAnalyzerPDFProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PropertyData;
  capturedMapImage?: string;
}

// Format currency values consistently
const formatter = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R 0';
  }
  return `R ${value.toLocaleString('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Default section groups configuration
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

export function PropertyAnalyzerPDF({ 
  open, 
  onOpenChange, 
  data,
  capturedMapImage 
}: PropertyAnalyzerPDFProps) {
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

  const captureMap = async (): Promise<string | null> => {
    if (!mapRef.current) {
      console.log('Map reference not found');
      return null;
    }

    try {
      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: true,
        onclone: (clonedDoc) => {
          // Ensure map is visible in cloned document
          const clonedMap = clonedDoc.querySelector('#map-container');
          if (clonedMap) {
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

  const generatePDF = async () => {
    if (generating) return;

    try {
      setGenerating(true);
      const doc = new jsPDF();
      let yPos = 20;

      // Try to capture map first if needed
      let mapImageData = null;
      if (sectionGroups.find(g => g.title === "Property Details")?.sections.some(s => s.checked)) {
        mapImageData = await captureMap();
      }

      // Add company logo if available
      if ((logoPreviewUrl || user?.companyLogo) && 
          sectionGroups.find(g => g.title === "Company Branding")?.sections.find(s => s.id === "companyLogo")?.checked) {
        try {
          const logoUrl = logoPreviewUrl || user?.companyLogo;
          if (logoUrl) {
            const logoWidth = 40;
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
              img.onload = () => {
                const aspectRatio = img.height / img.width;
                const logoHeight = logoWidth * aspectRatio;
                doc.addImage(logoUrl, "PNG", 20, 10, logoWidth, logoHeight);
                resolve();
              };
              img.onerror = () => {
                console.error('Error loading company logo');
                resolve(); // Continue without logo
              };
              img.crossOrigin = "Anonymous";
              img.src = logoUrl;
            });
          }
        } catch (error) {
          console.error('Error adding company logo:', error);
        }
      }

      // Add Proply branding
      try {
        const proplyLogoWidth = 40;
        await new Promise<void>((resolve) => {
          const proplyLogo = new Image();
          proplyLogo.onload = () => {
            const aspectRatio = proplyLogo.height / proplyLogo.width;
            const proplyLogoHeight = proplyLogoWidth * aspectRatio;
            doc.addImage("/proply-logo-1.png", "PNG", 140, 10, proplyLogoWidth, proplyLogoHeight);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text("Powered by Proply", 140, 35);
            resolve();
          };
          proplyLogo.src = "/proply-logo-1.png";
        });
      } catch (error) {
        console.error('Error loading Proply logo:', error);
      }

      yPos = 50;

      // Property Details Section
      if (sectionGroups.find(g => g.title === "Property Details")?.sections.some(s => s.checked)) {
        doc.setFontSize(14);
        doc.text('Property Details', 20, yPos);
        yPos += 10;

        const actualRatePerSqM = Math.round(data.propertyDetails.purchasePrice / data.propertyDetails.floorArea);
        const areaRatePerSqM = data.propertyDetails.areaRatePerSquareMeter || 0;
        const rateDifference = areaRatePerSqM - actualRatePerSqM;

        const propertyData = [
          ['Address', data.propertyDetails.address],
          ['Bedrooms', data.propertyDetails.bedrooms || 'N/A'],
          ['Bathrooms', data.propertyDetails.bathrooms || 'N/A'],
          ['Floor Area', `${data.propertyDetails.floorArea}m²`],
          ['Parking Spaces', data.propertyDetails.parkingSpaces.toString()],
          ['Purchase Price', formatter(data.propertyDetails.purchasePrice)],
          ['Rate per m²', formatter(actualRatePerSqM)],
          ['Area Rate/m²', formatter(areaRatePerSqM)],
          ['Rate/m² Difference', formatter(rateDifference)]
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Detail', 'Value']],
          body: propertyData,
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Add map image if available
        if (mapImageData || capturedMapImage) {
          try {
            const imageToUse = mapImageData || capturedMapImage;
            if (imageToUse) {
              const mapWidth = 170;
              const mapHeight = 100;
              doc.addImage(imageToUse, 'PNG', 20, yPos, mapWidth, mapHeight);
              yPos += mapHeight + 20;
            }
          } catch (error) {
            console.error('Error adding map to PDF:', error);
            // Continue without map
          }
        }
      }

      // Deal Structure Section
      if (sectionGroups.find(g => g.title === "Deal Structure")?.sections.some(s => s.checked)) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('Deal Structure', 20, yPos);
        yPos += 10;

        const dealStructureData = [
          ['Deposit Amount', formatter(data.financialMetrics.depositAmount)],
          ['Deposit Percentage', `${data.financialMetrics.depositPercentage}%`],
          ['Interest Rate', `${data.financialMetrics.interestRate}%`],
          ['Loan Term', `${data.financialMetrics.loanTerm} years`],
          ['Monthly Bond Payment', formatter(data.financialMetrics.monthlyBondRepayment)],
          ['Bond Registration', formatter(data.financialMetrics.bondRegistration)],
          ['Transfer Costs', formatter(data.financialMetrics.transferCosts)]
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Detail', 'Value']],
          body: dealStructureData,
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Operating Expenses Section
      if (sectionGroups.find(g => g.title === "Operating Expenses")?.sections.some(s => s.checked)) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('Operating Expenses', 20, yPos);
        yPos += 10;

        const expensesData = [
          ['Monthly Levies', formatter(data.expenses.monthlyLevies)],
          ['Monthly Rates & Taxes', formatter(data.expenses.monthlyRatesTaxes)],
          ['Other Monthly Expenses', formatter(data.expenses.otherMonthlyExpenses)],
          ['Maintenance (%)', `${data.expenses.maintenancePercent}%`],
          ['Management Fee (%)', `${data.expenses.managementFee}%`]
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Expense Type', 'Amount']],
          body: expensesData,
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Rental Performance Section
      if (sectionGroups.find(g => g.title === "Rental Performance")?.sections.some(s => s.checked)) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('Rental Performance', 20, yPos);
        yPos += 10;

        const performanceData = [
          ['Short-Term Performance', ''],
          ['Nightly Rate', formatter(data.performance.shortTermNightlyRate)],
          ['Annual Occupancy', `${data.performance.annualOccupancy}%`],
          ['Annual Revenue', formatter(data.performance.shortTermAnnualRevenue)],
          ['Monthly Average', formatter(data.performance.shortTermAnnualRevenue / 12)],
          ['Gross Yield', `${data.performance.shortTermGrossYield}%`],
          ['', ''],
          ['Long-Term Performance', ''],
          ['Annual Revenue', formatter(data.performance.longTermAnnualRevenue)],
          ['Monthly Revenue', formatter(data.performance.longTermAnnualRevenue / 12)],
          ['Gross Yield', `${data.performance.longTermGrossYield}%`]
        ];

        autoTable(doc, {
          startY: yPos,
          body: performanceData,
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] },
          didParseCell: function(data) {
            if (data.row.index === 0 || data.row.index === 7) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [243, 244, 246];
            }
          }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Investment Metrics Section
      if (sectionGroups.find(g => g.title === "Investment Metrics")?.sections.some(s => s.checked) && data.investmentMetrics?.year1) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('Investment Metrics (Year 1)', 20, yPos);
        yPos += 10;

        const metrics = data.investmentMetrics.year1;
        const investmentData = [
          ['Gross Yield', `${metrics.grossYield?.toFixed(1) || 0}%`],
          ['Net Yield', `${metrics.netYield?.toFixed(1) || 0}%`],
          ['Return on Equity', `${metrics.returnOnEquity?.toFixed(1) || 0}%`],
          ['Annual Return', `${metrics.annualReturn?.toFixed(1) || 0}%`],
          ['Cap Rate', `${metrics.capRate?.toFixed(1) || 0}%`],
          ['Cash on Cash Return', `${metrics.cashOnCashReturn?.toFixed(1) || 0}%`],
          ['ROI (Without Appreciation)', `${metrics.roiWithoutAppreciation?.toFixed(1) || 0}%`],
          ['ROI (With Appreciation)', `${metrics.roiWithAppreciation?.toFixed(1) || 0}%`],
          ['IRR', `${metrics.irr?.toFixed(1) || 0}%`]
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value']],
          body: investmentData,
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Cashflow Analysis Section
      if (sectionGroups.find(g => g.title === "Cashflow Analysis")?.sections.some(s => s.checked) && data.netOperatingIncome) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('Cashflow Analysis', 20, yPos);
        yPos += 10;

        const years = [1, 2, 3, 4, 5, 10, 20];
        const cashflowData = years.map(year => {
          const yearKey = `year${year}` as keyof typeof data.netOperatingIncome;
          const yearData = data.netOperatingIncome![yearKey];
          return [
            `Year ${year}`,
            formatter(yearData.annualCashflow),
            formatter(yearData.cumulativeRentalIncome),
            formatter(yearData.netWorthChange)
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Year', 'Annual Cashflow', 'Cumulative Rental Income', 'Net Worth Change']],
          body: cashflowData,
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      // Add page numbers and disclaimer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        if (i === pageCount) {
          const disclaimerY = doc.internal.pageSize.height - 80;
          doc.setFontSize(6);
          doc.setTextColor(100);

          const disclaimerText = [
            "DISCLAIMER: The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While we make best efforts to ensure the accuracy and reliability of all data presented, we cannot guarantee its absolute accuracy or completeness.",
            "",
            "This report is intended to serve as a general guide and should not be considered as financial, investment, legal, or professional advice. Property investment carries inherent risks, and market conditions can change rapidly.",
            "",
            "© 2025 Proply Tech (Pty) Ltd. All rights reserved."
          ];

          let currentY = disclaimerY;
          for (const text of disclaimerText) {
            if (text === "") {
              currentY += 3;
              continue;
            }
            const lines = doc.splitTextToSize(text, 170);
            for (const line of lines) {
              doc.text(line, 20, currentY);
              currentY += 3;
            }
          }
        }

        // Add page info
        doc.setFontSize(10);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()}`,
          20,
          doc.internal.pageSize.height - 20
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          170,
          doc.internal.pageSize.height - 20
        );
      }

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
          {/* Add hidden map container for capturing */}
          <div ref={mapRef} id="map-container" style={{ display: 'none' }}>
            {/* Map will be rendered here when needed */}
          </div>

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