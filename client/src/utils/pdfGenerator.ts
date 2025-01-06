import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatter } from '@/utils/formatting';

export function generatePropertyReport(
  data: {
    propertyDetails: {
      address: string;
      bedrooms?: string;
      bathrooms?: string;
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
      bondRegistration: number;
      transferCosts: number;
    };
    expenses: {
      monthlyLevies: number;
      monthlyRatesTaxes: number;
      otherMonthlyExpenses: number;
      maintenancePercent: number;
      managementFee: number;
    };
    performance: {
      shortTermNightlyRate: number;
      annualOccupancy: number;
      shortTermAnnualRevenue: number;
      longTermAnnualRevenue: number;
      shortTermGrossYield: number;
      longTermGrossYield: number;
    };
    netOperatingIncome?: {
      year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    };
    investmentMetrics?: {
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
      // ... same structure for other years
    };
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
      ['Property Address', data.propertyDetails.address],
      ['Purchase Price', formatter.format(data.propertyDetails.purchasePrice)],
      ['Deposit Amount', formatter.format(data.financialMetrics.depositAmount)],
      ['Deposit Percentage', `${data.financialMetrics.depositPercentage}%`],
      ['Interest Rate', `${data.financialMetrics.interestRate}%`],
      ['Monthly Bond Payment', formatter.format(data.financialMetrics.monthlyBondRepayment)]
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
      ['Short-Term Annual Revenue', formatter.format(data.performance.shortTermAnnualRevenue)],
      ['Long-Term Annual Revenue', formatter.format(data.performance.longTermAnnualRevenue)],
      ['Short-Term Gross Yield', `${data.performance.shortTermGrossYield}%`],
      ['Long-Term Gross Yield', `${data.performance.longTermGrossYield}%`]
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
  if (sections.includes("cashflowMetrics") && data.netOperatingIncome) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Cashflow Metrics', 20, yPos);
    yPos += 10;

    const years = [1, 2, 3, 4, 5, 10, 20];
    const cashflowData = years.map(year => {
      const yearKey = `year${year}` as keyof typeof data.netOperatingIncome;
      const yearData = data.netOperatingIncome![yearKey];
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
  if (sections.includes("investmentMetrics") && data.investmentMetrics?.year1) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Investment Metrics', 20, yPos);
    yPos += 10;

    const metrics = data.investmentMetrics.year1;
    const investmentData = [
      ['Gross Yield', `${metrics.grossYield?.toFixed(1) || 0}%`],
      ['Net Yield', `${metrics.netYield?.toFixed(1) || 0}%`],
      ['Return on Equity', `${metrics.returnOnEquity?.toFixed(1) || 0}%`],
      ['Annual Return', `${metrics.annualReturn?.toFixed(1) || 0}%`],
      ['Cap Rate', `${metrics.capRate?.toFixed(1) || 0}%`],
      ['Cash on Cash Return', `${metrics.cashOnCashReturn?.toFixed(1) || 0}%`],
      ['ROI (Without Appreciation)', `${metrics.roiWithoutAppreciation?.toFixed(1) || 0}%`],
      ['ROI (With Appreciation)', `${metrics.roiWithAppreciation?.toFixed(1) || 0}%`],
      ['IRR', `${metrics.irr?.toFixed(1) || 0}%`]
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