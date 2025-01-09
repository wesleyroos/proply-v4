import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { PropertyData, ReportSelections } from '../types/propertyReport';
import { ImageService } from './ImageService';
import { optimizeCanvas } from '../utils/optimization';
import { formatCurrency, formatPercentage } from '../utils/formatting';

export interface PDFGenerationOptions {
  sections: string[];
  companyLogo?: string;
  title: string;
  watermark?: string;
}

class PDFGenerationService {
  private readonly pageWidth = 210; // A4 width in mm
  private readonly pageHeight = 297; // A4 height in mm
  private readonly margins = {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  };
  
  private readonly imageService: ImageService;

  constructor() {
    this.imageService = new ImageService();
  }

  async generatePDF(
    contentElement: HTMLElement,
    mapElement: HTMLElement | null,
    data: PropertyData,
    selections: ReportSelections,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    try {
      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      onProgress?.(10);

      // Process and add map if selected
      if (mapElement && selections.includeMap) {
        const mapImage = await this.imageService.captureMap(mapElement);
        data.propertyDetails.mapImage = mapImage;
      }

      onProgress?.(30);

      // Capture main content
      const contentCanvas = await this.captureContent(contentElement);
      onProgress?.(60);

      // Add content to PDF
      await this.addContentToPDF(pdf, contentCanvas);
      onProgress?.(80);

      // Add finishing touches
      this.addPageNumbers(pdf);
      if (selections.includeWatermark) {
        this.addWatermark(pdf, "Property Analysis Report");
      }

      onProgress?.(100);
      return pdf.output('blob');

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  private async captureContent(element: HTMLElement): Promise<HTMLCanvasElement> {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      onclone: (document) => {
        const elements = document.querySelectorAll('.no-print');
        elements.forEach(el => el.remove());
      }
    });

    return optimizeCanvas(canvas);
  }

  private async addContentToPDF(pdf: jsPDF, canvas: HTMLCanvasElement): Promise<void> {
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(
      (pdfWidth - this.margins.left - this.margins.right) / imgWidth,
      (pdfHeight - this.margins.top - this.margins.bottom) / imgHeight
    );

    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    const x = (pdfWidth - scaledWidth) / 2;
    
    pdf.addImage(
      imgData,
      'PNG',
      x,
      this.margins.top,
      scaledWidth,
      scaledHeight,
      undefined,
      'FAST'
    );
  }

  private addPageNumbers(pdf: jsPDF): void {
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  private addWatermark(pdf: jsPDF, text: string): void {
    const pages = pdf.getNumberOfPages();
    pdf.setFontSize(40);
    pdf.setTextColor(200);
    
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      pdf.saveGraphicsState();
      pdf.setGState(new pdf.GState({ opacity: 0.2 }));
      pdf.text(
        text,
        this.pageWidth / 2,
        this.pageHeight / 2,
        {
          angle: 45,
          align: 'center'
        }
      );
      pdf.restoreGraphicsState();
    }
  }
}

export const pdfService = new PDFGenerationService();
