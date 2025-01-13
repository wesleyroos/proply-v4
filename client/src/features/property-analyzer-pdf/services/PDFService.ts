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
      rowHeight: 12,
      fontSize: 10
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
      rowHeight: 12,
      fontSize: 10
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

  const rentalPerformance = [
    ['Short Term Nightly Rate', formatCurrency(data.performance.shortTermNightlyRate)],
    ['Annual Occupancy', `${data.performance.annualOccupancy}%`],
    ['Short Term Annual Revenue', formatCurrency(data.performance.shortTermAnnualRevenue)],
    ['Long Term Annual Revenue', formatCurrency(data.performance.longTermAnnualRevenue)],
    ['Short Term Gross Yield', `${formatPercentage(data.performance.shortTermGrossYield)}%`],
    ['Long Term Gross Yield', `${formatPercentage(data.performance.longTermGrossYield)}%`]
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: rentalPerformance,
    margin: { left: 20 },
    styles: {
      rowHeight: 12,
      fontSize: 10
    },
    headStyles: {
      fillColor: [30, 144, 255], // Proply blue
      textColor: 255
    }
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Investment Metrics (Year 1)
  pdf.setFontSize(16);
  pdf.text('Investment Metrics (Year 1)', 20, yPosition);
  yPosition += 10;

  const shortTermMetrics = data.investmentMetrics.shortTerm[0];
  const investmentMetrics = [
    ['Gross Yield', `${formatPercentage(shortTermMetrics.grossYield)}%`],
    ['Net Yield', `${formatPercentage(shortTermMetrics.netYield)}%`],
    ['Return on Equity', `${formatPercentage(shortTermMetrics.returnOnEquity)}%`],
    ['Cap Rate', `${formatPercentage(shortTermMetrics.capRate)}%`],
    ['IRR', `${formatPercentage(shortTermMetrics.irr)}%`],
    ['Net Worth Change', formatCurrency(shortTermMetrics.netWorthChange)]
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: investmentMetrics,
    margin: { left: 20 },
    styles: {
      rowHeight: 12,
      fontSize: 10
    },
    headStyles: {
      fillColor: [30, 144, 255], // Proply blue
      textColor: 255
    }
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Revenue Projections
  pdf.setFontSize(16);
  pdf.text('Revenue Projections', 20, yPosition);
  yPosition += 10;

  const projections = [
    ['Year 1', formatCurrency(data.revenueProjections.shortTerm.year1), formatCurrency(data.revenueProjections.longTerm.year1)],
    ['Year 5', formatCurrency(data.revenueProjections.shortTerm.year5), formatCurrency(data.revenueProjections.longTerm.year5)],
    ['Year 10', formatCurrency(data.revenueProjections.shortTerm.year10), formatCurrency(data.revenueProjections.longTerm.year10)],
    ['Year 20', formatCurrency(data.revenueProjections.shortTerm.year20), formatCurrency(data.revenueProjections.longTerm.year20)]
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [['Period', 'Short Term', 'Long Term']],
    body: projections,
    margin: { left: 20 },
    styles: {
      rowHeight: 12,
      fontSize: 10
    },
    headStyles: {
      fillColor: [30, 144, 255], // Proply blue
      textColor: 255
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

  // Save the PDF
  pdf.save(`${data.propertyDetails.address}_analysis.pdf`);
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
        rowHeight: 12,
        fontSize: 10
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
        rowHeight: 12,
        fontSize: 10
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