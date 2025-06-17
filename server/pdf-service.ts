import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  billingPeriod: string;
  reportCount: number;
  totalAmount: number;
  status: string;
  paidAt?: string;
  agency: {
    companyName?: string;
    franchiseName: string;
    branchName: string;
    vatNumber?: string;
    registrationNumber?: string;
    businessAddress?: string;
  };
}

export function generateInvoicePDF(invoiceData: InvoiceData): Buffer {
  const doc = new jsPDF();
  
  // Company header
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, 30, { align: 'right' });
  
  // Company info (left side)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Property Analyzer Pro', margin, 40);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Property Investment Analysis Platform', margin, 48);
  doc.text('support@propertyanalyzer.co.za', margin, 55);
  doc.text('www.propertyanalyzer.co.za', margin, 62);
  
  // Invoice details (right side)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', pageWidth - 80, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(invoiceData.invoiceNumber, pageWidth - margin, 50, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Issue Date:', pageWidth - 80, 60);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoiceData.issueDate).toLocaleDateString('en-ZA'), pageWidth - margin, 60, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Billing Period:', pageWidth - 80, 70);
  doc.setFont('helvetica', 'normal');
  const [year, month] = invoiceData.billingPeriod.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = `${monthNames[parseInt(month) - 1]} ${year}`;
  doc.text(monthName, pageWidth - margin, 70, { align: 'right' });
  
  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, 85, pageWidth - margin, 85);
  
  // Bill to section
  let yPos = 100;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', margin, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const agencyName = invoiceData.agency.companyName || 
                    `${invoiceData.agency.franchiseName} - ${invoiceData.agency.branchName}`;
  doc.text(agencyName, margin, yPos);
  
  if (invoiceData.agency.businessAddress) {
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    const addressLines = invoiceData.agency.businessAddress.split('\n');
    addressLines.forEach(line => {
      doc.text(line.trim(), margin, yPos);
      yPos += 6;
    });
  }
  
  if (invoiceData.agency.vatNumber) {
    yPos += 5;
    doc.text(`VAT Number: ${invoiceData.agency.vatNumber}`, margin, yPos);
    yPos += 6;
  }
  
  if (invoiceData.agency.registrationNumber) {
    doc.text(`Registration: ${invoiceData.agency.registrationNumber}`, margin, yPos);
    yPos += 6;
  }
  
  // Calculate pricing (based on tiered structure)
  const calculatePricing = (reportCount: number) => {
    let totalCost = 0;
    let remaining = reportCount;
    const tiers = [
      { min: 1, max: 50, price: 200 },
      { min: 51, max: 100, price: 180 },
      { min: 101, max: 150, price: 160 },
      { min: 151, max: 200, price: 140 },
      { min: 201, max: Infinity, price: 140 }
    ];
    
    const breakdown = [];
    
    for (const tier of tiers) {
      if (remaining <= 0) break;
      
      const countInTier = Math.min(remaining, tier.max - tier.min + 1);
      if (countInTier > 0) {
        const tierCost = countInTier * tier.price;
        totalCost += tierCost;
        
        if (tier.max === Infinity) {
          breakdown.push({
            description: `Reports ${tier.min}+`,
            quantity: countInTier,
            unitPrice: tier.price,
            total: tierCost
          });
        } else {
          breakdown.push({
            description: `Reports ${tier.min}-${tier.max}`,
            quantity: countInTier,
            unitPrice: tier.price,
            total: tierCost
          });
        }
        
        remaining -= countInTier;
      }
    }
    
    return { breakdown, totalCost };
  };
  
  const pricing = calculatePricing(invoiceData.reportCount);
  
  // Invoice table
  yPos += 15;
  const tableData = pricing.breakdown.map(item => [
    item.description,
    item.quantity.toString(),
    `R${item.unitPrice.toFixed(2)}`,
    `R${item.total.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246], // Blue color
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 11
    },
    bodyStyles: {
      fontSize: 10
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });
  
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 40;
  
  // Totals section
  const totalsX = pageWidth - 80;
  let totalsY = finalY + 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(`R${pricing.totalCost.toFixed(2)}`, pageWidth - margin, totalsY, { align: 'right' });
  
  totalsY += 10;
  doc.text('VAT (0%):', totalsX, totalsY);
  doc.text('R0.00', pageWidth - margin, totalsY, { align: 'right' });
  
  totalsY += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', totalsX, totalsY);
  doc.text(`R${pricing.totalCost.toFixed(2)}`, pageWidth - margin, totalsY, { align: 'right' });
  
  // Payment status
  totalsY += 25;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  if (invoiceData.status === 'paid' && invoiceData.paidAt) {
    doc.setTextColor(34, 197, 94); // Green
    doc.text('PAID', totalsX, totalsY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Back to black
    doc.text(`Payment Date: ${new Date(invoiceData.paidAt).toLocaleDateString('en-ZA')}`, margin, totalsY + 10);
  } else if (invoiceData.status === 'pending') {
    doc.setTextColor(234, 179, 8); // Yellow
    doc.text('PENDING', totalsX, totalsY);
    doc.setTextColor(0, 0, 0); // Back to black
  } else {
    doc.setTextColor(239, 68, 68); // Red
    doc.text('OVERDUE', totalsX, totalsY);
    doc.setTextColor(0, 0, 0); // Back to black
  }
  
  // Footer
  const footerY = doc.internal.pageSize.height - 30;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128); // Gray
  doc.text('Thank you for using Property Analyzer Pro!', pageWidth / 2, footerY, { align: 'center' });
  doc.text('For support, contact us at support@propertyanalyzer.co.za', pageWidth / 2, footerY + 8, { align: 'center' });
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}