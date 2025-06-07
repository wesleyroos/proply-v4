import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { createId } from '@paralleldrive/cuid2';
import { db } from '@db';
import { valuationReports, rentalPerformanceData, propdataListings, pdfReports } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs/promises';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface ReportData {
  property: any;
  valuation: any;
  rental: any;
  financialAnalysis: {
    annualPropertyAppreciationData?: any;
    cashflowAnalysisData?: any;
    financingAnalysisData?: any;
  };
}

export class PDFService {
  private async fetchPropertyImage(imageUrl: string): Promise<string | null> {
    try {
      // Direct fetch from PropData with authentication
      const response = await fetch(imageUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.PROPDATA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch property image:', response.statusText);
        return null;
      }

      const buffer = await response.buffer();
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Error fetching property image:', error);
      return null;
    }
  }

  private async fetchStaticMap(lat: number, lng: number): Promise<string | null> {
    try {
      const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found');
        return null;
      }

      const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=800x400&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
      const response = await fetch(mapUrl);
      
      if (!response.ok) {
        console.warn('Failed to fetch static map:', response.statusText);
        return null;
      }

      const buffer = await response.buffer();
      return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Error fetching static map:', error);
      return null;
    }
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  async generateInvestmentAnalysisReport(
    propertyId: string,
    userId: number
  ): Promise<{ reportId: string; downloadUrl: string; filePath: string }> {
    try {
      // Fetch all data from database (single source of truth)
      const [property] = await db
        .select()
        .from(propdataListings)
        .where(eq(propdataListings.propdataId, propertyId))
        .limit(1);

      if (!property) {
        throw new Error('Property not found');
      }

      const [valuation] = await db
        .select()
        .from(valuationReports)
        .where(and(
          eq(valuationReports.propertyId, propertyId),
          eq(valuationReports.userId, userId)
        ))
        .limit(1);

      if (!valuation) {
        throw new Error('Valuation report not found');
      }

      const [rental] = await db
        .select()
        .from(rentalPerformanceData)
        .where(and(
          eq(rentalPerformanceData.propertyId, propertyId),
          eq(rentalPerformanceData.userId, userId)
        ))
        .limit(1);

      // Prepare report data
      const reportData: ReportData = {
        property,
        valuation,
        rental,
        financialAnalysis: {
          annualPropertyAppreciationData: valuation.annualPropertyAppreciationData,
          cashflowAnalysisData: valuation.cashflowAnalysisData,
          financingAnalysisData: valuation.financingAnalysisData,
        }
      };

      // Generate PDF
      const pdf = await this.createPDF(reportData);
      
      // Save PDF file
      const reportId = createId();
      const fileName = `investment-analysis-${reportId}.pdf`;
      const filePath = path.join(process.cwd(), 'public', 'reports', fileName);
      const downloadUrl = `/api/reports/download/${reportId}`;

      const pdfBuffer = pdf.output('arraybuffer');
      await fs.writeFile(filePath, new Uint8Array(pdfBuffer));

      // Save report record to database
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      
      await db.insert(pdfReports).values({
        id: reportId,
        propertyId,
        valuationReportId: valuation.id,
        userId,
        filePath,
        downloadUrl,
        emailSentTo: 'wesley@proply.co.za', // Will be dynamic later
        reportType: 'investment_analysis',
        fileSize: Buffer.byteLength(pdf.output('arraybuffer')),
        expiresAt,
      });

      return { reportId, downloadUrl, filePath };
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }

  private async createPDF(data: ReportData): Promise<jsPDF> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Add Proply branding with correct color
    pdf.setFontSize(24);
    pdf.setTextColor(30, 64, 175); // Proply blue #1e40af
    pdf.text('Proply Investment Analysis Report', 20, yPosition);
    
    // Add PROPLY logo text in top right
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROPLY', pageWidth - 40, yPosition);
    pdf.setFont('helvetica', 'normal');
    
    yPosition += 15;

    // Property address
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(data.property.address, 20, yPosition);
    yPosition += 10;

    // Generation date
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-ZA')}`, 20, yPosition);
    yPosition += 15;

    // Property image
    if (data.property.images && data.property.images.length > 0) {
      try {
        const imageData = await this.fetchPropertyImage(data.property.images[0]);
        if (imageData) {
          pdf.addImage(imageData, 'JPEG', 20, yPosition, 170, 85);
          yPosition += 95;
        }
      } catch (error) {
        console.warn('Could not add property image to PDF:', error);
      }
    }

    // Property overview section
    yPosition = this.addPropertyOverview(pdf, data, yPosition);
    
    // Valuation summary section
    yPosition = this.addValuationSummary(pdf, data, yPosition);
    
    // Rental analysis section  
    yPosition = this.addRentalAnalysis(pdf, data, yPosition);

    // Check if we need a new page for financial data
    if (yPosition > 200) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Financial analysis sections
    yPosition = this.addFinancialAnalysis(pdf, data, yPosition);

    // Location map (if coordinates available)
    if (data.property.location?.latitude && data.property.location?.longitude) {
      try {
        const mapData = await this.fetchStaticMap(
          data.property.location.latitude,
          data.property.location.longitude
        );
        if (mapData) {
          if (yPosition > 150) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setFontSize(14);
          pdf.text('Property Location', 20, yPosition);
          yPosition += 10;
          pdf.addImage(mapData, 'PNG', 20, yPosition, 170, 85);
          yPosition += 95;
        }
      } catch (error) {
        console.warn('Could not add location map to PDF:', error);
      }
    }

    // Footer with disclaimer
    this.addFooter(pdf);

    return pdf;
  }

