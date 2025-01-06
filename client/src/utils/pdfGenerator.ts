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
const PROPLY_LOGO_ASPECT_RATIO = 3.5;

// Constants for graph
const GRAPH_HEIGHT = 80;
const GRAPH_PADDING = 10;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Function to draw the rental performance graph
function drawRentalPerformanceGraph(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  monthlyData: {
    longTerm: number;
    low: number[];
    medium: number[];
    high: number[];
  }
) {
  // Calculate scales
  const values = [
    monthlyData.longTerm,
    ...monthlyData.low,
    ...monthlyData.medium,
    ...monthlyData.high
  ];
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue;
  const padding = valueRange * 0.1;

  const yScale = (height - 20) / (valueRange + 2 * padding);
  const xStep = (width - 20) / 11;

  // Draw grid and axes
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);

  // Draw horizontal grid lines
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const yPos = y + height - 10 - (i * (height - 20) / gridLines);
    doc.line(x + 10, yPos, x + width - 10, yPos);

    // Add value labels
    const value = minValue - padding + (i * (valueRange + 2 * padding) / gridLines);
    doc.setFontSize(6);
    doc.text(formatCurrency(value), x - 5, yPos);
  }

  // Draw vertical grid lines and month labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  months.forEach((month, i) => {
    const xPos = x + 10 + i * xStep;
    doc.line(xPos, y + 10, xPos, y + height - 10);
    doc.setFontSize(6);
    doc.text(month, xPos - 3, y + height + 5);
  });

  // Draw the lines
  const drawLine = (data: number[], color: string, isDashed = false) => {
    doc.setDrawColor(color);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern(isDashed ? [2] : [], 0);

    for (let i = 0; i < data.length - 1; i++) {
      const x1 = x + 10 + i * xStep;
      const x2 = x + 10 + (i + 1) * xStep;
      const y1 = y + height - 10 - ((data[i] - minValue + padding) * yScale);
      const y2 = y + height - 10 - ((data[i + 1] - minValue + padding) * yScale);
      doc.line(x1, y1, x2, y2);
    }
  };

  // Draw lines
  drawLine(Array(12).fill(monthlyData.longTerm), '#FFE66D', true);
  drawLine(monthlyData.low, '#FF6B6B');
  drawLine(monthlyData.medium, '#4ECDC4');
  drawLine(monthlyData.high, '#45B7D1');

  // Add legend
  const legendY = y + height + 15;
  const legendSpacing = 35;
  doc.setFontSize(8);

  // Long-term
  doc.setLineDashPattern([2], 0);
  doc.setDrawColor('#FFE66D');
  doc.line(x + 5, legendY, x + 15, legendY);
  doc.setTextColor('#B8860B');
  doc.text('Long Term', x + 20, legendY);

  // Low
  doc.setLineDashPattern([], 0);
  doc.setDrawColor('#FF6B6B');
  doc.line(x + 5 + legendSpacing, legendY, x + 15 + legendSpacing, legendY);
  doc.setTextColor('#FF6B6B');
  doc.text('Low', x + 20 + legendSpacing, legendY);

  // Medium
  doc.setDrawColor('#4ECDC4');
  doc.line(x + 5 + legendSpacing * 2, legendY, x + 15 + legendSpacing * 2, legendY);
  doc.setTextColor('#4ECDC4');
  doc.text('Medium', x + 20 + legendSpacing * 2, legendY);

  // High
  doc.setDrawColor('#45B7D1');
  doc.line(x + 5 + legendSpacing * 3, legendY, x + 15 + legendSpacing * 3, legendY);
  doc.setTextColor('#45B7D1');
  doc.text('High', x + 20 + legendSpacing * 3, legendY);

  // Reset styles
  doc.setLineDashPattern([], 0);
  doc.setTextColor(0);
}

