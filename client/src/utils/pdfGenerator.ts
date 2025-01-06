import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatter } from '@/utils/formatting';

export function generatePropertyReport(
  data: {
    address: string;
    analysis: {
      purchasePrice: number;
      shortTermAnnualRevenue: number;
      longTermAnnualRevenue: number;
      revenueProjections: {
        shortTerm: {
          year1: number;
          year2: number;
          year3: number;
          year4: number;
          year5: number;
          year10: number;
          year20: number;
        };
      };
      operatingExpenses: {
        year1: number;
        year2: number;
        year3: number;
        year4: number;
        year5: number;
        year10: number;
        year20: number;
      };
      netOperatingIncome: {
        year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
        year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
        year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
        year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
        year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
        year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
        year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      };
      investmentMetrics: {
        year1: {
          grossYield: number;
          netYield: number;
          returnOnEquity: number;
          annualReturn: number;
          capRate: number;
          cashOnCashReturn: number;
          roiWithoutAppreciation: number;
          roiWithAppreciation: number;
          irr: number;
          netWorthChange: number;
        };
        year2: typeof year1;
        year3: typeof year1;
        year4: typeof year1;
        year5: typeof year1;
        year10: typeof year1;
        year20: typeof year1;
      };
    };
    shortTermGrossYield: number;
    longTermGrossYield: number;
    deposit: number;
    depositPercentage: number;
    interestRate: number;
    monthlyBondRepayment: number;
    propertyDescription?: string;
  },
  selectedSections: Record<string, string[]>,
  companyLogo?: string | null
): jsPDF {
  const doc = new jsPDF();
  let yPos = 20;

  // Add company logo if provided
  if (companyLogo && selectedSections["Company Branding"]?.includes("companyLogo")) {
    doc.addImage(companyLogo, "PNG", 160, 10, 40, 20);
    yPos = 50;
  }

  // Add title and property info
  doc.setFontSize(20);
  doc.text('Property Analysis Report', 20, yPos);
  yPos += 15;

  const sections = selectedSections["Analysis Results"] || [];

  // Deal Structure Section
  if (sections.includes("dealStructure")) {
    doc.setFontSize(14);
    doc.text('Deal Structure', 20, yPos);
    yPos += 10;

    const dealStructureData = [
      ['Property Address', data.address],
      ['Purchase Price', formatter.format(data.analysis.purchasePrice)],
      ['Deposit Amount', formatter.format(data.deposit)],
      ['Deposit Percentage', `${data.depositPercentage}%`],
      ['Interest Rate', `${data.interestRate}%`],
      ['Monthly Bond Payment', formatter.format(data.monthlyBondRepayment)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Detail', 'Value']],
      body: dealStructureData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Rental Performance Section
  if (sections.includes("rentalPerformance")) {
    doc.setFontSize(14);
    doc.text('Rental Performance', 20, yPos);
    yPos += 10;

    const rentalData = [
      ['Short-Term Annual Revenue', formatter.format(data.analysis.shortTermAnnualRevenue)],
      ['Long-Term Annual Revenue', formatter.format(data.analysis.longTermAnnualRevenue)],
      ['Short-Term Gross Yield', `${data.shortTermGrossYield}%`],
      ['Long-Term Gross Yield', `${data.longTermGrossYield}%`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: rentalData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Cashflow Metrics Section
  if (sections.includes("cashflowMetrics")) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Cashflow Metrics', 20, yPos);
    yPos += 10;

    const years = [1, 2, 3, 4, 5, 10, 20];
    const cashflowData = years.map(year => {
      const yearKey = `year${year}` as keyof typeof data.analysis.netOperatingIncome;
      const yearData = data.analysis.netOperatingIncome[yearKey];
      return [
        `Year ${year}`,
        formatter.format(yearData.annualCashflow),
        formatter.format(yearData.cumulativeRentalIncome),
        formatter.format(yearData.netWorthChange)
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Year', 'Annual Cashflow', 'Cumulative Rental Income', 'Net Worth Change']],
      body: cashflowData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Investment Metrics Section
  if (sections.includes("investmentMetrics")) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Investment Metrics', 20, yPos);
    yPos += 10;

    // Get year 1 investment metrics as shown in the UI
    const year1Metrics = data.analysis.investmentMetrics.year1;
    const investmentData = [
      ['Gross Yield', `${year1Metrics.grossYield.toFixed(1)}%`],
      ['Net Yield', `${year1Metrics.netYield.toFixed(1)}%`],
      ['Return on Equity', `${year1Metrics.returnOnEquity.toFixed(1)}%`],
      ['Annual Return', `${year1Metrics.annualReturn.toFixed(1)}%`],
      ['Cap Rate', `${year1Metrics.capRate.toFixed(1)}%`],
      ['Cash on Cash Return', `${year1Metrics.cashOnCashReturn.toFixed(1)}%`],
      ['ROI (Without Appreciation)', `${year1Metrics.roiWithoutAppreciation.toFixed(1)}%`],
      ['ROI (With Appreciation)', `${year1Metrics.roiWithAppreciation.toFixed(1)}%`],
      ['IRR', `${year1Metrics.irr.toFixed(1)}%`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: investmentData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      20,
      280
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      170,
      280
    );
  }

  return doc;
}