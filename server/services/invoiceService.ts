import { db } from "../db";
import { invoices, users, type InsertInvoice } from "@db/schema";
import { eq } from "drizzle-orm";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

// Generate a unique invoice number (YYYY-MM-XXXXX format)
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${year}-${month}-${random}`;
}

async function createInvoicePDF(
  invoiceData: InsertInvoice,
  userData: { firstName: string; lastName: string; email: string }
): Promise<string> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add company logo and details
  doc.setFontSize(20);
  doc.text("Proply", 20, 20);
  
  doc.setFontSize(10);
  doc.text("Invoice", pageWidth - 40, 20);
  doc.text(`#${invoiceData.invoiceNumber}`, pageWidth - 40, 25);

  // Company Details
  doc.setFontSize(10);
  const companyAddress = [
    "Proply (Pty) Ltd",
    "VAT: 123456789",
    "123 Main Street",
    "Cape Town, 8001",
    "South Africa"
  ];
  let y = 35;
  companyAddress.forEach(line => {
    doc.text(line, 20, y);
    y += 5;
  });

  // Client Details
  y = 35;
  const clientDetails = [
    `${userData.firstName} ${userData.lastName}`,
    userData.email
  ];
  clientDetails.forEach(line => {
    doc.text(line, pageWidth - 60, y);
    y += 5;
  });

  // Invoice Details
  doc.setFontSize(12);
  y = 70;
  doc.text("Invoice Details", 20, y);
  
  const details = [
    ["Period Start:", format(new Date(invoiceData.periodStart), 'dd MMM yyyy')],
    ["Period End:", format(new Date(invoiceData.periodEnd), 'dd MMM yyyy')],
    ["Status:", invoiceData.status],
    ["Amount:", `R${Number(invoiceData.amount).toFixed(2)}`]
  ];

  doc.autoTable({
    startY: y + 5,
    head: [["Description", "Value"]],
    body: details,
    theme: 'grid',
    styles: { fontSize: 10 },
    margin: { left: 20 }
  });

  // Service Details
  y = doc.autoTable.previous.finalY + 20;
  doc.text("Service Details", 20, y);

  const services = [
    ["Pro Plan Subscription", "Monthly", `R${Number(invoiceData.amount).toFixed(2)}`]
  ];

  doc.autoTable({
    startY: y + 5,
    head: [["Service", "Period", "Amount"]],
    body: services,
    theme: 'grid',
    styles: { fontSize: 10 },
    margin: { left: 20 }
  });

  // Footer
  const footer = [
    "Bank Details:",
    "Bank: Standard Bank",
    "Account: 123456789",
    "Branch: Cape Town",
    "Branch Code: 051001"
  ];

  y = doc.autoTable.previous.finalY + 20;
  footer.forEach(line => {
    doc.text(line, 20, y);
    y += 5;
  });

  // Save PDF to a file in the public directory
  const fileName = `invoice_${invoiceData.invoiceNumber}.pdf`;
  const filePath = `./public/invoices/${fileName}`;
  doc.save(filePath);

  return `/invoices/${fileName}`;
}

export async function generateInvoice(
  userId: number,
  amount: number,
  payfastPaymentId?: string
): Promise<InsertInvoice> {
  // Get user details
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate invoice data
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const invoiceData: InsertInvoice = {
    userId,
    invoiceNumber: generateInvoiceNumber(),
    amount,
    status: 'paid',
    periodStart,
    periodEnd,
    payfastPaymentId,
    generatedAt: now,
    paidAt: now,
    createdAt: now,
    updatedAt: now
  };

  // Generate PDF and get the URL
  const pdfUrl = await createInvoicePDF(invoiceData, {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email
  });

  // Update invoice data with PDF URL
  invoiceData.pdfUrl = pdfUrl;

  // Insert invoice into database
  const [createdInvoice] = await db.insert(invoices)
    .values(invoiceData)
    .returning();

  return createdInvoice;
}

export async function getUserInvoices(userId: number) {
  return db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    orderBy: (invoices, { desc }) => [desc(invoices.createdAt)]
  });
}
