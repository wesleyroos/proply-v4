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

  // Add Proply logo from public directory with preserved aspect ratio
  const proplyLogoWidth = 40;
  try {
    await new Promise<void>((resolve) => {
      const proplyLogo = new Image();
      proplyLogo.onload = () => {
        const aspectRatio = proplyLogo.height / proplyLogo.width;
        const proplyLogoHeight = proplyLogoWidth * aspectRatio;
        doc.addImage(
          "/proply-logo-1.png",
          "PNG",
          doc.internal.pageSize.getWidth() - proplyLogoWidth - 20,
          20,
          proplyLogoWidth,
          proplyLogoHeight
        );
        resolve();
      };
      proplyLogo.onerror = () => {
        console.error("Error loading Proply logo");
        resolve();
      };
      proplyLogo.src = "/proply-logo-1.png";
    });
  } catch (error) {
    console.error("Error adding Proply logo:", error);
  }

  // Add TAX INVOICE heading
  doc.setFontSize(24);
  doc.text('TAX INVOICE', 20, 30);

  // Fetch user details
  const userResponse = await fetch('/api/user', {
    credentials: 'include'
  });
  const user = await userResponse.json();

  // Add client details
  doc.setFontSize(10);
  doc.text([
    `${user.firstName} ${user.lastName}`,
    user.company ? `Company: ${user.company}` : '',
    user.email,
  ].filter(Boolean), 20, 50);

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
  ], 120, 85);

  // Calculate amounts
  const unitPrice = invoice.amount / 1.15; // Remove VAT
  const vat = invoice.amount - unitPrice;

  // Parse amount as number first
  const amount = Number(invoice.amount);

  // Add invoice table
  const tableHeaders = [['Description', 'Quantity', 'Unit Price', 'VAT', 'Amount ZAR']];
  autoTable(doc, {
    startY: 120,
    head: tableHeaders,
    body: [
      [
        invoice.description,
        '1.00',
        unitPrice.toFixed(2),
        '15%',
        amount.toFixed(2)
      ],
      ['', '', '', 'Subtotal:', `R${unitPrice.toFixed(2)}`],
      ['', '', '', 'TOTAL VAT:', `R${vat.toFixed(2)}`],
      ['', '', '', 'TOTAL ZAR:', `R${amount.toFixed(2)}`],
      ['', '', '', 'Less Amount Paid:', `R${amount.toFixed(2)}`],
      ['', '', '', 'AMOUNT DUE ZAR:', 'R0.00']
    ],
    headStyles: {
      fontSize: 12,
      fontStyle: 'bold',
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0]
    },
    styles: {
      cellPadding: 2
    },
    columnStyles: {
      4: { halign: 'right' }
    },
    didParseCell: function(data) {
      // Make the "AMOUNT DUE" row bold
      if (data.row.index === 5) {
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // Add registered office footer
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    'Registered Office: Darter Studios, Darter Road, Longkloof, Gardens, Cape Town, 8001, Cape Town, Western Cape, 8001, South Africa.',
    20,
    doc.internal.pageSize.getHeight() - 20
  );

  // Save the PDF
  doc.save(`${invoice.invoiceNumber}.pdf`);
}