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
      netOperatingIncome: {
        year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
        year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
        year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
        year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
        year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
        year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
        year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      };
    }
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

  // Add title
  doc.setFontSize(20);
  doc.text('Property Analysis Report', 20, yPos);
  yPos += 15;

  // Property Overview
  doc.setFontSize(14);
  doc.text('Property Details', 20, yPos);
  yPos += 10;

  const details = [
    ['Property', data.address],
    ['Purchase Price', formatter.format(data.analysis.purchasePrice)],
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

  // Cashflow Analysis
  if (selectedSections["Cashflow Analysis"]?.includes("cashflowChart")) {
    doc.setFontSize(14);
    doc.text('Cashflow Analysis', 20, yPos);
    yPos += 10;

    const years = [1, 2, 3, 4, 5, 10, 20];
    const chartData = years.map(year => {
      const yearKey = `year${year}` as keyof typeof data.analysis.netOperatingIncome;
      const annualCashflow = data.analysis.netOperatingIncome[yearKey].annualCashflow;

      return {
        year: `Year ${year}`,
        'Annual Cashflow': annualCashflow,
      };
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Year', 'Annual Cashflow']],
      body: chartData.map(d => [d.year, formatter.format(d['Annual Cashflow'])]),
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
    });
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