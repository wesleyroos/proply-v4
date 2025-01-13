import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PropertyData, ReportSelections } from '../types/propertyReport';
import { formatCurrency, formatPercentage } from '../utils/formatting';

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
      rowHeight: 8,
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
      rowHeight: 8,
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
      rowHeight: 8,
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
      rowHeight: 8,
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
  const baseRate = data.performance.shortTermNightlyRate;
  const platformFee = data.expenses.managementFee || 0;

  const monthlyPerformance = months.map((month, index) => {
    const lowRev = calculateMonthlyRevenue('low', index, baseRate, true, platformFee);
    const medRev = calculateMonthlyRevenue('medium', index, baseRate, true, platformFee);
    const highRev = calculateMonthlyRevenue('high', index, baseRate, true, platformFee);
    const longTerm = data.performance.longTermAnnualRevenue / 12;

    const seasonalRates = {
      peak: 1.2,
      shoulder: 1.1,
      low: 0.9
    };

    let rateMultiplier = 1;
    if ([11, 0, 1].includes(index)) {
      rateMultiplier = seasonalRates.peak;
    } else if ([2, 3, 9, 10].includes(index)) {
      rateMultiplier = seasonalRates.shoulder;
    } else {
      rateMultiplier = seasonalRates.low;
    }

    const seasonalRate = baseRate * rateMultiplier;
    const feeAdjustedRate = seasonalRate * (1 - platformFee / 100);

    return [
      month,
      formatCurrency(seasonalRate),
      `${platformFee}%`,
      formatCurrency(feeAdjustedRate),
      `${(lowOcc * 100).toFixed(0)}%`,
      formatCurrency(lowRev),
      `${(medOcc * 100).toFixed(0)}%`,
      formatCurrency(medRev),
      `${(highOcc * 100).toFixed(0)}%`,
      formatCurrency(highRev),
      formatCurrency(longTerm)
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
    `${platformFee}%`,
    formatCurrency(baseRate * (1 - platformFee / 100)),
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
      rowHeight: 7,
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
        rowHeight: 8,
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
        rowHeight: 8,
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