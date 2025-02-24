
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
  
  // Add Proply logo
  const logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzE0LTIyOjA0OjE3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDEtMzBUMTI6NDE6NDQrMDI6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDEtMzBUMTI6NDE6NDQrMDI6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAxLTMwVDEyOjQxOjQ0KzAyOjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjA5YzFiOWM1LTY1YmQtNDY0OC05OWQ2LTQ5YmQ0Nzg1MzhlYyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjM0MmUzY2M0LTU1ZjQtMjk0NC1hOWI1LWQ4ZDU2NjY4ZjE5ZiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFiN2ZkMmZkLWQ4ZTctNDczNC05YjM1LTY1ZWYyMDQxN2I5OCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjFiN2ZkMmZkLWQ4ZTctNDczNC05YjM1LTY1ZWYyMDQxN2I5OCIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0zMFQxMjo0MTo0NCswMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+';
  doc.addImage(logo, 'PNG', 140, 15, 50, 25);
  
  // Add TAX INVOICE heading
  doc.setFontSize(24);
  doc.text('TAX INVOICE', 20, 30);

  // Add client details
  doc.setFontSize(10);
  doc.text([
    'Brennan Wright',
    'Attention: Long Run Capital (Pty) Ltd',
    'VAT#: 4330315526',
    'Spilo Business Park',
    'Cnr Drommedaris and Skoenmaker Str Paarl',
    'CAPE TOWN WESTERN CAPE 7646',
    'SOUTH AFRICA'
  ], 20, 50);

  // Add company details
  doc.text([
    'Proply Tech (Pty) Ltd',
    'Darter Studios, Darter Road,',
    'Longkloof, Gardens,',
    'Cape Town, 8001',
    'CAPE TOWN WESTERN',
    'CAPE 8001',
    'SOUTH AFRICA'
  ], 120, 50);

  // Add invoice details
  doc.text([
    `Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString()}`,
    `Invoice Number: ${invoice.invoiceNumber}`
  ], 120, 30);

  // Calculate amounts
  const unitPrice = invoice.amount / 1.15; // Remove VAT
  const vat = invoice.amount - unitPrice;

  // Add invoice table
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
  });

  // Add totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text([
    `Subtotal: R${unitPrice.toFixed(2)}`,
    `TOTAL VAT: R${vat.toFixed(2)}`,
    `TOTAL ZAR: R${invoice.amount.toFixed(2)}`,
    `Less Amount Paid: R${invoice.amount.toFixed(2)}`,
    `AMOUNT DUE ZAR: R0.00`
  ], 120, finalY);

  // Add due date
  const dueDate = new Date(invoice.createdAt);
  dueDate.setDate(dueDate.getDate() + 30);
  doc.text(`Due Date: ${dueDate.toLocaleDateString()}`, 20, finalY);

  // Save the PDF
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
