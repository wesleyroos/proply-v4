/**
 * PDFShift-based property report generator.
 * Renders an HTML template via PDFShift (Chromium headless) for pixel-perfect output.
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

interface PropertyPdfData {
  property: any;
  valuationReport: any;
  rentalData: any;
  agencyLogoDataUri: string | null;
  proplyLogoSvg: string;
}

// ─── Proply brand SVG logo (inline, no file load needed) ──────────────────────
const PROPLY_LOGO_SVG = `<svg width="100" height="33" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.6 30H11.76V10.56H18.16C20.4533 10.56 22.4 10.9067 24 11.6C25.6 12.2933 26.8 13.3067 27.6 14.64C28.4 15.9733 28.8 17.6 28.8 19.52C28.8 21.44 28.4 23.0667 27.6 24.4C26.8 25.7333 25.6 26.7467 24 27.44C22.4 28.1333 20.32 28.48 17.76 28.48L17.6 30ZM15.2 26.4H17.6C19.2 26.4 20.5067 26.2133 21.52 25.84C22.5333 25.4667 23.28 24.88 23.76 24.08C24.24 23.28 24.48 22.2133 24.48 20.88V18.16C24.48 16.8267 24.24 15.76 23.76 14.96C23.28 14.16 22.5333 13.5733 21.52 13.2C20.5067 12.8267 19.2 12.64 17.6 12.64H15.2V26.4Z" fill="#0f172a"/><path d="M41.4 30.4C39.3067 30.4 37.5733 29.92 36.2 28.96C34.8267 28 33.8133 26.6667 33.16 24.96C32.5067 23.2533 32.18 21.28 32.18 19.04C32.18 16.8 32.5067 14.8267 33.16 13.12C33.8133 11.4133 34.8267 10.08 36.2 9.12C37.5733 8.16 39.3067 7.68 41.4 7.68C43.4933 7.68 45.2267 8.16 46.6 9.12C47.9733 10.08 49 11.4133 49.68 13.12C50.36 14.8267 50.7 16.8 50.7 19.04C50.7 21.28 50.36 23.2533 49.68 24.96C49 26.6667 47.9733 28 46.6 28.96C45.2267 29.92 43.4933 30.4 41.4 30.4ZM41.4 28.16C42.84 28.16 44 27.84 44.88 27.2C45.76 26.56 46.4 25.6533 46.8 24.48C47.2 23.3067 47.4 21.8933 47.4 20.24V17.84C47.4 16.1867 47.2 14.7733 46.8 13.6C46.4 12.4267 45.76 11.52 44.88 10.88C44 10.24 42.84 9.92 41.4 9.92C39.96 9.92 38.8 10.24 37.92 10.88C37.04 11.52 36.4 12.4267 36 13.6C35.6 14.7733 35.4 16.1867 35.4 17.84V20.24C35.4 21.8933 35.6 23.3067 36 24.48C36.4 25.6533 37.04 26.56 37.92 27.2C38.8 27.84 39.96 28.16 41.4 28.16Z" fill="#0f172a"/><path d="M62.7969 30H56.9969V10.56H60.3969V13.68L60.5569 13.36C60.8236 12.8267 61.1969 12.2933 61.6769 11.76C62.1569 11.2267 62.7836 10.8 63.5569 10.48C64.3303 10.1333 65.3303 9.96 66.5569 9.96C67.1036 9.96 67.6369 10 68.1569 10.08C68.6769 10.16 69.0369 10.24 69.2369 10.32L68.4369 13.52C68.0503 13.3867 67.6636 13.28 67.2769 13.2C66.8903 13.12 66.4636 13.08 65.9969 13.08C65.0636 13.08 64.2503 13.28 63.5569 13.68C62.8636 14.0533 62.3303 14.56 61.9569 15.2C61.5836 15.84 61.3969 16.56 61.3969 17.36V30H62.7969Z" fill="#1ba2ff"/><path d="M80.5375 30.4C78.2441 30.4 76.3375 29.8933 74.8175 28.88C73.2975 27.8667 72.1775 26.4267 71.4575 24.56C70.7375 22.6933 70.3775 20.4533 70.3775 17.84V19.04C70.3775 16.5333 70.7775 14.3733 71.5775 12.56C72.3775 10.7467 73.5508 9.36 75.0975 8.4C76.6441 7.44 78.4841 6.96 80.6175 6.96C81.8975 6.96 83.1375 7.16 84.3375 7.56C85.5375 7.96 86.5775 8.6 87.4575 9.48L86.0975 11.56C85.4308 10.9467 84.6708 10.48 83.8175 10.16C82.9641 9.84 81.9375 9.68 80.7375 9.68C79.1908 9.68 77.8708 10.0267 76.7775 10.72C75.6841 11.4133 74.8441 12.4267 74.2575 13.76C73.6708 15.0933 73.3775 16.72 73.3775 18.64V17.72C73.3775 19.64 73.6708 21.2267 74.2575 22.48C74.8441 23.7333 75.6708 24.6933 76.7375 25.36C77.8041 26.0267 79.0841 26.36 80.5775 26.36C81.3241 26.36 82.1108 26.2933 82.9375 26.16C83.7641 26.0267 84.5375 25.7867 85.2575 25.44C85.9775 25.0933 86.5775 24.6267 87.0575 24.04L88.4175 26.04C87.7775 26.76 86.9775 27.36 86.0175 27.84C85.0575 28.32 84.0175 28.6667 82.8975 28.88C81.7775 29.0933 80.6441 29.2 79.4975 29.2L80.5375 30.4Z" fill="#1ba2ff"/><path d="M90.475 30V10.56H93.875V13.68L93.715 13.36C94.1383 12.5333 94.9117 11.76 96.035 11.04C97.1583 10.32 98.5383 9.96 100.155 9.96C102.102 9.96 103.622 10.48 104.715 11.52C105.808 12.5333 106.355 14.1333 106.355 16.32V30H102.955V17.2C102.955 15.76 102.622 14.6667 101.955 13.92C101.288 13.1733 100.262 12.8 98.875 12.8C97.7783 12.8 96.8183 13.04 95.995 13.52C95.1717 14 94.5383 14.6667 94.095 15.52C93.6517 16.3733 93.4783 17.3333 93.475 18.4V30H90.475Z" fill="#1ba2ff"/><path d="M110.025 30V6.56H113.425V17.92L112.905 21.44L113.225 24.96V30H110.025Z" fill="#1ba2ff"/><path d="M119.484 30.4C118.444 30.4 117.564 30.0667 116.844 29.4C116.124 28.7333 115.764 27.8267 115.764 26.68C115.764 25.5333 116.124 24.6267 116.844 23.96C117.564 23.2933 118.444 22.96 119.484 22.96C120.524 22.96 121.404 23.2933 122.124 23.96C122.844 24.6267 123.204 25.5333 123.204 26.68C123.204 27.8267 122.844 28.7333 122.124 29.4C121.404 30.0667 120.524 30.4 119.484 30.4Z" fill="#1ba2ff"/></svg>`;

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

    // Merge financial analysis fields — prefer rental_performance_data, fall back to valuation_reports
    const mergedRentalData = rentalData
      ? {
          ...rentalData,
          financingAnalysisData:          rentalData.financingAnalysisData          ?? valuationReport?.financingAnalysisData,
          cashflowAnalysisData:            rentalData.cashflowAnalysisData            ?? valuationReport?.cashflowAnalysisData,
          annualPropertyAppreciationData:  (rentalData as any).annualPropertyAppreciationData  ?? valuationReport?.annualPropertyAppreciationData,
        }
      : valuationReport
        ? {
            financingAnalysisData:          valuationReport.financingAnalysisData,
            cashflowAnalysisData:            valuationReport.cashflowAnalysisData,
            annualPropertyAppreciationData:  valuationReport.annualPropertyAppreciationData,
          }
        : null;

    // Load agency logo as base64 data URI
    let agencyLogoDataUri: string | null = null;
    if (property.branchId) {
      const branch = await db.query.agencyBranches.findFirst({
        where: eq(agencyBranches.id, property.branchId),
      });
      if (branch?.logoUrl) {
        agencyLogoDataUri = await this.fileToDataUri(branch.logoUrl);
        console.log("Agency logo loaded:", !!agencyLogoDataUri, "from", branch.logoUrl);
      }
    }

    return {
      property,
      valuationReport,
      rentalData: mergedRentalData,
      agencyLogoDataUri,
      proplyLogoSvg: PROPLY_LOGO_SVG,
    };
  }

  // ─── File → base64 data URI ────────────────────────────────────────────────
  private async fileToDataUri(logoUrl: string): Promise<string | null> {
    try {
      const filePath = logoUrl.startsWith("/static-assets/")
        ? path.join(process.cwd(), "public", logoUrl.replace("/static-assets/", ""))
        : path.join(process.cwd(), "public", logoUrl.replace(/^\//, ""));

      if (!fs.existsSync(filePath)) {
        console.warn("Logo file not found:", filePath);
        return null;
      }

      const buf  = fs.readFileSync(filePath);
      const ext  = path.extname(filePath).toLowerCase();
      const mime = ext === ".png" ? "image/png"
                 : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
                 : ext === ".gif" ? "image/gif"
                 : ext === ".webp" ? "image/webp"
                 : "image/png";

      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch (err) {
      console.error("Error loading logo:", err);
      return null;
    }
  }

  // ─── Fetch URL → base64 data URI ──────────────────────────────────────────
  private async urlToDataUri(url: string): Promise<string | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf  = Buffer.from(await res.arrayBuffer());
      const ct   = res.headers.get("content-type") || "image/jpeg";
      const mime = ct.split(";")[0].trim();
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch {
      return null;
    }
  }

  // ─── Equity vs Balance SVG chart ──────────────────────────────────────────
  private buildEquityChart(yearlyMetrics: any): string {
    const years       = [1, 2, 3, 4, 5, 10, 20];
    const labels      = ["Y1", "Y2", "Y3", "Y4", "Y5", "Y10", "Y20"];
    const equityData  = years.map((y) => yearlyMetrics[`year${y}`]?.equityBuildup    || 0);
    const balanceData = years.map((y) => yearlyMetrics[`year${y}`]?.remainingBalance || 0);
    const maxVal      = Math.max(...equityData, ...balanceData, 1);

    // SVG canvas
    const W = 480, H = 170;
    const PL = 60, PR = 20, PT = 12, PB = 28;  // padding left/right/top/bottom
    const cW = W - PL - PR;
    const cH = H - PT - PB;

    const xOf = (i: number) => PL + (cW * i) / (years.length - 1);
    const yOf = (v: number) => PT + cH - (v / maxVal) * cH;

    const toPoints = (data: number[]) =>
      data.map((v, i) => `${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");

    // Y-axis grid & labels (4 intervals)
    let gridLines = "";
    let yLabels   = "";
    for (let i = 0; i <= 4; i++) {
      const v = (maxVal * i) / 4;
      const y = yOf(v).toFixed(1);
      gridLines += `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5"/>`;
      const label = v >= 1_000_000 ? `R${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000     ? `R${Math.round(v / 1_000)}k`
                  : `R${Math.round(v)}`;
      yLabels += `<text x="${PL - 4}" y="${(parseFloat(y) + 3).toFixed(1)}" text-anchor="end" font-size="8" fill="#94a3b8">${label}</text>`;
    }

    // X-axis labels
    let xLabels = "";
    labels.forEach((l, i) => {
      xLabels += `<text x="${xOf(i).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="8" fill="#94a3b8">${l}</text>`;
    });

    // Axes
    const axes = `
      <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT + cH}" stroke="#e2e8f0" stroke-width="0.8"/>
      <line x1="${PL}" y1="${PT + cH}" x2="${W - PR}" y2="${PT + cH}" stroke="#e2e8f0" stroke-width="0.8"/>
    `;

    // Lines
    const equityLine  = `<polyline points="${toPoints(equityData)}" fill="none" stroke="#1ba2ff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const balanceLine = `<polyline points="${toPoints(balanceData)}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;

    // Dots
    let dots = "";
    equityData.forEach((v, i) => {
      dots += `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(v).toFixed(1)}" r="3" fill="#1ba2ff"/>`;
    });
    balanceData.forEach((v, i) => {
      dots += `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(v).toFixed(1)}" r="3" fill="#94a3b8"/>`;
    });

    return `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
        ${gridLines}${axes}${equityLine}${balanceLine}${dots}${yLabels}${xLabels}
      </svg>
      <div style="display:flex;gap:20px;margin-top:8px;font-size:8pt;color:#64748b;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:20px;height:2px;background:#1ba2ff;border-radius:1px;"></span>
          <span>Equity Built</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:20px;height:2px;background:#94a3b8;border-radius:1px;"></span>
          <span>Remaining Balance</span>
        </div>
      </div>
    `;
  }

  // ─── HTML builder ─────────────────────────────────────────────────────────
  private async buildHtml(data: PropertyPdfData): Promise<string> {
    const p   = data.property;
    const vr  = data.valuationReport;
    const rd  = data.rentalData;
    const vd  = vr?.valuationData as any;

    // Helpers
    const fmt = (n: any) => n ? `R${Number(n).toLocaleString("en-ZA")}` : "N/A";
    const pct = (n: any) => n != null ? `${n}%` : "N/A";
    const esc = (s: any) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Stat grid
    const stats = [
      { label: "Asking Price",   value: fmt(p.price) },
      { label: "Floor Size",     value: p.floorSize  ? `${p.floorSize} m²`         : "N/A" },
      { label: "Bedrooms",       value: p.bedrooms   != null ? String(p.bedrooms)  : "N/A" },
      { label: "Bathrooms",      value: p.bathrooms  != null ? String(p.bathrooms) : "N/A" },
      { label: "Parking",        value: p.parkingSpaces != null ? String(p.parkingSpaces) : "N/A" },
      { label: "Property Type",  value: esc(p.propertyType || "N/A") },
      { label: "Land Size",      value: p.landSize   ? `${p.landSize} m²`          : "N/A" },
      { label: "Monthly Levy",   value: fmt(p.monthlyLevy) },
    ];
    const statCards = stats.map((s) => `
      <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;background:white;">
        <div style="font-size:6.5pt;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;margin-bottom:5px;">${s.label}</div>
        <div style="font-size:11pt;font-weight:700;color:#0f172a;">${s.value}</div>
      </div>
    `).join("");

    // Map
    let mapHtml = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:8pt;">Map unavailable</div>`;
    if (p.address) {
      try {
        const geoRes  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(p.address)}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`);
        const geoData = await geoRes.json();
        if (geoData.results?.[0]?.geometry) {
          const loc    = geoData.results[0].geometry.location;
          const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${loc.lat},${loc.lng}&zoom=16&size=600x400&maptype=roadmap&markers=color:0x1ba2ff%7C${loc.lat},${loc.lng}&style=feature:all%7Celement:labels%7Cvisibility:simplified&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;
          const mapUri = await this.urlToDataUri(mapUrl);
          if (mapUri) mapHtml = `<img src="${mapUri}" style="width:100%;height:100%;object-fit:cover;display:block;" alt="Property map"/>`;
        }
      } catch { /* use placeholder */ }
    }

    // Property image
    let imgHtml = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:8pt;">No image available</div>`;
    const imageUrl = p.images?.[0] || p.imageUrls?.[0] || p.mainImage || p.primaryImage;
    if (imageUrl) {
      try {
        const imgUri = await this.urlToDataUri(imageUrl);
        if (imgUri) imgHtml = `<img src="${imgUri}" style="width:100%;height:100%;object-fit:cover;display:block;" alt="Property"/>`;
        else imgHtml = `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" alt="Property"/>`;
      } catch { /* use placeholder */ }
    }

    // Agency logo
    const agencyLogoHtml = data.agencyLogoDataUri
      ? `<img src="${data.agencyLogoDataUri}" style="height:36px;max-width:120px;object-fit:contain;" alt="Agency"/>`
      : "";

    // ── Valuation section ──
    let valuationHtml = "";
    if (vd?.valuations?.length) {
      const rows = vd.valuations.map((v: any) => `
        <tr>
          <td>${esc(v.type || "")}</td>
          <td style="text-align:center;">${esc(v.formula || "N/A")}</td>
          <td style="text-align:right;font-weight:600;color:#1ba2ff;">${fmt(v.value)}</td>
        </tr>
      `).join("");
      valuationHtml += `
        ${this.sectionHeader("Valuation Analysis")}
        <div style="padding:0 20mm 6mm;">
      `;
      if (vd.summary) {
        valuationHtml += `<p style="font-size:9pt;color:#475569;line-height:1.7;margin-bottom:14px;">${esc(vd.summary)}</p>`;
      }
      valuationHtml += `
          <p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin-bottom:8px;">Valuation Estimates</p>
          ${this.table(
            ["Estimate Type", "Size × Rate/m²", "Valuation"],
            ["left", "center", "right"],
            rows,
          )}
      `;
      if (vd.marketContext) {
        valuationHtml += `
          <p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin:12px 0 8px;">Market Context</p>
          <p style="font-size:9pt;color:#475569;line-height:1.7;">${esc(vd.marketContext)}</p>
        `;
      }
      valuationHtml += `</div>`;
    }

    // ── Rental Performance section ──
    let rentalHtml = "";
    if (vd?.rentalPerformance) {
      const rp = vd.rentalPerformance;
      rentalHtml = `${this.sectionHeader("Rental Performance Analysis")}<div style="padding:0 20mm 6mm;">`;

      if (rp.longTerm) {
        const lt = rp.longTerm;
        rentalHtml += `
          <p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin-bottom:8px;">Long-Term Rental</p>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
            ${this.miniStat("Monthly Range", `${fmt(lt.minRental)} – ${fmt(lt.maxRental)}`)}
            ${this.miniStat("Yield Range",   `${lt.minYield ?? "N/A"}% – ${lt.maxYield ?? "N/A"}%`)}
            ${this.miniStat("Strategy",      "Long-term let")}
          </div>
          ${lt.reasoning ? `<p style="font-size:8.5pt;color:#475569;line-height:1.7;margin-bottom:14px;">${esc(lt.reasoning)}</p>` : ""}
        `;
      }

      if (rp.shortTerm) {
        const st = rp.shortTerm;
        rentalHtml += `<p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin-bottom:8px;">Short-Term Rental (Airbnb)</p>`;
        if (st.occupancy) {
          rentalHtml += `<p style="font-size:8.5pt;color:#475569;margin-bottom:10px;">Average occupancy: <strong>${st.occupancy}%</strong></p>`;
        }

        const pLevels: { key: string; label: string }[] = [
          { key: "percentile25", label: "25th — Conservative" },
          { key: "percentile50", label: "50th — Average"      },
          { key: "percentile75", label: "75th — Premium"      },
          { key: "percentile90", label: "90th — Luxury"       },
        ];
        const stRows = pLevels
          .filter((l) => st[l.key])
          .map((l) => {
            const d = st[l.key];
            return `<tr>
              <td>${l.label}</td>
              <td style="text-align:right;">${fmt(d.nightly)}</td>
              <td style="text-align:right;">${fmt(d.monthly)}</td>
              <td style="text-align:right;font-weight:600;">${fmt(d.annual)}</td>
            </tr>`;
          }).join("");

        if (stRows) {
          rentalHtml += this.table(
            ["Performance Level", "Nightly", "Monthly", "Annual"],
            ["left", "right", "right", "right"],
            stRows,
          );
        }
      }
      rentalHtml += `</div>`;
    }

    // ── Financial Analysis section ──
    let financialHtml = "";
    if (rd?.financingAnalysisData || rd?.cashflowAnalysisData || rd?.annualPropertyAppreciationData) {
      financialHtml = `${this.sectionHeader("Financial Analysis")}<div style="padding:0 20mm 6mm;">`;

      if (rd.financingAnalysisData) {
        const fin        = rd.financingAnalysisData.financingParameters;
        const ym         = rd.financingAnalysisData.yearlyMetrics;

        if (fin) {
          financialHtml += `<p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin-bottom:10px;">Financing Parameters</p>`;
          financialHtml += `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">
              ${this.miniStat("Deposit",       `${fmt(Math.round(fin.depositAmount))} (${fin.depositPercentage}%)`)}
              ${this.miniStat("Loan Amount",   fmt(Math.round(fin.loanAmount)))}
              ${this.miniStat("Interest Rate", `${fin.interestRate}%`)}
              ${this.miniStat("Term",          `${fin.loanTerm} years`)}
            </div>
          `;
        }

        if (ym) {
          const yrs = [1, 2, 3, 4, 5, 10, 20];
          const bondRow    = `<tr><td>Monthly Bond Payment</td>${yrs.map((y) => `<td style="text-align:right;">${fmt(Math.round(ym[`year${y}`]?.monthlyPayment  || 0))}</td>`).join("")}</tr>`;
          const equityRow  = `<tr><td>Equity Build-up</td>${yrs.map((y) => `<td style="text-align:right;">${fmt(Math.round(ym[`year${y}`]?.equityBuildup   || 0))}</td>`).join("")}</tr>`;
          const balRow     = `<tr><td>Remaining Balance</td>${yrs.map((y) => `<td style="text-align:right;">${fmt(Math.round(ym[`year${y}`]?.remainingBalance || 0))}</td>`).join("")}</tr>`;

          financialHtml += `<p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin-bottom:8px;">Bond & Equity Schedule</p>`;
          financialHtml += this.table(
            ["Metric", "Y1", "Y2", "Y3", "Y4", "Y5", "Y10", "Y20"],
            ["left", "right", "right", "right", "right", "right", "right", "right"],
            bondRow + equityRow + balRow,
          );

          // Chart
          financialHtml += `
            <p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin:14px 0 4px;">Equity Build-up vs. Remaining Loan Balance</p>
            <p style="font-size:8pt;color:#94a3b8;margin-bottom:10px;">Loan paydown and equity accumulation over the mortgage term</p>
            <div style="margin-bottom:16px;">${this.buildEquityChart(ym)}</div>
          `;
        }
      }

      // Revenue projections
      if (rd.cashflowAnalysisData?.revenueGrowthTrajectory) {
        const traj = rd.cashflowAnalysisData.revenueGrowthTrajectory;
        financialHtml += `<p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin-bottom:4px;">Revenue Projections — 8% Annual Growth</p>`;
        financialHtml += `<p style="font-size:8pt;color:#94a3b8;margin-bottom:10px;">Projected annual revenue and yields over five years</p>`;

        const pKeys: { key: string; label: string }[] = [
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
            projRows += `<tr>
              <td>${label} — Revenue</td>
              ${[1,2,3,4,5].map((y) => `<td style="text-align:right;">${fmt(Math.round(pd[`year${y}`]?.revenue || 0))}</td>`).join("")}
            </tr>
            <tr>
              <td>${label} — Gross Yield</td>
              ${[1,2,3,4,5].map((y) => `<td style="text-align:right;">${(pd[`year${y}`]?.grossYield || 0).toFixed(1)}%</td>`).join("")}
            </tr>`;
          });
        }
        if (traj.longTerm) {
          projRows += `<tr>
            <td>Long-term — Revenue</td>
            ${[1,2,3,4,5].map((y) => `<td style="text-align:right;">${fmt(Math.round(traj.longTerm[`year${y}`]?.revenue || 0))}</td>`).join("")}
          </tr>
          <tr>
            <td>Long-term — Gross Yield</td>
            ${[1,2,3,4,5].map((y) => `<td style="text-align:right;">${(traj.longTerm[`year${y}`]?.grossYield || 0).toFixed(1)}%</td>`).join("")}
          </tr>`;
        }

        if (projRows) {
          financialHtml += this.table(
            ["Strategy", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
            ["left", "right", "right", "right", "right", "right"],
            projRows,
          );
        }
      }

      // Property appreciation
      if (rd.annualPropertyAppreciationData) {
        const appr = rd.annualPropertyAppreciationData;
        financialHtml += `
          <p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin:14px 0 8px;">Property Value Appreciation</p>
          <div style="display:inline-flex;align-items:center;background:#f0fdf4;color:#16a34a;font-size:8pt;font-weight:600;padding:4px 10px;border-radius:4px;margin-bottom:10px;">
            Annual appreciation rate: ${appr.finalAppreciationRate ?? "N/A"}%
          </div>
        `;

        if (appr.yearlyValues) {
          const kys   = ["year1","year2","year3","year4","year5","year10","year20"].filter((k) => appr.yearlyValues[k]);
          const hdrs  = kys.map((k) => `Year ${k.replace("year","")}`);
          const cells = kys.map((k) => `<td style="text-align:right;font-weight:600;">${fmt(Math.round(appr.yearlyValues[k]))}</td>`).join("");
          financialHtml += this.table(
            ["Metric", ...hdrs],
            ["left", ...kys.map(() => "right" as const)],
            `<tr><td>Estimated Value</td>${cells}</tr>`,
          );

          if (appr.reasoning) {
            financialHtml += `<p style="font-size:8.5pt;color:#475569;line-height:1.7;margin-top:8px;">${esc(appr.reasoning)}</p>`;
          }
        }
      }

      financialHtml += `</div>`;
    }

    // ── Additional Details section ──
    const dateStr = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
    let detailsHtml = `${this.sectionHeader("Additional Details")}<div style="padding:0 20mm 10mm;">`;
    if (p.agent) {
      detailsHtml += `
        <p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin-bottom:6px;">Agent Information</p>
        <p style="font-size:8.5pt;color:#475569;margin-bottom:2px;">${esc(p.agent.name || "N/A")}</p>
        <p style="font-size:8.5pt;color:#475569;margin-bottom:2px;">${esc(p.agent.phone || "")}</p>
        <p style="font-size:8.5pt;color:#475569;margin-bottom:12px;">${esc(p.agent.email || "")}</p>
      `;
    }
    detailsHtml += `
      <p style="font-size:8.5pt;font-weight:600;color:#0f172a;margin-bottom:6px;">Listing Information</p>
      <p style="font-size:8.5pt;color:#475569;">Property ID: ${esc(p.propdataId)} &nbsp;·&nbsp; Agent: ${esc(p.agentName || "N/A")} &nbsp;·&nbsp; Status: ${esc(p.status)} &nbsp;·&nbsp; Last Updated: ${new Date(p.lastModified || new Date()).toLocaleDateString("en-ZA")}</p>
      <p style="font-size:8pt;color:#94a3b8;margin-top:10px;">Report generated ${dateStr} by Proply Tech (Pty) Ltd. Valid for 30 days from generation date.</p>
    </div>`;

    // ── Disclaimers ──
    const disclaimerHtml = `
      ${this.sectionHeader("Disclaimers & Legal Notices")}
      <div style="padding:0 20mm 14mm;">
        <p style="font-size:7.5pt;color:#94a3b8;line-height:1.8;">
          The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only.
          While every effort is made to ensure accuracy, we cannot guarantee the absolute accuracy or completeness of the data.
          This report does not constitute financial, investment, legal, or professional advice.
          Property investment carries inherent risks and market conditions can change rapidly.
          Any decisions made based on this information are solely the responsibility of the user.
          Proply Tech (Pty) Ltd expressly disclaims any liability for direct, indirect, incidental, or consequential
          damages arising from use of this report. Projections and estimates are indicative only and based on data
          available at the time of generation. Actual results may differ materially.
        </p>
      </div>
    `;

    // ── Assemble full document ──
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body, h1, h2, h3, h4, p, ul, li { margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #0f172a;
    background: white;
    font-size: 9pt;
    line-height: 1.5;
  }
  @page { size: A4; margin: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 14px; }
  thead th {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
    font-size: 7.5pt;
    padding: 7px 10px;
    border: 1px solid #e2e8f0;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  tbody td {
    padding: 6.5px 10px;
    border: 1px solid #e8ecf1;
    color: #334155;
    vertical-align: middle;
  }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  p { margin-bottom: 0; }