function createMonthlyRevenueTable(
  doc: jsPDF,
  data: {
    shortTermNightly: number;
    longTermMonthly: number;
    managementFee: number;
  }
) {
  const calculateMonthlyRevenue = (scenario: 'low' | 'medium' | 'high', monthIndex: number) => {
    const occupancyRates = {
      low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 70],
      medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 85],
      high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
    };

    const seasonalRates = {
      peak: 1.2,
      shoulder: 1.1,
      low: 0.9
    };

    let rateMultiplier = 1;
    if ([11, 0, 1].includes(monthIndex)) {
      rateMultiplier = seasonalRates.peak;
    } else if ([2, 3, 9, 10].includes(monthIndex)) {
      rateMultiplier = seasonalRates.shoulder;
    } else {
      rateMultiplier = seasonalRates.low;
    }

    const nightlyRate = data.shortTermNightly * rateMultiplier;
    const daysInMonth = new Date(2024, monthIndex + 1, 0).getDate();
    const occupancy = occupancyRates[scenario][monthIndex] / 100;
    const grossRevenue = nightlyRate * daysInMonth * occupancy;
    const platformFee = data.managementFee > 0 ? 0.15 : 0.03;
    const totalFees = platformFee + data.managementFee;
    return grossRevenue * (1 - totalFees);
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const tableData = [
    ['Nightly Rate', ...months.map((_, i) => {
      const seasonalRate = data.shortTermNightly * (
        [11, 0, 1].includes(i) ? 1.2 :
        [2, 3, 9, 10].includes(i) ? 1.1 : 0.9
      );
      return formatCurrency(seasonalRate);
    }), '', formatCurrency(data.shortTermNightly)],
    ['Occupancy Low', ...months.map((_, i) => [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 70][i] + '%'), '', '60%'],
    ['Occupancy Medium', ...months.map((_, i) => [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 85][i] + '%'), '', '71%'],
    ['Occupancy High', ...months.map((_, i) => [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95][i] + '%'), '', '82%'],
    ['Revenue Low', ...months.map((_, i) => formatCurrency(calculateMonthlyRevenue('low', i))),
      formatCurrency(months.reduce((sum, _, i) => sum + calculateMonthlyRevenue('low', i), 0)),
      formatCurrency(months.reduce((sum, _, i) => sum + calculateMonthlyRevenue('low', i), 0) / 12)
    ],
    ['Revenue Medium', ...months.map((_, i) => formatCurrency(calculateMonthlyRevenue('medium', i))),
      formatCurrency(months.reduce((sum, _, i) => sum + calculateMonthlyRevenue('medium', i), 0)),
      formatCurrency(months.reduce((sum, _, i) => sum + calculateMonthlyRevenue('medium', i), 0) / 12)
    ],
    ['Revenue High', ...months.map((_, i) => formatCurrency(calculateMonthlyRevenue('high', i))),
      formatCurrency(months.reduce((sum, _, i) => sum + calculateMonthlyRevenue('high', i), 0)),
      formatCurrency(months.reduce((sum, _, i) => sum + calculateMonthlyRevenue('high', i), 0) / 12)
    ],
    ['Long Term', ...Array(12).fill(formatCurrency(data.longTermMonthly)),
      formatCurrency(data.longTermMonthly * 12),
      formatCurrency(data.longTermMonthly)
    ]
  ];

  autoTable(doc, {
    head: [['Metric', ...months, 'Total', 'Monthly Avg']],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 6, cellPadding: 1 },
    headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55], fontSize: 6 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      13: { fontStyle: 'bold' },
      14: { fontStyle: 'bold' }
    },
    didParseCell: function (data) {
      if (data.row.index === 4) { // Revenue Low
        data.cell.styles.textColor = '#FF6B6B';
      } else if (data.row.index === 5) { // Revenue Medium
        data.cell.styles.textColor = '#4ECDC4';
      } else if (data.row.index === 6) { // Revenue High
        data.cell.styles.textColor = '#45B7D1';
      } else if (data.row.index === 7) { // Long Term
        data.cell.styles.textColor = '#B8860B';
      }
    }
  });
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

  // Function to check if we need a new page
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      yPos = MARGIN;
      return true;
    }
    return false;
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

        // Add area average rate and difference if available
        if (data.propertyDetails.areaAverageRate && selectedSections["Property Details"].includes("areaAverageRate")) {
          details.push(['Area Average Rate/m²', formatCurrency(data.propertyDetails.areaAverageRate)]);
        }
        if (data.propertyDetails.rateDifference && selectedSections["Property Details"].includes("rateDifference")) {
          const difference = data.propertyDetails.rateDifference;
          const differenceText = difference > 0 ?
            `${formatCurrency(Math.abs(difference))} above average` :
            `${formatCurrency(Math.abs(difference))} below average`;
          details.push(['Rate/m² Difference', differenceText]);
        }
      }
      if (selectedSections["Property Details"].includes("bondRegistrationCosts") && data.propertyDetails.bondRegistrationCosts) {
        details.push(['Bond Registration Costs', formatCurrency(data.propertyDetails.bondRegistrationCosts)]);
      }
      if (selectedSections["Property Details"].includes("transferCosts") && data.propertyDetails.transferCosts) {
        details.push(['Transfer Costs', formatCurrency(data.propertyDetails.transferCosts)]);
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
        checkNewPage(expenses.length * 15); //Check for new page

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

    // Investment Metrics Section
    if (selectedSections["Investment Metrics"]?.length > 0) {
      checkNewPage(100); //Check for new page

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


    // Add Rental Performance Section after Investment Metrics
    checkNewPage(GRAPH_HEIGHT + 150); // Height for graph + table

    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('Rental Performance Analysis', MARGIN, yPos);
    yPos += 10;

    // Calculate monthly revenues for the graph
    const monthlyLow = Array(12).fill(0).map((_, i) => {
      const occupancyRates = [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 70];
      const daysInMonth = new Date(2024, i + 1, 0).getDate();
      return data.performance.shortTermNightlyRate * daysInMonth * (occupancyRates[i] / 100) * (1 - (data.expenses.managementFee || 0 > 0 ? 0.15 : 0.03));
    });

    const monthlyMedium = Array(12).fill(0).map((_, i) => {
      const occupancyRates = [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 85];
      const daysInMonth = new Date(2024, i + 1, 0).getDate();
      return data.performance.shortTermNightlyRate * daysInMonth * (occupancyRates[i] / 100) * (1 - (data.expenses.managementFee || 0 > 0 ? 0.15 : 0.03));
    });

    const monthlyHigh = Array(12).fill(0).map((_, i) => {
      const occupancyRates = [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95];
      const daysInMonth = new Date(2024, i + 1, 0).getDate();
      return data.performance.shortTermNightlyRate * daysInMonth * (occupancyRates[i] / 100) * (1 - (data.expenses.managementFee || 0 > 0 ? 0.15 : 0.03));
    });

    // Draw the performance graph
    drawRentalPerformanceGraph(
      doc,
      MARGIN,
      yPos,
      CONTENT_WIDTH,
      GRAPH_HEIGHT,
      {
        longTerm: data.performance.longTermAnnualRevenue / 12,
        low: monthlyLow,
        medium: monthlyMedium,
        high: monthlyHigh
      }
    );
    yPos += GRAPH_HEIGHT + 30;

    // Add the monthly revenue table
    if (checkNewPage(100)) {
      yPos += 10;
    }
    doc.setFontSize(14);
    doc.text('Monthly Revenue Breakdown', MARGIN, yPos);
    yPos += 10;

    createMonthlyRevenueTable(doc, {
      shortTermNightly: data.performance.shortTermNightlyRate,
      longTermMonthly: data.performance.longTermAnnualRevenue / 12,
      managementFee: data.expenses.managementFee || 0
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

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
    areaAverageRate?: number;
    rateDifference?: number;
    bondRegistrationCosts?: number;
    transferCosts?: number;
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