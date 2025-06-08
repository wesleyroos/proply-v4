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
async function calculateAndSaveFinancialDataForProperty(propertyId: string) {
  console.log(`Starting automatic financial data calculation for property ${propertyId}`);

  // Fetch required data
  const property = await db.query.propdataListings.findFirst({
    where: eq(propdataListings.propdataId, propertyId)
  });

  if (!property) {
    throw new Error(`Property ${propertyId} not found`);
  }

  // Fetch or create valuation report
  let valuationReport = await db.query.valuationReports.findFirst({
    where: eq(valuationReports.propertyId, propertyId)
  });

  // Create valuation report if it doesn't exist
  if (!valuationReport) {
    console.log(`Creating new valuation report for property ${propertyId}`);
    const newReport = await db.insert(valuationReports).values({
      propertyId: propertyId,
      userId: 1, // Default user - modify as needed
      address: property.address,
      price: property.price.toString(),
      valuationData: { automated: true }, // Required field
    }).returning();
    valuationReport = newReport[0];
  }

  // Fetch rental data
  const rentalData = await db.query.rentalPerformanceData.findFirst({
    where: eq(rentalPerformanceData.propertyId, propertyId)
  });

  const propertyPrice = parseFloat(property.price.toString());
  const financingParams = DEFAULT_FINANCING_PARAMS;

  // 1. ANNUAL PROPERTY APPRECIATION DATA
  const defaultAppreciationRate = 8.0;
  const annualPropertyAppreciationData = {
    baseSuburbRate: defaultAppreciationRate,
    propertyAdjustments: {},
    finalAppreciationRate: defaultAppreciationRate,
    yearlyValues: (() => {
      const rate = defaultAppreciationRate / 100;
      return [1, 2, 3, 4, 5, 10, 20].reduce((acc, year) => {
        acc[`year${year}`] = propertyPrice * Math.pow(1 + rate, year);
        return acc;
      }, {} as Record<string, number>);
    })(),
    reasoning: "Standard market appreciation rate applied automatically"
  };

  // 2. CASHFLOW ANALYSIS DATA
  const cashflowAnalysisData = {
    revenueGrowthTrajectory: {
      shortTerm: rentalData?.shortTermData ? (() => {
        const data = typeof rentalData.shortTermData === 'string' 
          ? JSON.parse(rentalData.shortTermData) 
          : rentalData.shortTermData;
        const baseAnnual = data?.Conservative?.annual || (propertyPrice * 0.08);
        return [1, 2, 3, 4, 5].reduce((acc, year) => {
          const revenue = baseAnnual * Math.pow(1.08, year - 1);
          const grossYield = (revenue / propertyPrice) * 100;
          acc[`year${year}`] = { revenue, grossYield };
          return acc;
        }, {} as Record<string, { revenue: number; grossYield: number }>);
      })() : null,
      longTerm: (rentalData?.longTermMinRental && rentalData?.longTermMaxRental) ? (() => {
        const monthlyAvg = (parseFloat(rentalData.longTermMinRental.toString()) + parseFloat(rentalData.longTermMaxRental.toString())) / 2;
        const baseAnnual = monthlyAvg * 12;
        return [1, 2, 3, 4, 5].reduce((acc, year) => {
          const revenue = baseAnnual * Math.pow(1.08, year - 1);
          const grossYield = (revenue / propertyPrice) * 100;
          acc[`year${year}`] = { revenue, grossYield };
          return acc;
        }, {} as Record<string, { revenue: number; grossYield: number }>);
      })() : null
    },
    recommendedStrategy: "shortTerm", // Default recommendation
    strategyReasoning: "Automatically calculated based on available rental data"
  };

  // 3. FINANCING ANALYSIS DATA
  const depositPercentage = financingParams.depositPercentage / 100;
  const loanToValue = 1 - depositPercentage;
  const interestRate = financingParams.interestRate / 100;
  const loanTermYears = financingParams.loanTermYears;
  const loanTermMonths = loanTermYears * 12;
  
  const depositAmount = propertyPrice * depositPercentage;
  const loanAmount = propertyPrice * loanToValue;
  const monthlyInterestRate = interestRate / 12;
  
  const monthlyPayment = (loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanTermMonths))) / (Math.pow(1 + monthlyInterestRate, loanTermMonths) - 1);

  const financingAnalysisData = {
    financingParameters: {
      depositAmount,
      depositPercentage: financingParams.depositPercentage,
      loanAmount,
      interestRate: financingParams.interestRate,
      loanTerm: loanTermYears,
      monthlyPayment
    },
    yearlyMetrics: [1, 2, 3, 4, 5, 10, 20].reduce((acc, year) => {
      const monthsElapsed = year * 12;
      let remainingBalance = loanAmount;
      let totalPrincipalPaid = 0;

      for (let month = 1; month <= monthsElapsed && month <= loanTermMonths; month++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = monthlyPayment - interestPayment;
        totalPrincipalPaid += principalPayment;
        remainingBalance -= principalPayment;
      }

      acc[`year${year}`] = {
        monthlyPayment,
        equityBuildup: totalPrincipalPaid,
        remainingBalance: Math.max(0, remainingBalance)
      };
      return acc;
    }, {} as Record<string, { monthlyPayment: number; equityBuildup: number; remainingBalance: number }>)
  };

  // SAVE ALL FINANCIAL DATA TO DATABASE
  await db.execute(sql`
    UPDATE valuation_reports 
    SET 
      annual_property_appreciation_data = ${JSON.stringify(annualPropertyAppreciationData)},
      cashflow_analysis_data = ${JSON.stringify(cashflowAnalysisData)},
      financing_analysis_data = ${JSON.stringify(financingAnalysisData)},
      current_deposit_percentage = ${financingParams.depositPercentage.toString()},
      current_interest_rate = ${financingParams.interestRate.toString()},
      current_loan_term = ${loanTermYears},
      current_deposit_amount = ${depositAmount.toString()},
      current_loan_amount = ${loanAmount.toString()},
      current_monthly_repayment = ${monthlyPayment.toString()},
      updated_at = NOW()
    WHERE property_id = ${propertyId}
  `);

  console.log(`Successfully saved comprehensive financial data for property ${propertyId}`);
  return {
    annualPropertyAppreciationData,
    cashflowAnalysisData,
    financingAnalysisData
  };
}

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
    res.status(500).json({ error: 'Test PDF generation failed', details: error.message });
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
    
    // AUTOMATICALLY CALCULATE AND SAVE ALL FINANCIAL DATA BEFORE PDF GENERATION
    try {
      await calculateAndSaveFinancialDataForProperty(propertyId);
      console.log(`Financial data calculated and saved for property ${propertyId}`);
    } catch (financialError) {
      console.warn(`Warning: Could not save financial data for property ${propertyId}:`, financialError);
      // Continue with PDF generation even if financial data saving fails
    }
    
    // Generate PDF using the service (now with saved financial data)
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
    
    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    console.log(`Generating and sending PDF report for property ${propertyId}`);
    
    // Fetch property details for email
    const property = await db.query.propdataListings.findFirst({
      where: eq(propdataListings.propdataId, propertyId)
    });
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // AUTOMATICALLY CALCULATE AND SAVE ALL FINANCIAL DATA BEFORE PDF GENERATION
    try {
      await calculateAndSaveFinancialDataForProperty(propertyId);
      console.log(`Financial data calculated and saved for property ${propertyId}`);
    } catch (financialError) {
      console.warn(`Warning: Could not save financial data for property ${propertyId}:`, financialError);
      // Continue with PDF generation even if financial data saving fails
    }
    
    // Generate PDF (now with saved financial data)
    const pdfBuffer = await PropdataPdfService.generateReport(propertyId);
    
    // Create unique report ID and store PDF temporarily
    const reportId = createId();
    await ensureTempDirectory();
    
    const filename = `Proply_Report_${propertyId}_${new Date().toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(PDF_STORAGE_PATH, `${reportId}.pdf`);
    
    // Save PDF to temporary storage
    await fs.writeFile(filePath, pdfBuffer);
    
    // Create download URL
    const downloadUrl = `${req.protocol}://${req.get('host')}/api/propdata-reports/download/${reportId}`;
    
    // Send email using the new email service
    const emailHtml = generatePropertyReportEmailTemplate(
      property.address,
      downloadUrl,
      filename
    );
    
    const emailSent = await sendEmail({
      to: 'wesley@proply.co.za',
      from: 'reports@proply.co.za',
      subject: `Proply Property Investment Report - ${property.address}`,
      html: emailHtml
    });
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send email' });
    }
    
    // Schedule cleanup after 30 days
    setTimeout(async () => {
      try {
        await fs.unlink(filePath);
        console.log(`Cleaned up PDF file: ${reportId}`);
      } catch (error) {
        console.error(`Error cleaning up PDF file ${reportId}:`, error);
      }
    }, 30 * 24 * 60 * 60 * 1000); // 30 days
    
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
      
      // Read file and send
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

