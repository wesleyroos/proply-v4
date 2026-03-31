import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { db } from "../../db";
import {
  propdataListings,
  valuationReports,
  rentalPerformanceData,
  agencyBranches,
} from "../../db/schema";
import { eq, desc } from "drizzle-orm";

interface PropertyPdfData {
  property: any;
  valuationReport: any;
  rentalData: any;
  savedValuationData: any;
  agencyLogo?: string | null;
}

interface PdfGenerationOptions {
  includeMap?: boolean;
  includeImages?: boolean;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
// Near-black ink for headings and key figures
const INK: [number, number, number]        = [20,  25,  35];
// Medium charcoal for body copy
const BODY: [number, number, number]       = [50,  60,  75];
// Muted gray for labels and captions
const LABEL: [number, number, number]      = [110, 120, 135];
// Very light gray for rules and cell borders
const RULE: [number, number, number]       = [208, 213, 221];
// Barely-there fill for table header rows
const TBL_HEAD: [number, number, number]   = [240, 242, 246];
// Almost-white fill for alternating table rows
const ALT_ROW: [number, number, number]    = [250, 251, 253];
// Page header background – very dark charcoal
const HEADER_BG: [number, number, number]  = [18,  28,  46];
// Single accent colour – Proply blue – used ONLY in the header strip
const ACCENT: [number, number, number]     = [27, 162, 255];

export class PropdataPdfService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  async generatePropertyReport(
    propertyId: string,
    options: PdfGenerationOptions = {},
  ): Promise<Buffer> {
    try {
      const data = await this.fetchPropertyData(propertyId);

      if (!data.property) {
        throw new Error("Property not found");
      }

      await this.initializePdf(data);

      await this.addOverviewSection(data);
      await this.addValuationSection(data);
      await this.addRentalPerformanceSection(data);
      await this.addFinancialsSection(data);
      await this.addDetailsSection(data);
      this.addDisclaimersSection();
      await this.addFooterToAllPages();

      return Buffer.from(this.doc.output("arraybuffer"));
    } catch (error) {
      console.error("Error generating PDF report:", error);
      throw error;
    }
  }

