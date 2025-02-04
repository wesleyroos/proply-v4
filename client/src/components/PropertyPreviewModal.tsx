import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatter } from "@/utils/formatting";
import {
  Building2,
  TrendingUp,
  BarChart3,
  MapPin,
  FileText,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PropertyMap from "./PropertyMap";
import { Progress } from "@/components/ui/progress"; // Assuming Progress component exists

interface Property {
  id: number;
  title: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  longTermMonthly: number;
  shortTermAnnual: number;
  shortTermAfterFees: number;
  breakEvenOccupancy: number;
  shortTermNightly: number;
  annualOccupancy: number;
  managementFee: number;
  createdAt: string;
  parkingSpaces?: string; // Added optional parkingSpaces
}

interface PropertyPreviewModalProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Function to generate the PDF with comprehensive property details
async function generatePropertyPreviewPDF(property: Property | null) {
  if (!property) return;

  const doc = new jsPDF();
  let yPos = 20;

  // Add Proply logo
  try {
    const proplyLogoWidth = 40;
    await new Promise<void>((resolve) => {
      const proplyLogo = new Image();
      proplyLogo.onload = () => {
        const aspectRatio = proplyLogo.height / proplyLogo.width;
        const proplyLogoHeight = proplyLogoWidth * aspectRatio;
        doc.addImage(
          "/proply-logo-1.png",
          "PNG",
          doc.internal.pageSize.getWidth() - 60,
          yPos,
          proplyLogoWidth,
          proplyLogoHeight
        );
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          "Powered by Proply",
          doc.internal.pageSize.getWidth() - 60,
          yPos + proplyLogoHeight + 5
        );
        resolve();
      };
      proplyLogo.onerror = () => {
        console.error("Error loading Proply logo");
        resolve();
      };
      proplyLogo.src = "/proply-logo-1.png";
    });
  } catch (error) {
    console.error("Error adding Proply logo:", error);
  }

  yPos = Math.max(yPos + 40, 60);

  // Title and Address
  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.text("Rent Compare Analysis", 20, yPos); //Added heading
  yPos += 10;
  doc.setFontSize(12);
  doc.text(property.title, 20, yPos);
  yPos += 10;
  doc.setFontSize(12);
  doc.text(property.address, 20, yPos);
  yPos += 20;

  // Property Details
  doc.setFontSize(16);
  doc.text("Property Details", 20, yPos);
  yPos += 10;

  const propertyDetails = [
    ["Bedrooms", property.bedrooms],
    ["Bathrooms", property.bathrooms],
    property.parkingSpaces ? ["Parking Spaces", property.parkingSpaces] : null,
  ].filter(Boolean);

  autoTable(doc, {
    startY: yPos,
    head: [["Feature", "Value"]],
    body: propertyDetails,
    theme: "grid",
    styles: { fontSize: 10, halign: 'center' },
    headStyles: { fillColor: [27, 163, 255], textColor: 255 }, // Proply blue
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Short-Term Performance
  doc.setFontSize(16);
  doc.text("Short-Term Performance", 20, yPos);
  yPos += 10;

  const shortTermDetails = [
    ["Annual Revenue", formatter.format(property.shortTermAnnual)],
    ["Monthly Average", formatter.format(property.shortTermAnnual / 12)],
    ["Nightly Rate", formatter.format(property.shortTermNightly)],
    ["Annual Occupancy", `${property.annualOccupancy}%`],
    ["Management Fee", `${property.managementFee}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: shortTermDetails,
    theme: "grid",
    styles: { fontSize: 10, halign: 'center' },
    headStyles: { fillColor: [27, 163, 255], textColor: 255 }, // Proply blue
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Long-Term Performance
  doc.setFontSize(16);
  doc.text("Long-Term Performance", 20, yPos);
  yPos += 10;

  const longTermDetails = [
    ["Annual Revenue", formatter.format(property.longTermMonthly * 12)],
    ["Monthly Revenue", formatter.format(property.longTermMonthly)],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: longTermDetails,
    theme: "grid",
    styles: { fontSize: 10, halign: 'center' },
    headStyles: { fillColor: [27, 163, 255], textColor: 255 }, // Proply blue
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Breakeven Analysis
  doc.setFontSize(16);
  doc.text("Breakeven Analysis", 20, yPos);
  yPos += 10;

  const breakEvenDetails = [
    ["Projected Occupancy", `${property.annualOccupancy}%`],
    ["Break-even Occupancy", `${property.breakEvenOccupancy}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [["Metric", "Value"]],
    body: breakEvenDetails,
    theme: "grid",
    styles: { fontSize: 10, halign: 'center' },
    headStyles: { fillColor: [27, 163, 255], textColor: 255 }, // Proply blue
  });

  // Add page numbers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Page ${i} of ${totalPages}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Add disclaimer page
  doc.addPage();

  // Add disclaimer heading
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("Important Disclaimers & Legal Notices", 20, 20);

  // Set disclaimer text style
  doc.setFontSize(8);
  doc.setTextColor(90);

  const currentYear = new Date().getFullYear();
  const disclaimerText = [
    "DISCLAIMER: The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While we make best efforts to ensure the accuracy and reliability of all data presented, including sourcing information from trusted third-party providers, we cannot guarantee its absolute accuracy or completeness.",
    "",
    "This report is intended to serve as a general guide and should not be considered as financial, investment, legal, or professional advice. Any decisions made based on this information are solely the responsibility of the user. Property investment carries inherent risks, and market conditions can change rapidly.",
    "",
    "Proply Tech (Pty) Ltd and its affiliates expressly disclaim any and all liability for any direct, indirect, incidental, or consequential damages arising from the use of this information. Actual results may vary significantly from the projections and estimates presented.",
    "",
    "By using this report, you acknowledge that the calculations and projections are indicative only and based on the information available at the time of generation. Factors beyond our control, including but not limited to market fluctuations, regulatory changes, and economic conditions, may impact actual outcomes.",
    "",
    `© ${currentYear} Proply Tech (Pty) Ltd. All rights reserved.`
  ];

  let yPosition = 40;
  disclaimerText.forEach(text => {
    if (text === "") {
      yPosition += 5;
      return;
    }
    const lines = doc.splitTextToSize(text, 170);
    lines.forEach(line => {
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });
  });

  doc.save(`Rent Compare for ${property.address.replace(/[^a-zA-Z0-9]/g, " ")}.pdf`);
}


export function PropertyPreviewModal({
  property,
  open,
  onOpenChange,
}: PropertyPreviewModalProps) {
  if (!property) return null;

  const platformFee = property.managementFee > 0 ? 15 : 3;
  const feeAdjustedNightlyRate =
    property.shortTermNightly * (1 - platformFee / 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-3xl font-bold text-slate-800">
              {property.title}
            </DialogTitle>

            <Button
              onClick={() => generatePropertyPreviewPDF(property)}
              className="mr-6 bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export Preview
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-8rem)]">
          <div className="grid grid-cols-3 gap-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-500" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">
                    Address
                  </h3>
                  <p className="mt-1 text-slate-800">{property.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600">
                      Bedrooms
                    </h3>
                    <p className="mt-1 text-slate-800">{property.bedrooms}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600">
                      Bathrooms
                    </h3>
                    <p className="mt-1 text-slate-800">{property.bathrooms}</p>
                  </div>
                </div>
                {property.parkingSpaces && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-600">
                      Parking Spaces
                    </h3>
                    <p className="mt-1 text-slate-800">
                      {property.parkingSpaces}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-slate-600">
                    Added
                  </h3>
                  <p className="mt-1 text-slate-800">
                    {new Date(property.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  Short-Term Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-blue-50/50 space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {formatter.format(property.shortTermAnnual)}
                      <span className="text-base font-normal text-slate-600 ml-2">
                        / year
                      </span>
                    </p>
                    <p className="text-base text-slate-600">
                      {formatter.format(property.shortTermAnnual / 12)}/month
                    </p>
                  </div>
                  <div className="pt-2 border-t border-blue-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600">Nightly Rate:</p>
                      <p className="text-sm font-medium">
                        {formatter.format(property.shortTermNightly)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600">
                        Fee-adjusted Rate:
                      </p>
                      <p className="text-sm font-medium">
                        {formatter.format(feeAdjustedNightlyRate)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600">Platform Fee:</p>
                      <p className="text-sm font-medium text-red-600">
                        {platformFee}%
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600">Management Fee:</p>
                      <p className="text-sm font-medium">
                        {property.managementFee}%
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-slate-600">Occupancy:</p>
                      <p className="text-sm font-medium">
                        {property.annualOccupancy}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  Long-Term Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-purple-50/50 space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {formatter.format(property.longTermMonthly * 12)}
                      <span className="text-base font-normal text-slate-600 ml-2">
                        / year
                      </span>
                    </p>
                    <p className="text-base text-slate-600">
                      {formatter.format(property.longTermMonthly)}/month
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Monthly Revenue:</p>
                    <p className="text-base text-slate-800">
                      {formatter.format(property.longTermMonthly)}/month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Breakeven Analysis Card */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Breakeven Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-600">
                        Projected Occupancy
                      </span>
                      <span className="text-sm font-medium">
                        {property.annualOccupancy}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={property.annualOccupancy}
                        className="h-2"
                      />
                      <div
                        className="absolute top-0 h-4 w-0.5 bg-red-500 transform -translate-y-1"
                        style={{ left: `${property.breakEvenOccupancy}%` }}
                        title="Break-even point"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-2 bg-primary rounded-full"></div>
                      <span>Projected {property.annualOccupancy}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-3 bg-red-500"></div>
                      <span>Break-even {property.breakEvenOccupancy}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    Your short-term rental needs {property.breakEvenOccupancy}%
                    occupancy to match long-term rental income.
                    {property.annualOccupancy > property.breakEvenOccupancy
                      ? ` At ${property.annualOccupancy}% projected occupancy, short-term rental is more profitable.`
                      : ` At ${property.annualOccupancy}% projected occupancy, long-term rental may be more suitable.`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Property Map */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyan-500" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyMap address={property.address} />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}