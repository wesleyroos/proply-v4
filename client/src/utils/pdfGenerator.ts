import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatter } from '@/utils/formatting';

interface ComparisonData {
  title: string;
  longTermMonthly: number;
  shortTermMonthly: number;
  longTermAnnual: number;
  shortTermAnnual: number;
  shortTermAfterFees: number;
  breakEvenOccupancy: number;
  shortTermNightly: number;
  managementFee: number;
  annualOccupancy: number;
  bedrooms?: string;
  bathrooms?: string;
}

export function generatePropertyReport(
  data: ComparisonData,
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
    ['Property', data.title],
    ['Short-Term Nightly Rate', formatter.format(data.shortTermNightly)],
    ['Annual Occupancy', `${data.annualOccupancy}%`],
    ['Management Fee', `${(data.managementFee * 100).toFixed(1)}%`],
    ['Break-even Occupancy', `${data.breakEvenOccupancy.toFixed(1)}%`]
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
  const tableData = [
    ['Long Term', ...Array(12).fill(formatter.format(data.longTermMonthly)),
      formatter.format(data.longTermAnnual),
      formatter.format(data.longTermMonthly)],
    ['Short Term', ...Array(12).fill(formatter.format(data.shortTermMonthly)),
      formatter.format(data.shortTermAnnual),
      formatter.format(data.shortTermMonthly)],
    ['After Fees', ...Array(12).fill(formatter.format(data.shortTermAfterFees / 12)),
      formatter.format(data.shortTermAfterFees),
      formatter.format(data.shortTermAfterFees / 12)]
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