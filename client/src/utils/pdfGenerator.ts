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
    description?: string;
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
    bondRegistration?: number;
    transferCosts?: number;
    annualAppreciation?: number;
    loanAmount?: number;
  };
  performance: {
    shortTermNightlyRate?: number;
    annualOccupancy?: number;
    shortTermAnnualRevenue?: number;
    longTermAnnualRevenue?: number;
    shortTermGrossYield?: number;
    longTermGrossYield?: number;
  };
  investmentMetrics?: {
    [key: string]: {
      grossYield?: number;
      netYield?: number;
      returnOnEquity?: number;
      annualReturn?: number;
      capRate?: number;
      cashOnCashReturn?: number;
      irr?: number;
      netWorthChange?: number;
    };
  };
  netOperatingIncome?: {
    [key: string]: {
      value: number;
      annualCashflow: number;
      cumulativeRentalIncome: number;
      netWorthChange: number;
    };
  };
}

const safeNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return 'N/A';
  return value.toFixed(2);
};

export function generatePropertyReport(
  data: PropertyData, 
  companyLogo?: string,
  selectedSections: { [key: string]: boolean } = {}
): jsPDF {
  // Validate required data
  if (!data?.propertyDetails || !data?.financialMetrics || !data?.performance) {
    throw new Error("Required property data is missing");
  }

  const doc = new jsPDF();
  let yPos = MARGIN;

  // Add header
  doc.setFontSize(24);
  doc.setTextColor(33, 33, 33);
  doc.text('Property Analysis Report', MARGIN, yPos);
  yPos += 10;

  // Add property address
  doc.setFontSize(12);
  doc.setTextColor(75, 85, 99);
  doc.text(data.propertyDetails.address, MARGIN, yPos);
  yPos += 7;

  // Add generation date
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, MARGIN, yPos);
  yPos += 15;

  // Property Details Section
  if (selectedSections.propertyDetails) {
    doc.setFillColor(249, 250, 251);
    doc.rect(MARGIN, yPos, CONTENT_WIDTH, 40, 'F');
    yPos += 5;

    const detailsData = [
      {
        label: 'Bedrooms',
        value: data.propertyDetails.bedrooms.toString()
      },
      {
        label: 'Bathrooms',
        value: data.propertyDetails.bathrooms.toString()
      },
      {
        label: 'Floor Area',
        value: `${data.propertyDetails.floorArea}m²`
      },
      {
        label: 'Parking',
        value: data.propertyDetails.parkingSpaces.toString()
      }
    ];

    const detailsColWidth = CONTENT_WIDTH / 4;
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

  // Key Financial Metrics
  if (selectedSections.dealStructure) {
    const metrics = [
      {
        label: 'Purchase Price',
        value: formatCurrency(data.propertyDetails.purchasePrice),
        subtext: `${formatCurrency(data.propertyDetails.ratePerSquareMeter)}/m²`
      },
      {
        label: 'Required Capital',
        value: formatCurrency(data.financialMetrics.depositAmount),
        subtext: `${data.financialMetrics.depositPercentage}% deposit`
      },
      {
        label: 'Monthly Bond',
        value: formatCurrency(data.financialMetrics.monthlyBondRepayment),
        subtext: `${data.financialMetrics.interestRate}% interest`
      }
    ];

    const colWidth = CONTENT_WIDTH / 3;
    metrics.forEach((metric, index) => {
      const xPos = MARGIN + (colWidth * index);
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(metric.label, xPos, yPos);

      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text(metric.value, xPos, yPos + 7);

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(metric.subtext, xPos, yPos + 14);
    });
    yPos += 45;
  }

  // Investment Metrics Section
  if (selectedSections.investmentMetrics && data.investmentMetrics?.year20) {
    const metrics = data.investmentMetrics.year20;

    // Only include metrics that are defined
    const validMetrics = [
      metrics.irr !== undefined ? ['IRR', `${safeNumber(metrics.irr)}%`] : null,
      metrics.cashOnCashReturn !== undefined ? ['Cash on Cash Return', `${safeNumber(metrics.cashOnCashReturn)}%`] : null,
      metrics.returnOnEquity !== undefined ? ['Return on Equity', `${safeNumber(metrics.returnOnEquity)}%`] : null,
      metrics.capRate !== undefined ? ['Cap Rate', `${safeNumber(metrics.capRate)}%`] : null,
    ].filter((row): row is [string, string] => row !== null);

    if (validMetrics.length > 0) {
      const investmentMetrics = [
        ['Metric', 'Value'],
        ...validMetrics
      ];

      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('20-Year Investment Metrics', MARGIN, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [investmentMetrics[0]],
        body: investmentMetrics.slice(1),
        theme: 'striped',
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [243, 244, 246],
          textColor: [31, 41, 55],
          fontStyle: 'bold',
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Rental Performance Section
  if (selectedSections.rentalPerformance) {
    const rentalPerformance = [
      ['', 'Short-Term', 'Long-Term'],
      ['Annual Revenue', 
       formatCurrency(data.performance.shortTermAnnualRevenue ?? 0),
       formatCurrency(data.performance.longTermAnnualRevenue ?? 0)
      ],
      ['Gross Yield', 
       `${safeNumber(data.performance.shortTermGrossYield)}%`,
       `${safeNumber(data.performance.longTermGrossYield)}%`
      ],
      ['Occupancy',
       `${safeNumber(data.performance.annualOccupancy)}%`,
       'N/A'
      ],
      ['Rate',
       formatCurrency(data.performance.shortTermNightlyRate ?? 0) + '/night',
       formatCurrency((data.performance.longTermAnnualRevenue ?? 0) / 12) + '/month'
      ]
    ];

    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text('Rental Performance', MARGIN, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [rentalPerformance[0]],
      body: rentalPerformance.slice(1),
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5,
        lineColor: [233, 236, 239],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [31, 41, 55],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 65 },
        2: { cellWidth: 65 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }


  // Disclaimer
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('DISCLAIMER', MARGIN, yPos);
  yPos += 5;

  const disclaimer = 
    'This report is generated based on provided data and market assumptions. ' +
    'While we strive for accuracy, all projections are estimates and actual ' +
    'results may vary. Property investment carries inherent risks and professional ' +
    'advice should be sought before making investment decisions.';

  doc.setFontSize(8);
  const splitDisclaimer = doc.splitTextToSize(disclaimer, CONTENT_WIDTH);
  doc.text(splitDisclaimer, MARGIN, yPos);

  // Footer
  doc.setFontSize(8);
  doc.text(
    `© ${new Date().getFullYear()} Property Analysis Report`,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 10,
    { align: 'center' }
  );

  return doc;
}