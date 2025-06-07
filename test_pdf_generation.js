import { PropdataPdfService } from './server/services/propdataPdfService.js';
import fs from 'fs';

async function testPdfGeneration() {
  try {
    console.log('Testing PDF generation for property 2532182...');
    
    const pdfBuffer = await PropdataPdfService.generateReport('2532182');
    
    console.log('PDF generated successfully!');
    console.log('PDF size:', pdfBuffer.length, 'bytes');
    
    // Save to file for verification
    fs.writeFileSync('test_report.pdf', pdfBuffer);
    console.log('PDF saved as test_report.pdf');
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    console.error('Error details:', error.message);
  }
}

testPdfGeneration();