import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendAdminNotification(params: EmailParams): Promise<boolean> {
  try {
    const adminEmail = 'wesley@proply.co.za';

    console.log('Attempting to send admin notification email:', {
      to: params.to || adminEmail,
      from: adminEmail,
      subject: params.subject
    });

    await mailService.send({
      to: params.to || adminEmail,
      from: adminEmail, // The sender must be a verified email in SendGrid
      subject: params.subject,
      text: params.text || '',
      html: params.html,
    });

    console.log('Admin notification email sent successfully');
    return true;
  } catch (error: unknown) {
    console.error('SendGrid email error:', error);
    if (error instanceof Error && 'response' in error) {
      const sendGridError = error as any;
      console.error('SendGrid API response:', {
        body: sendGridError.response?.body,
        headers: sendGridError.response?.headers,
        statusCode: sendGridError.response?.statusCode
      });
    }
    return false;
  }
}

export async function sendNewUserNotification(userData: {
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  subscriptionStatus: string;
}): Promise<boolean> {
  console.log('Preparing new user notification email for:', userData.email);

  const subject = 'New User Registration on Proply';
  const html = `
    <h2>New User Registration</h2>
    <p>A new user has registered on the Proply platform.</p>
    <h3>User Details:</h3>
    <ul>
      <li><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</li>
      <li><strong>Email:</strong> ${userData.email}</li>
      <li><strong>Account Type:</strong> ${userData.userType}</li>
      <li><strong>Subscription:</strong> ${userData.subscriptionStatus}</li>
    </ul>
    <p>Login to the admin dashboard for more details.</p>
  `;

  return sendAdminNotification({
    to: 'wesley@proply.co.za',
    subject,
    html,
  });
}