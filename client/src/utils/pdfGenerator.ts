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
    investmentMetrics: {
      shortTerm: Array<{
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
      }>;
      longTerm: Array<{
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
      }>;
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

  // Investment Metrics Section
  if (sections.includes("investmentMetrics")) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Investment Metrics', 20, yPos);
    yPos += 10;

    // Get year 1 metrics
    const year1Metrics = data.investmentMetrics.shortTerm[0];
    const investmentData = [
      ['Gross Yield', `${year1Metrics.grossYield.toFixed(1)}%`],
      ['Net Yield', `${year1Metrics.netYield.toFixed(1)}%`],
      ['Return on Equity', `${year1Metrics.returnOnEquity.toFixed(1)}%`],
      ['Annual Return', `${year1Metrics.annualReturn.toFixed(1)}%`],
      ['Cap Rate', `${year1Metrics.capRate.toFixed(1)}%`],
      ['Cash on Cash Return', `${year1Metrics.cashOnCashReturn.toFixed(1)}%`],
      ['ROI (Without Appreciation)', `${year1Metrics.roiWithoutAppreciation.toFixed(1)}%`],
      ['ROI (With Appreciation)', `${year1Metrics.roiWithAppreciation.toFixed(1)}%`],
      ['IRR', `${year1Metrics.irr.toFixed(1)}%`]
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