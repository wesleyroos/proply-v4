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
  },
  selectedSections: Record<string, string[]>,
  companyLogo?: string | null
): jsPDF {
  const doc = new jsPDF();
  let yPos = 20;

  // Add title
  doc.setFontSize(20);
  doc.text('Property Analysis Report', 20, yPos);
  yPos += 15;

  // Add property details
  doc.setFontSize(14);
  doc.text('Property Details', 20, yPos);
  yPos += 10;

  const details = [
    ['Property', data.propertyDetails.address],
    ['Purchase Price', formatter.format(data.propertyDetails.purchasePrice)],
    ['Floor Area', `${data.propertyDetails.floorArea} m²`],
    ['Rate per m²', formatter.format(data.propertyDetails.ratePerSquareMeter)],
    ['Deposit', `${formatter.format(data.financialMetrics.depositAmount)} (${data.financialMetrics.depositPercentage}%)`],
    ['Interest Rate', `${data.financialMetrics.interestRate}%`],
    ['Loan Term', `${data.financialMetrics.loanTerm} years`],
    ['Monthly Bond Payment', formatter.format(data.financialMetrics.monthlyBondRepayment)]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Detail', 'Value']],
    body: details,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Add rental comparison table
  doc.setFontSize(14);
  doc.text('Monthly Revenue Comparison', 20, yPos);
  yPos += 10;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const longTermMonthly = data.performance.longTermAnnualRevenue / 12;
  const shortTermMonthly = data.performance.shortTermAnnualRevenue / 12;
  const shortTermAfterFees = data.performance.shortTermAnnualRevenue * (1 - data.expenses.managementFee);

  const tableData = [
    ['Long Term', ...Array(12).fill(formatter.format(longTermMonthly)),
      formatter.format(data.performance.longTermAnnualRevenue),
      formatter.format(longTermMonthly)],
    ['Short Term', ...Array(12).fill(formatter.format(shortTermMonthly)),
      formatter.format(data.performance.shortTermAnnualRevenue),
      formatter.format(shortTermMonthly)],
    ['After Fees', ...Array(12).fill(formatter.format(shortTermAfterFees / 12)),
      formatter.format(shortTermAfterFees),
      formatter.format(shortTermAfterFees / 12)]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Type', ...months, 'Annual Total', 'Monthly Avg']],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] },
    columnStyles: {
      0: { fontStyle: 'bold' },
      13: { fontStyle: 'bold' },
      14: { fontStyle: 'bold' }
    }
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
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