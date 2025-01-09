// This file is deprecated. Using new implementation from features/property-analyzer-pdf

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PropertyData, ReportSelections } from '../types/propertyReport';

export class PDFGenerationService {
  private captureMap = async (mapElement: HTMLElement): Promise<string> => {
    try {
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        windowWidth: mapElement.scrollWidth,
        windowHeight: mapElement.scrollHeight
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing map:', error);
      throw new Error('Failed to capture map image');
    }
  };

  private captureElement = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scrollY: -window.scrollY,
      onclone: (document) => {
        // Remove any unnecessary elements that shouldn't appear in PDF
        const elements = document.querySelectorAll('.no-print');
        elements.forEach(el => el.remove());
      }
    });
    return canvas;
  };

  public async generatePDF(
    reportElement: HTMLElement,
    mapElement: HTMLElement | null,
    data: PropertyData,
    selections: ReportSelections
  ): Promise<jsPDF> {
    try {
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Capture map if selected
      if (mapElement && selections.propertyDetails?.map) {
        const mapImage = await this.captureMap(mapElement);
        data.propertyDetails.mapImage = mapImage;
      }

      // Capture the entire report
      const canvas = await this.captureElement(reportElement);
      const imgData = canvas.toDataURL('image/png');

      // PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate dimensions to fit A4
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      // Center the content
      const x = (pdfWidth - imgWidth * ratio) / 2;
      const y = 0;

      // Add the image to PDF
      pdf.addImage(
        imgData,
        'PNG',
        x,
        y,
        imgWidth * ratio,
        imgHeight * ratio,
        undefined,
        'FAST'
      );

      // Add page numbers
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pdf.internal.pageSize.getWidth() / 2,
          pdf.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  public async generateAndDownload(
    reportElement: HTMLElement,
    mapElement: HTMLElement | null,
    data: PropertyData,
    selections: ReportSelections,
    filename: string
  ): Promise<void> {
    const pdf = await this.generatePDF(reportElement, mapElement, data, selections);
    pdf.save(filename);
  }

  public async generateAndOpen(
    reportElement: HTMLElement,
    mapElement: HTMLElement | null,
    data: PropertyData,
    selections: ReportSelections
  ): Promise<void> {
    const pdf = await this.generatePDF(reportElement, mapElement, data, selections);
    window.open(URL.createObjectURL(pdf.output('blob')));
  }
}