  private addPropertyOverview(pdf: jsPDF, data: ReportData, yPosition: number): number {
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Property Overview', 20, yPosition);
    yPosition += 10;

    const propertyData = [
      ['Purchase Price', this.formatCurrency(data.property.price || 0)],
      ['Property Type', data.property.propertyType || 'N/A'],
      ['Bedrooms', data.property.bedrooms?.toString() || 'N/A'],
      ['Bathrooms', data.property.bathrooms?.toString() || 'N/A'],
      ['Floor Size', data.property.floorSize ? `${data.property.floorSize}m²` : 'N/A'],
      ['Parking Spaces', data.property.parkingSpaces?.toString() || 'N/A'],
    ];

    pdf.autoTable({
      startY: yPosition,
      head: [['Property Details', 'Value']],
      body: propertyData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    return pdf.lastAutoTable.finalY + 15;
  }

  private addValuationSummary(pdf: jsPDF, data: ReportData, yPosition: number): number {
    pdf.setFontSize(14);
    pdf.text('AI Valuation Summary', 20, yPosition);
    yPosition += 10;

    if (data.valuation.valuationData) {
      const valuationText = typeof data.valuation.valuationData === 'string' 
        ? data.valuation.valuationData 
        : JSON.stringify(data.valuation.valuationData);
      
      const lines = pdf.splitTextToSize(valuationText.substring(0, 500) + '...', 170);
      pdf.setFontSize(10);
      pdf.text(lines, 20, yPosition);
      yPosition += lines.length * 5 + 10;
    }

    return yPosition;
  }

  private addRentalAnalysis(pdf: jsPDF, data: ReportData, yPosition: number): number {
    pdf.setFontSize(14);
    pdf.text('Rental Performance Analysis', 20, yPosition);
    yPosition += 10;

    if (data.rental) {
      const rentalData = [
        ['Long-term Min Rental', data.rental.longTermMinRental ? this.formatCurrency(Number(data.rental.longTermMinRental)) : 'N/A'],
        ['Long-term Max Rental', data.rental.longTermMaxRental ? this.formatCurrency(Number(data.rental.longTermMaxRental)) : 'N/A'],
        ['Long-term Min Yield', data.rental.longTermMinYield ? this.formatPercentage(Number(data.rental.longTermMinYield)) : 'N/A'],
        ['Long-term Max Yield', data.rental.longTermMaxYield ? this.formatPercentage(Number(data.rental.longTermMaxYield)) : 'N/A'],
      ];

      pdf.autoTable({
        startY: yPosition,
        head: [['Rental Metric', 'Value']],
        body: rentalData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 64, 175] },
      });

      yPosition = pdf.lastAutoTable.finalY + 15;
    }

    return yPosition;
  }

  private addFinancialAnalysis(pdf: jsPDF, data: ReportData, yPosition: number): number {
    const { financialAnalysis } = data;

    // Financing details
    if (financialAnalysis.financingAnalysisData) {
      pdf.setFontSize(14);
      pdf.text('Financing Analysis', 20, yPosition);
      yPosition += 10;

      const financing = financialAnalysis.financingAnalysisData;
      const financingData = [
        ['Monthly Bond Payment', financing.monthlyPayment ? this.formatCurrency(financing.monthlyPayment) : 'N/A'],
        ['Deposit Amount', financing.depositAmount ? this.formatCurrency(financing.depositAmount) : 'N/A'],
        ['Loan Amount', financing.loanAmount ? this.formatCurrency(financing.loanAmount) : 'N/A'],
        ['Interest Rate', financing.interestRate ? this.formatPercentage(financing.interestRate) : 'N/A'],
        ['Loan Term', financing.loanTerm ? `${financing.loanTerm} years` : 'N/A'],
      ];

      pdf.autoTable({
        startY: yPosition,
        head: [['Financing Detail', 'Value']],
        body: financingData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 64, 175] },
      });

