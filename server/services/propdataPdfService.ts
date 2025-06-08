import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { db } from "../../db";
import {
  propdataListings,
  valuationReports,
  rentalPerformanceData,
} from "../../db/schema";
import { eq } from "drizzle-orm";

interface PropertyPdfData {
  property: any;
  valuationReport: any;
  rentalData: any;
  savedValuationData: any;
}

interface PdfGenerationOptions {
  includeMap?: boolean;
  includeImages?: boolean;
}

// Enhanced Proply brand colors - using simple values for jsPDF compatibility
const PROPLY_BLUE = "#1ba2ff";
const PROPLY_SECONDARY = "#3b82f6";
const PROPLY_GRAY = "#6b7280";
const PROPLY_LIGHT_GRAY = "#f1f5f9";

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
      // Fetch all data from database - single source of truth
      const data = await this.fetchPropertyData(propertyId);

      if (!data.property) {
        throw new Error("Property not found");
      }

      // Initialize PDF with Proply branding
      await this.initializePdf();

      // Generate each section
      await this.addOverviewSection(data);
      await this.addValuationSection(data);
      await this.addRentalPerformanceSection(data);
      await this.addFinancialsSection(data);
      await this.addDetailsSection(data);

      // Add disclaimers section
      this.addDisclaimersSection();

      // Add footer to all pages
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
      console.log(`Fetching data for property ID: ${propertyId}`);

      // Fetch property data using PropData property ID with debugging
      console.log(`Looking for property with PropData ID: "${propertyId}"`);
      let property = await db.query.propdataListings.findFirst({
        where: eq(propdataListings.propdataId, propertyId),
      });

      // Additional debugging: try raw SQL if Drizzle query fails
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

      // Fetch valuation report with all financial data
      const valuationReport = await db.query.valuationReports.findFirst({
        where: eq(valuationReports.propertyId, propertyId),
      });

      console.log("Valuation report found:", !!valuationReport);

      // Fetch rental performance data
      const rentalData = await db.query.rentalPerformanceData.findFirst({
        where: eq(rentalPerformanceData.propertyId, propertyId),
      });

      console.log("Rental data found:", !!rentalData);
      console.log("Financial analysis data available:", {
        hasAnnualAppreciationData:
          !!valuationReport?.annualPropertyAppreciationData,
        hasCashflowAnalysisData: !!valuationReport?.cashflowAnalysisData,
        hasFinancingAnalysisData: !!valuationReport?.financingAnalysisData,
      });

      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found in database`);
      }

      return {
        property,
        valuationReport,
        rentalData,
        savedValuationData: valuationReport,
      };
    } catch (error) {
      console.error("Error fetching property data:", error);
      throw error;
    }
  }

  private async initializePdf(): Promise<void> {
    this.doc.setProperties({
      title: "Proply Property Investment Report",
      subject: "Property Investment Analysis",
      author: "Proply",
      creator: "Proply Tech (Pty) Ltd",
    });

    // Add Proply header
    await this.addProplyHeader();
  }

  private async addProplyHeader(): Promise<void> {
    // Simple clean header without colorful background

    // Add report title on the left
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(24);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Property Report", this.margin, this.margin + 15);

    // Load and add actual Proply PNG logo on the top right
    try {
      const fs = await import("fs");
      const path = await import("path");
      const logoPath = path.join(
        process.cwd(),
        "client",
        "public",
        "proply-logo-auth.png",
      );

      if (fs.existsSync(logoPath)) {
        console.log("Loading Proply logo from:", logoPath);
        const logoBuffer = fs.readFileSync(logoPath);
        const logoBase64 = logoBuffer.toString("base64");

        // Logo dimensions - using actual file dimensions (868 x 229)
        const logoHeight = 12;
        const logoAspectRatio = 868 / 229; // Actual aspect ratio: 3.79:1
        const logoWidth = logoHeight * logoAspectRatio;
        const logoX = this.pageWidth - this.margin - logoWidth;

        this.doc.addImage(
          logoBase64,
          "PNG",
          logoX,
          this.margin,
          logoWidth,
          logoHeight,
        );
        console.log("Successfully added Proply PNG logo to PDF");
      } else {
        console.log("Logo file not found at:", logoPath);
        // Fallback text logo
        const logoX = this.pageWidth - this.margin - 50;
        this.doc.setTextColor(27, 162, 255);
        this.doc.setFontSize(20);
        this.doc.setFont("helvetica", "bold");
        this.doc.text("PROPLY", logoX, this.margin + 15);
      }
    } catch (error) {
      console.error("Logo loading error:", error);
      // Fallback text logo
      const logoX = this.pageWidth - this.margin - 50;
      this.doc.setTextColor(27, 162, 255);
      this.doc.setFontSize(20);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("PROPLY", logoX, this.margin + 15);
    }

    // Add thin blue divider line below the heading
    this.doc.setDrawColor(27, 162, 255);
    this.doc.line(
      this.margin,
      this.margin + 25,
      this.pageWidth - this.margin,
      this.margin + 25,
    );

    // Reset text color
    this.doc.setTextColor(0, 0, 0);

    this.currentY = this.margin + 35;
  }

  private async addOverviewSection(data: PropertyPdfData): Promise<void> {
    this.addSectionHeader("Property Overview");

    if (!data.property) {
      this.doc.text("Property data not available", this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    // Property address with "Address:" prefix
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(
      `Address: ${data.property.address || "Address not available"}`,
      this.margin,
      this.currentY,
    );
    this.currentY += 15;

    // Property details in two columns
    this.doc.setFontSize(10);
    this.doc.setTextColor(0, 0, 0);

    const leftColumn = this.margin;
    const rightColumn = this.margin + 90;

    // Helper function to add text with bold label and normal value
    const addLabelValue = (label: string, value: any, x: number, y: number) => {
      this.doc.setFont("helvetica", "bold");
      const labelWidth = this.doc.getTextWidth(label);
      this.doc.text(label, x, y);

      this.doc.setFont("helvetica", "normal");
      // Ensure value is always a string
      const stringValue =
        value === null || value === undefined ? "N/A" : String(value);
      this.doc.text(stringValue, x + labelWidth, y);
    };

    // Left column
    const formattedPrice = data.property.price
      ? Number(data.property.price).toLocaleString("en-ZA")
      : "N/A";
    addLabelValue("Price: ", `R${formattedPrice}`, leftColumn, this.currentY);
    addLabelValue(
      "Property Type: ",
      data.property.propertyType || "N/A",
      leftColumn,
      this.currentY + 8,
    );
    addLabelValue(
      "Bedrooms: ",
      data.property.bedrooms || "N/A",
      leftColumn,
      this.currentY + 16,
    );
    addLabelValue(
      "Bathrooms: ",
      data.property.bathrooms || "N/A",
      leftColumn,
      this.currentY + 24,
    );

    // Right column
    addLabelValue(
      "Floor Size: ",
      `${data.property.floorSize || "N/A"} m²`,
      rightColumn,
      this.currentY,
    );
    addLabelValue(
      "Land Size: ",
      `${data.property.landSize || "N/A"} m²`,
      rightColumn,
      this.currentY + 8,
    );
    addLabelValue(
      "Parking: ",
      `${data.property.parkingSpaces || "N/A"} spaces`,
      rightColumn,
      this.currentY + 16,
    );
    const formattedLevy = data.property.monthlyLevy
      ? Number(data.property.monthlyLevy).toLocaleString("en-ZA")
      : "N/A";
    addLabelValue(
      "Monthly Levy: ",
      `R${formattedLevy}`,
      rightColumn,
      this.currentY + 24,
    );

    this.currentY += 40;

    // Add static map and property image side by side
    await this.addMapAndImage(data);

    this.currentY += 10;
  }

  private async addMapAndImage(data: PropertyPdfData): Promise<void> {
    console.log("=== Starting addMapAndImage method ===");
    // Calculate dimensions to fit within page margins
    const availableWidth = this.pageWidth - 2 * this.margin;
    const spacing = 10;
    const mapWidth = (availableWidth - spacing) / 2;
    const mapHeight = 60;
    const imageWidth = (availableWidth - spacing) / 2;
    const imageHeight = 60;

    // Add static Google Map
    console.log("Property location data:", data.property?.location);
    console.log("Property location type:", typeof data.property?.location);
    console.log("Property address for geocoding:", data.property?.address);

    // Force geocoding instead of using stored coordinates for accurate location
    let locationData = null;
    console.log("Forcing geocoding for accurate property location");

    if (false) {
      // Disable stored coordinates
      console.log(
        `Using stored coordinates: lat=${locationData.latitude}, lng=${locationData.longitude}`,
      );
      console.log(`Property address: ${data.property.address}`);

      try {
        const mapUrl = await this.generateStaticMapUrl(
          locationData.latitude,
          locationData.longitude,
          data.property.address || "Property Location",
        );

        console.log("Generated map URL:", mapUrl);
        const mapResponse = await fetch(mapUrl);

        if (!mapResponse.ok) {
          const errorText = await mapResponse.text();
          console.error(
            `Google Maps API error: ${mapResponse.status} ${mapResponse.statusText} - ${errorText}`,
          );
          throw new Error(
            `Google Maps API error: ${mapResponse.status} ${mapResponse.statusText}`,
          );
        }

        const mapBuffer = await mapResponse.arrayBuffer();
        const mapBase64 = Buffer.from(mapBuffer).toString("base64");

        this.doc.addImage(
          mapBase64,
          "JPEG",
          this.margin,
          this.currentY,
          mapWidth,
          mapHeight,
        );
        console.log("Successfully added Google Map to PDF");
      } catch (error) {
        console.error("Error generating map:", error);
        // Fallback to placeholder
        this.doc.setFillColor(241, 245, 249);
        this.doc.rect(this.margin, this.currentY, mapWidth, mapHeight, "F");
        this.doc.setTextColor(107, 114, 128);
        this.doc.setFontSize(9);
        this.doc.text(
          "Property Location Map",
          this.margin + 5,
          this.currentY + mapHeight / 2,
        );
      }
    } else {
      console.log(
        "No property location coordinates found, trying to geocode address...",
      );
      console.log("Available property data:", Object.keys(data.property || {}));
      console.log("Property address value:", data.property?.address);

      // Try to use address for geocoding as fallback
      if (data.property?.address) {
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(data.property.address)}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;
          console.log("Geocoding address:", data.property.address);

          const geocodeResponse = await fetch(geocodeUrl);
          const geocodeData = await geocodeResponse.json();

          console.log("Geocoding API response status:", geocodeData.status);
          console.log(
            "Geocoding API results count:",
            geocodeData.results?.length || 0,
          );

          if (
            geocodeData.results &&
            geocodeData.results[0] &&
            geocodeData.results[0].geometry
          ) {
            const location = geocodeData.results[0].geometry.location;
            console.log("Geocoded location:", location);

            const mapUrl = await this.generateStaticMapUrl(
              location.lat,
              location.lng,
              data.property.address,
            );

            console.log("Generated map URL from geocoding:", mapUrl);
            const mapResponse = await fetch(mapUrl);

            if (mapResponse.ok) {
              const mapBuffer = await mapResponse.arrayBuffer();
              const mapBase64 = Buffer.from(mapBuffer).toString("base64");

              this.doc.addImage(
                mapBase64,
                "JPEG",
                this.margin,
                this.currentY,
                mapWidth,
                mapHeight,
              );
              console.log("Successfully added geocoded map to PDF");
            } else {
              throw new Error(`Map API error: ${mapResponse.status}`);
            }
          } else {
            throw new Error("No geocoding results found");
          }
        } catch (error) {
          console.error("Error with geocoding/map:", error);

          // Add placeholder with geocoding error info
          this.doc.setFillColor(240, 240, 240);
          this.doc.rect(this.margin, this.currentY, mapWidth, mapHeight, "F");
          this.doc.setDrawColor(200, 200, 200);
          this.doc.rect(this.margin, this.currentY, mapWidth, mapHeight, "S");
          this.doc.setTextColor(100, 100, 100);
          this.doc.setFontSize(8);
          this.doc.text(
            "Map unavailable",
            this.margin + 5,
            this.currentY + mapHeight / 2 - 4,
          );
          this.doc.text(
            "Geocoding failed",
            this.margin + 5,
            this.currentY + mapHeight / 2 + 4,
          );
        }
      } else {
        // No address available, use placeholder
        this.doc.setFillColor(241, 245, 249);
        this.doc.rect(this.margin, this.currentY, mapWidth, mapHeight, "F");
        this.doc.setTextColor(107, 114, 128);
        this.doc.setFontSize(9);
        this.doc.text(
          "Property Location Map",
          this.margin + 5,
          this.currentY + mapHeight / 2,
        );
      }
    }

    // Add property image
    console.log("Property images data:", data.property?.images);
    console.log("Property data structure:", Object.keys(data.property || {}));

    // Check multiple possible image field names
    const images =
      data.property?.images ||
      data.property?.imageUrls ||
      data.property?.propertyImages;
    const imageUrl =
      images?.[0] || data.property?.mainImage || data.property?.primaryImage;

    if (imageUrl) {
      try {
        console.log("Attempting to load image from URL:", imageUrl);
        const response = await fetch(imageUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString("base64");

        // Determine image format
        const format = imageUrl.toLowerCase().includes(".png") ? "PNG" : "JPEG";

        this.doc.addImage(
          imageBase64,
          format,
          this.margin + mapWidth + spacing,
          this.currentY,
          imageWidth,
          imageHeight,
        );
        console.log("Successfully added property image to PDF");
      } catch (error) {
        console.error("Error loading property image:", error);
        // Fallback to placeholder
        this.doc.setFillColor(241, 245, 249);
        this.doc.rect(
          this.margin + mapWidth + spacing,
          this.currentY,
          imageWidth,
          imageHeight,
          "F",
        );
        this.doc.setTextColor(107, 114, 128);
        this.doc.setFontSize(9);
        this.doc.text(
          "Property Image",
          this.margin + mapWidth + spacing + 5,
          this.currentY + imageHeight / 2,
        );
      }
    } else {
      console.log("No property image URL found in data");
      // Placeholder when no image available
      this.doc.setFillColor(241, 245, 249);
      this.doc.rect(
        this.margin + mapWidth + spacing,
        this.currentY,
        imageWidth,
        imageHeight,
        "F",
      );
      this.doc.setTextColor(107, 114, 128);
      this.doc.setFontSize(9);
      this.doc.text(
        "Property Image",
        this.margin + mapWidth + spacing + 5,
        this.currentY + imageHeight / 2,
      );
    }

    this.currentY += mapHeight;
  }

  private async generateStaticMapUrl(
    lat: number,
    lng: number,
    address: string,
  ): Promise<string> {
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=400x300&maptype=satellite&markers=color:red%7Clabel:P%7C${lat},${lng}&key=${apiKey}`;
  }

  private addValuationSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader("Valuation Analysis");

    if (!data.valuationReport?.valuationData) {
      this.doc.text("No valuation data available", this.margin, this.currentY);
      this.currentY += 15;
      return;
    }

    const valuation = data.valuationReport.valuationData as any;

    // Property Summary
    if (valuation.summary) {
      this.addSubsectionHeader("Property Summary");
      this.doc.setFontSize(10);
      this.addWrappedText(
        valuation.summary,
        this.margin,
        this.pageWidth - 2 * this.margin,
      );
      this.currentY += 10;
    }

    // Valuation Estimates Table
    if (valuation.valuations && Array.isArray(valuation.valuations)) {
      this.addSubsectionHeader("Valuation Estimates");

      // Convert hex color to RGB for jsPDF
      const proplyBlueRGB = [27, 162, 255]; // #1ba2ff converted to RGB

      const tableData = valuation.valuations.map((val: any) => [
        val.type || "",
        val.formula || "N/A",
        `R${(val.value || 0).toLocaleString("en-ZA")}`,
      ]);

      (this.doc as any).autoTable({
        startY: this.currentY,
        head: [["Estimate Type", "Size × Rate/m²", "Valuation"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: proplyBlueRGB,
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 8,
          cellPadding: 1.5,
        },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { halign: "left", cellWidth: 50 },
          1: { halign: "center", cellWidth: 60 },
          2: { halign: "right", cellWidth: 60 },
        },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
    }

    // Property Appreciation Analysis
    if (valuation.propertyAppreciation) {
      this.addSubsectionHeader("Property Appreciation Forecast");
      this.doc.setFontSize(10);

      const appreciation = valuation.propertyAppreciation;
      if (appreciation.annualAppreciationRate) {
        this.doc.text(
          `Annual Appreciation Rate: ${appreciation.annualAppreciationRate}%`,
          this.margin,
          this.currentY,
        );
        this.currentY += 12;
      }

      // 5-year projection table - transposed with years as columns
      if (
        appreciation.fiveYearProjection &&
        Array.isArray(appreciation.fiveYearProjection)
      ) {
        const yearHeaders = appreciation.fiveYearProjection.map(
          (proj: any) => proj.year?.toString() || "",
        );
        const valueRow = [
          "Estimated Value",
          ...appreciation.fiveYearProjection.map(
            (proj: any) =>
              `R${(proj.estimatedValue || 0).toLocaleString("en-ZA")}`,
          ),
        ];

        (this.doc as any).autoTable({
          startY: this.currentY,
          head: [["Metric", ...yearHeaders]],
          body: [valueRow],
          theme: "grid",
          headStyles: {
            fillColor: [27, 162, 255],
            textColor: 255,
            fontStyle: "bold",
          },
          styles: {
            fontSize: 8,
            cellPadding: 1,
          },
          margin: { left: this.margin, right: this.margin },
          columnStyles: {
            0: { halign: "left" },
            ...Object.fromEntries(
              Array.from({ length: yearHeaders.length }, (_, i) => [
                i + 1,
                { halign: "right" },
              ]),
            ),
          },
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
      }

      if (appreciation.summary) {
        this.addWrappedText(
          appreciation.summary,
          this.margin,
          this.pageWidth - 2 * this.margin,
        );
        this.currentY += 10;
      }
    }

    // Market Context
    if (valuation.marketContext) {
      this.addSubsectionHeader("Market Context");
      this.doc.setFontSize(10);
      this.addWrappedText(
        valuation.marketContext,
        this.margin,
        this.pageWidth - 2 * this.margin,
      );
      this.currentY += 15;
    }
  }

  private addRentalPerformanceSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader("Rental Performance Analysis");

    // Get rental data from valuation report
    const valuationData = data.valuationReport?.valuationData as any;
    if (!valuationData?.rentalPerformance) {
      this.doc.text(
        "No rental performance data available",
        this.margin,
        this.currentY,
      );
      this.currentY += 15;
      return;
    }

    const rentalPerformance = valuationData.rentalPerformance;

    // Long-term rental analysis
    if (rentalPerformance.longTerm) {
      this.addSubsectionHeader("Long-Term Rental Analysis");
      const longTerm = rentalPerformance.longTerm;
      this.doc.setFontSize(10);

      this.doc.text(
        `Monthly Rental Range: R${(longTerm.minRental || 0).toLocaleString("en-ZA")} - R${(longTerm.maxRental || 0).toLocaleString("en-ZA")}`,
        this.margin,
        this.currentY,
      );
      this.currentY += 10;
      this.doc.text(
        `Yield Range: ${longTerm.minYield || 0}% - ${longTerm.maxYield || 0}%`,
        this.margin,
        this.currentY,
      );
      this.currentY += 10;

      if (longTerm.reasoning) {
        this.doc.text("Analysis:", this.margin, this.currentY);
        this.currentY += 8;
        this.addWrappedText(
          longTerm.reasoning,
          this.margin + 5,
          this.pageWidth - 2 * this.margin - 5,
        );
        this.currentY += 10;
      }
    }

    // Short-term rental analysis
    if (rentalPerformance.shortTerm) {
      this.addSubsectionHeader("Short-Term Rental (Airbnb) Analysis");
      const shortTerm = rentalPerformance.shortTerm;
      this.doc.setFontSize(10);

      if (shortTerm.occupancy) {
        this.doc.text(
          `Average Occupancy Rate: ${shortTerm.occupancy}%`,
          this.margin,
          this.currentY,
        );
        this.currentY += 10;
      }

      // Create table for percentile data
      if (
        shortTerm.percentile25 ||
        shortTerm.percentile50 ||
        shortTerm.percentile75 ||
        shortTerm.percentile90
      ) {
        const percentileData = [];

        if (shortTerm.percentile25) {
          percentileData.push([
            "25th Percentile (Conservative)",
            `R${(shortTerm.percentile25.nightly || 0).toLocaleString("en-ZA")}`,
            `R${(shortTerm.percentile25.monthly || 0).toLocaleString("en-ZA")}`,
            `R${(shortTerm.percentile25.annual || 0).toLocaleString("en-ZA")}`,
          ]);
        }
        if (shortTerm.percentile50) {
          percentileData.push([
            "50th Percentile (Average)",
            `R${(shortTerm.percentile50.nightly || 0).toLocaleString("en-ZA")}`,
            `R${(shortTerm.percentile50.monthly || 0).toLocaleString("en-ZA")}`,
            `R${(shortTerm.percentile50.annual || 0).toLocaleString("en-ZA")}`,
          ]);
        }
        if (shortTerm.percentile75) {
          percentileData.push([
            "75th Percentile (Premium)",
            `R${(shortTerm.percentile75.nightly || 0).toLocaleString("en-ZA")}`,
            `R${(shortTerm.percentile75.monthly || 0).toLocaleString("en-ZA")}`,
            `R${(shortTerm.percentile75.annual || 0).toLocaleString("en-ZA")}`,
          ]);
        }
        if (shortTerm.percentile90) {
          percentileData.push([
            "90th Percentile (Luxury)",
            `R${(shortTerm.percentile90.nightly || 0).toLocaleString("en-ZA")}`,
            `R${(shortTerm.percentile90.monthly || 0).toLocaleString("en-ZA")}`,
            `R${(shortTerm.percentile90.annual || 0).toLocaleString("en-ZA")}`,
          ]);
        }

        (this.doc as any).autoTable({
          startY: this.currentY,
          head: [
            [
              "Performance Level",
              "Nightly Rate",
              "Monthly Income",
              "Annual Income",
            ],
          ],
          body: percentileData,
          theme: "grid",
          headStyles: {
            fillColor: [27, 162, 255],
            textColor: 255,
            fontStyle: "bold",
          },
          styles: { fontSize: 8 },
          margin: { left: this.margin, right: this.margin },
          columnStyles: {
            0: { halign: "left" },
            1: { halign: "right" },
            2: { halign: "right" },
            3: { halign: "right" },
          },
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
      }
    }
  }

  private addFinancialsSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader("Financial Analysis");

    // Financing parameters from saved valuation data
    if (data.valuationReport?.financingAnalysisData) {
      this.addSubsectionHeader("Financing Details");

      const financing =
        data.valuationReport.financingAnalysisData.financingParameters;
      const yearlyMetrics =
        data.valuationReport.financingAnalysisData.yearlyMetrics;

      if (financing) {
        // Financing overview in left-aligned single column format
        this.doc.setFontSize(10);
        const leftColumn = this.margin;

        // Bold labels with normal values helper function
        const addFinancingDetail = (
          label: string,
          value: string,
          yPos: number,
        ) => {
          this.doc.setFont("helvetica", "bold");
          this.doc.text(`${label} `, leftColumn, yPos);

          const labelWidth = this.doc.getTextWidth(`${label} `);
          this.doc.setFont("helvetica", "normal");
          this.doc.text(value, leftColumn + labelWidth, yPos);
        };

        addFinancingDetail(
          "Deposit:",
          `R${Math.round(financing.depositAmount)?.toLocaleString()} (${financing.depositPercentage}%)`,
          this.currentY,
        );
        this.currentY += 8;

        addFinancingDetail(
          "Loan Amount:",
          `R${Math.round(financing.loanAmount)?.toLocaleString()}`,
          this.currentY,
        );
        this.currentY += 8;

        addFinancingDetail(
          "Interest Rate:",
          `${financing.interestRate}%`,
          this.currentY,
        );
        this.currentY += 8;

        addFinancingDetail(
          "Term:",
          `${financing.loanTerm} years`,
          this.currentY,
        );
        this.currentY += 15;

        // Financing metrics table
        if (yearlyMetrics) {
          const tableData = [];
          const years = [1, 2, 3, 4, 5, 10, 20];

          // Monthly Bond Payment row
          const bondPaymentRow = ["Monthly Bond Payment"];
          years.forEach((year) => {
            const metric = yearlyMetrics[`year${year}`];
            bondPaymentRow.push(
              `R${Math.round(metric?.monthlyPayment || 0).toLocaleString()}`,
            );
          });
          tableData.push(bondPaymentRow);

          // Equity Build-up row
          const equityRow = ["Equity Build-up"];
          years.forEach((year) => {
            const metric = yearlyMetrics[`year${year}`];
            equityRow.push(
              `R${Math.round(metric?.equityBuildup || 0).toLocaleString()}`,
            );
          });
          tableData.push(equityRow);

          // Remaining Loan Balance row
          const balanceRow = ["Remaining Loan Balance"];
          years.forEach((year) => {
            const metric = yearlyMetrics[`year${year}`];
            balanceRow.push(
              `R${Math.round(metric?.remainingBalance || 0).toLocaleString()}`,
            );
          });
          tableData.push(balanceRow);

          (this.doc as any).autoTable({
            startY: this.currentY,
            head: [["Metric", "Y1", "Y2", "Y3", "Y4", "Y5", "Y10", "Y20"]],
            body: tableData,
            theme: "grid",
            headStyles: {
              fillColor: [27, 162, 255],
              textColor: 255,
              fontStyle: "bold",
              fontSize: 8,
            },
            styles: {
              fontSize: 8,
              cellPadding: 1.5,
            },
            margin: { left: this.margin, right: this.margin },
            tableWidth: "auto",
            columnStyles: {
              0: { halign: "left" },
              1: { halign: "right" },
              2: { halign: "right" },
              3: { halign: "right" },
              4: { halign: "right" },
              5: { halign: "right" },
              6: { halign: "right" },
              7: { halign: "right" },
            },
            bodyStyles: {
              0: { fillColor: [245, 245, 245] }, // Light gray for bond payment
              1: { fillColor: [220, 255, 220] }, // Light green for equity
              2: { fillColor: [255, 220, 220] }, // Light red for remaining balance
            },
          });

          this.currentY = (this.doc as any).lastAutoTable.finalY + 20;

          // Add equity build-up vs loan balance chart
          this.addEquityVsBalanceChart(yearlyMetrics);
        }
      }
    }

    // Revenue projections from saved valuation data
    if (data.valuationReport?.cashflowAnalysisData?.revenueGrowthTrajectory) {
      this.addSubsectionHeader("Revenue Projections (8% Annual Growth)");

      const trajectory =
        data.valuationReport.cashflowAnalysisData.revenueGrowthTrajectory;

      if (trajectory.shortTerm) {
        this.doc.text(
          "Short-Term Rental Projections:",
          this.margin,
          this.currentY,
        );
        this.currentY += 8;

        // Convert to transposed table format (years as columns)
        const shortTermEntries = Object.entries(trajectory.shortTerm);
        const yearHeaders = shortTermEntries.map(
          ([year]) => `Year ${year.replace("year", "")}`,
        );
        const revenueRow = [
          "Revenue",
          ...shortTermEntries.map(
            ([, data]: [string, any]) =>
              `R${data.revenue?.toLocaleString() || 0}`,
          ),
        ];
        const yieldRow = [
          "Yield",
          ...shortTermEntries.map(
            ([, data]: [string, any]) => `${data.grossYield?.toFixed(1) || 0}%`,
          ),
        ];

        (this.doc as any).autoTable({
          startY: this.currentY,
          head: [["Metric", ...yearHeaders]],
          body: [revenueRow, yieldRow],
          theme: "grid",
          headStyles: {
            fillColor: [27, 162, 255],
            textColor: 255,
            fontStyle: "bold",
          },
          styles: { fontSize: 8 },
          margin: { left: this.margin, right: this.margin },
          columnStyles: {
            0: { halign: "left" },
            ...Object.fromEntries(
              Array.from({ length: yearHeaders.length }, (_, i) => [
                i + 1,
                { halign: "right" },
              ]),
            ),
          },
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
      }

      if (trajectory.longTerm) {
        this.doc.text(
          "Long-Term Rental Projections:",
          this.margin,
          this.currentY,
        );
        this.currentY += 8;

        // Convert to transposed table format (years as columns)
        const longTermEntries = Object.entries(trajectory.longTerm);
        const yearHeaders = longTermEntries.map(
          ([year]) => `Year ${year.replace("year", "")}`,
        );
        const revenueRow = [
          "Revenue",
          ...longTermEntries.map(
            ([, data]: [string, any]) =>
              `R${data.revenue?.toLocaleString() || 0}`,
          ),
        ];
        const yieldRow = [
          "Yield",
          ...longTermEntries.map(
            ([, data]: [string, any]) => `${data.grossYield?.toFixed(1) || 0}%`,
          ),
        ];

        (this.doc as any).autoTable({
          startY: this.currentY,
          head: [["Metric", ...yearHeaders]],
          body: [revenueRow, yieldRow],
          theme: "grid",
          headStyles: {
            fillColor: [27, 162, 255],
            textColor: 255,
            fontStyle: "bold",
          },
          styles: { fontSize: 8 },
          margin: { left: this.margin, right: this.margin },
          columnStyles: {
            0: { halign: "left" },
            ...Object.fromEntries(
              Array.from({ length: yearHeaders.length }, (_, i) => [
                i + 1,
                { halign: "right" },
              ]),
            ),
          },
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
      }
    }

    // Property Appreciation Projections
    if (data.valuationReport?.annualPropertyAppreciationData) {
      this.addSubsectionHeader("Property Value Appreciation");

      const appreciation = data.valuationReport.annualPropertyAppreciationData;

      this.doc.setFontSize(10);
      this.doc.text(
        `Annual Appreciation Rate: ${appreciation.finalAppreciationRate}%`,
        this.margin,
        this.currentY,
      );
      this.currentY += 8;

      if (appreciation.yearlyValues) {
        this.doc.text(
          "Property Value Projections:",
          this.margin,
          this.currentY,
        );
        this.currentY += 8;

        // Convert to transposed table format (years as columns)
        const keyYears = [
          "year1",
          "year2",
          "year3",
          "year5",
          "year10",
          "year20",
        ];
        const validYears = keyYears.filter(
          (yearKey) => appreciation.yearlyValues[yearKey],
        );
        const yearHeaders = validYears.map(
          (yearKey) => `Year ${yearKey.replace("year", "")}`,
        );
        const valueRow = [
          "Property Value",
          ...validYears.map(
            (yearKey) =>
              `R${Math.round(appreciation.yearlyValues[yearKey]).toLocaleString()}`,
          ),
        ];

        (this.doc as any).autoTable({
          startY: this.currentY,
          head: [["Metric", ...yearHeaders]],
          body: [valueRow],
          theme: "grid",
          headStyles: {
            fillColor: [27, 162, 255],
            textColor: 255,
            fontStyle: "bold",
          },
          styles: { fontSize: 8 },
          margin: { left: this.margin, right: this.margin },
          columnStyles: {
            0: { halign: "left" },
            ...Object.fromEntries(
              Array.from({ length: yearHeaders.length }, (_, i) => [
                i + 1,
                { halign: "right" },
              ]),
            ),
          },
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
      }
    }

    // Equity buildup from saved valuation data
    if (data.valuationReport?.financingAnalysisData?.yearlyMetrics) {
      this.addSubsectionHeader("Equity Buildup Schedule");

      const metrics = data.valuationReport.financingAnalysisData.yearlyMetrics;
      const metricEntries = Object.entries(metrics);
      const yearHeaders = metricEntries.map(
        ([year]) => `Year ${year.replace("year", "")}`,
      );
      const equityRow = [
        "Equity Built",
        ...metricEntries.map(
          ([, data]: [string, any]) =>
            `R${Math.round(data.equityBuildup)?.toLocaleString()}`,
        ),
      ];
      const balanceRow = [
        "Remaining Balance",
        ...metricEntries.map(
          ([, data]: [string, any]) =>
            `R${Math.round(data.remainingBalance)?.toLocaleString()}`,
        ),
      ];

      (this.doc as any).autoTable({
        startY: this.currentY,
        head: [["Metric", ...yearHeaders]],
        body: [equityRow, balanceRow],
        theme: "grid",
        headStyles: {
          fillColor: [27, 162, 255],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: { fontSize: 8 },
        margin: { left: this.margin, right: this.margin },
        columnStyles: {
          0: { halign: "left" },
          ...Object.fromEntries(
            Array.from({ length: yearHeaders.length }, (_, i) => [
              i + 1,
              { halign: "right" },
            ]),
          ),
        },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
    }
  }

  private addDetailsSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader("Additional Details");

    // Agent information
    if (data.property.agent) {
      this.addSubsectionHeader("Agent Information");
      this.doc.setFontSize(10);
      this.doc.text(
        `Agent: ${data.property.agent.name || "N/A"}`,
        this.margin,
        this.currentY,
      );
      this.currentY += 6;
      this.doc.text(
        `Phone: ${data.property.agent.phone || "N/A"}`,
        this.margin,
        this.currentY,
      );
      this.currentY += 6;
      this.doc.text(
        `Email: ${data.property.agent.email || "N/A"}`,
        this.margin,
        this.currentY,
      );
      this.currentY += 15;
    }

    // Property features section removed per user request

    // Additional property information
    this.addSubsectionHeader("Additional Information");
    this.doc.setFontSize(10);
    this.doc.text(
      `Property ID: ${data.property.propdataId}`,
      this.margin,
      this.currentY,
    );
    this.currentY += 6;
    this.doc.text(
      `Agent: ${data.property.agentName || "N/A"}`,
      this.margin,
      this.currentY,
    );
    this.currentY += 6;
    this.doc.text(
      `Last Updated: ${new Date(data.property.lastModified || new Date()).toLocaleDateString()}`,
      this.margin,
      this.currentY,
    );
    this.currentY += 6;
    this.doc.text(
      `Status: ${data.property.status}`,
      this.margin,
      this.currentY,
    );
    this.currentY += 15;

    // Report generation info
    this.doc.setFontSize(8);
    this.doc.setTextColor(107, 114, 128);
    this.doc.text(
      `Report generated on ${new Date().toLocaleDateString()} by Proply Tech (Pty) Ltd`,
      this.margin,
      this.currentY,
    );
    this.doc.text(
      "This report is valid for 30 days from generation date.",
      this.margin,
      this.currentY + 6,
    );
  }

  private addSectionHeader(title: string): void {
    this.checkPageBreak(30);

    // Remove blue background, just add text
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.margin, this.currentY + 8);

    this.currentY += 20;
  }

  private addSubsectionHeader(title: string): void {
    this.checkPageBreak(20);

    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(27, 162, 255);
    this.doc.text(title, this.margin, this.currentY);

    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont("helvetica", "normal");
    this.currentY += 10;
  }

  private addWrappedText(text: string, x: number, maxWidth: number): void {
    const lines = this.doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      this.checkPageBreak();
      this.doc.text(line, x, this.currentY);
      this.currentY += 6;
    });
  }

  private checkPageBreak(requiredSpace: number = 20): void {
    // Reserve space at bottom for footer (20pt for normal content, 35pt for large sections)
    const footerSpace = requiredSpace > 100 ? 35 : 20;
    if (
      this.currentY + requiredSpace >
      this.pageHeight - this.margin - footerSpace
    ) {
      this.doc.addPage();
      this.currentY = this.margin; // Start from top margin on new pages
    }
  }

  private addEquityVsBalanceChart(yearlyMetrics: any): void {
    this.checkPageBreak(100);

    // Chart title
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(
      "Equity Build-up vs Loan Balance",
      this.margin,
      this.currentY,
    );
    this.currentY += 6;

    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(
      "Visualization of loan paydown and equity accumulation over time",
      this.margin,
      this.currentY,
    );
    this.currentY += 15;

    // Chart dimensions - made more compact
    const availableWidth = this.pageWidth - 2 * this.margin;
    const chartWidth = Math.min(150, availableWidth - 20); // Leave margin for y-axis labels
    const chartHeight = 60; // Reduced height
    const chartX = this.margin + 15; // Space for y-axis labels
    const chartY = this.currentY;

    // Draw chart background
    this.doc.setFillColor(248, 249, 250);
    this.doc.rect(chartX, chartY, chartWidth, chartHeight, "F");
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(chartX, chartY, chartWidth, chartHeight, "S");

    // Extract data points
    const years = [1, 2, 3, 4, 5, 10, 20];
    const equityData = years.map(
      (year) => yearlyMetrics[`year${year}`]?.equityBuildup || 0,
    );
    const balanceData = years.map(
      (year) => yearlyMetrics[`year${year}`]?.remainingBalance || 0,
    );

    const maxValue = Math.max(...equityData, ...balanceData);
    const scale = chartHeight / maxValue;

    // Draw grid lines
    this.doc.setDrawColor(220, 220, 220);
    for (let i = 1; i <= 4; i++) {
      const y = chartY + (chartHeight * i) / 4;
      this.doc.line(chartX, y, chartX + chartWidth, y);
    }

    // Draw vertical grid lines
    years.forEach((year, index) => {
      const x = chartX + (chartWidth * index) / (years.length - 1);
      this.doc.line(x, chartY, x, chartY + chartHeight);
    });

    // Plot equity line (green)
    this.doc.setDrawColor(34, 197, 94); // Green
    this.doc.setLineWidth(0.5);

    for (let i = 0; i < years.length - 1; i++) {
      const x1 = chartX + (chartWidth * i) / (years.length - 1);
      const y1 = chartY + chartHeight - equityData[i] * scale;
      const x2 = chartX + (chartWidth * (i + 1)) / (years.length - 1);
      const y2 = chartY + chartHeight - equityData[i + 1] * scale;

      this.doc.line(x1, y1, x2, y2);

      // Add data point circles
      this.doc.setFillColor(34, 197, 94);
      this.doc.circle(x1, y1, 1, "F");
    }

    // Last point
    const lastX = chartX + chartWidth;
    const lastY =
      chartY + chartHeight - equityData[equityData.length - 1] * scale;
    this.doc.circle(lastX, lastY, 1, "F");

    // Plot balance line (red)
    this.doc.setDrawColor(239, 68, 68); // Red
    this.doc.setLineWidth(0.5);

    for (let i = 0; i < years.length - 1; i++) {
      const x1 = chartX + (chartWidth * i) / (years.length - 1);
      const y1 = chartY + chartHeight - balanceData[i] * scale;
      const x2 = chartX + (chartWidth * (i + 1)) / (years.length - 1);
      const y2 = chartY + chartHeight - balanceData[i + 1] * scale;

      this.doc.line(x1, y1, x2, y2);

      // Add data point circles
      this.doc.setFillColor(239, 68, 68);
      this.doc.circle(x1, y1, 1, "F");
    }

    // Last point
    const lastBalanceY =
      chartY + chartHeight - balanceData[balanceData.length - 1] * scale;
    this.doc.circle(lastX, lastBalanceY, 1, "F");

    // Add year labels on x-axis
    this.doc.setTextColor(100, 100, 100);
    this.doc.setFontSize(7);
    years.forEach((year, index) => {
      const x = chartX + (chartWidth * index) / (years.length - 1);
      this.doc.text(`Y${year}`, x - 4, chartY + chartHeight + 6);
    });

    // Add y-axis labels
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue * i) / 4;
      const label = `R${Math.round(value / 1000)}k`;
      const y = chartY + chartHeight - (chartHeight * i) / 4;
      this.doc.text(label, chartX - 12, y + 1);
    }

    // Add compact legend
    this.currentY = chartY + chartHeight + 15;

    // Equity Built legend
    this.doc.setFillColor(34, 197, 94);
    this.doc.circle(chartX + 5, this.currentY, 1.5, "F");
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(8);
    this.doc.text("Equity Built", chartX + 10, this.currentY + 1);

    // Remaining Balance legend
    this.doc.setFillColor(239, 68, 68);
    this.doc.circle(chartX + 60, this.currentY, 1.5, "F");
    this.doc.text("Remaining Balance", chartX + 65, this.currentY + 1);

    this.currentY += 15;
  }

  private addDisclaimersSection(): void {
    this.checkPageBreak(150); // Ensure enough space for disclaimers
    this.addSectionHeader("Important Disclaimers & Legal Notices");

    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal"); // Set to normal weight (not bold)
    this.doc.setTextColor(60, 60, 60);

    const disclaimerText = `DISCLAIMER: The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While we make best efforts to ensure the accuracy and reliability of all data presented, including sourcing information from trusted third-party providers, we cannot guarantee its absolute accuracy or completeness.

This report is intended to serve as a general guide and should not be considered as financial, investment, legal, or professional advice.

Any decisions made based on this information are solely the responsibility of the user. Property investment carries inherent risks, and market conditions can change rapidly.

Proply Tech (Pty) Ltd and its affiliates expressly disclaim any and all liability for any direct, indirect, incidental, or consequential damages arising from the use of this information. Actual results may vary significantly from the projections and estimates presented.

By using this report, you acknowledge that the calculations and projections are indicative only and based on the information available at the time of generation. Factors beyond our control, including but not limited to market fluctuations, regulatory changes, and economic conditions, may impact actual outcomes.`;

    // Split disclaimer into paragraphs and handle each one properly
    const paragraphs = disclaimerText.split("\n\n");

    paragraphs.forEach((paragraph, index) => {
      this.checkPageBreak(30); // Check before each paragraph
      this.addWrappedText(
        paragraph.trim(),
        this.margin,
        this.pageWidth - 2 * this.margin,
      );

      // Add spacing between paragraphs (except last one)
      if (index < paragraphs.length - 1) {
        this.currentY += 8;
      }
    });

    this.currentY += 20;
  }

  private async addFooterToAllPages(): Promise<void> {
    const totalPages = this.doc.getNumberOfPages();
    const currentYear = new Date().getFullYear();

    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);

      // Footer line
      this.doc.setDrawColor(27, 162, 255);
      this.doc.line(
        this.margin,
        this.pageHeight - 25,
        this.pageWidth - this.margin,
        this.pageHeight - 25,
      );

      // Add Proply logo on the left - using same method as header
      try {
        const fs = await import("fs");
        const path = await import("path");
        const logoPath = path.join(
          process.cwd(),
          "client",
          "public",
          "proply-logo-auth.png",
        );

        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          const logoBase64 = logoBuffer.toString("base64");

          // Logo dimensions for footer - smaller than header
          const logoHeight = 8;
          const logoAspectRatio = 868 / 229; // Same aspect ratio as header
          const logoWidth = logoHeight * logoAspectRatio;

          this.doc.addImage(
            logoBase64,
            "PNG",
            this.margin,
            this.pageHeight - 20,
            logoWidth,
            logoHeight,
          );
        } else {
          // Fallback: Add text-based branding
          this.doc.setFontSize(8);
          this.doc.setFont("helvetica", "bold");
          this.doc.setTextColor(27, 162, 255);
          this.doc.text("proply", this.margin, this.pageHeight - 15);
        }
      } catch (error) {
        console.log("Could not add footer logo:", error);
        // Fallback: Add text-based branding
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(27, 162, 255);
        this.doc.text("proply", this.margin, this.pageHeight - 15);
      }

      // Center copyright text
      this.doc.setFontSize(8);
      this.doc.setTextColor(107, 114, 128);
      const copyrightText = `© ${currentYear} Proply Tech (Pty) Ltd. All rights reserved.`;
      const textWidth = this.doc.getTextWidth(copyrightText);
      const centerX = (this.pageWidth - textWidth) / 2;

      this.doc.text(copyrightText, centerX, this.pageHeight - 15);

      // Page number on the right
      this.doc.text(
        `Page ${i} of ${totalPages}`,
        this.pageWidth - this.margin - 20,
        this.pageHeight - 15,
      );
    }

    // Reset to first page after footer processing
    this.doc.setPage(1);
  }

  static async generateReport(propertyId: string): Promise<Buffer> {
    const service = new PropdataPdfService();
    return await service.generatePropertyReport(propertyId);
  }
}
