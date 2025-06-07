import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { db } from '../../db';
import { propdataListings, valuationReports, rentalPerformanceData } from '../../db/schema';
import { eq } from 'drizzle-orm';

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

// Proply brand colors
const PROPLY_BLUE = '#1e40af';
const PROPLY_LIGHT_BLUE = '#3b82f6';
const PROPLY_GRAY = '#6b7280';
const PROPLY_LIGHT_GRAY = '#f3f4f6';

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

  async generatePropertyReport(propertyId: string, options: PdfGenerationOptions = {}): Promise<Buffer> {
    try {
      // Fetch all data from database - single source of truth
      const data = await this.fetchPropertyData(propertyId);
      
      if (!data.property) {
        throw new Error('Property not found');
      }

      // Initialize PDF with Proply branding
      this.initializePdf();
      
      // Generate each section
      await this.addOverviewSection(data);
      await this.addValuationSection(data);
      await this.addRentalPerformanceSection(data);
      await this.addFinancialsSection(data);
      await this.addDetailsSection(data);
      
      // Add footer to all pages
      this.addFooterToAllPages();
      
      return Buffer.from(this.doc.output('arraybuffer'));
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }

  private async fetchPropertyData(propertyId: string): Promise<PropertyPdfData> {
    try {
      console.log(`Fetching data for property ID: ${propertyId}`);
      
      // Fetch property data using PropData property ID with debugging
      console.log(`Looking for property with PropData ID: "${propertyId}"`);
      let property = await db.query.propdataListings.findFirst({
        where: eq(propdataListings.propdataId, propertyId)
      });
      
      // Additional debugging: try raw SQL if Drizzle query fails
      if (!property) {
        console.log('Drizzle query failed, trying raw SQL...');
        const rawResult = await db.execute(
          `SELECT * FROM propdata_listings WHERE propdata_id = '${propertyId}' LIMIT 1`
        );
        console.log('Raw SQL result count:', rawResult.rows.length);
        if (rawResult.rows.length > 0) {
          console.log('Found via raw SQL - using first result');
          property = rawResult.rows[0] as any;
        }
      }
      
      console.log('Property found:', !!property);

      // Fetch valuation report with all financial data
      const valuationReport = await db.query.valuationReports.findFirst({
        where: eq(valuationReports.propertyId, propertyId)
      });
      
      console.log('Valuation report found:', !!valuationReport);

      // Fetch rental performance data
      const rentalData = await db.query.rentalPerformanceData.findFirst({
        where: eq(rentalPerformanceData.propertyId, propertyId)
      });
      
      console.log('Rental data found:', !!rentalData);

      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found in database`);
      }

      return {
        property,
        valuationReport,
        rentalData,
        savedValuationData: valuationReport
      };
    } catch (error) {
      console.error('Error fetching property data:', error);
      throw error;
    }
  }

  private initializePdf(): void {
    this.doc.setProperties({
      title: 'Proply Property Investment Report',
      subject: 'Property Investment Analysis',
      author: 'Proply',
      creator: 'Proply Investment Platform'
    });

    // Add Proply header
    this.addProplyHeader();
  }

  private addProplyHeader(): void {
    // Add Proply logo placeholder (blue rectangle for now)
    this.doc.setFillColor(PROPLY_BLUE);
    this.doc.rect(this.margin, this.margin, 40, 15, 'F');
    
    // Add "PROPLY" text in white
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('PROPLY', this.margin + 8, this.margin + 10);
    
    // Reset text color
    this.doc.setTextColor(0, 0, 0);
    
    this.currentY = this.margin + 25;
  }

  private async addOverviewSection(data: PropertyPdfData): Promise<void> {
    this.addSectionHeader('Property Overview');
    
    if (!data.property) {
      this.doc.text('Property data not available', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }
    
    // Property address and basic info
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(PROPLY_BLUE);
    this.doc.text(data.property.address || 'Address not available', this.margin, this.currentY);
    this.currentY += 15;
    
    // Property details in two columns
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    const leftColumn = this.margin;
    const rightColumn = this.margin + 90;
    
    // Left column
    this.doc.text(`Price: R${data.property.price?.toLocaleString() || 'N/A'}`, leftColumn, this.currentY);
    this.doc.text(`Property Type: ${data.property.propertyType || 'N/A'}`, leftColumn, this.currentY + 8);
    this.doc.text(`Bedrooms: ${data.property.bedrooms || 'N/A'}`, leftColumn, this.currentY + 16);
    this.doc.text(`Bathrooms: ${data.property.bathrooms || 'N/A'}`, leftColumn, this.currentY + 24);
    
    // Right column
    this.doc.text(`Floor Size: ${data.property.floorSize || 'N/A'} m²`, rightColumn, this.currentY);
    this.doc.text(`Land Size: ${data.property.landSize || 'N/A'} m²`, rightColumn, this.currentY + 8);
    this.doc.text(`Parking: ${data.property.parkingSpaces || 'N/A'} spaces`, rightColumn, this.currentY + 16);
    this.doc.text(`Monthly Levy: R${data.property.monthlyLevy?.toLocaleString() || 'N/A'}`, rightColumn, this.currentY + 24);
    
    this.currentY += 40;
    
    // Add static map and property image side by side
    await this.addMapAndImage(data);
    
    this.currentY += 20;
  }

  private async addMapAndImage(data: PropertyPdfData): Promise<void> {
    const mapWidth = 85;
    const mapHeight = 60;
    const imageWidth = 85;
    const imageHeight = 60;
    const spacing = 10;
    
    // Add static Google Map
    if (data.property?.location?.latitude && data.property?.location?.longitude) {
      try {
        const mapUrl = await this.generateStaticMapUrl(
          data.property.location.latitude,
          data.property.location.longitude,
          data.property.address || 'Property Location'
        );
        
        // Add map placeholder for now (will implement actual map loading)
        this.doc.setFillColor(PROPLY_LIGHT_GRAY);
        this.doc.rect(this.margin, this.currentY, mapWidth, mapHeight, 'F');
        this.doc.setTextColor(PROPLY_GRAY);
        this.doc.setFontSize(9);
        this.doc.text('Property Location Map', this.margin + 5, this.currentY + mapHeight/2);
      } catch (error) {
        console.error('Error generating map:', error);
      }
    }
    
    // Add property image
    if (data.property?.images && data.property.images.length > 0) {
      try {
        // Add image placeholder for now (will implement actual image loading)
        this.doc.setFillColor(PROPLY_LIGHT_GRAY);
        this.doc.rect(this.margin + mapWidth + spacing, this.currentY, imageWidth, imageHeight, 'F');
        this.doc.setTextColor(PROPLY_GRAY);
        this.doc.setFontSize(9);
        this.doc.text('Property Image', this.margin + mapWidth + spacing + 5, this.currentY + imageHeight/2);
      } catch (error) {
        console.error('Error adding property image:', error);
      }
    }
    
    this.currentY += mapHeight;
  }

  private async generateStaticMapUrl(lat: number, lng: number, address: string): Promise<string> {
    const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x300&markers=color:blue%7C${lat},${lng}&key=${apiKey}`;
  }

  private addValuationSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader('AI Valuation Analysis');
    
    if (!data.valuationReport?.valuationData) {
      this.doc.text('No valuation data available', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }
    
    const valuation = data.valuationReport.valuationData as any;
    
    // Property Summary
    if (valuation.summary) {
      this.addSubsectionHeader('Property Summary');
      this.doc.setFontSize(10);
      this.addWrappedText(valuation.summary, this.margin, this.pageWidth - (2 * this.margin));
      this.currentY += 10;
    }
    
    // Valuation Estimates Table
    if (valuation.valuations && Array.isArray(valuation.valuations)) {
      this.addSubsectionHeader('Valuation Estimates');
      
      this.doc.setFontSize(10);
      valuation.valuations.forEach((val: any) => {
        this.doc.text(`${val.type}: R${(val.value || 0).toLocaleString('en-ZA')} (${val.formula || ''})`, this.margin, this.currentY);
        this.currentY += 12;
      });
      this.currentY += 5;
    }
    
    // Property Appreciation Analysis
    if (valuation.propertyAppreciation) {
      this.addSubsectionHeader('Property Appreciation Forecast');
      this.doc.setFontSize(10);
      
      const appreciation = valuation.propertyAppreciation;
      if (appreciation.annualAppreciationRate) {
        this.doc.text(`Annual Appreciation Rate: ${appreciation.annualAppreciationRate}%`, this.margin, this.currentY);
        this.currentY += 12;
      }
      
      // 5-year projection table
      if (appreciation.fiveYearProjection && Array.isArray(appreciation.fiveYearProjection)) {
        const projectionData = appreciation.fiveYearProjection.map((proj: any) => [
          proj.year?.toString() || '',
          `R${(proj.estimatedValue || 0).toLocaleString('en-ZA')}`
        ]);
        
        (this.doc as any).autoTable({
          startY: this.currentY,
          head: [['Year', 'Estimated Value']],
          body: projectionData,
          theme: 'grid',
          headStyles: { fillColor: [30, 64, 175], textColor: 255 },
          styles: { fontSize: 9 },
          margin: { left: this.margin, right: this.margin },
          columnStyles: { 0: { halign: 'center' }, 1: { halign: 'right' } }
        });
        
        this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
      }
      
      if (appreciation.summary) {
        this.addWrappedText(appreciation.summary, this.margin, this.pageWidth - (2 * this.margin));
        this.currentY += 10;
      }
    }
    
    // Market Context
    if (valuation.marketContext) {
      this.addSubsectionHeader('Market Context');
      this.doc.setFontSize(10);
      this.addWrappedText(valuation.marketContext, this.margin, this.pageWidth - (2 * this.margin));
      this.currentY += 15;
    }
  }

  private addRentalPerformanceSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader('Rental Performance Analysis');
    
    // Get rental data from valuation report
    const valuationData = data.valuationReport?.valuationData as any;
    if (!valuationData?.rentalPerformance) {
      this.doc.text('No rental performance data available', this.margin, this.currentY);
      this.currentY += 15;
      return;
    }
    
    const rentalPerformance = valuationData.rentalPerformance;
    
    // Long-term rental analysis
    if (rentalPerformance.longTerm) {
      this.addSubsectionHeader('Long-Term Rental Analysis');
      const longTerm = rentalPerformance.longTerm;
      this.doc.setFontSize(10);
      
      this.doc.text(`Monthly Rental Range: R${(longTerm.minRental || 0).toLocaleString('en-ZA')} - R${(longTerm.maxRental || 0).toLocaleString('en-ZA')}`, this.margin, this.currentY);
      this.currentY += 10;
      this.doc.text(`Yield Range: ${longTerm.minYield || 0}% - ${longTerm.maxYield || 0}%`, this.margin, this.currentY);
      this.currentY += 10;
      
      if (longTerm.reasoning) {
        this.doc.text('Analysis:', this.margin, this.currentY);
        this.currentY += 8;
        this.addWrappedText(longTerm.reasoning, this.margin + 5, this.pageWidth - (2 * this.margin) - 5);
        this.currentY += 10;
      }
    }
    
    // Short-term rental analysis
    if (rentalPerformance.shortTerm) {
      this.addSubsectionHeader('Short-Term Rental (Airbnb) Analysis');
      const shortTerm = rentalPerformance.shortTerm;
      this.doc.setFontSize(10);
      
      if (shortTerm.occupancy) {
        this.doc.text(`Average Occupancy Rate: ${shortTerm.occupancy}%`, this.margin, this.currentY);
        this.currentY += 10;
      }
      
      // Create table for percentile data
      if (shortTerm.percentile25 || shortTerm.percentile50 || shortTerm.percentile75 || shortTerm.percentile90) {
        const percentileData = [];
        
        if (shortTerm.percentile25) {
          percentileData.push(['25th Percentile (Conservative)', 
            `R${(shortTerm.percentile25.nightly || 0).toLocaleString('en-ZA')}`, 
            `R${(shortTerm.percentile25.monthly || 0).toLocaleString('en-ZA')}`,
            `R${(shortTerm.percentile25.annual || 0).toLocaleString('en-ZA')}`]);
        }
        if (shortTerm.percentile50) {
          percentileData.push(['50th Percentile (Average)', 
            `R${(shortTerm.percentile50.nightly || 0).toLocaleString('en-ZA')}`, 
            `R${(shortTerm.percentile50.monthly || 0).toLocaleString('en-ZA')}`,
            `R${(shortTerm.percentile50.annual || 0).toLocaleString('en-ZA')}`]);
        }
        if (shortTerm.percentile75) {
          percentileData.push(['75th Percentile (Premium)', 
            `R${(shortTerm.percentile75.nightly || 0).toLocaleString('en-ZA')}`, 
            `R${(shortTerm.percentile75.monthly || 0).toLocaleString('en-ZA')}`,
            `R${(shortTerm.percentile75.annual || 0).toLocaleString('en-ZA')}`]);
        }
        if (shortTerm.percentile90) {
          percentileData.push(['90th Percentile (Luxury)', 
            `R${(shortTerm.percentile90.nightly || 0).toLocaleString('en-ZA')}`, 
            `R${(shortTerm.percentile90.monthly || 0).toLocaleString('en-ZA')}`,
            `R${(shortTerm.percentile90.annual || 0).toLocaleString('en-ZA')}`]);
        }
        
        this.doc.setFontSize(10);
        rentals.shortTerm.percentiles.forEach((p: any) => {
          this.doc.text(`${p.level}: R${p.nightlyRate} (Monthly: R${(p.nightlyRate * 30).toLocaleString()}, Annual: R${(p.nightlyRate * 365).toLocaleString()})`, 
            this.margin, this.currentY);
          this.currentY += 8;
        });
        this.currentY += 10;
      }
    }
  }

  private addFinancialsSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader('Financial Analysis');
    
    // Financing parameters
    if (data.savedValuationData?.financingAnalysisData) {
      this.addSubsectionHeader('Financing Details');
      
      const financing = data.savedValuationData.financingAnalysisData.financingParameters;
      if (financing) {
        this.doc.setFontSize(10);
        this.doc.text(`Purchase Price: R${data.property.price?.toLocaleString()}`, this.margin, this.currentY);
        this.currentY += 6;
        this.doc.text(`Deposit (${financing.depositPercentage}%): R${financing.depositAmount?.toLocaleString()}`, this.margin, this.currentY);
        this.currentY += 6;
        this.doc.text(`Loan Amount: R${financing.loanAmount?.toLocaleString()}`, this.margin, this.currentY);
        this.currentY += 6;
        this.doc.text(`Interest Rate: ${financing.interestRate}%`, this.margin, this.currentY);
        this.currentY += 6;
        this.doc.text(`Loan Term: ${financing.loanTerm} years`, this.margin, this.currentY);
        this.currentY += 6;
        this.doc.text(`Monthly Payment: R${financing.monthlyPayment?.toLocaleString()}`, this.margin, this.currentY);
        this.currentY += 15;
      }
    }
    
    // Revenue projections
    if (data.savedValuationData?.cashflowAnalysisData?.revenueGrowthTrajectory) {
      this.addSubsectionHeader('Revenue Projections (8% Annual Growth)');
      
      const trajectory = data.savedValuationData.cashflowAnalysisData.revenueGrowthTrajectory;
      
      if (trajectory.shortTerm) {
        this.doc.text('Short-Term Rental Projections:', this.margin, this.currentY);
        this.currentY += 8;
        
        Object.entries(trajectory.shortTerm).forEach(([year, data]: [string, any]) => {
          const yearNum = year.replace('year', '');
          this.doc.text(`Year ${yearNum}: R${data.revenue?.toLocaleString()} (${data.grossYield?.toFixed(1)}% yield)`, 
            this.margin + 5, this.currentY);
          this.currentY += 6;
        });
        this.currentY += 8;
      }
      
      if (trajectory.longTerm) {
        this.doc.text('Long-Term Rental Projections:', this.margin, this.currentY);
        this.currentY += 8;
        
        Object.entries(trajectory.longTerm).forEach(([year, data]: [string, any]) => {
          const yearNum = year.replace('year', '');
          this.doc.text(`Year ${yearNum}: R${data.revenue?.toLocaleString()} (${data.grossYield?.toFixed(1)}% yield)`, 
            this.margin + 5, this.currentY);
          this.currentY += 6;
        });
        this.currentY += 15;
      }
    }
    
    // Equity buildup
    if (data.savedValuationData?.financingAnalysisData?.yearlyMetrics) {
      this.addSubsectionHeader('Equity Buildup Schedule');
      
      const metrics = data.savedValuationData.financingAnalysisData.yearlyMetrics;
      Object.entries(metrics).forEach(([year, data]: [string, any]) => {
        const yearNum = year.replace('year', '');
        this.doc.text(`Year ${yearNum}: Equity Built R${data.equityBuildup?.toLocaleString()}, Loan Balance R${data.loanBalance?.toLocaleString()}`, 
          this.margin, this.currentY);
        this.currentY += 6;
      });
      
      this.currentY += 15;
    }
  }

  private addDetailsSection(data: PropertyPdfData): void {
    this.checkPageBreak();
    this.addSectionHeader('Property Details');
    
    // Agent information
    if (data.property.agent) {
      this.addSubsectionHeader('Agent Information');
      this.doc.setFontSize(10);
      this.doc.text(`Agent: ${data.property.agent.name || 'N/A'}`, this.margin, this.currentY);
      this.currentY += 6;
      this.doc.text(`Phone: ${data.property.agent.phone || 'N/A'}`, this.margin, this.currentY);
      this.currentY += 6;
      this.doc.text(`Email: ${data.property.agent.email || 'N/A'}`, this.margin, this.currentY);
      this.currentY += 15;
    }
    
    // Property features
    // Handle features - could be array, string, or null
    let featuresArray: string[] = [];
    if (data.property.features) {
      if (Array.isArray(data.property.features)) {
        featuresArray = data.property.features;
      } else if (typeof data.property.features === 'string') {
        try {
          // Try to parse as JSON if it's a string
          const parsed = JSON.parse(data.property.features);
          if (Array.isArray(parsed)) {
            featuresArray = parsed;
          } else {
            featuresArray = [data.property.features]; // Single feature as string
          }
        } catch {
          featuresArray = [data.property.features]; // Single feature as string
        }
      }
    }
    
    if (featuresArray.length > 0) {
      this.addSubsectionHeader('Property Features');
      this.doc.setFontSize(10);
      
      featuresArray.forEach((feature: string) => {
        this.doc.text(`• ${feature}`, this.margin, this.currentY);
        this.currentY += 6;
      });
      
      this.currentY += 10;
    }
    
    // Additional property information
    this.addSubsectionHeader('Additional Information');
    this.doc.setFontSize(10);
    this.doc.text(`Property ID: ${data.property.propdataId}`, this.margin, this.currentY);
    this.currentY += 6;
    this.doc.text(`Last Updated: ${new Date(data.property.lastModified || new Date()).toLocaleDateString()}`, this.margin, this.currentY);
    this.currentY += 6;
    this.doc.text(`Status: ${data.property.status}`, this.margin, this.currentY);
    this.currentY += 15;
    
    // Report generation info
    this.doc.setFontSize(8);
    this.doc.setTextColor(PROPLY_GRAY);
    this.doc.text(`Report generated on ${new Date().toLocaleDateString()} by Proply Investment Platform`, 
      this.margin, this.currentY);
    this.doc.text('This report is valid for 30 days from generation date.', this.margin, this.currentY + 6);
  }

  private addSectionHeader(title: string): void {
    this.checkPageBreak(30);
    
    this.doc.setFillColor(PROPLY_BLUE);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 5, this.currentY + 8);
    
    this.doc.setTextColor(0, 0, 0);
    this.currentY += 20;
  }

  private addSubsectionHeader(title: string): void {
    this.checkPageBreak(20);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(PROPLY_BLUE);
    this.doc.text(title, this.margin, this.currentY);
    
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
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
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin + 25; // Account for header space
      this.addProplyHeader();
    }
  }

  private addFooterToAllPages(): void {
    const totalPages = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.doc.setDrawColor(PROPLY_BLUE);
      this.doc.line(this.margin, this.pageHeight - 25, this.pageWidth - this.margin, this.pageHeight - 25);
      
      // Footer text
      this.doc.setFontSize(8);
      this.doc.setTextColor(PROPLY_GRAY);
      this.doc.text('Proply Investment Platform • wesley@proply.co.za', this.margin, this.pageHeight - 15);
      this.doc.text(`Page ${i} of ${totalPages}`, this.pageWidth - this.margin - 20, this.pageHeight - 15);
    }
  }

  static async generateReport(propertyId: string): Promise<Buffer> {
    const service = new PropdataPdfService();
    return await service.generatePropertyReport(propertyId);
  }
}