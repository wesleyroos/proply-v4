import { Router } from 'express';
import { PropdataPdfService } from '../services/propdataPdfService';
import { SimplePdfTest } from '../services/simplePdfTest';
import { sendEmail, generatePropertyReportEmailTemplate } from '../services/emailService';
import { createId } from '@paralleldrive/cuid2';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../../db';
import { propdataListings, valuationReports, rentalPerformanceData } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { logReportActivity } from './report-activity';
import { ReportMappingService } from '../services/reportMappingService';

const router = Router();

// Store for temporary PDF files (in production, use cloud storage)
const PDF_STORAGE_PATH = path.join(process.cwd(), 'temp_pdfs');

// Default financing parameters
const DEFAULT_FINANCING_PARAMS = {
  depositPercentage: 10,
  interestRate: 11.5,
  loanTermYears: 20
};

// Function to automatically calculate and save all financial data for a property
// Financial data calculation function REMOVED - now handled during valuation generation
// PDF generation only reads pre-saved financial data from database

// Ensure temp directory exists
async function ensureTempDirectory() {
  try {
    await fs.access(PDF_STORAGE_PATH);
  } catch {
    await fs.mkdir(PDF_STORAGE_PATH, { recursive: true });
  }
}

// Test endpoint for basic PDF generation (no auth required for debugging)
router.get('/test', async (req, res) => {
  try {
    console.log('Testing basic PDF generation...');
    const pdfBuffer = await SimplePdfTest.createTestPdf();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Test PDF generation failed:', error);
    res.status(500).json({ error: 'Test PDF generation failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Generate and return PDF directly
router.post('/generate/:propertyId', async (req, res) => {
  // Note: Authentication handled by frontend session
  try {
    const { propertyId } = req.params;
    
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    console.log(`Generating PDF report for property ${propertyId}`);
    
    // PDF generation now only reads pre-saved financial data from database
    // Financial data should already be calculated and saved during valuation generation
    console.log(`Reading pre-saved financial data for property ${propertyId}`);
    
    // Generate PDF using the service (reading saved financial data)
    const pdfBuffer = await PropdataPdfService.generateReport(propertyId);
    
    console.log(`PDF generated successfully, size: ${pdfBuffer.length} bytes`);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Proply_Report_${propertyId}_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF buffer
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error generating PDF report:', error);
    
    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to generate PDF report',
      details: errorMessage,
      propertyId: req.params.propertyId
    });
  }
});

// Generate PDF and send via email
router.post('/send/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { recipients } = req.body;
    
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Default to wesley@proply.co.za if no recipients specified
    const emailRecipients = recipients && Array.isArray(recipients) && recipients.length > 0 
      ? recipients 
      : ['wesley@proply.co.za'];

    console.log(`Generating and sending PDF report for property ${propertyId} to:`, emailRecipients);
    
    // Fetch property details for email
    const property = await db.query.propdataListings.findFirst({
      where: eq(propdataListings.propdataId, propertyId)
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // PDF generation reads pre-saved financial data from database
    console.log(`Reading pre-saved financial data for property ${propertyId}`);
    
    // Generate PDF using saved financial data
    const pdfBuffer = await PropdataPdfService.generateReport(propertyId);
    
    // Create unique report ID and store PDF temporarily
    const reportId = createId();
    await ensureTempDirectory();
    
    // Store mapping between report ID and property ID for activity tracking
    ReportMappingService.storeReportMapping(reportId, propertyId);
    
    const filename = `Proply_Report_${propertyId}_${new Date().toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(PDF_STORAGE_PATH, `${reportId}.pdf`);
    
    // Save PDF to temporary storage
    await fs.writeFile(filePath, pdfBuffer);
    
    // Create download URL - always use HTTPS and redirect to success page
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://app.proply.co.za' : 'https://a4d7da24-d166-4fff-8662-9d0679a39a39-00-1pwkvx9mwpc4.picard.replit.dev';
    const downloadUrl = `${baseUrl}/download/${reportId}`;
    
    // Send email using the new email service
    const emailHtml = generatePropertyReportEmailTemplate(
      property.address,
      downloadUrl,
      filename
    );
    
    // Send emails to all recipients and log activity
    const emailPromises = emailRecipients.map(async recipient => {
      const emailResult = await sendEmail({
        to: recipient,
        from: 'reports@proply.co.za',
        subject: `Proply Property Investment Report - ${property.address}`,
        html: emailHtml
      });
      
      // Log email send activity
      if (emailResult) {
        try {
          await logReportActivity({
            propertyId: propertyId,
            activityType: 'sent',
            recipientEmail: recipient,
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
          });
        } catch (logError) {
          console.error('Failed to log email send activity:', logError);
          // Continue even if logging fails
        }
      }
      
      return emailResult;
    });
    
    const emailResults = await Promise.all(emailPromises);
    const failedEmails = emailResults.filter(result => !result);
    
    if (failedEmails.length > 0) {
      console.error(`Failed to send ${failedEmails.length} out of ${emailRecipients.length} emails`);
      return res.status(500).json({ error: 'Failed to send some emails' });
    }
    
    // Note: File cleanup handled by periodic cleanup job or manual deletion
    // 30 days = 2,592,000,000ms which exceeds Node.js setTimeout max (2^31-1 = 2,147,483,647ms)
    console.log(`PDF stored at: ${filePath} - expires after 30 days`);
    
    res.json({ 
      success: true, 
      message: 'Report generated and sent successfully',
      reportId,
      downloadUrl,
      expiresIn: '30 days'
    });
    
  } catch (error) {
    console.error('Error sending PDF report:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to generate and send PDF report',
      details: errorMessage,
      propertyId: req.params.propertyId
    });
  }
});

// Download stored PDF report
router.get('/download/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    if (!reportId) {
      return res.status(400).json({ error: 'Report ID is required' });
    }

    const filePath = path.join(PDF_STORAGE_PATH, `${reportId}.pdf`);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Log download activity using proper property ID mapping
      try {
        const propertyId = ReportMappingService.getPropertyIdFromReportId(reportId);
        if (propertyId) {
          await logReportActivity({
            propertyId: propertyId,
            reportId: reportId,
            activityType: 'downloaded',
            recipientEmail: 'agent@download.com', // Placeholder for agent downloads
            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
          });
        } else {
          console.warn(`No property ID mapping found for report ID: ${reportId}`);
        }
      } catch (logError) {
        console.error('Failed to log download activity:', logError);
        // Continue with download even if logging fails
      }
      
      // Direct download for all requests
      const pdfBuffer = await fs.readFile(filePath);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Proply_Report_${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
      
    } catch (fileError) {
      console.error(`PDF file not found: ${reportId}`, fileError);
      res.status(404).json({ 
        error: 'Report not found or has expired',
        reportId,
        message: 'Reports are available for download for 30 days after generation'
      });
    }
    
  } catch (error) {
    console.error('Error downloading PDF report:', error);
    res.status(500).json({ 
      error: 'Failed to download PDF report',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});



export default router;