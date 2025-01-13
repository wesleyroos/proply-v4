import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PropertyData, ReportSelections } from '../types/propertyReport';
import { formatCurrency, formatPercentage } from '../utils/formatting';
import { getSeasonalNightlyRate, getFeeAdjustedRate, calculateMonthlyRevenue, OCCUPANCY_RATES, SEASONALITY_FACTORS } from '@/utils/rentalPerformance';

function calculateMonthlyRevenue(scenario: 'low' | 'medium' | 'high', monthIndex: number, baseRate: number, withPlatformFee: boolean, managementFee: number): number {
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

  const adjustedRate = baseRate * rateMultiplier;
  const platformFee = withPlatformFee ? 0.15 : 0.03;
  const totalFeePercentage = (platformFee + (managementFee / 100));
  const feeAdjustedRate = adjustedRate * (1 - totalFeePercentage);
  const daysInMonth = 30;
  const occupancyRate = occupancyRates[scenario][monthIndex] / 100;

  return Math.round(feeAdjustedRate * daysInMonth * occupancyRate);
}

export async function generatePDF(
  data: PropertyData,
  selections: ReportSelections,
  companyLogo?: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let yPosition = 15;

  // Add company logo if available
  if (companyLogo) {
    try {
      const logoWidth = 40;
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.height / img.width;
          const logoHeight = logoWidth * aspectRatio;
          pdf.addImage(companyLogo, "PNG", 20, yPosition, logoWidth, logoHeight);
          yPosition += logoHeight + 10;
          resolve();
        };
        img.onerror = () => {
          console.error('Error loading company logo');
          resolve();
        };
        img.crossOrigin = "Anonymous";
        img.src = companyLogo;
      });
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
        pdf.addImage("/proply-logo-1.png", "PNG", pdf.internal.pageSize.getWidth() - proplyLogoWidth - 20, 15, proplyLogoWidth, proplyLogoHeight);
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text("Powered by Proply", pdf.internal.pageSize.getWidth() - proplyLogoWidth - 20, 15 + proplyLogoHeight + 5);
        resolve();
      };
      proplyLogo.src = "/proply-logo-1.png";
    });
  } catch (error) {
    console.error('Error loading Proply logo:', error);
  }

  yPosition = Math.max(yPosition, 60); // Ensure minimum spacing from top

  // Add title
  pdf.setFontSize(20);
  pdf.setTextColor(0);
  pdf.text('Property Analysis Report', 20, yPosition);
  yPosition += 15;

  // Property Overview
  pdf.setFontSize(16);
  pdf.text('Property Overview', 20, yPosition);
  yPosition += 10;

  const propertyDetails = [
    ['Address', data.propertyDetails.address],
    ['Purchase Price', formatCurrency(data.propertyDetails.purchasePrice)],
    ['Floor Area', `${data.propertyDetails.floorArea}m²`],
    ['Current Property Rate/m²', formatCurrency(data.propertyDetails.purchasePrice / data.propertyDetails.floorArea)],
    ['Area Rate/m²', formatCurrency(data.propertyDetails.ratePerSquareMeter)],
    ['Rate/m² Difference', formatCurrency(data.propertyDetails.ratePerSquareMeter - (data.propertyDetails.purchasePrice / data.propertyDetails.floorArea))],
    ['Bedrooms', data.propertyDetails.bedrooms.toString()],
    ['Bathrooms', data.propertyDetails.bathrooms.toString()],
    ['Parking Spaces', data.propertyDetails.parkingSpaces.toString()]
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [['Feature', 'Details']],
    body: propertyDetails,
    margin: { left: 20 },
    styles: {
      minCellHeight: 8, // Updated to minCellHeight
      fontSize: 9
    },
    headStyles: {
      fillColor: [30, 144, 255], // Proply blue
      textColor: 255
    }
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Financial Metrics
  pdf.setFontSize(16);
  pdf.text('Financial Overview', 20, yPosition);
  yPosition += 10;

  const financialMetrics = [
    ['Deposit Amount', formatCurrency(data.financialMetrics.depositAmount)],
    ['Deposit Percentage', `${data.financialMetrics.depositPercentage}%`],
    ['Interest Rate', `${data.financialMetrics.interestRate}%`],
    ['Monthly Bond Repayment', formatCurrency(data.financialMetrics.monthlyBondRepayment)],
    ['Bond Registration', formatCurrency(data.financialMetrics.bondRegistration)],
    ['Transfer Costs', formatCurrency(data.financialMetrics.transferCosts)]
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: financialMetrics,
    margin: { left: 20 },
    styles: {
      minCellHeight: 8, // Updated to minCellHeight
      fontSize: 9
    },
    headStyles: {
      fillColor: [30, 144, 255], // Proply blue
      textColor: 255
    }
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Rental Performance
  pdf.setFontSize(16);
  pdf.text('Rental Performance', 20, yPosition);
  yPosition += 10;

  // Short Term Performance
  pdf.setFontSize(14);
  pdf.text('Short Term Rental', 20, yPosition);
  yPosition += 10;

  const shortTermPerformance = [
    ['Nightly Rate', formatCurrency(data.performance.shortTermNightlyRate)],
    ['Annual Occupancy', `${data.performance.annualOccupancy}%`],
    ['Annual Revenue', formatCurrency(data.performance.shortTermAnnualRevenue)],
    ['Gross Yield', `${formatPercentage(data.performance.shortTermGrossYield)}%`]
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: shortTermPerformance,
    margin: { left: 20 },
    styles: {
      minCellHeight: 8, // Updated to minCellHeight
      fontSize: 9
    },
    headStyles: {
      fillColor: [30, 144, 255],
      textColor: 255
    }
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Long Term Performance
  pdf.setFontSize(14);
  pdf.text('Long Term Rental', 20, yPosition);
  yPosition += 10;

  const longTermPerformance = [
    ['Monthly Revenue', formatCurrency(data.performance.longTermAnnualRevenue / 12)],
    ['Annual Revenue', formatCurrency(data.performance.longTermAnnualRevenue)],
    ['Gross Yield', `${formatPercentage(data.performance.longTermGrossYield)}%`]
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: longTermPerformance,
    margin: { left: 20 },
    styles: {
      minCellHeight: 8, // Updated to minCellHeight
      fontSize: 9
    },
    headStyles: {
      fillColor: [30, 144, 255],
      textColor: 255
    }
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Monthly Performance Table
  pdf.setFontSize(14);
  pdf.text('Monthly Revenue Performance', 20, yPosition);
  yPosition += 10;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyPerformance = months.map((month, index) => {
    const lowOcc = OCCUPANCY_RATES.low[index];
    const medOcc = OCCUPANCY_RATES.medium[index];
    const highOcc = OCCUPANCY_RATES.high[index];
    const monthlyLongTerm = data.performance.longTermAnnualRevenue / 12;

    // Get seasonal nightly rate
    const baseRate = data.performance.shortTermNightlyRate;
    const seasonalRate = baseRate * SEASONALITY_FACTORS[index];

    // Calculate platform fee amount (15% if managed, 3% if not)
    const platformFeeRate = data.expenses.managementFee > 0 ? 0.15 : 0.03;
    const platformFeeAmount = seasonalRate * platformFeeRate;
    const feeAdjustedRate = seasonalRate * (1 - platformFeeRate);

    // Calculate monthly revenue for each occupancy scenario
    const daysInMonth = 30; // Using 30 days for consistency
    const lowRevenue = feeAdjustedRate * daysInMonth * (lowOcc / 100);
    const medRevenue = feeAdjustedRate * daysInMonth * (medOcc / 100);
    const highRevenue = feeAdjustedRate * daysInMonth * (highOcc / 100);

    return [
      month,
      formatCurrency(seasonalRate),
      formatCurrency(platformFeeAmount),
      formatCurrency(feeAdjustedRate),
      `${lowOcc}%`,
      formatCurrency(lowRevenue),
      `${medOcc}%`, 
      formatCurrency(medRevenue),
      `${highOcc}%`,
      formatCurrency(highRevenue),
      formatCurrency(monthlyLongTerm)
    ];
  });

  // Draw revenue line chart
  const chartWidth = pdf.internal.pageSize.getWidth() - 40;
  const chartHeight = 80;
  const chartMargin = { top: 10, right: 10, bottom: 20, left: 40 };
  
  // Calculate max value for Y axis scale
  const allRevenues = monthlyPerformance.slice(0, 12).flatMap(row => [
    parseFloat(row[5].replace(/[^0-9.-]+/g, '')), 
    parseFloat(row[7].replace(/[^0-9.-]+/g, '')),
    parseFloat(row[9].replace(/[^0-9.-]+/g, '')),
    parseFloat(row[10].replace(/[^0-9.-]+/g, ''))
  ]);
  const maxRevenue = Math.max(...allRevenues);
  const yScale = (chartHeight - chartMargin.top - chartMargin.bottom) / maxRevenue;
  
  // Draw axes
  pdf.setDrawColor(200);
  pdf.setLineWidth(0.1);
  pdf.line(20 + chartMargin.left, yPosition, 20 + chartMargin.left, yPosition + chartHeight - chartMargin.bottom); // Y axis
  pdf.line(20 + chartMargin.left, yPosition + chartHeight - chartMargin.bottom, 20 + chartWidth, yPosition + chartHeight - chartMargin.bottom); // X axis

  // Draw lines
  const drawLine = (data: number[], color: number[]) => {
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.5);
    let started = false;
    const xStep = (chartWidth - chartMargin.left - chartMargin.right) / 11;
    
    for (let i = 0; i < 12; i++) {
      const x = 20 + chartMargin.left + (i * xStep);
      const y = yPosition + chartHeight - chartMargin.bottom - (data[i] * yScale);
      
      if (!started) {
        pdf.moveTo(x, y);
        started = true;
      } else {
        pdf.lineTo(x, y);
      }
    }
    pdf.stroke();
  };

  // Draw revenue lines
  const getLowRevenues = monthlyPerformance.slice(0, 12).map(row => parseFloat(row[5].replace(/[^0-9.-]+/g, '')));
  const getMedRevenues = monthlyPerformance.slice(0, 12).map(row => parseFloat(row[7].replace(/[^0-9.-]+/g, '')));
  const getHighRevenues = monthlyPerformance.slice(0, 12).map(row => parseFloat(row[9].replace(/[^0-9.-]+/g, '')));
  const getLongTermRevenues = monthlyPerformance.slice(0, 12).map(row => parseFloat(row[10].replace(/[^0-9.-]+/g, '')));

  drawLine(getLowRevenues, [255, 107, 107]); // Red for low
  drawLine(getMedRevenues, [78, 205, 196]); // Turquoise for medium
  drawLine(getHighRevenues, [69, 183, 209]); // Blue for high
  drawLine(getLongTermRevenues, [255, 230, 109]); // Yellow for long term

  yPosition += chartHeight + 10;

  const baseRate = data.performance.shortTermNightlyRate;
  const platformFee = data.expenses.managementFee || 0;
    const lowOcc = OCCUPANCY_RATES.low[index];
    const medOcc = OCCUPANCY_RATES.medium[index];
    const highOcc = OCCUPANCY_RATES.high[index];
    const monthlyLongTerm = data.performance.longTermAnnualRevenue / 12;

    // Get seasonal nightly rate
    const baseRate = data.performance.shortTermNightlyRate;
    const seasonalRate = baseRate * SEASONALITY_FACTORS[index];

    // Calculate platform fee amount (15% if managed, 3% if not)
    const platformFeeRate = data.expenses.managementFee > 0 ? 0.15 : 0.03;
    const platformFeeAmount = seasonalRate * platformFeeRate;
    const feeAdjustedRate = seasonalRate * (1 - platformFeeRate);

    // Calculate monthly revenue for each occupancy scenario
    const daysInMonth = 30; // Using 30 days for consistency
    const lowRevenue = feeAdjustedRate * daysInMonth * (lowOcc / 100);
    const medRevenue = feeAdjustedRate * daysInMonth * (medOcc / 100);
    const highRevenue = feeAdjustedRate * daysInMonth * (highOcc / 100);

    return [
      month,
      formatCurrency(seasonalRate),
      formatCurrency(platformFeeAmount),
      formatCurrency(feeAdjustedRate),
      `${lowOcc}%`,
      formatCurrency(lowRevenue),
      `${medOcc}%`, 
      formatCurrency(medRevenue),
      `${highOcc}%`,
      formatCurrency(highRevenue),
      formatCurrency(monthlyLongTerm)
    ];
  });

  // Add total row
  monthlyPerformance.push([
    'Total',
    '-',
    '-',
    '-',
    '-',
    formatCurrency(monthlyPerformance.reduce((sum, row) => sum + parseFloat(row[5].replace(/[^0-9.-]+/g, '')), 0)),
    '-',
    formatCurrency(monthlyPerformance.reduce((sum, row) => sum + parseFloat(row[7].replace(/[^0-9.-]+/g, '')), 0)),
    '-',
    formatCurrency(monthlyPerformance.reduce((sum, row) => sum + parseFloat(row[9].replace(/[^0-9.-]+/g, '')), 0)),
    formatCurrency(data.performance.longTermAnnualRevenue)
  ]);

  // Add average row
  monthlyPerformance.push([
    'Average',
    formatCurrency(baseRate),
    `${data.expenses.managementFee > 0 ? '15' : '3'}%`,
    formatCurrency(baseRate * (1 - (data.expenses.managementFee > 0 ? 0.15 : 0.03))),
    '45%',
    formatCurrency(monthlyPerformance[12][5].replace(/[^0-9.-]+/g, '') / 12),
    '65%',
    formatCurrency(monthlyPerformance[12][7].replace(/[^0-9.-]+/g, '') / 12),
    '85%',
    formatCurrency(monthlyPerformance[12][9].replace(/[^0-9.-]+/g, '') / 12),
    formatCurrency(data.performance.longTermAnnualRevenue / 12)
  ]);

  autoTable(pdf, {
    startY: yPosition,
    head: [['Month', 'Nightly Rate', 'Platform Fee', 'Adj Rate', 'Low Occ', 'Low Rev', 'Med Occ', 'Med Rev', 'High Occ', 'High Rev', 'Long Term']],
    body: monthlyPerformance,
    margin: { left: 20 },
    styles: {
      minCellHeight: 7, // Updated to minCellHeight
      fontSize: 6,
      cellWidth: 'auto',
      cellPadding: 1
    },
    headStyles: {
      fillColor: [30, 144, 255],
      textColor: 255,
      fontSize: 7
    },
    columnStyles: {
      5: { fillColor: [254, 242, 242] },
      7: { fillColor: [255, 251, 235] },
      9: { fillColor: [240, 253, 244] },
      10: { fillColor: [239, 246, 255] }
    },
    didParseCell: function(data) {
      // Make total and average rows bold
      if (data.row.index === monthlyPerformance.length - 2 ||
          data.row.index === monthlyPerformance.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.font = 'helvetica';
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [243, 244, 246];
        data.cell.styles.textColor = [31, 41, 55];
      }
    }
  });

  // Add page numbers
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  // Add finishing touches
  if (selections.includeWatermark) {
    addWatermark(pdf, "Property Analysis Report");
  }

  // Save the PDF with forced download
  const pdfOutput = pdf.output('blob');
  const url = URL.createObjectURL(pdfOutput);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.propertyDetails.address.replace(/[^a-zA-Z0-9]/g, '_')}_analysis.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


