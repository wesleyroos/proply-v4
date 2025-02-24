
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function downloadInvoice(invoice: {
  invoiceNumber: string;
  createdAt: string;
  description: string;
  amount: number;
  status: string;
}) {
  const doc = new jsPDF();
  
  // Add company logo/header
  doc.setFontSize(20);
  doc.text('Proply', 20, 20);
  
  // Add invoice details
  doc.setFontSize(12);
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 40);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, 50);
  doc.text(`Status: ${invoice.status}`, 20, 60);
  
  // Add line items
  autoTable(doc, {
    startY: 70,
    head: [['Description', 'Amount']],
    body: [[
      invoice.description,
      `R${typeof invoice.amount === 'string' ? parseFloat(invoice.amount).toFixed(2) : invoice.amount.toFixed(2)}`
    ]],
  });
  
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
