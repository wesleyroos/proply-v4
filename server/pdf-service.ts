import { jsPDF } from "jspdf";
import * as fs from "fs";
import * as path from "path";

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

// Load logo once at startup
let logoBase64: string | null = null;
try {
  const candidates = [
    path.join(process.cwd(), "client/public/proply-logo-1.png"),
    path.join(process.cwd(), "dist/public/proply-logo-1.png"),
    path.join(__dirname, "../client/public/proply-logo-1.png"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      logoBase64 = fs.readFileSync(p).toString("base64");
      break;
    }
  }
} catch {
  // Logo not available — will use text fallback
}

function formatCurrency(amount: number): string {
  return `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatPeriod(period: string): string {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [year, month] = period.split("-");
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

export function generateInvoicePDF(invoiceData: InvoiceData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const ml = 20; // margin left
  const mr = pageWidth - 20; // margin right
  const contentWidth = mr - ml;

  // ─── COLOURS ──────────────────────────────────────────────
  const blue = [41, 128, 205] as const;   // Proply brand blue
  const dark = [33, 33, 33] as const;
  const mid = [100, 100, 100] as const;
  const light = [150, 150, 150] as const;
  const tableHeader = [41, 128, 205] as const;
  const tableStripe = [245, 247, 250] as const;

  let y = 20;

  // ─── HEADER ───────────────────────────────────────────────
  // Logo
  if (logoBase64) {
    // Logo aspect ratio is ~3.8:1
    const logoW = 45;
    const logoH = logoW / 3.8;
    doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", ml, y, logoW, logoH);
  } else {
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...blue);
    doc.text("proply", ml, y + 10);
  }

  // "INVOICE" title — right aligned
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text("INVOICE", mr, y + 10, { align: "right" });

  // ─── DIVIDER ──────────────────────────────────────────────
  y = 40;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(ml, y, mr, y);

  // ─── TWO-COLUMN INFO ─────────────────────────────────────
  y = 50;

  // Left column: From
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...light);
  doc.text("FROM", ml, y);

  y += 6;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text("Proply (Pty) Ltd", ml, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mid);
  doc.text("An Intelligence Layer for Real Estate", ml, y);
  y += 5;
  doc.text("wesley@proply.co.za", ml, y);
  y += 5;
  doc.text("app.proply.co.za", ml, y);

  // Right column: Invoice details
  const rightCol = mr - 70;
  let ry = 50;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...light);
  doc.text("INVOICE DETAILS", rightCol, ry);

  ry += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mid);
  doc.text("Invoice No.", rightCol, ry);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text(invoiceData.invoiceNumber, mr, ry, { align: "right" });

  ry += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mid);
  doc.text("Issue Date", rightCol, ry);
  doc.setTextColor(...dark);
  doc.text(formatDate(invoiceData.issueDate), mr, ry, { align: "right" });

  ry += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mid);
  doc.text("Billing Period", rightCol, ry);
  doc.setTextColor(...dark);
  doc.text(formatPeriod(invoiceData.billingPeriod), mr, ry, { align: "right" });

  ry += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mid);
  doc.text("Status", rightCol, ry);
  if (invoiceData.status === "paid") {
    doc.setTextColor(34, 197, 94);
  } else if (invoiceData.status === "pending") {
    doc.setTextColor(234, 179, 8);
  } else {
    doc.setTextColor(239, 68, 68);
  }
  doc.setFont("helvetica", "bold");
  doc.text(invoiceData.status.toUpperCase(), mr, ry, { align: "right" });

  // ─── BILL TO ──────────────────────────────────────────────
  y = 95;
  doc.setDrawColor(220, 220, 220);
  doc.line(ml, y, mr, y);

  y += 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...light);
  doc.text("BILL TO", ml, y);

  y += 7;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  const agencyName = invoiceData.agency.companyName || invoiceData.agency.franchiseName;
  doc.text(agencyName, ml, y);

  if (invoiceData.agency.branchName && invoiceData.agency.branchName !== agencyName) {
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mid);
    doc.text(invoiceData.agency.branchName, ml, y);
  }

  if (invoiceData.agency.businessAddress) {
    const lines = invoiceData.agency.businessAddress.split("\n");
    for (const line of lines) {
      y += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mid);
      doc.text(line.trim(), ml, y);
    }
  }

  if (invoiceData.agency.vatNumber) {
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(...mid);
    doc.text(`VAT: ${invoiceData.agency.vatNumber}`, ml, y);
  }

  if (invoiceData.agency.registrationNumber) {
    y += 5;
    doc.text(`Reg: ${invoiceData.agency.registrationNumber}`, ml, y);
  }

  // ─── LINE ITEMS TABLE ─────────────────────────────────────
  y += 15;

  // Calculate tiered pricing breakdown
  const tiers = [
    { min: 1, max: 50, price: 200 },
    { min: 51, max: 100, price: 180 },
    { min: 101, max: 150, price: 160 },
    { min: 151, max: 200, price: 140 },
    { min: 201, max: Infinity, price: 140 },
  ];

  const breakdown: Array<{ description: string; qty: number; unitPrice: number; total: number }> = [];
  let remaining = invoiceData.reportCount;

  for (const tier of tiers) {
    if (remaining <= 0) break;
    const qty = Math.min(remaining, tier.max - tier.min + 1);
    const label = tier.max === Infinity ? `Property reports (${tier.min}+)` : `Property reports (${tier.min}–${tier.max})`;
    breakdown.push({ description: label, qty, unitPrice: tier.price, total: qty * tier.price });
    remaining -= qty;
  }

  const subtotal = breakdown.reduce((s, r) => s + r.total, 0);

  // Table header
  const colDesc = ml;
  const colQty = ml + contentWidth * 0.55;
  const colUnit = ml + contentWidth * 0.72;
  const colTotal = mr;
  const rowH = 10;

  doc.setFillColor(...tableHeader);
  doc.roundedRect(ml, y, contentWidth, rowH, 2, 2, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Description", colDesc + 5, y + 7);
  doc.text("Qty", colQty, y + 7, { align: "center" });
  doc.text("Unit Price", colUnit, y + 7, { align: "right" });
  doc.text("Total", colTotal - 5, y + 7, { align: "right" });

  y += rowH;

  // Table rows
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...dark);

  breakdown.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...tableStripe);
      doc.rect(ml, y, contentWidth, rowH, "F");
    }
    doc.text(item.description, colDesc + 5, y + 7);
    doc.text(String(item.qty), colQty, y + 7, { align: "center" });
    doc.text(formatCurrency(item.unitPrice), colUnit, y + 7, { align: "right" });
    doc.text(formatCurrency(item.total), colTotal - 5, y + 7, { align: "right" });
    y += rowH;
  });

  // Bottom border on table
  doc.setDrawColor(220, 220, 220);
  doc.line(ml, y, mr, y);

  // ─── TOTALS ───────────────────────────────────────────────
  y += 12;
  const totalsLabel = mr - 55;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mid);
  doc.text("Subtotal", totalsLabel, y);
  doc.setTextColor(...dark);
  doc.text(formatCurrency(subtotal), mr - 5, y, { align: "right" });

  y += 8;
  doc.setTextColor(...mid);
  doc.text("VAT (0%)", totalsLabel, y);
  doc.setTextColor(...dark);
  doc.text(formatCurrency(0), mr - 5, y, { align: "right" });

  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(totalsLabel - 5, y, mr, y);

  y += 10;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...dark);
  doc.text("Total Due", totalsLabel, y);
  doc.text(formatCurrency(subtotal), mr - 5, y, { align: "right" });

  // ─── PAYMENT STATUS BADGE ────────────────────────────────
  if (invoiceData.status === "paid" && invoiceData.paidAt) {
    y += 15;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(34, 197, 94);
    doc.text(`Paid on ${formatDate(invoiceData.paidAt)}`, mr - 5, y, { align: "right" });
  }

  // ─── FOOTER ───────────────────────────────────────────────
  const footerY = pageHeight - 25;
  doc.setDrawColor(220, 220, 220);
  doc.line(ml, footerY - 8, mr, footerY - 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...light);
  doc.text("Thank you for using Proply.", pageWidth / 2, footerY, { align: "center" });
  doc.text("Questions? Contact us at wesley@proply.co.za", pageWidth / 2, footerY + 5, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