  private async fetchPropertyData(
    propertyId: string,
  ): Promise<PropertyPdfData> {
    try {
      console.log(`=== PDF SERVICE: Fetching data for property ID: ${propertyId} ===`);
      console.log(`Looking for property with PropData ID: "${propertyId}"`);

      let property = await db.query.propdataListings.findFirst({
        where: eq(propdataListings.propdataId, propertyId),
      });

      if (!property) {
        console.log("Drizzle query failed, trying raw SQL...");
        const rawResult = await db.execute(
          `SELECT * FROM propdata_listings WHERE propdata_id = '${propertyId}' LIMIT 1`,
        );
        console.log("Raw SQL result count:", rawResult.rows.length);
        if (rawResult.rows.length > 0) {
          console.log("Found via raw SQL - using first result");
          property = rawResult.rows[0] as any;
        }
      }

      console.log("Property found:", !!property);

      const valuationReport = await db.query.valuationReports.findFirst({
        where: eq(valuationReports.propertyId, propertyId),
        orderBy: [desc(valuationReports.updatedAt)],
      });

      const rentalData = await db.query.rentalPerformanceData.findFirst({
        where: eq(rentalPerformanceData.propertyId, propertyId),
      });

      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found in database`);
      }

      let agencyLogo: string | null = null;
      if (property.branchId) {
        const agencyBranch = await db.query.agencyBranches.findFirst({
          where: eq(agencyBranches.id, property.branchId),
        });
        if (agencyBranch?.logoUrl) {
          agencyLogo = agencyBranch.logoUrl;
        }
      }

      const mergedRentalData = rentalData
        ? {
            ...rentalData,
            financingAnalysisData: rentalData.financingAnalysisData ?? valuationReport?.financingAnalysisData,
            cashflowAnalysisData: rentalData.cashflowAnalysisData ?? valuationReport?.cashflowAnalysisData,
          }
        : valuationReport
          ? {
              financingAnalysisData: valuationReport.financingAnalysisData,
              cashflowAnalysisData: valuationReport.cashflowAnalysisData,
            }
          : null;

      return {
        property,
        valuationReport,
        rentalData: mergedRentalData,
        savedValuationData: valuationReport,
        agencyLogo,
      };
    } catch (error) {
      console.error("Error fetching property data:", error);
      throw error;
    }
  }

  private async initializePdf(data: PropertyPdfData): Promise<void> {
    this.doc.setProperties({
      title: "Property Report",
      subject: "Property Investment Analysis",
      author: "Proply",
      creator: "Proply Tech (Pty) Ltd",
    });
    await this.addHeader(data);
  }

  // ─── Header ───────────────────────────────────────────────────────────────
  private async addHeader(data: PropertyPdfData): Promise<void> {
    const bandH = 36;

    // Dark charcoal header band
    this.doc.setFillColor(...HEADER_BG);
    this.doc.rect(0, 0, this.pageWidth, bandH, "F");

    // Single 2pt accent strip at the very bottom of the band
    this.doc.setFillColor(...ACCENT);
    this.doc.rect(0, bandH - 2, this.pageWidth, 2, "F");

    // Report title
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(13);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("PROPERTY REPORT", this.margin, bandH / 2 + 1);

    // Thin vertical divider
    this.doc.setDrawColor(255, 255, 255);
    this.doc.setLineWidth(0.3);
    const titleWidth = this.doc.getTextWidth("PROPERTY REPORT");
    this.doc.line(
      this.margin + titleWidth + 8, bandH / 2 - 5,
      this.margin + titleWidth + 8, bandH / 2 + 5,
    );

    // Generated date beside title
    const dateStr = new Date().toLocaleDateString("en-ZA", {
      day: "numeric", month: "long", year: "numeric",
    });
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(180, 190, 210);
    this.doc.text(dateStr, this.margin + titleWidth + 14, bandH / 2 + 1);

    // Logo on the right
    await this.addLogo(data.agencyLogo, bandH);

    this.doc.setTextColor(...INK);
    this.currentY = bandH + 14;
  }

  // ─── Logo loading ─────────────────────────────────────────────────────────
  private async addLogo(agencyLogoUrl?: string | null, bandH: number = 36): Promise<void> {
    try {
      let logoBase64: string | null = null;
      let logoFormat = "PNG";

      if (agencyLogoUrl) {
        console.log("Loading agency logo from:", agencyLogoUrl);
        try {
          const fs = await import("fs");
          const path = await import("path");
          const logoPath = agencyLogoUrl.startsWith('/static-assets/')
            ? path.join(process.cwd(), 'public', agencyLogoUrl.replace('/static-assets/', ''))
            : path.join(process.cwd(), 'public', agencyLogoUrl.replace('/', ''));

          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            logoBase64 = logoBuffer.toString("base64");
            const ext = path.extname(logoPath).toLowerCase();
            if (ext === '.jpg' || ext === '.jpeg') logoFormat = "JPEG";
            else if (ext === '.gif') logoFormat = "GIF";
            else if (ext === '.webp') logoFormat = "WEBP";
            console.log("Successfully loaded agency logo");
          } else {
            console.log("Agency logo file not found at:", logoPath);
          }
        } catch (error) {
          console.error("Error loading agency logo:", error);
        }
      }

      if (!logoBase64) {
        console.log("Loading Proply fallback logo");
        try {
          const fs = await import("fs");
          const path = await import("path");
          const logoPath = path.join(process.cwd(), "client", "public", "proply-logo-auth.png");
          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            logoBase64 = logoBuffer.toString("base64");
            logoFormat = "PNG";
            console.log("Successfully loaded Proply fallback logo");
          }
        } catch (error) {
          console.error("Error loading Proply logo:", error);
        }
      }

      if (logoBase64) {
        try {
          const sharp = await import("sharp");
          const logoBuffer = Buffer.from(logoBase64, 'base64');
          const metadata = await sharp.default(logoBuffer).metadata();

          if (metadata.width && metadata.height) {
            const maxLogoHeight = 14;
            const maxLogoWidth  = 50;
            const aspect = metadata.width / metadata.height;
            let logoWidth  = maxLogoWidth;
            let logoHeight = logoWidth / aspect;
            if (logoHeight > maxLogoHeight) {
              logoHeight = maxLogoHeight;
              logoWidth  = logoHeight * aspect;
            }
            const logoX = this.pageWidth - this.margin - logoWidth;
            const logoY = (bandH - logoHeight) / 2;
            this.doc.addImage(logoBase64, logoFormat, logoX, logoY, logoWidth, logoHeight);
            console.log(`Successfully added logo to PDF: ${logoWidth.toFixed(1)}x${logoHeight.toFixed(1)}`);
          } else {
            throw new Error("Could not determine image dimensions");
          }
        } catch (error) {
          console.error("Error getting image dimensions:", error);
          const logoHeight = 12;
          const logoWidth  = 36;
          const logoX = this.pageWidth - this.margin - logoWidth;
          const logoY = (bandH - logoHeight) / 2;
          this.doc.addImage(logoBase64, logoFormat, logoX, logoY, logoWidth, logoHeight);
        }
      } else {
        // Text fallback
        this.doc.setFontSize(11);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(255, 255, 255);
        const fallbackText = "PROPLY";
        const tw = this.doc.getTextWidth(fallbackText);
        this.doc.text(fallbackText, this.pageWidth - this.margin - tw, bandH / 2 + 2);
      }
    } catch (error) {
      console.error("Logo loading error:", error);
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(255, 255, 255);
      const tw = this.doc.getTextWidth("PROPLY");
      this.doc.text("PROPLY", this.pageWidth - this.margin - tw, 20);
    }
  }

  // ─── Overview ─────────────────────────────────────────────────────────────
  private async addOverviewSection(data: PropertyPdfData): Promise<void> {
    this.addSectionHeader("Property Overview");

    if (!data.property) {
      this.doc.setFontSize(9);
      this.doc.setTextColor(...BODY);
      this.doc.text("Property data not available", this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    // Large address
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...INK);
    const addressText = data.property.address || "Address not available";
    const wrappedAddress = this.doc.splitTextToSize(
      addressText,
      this.pageWidth - 2 * this.margin,
    );
    this.doc.text(wrappedAddress, this.margin, this.currentY);
    this.currentY += wrappedAddress.length * 7 + 10;

    // Key stats row — clean bordered cells, no colored fill
    const formattedPrice = data.property.price
      ? `R${Number(data.property.price).toLocaleString("en-ZA")}`
      : "N/A";
    const formattedLevy = data.property.monthlyLevy
      ? `R${Number(data.property.monthlyLevy).toLocaleString("en-ZA")}`
      : "N/A";

    const stats = [
      { label: "Asking Price",   value: formattedPrice },
      { label: "Floor Size",     value: `${data.property.floorSize || "N/A"} m²` },
      { label: "Bedrooms",       value: String(data.property.bedrooms ?? "N/A") },
      { label: "Bathrooms",      value: String(data.property.bathrooms ?? "N/A") },
      { label: "Parking",        value: String(data.property.parkingSpaces ?? "N/A") },
      { label: "Type",           value: data.property.propertyType || "N/A" },
      { label: "Land Size",      value: `${data.property.landSize || "N/A"} m²` },
      { label: "Monthly Levy",   value: formattedLevy },
    ];

    const cols    = 4;
    const cellW   = (this.pageWidth - 2 * this.margin - (cols - 1) * 3) / cols;
    const cellH   = 18;
    const rows    = Math.ceil(stats.length / cols);

    stats.forEach((stat, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x   = this.margin + col * (cellW + 3);
      const y   = this.currentY + row * (cellH + 3);

      // Subtle border cell — no fill
      this.doc.setDrawColor(...RULE);
      this.doc.setLineWidth(0.25);
      this.doc.rect(x, y, cellW, cellH, "S");

      // Label
      this.doc.setFontSize(6.5);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...LABEL);
      this.doc.text(stat.label.toUpperCase(), x + 4, y + 6);

      // Value
      this.doc.setFontSize(9.5);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...INK);
      this.doc.text(stat.value, x + 4, y + 14);
    });

    this.currentY += rows * (cellH + 3) + 10;

    // Map and property image
    await this.addMapAndImage(data);
    this.currentY += 5;
  }

  // ─── Map & Image ──────────────────────────────────────────────────────────
  private async addMapAndImage(data: PropertyPdfData): Promise<void> {
    console.log("=== Starting addMapAndImage method ===");
    const availableWidth = this.pageWidth - 2 * this.margin;
    const spacing   = 8;
    const mapWidth  = (availableWidth - spacing) / 2;
    const mapHeight = 60;
    const imgWidth  = (availableWidth - spacing) / 2;
    const imgHeight = 60;

    console.log("Property address for geocoding:", data.property?.address);

    // ── Map ──
    if (data.property?.address) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(data.property.address)}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData     = await geocodeResponse.json();

        console.log("Geocoding API response status:", geocodeData.status);

        if (geocodeData.results?.[0]?.geometry) {
          const loc    = geocodeData.results[0].geometry.location;
          const mapUrl = await this.generateStaticMapUrl(loc.lat, loc.lng, data.property.address);
          const mapRes = await fetch(mapUrl);

          if (mapRes.ok) {
            const mapBase64 = Buffer.from(await mapRes.arrayBuffer()).toString("base64");
            this.doc.addImage(mapBase64, "JPEG", this.margin, this.currentY, mapWidth, mapHeight);
            console.log("Successfully added geocoded map to PDF");
          } else {
            throw new Error(`Map API error: ${mapRes.status}`);
          }
        } else {
          throw new Error("No geocoding results found");
        }
      } catch (error) {
        console.error("Error with geocoding/map:", error);
        this.renderImagePlaceholder(this.margin, this.currentY, mapWidth, mapHeight, "Map unavailable");
      }
    } else {
      this.renderImagePlaceholder(this.margin, this.currentY, mapWidth, mapHeight, "No address available");
    }

    // ── Property image ──
    const images   = data.property?.images || data.property?.imageUrls || data.property?.propertyImages;
    const imageUrl = images?.[0] || data.property?.mainImage || data.property?.primaryImage;

    if (imageUrl) {
      try {
        console.log("Attempting to load image from URL:", imageUrl);
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const imageBase64 = Buffer.from(await response.arrayBuffer()).toString("base64");
        const format      = imageUrl.toLowerCase().includes(".png") ? "PNG" : "JPEG";
        this.doc.addImage(imageBase64, format, this.margin + mapWidth + spacing, this.currentY, imgWidth, imgHeight);
        console.log("Successfully added property image to PDF");
      } catch (error) {
        console.error("Error loading property image:", error);
        this.renderImagePlaceholder(this.margin + mapWidth + spacing, this.currentY, imgWidth, imgHeight, "Image unavailable");
      }
    } else {
      this.renderImagePlaceholder(this.margin + mapWidth + spacing, this.currentY, imgWidth, imgHeight, "No image available");
    }

    this.currentY += mapHeight;
  }

  /** Renders a clean light-gray placeholder box */
  private renderImagePlaceholder(x: number, y: number, w: number, h: number, label: string): void {
    this.doc.setFillColor(246, 247, 249);
    this.doc.rect(x, y, w, h, "F");
    this.doc.setDrawColor(...RULE);
    this.doc.setLineWidth(0.25);
    this.doc.rect(x, y, w, h, "S");
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...LABEL);
    const tw = this.doc.getTextWidth(label);
    this.doc.text(label, x + (w - tw) / 2, y + h / 2 + 1);
  }

  private async generateStaticMapUrl(lat: number, lng: number, address: string): Promise<string> {
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=400x300&maptype=satellite&markers=color:red%7Clabel:P%7C${lat},${lng}&key=${apiKey}`;
  }

  // ─── Valuation ────────────────────────────────────────────────────────────
  private addValuationSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader("Valuation Analysis");

    if (!data.valuationReport?.valuationData) {
      this.doc.setFontSize(9);
      this.doc.setTextColor(...BODY);
      this.doc.text("No valuation data available", this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    const valuation = data.valuationReport.valuationData as any;

    if (valuation.summary) {
      this.addSubsectionHeader("Property Summary");
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...BODY);
      this.addWrappedText(valuation.summary, this.margin, this.pageWidth - 2 * this.margin);
      this.currentY += 8;
    }

    if (valuation.valuations && Array.isArray(valuation.valuations)) {
      this.addSubsectionHeader("Valuation Estimates");

      const tableData = valuation.valuations.map((val: any) => [
        val.type || "",
        val.formula || "N/A",
        `R${(val.value || 0).toLocaleString("en-ZA")}`,
      ]);

      (this.doc as any).autoTable({
        startY: this.currentY,
        head: [["Estimate Type", "Size × Rate/m²", "Valuation"]],
        body: tableData,
        ...this.tableStyles(),
        columnStyles: {
          0: { halign: "left",   cellWidth: 55 },
          1: { halign: "center", cellWidth: 65 },
          2: { halign: "right",  cellWidth: 50 },
        },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 14;
    }

    if (valuation.marketContext) {
      this.addSubsectionHeader("Market Context");
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...BODY);
      this.addWrappedText(valuation.marketContext, this.margin, this.pageWidth - 2 * this.margin);
      this.currentY += 5;
    }
  }

  // ─── Rental Performance ───────────────────────────────────────────────────
  private addRentalPerformanceSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader("Rental Performance Analysis");

    const valuationData = data.valuationReport?.valuationData as any;
    if (!valuationData?.rentalPerformance) {
      this.doc.setFontSize(9);
      this.doc.setTextColor(...BODY);
      this.doc.text("No rental performance data available", this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    const rentalPerformance = valuationData.rentalPerformance;

    if (rentalPerformance.longTerm) {
      this.addSubsectionHeader("Long-Term Rental Analysis");
      const longTerm = rentalPerformance.longTerm;

      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...BODY);
      this.doc.text(
        `Monthly Rental Range: R${(longTerm.minRental || 0).toLocaleString("en-ZA")} – R${(longTerm.maxRental || 0).toLocaleString("en-ZA")}`,
        this.margin, this.currentY,
      );
      this.currentY += 8;
      this.doc.text(
        `Yield Range: ${longTerm.minYield || 0}% – ${longTerm.maxYield || 0}%`,
        this.margin, this.currentY,
      );
      this.currentY += 8;

      if (longTerm.reasoning) {
        this.addWrappedText(longTerm.reasoning, this.margin, this.pageWidth - 2 * this.margin);
        this.currentY += 8;
      }
    }

    if (rentalPerformance.shortTerm) {
      this.addSubsectionHeader("Short-Term Rental (Airbnb) Analysis");
      const shortTerm = rentalPerformance.shortTerm;

      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...BODY);

      if (shortTerm.occupancy) {
        this.doc.text(`Average Occupancy Rate: ${shortTerm.occupancy}%`, this.margin, this.currentY);
        this.currentY += 8;
      }

      if (shortTerm.percentile25 || shortTerm.percentile50 || shortTerm.percentile75 || shortTerm.percentile90) {
        const percentileData: any[] = [];

        if (shortTerm.percentile25) percentileData.push([
          "25th — Conservative",
          `R${(shortTerm.percentile25.nightly || 0).toLocaleString("en-ZA")}`,
          `R${(shortTerm.percentile25.monthly || 0).toLocaleString("en-ZA")}`,
          `R${(shortTerm.percentile25.annual || 0).toLocaleString("en-ZA")}`,
        ]);
        if (shortTerm.percentile50) percentileData.push([
          "50th — Average",
          `R${(shortTerm.percentile50.nightly || 0).toLocaleString("en-ZA")}`,
          `R${(shortTerm.percentile50.monthly || 0).toLocaleString("en-ZA")}`,
          `R${(shortTerm.percentile50.annual || 0).toLocaleString("en-ZA")}`,
        ]);
        if (shortTerm.percentile75) percentileData.push([
          "75th — Premium",
          `R${(shortTerm.percentile75.nightly || 0).toLocaleString("en-ZA")}`,
          `R${(shortTerm.percentile75.monthly || 0).toLocaleString("en-ZA")}`,
          `R${(shortTerm.percentile75.annual || 0).toLocaleString("en-ZA")}`,
        ]);
        if (shortTerm.percentile90) percentileData.push([
          "90th — Luxury",
          `R${(shortTerm.percentile90.nightly || 0).toLocaleString("en-ZA")}`,
          `R${(shortTerm.percentile90.monthly || 0).toLocaleString("en-ZA")}`,
          `R${(shortTerm.percentile90.annual || 0).toLocaleString("en-ZA")}`,
        ]);

        (this.doc as any).autoTable({
          startY: this.currentY,
          head: [["Performance Level", "Nightly Rate", "Monthly Income", "Annual Income"]],
          body: percentileData,
          ...this.tableStyles(),
          columnStyles: {
            0: { halign: "left" },
            1: { halign: "right" },
            2: { halign: "right" },
            3: { halign: "right" },
          },
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 14;
      }
    }
  }

  // ─── Financials ───────────────────────────────────────────────────────────
  private addFinancialsSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader("Financial Analysis");

    if (data.rentalData?.financingAnalysisData) {
      this.addSubsectionHeader("Financing Details");

      const financing    = data.rentalData.financingAnalysisData.financingParameters;
      const yearlyMetrics = data.rentalData.financingAnalysisData.yearlyMetrics;

      if (financing) {
        this.doc.setFontSize(9);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(...BODY);

        const addRow = (label: string, value: string) => {
          this.doc.setFont("helvetica", "bold");
          this.doc.setTextColor(...INK);
          this.doc.text(label, this.margin, this.currentY);
          const lw = this.doc.getTextWidth(label);
          this.doc.setFont("helvetica", "normal");
          this.doc.setTextColor(...BODY);
          this.doc.text(value, this.margin + lw + 2, this.currentY);
          this.currentY += 7;
        };

        addRow("Deposit:", `R${Math.round(financing.depositAmount)?.toLocaleString()} (${financing.depositPercentage}%)`);
        addRow("Loan Amount:", `R${Math.round(financing.loanAmount)?.toLocaleString()}`);
        addRow("Interest Rate:", `${financing.interestRate}%`);
        addRow("Term:", `${financing.loanTerm} years`);
        this.currentY += 6;

        if (yearlyMetrics) {
          const years = [1, 2, 3, 4, 5, 10, 20];

          const bondPaymentRow  = ["Monthly Bond Payment"];
          const equityRow       = ["Equity Build-up"];
          const balanceRow      = ["Remaining Loan Balance"];

          years.forEach((year) => {
            const m = yearlyMetrics[`year${year}`];
            bondPaymentRow.push(`R${Math.round(m?.monthlyPayment || 0).toLocaleString()}`);
            equityRow.push(`R${Math.round(m?.equityBuildup || 0).toLocaleString()}`);
            balanceRow.push(`R${Math.round(m?.remainingBalance || 0).toLocaleString()}`);
          });

          (this.doc as any).autoTable({
            startY: this.currentY,
            head: [["Metric", "Y1", "Y2", "Y3", "Y4", "Y5", "Y10", "Y20"]],
            body: [bondPaymentRow, equityRow, balanceRow],
            ...this.tableStyles(),
            tableWidth: "auto",
            columnStyles: {
              0: { halign: "left" },
              1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" },
              4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" },
              7: { halign: "right" },
            },
          });

          this.currentY = (this.doc as any).lastAutoTable.finalY + 18;
          this.addEquityVsBalanceChart(yearlyMetrics);
        }
      }
    }

    if (data.rentalData?.cashflowAnalysisData?.revenueGrowthTrajectory) {
      this.addSubsectionHeader("Revenue Projections — 8% Annual Growth");

      this.doc.setFontSize(8.5);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...LABEL);
      this.doc.text("Projected annual revenue and yields over five years.", this.margin, this.currentY);
      this.currentY += 10;

      const trajectory  = data.rentalData.cashflowAnalysisData.revenueGrowthTrajectory;
      const yearHeaders = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"];
      const tableRows: any[] = [];

      if (trajectory.shortTerm) {
        const percentileLabels: Record<string, string> = {
          percentile25: "STR 25th (Conservative)",
          percentile50: "STR 50th (Median)",
          percentile75: "STR 75th (Optimistic)",
          percentile90: "STR 90th (Premium)",
        };

        Object.entries(percentileLabels).forEach(([key, label]) => {
          const pd = trajectory.shortTerm[key];
          if (pd) {
            tableRows.push([
              `${label} — Revenue`,
              `R${Math.round(pd.year1?.revenue || 0).toLocaleString()}`,
              `R${Math.round(pd.year2?.revenue || 0).toLocaleString()}`,
              `R${Math.round(pd.year3?.revenue || 0).toLocaleString()}`,
              `R${Math.round(pd.year4?.revenue || 0).toLocaleString()}`,
              `R${Math.round(pd.year5?.revenue || 0).toLocaleString()}`,
            ]);
            tableRows.push([
              `${label} — Gross Yield`,
              `${(pd.year1?.grossYield || 0).toFixed(1)}%`,
              `${(pd.year2?.grossYield || 0).toFixed(1)}%`,
              `${(pd.year3?.grossYield || 0).toFixed(1)}%`,
              `${(pd.year4?.grossYield || 0).toFixed(1)}%`,
              `${(pd.year5?.grossYield || 0).toFixed(1)}%`,
            ]);
          }
        });
      }

      if (trajectory.longTerm) {
        tableRows.push([
          "Long-term — Revenue",
          `R${Math.round(trajectory.longTerm.year1?.revenue || 0).toLocaleString()}`,
          `R${Math.round(trajectory.longTerm.year2?.revenue || 0).toLocaleString()}`,
          `R${Math.round(trajectory.longTerm.year3?.revenue || 0).toLocaleString()}`,
          `R${Math.round(trajectory.longTerm.year4?.revenue || 0).toLocaleString()}`,
          `R${Math.round(trajectory.longTerm.year5?.revenue || 0).toLocaleString()}`,
        ]);
        tableRows.push([
          "Long-term — Gross Yield",
          `${(trajectory.longTerm.year1?.grossYield || 0).toFixed(1)}%`,
          `${(trajectory.longTerm.year2?.grossYield || 0).toFixed(1)}%`,
          `${(trajectory.longTerm.year3?.grossYield || 0).toFixed(1)}%`,
          `${(trajectory.longTerm.year4?.grossYield || 0).toFixed(1)}%`,
          `${(trajectory.longTerm.year5?.grossYield || 0).toFixed(1)}%`,
        ]);
      }

      (this.doc as any).autoTable({
        startY: this.currentY,
        head: [["Strategy", ...yearHeaders]],
        body: tableRows,
        ...this.tableStyles(),
        columnStyles: {
          0: { halign: "left", cellWidth: 52 },
          ...Object.fromEntries(
            Array.from({ length: yearHeaders.length }, (_, i) => [i + 1, { halign: "right" }]),
          ),
        },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 14;
    }

    if (data.rentalData?.annualPropertyAppreciationData) {
      this.addSubsectionHeader("Property Value Appreciation");

      const appreciation = data.rentalData.annualPropertyAppreciationData;

      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...BODY);
      this.doc.text(
        `Annual appreciation rate: ${appreciation.finalAppreciationRate}%`,
        this.margin, this.currentY,
      );
      this.currentY += 10;

      if (appreciation.yearlyValues) {
        const keyYears   = ["year1", "year2", "year3", "year4", "year5", "year10", "year20"];
        const validYears = keyYears.filter((k) => appreciation.yearlyValues[k]);
        const yearHdrs   = validYears.map((k) => `Year ${k.replace("year", "")}`);
        const valueRow   = [
          "Estimated Value",
          ...validYears.map((k) => `R${Math.round(appreciation.yearlyValues[k]).toLocaleString()}`),
        ];

        (this.doc as any).autoTable({
          startY: this.currentY,
          head: [["Metric", ...yearHdrs]],
          body: [valueRow],
          ...this.tableStyles(),
          columnStyles: {
            0: { halign: "left" },
            ...Object.fromEntries(
              Array.from({ length: yearHdrs.length }, (_, i) => [i + 1, { halign: "right" }]),
            ),
          },
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

        if (appreciation.reasoning) {
          this.doc.setFontSize(9);
          this.doc.setFont("helvetica", "normal");
          this.doc.setTextColor(...BODY);
          this.addWrappedText(appreciation.reasoning, this.margin, this.pageWidth - 2 * this.margin);
          this.currentY += 8;
        }
      }
    }
  }

  // ─── Additional Details ───────────────────────────────────────────────────
  private addDetailsSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader("Additional Details");

    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...BODY);

    if (data.property.agent) {
      this.addSubsectionHeader("Agent Information");
      this.doc.text(`Agent:  ${data.property.agent.name || "N/A"}`, this.margin, this.currentY); this.currentY += 6;
      this.doc.text(`Phone:  ${data.property.agent.phone || "N/A"}`, this.margin, this.currentY); this.currentY += 6;
      this.doc.text(`Email:  ${data.property.agent.email || "N/A"}`, this.margin, this.currentY); this.currentY += 12;
    }

    this.addSubsectionHeader("Listing Information");
    this.doc.text(`Property ID:   ${data.property.propdataId}`, this.margin, this.currentY); this.currentY += 6;
    this.doc.text(`Agent:         ${data.property.agentName || "N/A"}`, this.margin, this.currentY); this.currentY += 6;
    this.doc.text(`Last Updated:  ${new Date(data.property.lastModified || new Date()).toLocaleDateString()}`, this.margin, this.currentY); this.currentY += 6;
    this.doc.text(`Status:        ${data.property.status}`, this.margin, this.currentY); this.currentY += 14;

    this.doc.setFontSize(8);
    this.doc.setTextColor(...LABEL);
    this.doc.text(
      `Report generated ${new Date().toLocaleDateString()} by Proply Tech (Pty) Ltd. Valid for 30 days.`,
      this.margin, this.currentY,
    );
    this.currentY += 18;
  }

  // ─── Section & subsection headers ─────────────────────────────────────────
  private addSectionHeader(title: string): void {
    this.checkPageBreak(30);

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...INK);
    this.doc.text(title.toUpperCase(), this.margin, this.currentY);

    // Thin full-width rule below
    this.currentY += 4;
    this.doc.setDrawColor(...RULE);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);

    this.doc.setFont("helvetica", "normal");
    this.currentY += 10;
  }

