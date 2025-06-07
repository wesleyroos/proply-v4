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
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #1E40AF; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .button { 
          display: inline-block; 
          background-color: #1E40AF; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px;
          margin: 10px 0;
        }
        .footer { 
          background-color: #f8f9fa; 
          padding: 15px; 
          text-align: center; 
          font-size: 12px; 
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PROPLY</h1>
        <h2>Property Investment Report</h2>
      </div>
      
      <div class="content">
        <h3>Property Analysis Report Ready</h3>
        
        <p>Your comprehensive property investment analysis for <strong>${propertyAddress}</strong> has been generated and is ready for download.</p>
        
        <p>This report includes:</p>
        <ul>
          <li>Property overview and specifications</li>
          <li>AI-powered valuation analysis</li>
          <li>Rental performance metrics</li>
          <li>Financial projections and yield calculations</li>
          <li>Investment recommendations</li>
        </ul>
        
        <p>
          <a href="${downloadUrl}" class="button">Download Report</a>
        </p>
        
        <p><strong>Important:</strong> This download link will be available for 30 days from the date of generation.</p>
        
        <p>If you have any questions about this report or need assistance with your property investment decisions, please don't hesitate to contact our team.</p>
        
        <p>Best regards,<br>
        The Proply Team</p>
      </div>
      
      <div class="footer">
        <p>This email was sent by Proply Property Investment Platform</p>
        <p>© 2025 Proply. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}