async function addOperatingExpenses(
  pdf: jsPDF,
  data: PropertyData,
  selections: ReportSelections,
  startY: number
): Promise<number> {
  let y = startY;

  pdf.setFontSize(16);
  pdf.text('Operating Expenses', 20, y);
  y += 10;

  const expenses = [];
  if (selections.operatingExpenses.monthlyLevies && data.operatingExpenses.monthlyLevies !== undefined) {
    expenses.push(['Monthly Levies', formatCurrency(data.operatingExpenses.monthlyLevies)]);
  }
  if (selections.operatingExpenses.monthlyRatesTaxes && data.operatingExpenses.monthlyRatesTaxes !== undefined) {
    expenses.push(['Monthly Rates & Taxes', formatCurrency(data.operatingExpenses.monthlyRatesTaxes)]);
  }
  if (selections.operatingExpenses.otherMonthlyExpenses && data.operatingExpenses.otherMonthlyExpenses !== undefined) {
    expenses.push(['Other Monthly Expenses', formatCurrency(data.operatingExpenses.otherMonthlyExpenses)]);
  }
  if (selections.operatingExpenses.maintenancePercent && data.operatingExpenses.maintenancePercent !== undefined) {
    expenses.push(['Maintenance', `${data.operatingExpenses.maintenancePercent}% of rental income`]);
  }

  if (expenses.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [['Expense', 'Amount']],
      body: expenses,
      margin: { left: 20 },
      styles: {
        minCellHeight: 8, // Updated to minCellHeight
        fontSize: 9
      },
      headStyles: {
        fillColor: [30, 144, 255], // Proply blue
        textColor: 255
      }
    });
    y += (expenses.length + 1) * 10 + 10;
  }

  return y;
}

