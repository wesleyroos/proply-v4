import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from "@/lib/utils";

// Constants for PDF layout
const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN);

// Constants for logo sizing
const LOGO_MAX_WIDTH = 40;
const LOGO_MAX_HEIGHT = 20;
const PROPLY_LOGO_ASPECT_RATIO = 3.5; // Width:Height ratio of the logo

interface PropertyData {
  title: string;
  propertyUrl?: string;
  propertyDetails: {
    address: string;
    bedrooms: string | number;
    bathrooms: string | number;
    floorArea: number;
    parkingSpaces: number;
    purchasePrice: number;
    ratePerSquareMeter: number;
    description?: string;
  };
  financialMetrics: {
    depositAmount: number;
    depositPercentage: number;
    interestRate: number;
    loanTerm: number;
    monthlyBondRepayment: number;
  };
  expenses: {
    monthlyLevies: number;
    monthlyRatesTaxes: number;
    otherMonthlyExpenses: number;
    maintenancePercent: number;
    managementFee?: number;
  };
  performance: {
    shortTermNightlyRate: number;
    annualOccupancy: number;
    shortTermAnnualRevenue: number;
    longTermAnnualRevenue: number;
    shortTermGrossYield: number;
    longTermGrossYield: number;
  };
  revenueProjections: {
    shortTerm: {
      [key: string]: number;
    };
    longTerm: {
      [key: string]: number;
    };
  };
  operatingExpenses: {
    [key: string]: number;
  };
  investmentMetrics: {
    shortTerm: Array<{
      grossYield: number;
      netYield: number;
      returnOnEquity: number;
      annualReturn: number;
      capRate: number;
      cashOnCashReturn: number;
      irr: number;
      netWorthChange: number;
    }>;
    longTerm: Array<{
      grossYield: number;
      netYield: number;
      returnOnEquity: number;
      annualReturn: number;
      capRate: number;
      cashOnCashReturn: number;
      irr: number;
      netWorthChange: number;
    }>;
  };
}

