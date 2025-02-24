
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Invoice {
  id: number;
  userId: number;
  amount: number;
  description: string;
  status: string;
  invoiceNumber: string;
  paidAt: string;
  createdAt: string;
}

export async function downloadInvoice(invoice: Invoice) {
  const doc = new jsPDF();

  // Add Proply logo from public directory
  doc.addImage('/proply-logo-1.png', 'PNG', 140, 15, 50, 25);

  // Add TAX INVOICE heading
  doc.setFontSize(24);
  doc.text('TAX INVOICE', 20, 30);

  // Fetch user details for the invoice
  const userResponse = await fetch('/api/user', {
    credentials: 'include'
  });
  const user = await userResponse.json();

  // Add invoice details
  doc.setFontSize(10);
  doc.text([
    'Invoice To:',
    `${user.firstName} ${user.lastName}`,
    user.company || '',
    user.email,
    '',
    'Invoice Number:',
    invoice.invoiceNumber,
    '',
    'Date:',
    new Date(invoice.createdAt).toLocaleDateString(),
  ], 20, 50);

  // Parse amount as number for calculations
  const amount = Number(invoice.amount);
  const unitPrice = amount / 1.15;
  
  // Add invoice table
  autoTable(doc, {
    startY: 120,
    head: [['Description', 'Quantity', 'Unit Price', 'VAT', 'Amount']],
    body: [[
      invoice.description,
      '1.00',
      unitPrice.toFixed(2),
      '15%',
      amount.toFixed(2)
    ]],
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Calculate VAT
  const amount = Number(invoice.amount);
  const unitPrice = amount / 1.15;
  const vat = amount - unitPrice;

  // Add totals
  doc.text([
    `Subtotal: R${unitPrice.toFixed(2)}`,
    `TOTAL VAT: R${vat.toFixed(2)}`,
    `TOTAL ZAR: R${amount.toFixed(2)}`,
    `Less Amount Paid: R${amount.toFixed(2)}`,
    `AMOUNT DUE ZAR: R0.00`
  ], 120, finalY);

  // Footer
  doc.setFontSize(8);
  doc.text('Proply (Pty) Ltd | Registration: 2023/960570/07 | VAT: 4270294952', 20, 280);

  // Save the PDF
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
