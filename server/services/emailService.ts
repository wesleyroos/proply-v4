import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments,
      // Disable click tracking to prevent URL wrapping issues
      trackingSettings: {
        clickTracking: {
          enable: false,
          enableText: false
        },
        openTracking: {
          enable: true
        },
        subscriptionTracking: {
          enable: false
        }
      }
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generatePropertyReportEmailTemplate(
  propertyAddress: string,
  downloadUrl: string,
  filename: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Proply Property Investment Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6; 
          color: #1f2937; 
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #1ba2ff 0%, #0080ff 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>') repeat;
          opacity: 0.3;
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .logo {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .subtitle {
          font-size: 18px;
          font-weight: 500;
          opacity: 0.9;
          margin-bottom: 0;
        }
        
        .content {
          padding: 40px 30px;
          background-color: #ffffff;
        }
        
        .greeting {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
          line-height: 1.3;
        }
        
        .property-address {
          color: #1ba2ff;
          font-weight: 600;
          text-decoration: none;
        }
        
        .description {
          font-size: 16px;
          color: #4b5563;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 32px 0;
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .feature {
          display: flex;
          align-items: center;
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }
        
        .feature::before {
          content: '✓';
          display: inline-block;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 20px;
          font-size: 12px;
          font-weight: bold;
          margin-right: 12px;
          flex-shrink: 0;
        }
        
        .cta-section {
          text-align: center;
          margin: 40px 0;
          padding: 32px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 16px;
          border: 2px solid #1ba2ff;
        }
        
        .cta-text {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 20px;
        }
        
        .download-button {
          display: inline-block;
          background: linear-gradient(135deg, #1ba2ff 0%, #0080ff 100%);
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(27, 162, 255, 0.3);
          border: none;
          cursor: pointer;
        }
        
        .download-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(27, 162, 255, 0.4);
        }
        
        .download-icon {
          margin-right: 8px;
          font-size: 18px;
        }
        
        .expiry-notice {
          margin: 32px 0;
          padding: 16px;
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 6px;
          font-size: 14px;
          color: #92400e;
        }
        
        .support-section {
          margin: 32px 0;
          padding: 24px;
          background-color: #f9fafb;
          border-radius: 12px;
          text-align: center;
        }
        
        .support-text {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 16px;
        }
        
        .contact-link {
          color: #1ba2ff;
          text-decoration: none;
          font-weight: 600;
        }
        
        .signature {
          margin-top: 32px;
          font-size: 16px;
          color: #374151;
        }
        
        .team-name {
          font-weight: 600;
          color: #1ba2ff;
        }
        
        .footer {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: #9ca3af;
          padding: 32px 30px;
          text-align: center;
          font-size: 12px;
        }
        
        .footer-logo {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
        }
        
        .footer-text {
          margin: 8px 0;
          opacity: 0.8;
        }
        
        @media (max-width: 600px) {
          .email-container {
            margin: 0;
            border-radius: 0;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
          
          .header, .content, .footer {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-content">
            <div class="logo">PROPLY</div>
            <div class="subtitle">AI-Powered Property Intelligence</div>
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">
            🏡 Your Investment Report is Ready!
          </div>
          
          <div class="description">
            Your comprehensive property investment analysis for <strong class="property-address">${propertyAddress}</strong> has been generated using our advanced AI algorithms and market intelligence.
          </div>
          
          <div class="features-grid">
            <div class="feature">Property Overview & Specs</div>
            <div class="feature">AI-Powered Valuation</div>
            <div class="feature">Rental Performance Analysis</div>
            <div class="feature">Financial Projections</div>
            <div class="feature">Yield Calculations</div>
            <div class="feature">Investment Recommendations</div>
          </div>
          
          <div class="cta-section">
            <div class="cta-text">
              Get instant access to your professional property report
            </div>
            <a href="${downloadUrl}" class="download-button">
              <span class="download-icon">📊</span>
              Download Your Report
            </a>
          </div>
          
          <div class="expiry-notice">
            <strong>⏰ Important:</strong> This secure download link will be available for 30 days from generation.
          </div>
          
          <div class="support-section">
            <div class="support-text">
              Need help interpreting your report or have questions about the analysis?
            </div>
            <a href="mailto:support@proply.co.za" class="contact-link">Contact Our Investment Team</a>
          </div>
          
          <div class="signature">
            Best regards,<br>
            <span class="team-name">The Proply Investment Intelligence Team</span>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-logo">PROPLY</div>
          <div class="footer-text">Transforming Real Estate Investment Through AI</div>
          <div class="footer-text">© 2025 Proply Property Intelligence Platform. All rights reserved.</div>
        </div>
      </div>
    </body>
    </html>
  `;
}