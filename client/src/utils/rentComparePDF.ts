import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// PDF-safe formatter: avoids Unicode spaces and special minus signs that jsPDF can't render
const fmt = (v: number) => `R ${Math.round(v).toLocaleString('en-US')}`;
const fmtDebit = (v: number) => `- R ${Math.round(v).toLocaleString('en-US')}`;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SEASONALITY_FACTORS = [2.11,1.69,1.27,1.27,0.76,0.68,0.68,0.68,0.76,0.93,1.27,2.03];
const OCCUPANCY_RATES = {
  low:    [65,65,60,55,50,50,50,50,60,65,65,65],
  medium: [80,78,73,68,63,60,60,60,70,75,75,85],
  high:   [95,90,85,80,75,70,70,70,80,85,85,95],
};

export interface RentComparePropertyData {
  title: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  shortTermNightly: string;
  annualOccupancy: string;
  managementFee: string;
  platformFee?: string | null;
  longTermMonthly: string;
  longTermAnnual: string;
  shortTermAnnual: string;
  shortTermAfterFees: string;
  breakEvenOccupancy: string;
  annualEscalation: string;
  createdAt: string;
  photos?: string | null;
}

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

const PROPLY_BLUE: [number, number, number] = [27, 163, 255];
const SLATE_800:   [number, number, number] = [30, 41, 59];
const EMERALD:     [number, number, number] = [5, 150, 105];
const PURPLE:      [number, number, number] = [124, 58, 237];
const SLATE_500:   [number, number, number] = [100, 116, 139];

