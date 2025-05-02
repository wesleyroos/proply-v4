import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY environment variable is not set");
}

const mailService = new MailService();
mailService.setApiKey(SENDGRID_API_KEY || '');

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export interface DemoRequestData {
  fullName: string;
  email: string;
  company: string;
  phoneNumber: string;
  product: string;
  message: string;
}

export async function sendDemoRequestEmail(data: DemoRequestData): Promise<boolean> {
  const adminEmail = 'admin@proply.com'; // Change to your admin email
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">New Demo Request</h2>
      
      <div style="margin: 20px 0;">
        <p><strong>Name:</strong> ${data.fullName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Company:</strong> ${data.company}</p>
        <p><strong>Phone:</strong> ${data.phoneNumber}</p>
        <p><strong>Product of Interest:</strong> ${data.product}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 5px;">
          ${data.message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee;">
        <p>This email was sent from the Proply website demo request form.</p>
      </div>
    </div>
  `;
  
  const textContent = `
    New Demo Request
    
    Name: ${data.fullName}
    Email: ${data.email}
    Company: ${data.company}
    Phone: ${data.phoneNumber}
    Product of Interest: ${data.product}
    
    Message:
    ${data.message}
    
    This email was sent from the Proply website demo request form.
  `;
  
  return sendEmail({
    to: adminEmail,
    from: 'noreply@proply.com', // Change to your verified sender
    subject: `Demo Request from ${data.fullName} - ${data.company}`,
    text: textContent,
    html: htmlContent,
  });
}