export async function generatePropertyReport(
  data: PropertyData,
  selectedSections: Record<string, string[]>,
  companyLogo?: string | null
): Promise<jsPDF> {
  const doc = new jsPDF();
  let yPos = MARGIN;

  // Function to load and add image with proper error handling
  const addImage = async (src: string, x: number, y: number, width: number, height: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const aspectRatio = img.width / img.height;
          let finalWidth = width;
          let finalHeight = height;

          if (width / height > aspectRatio) {
            finalWidth = height * aspectRatio;
          } else {
            finalHeight = width / aspectRatio;
          }

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');
          ctx.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL('image/png');

          doc.addImage(base64, 'PNG', x, y, finalWidth, finalHeight);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  try {
    // Add company logo if provided and selected
    if (selectedSections["Company Branding"]?.includes("companyLogo") && companyLogo) {
      await addImage(companyLogo, MARGIN, yPos, LOGO_MAX_WIDTH, LOGO_MAX_HEIGHT);
    }

    // Add Proply branding (top-right)
    const proplyLogoWidth = LOGO_MAX_WIDTH;
    const proplyLogoHeight = proplyLogoWidth / PROPLY_LOGO_ASPECT_RATIO;
    await addImage(
      '/proply-logo-1.png',
      PAGE_WIDTH - MARGIN - proplyLogoWidth,
      yPos,
      proplyLogoWidth,
      proplyLogoHeight
    );

    doc.setFontSize(10);
    doc.setTextColor(33, 33, 33);
    doc.text("Powered by Proply", PAGE_WIDTH - MARGIN - 40, yPos + 25);
    yPos += 40;

    // Report Title
    doc.setFontSize(24);
    doc.setTextColor(33, 33, 33);
    doc.text('Property Analysis Report', MARGIN, yPos);
    yPos += 10;

    // Property Details Section
    if (selectedSections["Property Details"]?.length > 0) {
      const details = [];

      if (selectedSections["Property Details"].includes("address")) {
        details.push(['Address', data.propertyDetails.address]);
      }
      if (selectedSections["Property Details"].includes("bedrooms")) {
        details.push(['Bedrooms', data.propertyDetails.bedrooms.toString()]);
      }
      if (selectedSections["Property Details"].includes("bathrooms")) {
        details.push(['Bathrooms', data.propertyDetails.bathrooms.toString()]);
      }
      if (selectedSections["Property Details"].includes("floorArea")) {
        details.push(['Floor Area', `${data.propertyDetails.floorArea} m²`]);
      }
      if (selectedSections["Property Details"].includes("parkingSpaces")) {
        details.push(['Parking Spaces', data.propertyDetails.parkingSpaces.toString()]);
      }
      if (selectedSections["Property Details"].includes("purchasePrice")) {
        details.push(['Purchase Price', formatCurrency(data.propertyDetails.purchasePrice)]);
      }
      if (selectedSections["Property Details"].includes("ratePerM2")) {
        details.push(['Rate per m²', formatCurrency(data.propertyDetails.ratePerSquareMeter)]);
      }
      if (selectedSections["Property Details"].includes("description") && data.propertyDetails.description) {
        details.push(['Description', data.propertyDetails.description]);
      }

      if (details.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text('Property Details', MARGIN, yPos);
        yPos += 5;

        autoTable(doc, {
          startY: yPos,
          head: [['Detail', 'Value']],
          body: details,
          theme: 'striped',
          styles: { fontSize: 10, cellPadding: 5 },
          headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
    }

    // Financial Details Section
    if (selectedSections["Financing Details"]?.length > 0) {
      const financials = [];

      if (selectedSections["Financing Details"].includes("deposit")) {
        financials.push([
          'Deposit Amount',
          formatCurrency(data.financialMetrics.depositAmount),
          `${data.financialMetrics.depositPercentage}%`
        ]);
      }
      if (selectedSections["Financing Details"].includes("interestRate")) {
        financials.push(['Interest Rate', `${data.financialMetrics.interestRate}%`]);
      }
      if (selectedSections["Financing Details"].includes("loanTerm")) {
        financials.push(['Loan Term', `${data.financialMetrics.loanTerm} years`]);
      }
      if (selectedSections["Financing Details"].includes("monthlyBond")) {
        financials.push(['Monthly Bond Repayment', formatCurrency(data.financialMetrics.monthlyBondRepayment)]);
      }

      if (financials.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text('Financial Details', MARGIN, yPos);
        yPos += 5;

        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value', 'Additional Info'].slice(0, financials[0].length)],
          body: financials,
          theme: 'striped',
          styles: { fontSize: 10, cellPadding: 5 },
          headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
    }

    // Operating Expenses Section
    if (selectedSections["Operating Expenses"]?.length > 0) {
      const expenses = [];

      if (selectedSections["Operating Expenses"].includes("monthlyExpenses")) {
        expenses.push(['Monthly Levies', formatCurrency(data.expenses.monthlyLevies)]);
        expenses.push(['Monthly Rates & Taxes', formatCurrency(data.expenses.monthlyRatesTaxes)]);
        expenses.push(['Other Monthly Expenses', formatCurrency(data.expenses.otherMonthlyExpenses)]);
      }
      if (selectedSections["Operating Expenses"].includes("maintenance")) {
        expenses.push(['Maintenance', `${data.expenses.maintenancePercent}% of rental income`]);
      }
      if (selectedSections["Operating Expenses"].includes("managementFees") && data.expenses.managementFee) {
        expenses.push(['Management Fee', `${data.expenses.managementFee}%`]);
      }

      if (expenses.length > 0) {
        // Check if we need a new page
        if (yPos > PAGE_HEIGHT - 100) {
          doc.addPage();
          yPos = MARGIN;
        }

        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text('Operating Expenses', MARGIN, yPos);
        yPos += 5;

        autoTable(doc, {
          startY: yPos,
          head: [['Expense Type', 'Amount']],
          body: expenses,
          theme: 'striped',
          styles: { fontSize: 10, cellPadding: 5 },
          headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
    }

    // Revenue Performance Section
    if (selectedSections["Revenue Performance"]?.length > 0) {
      const performance = [];

      if (selectedSections["Revenue Performance"].includes("shortTerm")) {
        performance.push(['Short-Term Nightly Rate', formatCurrency(data.performance.shortTermNightlyRate)]);
        performance.push(['Annual Occupancy', `${data.performance.annualOccupancy}%`]);
        performance.push(['Short-Term Annual Revenue', formatCurrency(data.performance.shortTermAnnualRevenue)]);
        performance.push(['Short-Term Gross Yield', `${data.performance.shortTermGrossYield.toFixed(1)}%`]);
      }

      if (selectedSections["Revenue Performance"].includes("longTerm")) {
        performance.push(['Long-Term Annual Revenue', formatCurrency(data.performance.longTermAnnualRevenue)]);
        performance.push(['Long-Term Gross Yield', `${data.performance.longTermGrossYield.toFixed(1)}%`]);
      }

      if (performance.length > 0) {
        // Check if we need a new page
        if (yPos > PAGE_HEIGHT - 100) {
          doc.addPage();
          yPos = MARGIN;
        }

        doc.setFontSize(16);
        doc.setTextColor(31, 41, 55);
        doc.text('Revenue Performance', MARGIN, yPos);
        yPos += 5;

        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value']],
          body: performance,
          theme: 'striped',
          styles: { fontSize: 10, cellPadding: 5 },
          headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
        });
        yPos = (doc as any).lastAutoTable.finalY + 15;
      }
    }

    // Investment Metrics Section
    if (selectedSections["Investment Metrics"]?.length > 0) {
      // Add new page for investment metrics
      doc.addPage();
      yPos = MARGIN;

      doc.setFontSize(16);
      doc.setTextColor(31, 41, 55);
      doc.text('Investment Metrics', MARGIN, yPos);
      yPos += 10;

      // Short-term metrics
      if (selectedSections["Investment Metrics"].includes("yields") ||
          selectedSections["Investment Metrics"].includes("returns") ||
          selectedSections["Investment Metrics"].includes("cashflow")) {

        const shortTermMetrics = data.investmentMetrics.shortTerm[0]; // First year metrics
        const metrics = [];

        if (selectedSections["Investment Metrics"].includes("yields")) {
          metrics.push(['Gross Yield', `${shortTermMetrics.grossYield.toFixed(1)}%`]);
          metrics.push(['Net Yield', `${shortTermMetrics.netYield.toFixed(1)}%`]);
        }
        if (selectedSections["Investment Metrics"].includes("returns")) {
          metrics.push(['Return on Equity', `${shortTermMetrics.returnOnEquity.toFixed(1)}%`]);
          metrics.push(['Annual Return', `${shortTermMetrics.annualReturn.toFixed(1)}%`]);
          metrics.push(['Cap Rate', `${shortTermMetrics.capRate.toFixed(1)}%`]);
        }
        if (selectedSections["Investment Metrics"].includes("cashflow")) {
          metrics.push(['Cash on Cash Return', `${shortTermMetrics.cashOnCashReturn.toFixed(1)}%`]);
          metrics.push(['IRR', `${shortTermMetrics.irr.toFixed(1)}%`]);
          metrics.push(['Net Worth Change', formatCurrency(shortTermMetrics.netWorthChange)]);
        }

        doc.setFontSize(14);
        doc.text('Short-Term Investment Metrics (Year 1)', MARGIN, yPos);
        yPos += 5;

        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value']],
          body: metrics,
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
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report: ' + (error instanceof Error ? error.message : String(error)));
  }
}