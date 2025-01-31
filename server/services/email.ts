import { MailService } from '@sendgrid/mail';

const mailService = new MailService();

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function initializeEmailService(apiKey: string) {
  mailService.setApiKey(apiKey);
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
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendNewUserNotification(userData: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  userType: string;
  subscriptionStatus: string;
}) {
  const adminEmail = 'wesley@proply.co.za';
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || adminEmail;
  
  const html = `
    <h2>New User Registration</h2>
    <p>A new user has registered on the Proply platform:</p>
    <ul>
      <li><strong>Email:</strong> ${userData.email}</li>
      <li><strong>Name:</strong> ${userData.firstName || ''} ${userData.lastName || ''}</li>
      <li><strong>Account Type:</strong> ${userData.userType}</li>
      <li><strong>Subscription:</strong> ${userData.subscriptionStatus}</li>
    </ul>
  `;

  return sendEmail({
    to: adminEmail,
    from: fromEmail,
    subject: 'New User Registration - Proply',
    html,
  });
}