  private addSubsectionHeader(title: string): void {
    this.checkPageBreak(20);

    this.doc.setFontSize(9.5);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...INK);
    this.doc.text(title, this.margin, this.currentY);
    this.doc.setFont("helvetica", "normal");
    this.currentY += 9;
  }

  // ─── Table styles ─────────────────────────────────────────────────────────
  private tableStyles() {
    return {
      theme: "plain" as const,
      headStyles: {
        fillColor: TBL_HEAD,
        textColor: INK as [number, number, number],
        fontStyle: "bold" as const,
        fontSize: 7.5,
        cellPadding: 3,
        lineColor: RULE as [number, number, number],
        lineWidth: 0.25,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.8,
        textColor: BODY as [number, number, number],
        lineColor: RULE as [number, number, number],
        lineWidth: 0.15,
      },
      alternateRowStyles: {
        fillColor: ALT_ROW,
      },
      margin: { left: this.margin, right: this.margin },
    };
  }

  // ─── Equity vs Balance chart ───────────────────────────────────────────────
  private addEquityVsBalanceChart(yearlyMetrics: any): void {
    this.checkPageBreak(90);

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...INK);
    this.doc.text("Equity Build-up vs. Remaining Loan Balance", this.margin, this.currentY);
    this.currentY += 5;

    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...LABEL);
    this.doc.text("Loan paydown and equity accumulation over the mortgage term", this.margin, this.currentY);
    this.currentY += 12;

    const yAxisW    = 18;
    const chartW    = Math.min(155, this.pageWidth - 2 * this.margin - yAxisW);
    const chartH    = 55;
    const chartX    = this.margin + yAxisW;
    const chartY    = this.currentY;

    const years       = [1, 2, 3, 4, 5, 10, 20];
    const equityData  = years.map((y) => yearlyMetrics[`year${y}`]?.equityBuildup   || 0);
    const balanceData = years.map((y) => yearlyMetrics[`year${y}`]?.remainingBalance || 0);
    const maxValue    = Math.max(...equityData, ...balanceData, 1);

    // Axes
    this.doc.setDrawColor(...RULE);
    this.doc.setLineWidth(0.4);
    // Y axis
    this.doc.line(chartX, chartY, chartX, chartY + chartH);
    // X axis
    this.doc.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    // Horizontal grid
    this.doc.setLineWidth(0.15);
    this.doc.setDrawColor(225, 228, 234);
    for (let i = 1; i <= 4; i++) {
      const gy = chartY + (chartH * i) / 4;
      this.doc.line(chartX, gy, chartX + chartW, gy);
    }

    // Y-axis labels
    this.doc.setFontSize(6.5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...LABEL);
    for (let i = 0; i <= 4; i++) {
      const val   = (maxValue * i) / 4;
      const label = `R${Math.round(val / 1000)}k`;
      const ly    = chartY + chartH - (chartH * i) / 4;
      const lw    = this.doc.getTextWidth(label);
      this.doc.text(label, chartX - lw - 2, ly + 1.5);
    }

    // X-axis labels
    years.forEach((year, idx) => {
      const x = chartX + (chartW * idx) / (years.length - 1);
      this.doc.text(`Y${year}`, x - 3, chartY + chartH + 6);
    });

    // Helper: draw a line series
    const drawSeries = (data: number[], color: [number, number, number], lw: number) => {
      this.doc.setDrawColor(...color);
      this.doc.setLineWidth(lw);
      for (let i = 0; i < years.length - 1; i++) {
        const x1 = chartX + (chartW * i)       / (years.length - 1);
        const y1 = chartY + chartH - (data[i]       / maxValue) * chartH;
        const x2 = chartX + (chartW * (i + 1)) / (years.length - 1);
        const y2 = chartY + chartH - (data[i + 1]   / maxValue) * chartH;
        this.doc.line(x1, y1, x2, y2);
      }
      // Data points
      this.doc.setFillColor(...color);
      data.forEach((val, idx) => {
        const x = chartX + (chartW * idx) / (years.length - 1);
        const y = chartY + chartH - (val / maxValue) * chartH;
        this.doc.circle(x, y, 1.2, "F");
      });
    };

    // Equity — dark ink
    drawSeries(equityData, INK, 0.7);
    // Balance — medium gray
    drawSeries(balanceData, [155, 165, 180], 0.7);

    // Legend
    this.currentY = chartY + chartH + 14;

    const legendY = this.currentY;
    this.doc.setLineWidth(1.5);
    this.doc.setDrawColor(...INK);
    this.doc.line(chartX, legendY, chartX + 12, legendY);
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(...BODY);
    this.doc.text("Equity Built", chartX + 15, legendY + 1);

    this.doc.setDrawColor(155, 165, 180);
    this.doc.line(chartX + 60, legendY, chartX + 72, legendY);
    this.doc.text("Remaining Balance", chartX + 75, legendY + 1);

    this.currentY = legendY + 12;
  }

  // ─── Disclaimers ──────────────────────────────────────────────────────────
  private addDisclaimersSection(): void {
    this.checkPageBreak(150);
    this.addSectionHeader("Important Disclaimers & Legal Notices");

    this.doc.setFontSize(8.5);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...BODY);

    const disclaimerText = `DISCLAIMER: The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While we make best efforts to ensure the accuracy and reliability of all data presented, including sourcing information from trusted third-party providers, we cannot guarantee its absolute accuracy or completeness.

This report is intended to serve as a general guide and should not be considered as financial, investment, legal, or professional advice.

Any decisions made based on this information are solely the responsibility of the user. Property investment carries inherent risks, and market conditions can change rapidly.

Proply Tech (Pty) Ltd and its affiliates expressly disclaim any and all liability for any direct, indirect, incidental, or consequential damages arising from the use of this information. Actual results may vary significantly from the projections and estimates presented.

By using this report, you acknowledge that the calculations and projections are indicative only and based on the information available at the time of generation. Factors beyond our control, including but not limited to market fluctuations, regulatory changes, and economic conditions, may impact actual outcomes.`;

    const paragraphs = disclaimerText.split("\n\n");
    paragraphs.forEach((paragraph, index) => {
      this.checkPageBreak(30);
      this.addWrappedText(paragraph.trim(), this.margin, this.pageWidth - 2 * this.margin);
      if (index < paragraphs.length - 1) this.currentY += 6;
    });

    this.currentY += 16;
  }

  // ─── Footer (all pages) ───────────────────────────────────────────────────
  private async addFooterToAllPages(): Promise<void> {
    const totalPages  = this.doc.getNumberOfPages();
    const currentYear = new Date().getFullYear();
    const footerY     = this.pageHeight - 14;

    // Load Proply logo once for footer
    let footerLogoBase64: string | null = null;
    try {
      const fs   = await import("fs");
      const path = await import("path");
      const lp   = path.join(process.cwd(), "client", "public", "proply-logo-auth.png");
      if (fs.existsSync(lp)) footerLogoBase64 = fs.readFileSync(lp).toString("base64");
    } catch { /* use text fallback */ }

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);

      // Thin rule
      this.doc.setDrawColor(...RULE);
      this.doc.setLineWidth(0.3);
      this.doc.line(this.margin, footerY, this.pageWidth - this.margin, footerY);

      const textY = footerY + 7;

      // Left — Proply logo or text
      if (footerLogoBase64) {
        const logoH = 5;
        const logoW = logoH * (868 / 229);
        this.doc.addImage(footerLogoBase64, "PNG", this.margin, footerY + 1, logoW, logoH);
      } else {
        this.doc.setFontSize(7);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(...LABEL);
        this.doc.text("PROPLY", this.margin, textY);
      }

      // Center — copyright
      this.doc.setFontSize(7);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...LABEL);
      const copy  = `© ${currentYear} Proply Tech (Pty) Ltd`;
      const copyW = this.doc.getTextWidth(copy);
      this.doc.text(copy, (this.pageWidth - copyW) / 2, textY);

      // Right — page number
      const pageStr  = `${i} / ${totalPages}`;
      const pageStrW = this.doc.getTextWidth(pageStr);
      this.doc.text(pageStr, this.pageWidth - this.margin - pageStrW, textY);
    }

    this.doc.setPage(1);
  }

  // ─── Utilities ────────────────────────────────────────────────────────────
  private addWrappedText(text: string, x: number, maxWidth: number): void {
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    const lines = this.doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      this.checkPageBreak();
      this.doc.text(line, x, this.currentY);
      this.currentY += 6;
    });
  }

  private checkPageBreak(requiredSpace: number = 20): void {
    const footerSpace = requiredSpace > 100 ? 35 : 20;
    if (this.currentY + requiredSpace > this.pageHeight - this.margin - footerSpace) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  // ─── Static factory ───────────────────────────────────────────────────────
  static async generateReport(propertyId: string): Promise<Buffer> {
    const service = new PropdataPdfService();
    return await service.generatePropertyReport(propertyId);
  }
}