</style>
</head>
<body>

<!-- ═══ DOCUMENT HEADER ═══ -->
<div style="padding:12mm 20mm 10mm;border-bottom:3px solid #1ba2ff;display:flex;align-items:center;justify-content:space-between;margin-bottom:0;">
  <div style="display:flex;align-items:center;gap:20px;">
    ${PROPLY_LOGO_SVG}
    <div style="width:1px;height:28px;background:#e2e8f0;"></div>
    <div>
      <div style="font-size:7.5pt;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Property Investment Report</div>
      <div style="font-size:8pt;color:#475569;">${dateStr}</div>
    </div>
  </div>
  <div style="display:flex;align-items:center;gap:0;">
    ${agencyLogoHtml}
  </div>
</div>

<!-- ═══ PROPERTY HERO ═══ -->
<div style="padding:10mm 20mm 8mm;background:linear-gradient(135deg,#f8fafc 0%,#eff6ff 100%);">
  <div style="display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:7pt;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:3px 10px;border-radius:4px;margin-bottom:10px;">
    ${esc(p.propertyType || "Residential Property")}
  </div>
  <h1 style="font-size:20pt;font-weight:800;color:#0f172a;line-height:1.15;margin-bottom:10px;letter-spacing:-0.02em;">${esc(p.address || "Address not available")}</h1>
  <div style="display:flex;align-items:baseline;gap:6px;">
    <span style="font-size:26pt;font-weight:800;color:#1ba2ff;letter-spacing:-0.03em;">${fmt(p.price)}</span>
    <span style="font-size:8pt;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Asking Price</span>
  </div>
