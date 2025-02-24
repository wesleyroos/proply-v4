
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function downloadInvoice(invoice: {
  invoiceNumber: string;
  createdAt: string;
  description: string;
  amount: number;
  status: string;
  user: {
    firstName: string;
    lastName: string;
    company?: string;
    vatNumber?: string;
    address?: string;
  };
}) {
  const doc = new jsPDF();
  
  // Add Proply logo
  doc.addImage('/Proply Logo 1.png', 'PNG', 140, 15, 50, 25);
  
  // Add TAX INVOICE heading
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 20, 30);
  
  // Client Details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text([
    `${invoice.user.firstName} ${invoice.user.lastName}`,
    invoice.user.company || '',
    `VAT#: ${invoice.user.vatNumber || 'N/A'}`,
    invoice.user.address || '',
    'SOUTH AFRICA'
  ].filter(Boolean), 20, 50);
  
  // Invoice Details
  doc.text([
    'Proply Tech (Pty) Ltd',
    'Darter Studios, Darter Road,',
    'Longkloof Gardens,',
    'Cape Town, 8001',
    'CAPE TOWN WESTERN CAPE',
    'SOUTH AFRICA'
  ], 140, 50);
  
  doc.text(`Invoice Date\n${new Date(invoice.createdAt).toLocaleDateString()}`, 140, 90);
  doc.text(`Invoice Number\n${invoice.invoiceNumber}`, 140, 100);
  
  // Line Items Table
  const unitPrice = invoice.amount / 1.15; // Remove VAT for unit price
  autoTable(doc, {
    startY: 120,
    head: [['Description', 'Quantity', 'Unit Price', 'VAT', 'Amount ZAR']],
    body: [[
      invoice.description,
      '1.00',
      unitPrice.toFixed(2),
      '15%',
      invoice.amount.toFixed(2)
    ]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [0, 0, 0] }
  });
  
  // Totals
  const vat = invoice.amount * 0.15;
  const subtotal = invoice.amount - vat;
  
  doc.setFont('helvetica', 'normal');
  doc.text([
    `Subtotal          ${subtotal.toFixed(2)}`,
    `TOTAL VAT         ${vat.toFixed(2)}`,
    `TOTAL ZAR         ${invoice.amount.toFixed(2)}`,
    `Less Amount Paid  ${invoice.amount.toFixed(2)}`,
    `AMOUNT DUE ZAR    0.00`
  ], 140, 180);
  
  // Due Date
  doc.text(`Due Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 220);
  
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
