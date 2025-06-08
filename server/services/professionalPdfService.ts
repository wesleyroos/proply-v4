import jsPDF from 'jspdf';
import 'jspdf-autotable';
interface PropertyData {
  id?: number;
  propdataId?: string;
  address?: string;
  price?: number;
  purchasePrice: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  floorSize?: number;
  landSize?: number;
  floorArea?: number;
  monthlyLevy?: number;
  images?: string[];
}
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

interface PropertyAnalysisData {
  annualPropertyAppreciationData?: any;
  cashflowAnalysisData?: any;
  financingAnalysisData?: any;
}

export class ProfessionalPdfService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 25; // 25mm margins
  private currentY: number = 0;
  private propertyData: PropertyData;
  private analysisData: PropertyAnalysisData;

  // Consistent typography system
  private typography = {
    h1: { size: 24, style: 'bold' as const },
    h2: { size: 18, style: 'bold' as const },
    h3: { size: 14, style: 'bold' as const },
    body: { size: 11, style: 'normal' as const },
    small: { size: 9, style: 'normal' as const },
    caption: { size: 8, style: 'normal' as const }
  };

  // Professional color palette
  private colors = {
    primary: { r: 31, g: 41, b: 55 },      // Dark gray
    secondary: { r: 75, g: 85, b: 99 },    // Medium gray
    accent: { r: 59, g: 130, b: 246 },     // Blue
    light: { r: 248, g: 250, b: 252 },     // Light background
    success: { r: 34, g: 197, b: 94 },     // Green
    warning: { r: 245, g: 158, b: 11 },    // Orange
    danger: { r: 239, g: 68, b: 68 },      // Red
    border: { r: 229, g: 231, b: 235 },    // Light border
    text: { r: 107, g: 114, b: 128 }       // Text gray
  };

  // Content area calculations
  private get contentWidth(): number {
    return this.pageWidth - (2 * this.margin);
  }

  private get contentX(): number {
    return this.margin;
  }

  constructor(propertyData: PropertyData, analysisData: PropertyAnalysisData) {
    this.doc = new jsPDF('portrait', 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.propertyData = propertyData;
    this.analysisData = analysisData;
  }

  public async generatePDF(): Promise<Buffer> {
    // Cover page
    this.addProfessionalCoverPage();
    
    // Executive summary
    this.addNewPage();
    this.addExecutiveSummary();
    
    // Property overview with images
    this.addNewPage();
    await this.addPropertyOverview();
    
    // Financial analysis
    this.addNewPage();
    this.addFinancialAnalysis();
    
    // Investment projections
    this.addNewPage();
    this.addInvestmentProjections();
    
    // Cash flow analysis
    this.addNewPage();
    this.addCashFlowAnalysis();
    
    // Footer on all pages
    this.addFootersToAllPages();
    
    return Buffer.from(this.doc.output('arraybuffer'));
  }

  private addProfessionalCoverPage(): void {
    // Clean header section
    this.setColor('light');
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');
    
    // Company logo
    this.addCompanyLogo();
    
    // Report title
    this.setColor('primary');
    this.doc.setFontSize(32);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Investment Property Report', this.margin, 50);
    
    // Subtitle
    this.setColor('text');
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Professional Financial Analysis & Market Valuation', this.margin, 65);
    
    // Property hero section
    const heroY = 110;
    const heroHeight = 160;
    
    // White card with shadow
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(this.margin, heroY, this.pageWidth - (2 * this.margin), heroHeight, 'F');
    
    // Subtle border
    this.setColor('border');
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, heroY, this.pageWidth - (2 * this.margin), heroHeight, 'S');
    
    // Property address - hero title
    this.setColor('primary');
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    
    const address = this.propertyData.address || 'Property Address';
    const addressLines = this.doc.splitTextToSize(address, this.pageWidth - (2 * this.margin) - 40);
    
    let textY = heroY + 35;
    if (Array.isArray(addressLines)) {
      addressLines.forEach((line: string, index: number) => {
        this.doc.text(line, this.margin + 20, textY + (index * 12));
      });
      textY += addressLines.length * 12 + 25;
    } else {
      this.doc.text(addressLines, this.margin + 20, textY);
      textY += 35;
    }
    
    // Purchase price highlight
    this.setColor('accent');
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.formatCurrency(this.propertyData.purchasePrice), this.margin + 20, textY);
    
    // Property specifications grid
    textY += 30;
    this.addPropertySpecsGrid(this.margin + 20, textY);
    
    // Report date and branding
    const footerY = heroY + heroHeight + 30;
    this.setColor('text');
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const reportDate = new Date().toLocaleDateString('en-ZA', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    this.doc.text(`Report Date: ${reportDate}`, this.margin, footerY);
    this.doc.text('Prepared by Proply Investment Analytics', this.margin, footerY + 12);
    
    this.currentY = footerY + 30;
  }

  private addPropertySpecsGrid(x: number, y: number): void {
    const specs = [
      { label: 'Type', value: this.propertyData.propertyType || 'N/A' },
      { label: 'Bedrooms', value: this.propertyData.bedrooms?.toString() || 'N/A' },
      { label: 'Bathrooms', value: this.propertyData.bathrooms?.toString() || 'N/A' },
      { label: 'Parking', value: this.propertyData.parkingSpaces?.toString() || 'N/A' },
      { label: 'Floor Area', value: this.propertyData.floorArea ? `${this.propertyData.floorArea} m²` : 'N/A' },
      { label: 'Land Size', value: this.propertyData.landSize ? `${this.propertyData.landSize} m²` : 'N/A' }
    ];
    
    const colWidth = (this.pageWidth - (2 * this.margin) - 40) / 3;
    const rowHeight = 20;
    
    specs.forEach((spec, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const specX = x + (col * colWidth);
      const specY = y + (row * rowHeight);
      
      // Label
      this.setColor('text');
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(spec.label.toUpperCase(), specX, specY);
      
      // Value
      this.setColor('primary');
      this.doc.setFontSize(11);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(spec.value, specX, specY + 8);
    });
  }

  private addExecutiveSummary(): void {
    this.addSectionHeader('Executive Summary', 'overview');
    
    const summaryY = this.currentY + 20;
    
    // Key metrics cards
    this.addMetricsCards(summaryY);
    
    // Investment highlights
    this.currentY += 120;
    this.addInvestmentHighlights();
  }

  private addMetricsCards(startY: number): void {
    const cardWidth = (this.pageWidth - (2 * this.margin) - 20) / 3;
    const cardHeight = 80;
    
    const metrics = [
      {
        title: 'Gross Yield',
        value: this.getGrossYield(),
        color: 'success',
        icon: '↗'
      },
      {
        title: 'Monthly Cash Flow',
        value: this.getMonthlyCashFlow(),
        color: 'accent',
        icon: '💰'
      },
      {
        title: 'Capital Growth',
        value: this.getCapitalGrowth(),
        color: 'warning',
        icon: '📈'
      }
    ];
    
    metrics.forEach((metric, index) => {
      const cardX = this.margin + (index * (cardWidth + 10));
      this.addMetricCard(cardX, startY, cardWidth, cardHeight, metric);
    });
  }

  private addMetricCard(x: number, y: number, width: number, height: number, metric: any): void {
    // Card background
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(x, y, width, height, 'F');
    
    // Card border
    this.setColor('border');
    this.doc.setLineWidth(0.5);
    this.doc.rect(x, y, width, height, 'S');
    
    // Accent bar
    const accentColor = this.colors[metric.color as keyof typeof this.colors];
    this.doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    this.doc.rect(x, y, width, 4, 'F');
    
    // Content
    this.setColor('text');
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(metric.title, x + 15, y + 25);
    
    this.setColor('primary');
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(metric.value, x + 15, y + 45);
  }

  private async addPropertyOverview(): Promise<void> {
    this.addSectionHeader('Property Overview', 'property');
    
    // Add property images and map
    await this.addPropertyImagesAndMap();
    
    // Property details table
    this.currentY += 20;
    this.addPropertyDetailsTable();
  }

  private async addPropertyImagesAndMap(): Promise<void> {
    const imageY = this.currentY + 20;
    const imageHeight = 120;
    const imageWidth = (this.pageWidth - (2 * this.margin) - 20) / 2;
    
    try {
      // Main property image
      if (this.propertyData.images && this.propertyData.images.length > 0) {
        const imageUrl = this.propertyData.images[0];
        const response = await fetch(imageUrl);
        if (response.ok) {
          const imageBuffer = await response.buffer();
          this.doc.addImage(imageBuffer, 'JPEG', this.margin, imageY, imageWidth, imageHeight);
        }
      }
      
      // Map
      const mapUrl = await this.generateMapUrl();
      if (mapUrl) {
        const mapResponse = await fetch(mapUrl);
        if (mapResponse.ok) {
          const mapBuffer = await mapResponse.buffer();
          this.doc.addImage(mapBuffer, 'PNG', this.margin + imageWidth + 10, imageY, imageWidth, imageHeight);
        }
      }
    } catch (error) {
      console.error('Error adding images:', error);
    }
    
    this.currentY = imageY + imageHeight;
  }

  private addFinancialAnalysis(): void {
    this.addSectionHeader('Financial Analysis', 'finance');
    
    if (this.analysisData.financingAnalysisData) {
      this.addFinancingTable();
    }
    
    this.currentY += 20;
    this.addYieldAnalysis();
  }

  private addFinancingTable(): void {
    const financingData = this.analysisData.financingAnalysisData;
    if (!financingData) return;
    
    // Financing summary
    this.addSubsectionHeader('Loan Structure');
    
    const tableData = [
      ['Purchase Price', this.formatCurrency(this.propertyData.purchasePrice)],
      ['Deposit (20%)', this.formatCurrency(this.propertyData.purchasePrice * 0.2)],
      ['Loan Amount', this.formatCurrency(this.propertyData.purchasePrice * 0.8)],
      ['Interest Rate', '11.75%'],
      ['Loan Term', '20 years'],
      ['Monthly Payment', this.formatCurrency(financingData.monthlyBondPayment || 0)]
    ];
    
    (this.doc as any).autoTable({
      startY: this.currentY + 10,
      head: [['Item', 'Amount']],
      body: tableData,
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 11
      },
      styles: {
        fontSize: 10,
        cellPadding: 8
      },
      margin: { left: this.margin, right: this.margin },
      tableWidth: 'wrap'
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addInvestmentProjections(): void {
    this.addSectionHeader('Investment Projections', 'projections');
    
    if (this.analysisData.cashflowAnalysisData) {
      this.addProjectionsTable();
    }
  }

  private addProjectionsTable(): void {
    const cashflowData = this.analysisData.cashflowAnalysisData;
    if (!cashflowData || !cashflowData.revenueProjections) return;
    
    this.addSubsectionHeader('20-Year Revenue Projections');
    
    const projections = cashflowData.revenueProjections.shortTerm;
    if (!projections) return;
    
    const tableData = [
      ['Year 1', this.formatCurrency(projections.year1 || 0)],
      ['Year 2', this.formatCurrency(projections.year2 || 0)],
      ['Year 3', this.formatCurrency(projections.year3 || 0)],
      ['Year 5', this.formatCurrency(projections.year5 || 0)],
      ['Year 10', this.formatCurrency(projections.year10 || 0)],
      ['Year 20', this.formatCurrency(projections.year20 || 0)]
    ];
    
    (this.doc as any).autoTable({
      startY: this.currentY + 10,
      head: [['Year', 'Projected Revenue']],
      body: tableData,
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 11
      },
      styles: {
        fontSize: 10,
        cellPadding: 8
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: this.margin, right: this.margin },
      tableWidth: 'wrap'
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addCashFlowAnalysis(): void {
    this.addSectionHeader('Cash Flow Analysis', 'cashflow');
    
    if (this.analysisData.cashflowAnalysisData?.netOperatingIncome) {
      this.addCashFlowTable();
    }
  }

  private addCashFlowTable(): void {
    const cashflowData = this.analysisData.cashflowAnalysisData;
    const noi = cashflowData?.netOperatingIncome;
    if (!noi) return;
    
    this.addSubsectionHeader('Net Operating Income Projections');
    
    const tableData = [
      ['Year 1', 
       this.formatCurrency(noi.year1?.value || 0),
       this.formatCurrency(noi.year1?.annualCashflow || 0)],
      ['Year 2', 
       this.formatCurrency(noi.year2?.value || 0),
       this.formatCurrency(noi.year2?.annualCashflow || 0)],
      ['Year 5', 
       this.formatCurrency(noi.year5?.value || 0),
       this.formatCurrency(noi.year5?.annualCashflow || 0)],
      ['Year 10', 
       this.formatCurrency(noi.year10?.value || 0),
       this.formatCurrency(noi.year10?.annualCashflow || 0)],
      ['Year 20', 
       this.formatCurrency(noi.year20?.value || 0),
       this.formatCurrency(noi.year20?.annualCashflow || 0)]
    ];
    
    (this.doc as any).autoTable({
      startY: this.currentY + 10,
      head: [['Year', 'Net Operating Income', 'Annual Cashflow']],
      body: tableData,
      headStyles: {
        fillColor: [245, 158, 11],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 11
      },
      styles: {
        fontSize: 10,
        cellPadding: 8
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: this.margin, right: this.margin },
      tableWidth: 'wrap'
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  // Helper methods
  private addSectionHeader(title: string, icon: string): void {
    if (this.currentY > this.pageHeight - 60) {
      this.addNewPage();
    }
    
    // Section header background
    this.setColor('light');
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 25, 'F');
    
    // Border
    this.setColor('border');
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 25, 'S');
    
    // Title
    this.setColor('primary');
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin + 15, this.currentY + 17);
    
    this.currentY += 35;
  }

  private addSubsectionHeader(title: string): void {
    this.setColor('secondary');
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY + 10);
    this.currentY += 20;
  }

  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = this.margin + 10;
  }

  private setColor(colorName: keyof typeof this.colors): void {
    const color = this.colors[colorName];
    this.doc.setTextColor(color.r, color.g, color.b);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private addCompanyLogo(): void {
    try {
      const logoPath = path.join(process.cwd(), 'client', 'public', 'proply-logo-auth.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        this.doc.addImage(logoBuffer, 'PNG', this.pageWidth - 80, 15, 50, 20);
      }
    } catch (error) {
      console.error('Logo loading error:', error);
    }
  }

  private async generateMapUrl(): Promise<string | null> {
    if (!this.propertyData.address) return null;
    
    const apiKey = 'AIzaSyDFkk-vjiF_BNaCAYyyv698y7gC3jqJc3M';
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(this.propertyData.address)}&zoom=16&size=400x300&maptype=roadmap&markers=color:red%7Clabel:P%7C${encodeURIComponent(this.propertyData.address)}&key=${apiKey}`;
  }

  private getGrossYield(): string {
    // Calculate from analysis data
    const cashflow = this.analysisData.cashflowAnalysisData;
    if (cashflow?.shortTermGrossYield) {
      return `${cashflow.shortTermGrossYield.toFixed(1)}%`;
    }
    return 'N/A';
  }

  private getMonthlyCashFlow(): string {
    const cashflow = this.analysisData.cashflowAnalysisData;
    if (cashflow?.netOperatingIncome?.year1?.annualCashflow) {
      const monthly = cashflow.netOperatingIncome.year1.annualCashflow / 12;
      return this.formatCurrency(monthly);
    }
    return 'N/A';
  }

  private getCapitalGrowth(): string {
    return '8% p.a.'; // Standard assumption
  }

  private addInvestmentHighlights(): void {
    this.addSubsectionHeader('Investment Highlights');
    
    const highlights = [
      '• Strong rental demand in established area',
      '• Projected capital appreciation of 8% per annum',
      '• Positive cash flow from year 1',
      '• Prime location with excellent transport links',
      '• Quality construction and modern amenities'
    ];
    
    this.setColor('primary');
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    highlights.forEach((highlight, index) => {
      this.doc.text(highlight, this.margin, this.currentY + (index * 12));
    });
    
    this.currentY += highlights.length * 12 + 10;
  }

  private addYieldAnalysis(): void {
    this.addSubsectionHeader('Yield Analysis');
    
    const cashflowData = this.analysisData.cashflowAnalysisData;
    if (!cashflowData) return;
    
    const yieldData = [
      ['Gross Rental Yield', `${(cashflowData.shortTermGrossYield || 0).toFixed(2)}%`],
      ['Net Rental Yield', `${(cashflowData.longTermGrossYield || 0).toFixed(2)}%`],
      ['Capital Growth Rate', '8.00%'],
      ['Total Return', `${((cashflowData.shortTermGrossYield || 0) + 8).toFixed(2)}%`]
    ];
    
    (this.doc as any).autoTable({
      startY: this.currentY + 5,
      head: [['Metric', 'Value']],
      body: yieldData,
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 11
      },
      styles: {
        fontSize: 10,
        cellPadding: 8
      },
      margin: { left: this.margin, right: this.margin },
      tableWidth: 'wrap'
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addPropertyDetailsTable(): void {
    this.addSubsectionHeader('Property Specifications');
    
    const propertyDetails = [
      ['Address', this.propertyData.address || 'N/A'],
      ['Property Type', this.propertyData.propertyType || 'N/A'],
      ['Bedrooms', this.propertyData.bedrooms?.toString() || 'N/A'],
      ['Bathrooms', this.propertyData.bathrooms?.toString() || 'N/A'],
      ['Parking Spaces', this.propertyData.parkingSpaces?.toString() || 'N/A'],
      ['Floor Area', this.propertyData.floorArea ? `${this.propertyData.floorArea} m²` : 'N/A'],
      ['Land Size', this.propertyData.landSize ? `${this.propertyData.landSize} m²` : 'N/A'],
      ['Monthly Levy', this.propertyData.monthlyLevy ? this.formatCurrency(this.propertyData.monthlyLevy) : 'N/A']
    ];
    
    (this.doc as any).autoTable({
      startY: this.currentY + 5,
      head: [['Feature', 'Details']],
      body: propertyDetails,
      headStyles: {
        fillColor: [75, 85, 99],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 11
      },
      styles: {
        fontSize: 10,
        cellPadding: 8
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: this.margin, right: this.margin },
      tableWidth: 'wrap'
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  private addFootersToAllPages(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer line
      this.setColor('border');
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.pageHeight - 20, this.pageWidth - this.margin, this.pageHeight - 20);
      
      // Footer text
      this.setColor('text');
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text('Proply Investment Analytics', this.margin, this.pageHeight - 10);
      this.doc.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin - 30, this.pageHeight - 10);
      this.doc.text('Confidential Investment Report', (this.pageWidth / 2) - 30, this.pageHeight - 10);
    }
  }
}