async function addCashflowAnalysis(
  pdf: jsPDF,
  data: PropertyData,
  selections: ReportSelections,
  startY: number
): Promise<number> {
  let y = startY;

  if (!selections.cashflowAnalysis) {
    return y;
  }

  pdf.setFontSize(16);
  pdf.text('Cashflow Analysis', 20, y);
  y += 10;

  const years = [1, 2, 3, 5, 10, 20];
  const cashflow = years.map(year => {
    const yearKey = `year${year}` as keyof typeof data.netOperatingIncome;
    const value = data.netOperatingIncome?.[yearKey]?.annualCashflow ?? 0;
    return [`Year ${year}`, formatCurrency(value)];
  });

  if (cashflow.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [['Period', 'Annual Cashflow']],
      body: cashflow,
      margin: { left: 20 },
      styles: {
        minCellHeight: 8, // Updated to minCellHeight
        fontSize: 9
      },
      headStyles: {
        fillColor: [30, 144, 255], // Proply blue
        textColor: 255
      }
    });
    y += (cashflow.length + 1) * 10 + 10;
  }

  return y;
}

function addPageNumbers(pdf: jsPDF): void {
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pdf.internal.pageSize.getWidth() / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
}

function addWatermark(pdf: jsPDF, text: string): void {
  const pages = pdf.getNumberOfPages();
  pdf.setFontSize(40);
  pdf.setTextColor(200);

  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.text(
      text,
      pdf.internal.pageSize.getWidth() / 2,
      pdf.internal.pageSize.getHeight() / 2,
      {
        angle: 45,
        align: 'center'
      }
    );
  }
}