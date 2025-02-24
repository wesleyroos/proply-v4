
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
  
  // Add Proply logo - using base64 encoded logo
  const logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF0WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzE0LTIyOjA0OjE3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDEtMzBUMTI6NDE6NDQrMDI6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDEtMzBUMTI6NDE6NDQrMDI6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAxLTMwVDEyOjQxOjQ0KzAyOjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjA5YzFiOWM1LTY1YmQtNDY0OC05OWQ2LTQ5YmQ0Nzg1MzhlYyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjM0MmUzY2M0LTU1ZjQtMjk0NC1hOWI1LWQ4ZDU2NjY4ZjE5ZiIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFiN2ZkMmZkLWQ4ZTctNDczNC05YjM1LTY1ZWYyMDQxN2I5OCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjFiN2ZkMmZkLWQ4ZTctNDczNC05YjM1LTY1ZWYyMDQxN2I5OCIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0zMFQxMjo0MTo0NCswMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjA5YzFiOWM1LTY1YmQtNDY0OC05OWQ2LTQ5YmQ0Nzg1MzhlYyIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0zMFQxMjo0MTo0NCswMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+7+P0qAAAA+5JREFUeJzt3U9LVFEcx/HvjE5kWkGrCkIhKGgRtGgR1KpFi4rCIKJ/0CKCXkBv4N5dRPQColUULYJoE7SoRUFBi6BFQRAEQZBpmpY6t3Num+DMnXvPn3PP/X7gLPSemXN+Z547njP3OG2j29sCkAl/1QUAVSKAASOABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABmGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABiGABv8B6N5W34TFQ1IAAAAASUVORK5CYII=';
  doc.addImage(logo, 'PNG', 140, 15, 50, 25);
  
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
