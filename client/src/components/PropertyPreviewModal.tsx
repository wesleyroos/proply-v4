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

  doc.save(`${property.title.replace(/[^a-zA-Z0-9]/g, "_")}_preview.pdf`);
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
              className="ml-6 bg-blue-400 hover:bg-blue-500 text-white"
              onClick={() => {
                const pdfData = {
                  propertyDetails: {
                    ...property,
                    propertyDescription: "",
                    floorArea: 0,
                    ratePerSquareMeter: 0,
                    purchasePrice: 0,
                  },
                  performance: {
                    shortTermNightlyRate: property.shortTermNightly,
                    annualOccupancy: property.annualOccupancy,
                    shortTermAnnualRevenue: property.shortTermAnnual,
                    longTermAnnualRevenue: property.longTermMonthly * 12,
                    shortTermGrossYield: 0,
                    longTermGrossYield: 0,
                  },
                  financialMetrics: {
                    depositAmount: 0,
                    depositPercentage: 0,
                    interestRate: 0,
                    monthlyBondRepayment: 0,
                    bondRegistration: 0,
                    transferCosts: 0,
                    loanTerm: 20,
                    annualAppreciation: 5,
                  },
                  expenses: {
                    managementFee: property.managementFee,
                    monthlyLevies: 0,
                    monthlyRatesTaxes: 0,
                    otherMonthlyExpenses: 0,
                    maintenancePercent: 0,
                  },
                  analysis: {
                    netOperatingIncome: {},
                    longTermNetOperatingIncome: {},
                    revenueProjections: { shortTerm: {}, longTerm: {} },
                  },
                };

                const selections = {
                  propertyOverview: {
                    propertyRatePerSquareMeter: false,
                    areaRatePerSquareMeter: false,
                    rateDifference: false,
                  },
                  financialMetrics: { totalCapitalRequired: false },
                  operatingExpenses: {
                    maintenancePercent: false,
                    managementFee: true,
                  },
                  rentalPerformance: {
                    shortTermNightlyRate: true,
                    shortTermAnnualOccupancy: true,
                    shortTermAnnualRevenue: true,
                    shortTermGrossYield: true,
                    longTermMonthlyRevenue: true,
                    longTermAnnualRevenue: true,
                    longTermGrossYield: true,
                    rentalPerforamceChart: true,
                  },
                  cashflowMetrics: {
                    annualRevenue: false,
                    netOperatingIncome: false,
                    netOperatingExpense: false,
                    anualBondPayment: false,
                    annualCashflow: false,
                    cumulativeCashflow: false,
                    cashflowChart: false,
                  },
                  investmentMetrics: {
                    grossYield: false,
                    netYield: false,
                    returnOnEquity: false,
                    annualReturn: false,
                    capRate: false,
                    cashOnCashReturn: false,
                    irr: false,
                    netWorthChange: false,
                  },
                  assetGrowthAndEquity: {
                    propertyValue: false,
                    annualAppreciation: false,
                    loanBalance: false,
                    totalInterestPaid: false,
                    interestToPrincipalRatio: false,
                    totalEquity: false,
                    loanRepaymentEquity: false,
                    assetGrowthAndEquityChart: false,
                  },
                };

                //generatePDF(pdfData, selections); //Removed as it's for a different product
              }}
              className="mr-6 bg-[#1BA3FF] hover:bg-[#1BA3FF]/90 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
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