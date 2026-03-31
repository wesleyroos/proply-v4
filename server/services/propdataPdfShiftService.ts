/**
 * PDFShift-based property report generator.
 * Renders a styled HTML template via PDFShift (Chromium headless).
 */
import { db } from "../../db";
import {
  propdataListings,
  valuationReports,
  rentalPerformanceData,
  agencyBranches,
} from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import fs from "fs";
import path from "path";
import sharp from "sharp";

interface PropertyPdfData {
  property: any;
  valuationReport: any;
  rentalData: any;
  agencyLogoDataUri: string | null;
  proplyLogoDataUri: string | null;
}

export class PropdataPdfShiftService {
  private get apiKey(): string {
    return process.env.PDFSHIFT_API_KEY || "";
  }

  // ─── Public entry point ────────────────────────────────────────────────────
  async generatePropertyReport(propertyId: string): Promise<Buffer> {
    const data = await this.fetchPropertyData(propertyId);
    if (!data.property) throw new Error("Property not found");
    const html = await this.buildHtml(data);
    return await this.callPdfShift(html);
  }

  // ─── Data fetching ─────────────────────────────────────────────────────────
  private async fetchPropertyData(propertyId: string): Promise<PropertyPdfData> {
    console.log(`=== PDFShift Service: Fetching data for property ${propertyId} ===`);

    let property = await db.query.propdataListings.findFirst({
      where: eq(propdataListings.propdataId, propertyId),
    });

    if (!property) {
      const raw = await db.execute(
        `SELECT * FROM propdata_listings WHERE propdata_id = '${propertyId}' LIMIT 1`,
      );
      if (raw.rows.length > 0) property = raw.rows[0] as any;
    }

    if (!property) throw new Error(`Property ${propertyId} not found`);

    const valuationReport = await db.query.valuationReports.findFirst({
      where: eq(valuationReports.propertyId, propertyId),
      orderBy: [desc(valuationReports.updatedAt)],
    });

    const rentalData = await db.query.rentalPerformanceData.findFirst({
      where: eq(rentalPerformanceData.propertyId, propertyId),
    });

    // Merge financial analysis — prefer rental_performance_data, fall back to valuation_reports
    const mergedRentalData = rentalData
      ? {
          ...rentalData,
          financingAnalysisData:         rentalData.financingAnalysisData         ?? valuationReport?.financingAnalysisData,
          cashflowAnalysisData:           rentalData.cashflowAnalysisData           ?? valuationReport?.cashflowAnalysisData,
          annualPropertyAppreciationData: (rentalData as any).annualPropertyAppreciationData ?? valuationReport?.annualPropertyAppreciationData,
        }
      : valuationReport
        ? {
            financingAnalysisData:         valuationReport.financingAnalysisData,
            cashflowAnalysisData:           valuationReport.cashflowAnalysisData,
            annualPropertyAppreciationData: valuationReport.annualPropertyAppreciationData,
          }
        : null;

    // Agency logo
    let agencyLogoDataUri: string | null = null;
    if (property.branchId) {
      const branch = await db.query.agencyBranches.findFirst({
        where: eq(agencyBranches.id, property.branchId),
      });
      if (branch?.logoUrl) {
        const absolutePath = path.join(
          process.cwd(), "public",
          branch.logoUrl.replace("/static-assets/", "").replace(/^\//, "")
        );
        agencyLogoDataUri = await this.fileToDataUri(absolutePath, true);
        console.log("Agency logo loaded:", !!agencyLogoDataUri, "from", absolutePath);
      }
    }

    // Proply logo (dark version for white backgrounds)
    const proplyLogoDataUri = await this.fileToDataUri(
      path.join(process.cwd(), "client", "public", "proply-logo-auth.png"),
      true, // absolute path
    );

    return { property, valuationReport, rentalData: mergedRentalData, agencyLogoDataUri, proplyLogoDataUri };
  }

  // ─── File → base64 data URI ────────────────────────────────────────────────
  private async fileToDataUri(filePath: string, absolute = false): Promise<string | null> {
    try {
      const resolved = absolute ? filePath : (() => {
        if (filePath.startsWith("/static-assets/"))
          return path.join(process.cwd(), "public", filePath.replace("/static-assets/", ""));
        return path.join(process.cwd(), "public", filePath.replace(/^\//, ""));
      })();

      if (!fs.existsSync(resolved)) { console.warn("Logo not found:", resolved); return null; }

      const buf  = fs.readFileSync(resolved);
      const ext  = path.extname(resolved).toLowerCase();
      const mime = ext === ".png" ? "image/png"
                 : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
                 : ext === ".gif" ? "image/gif"
                 : ext === ".webp" ? "image/webp"
                 : "image/png";
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch (err) {
      console.error("Error loading file:", err);
      return null;
    }
  }

  // ─── URL → base64 data URI ─────────────────────────────────────────────────
  private async urlToDataUri(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf  = Buffer.from(await res.arrayBuffer());
      const ct   = res.headers.get("content-type") || "image/jpeg";
      return `data:${ct.split(";")[0].trim()};base64,${buf.toString("base64")}`;
    } catch { return null; }
  }

  // ─── Fetch, resize and compress image → small base64 JPEG ─────────────────
  private async fetchCompressedImage(url: string, width = 800): Promise<string | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const compressed = await sharp(buf)
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality: 72, progressive: true })
        .toBuffer();
      return `data:image/jpeg;base64,${compressed.toString("base64")}`;
    } catch { return null; }
  }

  // ─── Equity vs Balance SVG chart ──────────────────────────────────────────
  private buildEquityChart(yearlyMetrics: any): string {
    const years       = [1, 2, 3, 4, 5, 10, 20];
    const labels      = ["Y1", "Y2", "Y3", "Y4", "Y5", "Y10", "Y20"];
    const equityData  = years.map((y) => yearlyMetrics[`year${y}`]?.equityBuildup    || 0);
    const balanceData = years.map((y) => yearlyMetrics[`year${y}`]?.remainingBalance || 0);
    const maxVal      = Math.max(...equityData, ...balanceData, 1);

    const W = 660, H = 200;
    const PL = 68, PR = 20, PT = 15, PB = 32;
    const cW = W - PL - PR, cH = H - PT - PB;

    const xOf = (i: number) => PL + (cW * i) / (years.length - 1);
    const yOf = (v: number) => PT + cH - (v / maxVal) * cH;

    const fmtY = (v: number) =>
      v >= 1_000_000 ? `R${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000   ? `R${Math.round(v / 1_000)}k`
      : `R${Math.round(v)}`;

    let gridLines = "", yLabels = "", xLabels = "";
    for (let i = 0; i <= 4; i++) {
      const v = (maxVal * i) / 4;
      const y = yOf(v).toFixed(1);
      gridLines += `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="#e2e8f0" stroke-width="0.8"/>`;
      yLabels   += `<text x="${PL - 5}" y="${(parseFloat(y) + 3).toFixed(1)}" text-anchor="end" font-size="9" fill="#94a3b8" font-family="Inter,sans-serif">${fmtY(v)}</text>`;
    }
    labels.forEach((l, i) => {
      xLabels += `<text x="${xOf(i).toFixed(1)}" y="${H - 4}" text-anchor="middle" font-size="9" fill="#94a3b8" font-family="Inter,sans-serif">${l}</text>`;
    });

    const axes = `
      <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT + cH}" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="${PL}" y1="${PT + cH}" x2="${W - PR}" y2="${PT + cH}" stroke="#cbd5e1" stroke-width="1"/>`;

    const eqPts  = equityData.map((v, i)  => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");
    const balPts = balanceData.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");

    // Area fill under equity line
    const firstX = xOf(0).toFixed(1), lastX = xOf(years.length - 1).toFixed(1);
    const baseY  = (PT + cH).toFixed(1);
    const eqArea = `<polygon points="${eqPts} ${lastX},${baseY} ${firstX},${baseY}" fill="#1ba2ff" fill-opacity="0.07"/>`;

    const eqLine  = `<polyline points="${eqPts}"  fill="none" stroke="#1ba2ff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    const balLine = `<polyline points="${balPts}" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;

    let dots = "";
    equityData.forEach((v, i) => {
      dots += `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(v).toFixed(1)}" r="4" fill="white" stroke="#1ba2ff" stroke-width="2"/>`;
    });
    // Last equity dot filled
    dots += `<circle cx="${xOf(years.length-1).toFixed(1)}" cy="${yOf(equityData[equityData.length-1]).toFixed(1)}" r="4" fill="#1ba2ff" stroke="#1ba2ff" stroke-width="2"/>`;
    balanceData.forEach((v, i) => {
      dots += `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(v).toFixed(1)}" r="4" fill="white" stroke="#94a3b8" stroke-width="2"/>`;
    });
    dots += `<circle cx="${xOf(years.length-1).toFixed(1)}" cy="${yOf(balanceData[balanceData.length-1]).toFixed(1)}" r="4" fill="#94a3b8" stroke="#94a3b8" stroke-width="2"/>`;

    return `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
        ${gridLines}${axes}${eqArea}${eqLine}${balLine}${dots}${yLabels}${xLabels}
      </svg>
      <div style="display:flex;gap:20px;margin-top:10px;">
        <div style="display:flex;align-items:center;gap:7px;font-size:10px;color:#475569;">
          <span style="display:inline-block;width:22px;height:2.5px;background:#1ba2ff;border-radius:2px;"></span>Equity Built
        </div>
        <div style="display:flex;align-items:center;gap:7px;font-size:10px;color:#475569;">
          <span style="display:inline-block;width:22px;height:2.5px;background:#94a3b8;border-radius:2px;"></span>Remaining Balance
        </div>
      </div>`;
  }

  // ─── CSS ───────────────────────────────────────────────────────────────────
  private get css(): string {
    return `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { size: A4; margin: 0; }

      :root {
        --blue:       #1ba2ff;
        --blue-dark:  #0f86d9;
        --blue-faint: #eff8ff;
        --ink:        #0d1b2a;
        --body:       #334155;
        --muted:      #64748b;
        --label:      #94a3b8;
        --border:     #e2e8f0;
        --surface:    #f8fafc;
        --green:      #16a34a;
        --green-bg:   #f0fdf4;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: var(--ink);
        background: white;
        font-size: 9pt;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }

      /* ── Header ── */
      .report-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 22px 42px 20px;
        border-bottom: 3px solid var(--blue);
      }
      .header-left { display: flex; align-items: center; gap: 18px; }
      .header-divider { width: 1px; height: 30px; background: var(--border); }
      .report-type { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--blue); }
      .report-date { font-size: 10px; color: var(--muted); margin-top: 2px; }
      .agency-logo-wrapper img { height: 44px; max-width: 160px; object-fit: contain; }
      .powered-by { display: flex; align-items: center; gap: 7px; }
      .powered-by-text { font-size: 8px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--label); white-space: nowrap; }
      .powered-by img { height: 22px; object-fit: contain; }

      /* ── Hero ── */
      .property-hero {
        padding: 34px 42px 0;
        background: linear-gradient(160deg, #f0f7ff 0%, #fafcff 60%, white 100%);
      }
      .property-badge {
        display: inline-flex; align-items: center; gap: 5px;
        background: var(--blue-faint); color: var(--blue-dark);
        font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
        padding: 4px 10px; border-radius: 20px; margin-bottom: 14px;
      }
      .property-badge::before {
        content: ''; width: 5px; height: 5px; background: var(--blue); border-radius: 50%;
      }
      .property-address {
        font-size: 24px; font-weight: 800; color: var(--ink);
        line-height: 1.15; letter-spacing: -0.025em; margin-bottom: 18px;
      }
      .price-label { font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--label); margin-bottom: 4px; }
      .price-value { font-size: 32px; font-weight: 600; color: var(--ink); letter-spacing: -0.04em; line-height: 1; margin-bottom: 20px; }
      .hero-stats-grid {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 1px; background: var(--border);
        border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
        margin-bottom: 28px;
      }
      .hero-stat { background: white; padding: 14px 18px; }
      .hero-stat .stat-label { font-size: 8.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.09em; color: var(--label); margin-bottom: 4px; }
      .hero-stat .stat-value { font-size: 17px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.15; }
      .hero-stat .stat-sub   { font-size: 9px; color: var(--muted); margin-top: 3px; }

      /* ── Stat bar ── */
      .stat-bar-wrapper { padding: 0 42px; border-bottom: 1px solid var(--border); }
      .stat-bar { display: grid; grid-template-columns: repeat(8,1fr); }
      .stat-bar-item { padding: 13px 0 13px 18px; border-right: 1px solid var(--border); }
      .stat-bar-item:last-child { border-right: none; }
      .stat-bar-item .s-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--label); margin-bottom: 5px; }
      .stat-bar-item .s-value { font-size: 11.5px; font-weight: 700; color: var(--ink); }

      /* ── Media ── */
      .media-row-wrapper { padding: 12px 42px 16px; border-bottom: 1px solid var(--border); }
      .media-row { display: grid; grid-template-columns: 1fr 1fr; height: 210px; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
      .media-panel { overflow: hidden; position: relative; }
      .media-panel:first-child { border-right: 1px solid var(--border); }
      .media-panel img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .media-label {
        position: absolute; bottom: 10px; left: 10px;
        background: rgba(0,0,0,.55); color: white;
        font-size: 9px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
        padding: 3px 8px; border-radius: 3px;
      }
      .media-placeholder {
        width: 100%; height: 100%; background: var(--surface);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 6px; color: var(--label); font-size: 11px;
      }

      /* ── Sections ── */
      .section { padding: 30px 42px 28px; border-bottom: 1px solid var(--border); }
      .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
      .section-accent { width: 3px; height: 20px; background: var(--blue); border-radius: 2px; flex-shrink: 0; }
      .section-title { font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink); }
      .section-rule { flex: 1; height: 1px; background: var(--border); }
      .subsection-title { font-size: 11.5px; font-weight: 600; color: var(--ink); margin: 18px 0 10px; }
      .subsection-title:first-child { margin-top: 0; }
      .body-text { font-size: 11px; color: var(--body); line-height: 1.75; margin-bottom: 14px; }

      /* ── Mini stat cards ── */
      .mini-stats { display: grid; gap: 8px; margin-bottom: 16px; }
      .mini-stats.c3 { grid-template-columns: repeat(3,1fr); }
      .mini-stats.c4 { grid-template-columns: repeat(4,1fr); }
      .mini-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; }
      .mc-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--label); margin-bottom: 5px; }
      .mc-value { font-size: 13.5px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
      .mc-sub   { font-size: 9.5px; color: var(--muted); margin-top: 2px; }

      /* ── Tables ── */
      table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 4px; }
      thead th {
        background: var(--surface); padding: 8px 12px;
        font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
        color: var(--muted); border: 1px solid var(--border); text-align: left; white-space: nowrap;
      }
      thead th.r { text-align: right; }
      tbody td { padding: 7.5px 12px; border: 1px solid #eceff4; color: var(--body); vertical-align: middle; }
      tbody td.r { text-align: right; }
      tbody td.b { font-weight: 700; color: var(--ink); }
      tbody td.blue { color: var(--blue); font-weight: 700; }
      tbody tr:nth-child(even) td { background: #fafbfc; }
      tbody tr.hl td { background: var(--blue-faint); font-weight: 600; color: var(--ink); }

      /* ── Page break control ── */
      .section-header { break-after: avoid; page-break-after: avoid; }
      .subsection-title { break-after: avoid; page-break-after: avoid; margin-bottom: 12px; }
      table { break-inside: avoid; page-break-inside: avoid; }
      .mini-stats { break-inside: avoid; page-break-inside: avoid; }
      .hero-stats-grid { break-inside: avoid; page-break-inside: avoid; }
      .chart-wrap { break-inside: avoid; page-break-inside: avoid; margin-top: 8px; }
      .media-row-wrapper { break-inside: avoid; page-break-inside: avoid; }
      .financial-section { break-before: always; page-break-before: always; }

      /* ── Badge ── */
      .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; }
      .badge-green { background: var(--green-bg); color: #16a34a; }

      /* ── Disclaimer + Footer (last page) ── */
      .last-page { break-before: always; page-break-before: always; display: flex; flex-direction: column; min-height: 220mm; }
      .last-page-spacer { flex: 1; }
      .disclaimer-section { padding: 22px 42px 18px; background: var(--surface); border-top: 1px solid var(--border); }
      .disclaimer-title { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--label); margin-bottom: 8px; }
      .disclaimer-text { font-size: 9px; color: var(--label); line-height: 1.8; }
      .report-footer {
        display: flex; align-items: center; justify-content: space-between;
        padding: 13px 42px; border-top: 1px solid var(--border);
      }
      .footer-left { display: flex; align-items: center; gap: 8px; font-size: 10px; color: var(--label); }
      .footer-right { font-size: 10px; color: var(--label); }
    `;
  }

  // ─── HTML builder ─────────────────────────────────────────────────────────
  private async buildHtml(data: PropertyPdfData): Promise<string> {
    const p  = data.property;
    const vr = data.valuationReport;
    const rd = data.rentalData;
    const vd = vr?.valuationData as any;

    const esc = (s: any)  => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const fmt = (n: any)  => n != null ? `R${Number(n).toLocaleString("en-ZA")}` : "N/A";
    const pct = (n: any)  => n != null ? `${Number(n).toFixed(1)}%` : "N/A";
    const dateStr = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

    // ── Compute hero stats ──
    const ltr = vd?.rentalPerformance?.longTerm;
    const str = vd?.rentalPerformance?.shortTerm;

    const ltrYieldRange = (ltr?.minYield != null && ltr?.maxYield != null)
      ? `${ltr.minYield}% – ${ltr.maxYield}%` : "N/A";

    // STR yield range from percentile25/75 annual / price
    let strYieldRange = "N/A";
    if (str && p.price) {
      const p25Yield = str.percentile25?.annual ? (str.percentile25.annual / Number(p.price) * 100).toFixed(1) : null;
      const p75Yield = str.percentile75?.annual ? (str.percentile75.annual / Number(p.price) * 100).toFixed(1) : null;
      if (p25Yield && p75Yield) strYieldRange = `${p25Yield}% – ${p75Yield}%`;
    }

    const apprRate   = rd?.annualPropertyAppreciationData?.finalAppreciationRate;
    const proj10yr   = rd?.annualPropertyAppreciationData?.yearlyValues?.year10;

    // ── Map — fetch and compress to keep PDF size small ──
    let mapContent = `<div class="media-placeholder">📍 Map unavailable</div>`;
    if (p.address) {
      try {
        const geoRes  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(p.address)}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`);
        const geoData = await geoRes.json();
        if (geoData.results?.[0]?.geometry) {
          const { lat, lng } = geoData.results[0].geometry.location;
          const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x400&format=jpg&maptype=roadmap&markers=color:0x1ba2ff%7C${lat},${lng}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;
          const mapUri = await this.fetchCompressedImage(mapUrl, 600);
          if (mapUri) mapContent = `<img src="${mapUri}" alt="Map"/><div class="media-label">Location Map</div>`;
        }
      } catch { /* placeholder */ }
    }

    // ── Property image — fetch and compress to keep PDF size small ──
    let imgContent = `<div class="media-placeholder">🏠 No image available</div>`;
    const imageUrl = p.images?.[0] || p.imageUrls?.[0] || p.mainImage || p.primaryImage;
    if (imageUrl) {
      try {
        const imgUri = await this.fetchCompressedImage(imageUrl, 800);
        if (imgUri) imgContent = `<img src="${imgUri}" alt="Property"/><div class="media-label">Property</div>`;
      } catch { /* placeholder */ }
    }

    // ── Agency logo (left, no box) ──
    const agencyLogoHtml = data.agencyLogoDataUri
      ? `<div class="agency-logo-wrapper"><img src="${data.agencyLogoDataUri}" alt="Agency"/></div>`
      : "";

    // ── Powered by Proply (right) ──
    const proplyLogoHtml = `<div class="powered-by">
      <span class="powered-by-text">Powered by</span>
      ${data.proplyLogoDataUri
        ? `<img src="${data.proplyLogoDataUri}" alt="Proply">`
        : `<span style="font-size:13px;font-weight:900;color:#0d1b2a;">proply</span>`}
    </div>`;

    // ── Valuation section ──
    let valuationHtml = "";
    if (vd) {
      valuationHtml = `<div class="section"><div class="section-header"><div class="section-accent"></div><span class="section-title">Valuation Analysis</span><div class="section-rule"></div></div>`;

      if (vd.summary) {
        valuationHtml += `<p class="body-text">${esc(vd.summary)}</p>`;
      }

      if (vd.valuations?.length) {
        valuationHtml += `<div class="subsection-title">Valuation Estimates</div>`;
        const rows = vd.valuations.map((v: any) => `
          <tr>
            <td class="b">${esc(v.type || "")}</td>
            <td style="text-align:center;">${esc(v.formula || "N/A")}</td>
            <td class="r blue">${fmt(v.value)}</td>
          </tr>`).join("");
        valuationHtml += `<table><thead><tr><th>Estimate Type</th><th style="text-align:center;">Formula</th><th class="r">Valuation</th></tr></thead><tbody>${rows}</tbody></table>`;
      }

      if (vd.marketContext) {
        valuationHtml += `<div class="subsection-title">Market Context</div><p class="body-text" style="margin:0;">${esc(vd.marketContext)}</p>`;
      }

      valuationHtml += `</div>`;
    }

    // ── Rental Performance section ──
    let rentalHtml = "";
    if (vd?.rentalPerformance) {
      const rp = vd.rentalPerformance;
      rentalHtml = `<div class="section"><div class="section-header"><div class="section-accent"></div><span class="section-title">Rental Performance Analysis</span><div class="section-rule"></div></div>`;

      if (rp.longTerm) {
        const lt = rp.longTerm;
        rentalHtml += `<div class="subsection-title" style="margin-top:0;">Long-Term Rental</div>`;
        rentalHtml += `<div class="mini-stats c4">
          ${this.miniCard("Monthly Range",   `${fmt(lt.minRental)} – ${fmt(lt.maxRental)}`)}
          ${this.miniCard("Gross Yield Range", `${lt.minYield ?? "N/A"}% – ${lt.maxYield ?? "N/A"}%`, undefined, "#16a34a")}
          ${this.miniCard("Annual Revenue",  `${fmt(lt.minRental ? lt.minRental * 12 : null)} – ${fmt(lt.maxRental ? lt.maxRental * 12 : null)}`)}
          ${this.miniCard("Strategy",        "Long-term let", "12-month lease")}
        </div>`;
        if (lt.reasoning) {
          rentalHtml += `<p class="body-text">${esc(lt.reasoning)}</p>`;
        }
      }

      if (rp.shortTerm) {
        const st = rp.shortTerm;
        const price = Number(p.price) || 1;

        const strYields = [
          { key: "percentile25", label: "STR Yield — Conservative", pctLabel: "25th percentile" },
          { key: "percentile50", label: "STR Yield — Median",       pctLabel: "50th percentile" },
          { key: "percentile75", label: "STR Yield — Premium",      pctLabel: "75th percentile" },
        ].filter((l) => st[l.key]?.annual);

        rentalHtml += `<div class="subsection-title">Short-Term Rental (Airbnb)</div>`;
        rentalHtml += `<div class="mini-stats c4">
          ${this.miniCard("Avg Occupancy", st.occupancy ? `${st.occupancy}%` : "N/A")}
          ${strYields.map((l) => {
            const yld = ((st[l.key].annual / price) * 100).toFixed(1);
            return this.miniCard(l.label, `${yld}%`, l.pctLabel, "#16a34a");
          }).join("")}
        </div>`;

        const pLevels = [
          { key: "percentile25", label: "25th — Conservative" },
          { key: "percentile50", label: "50th — Average"      },
          { key: "percentile75", label: "75th — Premium"      },
          { key: "percentile90", label: "90th — Luxury"       },
        ].filter((l) => st[l.key]);

        if (pLevels.length) {
          const rows = pLevels.map((l, idx) => {
            const d = st[l.key];
            const hl = idx === 1 ? ' class="hl"' : "";
            return `<tr${hl}><td>${l.label}</td><td class="r">${fmt(d.nightly)}</td><td class="r">${fmt(d.monthly)}</td><td class="r b">${fmt(d.annual)}</td></tr>`;
          }).join("");
          rentalHtml += `<table><thead><tr><th>Performance Level</th><th class="r">Nightly Rate</th><th class="r">Monthly Income</th><th class="r">Annual Income</th></tr></thead><tbody>${rows}</tbody></table>`;
        }
      }

      rentalHtml += `</div>`;
    }

    // ── Financial Analysis section ──
    let financialHtml = "";
    if (rd?.financingAnalysisData || rd?.cashflowAnalysisData || rd?.annualPropertyAppreciationData) {
      financialHtml = `<div class="section financial-section"><div class="section-header"><div class="section-accent"></div><span class="section-title">Financial Analysis</span><div class="section-rule"></div></div>`;

      if (rd?.financingAnalysisData) {
        const fin = rd.financingAnalysisData.financingParameters;
        const ym  = rd.financingAnalysisData.yearlyMetrics;

        if (fin) {
          financialHtml += `<div class="subsection-title" style="margin-top:0;">Financing Parameters</div>`;
          financialHtml += `<div class="mini-stats c4">
            ${this.miniCard("Deposit",       `${fmt(Math.round(fin.depositAmount))}`, `${fin.depositPercentage}% of purchase price`)}
            ${this.miniCard("Loan Amount",   fmt(Math.round(fin.loanAmount)))}
            ${this.miniCard("Interest Rate", `${fin.interestRate}%`, "Prime-linked")}
            ${this.miniCard("Loan Term",     `${fin.loanTerm} years`)}
          </div>`;
        }

        if (ym) {
          const yrs = [1, 2, 3, 4, 5, 10, 20];
          const mkRow = (label: string, key: string) =>
            `<tr><td>${label}</td>${yrs.map((y) => {
              const v = Math.round(ym[`year${y}`]?.[key] || 0);
              const cls = (key === "equityBuildup" || key === "remainingBalance") && y >= 10 ? ' class="blue b"' : "";
              return `<td class="r"${cls}>${fmt(v)}</td>`;
            }).join("")}</tr>`;

          financialHtml += `<div class="subsection-title">Bond & Equity Schedule</div>`;
          financialHtml += `<table><thead><tr><th>Metric</th>${yrs.map((y) => `<th class="r">Y${y}</th>`).join("")}</tr></thead><tbody>
            ${mkRow("Monthly Bond Payment", "monthlyPayment")}
            ${mkRow("Equity Build-up",      "equityBuildup")}
            ${mkRow("Remaining Balance",    "remainingBalance")}
          </tbody></table>`;

          financialHtml += `<div class="subsection-title">Equity Build-up vs. Remaining Loan Balance</div>`;
          financialHtml += `<p class="body-text" style="margin-bottom:12px;">Loan paydown and equity accumulation over the mortgage term</p>`;
          financialHtml += `<div class="chart-wrap" style="margin-bottom:20px;">${this.buildEquityChart(ym)}</div>`;
        }
      }

      if (rd?.cashflowAnalysisData?.revenueGrowthTrajectory) {
        const traj = rd.cashflowAnalysisData.revenueGrowthTrajectory;
        financialHtml += `<div class="subsection-title">Revenue Projections — 8% Annual Growth</div>`;
        financialHtml += `<p class="body-text" style="margin-bottom:12px;">Projected annual revenue and gross yields over five years</p>`;

        const pKeys = [
          { key: "percentile25", label: "STR 25th (Conservative)" },
          { key: "percentile50", label: "STR 50th (Median)"       },
          { key: "percentile75", label: "STR 75th (Optimistic)"   },
          { key: "percentile90", label: "STR 90th (Premium)"      },
        ];

        let projRows = "";
        if (traj.shortTerm) {
          pKeys.forEach(({ key, label }) => {
            const pd = traj.shortTerm[key];
            if (!pd) return;
            const isMedian = key === "percentile50";
            const hlClass = isMedian ? ' class="hl"' : "";
            projRows += `<tr${hlClass}><td>${label} — Revenue</td>${[1,2,3,4,5].map((y) => `<td class="r">${fmt(Math.round(pd[`year${y}`]?.revenue || 0))}</td>`).join("")}</tr>`;
            projRows += `<tr${hlClass}><td>${label} — Gross Yield</td>${[1,2,3,4,5].map((y) => `<td class="r">${(pd[`year${y}`]?.grossYield || 0).toFixed(1)}%</td>`).join("")}</tr>`;
          });
        }
        if (traj.longTerm) {
          projRows += `<tr><td>Long-term — Revenue</td>${[1,2,3,4,5].map((y) => `<td class="r">${fmt(Math.round(traj.longTerm[`year${y}`]?.revenue || 0))}</td>`).join("")}</tr>`;
          projRows += `<tr><td>Long-term — Gross Yield</td>${[1,2,3,4,5].map((y) => `<td class="r">${(traj.longTerm[`year${y}`]?.grossYield || 0).toFixed(1)}%</td>`).join("")}</tr>`;
        }

        if (projRows) {
          financialHtml += `<table><thead><tr><th>Strategy</th>${["Year 1","Year 2","Year 3","Year 4","Year 5"].map((h) => `<th class="r">${h}</th>`).join("")}</tr></thead><tbody>${projRows}</tbody></table>`;
        }
      }

      if (rd?.annualPropertyAppreciationData) {
        const appr = rd.annualPropertyAppreciationData;
        financialHtml += `<div class="subsection-title">Property Value Appreciation</div>`;
        financialHtml += `<div style="margin-bottom:12px;"><span class="badge badge-green">Annual appreciation rate: ${appr.finalAppreciationRate ?? "N/A"}%</span></div>`;

        if (appr.yearlyValues) {
          const kys   = ["year1","year2","year3","year4","year5","year10","year20"].filter((k) => appr.yearlyValues[k]);
          const hdrs  = kys.map((k) => `Year ${k.replace("year", "")}`);
          const cells = kys.map((k) => {
            const cls = k === "year10" || k === "year20" ? ' class="blue b r"' : ' class="r"';
            return `<td${cls}>${fmt(Math.round(appr.yearlyValues[k]))}</td>`;
          }).join("");
          financialHtml += `<table><thead><tr><th>Metric</th>${hdrs.map((h) => `<th class="r">${h}</th>`).join("")}</tr></thead><tbody><tr><td class="b">Estimated Value</td>${cells}</tr></tbody></table>`;

          if (appr.reasoning) {
            financialHtml += `<p class="body-text" style="margin-top:10px;margin-bottom:0;">${esc(appr.reasoning)}</p>`;
          }
        }
      }

      financialHtml += `</div>`;
    }

    // ── Additional Details ──
    const detailsHtml = `<div class="section">
      <div class="section-header"><div class="section-accent"></div><span class="section-title">Additional Details</span><div class="section-rule"></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;">
        <div>
          ${p.agent || p.agentName ? `
            <div class="subsection-title" style="margin-top:0;">Agent Information</div>
            <p class="body-text" style="margin-bottom:2px;">${esc(p.agent?.name || p.agentName || "")}</p>
            ${p.agent?.phone ? `<p class="body-text" style="margin-bottom:2px;">${esc(p.agent.phone)}</p>` : ""}
            ${p.agent?.email ? `<p class="body-text" style="margin-bottom:0;">${esc(p.agent.email)}</p>` : ""}
          ` : ""}
        </div>
        <div>
          <div class="subsection-title" style="margin-top:0;">Listing Information</div>
          <p class="body-text" style="margin-bottom:2px;">Property ID: ${esc(p.propdataId)}</p>
          <p class="body-text" style="margin-bottom:2px;">Status: ${esc(p.status)}</p>
          <p class="body-text" style="margin-bottom:0;">Last Updated: ${new Date(p.lastModified || new Date()).toLocaleDateString("en-ZA")}</p>
        </div>
      </div>
      <p style="font-size:9px;color:var(--label);margin-top:14px;">Report generated ${dateStr} by Proply Tech (Pty) Ltd. Valid for 30 days from generation date.</p>
    </div>`;

    // ── Disclaimer ──
    const disclaimerHtml = `<div class="disclaimer-section">
      <div class="disclaimer-title">Disclaimers &amp; Legal Notices</div>
      <p class="disclaimer-text">The information in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While every effort is made to ensure accuracy, we cannot guarantee the absolute accuracy or completeness of the data. This report does not constitute financial, investment, legal, or professional advice. Property investment carries inherent risks and market conditions can change. Any decisions made based on this information are solely the responsibility of the user. Proply Tech (Pty) Ltd expressly disclaims any liability for direct, indirect, incidental, or consequential damages arising from use of this report. Projections and estimates are indicative only and based on data available at the time of generation.</p>
    </div>`;

    // ── Footer ──
    const footerHtml = `<div class="report-footer">
      <div class="footer-left">
        ${data.proplyLogoDataUri ? `<img src="${data.proplyLogoDataUri}" alt="Proply" style="height:16px;object-fit:contain;opacity:0.35;">` : ""}
        <span>© ${new Date().getFullYear()} Proply Tech (Pty) Ltd · Property Investment Report · For informational purposes only</span>
      </div>
      <div class="footer-right">Confidential</div>
    </div>`;

    // ── Stat bar ──
    const statBar = [
      { label: "Bedrooms",     value: p.bedrooms      != null ? String(p.bedrooms)      : "N/A" },
      { label: "Bathrooms",    value: p.bathrooms     != null ? String(p.bathrooms)     : "N/A" },
      { label: "Floor Size",   value: p.floorSize              ? `${p.floorSize} m²`    : "N/A" },
      { label: "Land Size",    value: p.landSize               ? `${p.landSize} m²`     : "N/A" },
      { label: "Parking",      value: p.parkingSpaces != null ? String(p.parkingSpaces) : "N/A" },
      { label: "Monthly Levy", value: fmt(p.monthlyLevy) },
      { label: "Status",       value: esc(p.status || "N/A") },
      { label: "Type",         value: esc(p.propertyType || "N/A") },
    ].map((s) => `<div class="stat-bar-item"><div class="s-label">${s.label}</div><div class="s-value">${s.value}</div></div>`).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${this.css}</style>
</head>
<body>

<div class="report-header">
  <div class="header-left">
    ${agencyLogoHtml}
    <div class="header-divider"></div>
    <div>
      <div class="report-type">Property Investment Report</div>
      <div class="report-date">${dateStr}</div>
    </div>
  </div>
  ${proplyLogoHtml}
</div>

<div class="property-hero">
  <div class="property-badge">${esc(p.propertyType || "Residential")} · For Sale</div>
  <h1 class="property-address">${esc(p.address || "Address not available")}</h1>
  <div class="price-label">Asking Price</div>
  <div class="price-value">${fmt(p.price)}</div>

  <div class="hero-stats-grid">
    <div class="hero-stat">
      <div class="stat-label">LTR Gross Yield</div>
      <div class="stat-value" style="color:#16a34a;">${ltrYieldRange}</div>
      <div class="stat-sub">Long-term rental · 12-month lease</div>
    </div>
    <div class="hero-stat">
      <div class="stat-label">STR Gross Yield</div>
      <div class="stat-value" style="color:#16a34a;">${strYieldRange}</div>
      <div class="stat-sub">Short-term rental · 25th–75th percentile</div>
    </div>
    <div class="hero-stat">
      <div class="stat-label">Annual Appreciation</div>
      <div class="stat-value">${apprRate != null ? `${apprRate}% p.a.` : "N/A"}</div>
      <div class="stat-sub">Based on suburb &amp; location premium</div>
    </div>
    <div class="hero-stat">
      <div class="stat-label">Projected Value (10yr)</div>
      <div class="stat-value">${proj10yr ? fmt(Math.round(proj10yr)) : "N/A"}</div>
      <div class="stat-sub">From ${fmt(p.price)} at ${apprRate ?? "N/A"}% p.a.</div>
    </div>
  </div>
</div>

<div class="stat-bar-wrapper"><div class="stat-bar">${statBar}</div></div>

<div class="media-row-wrapper">
  <div class="media-row">
    <div class="media-panel">${mapContent}</div>
    <div class="media-panel">${imgContent}</div>
  </div>
</div>

${valuationHtml}
${rentalHtml}
${financialHtml}
<div class="last-page">
  ${detailsHtml}
  <div class="last-page-spacer"></div>
  ${disclaimerHtml}
  ${footerHtml}
</div>

</body>
</html>`;
  }

  // ─── HTML helpers ─────────────────────────────────────────────────────────
  private miniCard(label: string, value: string, sub?: string, valueColor?: string): string {
    const colorStyle = valueColor ? ` style="color:${valueColor};"` : "";
    return `<div class="mini-card">
      <div class="mc-label">${label}</div>
      <div class="mc-value"${colorStyle}>${value}</div>
      ${sub ? `<div class="mc-sub">${sub}</div>` : ""}
    </div>`;
  }

  // ─── PDFShift API call ─────────────────────────────────────────────────────
  private async callPdfShift(html: string): Promise<Buffer> {
    if (!this.apiKey) throw new Error("PDFSHIFT_API_KEY environment variable not set");

    console.log(`Calling PDFShift API, HTML size: ${html.length} chars`);

    const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
      method: "POST",
      headers: {
        Authorization:  "Basic " + Buffer.from(`api:${this.apiKey}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source:    html,
        landscape: false,
        use_print: false,
        format:    "A4",
        margin:    { top: "28mm", bottom: "16mm", left: "0mm", right: "0mm" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("PDFShift error:", response.status, err);
      throw new Error(`PDFShift API error ${response.status}: ${err}`);
    }

    const buf = Buffer.from(await response.arrayBuffer());
    console.log(`PDFShift returned PDF: ${buf.length} bytes`);
    return buf;
  }

  // ─── Static factory ───────────────────────────────────────────────────────
  static async generateReport(propertyId: string): Promise<Buffer> {
    const service = new PropdataPdfShiftService();
    return service.generatePropertyReport(propertyId);
  }
}
