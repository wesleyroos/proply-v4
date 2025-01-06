import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from "@/lib/utils";

// Constants for PDF layout
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN);

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
  };
  financialMetrics: {
    depositAmount: number;
    depositPercentage: number;
    interestRate: number;
    loanTerm: number;
    monthlyBondRepayment: number;
  };
  performance: {
    shortTermNightlyRate: number;
    annualOccupancy: number;
    shortTermAnnualRevenue: number;
    longTermAnnualRevenue: number;
    shortTermGrossYield: number;
    longTermGrossYield: number;
  };
  investmentMetrics?: Record<string, {
    grossYield: number;
    netYield: number;
    returnOnEquity: number;
    annualReturn: number;
    capRate: number;
    cashOnCashReturn: number;
    irr: number;
    netWorthChange: number;
  }>;
  netOperatingIncome?: Record<string, {
    value: number;
    annualCashflow: number;
    cumulativeRentalIncome: number;
    netWorthChange: number;
  }>;
}

export function generatePropertyReport(
  data: PropertyData, 
  selectedSections: Record<string, string[]>,
  companyLogo?: string | null
): jsPDF {
  const doc = new jsPDF();
  let yPos = MARGIN;

  // Add company logo if provided (top-left)
  if (selectedSections["Company Branding"]?.includes("companyLogo") && companyLogo) {
    doc.addImage(companyLogo, "PNG", MARGIN, yPos, 40, 20);
  }

  // Add Proply branding (top-right, always included)
  doc.addImage("/proply-logo.png", "PNG", PAGE_WIDTH - MARGIN - 40, yPos, 40, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Powered by Proply", PAGE_WIDTH - MARGIN - 40, yPos + 25);
  yPos += 40;

  // Report Title
  doc.setFontSize(24);
  doc.setTextColor(33, 33, 33);
  doc.text('Property Analysis Report', MARGIN, yPos);
  yPos += 10;

  // Property address
  if (selectedSections["Property Details"]?.includes("address")) {
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99);
    doc.text(data.propertyDetails.address, MARGIN, yPos);
    yPos += 15;
  }

  // Property Details Section
  if (selectedSections["Property Details"]?.some(id => ["bedrooms", "bathrooms", "floorArea", "parkingSpaces"].includes(id))) {
    doc.setFillColor(249, 250, 251);
    doc.rect(MARGIN, yPos, CONTENT_WIDTH, 40, 'F');
    yPos += 5;

    const detailsData = [];
    if (selectedSections["Property Details"].includes("bedrooms")) {
      detailsData.push({
        label: 'Bedrooms',
        value: data.propertyDetails.bedrooms.toString()
      });
    }
    if (selectedSections["Property Details"].includes("bathrooms")) {
      detailsData.push({
        label: 'Bathrooms',
        value: data.propertyDetails.bathrooms.toString()
      });
    }
    if (selectedSections["Property Details"].includes("floorArea")) {
      detailsData.push({
        label: 'Floor Area',
        value: `${data.propertyDetails.floorArea}m²`
      });
    }
    if (selectedSections["Property Details"].includes("parkingSpaces")) {
      detailsData.push({
        label: 'Parking',
        value: data.propertyDetails.parkingSpaces.toString()
      });
    }

    const detailsColWidth = CONTENT_WIDTH / detailsData.length;
    detailsData.forEach((detail, index) => {
      const xPos = MARGIN + (detailsColWidth * index);
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(detail.label, xPos, yPos);
      doc.setFontSize(12);
      doc.setTextColor(31, 41, 55);
      doc.text(detail.value, xPos, yPos + 7);
    });
    yPos += 20;
  }

  // Financial Metrics Section
  if (selectedSections["Financing Details"]?.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text('Financial Details', MARGIN, yPos);
    yPos += 10;

    const financialData = [];
    if (selectedSections["Financing Details"].includes("purchasePrice")) {
      financialData.push(['Purchase Price', formatCurrency(data.propertyDetails.purchasePrice)]);
    }
    if (selectedSections["Financing Details"].includes("deposit")) {
      financialData.push([
        'Deposit', 
        `${formatCurrency(data.financialMetrics.depositAmount)} (${data.financialMetrics.depositPercentage}%)`
      ]);
    }
    if (selectedSections["Financing Details"].includes("monthlyBond")) {
      financialData.push(['Monthly Bond', formatCurrency(data.financialMetrics.monthlyBondRepayment)]);
    }

    if (financialData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: financialData,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Revenue Performance Section
  if (selectedSections["Revenue Performance"]?.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text('Rental Performance', MARGIN, yPos);
    yPos += 10;

    const performanceData = [];
    if (selectedSections["Revenue Performance"].includes("shortTerm")) {
      performanceData.push(
        ['Short-Term Annual Revenue', formatCurrency(data.performance.shortTermAnnualRevenue)],
        ['Short-Term Nightly Rate', formatCurrency(data.performance.shortTermNightlyRate)],
        ['Annual Occupancy', `${data.performance.annualOccupancy}%`],
        ['Short-Term Gross Yield', `${data.performance.shortTermGrossYield.toFixed(1)}%`]
      );
    }
    if (selectedSections["Revenue Performance"].includes("longTerm")) {
      performanceData.push(
        ['Long-Term Annual Revenue', formatCurrency(data.performance.longTermAnnualRevenue)],
        ['Long-Term Gross Yield', `${data.performance.longTermGrossYield.toFixed(1)}%`]
      );
    }

    if (performanceData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: performanceData,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    // Add line above footer
    doc.line(MARGIN, PAGE_HEIGHT - 20, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 20);
    // Add footer text
    doc.text(`Generated by Proply on ${new Date().toLocaleDateString()}`, MARGIN, PAGE_HEIGHT - 15);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_WIDTH - MARGIN - 20, PAGE_HEIGHT - 15);
  }

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(150);
  const disclaimer = 
    'This report is generated based on provided data and market assumptions. ' +
    'While we strive for accuracy, all projections are estimates and actual ' +
    'results may vary. Professional advice should be sought before making investment decisions.';

  const splitDisclaimer = doc.splitTextToSize(disclaimer, CONTENT_WIDTH);
  doc.text(splitDisclaimer, MARGIN, PAGE_HEIGHT - 25);

  return doc;
}