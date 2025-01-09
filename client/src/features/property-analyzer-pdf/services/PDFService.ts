import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { PropertyData, ReportSelections } from '../types/propertyReport';
import { optimizeCanvas } from '../utils/optimization';
import { formatCurrency, formatPercentage } from '../utils/formatting';

export async function generatePDF(
  data: PropertyData,
  selections: ReportSelections,
  companyLogo?: string
): Promise<void> {
  try {
    // Initialize PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add content sections based on selections
    await addPropertyDetails(pdf, data, selections);
    await addFinancialMetrics(pdf, data, selections);
    await addOperatingExpenses(pdf, data, selections);
    await addRentalPerformance(pdf, data, selections);
    await addInvestmentMetrics(pdf, data, selections);
    await addCashflowAnalysis(pdf, data, selections);

    // Add finishing touches
    addPageNumbers(pdf);
    if (selections.includeWatermark) {
      addWatermark(pdf, "Property Analysis Report");
    }

    // Save the PDF
    pdf.save(`${data.propertyDetails.address}_analysis.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

async function addPropertyDetails(
  pdf: jsPDF,
  data: PropertyData,
  selections: ReportSelections
): Promise<void> {
  if (!selections.propertyDetails) return;

  const { propertyDetails } = data;
  pdf.setFontSize(18);
  pdf.text('Property Details', 20, 20);

  pdf.setFontSize(12);
  let y = 40;

  if (selections.propertyDetails.address && propertyDetails.address) {
    pdf.text(`Address: ${propertyDetails.address}`, 20, y);
    y += 10;
  }

  if (propertyDetails.propertyPhoto && selections.propertyDetails.propertyPhoto) {
    // Add property photo logic.  This requires more information about the
    // propertyPhoto data structure to implement correctly.  For now, a placeholder.
    const img = new Image();
    img.src = propertyDetails.propertyPhoto;
    const imgProps = await new Promise((resolve) => {
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
    }) as {width:number, height:number};

    const ratio = Math.min(100 / imgProps.width, 50 / imgProps.height); // Adjust size as needed
    const scaledWidth = imgProps.width * ratio;
    const scaledHeight = imgProps.height * ratio;
    pdf.addImage(propertyDetails.propertyPhoto, 'PNG', 20, y, scaledWidth, scaledHeight);
    y += scaledHeight + 10;
  }

  const detailsTable = [
    selections.propertyDetails.bedrooms && ['Bedrooms', propertyDetails.bedrooms.toString()],
    selections.propertyDetails.bathrooms && ['Bathrooms', propertyDetails.bathrooms.toString()],
    selections.propertyDetails.floorArea && ['Floor Area', `${propertyDetails.floorArea}m²`],
    selections.propertyDetails.parkingSpaces && ['Parking Spaces', propertyDetails.parkingSpaces.toString()],
    selections.propertyDetails.ratePerSquareMeter && ['Rate per m²', formatCurrency(propertyDetails.ratePerSquareMeter)]
  ].filter(Boolean);

  if (detailsTable.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [['Property Feature', 'Value']],
      body: detailsTable as string[][],
      margin: { left: 20 }
    });
  }
}

// Placeholder functions for other sections.  These need to be implemented
// based on the actual data and requirements.
async function addFinancialMetrics(pdf: jsPDF, data: PropertyData, selections: ReportSelections): Promise<void> {
  //Implementation needed
}
async function addOperatingExpenses(pdf: jsPDF, data: PropertyData, selections: ReportSelections): Promise<void> {
  //Implementation needed
}
async function addRentalPerformance(pdf: jsPDF, data: PropertyData, selections: ReportSelections): Promise<void> {
  //Implementation needed
}
async function addInvestmentMetrics(pdf: jsPDF, data: PropertyData, selections: ReportSelections): Promise<void> {
  //Implementation needed
}
async function addCashflowAnalysis(pdf: jsPDF, data: PropertyData, selections: ReportSelections): Promise<void> {
  //Implementation needed
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