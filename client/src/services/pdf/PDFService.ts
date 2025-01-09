import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

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

  async generatePDF(
    contentElement: HTMLElement,
    options: PDFGenerationOptions,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      pdf.setFontSize(20);
      pdf.text(options.title, this.margins.left, this.margins.top);

      // Add company logo if provided
      if (options.companyLogo) {
        await this.addLogo(pdf, options.companyLogo);
      }

      // Capture and add content
      const canvas = await html2canvas(contentElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true
      });

      const contentWidth = this.pageWidth - this.margins.left - this.margins.right;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      const contentDataUrl = canvas.toDataURL('image/png');

      pdf.addImage(
        contentDataUrl,
        'PNG',
        this.margins.left,
        this.margins.top + 15,
        contentWidth,
        contentHeight
      );

      // Add watermark if provided
      if (options.watermark) {
        this.addWatermark(pdf, options.watermark);
      }

      // Add page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          this.pageWidth / 2,
          this.pageHeight - 10,
          { align: 'center' }
        );
      }

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  private async addLogo(pdf: jsPDF, logoUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const imgWidth = 40;
        const imgHeight = (img.height * imgWidth) / img.width;
        pdf.addImage(
          img,
          'PNG',
          this.pageWidth - this.margins.right - imgWidth,
          this.margins.top,
          imgWidth,
          imgHeight
        );
        resolve();
      };
      img.onerror = reject;
      img.src = logoUrl;
    });
  }

  private addWatermark(pdf: jsPDF, text: string): void {
    pdf.setFontSize(40);
    pdf.setTextColor(200, 200, 200);
    pdf.setGState(new pdf.GState({ opacity: 0.2 }));
    
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.text(
        text,
        this.pageWidth / 2,
        this.pageHeight / 2,
        {
          angle: 45,
          align: 'center'
        }
      );
    }
    pdf.setTextColor(0);
    pdf.setGState(new pdf.GState({ opacity: 1 }));
  }
}

export const pdfService = new PDFGenerationService();