</div>

<!-- ═══ STAT GRID ═══ -->
<div style="padding:6mm 20mm 6mm;display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
  ${statCards}
</div>

<!-- ═══ MAP + IMAGE ═══ -->
<div style="padding:0 20mm 10mm;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
  <div style="height:58mm;border-radius:8px;overflow:hidden;background:#f1f5f9;border:1px solid #e2e8f0;">
    ${mapHtml}
  </div>
  <div style="height:58mm;border-radius:8px;overflow:hidden;background:#f1f5f9;border:1px solid #e2e8f0;">
    ${imgHtml}
  </div>
</div>

${valuationHtml}
${rentalHtml}
${financialHtml}
${detailsHtml}
${disclaimerHtml}

</body>
</html>`;
  }

  // ─── HTML helpers ─────────────────────────────────────────────────────────
  private sectionHeader(title: string): string {
    return `
      <div style="padding:10mm 20mm 6mm;">
        <div style="display:flex;align-items:center;gap:10px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">
          <div style="width:3px;height:18px;background:#1ba2ff;border-radius:2px;flex-shrink:0;"></div>
          <span style="font-size:10.5pt;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">${title}</span>
        </div>
      </div>
    `;
  }

  private table(
    headers: string[],
    aligns: Array<"left" | "right" | "center">,
    bodyRows: string,
  ): string {
    const ths = headers.map((h, i) => `<th style="text-align:${aligns[i]};">${h}</th>`).join("");
    return `<table><thead><tr>${ths}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  }

  private miniStat(label: string, value: string): string {
    return `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px 12px;">
        <div style="font-size:6.5pt;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;margin-bottom:4px;">${label}</div>
        <div style="font-size:9.5pt;font-weight:700;color:#0f172a;">${value}</div>
      </div>
    `;
  }

  // ─── PDFShift API call ────────────────────────────────────────────────────
  private async callPdfShift(html: string): Promise<Buffer> {
    if (!this.apiKey) throw new Error("PDFSHIFT_API_KEY environment variable not set");

    const year = new Date().getFullYear();
    const footerHtml = `<!DOCTYPE html><html><head><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Inter, -apple-system, sans-serif;
        font-size: 7pt;
        color: #94a3b8;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20mm;
        height: 100%;
        border-top: 1px solid #e2e8f0;
      }
    </style></head><body>
      <span>Proply Tech (Pty) Ltd &nbsp;·&nbsp; Property Investment Report</span>
      <span>© ${year} All rights reserved. For informational purposes only.</span>
      <span>Page <span class="page"></span> of <span class="pages"></span></span>
    </body></html>`;

    console.log(`Calling PDFShift API, HTML size: ${html.length} chars`);

    const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`api:${this.apiKey}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source:    html,
        landscape: false,
        use_print: false,
        margin:    { top: "0mm", bottom: "14mm", left: "0mm", right: "0mm" },
        footer:    { source: footerHtml, height: "14mm" },
        format:    "A4",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("PDFShift error:", response.status, errText);
      throw new Error(`PDFShift API error ${response.status}: ${errText}`);
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