      yPosition = pdf.lastAutoTable.finalY + 15;
    }

    // Investment Metrics from valuation
    if (data.valuation?.analysis?.investmentMetrics) {
      if (yPosition > 180) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Investment Metrics', 20, yPosition);
      yPosition += 10;

      const metrics = data.valuation.analysis.investmentMetrics;
      const investmentData = [];

      // Short-term metrics
      if (metrics.shortTerm?.[0]) {
        const st = metrics.shortTerm[0];
        investmentData.push(['Short-term Gross Yield', `${st.grossYield?.toFixed(2) || 'N/A'}%`]);
        investmentData.push(['Short-term Net Yield', `${st.netYield?.toFixed(2) || 'N/A'}%`]);
        investmentData.push(['Short-term ROE', `${st.returnOnEquity?.toFixed(2) || 'N/A'}%`]);
        investmentData.push(['Short-term Cash-on-Cash', `${st.cashOnCashReturn?.toFixed(2) || 'N/A'}%`]);
      }

      // Long-term metrics
      if (metrics.longTerm?.[0]) {
        const lt = metrics.longTerm[0];
        investmentData.push(['Long-term Gross Yield', `${lt.grossYield?.toFixed(2) || 'N/A'}%`]);
        investmentData.push(['Long-term Net Yield', `${lt.netYield?.toFixed(2) || 'N/A'}%`]);
        investmentData.push(['Long-term ROE', `${lt.returnOnEquity?.toFixed(2) || 'N/A'}%`]);
        investmentData.push(['Long-term Cash-on-Cash', `${lt.cashOnCashReturn?.toFixed(2) || 'N/A'}%`]);
      }

      if (investmentData.length > 0) {
        pdf.autoTable({
          startY: yPosition,
          head: [['Investment Metric', 'Value']],
          body: investmentData,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [30, 64, 175] },
        });
        yPosition = pdf.lastAutoTable.finalY + 15;
      }
    }

    // Cash Flow Projections
    if (data.valuation?.analysis?.netOperatingIncome) {
      if (yPosition > 150) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Cash Flow Projections (Short-term)', 20, yPosition);
      yPosition += 10;

      const noi = data.valuation.analysis.netOperatingIncome;
      const cashflowData = [];

      Object.entries(noi).forEach(([year, data]: [string, any]) => {
        if (data && typeof data === 'object') {
          cashflowData.push([
            year.replace('year', 'Year '),
            this.formatCurrency(data.annualCashflow || 0),
            this.formatCurrency(data.cumulativeRentalIncome || 0)
          ]);
        }
      });

      if (cashflowData.length > 0) {
        pdf.autoTable({
          startY: yPosition,
          head: [['Year', 'Annual Cashflow', 'Cumulative Income']],
          body: cashflowData,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [30, 64, 175] },
        });
        yPosition = pdf.lastAutoTable.finalY + 15;
      }
    }

    // Property appreciation projections
    if (data.valuation?.propertyAppreciation || financialAnalysis.annualPropertyAppreciationData) {
      if (yPosition > 150) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Property Appreciation Analysis', 20, yPosition);
      yPosition += 10;

      const appreciation = data.valuation?.propertyAppreciation || financialAnalysis.annualPropertyAppreciationData;
      
      if (data.valuation?.propertyAppreciation) {
        const appreciationData = [
          ['Annual Appreciation Rate', `${data.valuation.propertyAppreciation.annualAppreciationRate?.toFixed(2) || 'N/A'}%`],
          ['Current Value', this.formatCurrency(data.valuation.propertyAppreciation.currentValue || 0)],
          ['5-Year Value', this.formatCurrency(data.valuation.propertyAppreciation.year5Value || 0)],
          ['10-Year Value', this.formatCurrency(data.valuation.propertyAppreciation.year10Value || 0)],
          ['20-Year Value', this.formatCurrency(data.valuation.propertyAppreciation.year20Value || 0)]
        ];

        pdf.autoTable({
          startY: yPosition,
          head: [['Appreciation Metric', 'Value']],
          body: appreciationData,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [30, 64, 175] },
        });
        yPosition = pdf.lastAutoTable.finalY + 15;
      } else if (appreciation?.yearlyValues) {
        const appreciationData = Object.entries(appreciation.yearlyValues).slice(0, 10).map(([year, value]: [string, any]) => [
          `Year ${year}`,
          this.formatCurrency(value)
        ]);

        pdf.autoTable({
          startY: yPosition,
          head: [['Year', 'Projected Value']],
          body: appreciationData,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [30, 64, 175] },
        });
        yPosition = pdf.lastAutoTable.finalY + 15;
      }
    }

    return yPosition;
  }

  private addFooter(pdf: jsPDF): void {
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('This report is generated by Proply AI and is valid for 30 days from the generation date.', 20, pageHeight - 20);
    pdf.text('For the latest property data and analysis, please visit proply.co.za', 20, pageHeight - 15);
    pdf.text('© 2024 Proply. All rights reserved.', 20, pageHeight - 10);
  }
}

export const pdfService = new PDFService();