// Generate Proply-branded email template
function generateEmailTemplate(propertyId: string, downloadUrl: string, filename: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proply Property Investment Report</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          background-color: #1e40af;
          color: white;
          padding: 15px 30px;
          border-radius: 6px;
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 1px;
          margin-bottom: 20px;
          display: inline-block;
        }
        .title {
          color: #1e40af;
          font-size: 28px;
          font-weight: bold;
          margin: 0;
        }
        .subtitle {
          color: #64748b;
          font-size: 16px;
          margin: 5px 0 0 0;
        }
        .content {
          margin: 30px 0;
        }
        .property-info {
          background-color: #f1f5f9;
          padding: 20px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .download-button {
          display: inline-block;
          background-color: #1e40af;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
          transition: background-color 0.3s;
        }
        .download-button:hover {
          background-color: #1d4ed8;
        }
        .info-box {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        .contact-info {
          margin-top: 20px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PROPLY</div>
          <h1 class="title">Property Investment Report</h1>
          <p class="subtitle">Comprehensive Analysis Ready for Download</p>
        </div>
        
        <div class="content">
          <p>Hello,</p>
          
          <p>Your comprehensive property investment analysis report has been generated and is ready for download.</p>
          
          <div class="property-info">
            <strong>Property ID:</strong> ${propertyId}<br>
            <strong>Report Generated:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>File Name:</strong> ${filename}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${downloadUrl}" class="download-button">
              📊 Download Your Report Here
            </a>
          </div>
          
          <div class="info-box">
            <strong>⏰ Important:</strong> This download link will be available for <strong>30 days</strong> from the generation date. Please download your report within this timeframe.
          </div>
          
          <h3 style="color: #1e40af;">What's Included in Your Report:</h3>
          <ul>
            <li><strong>Property Overview</strong> - Location map, images, and specifications</li>
            <li><strong>AI Valuation Analysis</strong> - Market value assessment and appreciation forecasts</li>
            <li><strong>Rental Performance</strong> - Short-term and long-term rental projections</li>
            <li><strong>Financial Analysis</strong> - Financing details, revenue projections, and equity buildup</li>
            <li><strong>Property Details</strong> - Agent information and comprehensive property data</li>
          </ul>
          
          <p>This report contains all the financial analysis data from your property evaluation, providing you with comprehensive insights for your investment decision.</p>
        </div>
        
        <div class="footer">
          <div class="contact-info">
            <strong>Proply Investment Platform</strong><br>
            Email: wesley@proply.co.za<br>
            Web: proply.co.za
          </div>
          <p style="margin-top: 15px; font-size: 12px;">
            This email was sent by Proply's automated reporting system. If you did not request this report, please contact our support team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export default router;