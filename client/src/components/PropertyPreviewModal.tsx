import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { formatter } from "@/utils/formatting";
import { useUser } from "@/hooks/use-user";
import {
  Building2,
  TrendingUp,
  BarChart3,
  MapPin,
  FileText,
  Sparkles,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PropertyMap from "./PropertyMap";
import { Progress } from "@/components/ui/progress"; // Assuming Progress component exists
import html2canvas from 'html2canvas';

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
async function generatePropertyPreviewPDF(
  property: Property | null, 
  includeCompanyBranding: boolean = true,
  userData?: SelectUser | null
) {
  if (!property) return;

  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  const startY = 20;
  let maxLogoHeight = 0;

  // Add company logo if branding is enabled and logo exists
  if (includeCompanyBranding && userData?.companyLogo) {
    try {
      const logoWidth = 40;
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.height / img.width;
          const logoHeight = logoWidth * aspectRatio;
          maxLogoHeight = Math.max(maxLogoHeight, logoHeight);
          doc.addImage(
            userData.companyLogo,
            "PNG",
            margin,
            startY,
            logoWidth,
            logoHeight
          );
          resolve();
        };
        img.onerror = () => {
          console.error("Error loading company logo");
          resolve();
        };
        img.crossOrigin = "Anonymous";
        img.src = userData.companyLogo;
      });
    } catch (error) {
      console.error("Error adding company logo:", error);
    }
  }

  // Add Proply logo
  try {
    const proplyLogoWidth = 40;
    await new Promise<void>((resolve) => {
      const proplyLogo = new Image();
      proplyLogo.onload = () => {
        const aspectRatio = proplyLogo.height / proplyLogo.width;
        const proplyLogoHeight = proplyLogoWidth * aspectRatio;
        maxLogoHeight = Math.max(maxLogoHeight, proplyLogoHeight);
        doc.addImage(
          "/proply-logo-1.png",
          "PNG",
          doc.internal.pageSize.getWidth() - 60,
          startY,
          proplyLogoWidth,
          proplyLogoHeight
        );
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          "Powered by Proply",
          doc.internal.pageSize.getWidth() - 60,
          startY + proplyLogoHeight + 5
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

  yPos = startY + maxLogoHeight + 10;

  yPos = Math.max(yPos, 50);

  // Title and Address
  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.text("Rent Compare Analysis", 20, yPos); //Added heading
  yPos += 10;

  // Add description
  doc.setFontSize(10);
  doc.setTextColor(90);
  const contentWidth = doc.internal.pageSize.getWidth() - 60; // Reduce width by increasing margin
  const descriptionText = "A comprehensive comparison of short-term and long-term rental strategies for your property, analyzing potential returns, occupancy requirements, and break-even points to help you make an informed investment decision.";
  const lines = doc.splitTextToSize(descriptionText, contentWidth);
  lines.forEach(line => {
    doc.text(line, 20, yPos);
    yPos += 5;
  });
  yPos += 15;

  // Property Details section
  doc.setFontSize(16);
  doc.text("Property Details", 20, yPos);
  yPos += 10;

  const propertyDetails = [
    ["Property Name", property.title],
    ["Address", property.address],
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

  const platformFee = property.managementFee > 0 ? 15 : 3;
  const feeAdjustedNightlyRate = property.shortTermNightly * (1 - platformFee / 100);

  const shortTermDetails = [
    ["Annual Revenue", formatter.format(property.shortTermAnnual)],
    ["Monthly Average", formatter.format(property.shortTermAnnual / 12)],
    ["Nightly Rate", formatter.format(property.shortTermNightly)],
    ["Platform Fee", `${platformFee}%`],
    ["Fee-adjusted Rate", formatter.format(feeAdjustedNightlyRate)],
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

  yPos = (doc as any).lastAutoTable.finalY + 20;


  // Capture Revenue Chart
  const revenueChartElement = document.querySelector('.revenue-chart .recharts-wrapper');
  if (revenueChartElement) {
    const canvas = await html2canvas(revenueChartElement);
    const chartImage = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    doc.setFontSize(14);
    doc.text('Monthly Revenue Projection', margin, yPos);
    yPos += 10;

    doc.addImage(chartImage, 'PNG', margin, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 20;
  }

  // Add Monthly Revenue Table
  doc.setFontSize(14);
  doc.text('Monthly Revenue Breakdown', margin, yPos);
  yPos += 10;

  const tableHeaders = [
    'Month',
    'Nightly Rate',
    'Fee-Adjusted Rate',
    'Occupancy Low',
    'Revenue Low',
    'Occupancy Med',
    'Revenue Med',
    'Occupancy High',
    'Revenue High',
    'Long Term'
  ];

  const tableData = Array(12).fill(0).map((_, i) => [
    new Date(2024, i).toLocaleString('default', { month: 'short' }),
    formatter.format(getSeasonalNightlyRate(property.shortTermNightly, i)),
    formatter.format(getFeeAdjustedRate(getSeasonalNightlyRate(property.shortTermNightly, i), property.managementFee > 0)),
    `${OCCUPANCY_RATES.low[i]}%`,
    formatter.format(calculateMonthlyRevenue('low', i, property.shortTermNightly, property.managementFee > 0, property.managementFee)),
    `${OCCUPANCY_RATES.medium[i]}%`,
    formatter.format(calculateMonthlyRevenue('medium', i, property.shortTermNightly, property.managementFee > 0, property.managementFee)),
    `${OCCUPANCY_RATES.high[i]}%`,
    formatter.format(calculateMonthlyRevenue('high', i, property.shortTermNightly, property.managementFee > 0, property.managementFee)),
    formatter.format(property.longTermMonthly)
  ]);

  // Calculate averages for occupancy rates
  const avgLowOcc = (OCCUPANCY_RATES.low.reduce((a, b) => a + b, 0) / 12).toFixed(1) + '%';
  const avgMedOcc = (OCCUPANCY_RATES.medium.reduce((a, b) => a + b, 0) / 12).toFixed(1) + '%';
  const avgHighOcc = (OCCUPANCY_RATES.high.reduce((a, b) => a + b, 0) / 12).toFixed(1) + '%';

  // Calculate totals for revenues
  const totalLowRevenue = Array(12).fill(0)
    .reduce((sum, _, i) => sum + calculateMonthlyRevenue('low', i, property.shortTermNightly, property.managementFee > 0, property.managementFee), 0);
  const totalMedRevenue = Array(12).fill(0)
    .reduce((sum, _, i) => sum + calculateMonthlyRevenue('medium', i, property.shortTermNightly, property.managementFee > 0, property.managementFee), 0);
  const totalHighRevenue = Array(12).fill(0)
    .reduce((sum, _, i) => sum + calculateMonthlyRevenue('high', i, property.shortTermNightly, property.managementFee > 0, property.managementFee), 0);
  const totalLongTerm = property.longTermMonthly * 12;

  // Add totals row
  tableData.push([
    'Averages/Totals',
    '-',
    '-',
    avgLowOcc,
    formatter.format(totalLowRevenue),
    avgMedOcc,
    formatter.format(totalMedRevenue),
    avgHighOcc,
    formatter.format(totalHighRevenue),
    formatter.format(totalLongTerm)
  ]);

  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: yPos,
    styles: { fontSize: 6.5 },
    headStyles: { fillColor: [27, 163, 255], fontSize: 7 },
    margin: { left: margin },
    didParseCell: function(data) {
      // Make last row (totals) bold
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [243, 244, 246];
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Add footer elements to all pages
  const totalPages = doc.getNumberOfPages();
  const margin = 20;
  const footerPadding = 10;

  try {
    const logo = new Image();
    logo.src = "/proply-logo-1.png";
    
    await new Promise((resolve) => {
      logo.onload = () => {
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          
          // Add Proply logo to bottom left
          const logoHeight = 8;
          const aspectRatio = logo.width / logo.height;
          const logoWidth = logoHeight * aspectRatio;
          doc.addImage(logo, "PNG", margin, doc.internal.pageSize.getHeight() - margin - logoHeight - footerPadding, logoWidth, logoHeight);

          // Add page numbers to bottom right
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(
            `Page ${i} of ${totalPages}`,
            doc.internal.pageSize.getWidth() - margin,
            doc.internal.pageSize.getHeight() - footerPadding,
            { align: 'right' }
          );

          // Add copyright text to center
          const currentYear = new Date().getFullYear();
          doc.text(
            `© ${currentYear} Proply Tech (Pty) Ltd. All rights reserved.`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - footerPadding,
            { align: 'center' }
          );
        }
        resolve(null);
      };
      logo.onerror = () => {
        console.error("Error loading logo in footer");
        resolve(null);
      };
    });
  } catch (error) {
    console.error("Error adding footer elements:", error);
    // If logo fails, still add page numbers and copyright
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Page ${i} of ${totalPages}`,
        doc.internal.pageSize.getWidth() - margin,
        doc.internal.pageSize.getHeight() - footerPadding,
        { align: 'right' }
      );
      doc.text(
        `© ${currentYear} Proply Tech (Pty) Ltd. All rights reserved.`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - footerPadding,
        { align: 'center' }
      );
    }
  }

  // Add new page for disclaimer
  doc.addPage();

  // Add disclaimer heading
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Important Disclaimers & Legal Notices", 20, 40);

  // Set disclaimer text style
  doc.setFontSize(7);
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

  let yPosition = 60;
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

  const { user } = useUser();
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

            <Dialog>
              <DialogTrigger asChild>
                <Button className="mr-6 bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Export Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <DialogTitle>Include Company Branding?</DialogTitle>
                    <span className="bg-gradient-to-r from-primary to-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                      PRO
                    </span>
                    <Sparkles className="h-4 w-4 text-[#1BA3FF]" />
                  </div>
                  <DialogDescription>
                    Would you like to include your company branding in the PDF?
                  </DialogDescription>
                </DialogHeader>
                {user?.companyLogo ? (
                  <div className="flex items-center gap-4 mb-4">
                    <img src={user.companyLogo} alt="Company Logo" className="w-32 h-32 object-contain border rounded-lg" />
                    <div>
                      <p className="text-sm text-muted-foreground">Your current company logo</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">No company logo found. Upload one now:</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64Data = reader.result as string;
                            try {
                              const response = await fetch('/api/profile', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ companyLogo: base64Data }),
                                credentials: 'include'
                              });
                              if (!response.ok) throw new Error(await response.text());
                              queryClient.invalidateQueries(['user']);
                              toast({
                                title: "Success",
                                description: "Company logo uploaded successfully",
                                duration: 3000,
                              });
                            } catch (error) {
                              toast({
                                variant: "destructive",
                                title: "Error",
                                description: "Failed to upload company logo",
                                duration: 5000,
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                )}
                <div className="flex justify-end gap-4 mt-4">
                  <Button variant="outline" onClick={() => {
                    onOpenChange(false);
                    generatePropertyPreviewPDF(property, false, user);
                  }}>
                    No
                  </Button>
                  <Button onClick={() => {
                    onOpenChange(false);
                    generatePropertyPreviewPDF(property, true, user);
                  }}>
                    Yes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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

            {/* Revenue Comparison Chart */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Revenue Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      className="revenue-chart"
                      data={Array(12).fill(0).map((_, i) => ({
                        month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
                        low: calculateMonthlyRevenue('low', i, property.shortTermNightly, property.managementFee > 0, property.managementFee),
                        medium: calculateMonthlyRevenue('medium', i, property.shortTermNightly, property.managementFee > 0, property.managementFee),
                        high: calculateMonthlyRevenue('high', i, property.shortTermNightly, property.managementFee > 0, property.managementFee),
                        longTerm: property.longTermMonthly,
                      }))}
                    >
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatter.format(value)} />
                      <RechartsTooltip formatter={(value) => formatter.format(value as number)} />
                      <Legend />
                      <Line type="monotone" dataKey="low" stroke="#FF6B6B" name="Revenue Low" />
                      <Line type="monotone" dataKey="medium" stroke="#4ECDC4" name="Revenue Medium" />
                      <Line type="monotone" dataKey="high" stroke="#45B7D1" name="Revenue High" />
                      <Line type="monotone" dataKey="longTerm" stroke="#FFE66D" strokeDasharray="5 5" name="Long Term Rental" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Revenue Table */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800">Monthly Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4">Metric</th>
                        {Array(12).fill(0).map((_, i) => (
                          <th key={i} className="text-right py-3 px-4">
                            {new Date(2024, i).toLocaleString('default', { month: 'short' })}
                          </th>
                        ))}
                        <th className="text-right py-3 px-4 border-l">Total</th>
                        <th className="text-right py-3 px-4">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="py-3 px-4">Nightly Rate</td>
                        {Array(12).fill(0).map((_, i) => (
                          <td key={i} className="text-right py-3 px-4 whitespace-nowrap">
                            {formatter.format(getSeasonalNightlyRate(property.shortTermNightly, i))}
                          </td>
                        ))}
                        <td className="text-right py-3 px-4 border-l"></td>
                        <td className="text-right py-3 px-4"></td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-3 px-4">Fee-Adjusted Rate</td>
                        {Array(12).fill(0).map((_, i) => (
                          <td key={i} className="text-right py-3 px-4 whitespace-nowrap">
                            {formatter.format(getFeeAdjustedRate(getSeasonalNightlyRate(property.shortTermNightly, i), property.managementFee > 0))}
                          </td>
                        ))}
                        <td className="text-right py-3 px-4 border-l"></td>
                        <td className="text-right py-3 px-4"></td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-3 px-4">Occupancy Low</td>
                        {OCCUPANCY_RATES.low.map((rate, i) => (
                          <td key={i} className="text-right py-3 px-4 whitespace-nowrap">{rate}%</td>
                        ))}
                        <td className="text-right py-3 px-4 border-l">-</td>
                        <td className="text-right py-3 px-4">{(OCCUPANCY_RATES.low.reduce((a, b) => a + b, 0) / 12).toFixed(1)}%</td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-3 px-4">Occupancy Medium</td>
                        {OCCUPANCY_RATES.medium.map((rate, i) => (
                          <td key={i} className="text-right py-3 px-4 whitespace-nowrap">{rate}%</td>
                        ))}
                        <td className="text-right py-3 px-4 border-l">-</td>
                        <td className="text-right py-3 px-4">{(OCCUPANCY_RATES.medium.reduce((a, b) => a + b, 0) / 12).toFixed(1)}%</td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-3 px-4">Occupancy High</td>
                        {OCCUPANCY_RATES.high.map((rate, i) => (
                          <td key={i} className="text-right py-3 px-4 whitespace-nowrap">{rate}%</td>
                        ))}
                        <td className="text-right py-3 px-4 border-l">-</td>
                        <td className="text-right py-3 px-4">{(OCCUPANCY_RATES.high.reduce((a, b) => a + b, 0) / 12).toFixed(1)}%</td>
                      </tr>
                      <tr className="border-t bg-[#FF6B6B]/10">
                        <td className="py-3 px-4 text-[#FF6B6B] font-medium">Revenue Low</td>
                        {Array(12).fill(0).map((_, i) => {
                          const revenue = calculateMonthlyRevenue('low', i, property.shortTermNightly, property.managementFee > 0, property.managementFee);
                          return (
                            <td key={i} className="text-right py-3 px-4 whitespace-nowrap">
                              {formatter.format(revenue)}
                            </td>
                          );
                        })}
                        <td className="text-right py-3 px-4 border-l font-medium">
                          {formatter.format(Array(12).fill(0).reduce((sum, _, i) => 
                            sum + calculateMonthlyRevenue('low', i, property.shortTermNightly, property.managementFee > 0, property.managementFee), 0
                          ))}
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {formatter.format(Array(12).fill(0).reduce((sum, _, i) => 
                            sum + calculateMonthlyRevenue('low', i, property.shortTermNightly, property.managementFee > 0, property.managementFee), 0
                          ) / 12)}
                        </td>
                      </tr>
                      <tr className="border-t bg-[#4ECDC4]/10">
                        <td className="py-3 px-4 text-[#4ECDC4] font-medium">Revenue Medium</td>
                        {Array(12).fill(0).map((_, i) => {
                          const revenue = calculateMonthlyRevenue('medium', i, property.shortTermNightly, property.managementFee > 0, property.managementFee);
                          return (
                            <td key={i} className="text-right py-3 px-4 whitespace-nowrap">
                              {formatter.format(revenue)}
                            </td>
                          );
                        })}
                        <td className="text-right py-3 px-4 border-l font-medium">
                          {formatter.format(Array(12).fill(0).reduce((sum, _, i) => 
                            sum + calculateMonthlyRevenue('medium', i, property.shortTermNightly, property.managementFee > 0, property.managementFee), 0
                          ))}
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {formatter.format(Array(12).fill(0).reduce((sum, _, i) => 
                            sum + calculateMonthlyRevenue('medium', i, property.shortTermNightly, property.managementFee > 0, property.managementFee), 0
                          ) / 12)}
                        </td>
                      </tr>
                      <tr className="border-t bg-[#45B7D1]/10">
                        <td className="py-3 px-4 text-[#45B7D1] font-medium">Revenue High</td>
                        {Array(12).fill(0).map((_, i) => {
                          const revenue = calculateMonthlyRevenue('high', i, property.shortTermNightly, property.managementFee > 0, property.managementFee);
                          return (
                            <td key={i} className="text-right py-3 px-4 whitespace-nowrap">
                              {formatter.format(revenue)}
                            </td>
                          );
                        })}
                        <td className="text-right py-3 px-4 border-l font-medium">
                          {formatter.format(Array(12).fill(0).reduce((sum, _, i) => 
                            sum + calculateMonthlyRevenue('high', i, property.shortTermNightly, property.managementFee > 0, property.managementFee), 0
                          ))}
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {formatter.format(Array(12).fill(0).reduce((sum, _, i) => 
                            sum + calculateMonthlyRevenue('high', i, property.shortTermNightly, property.managementFee > 0, property.managementFee), 0
                          ) / 12)}
                        </td>
                      </tr>
                      <tr className="border-t bg-[#FFE66D]/10">
                        <td className="py-3 px-4 text-[#B8860B] font-medium">Long Term Rental</td>
                        {Array(12).fill(0).map((_, i) => (
                          <td key={i} className="text-right py-3 px-4 whitespace-nowrap">
                            {formatter.format(property.longTermMonthly)}
                          </td>
                        ))}
                        <td className="text-right py-3 px-4 border-l font-medium">
                          {formatter.format(property.longTermMonthly * 12)}
                        </td>
                        <td className="text-right py-3 px-4 font-medium">
                          {formatter.format(property.longTermMonthly)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>


          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for calculations
const OCCUPANCY_RATES = {
  low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 70],
  medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 85],
  high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEASONALITY_FACTORS = [2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03];

function getSeasonalMultiplier(month: number): number {
  return SEASONALITY_FACTORS[month];
}

function getSeasonalNightlyRate(baseRate: number, month: number): number {
  return baseRate * getSeasonalMultiplier(month);
}

function getFeeAdjustedRate(rate: number, hasManagementFee: boolean): number {
  return hasManagementFee
    ? rate * 0.85  // 15% Airbnb fee for professionally managed
    : rate * 0.97; // 3% fee for self-managed
}

function calculateMonthlyRevenue(
  scenario: 'low' | 'medium' | 'high',
  month: number,
  nightly: number,
  hasManagementFee: boolean,
  managementFeePercent: number
): number {
  const occupancyRate = OCCUPANCY_RATES[scenario][month] / 100;
  const daysInMonth = new Date(2024, month + 1, 0).getDate();

  // Apply seasonal adjustment and platform fee
  const seasonalRate = getSeasonalNightlyRate(nightly, month);
  const feeAdjustedRate = getFeeAdjustedRate(seasonalRate, hasManagementFee);

  let revenue = Math.abs(feeAdjustedRate * daysInMonth* occupancyRate);

  // Apply management fee if present
  if (hasManagementFee) {
    revenue *= (1 - (managementFeePercent / 100));
  }

  return revenue;
}