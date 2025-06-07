import { jsPDF } from 'jspdf';

export class SimplePdfTest {
  static async createTestPdf(): Promise<Buffer> {
    try {
      console.log('Creating simple test PDF...');
      
      const doc = new jsPDF();
      
      // Add simple content
      doc.setFontSize(20);
      doc.text('Proply Test Report', 20, 30);
      
      doc.setFontSize(12);
      doc.text('This is a test PDF to verify jsPDF functionality.', 20, 50);
      doc.text('If you can see this, the PDF generation is working.', 20, 70);
      
      // Generate buffer
      const buffer = Buffer.from(doc.output('arraybuffer'));
      console.log('Test PDF generated successfully, size:', buffer.length);
      
      return buffer;
    } catch (error) {
      console.error('Error creating test PDF:', error);
      throw error;
    }
  }
}