export async function generateRentComparePDF(
  property: RentComparePropertyData,
  companyLogo?: string,
) {
  // Capture the monthly projections chart from the DOM before building the PDF
  let chartImageData = '';
  let chartAspectRatio = 2.5;
  const chartEl = document.getElementById('rent-compare-monthly-chart');
  if (chartEl) {
    try {
      // Snapshot real dimensions from the live DOM — getBoundingClientRect returns
      // 0×0 inside the cloned doc so we must read values here, before cloning.
      const elRect = chartEl.getBoundingClientRect();
      const svgDims = Array.from(chartEl.getElementsByTagName('svg')).map(svg => {
        const r = svg.getBoundingClientRect();
        return { width: r.width, height: r.height };
      });

      const canvas = await html2canvas(chartEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: false,
        width: elRect.width,
        height: elRect.height,
        onclone: (clonedDoc) => {
          const cloned = clonedDoc.getElementById('rent-compare-monthly-chart');
          if (!cloned) return;
          // Force the ResponsiveContainer to a fixed size so the SVG gets laid out
          cloned.querySelectorAll<HTMLElement>('.recharts-responsive-container').forEach(c => {
            c.style.width = `${elRect.width}px`;
            c.style.height = '270px';
          });
          // Apply the pre-captured pixel dimensions to each SVG
          Array.from(cloned.getElementsByTagName('svg')).forEach((svg, i) => {
            const d = svgDims[i];
            if (d && d.width > 0) {
              svg.setAttribute('width', String(d.width));
              svg.setAttribute('height', String(d.height));
            }
          });
        },
      });
      chartImageData = canvas.toDataURL('image/png');
      chartAspectRatio = canvas.width / canvas.height;
    } catch {
      // fall back to table-only layout
    }
  }

  const doc = new jsPDF();
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;

  // --- Derived values ---
  const stNightly     = Number(property.shortTermNightly  || 0);
  const occupancy     = Number(property.annualOccupancy   || 0);
  const mgmtFeeRaw    = Number(property.managementFee     || 0);
  const mgmtFee       = mgmtFeeRaw >= 1 ? mgmtFeeRaw / 100 : mgmtFeeRaw; // decimal; legacy rows stored percent
  const ltMonthly     = Number(property.longTermMonthly   || 0);
  const ltAnnual      = Number(property.longTermAnnual    || 0);
  const stAnnual      = Number(property.shortTermAnnual   || 0);
  const stAfterFees   = Number(property.shortTermAfterFees|| 0);
  const breakEven     = Number(property.breakEvenOccupancy|| 0);
  const platformPct   = Number(property.platformFee) || (mgmtFee > 0 ? 15 : 3);
  const platformRate  = platformPct / 100;
  const platformAmt   = stAnnual * platformRate;
  const afterPlatform = stAnnual - platformAmt;
  const mgmtAmt       = mgmtFee > 0 ? afterPlatform * mgmtFee : 0;
  const advantage     = stAfterFees - ltAnnual;

  const analysisDate = new Date(property.createdAt).toLocaleDateString("en-ZA", {
    day: "2-digit", month: "long", year: "numeric",
  });

  // --- Load logos ---
  const [proplyLogo, coLogo] = await Promise.all([
    fetchImageAsBase64("/proply-logo-1.png"),
    companyLogo ? fetchImageAsBase64(companyLogo) : Promise.resolve(""),
  ]);

  // --- Header/footer helpers ---
  const addHeader = (pageTitle = "Rent Compare Analysis") => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 14, "F");
    doc.setDrawColor(226, 232, 240);
    doc.line(0, 14, pageWidth, 14);
    if (proplyLogo) doc.addImage(proplyLogo, "PNG", margin, 3, 28, 8);
    doc.setTextColor(...SLATE_800);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(pageTitle, pageWidth - margin, 9, { align: "right" });
    doc.setTextColor(0, 0, 0);
  };

  const addFooter = (pageNum: number, total: number) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, pageHeight - 10, pageWidth, 10, "F");
    doc.setDrawColor(226, 232, 240);
    doc.line(0, pageHeight - 10, pageWidth, pageHeight - 10);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE_500);
    doc.text(`© ${new Date().getFullYear()} Proply Tech (Pty) Ltd`, margin, pageHeight - 3.5);
    doc.text(`Page ${pageNum} of ${total}`, pageWidth - margin, pageHeight - 3.5, { align: "right" });
  };

  // ===========================
  // PAGE 1 — Summary
  // ===========================
  addHeader();

  // Property hero block
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 18, pageWidth - margin * 2, 26, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 18, pageWidth - margin * 2, 26, 2, 2, "S");

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_800);
  doc.text(property.title, margin + 5, 27);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE_500);
  doc.text(property.address, margin + 5, 33);

  doc.setFontSize(7.5);
  doc.text(
    `${property.bedrooms} Bedrooms  ·  ${property.bathrooms} Bathrooms  ·  ${occupancy}% Occupancy  ·  Analysed ${analysisDate}`,
    margin + 5,
    39,
  );

  if (coLogo) {
    doc.addImage(coLogo, "PNG", pageWidth - margin - 30, 19, 30, 12);
  }

  // KPI tiles
  const kpiY = 50;
  const kpiW = (pageWidth - margin * 2 - 8) / 3;
  const tiles: Array<{
    label: string;
    value: string;
    sub: string;
    color: [number, number, number];
    bg: [number, number, number];
  }> = [
    {
      label: "SHORT-TERM ANNUAL (NET)",
      value: fmt(stAfterFees),
      sub: "After all fees & commissions",
      color: EMERALD,
      bg: [240, 253, 250],
    },
    {
      label: "LONG-TERM ANNUAL",
      value: fmt(ltAnnual),
      sub: `At ${fmt(ltMonthly)}/month`,
      color: PURPLE,
      bg: [245, 243, 255],
    },
    {
      label: "ANNUAL ADVANTAGE",
      value: `${advantage > 0 ? "+" : ""}${fmt(advantage)}`,
      sub: "Short-term vs long-term",
      color: advantage > 0 ? EMERALD : [220, 38, 38],
      bg: advantage > 0 ? [240, 253, 250] : [254, 242, 242],
    },
  ];

  tiles.forEach((tile, idx) => {
    const x = margin + idx * (kpiW + 4);
    doc.setFillColor(...tile.color);
    doc.rect(x, kpiY, kpiW, 1.5, "F");
    doc.setFillColor(...tile.bg);
    doc.rect(x, kpiY + 1.5, kpiW, 22, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SLATE_500);
    doc.text(tile.label, x + 3, kpiY + 9);
    doc.setFontSize(11);
    doc.setTextColor(...tile.color);
    doc.text(tile.value, x + 3, kpiY + 18);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SLATE_500);
    doc.text(tile.sub, x + 3, kpiY + 23);
  });

  let y = kpiY + 30;

  // Short-term breakdown
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_800);
  doc.text("Short-Term Revenue Breakdown", margin, y);
  y += 3;

  const stBody: string[][] = [
    ["Nightly Rate", fmt(stNightly)],
    ["Annual Occupancy", `${occupancy}%`],
    ["Gross Annual Revenue", fmt(stAnnual)],
    [`Less Platform Fee (${platformPct % 1 === 0 ? platformPct.toFixed(0) : platformPct.toFixed(1)}%)`, fmtDebit(platformAmt)],
  ];
  if (mgmtFee > 0) {
    stBody.push([`Less Management Fee (${(mgmtFee * 100).toFixed(0)}%)`, fmtDebit(mgmtAmt)]);
  }
  stBody.push(["Net Annual Revenue", fmt(stAfterFees)]);

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Amount"]],
    body: stBody,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: PROPLY_BLUE, textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 110 }, 1: { halign: "right" } },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === stBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = EMERALD;
      }
      if (data.section === "body" && (data.row.index === 3 || data.row.index === 4) && stBody[data.row.index]?.[1]?.startsWith("−")) {
        data.cell.styles.textColor = [220, 38, 38];
      }
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  // Long-term breakdown
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_800);
  doc.text("Long-Term Revenue Breakdown", margin, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Amount"]],
    body: [
      ["Monthly Rental", fmt(ltMonthly)],
      ["Annual Escalation", `${property.annualEscalation}%`],
      ["Annual Revenue", fmt(ltAnnual)],
    ],
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 110 }, 1: { halign: "right" } },
    didParseCell: (data) => {
      if (data.section === "body" && data.row.index === 2) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = PURPLE;
      }
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  // Break-even
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_800);
  doc.text("Break-Even Occupancy Analysis", margin, y);
  y += 3;

  const conclusion = advantage > 0
    ? `At ${occupancy}% occupancy, short-term earns ${fmt(advantage)} more per year than long-term.`
    : `Long-term may be more suitable at ${occupancy}% occupancy. Short-term needs ${breakEven.toFixed(1)}% to break even.`;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Break-Even Occupancy Required", `${breakEven.toFixed(1)}%`],
      ["Projected Annual Occupancy", `${occupancy}%`],
      ["Recommendation", conclusion],
    ],
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: SLATE_800, textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 70 } },
    margin: { left: margin, right: margin },
  });

  // ===========================
  // PAGE 2 — Photos (if any)
  // ===========================
  const photoUrls: string[] = (() => {
    try { return property.photos ? JSON.parse(property.photos).slice(0, 8) : []; }
    catch { return []; }
  })();

  if (photoUrls.length > 0) {
    const photoBase64s = await Promise.all(photoUrls.map(u => fetchImageAsBase64(u)));
    const validPhotos = photoBase64s.filter(Boolean);

    if (validPhotos.length > 0) {
      doc.addPage();
      addHeader("Property Photos");

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...SLATE_800);
      doc.text("Property Photos", margin, 22);

      // 4 per row, 2 rows max — thumbnails at ~40×30 mm each
      const cols = 4;
      const thumbW = (pageWidth - margin * 2 - (cols - 1) * 2) / cols; // ~40mm
      const thumbH = thumbW * 0.75; // 4:3
      const startY = 27;

      validPhotos.forEach((b64, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + col * (thumbW + 2);
        const y = startY + row * (thumbH + 2);
        try {
          doc.addImage(b64, "JPEG", x, y, thumbW, thumbH);
        } catch {
          // skip unreadable image
        }
      });
    }
  }

  // ===========================
  // PAGE 2 — Monthly Projections
  // ===========================
  doc.addPage();
  addHeader("Monthly Revenue Projections");

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_800);
  doc.text("Monthly Revenue Projections (After All Fees)", margin, 22);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE_500);
  doc.text("Three occupancy scenarios based on historical Cape Town seasonality patterns.", margin, 27);

  let tableStartY = 31;
  if (chartImageData) {
    const imgW = pageWidth - margin * 2;
    const imgH = Math.min(imgW / chartAspectRatio, 90);
    doc.addImage(chartImageData, 'PNG', margin, 31, imgW, imgH);
    tableStartY = 31 + imgH + 6;
  }

  const mgmtMultiplier = mgmtFee > 0 ? 1 - mgmtFee : 1;
  const monthlyBody = MONTHS.map((month, i) => {
    const days = new Date(2023, i + 1, 0).getDate();
    const seasonal = stNightly * SEASONALITY_FACTORS[i];
    const net = seasonal * (1 - platformRate) * mgmtMultiplier;
    return [
      month,
      fmt(seasonal),
      fmt(net * (OCCUPANCY_RATES.low[i] / 100) * days),
      fmt(net * (OCCUPANCY_RATES.medium[i] / 100) * days),
      fmt(net * (OCCUPANCY_RATES.high[i] / 100) * days),
      fmt(ltMonthly),
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [["Month", "Seasonal Rate", "Conservative", "Moderate", "Optimistic", "Long-Term"]],
    body: monthlyBody,
    theme: "striped",
    styles: { fontSize: 8, cellPadding: 2.5, halign: "right" },
    headStyles: { fillColor: SLATE_800, textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 16 },
      2: { textColor: [239, 68, 68] },
      3: { textColor: [234, 88, 12] },
      4: { textColor: [22, 163, 74] },
      5: { textColor: PURPLE },
    },
    margin: { left: margin, right: margin },
  });

  // ===========================
  // PAGE 3 — Disclaimer
  // ===========================
  doc.addPage();
  addHeader("Disclaimer & Legal Notice");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SLATE_800);
  doc.text("Disclaimer & Legal Notice", margin, 24);

  const disclaimer = [
    "This report has been prepared by Proply Technology (Pty) Ltd for informational purposes only. All figures, projections and analysis contained herein are indicative only and are based on the inputs provided at the time of analysis.",
    "",
    "IMPORTANT: This report does not constitute financial, legal, tax, or investment advice. The information contained in this report should not be relied upon as the sole basis for any investment decision. You should seek independent financial and legal advice before making any investment decisions.",
    "",
    "Occupancy projections are estimates based on historical patterns and market conditions and are not guaranteed. Actual results may differ materially from those projected. Past performance is not indicative of future results.",
    "",
    "Short-term rental regulations and platform requirements may change. It is the responsibility of the property owner to ensure compliance with all applicable laws, regulations, and platform terms of service in the relevant jurisdiction.",
    "",
    `© ${new Date().getFullYear()} Proply Tech (Pty) Ltd. All rights reserved. This report is confidential and intended solely for the use of the individual or entity to whom it is addressed.`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  let dy = 32;
  for (const line of disclaimer) {
    if (!line) { dy += 3; continue; }
    const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2);
    doc.text(wrapped, margin, dy);
    dy += wrapped.length * 5.5;
  }

  // --- Footers on all pages ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(p, totalPages);
  }

  const safeName = property.address.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  doc.save(`Rent Compare Report - ${safeName}.pdf`);
}
