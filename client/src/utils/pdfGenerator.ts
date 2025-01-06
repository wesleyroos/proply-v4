import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatter } from '@/utils/formatting';

interface PropertyReportData {
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
}

export function generatePropertyReport(
  data: PropertyReportData,
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

  // Add title
  doc.setFontSize(20);
  doc.text('Property Analysis Report', 20, yPos);
  yPos += 15;

  // Property Overview Section
  if (selectedSections["Property Overview"]?.length > 0) {
    doc.setFontSize(14);
    doc.text('Property Overview', 20, yPos);
    yPos += 10;

    const details = [];
    if (selectedSections["Property Overview"].includes("address")) {
      details.push(['Property Address', data.propertyDetails.address]);
    }
    if (selectedSections["Property Overview"].includes("purchasePrice")) {
      details.push(['Purchase Price', formatter.format(data.propertyDetails.purchasePrice)]);
    }
    if (selectedSections["Property Overview"].includes("floorArea")) {
      details.push(['Floor Area', `${data.propertyDetails.floorArea} m²`]);
    }
    if (selectedSections["Property Overview"].includes("ratePerM2")) {
      details.push(['Rate per m²', formatter.format(data.propertyDetails.ratePerSquareMeter)]);
    }
    if (selectedSections["Property Overview"].includes("bedrooms") && data.propertyDetails.bedrooms) {
      details.push(['Bedrooms', data.propertyDetails.bedrooms]);
    }
    if (selectedSections["Property Overview"].includes("bathrooms") && data.propertyDetails.bathrooms) {
      details.push(['Bathrooms', data.propertyDetails.bathrooms]);
    }
    if (selectedSections["Property Overview"].includes("parkingSpaces")) {
      details.push(['Parking Spaces', data.propertyDetails.parkingSpaces.toString()]);
    }

    if (details.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Detail', 'Value']],
        body: details,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Deal Structure Section
  if (selectedSections["Deal Structure"]?.length > 0) {
    doc.setFontSize(14);
    doc.text('Deal Structure', 20, yPos);
    yPos += 10;

    const details = [];
    if (selectedSections["Deal Structure"].includes("deposit")) {
      details.push(['Deposit Amount', formatter.format(data.financialMetrics.depositAmount)]);
      details.push(['Deposit Percentage', `${data.financialMetrics.depositPercentage}%`]);
    }
    if (selectedSections["Deal Structure"].includes("interestRate")) {
      details.push(['Interest Rate', `${data.financialMetrics.interestRate}%`]);
    }
    if (selectedSections["Deal Structure"].includes("loanTerm")) {
      details.push(['Loan Term', `${data.financialMetrics.loanTerm} years`]);
    }
    if (selectedSections["Deal Structure"].includes("monthlyBond")) {
      details.push(['Monthly Bond Payment', formatter.format(data.financialMetrics.monthlyBondRepayment)]);
    }
    if (selectedSections["Deal Structure"].includes("bondRegistration")) {
      details.push(['Bond Registration Costs', formatter.format(data.financialMetrics.bondRegistration)]);
    }
    if (selectedSections["Deal Structure"].includes("transferCosts")) {
      details.push(['Transfer Costs', formatter.format(data.financialMetrics.transferCosts)]);
    }

    if (details.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Detail', 'Value']],
        body: details,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Revenue Performance Section
  if (selectedSections["Revenue Performance"]?.length > 0) {
    doc.setFontSize(14);
    doc.text('Revenue Performance', 20, yPos);
    yPos += 10;

    const details = [];
    if (selectedSections["Revenue Performance"].includes("shortTermRevenue")) {
      details.push(['Short-Term Annual Revenue', formatter.format(data.performance.shortTermAnnualRevenue)]);
    }
    if (selectedSections["Revenue Performance"].includes("longTermRevenue")) {
      details.push(['Long-Term Annual Revenue', formatter.format(data.performance.longTermAnnualRevenue)]);
    }
    if (selectedSections["Revenue Performance"].includes("occupancyRate")) {
      details.push(['Annual Occupancy Rate', `${data.performance.annualOccupancy}%`]);
    }
    if (selectedSections["Revenue Performance"].includes("managementFees")) {
      details.push(['Management Fee', `${data.expenses.managementFee}%`]);
    }

    if (details.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: details,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Monthly Revenue Breakdown
    if (selectedSections["Revenue Performance"].includes("monthlyBreakdown")) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const longTermMonthly = data.performance.longTermAnnualRevenue / 12;
      const shortTermMonthly = data.performance.shortTermAnnualRevenue / 12;
      const shortTermAfterFees = data.performance.shortTermAnnualRevenue * (1 - data.expenses.managementFee / 100);

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

      doc.addPage();
      yPos = 20;
      doc.setFontSize(14);
      doc.text('Monthly Revenue Breakdown', 20, yPos);
      yPos += 10;

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
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Operating Expenses Section
  if (selectedSections["Operating Expenses"]?.length > 0) {
    if (yPos > 220) { // Start new page if not enough space
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Operating Expenses', 20, yPos);
    yPos += 10;

    const details = [];
    if (selectedSections["Operating Expenses"].includes("monthlyLevies")) {
      details.push(['Monthly Levies', formatter.format(data.expenses.monthlyLevies)]);
    }
    if (selectedSections["Operating Expenses"].includes("ratesTaxes")) {
      details.push(['Monthly Rates & Taxes', formatter.format(data.expenses.monthlyRatesTaxes)]);
    }
    if (selectedSections["Operating Expenses"].includes("otherExpenses")) {
      details.push(['Other Monthly Expenses', formatter.format(data.expenses.otherMonthlyExpenses)]);
    }
    if (selectedSections["Operating Expenses"].includes("maintenanceCosts")) {
      details.push(['Maintenance', `${data.expenses.maintenancePercent}% of rental income`]);
    }

    if (details.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Expense Type', 'Amount']],
        body: details,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Investment Metrics Section
  if (selectedSections["Investment Metrics"]?.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Investment Metrics', 20, yPos);
    yPos += 10;

    const details = [];
    if (selectedSections["Investment Metrics"].includes("grossYield")) {
      details.push(['Short-Term Gross Yield', `${data.performance.shortTermGrossYield.toFixed(1)}%`]);
      details.push(['Long-Term Gross Yield', `${data.performance.longTermGrossYield.toFixed(1)}%`]);
    }

    if (details.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: details,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
      });
    }
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