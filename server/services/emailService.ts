import sgMail from '@sendgrid/mail';
import { db } from '@db';
import { pdfReports } from '@db/schema';
import { eq } from 'drizzle-orm';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found in environment variables');
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private createReportEmailTemplate(
    propertyAddress: string,
    downloadUrl: string,
    reportId: string
  ): EmailTemplate {
    const subject = `Your Property Investment Report - ${propertyAddress}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2980b9, #3498db); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2980b9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #1e6a94; }
          .property-summary { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2980b9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .highlight { color: #2980b9; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Your Property Investment Report is Ready!</h1>
            <p>Comprehensive analysis powered by Proply AI</p>
          </div>
          
          <div class="content">
            <h2>Hello,</h2>
            <p>Your detailed investment analysis report for <span class="highlight">${propertyAddress}</span> has been generated and is ready for download.</p>
            
            <div class="property-summary">
              <h3>📊 What's included in your report:</h3>
              <ul>
                <li><strong>AI-Powered Valuation Analysis</strong> - Comprehensive property assessment</li>
                <li><strong>Rental Performance Projections</strong> - Short-term and long-term rental estimates</li>
                <li><strong>Financial Analysis</strong> - Complete financing scenarios and cash flow projections</li>
                <li><strong>Property Appreciation Forecast</strong> - 20-year value growth projections</li>
                <li><strong>Investment Metrics</strong> - ROI, yield calculations, and risk assessments</li>
                <li><strong>Location Insights</strong> - Interactive property location mapping</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.REPLIT_DOMAIN || 'https://your-domain.replit.app'}${downloadUrl}" class="button">
                📥 Download Your Report Here
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>⏰ Important:</strong> This report is valid for <strong>30 days</strong> from the generation date. 
              Please download it soon to ensure access to your comprehensive property analysis.
            </div>
            
            <p>If you have any questions about your report or need assistance with your property investment analysis, please don't hesitate to reach out to our team.</p>
            
            <p>Happy investing!<br>
            <strong>The Proply Team</strong></p>
          </div>
          
          <div class="footer">
            <p>© 2024 Proply. All rights reserved.</p>
            <p>This email was sent regarding report ID: ${reportId}</p>
            <p>For support, visit <a href="https://proply.co.za">proply.co.za</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Your Property Investment Report is Ready!

Property: ${propertyAddress}

Your detailed investment analysis report has been generated and is ready for download.

What's included:
- AI-Powered Valuation Analysis
- Rental Performance Projections  
- Financial Analysis
- Property Appreciation Forecast
- Investment Metrics
- Location Insights

Download your report: ${process.env.REPLIT_DOMAIN || 'https://your-domain.replit.app'}${downloadUrl}

Important: This report is valid for 30 days from the generation date.

Report ID: ${reportId}

For support, visit proply.co.za

© 2024 Proply. All rights reserved.
    `;

    return { subject, html, text };
  }

  async sendReportEmail(
    reportId: string,
    recipientEmail: string,
    propertyAddress: string,
    downloadUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not configured');
      }

      const template = this.createReportEmailTemplate(propertyAddress, downloadUrl, reportId);

      const msg = {
        to: recipientEmail,
        from: {
          email: 'reports@proply.co.za',
          name: 'Proply Reports'
        },
        subject: template.subject,
        text: template.text,
        html: template.html,
        trackingSettings: {
          clickTracking: {
            enable: true,
          },
          openTracking: {
            enable: true,
          },
        },
      };

      await sgMail.send(msg);

      // Update database to mark email as sent
      await db
        .update(pdfReports)
        .set({
          emailSentAt: new Date(),
          emailDeliveryStatus: 'sent',
        })
        .where(eq(pdfReports.id, reportId));

      console.log(`PDF report email sent successfully to ${recipientEmail} for report ${reportId}`);
      return { success: true };

    } catch (error: any) {
      console.error('Error sending PDF report email:', error);

      // Update database to mark email as failed
      try {
        await db
          .update(pdfReports)
          .set({
            emailDeliveryStatus: 'failed',
            emailErrorMessage: error.message || 'Unknown error',
          })
          .where(eq(pdfReports.id, reportId));
      } catch (dbError) {
        console.error('Error updating email failure status:', dbError);
      }

      return { 
        success: false, 
        error: error.message || 'Failed to send email' 
      };
    }
  }

  async resendReportEmail(reportId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Fetch report details from database
      const [report] = await db
        .select()
        .from(pdfReports)
        .where(eq(pdfReports.id, reportId))
        .limit(1);

      if (!report) {
        return { success: false, error: 'Report not found' };
      }

      // Check if report has expired
      if (new Date() > report.expiresAt) {
        return { success: false, error: 'Report has expired' };
      }

      // Get property address (assuming we can derive it from propertyId)
      const propertyAddress = report.propertyId; // Will need to join with property data if needed

      return await this.sendReportEmail(
        reportId,
        report.emailSentTo,
        propertyAddress,
        report.downloadUrl
      );

    } catch (error: any) {
      console.error('Error resending PDF report email:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to resend email' 
      };
    }
  }
}

export const emailService = new EmailService();