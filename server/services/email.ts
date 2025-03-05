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
    // Important: This must be your verified sender in SendGrid
    const verifiedSender = 'wesley@proply.co.za'; 

    console.log('Preparing to send admin notification email:', {
      to: params.to || adminEmail,
      from: verifiedSender,
      subject: params.subject,
      hasHtml: !!params.html,
      hasText: !!params.text
    });

    const msg = {
      to: params.to || adminEmail,
      from: {
        email: verifiedSender,
        name: 'Proply'
      },
      subject: params.subject,
      text: params.text || '',
      html: params.html,
      mailSettings: {
        sandboxMode: {
          enable: false
        }
      },
      trackingSettings: {
        clickTracking: {
          enable: true
        },
        openTracking: {
          enable: true
        }
      }
    };

    console.log('Sending email with SendGrid...');
    await mailService.send(msg);
    console.log('Admin notification email sent successfully');
    return true;
  } catch (error: unknown) {
    console.error('SendGrid email error:', error);
    if (error instanceof Error && 'response' in error) {
      const sendGridError = error as any;
      console.error('SendGrid API detailed error:', {
        body: sendGridError.response?.body,
        statusCode: sendGridError.response?.statusCode,
        message: sendGridError.message,
        name: sendGridError.name
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
  console.log('Preparing new user notification email for:', {
    userEmail: userData.email,
    name: `${userData.firstName} ${userData.lastName}`,
    type: userData.userType
  });

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

  const text = `
    New User Registration

    A new user has registered on the Proply platform.

    User Details:
    - Name: ${userData.firstName} ${userData.lastName}
    - Email: ${userData.email}
    - Account Type: ${userData.userType}
    - Subscription: ${userData.subscriptionStatus}

    Login to the admin dashboard for more details.
  `;

  return sendAdminNotification({
    to: 'wesley@proply.co.za',
    subject,
    html,
    text,
  });
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const resetLink = `${process.env.APP_URL || 'https://proply.co.za'}/reset-password?token=${resetToken}`;

  const html = `
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your password for your Proply account.</p>
    <p>Click the button below to reset your password:</p>
    <p>
      <a href="${resetLink}" style="background-color: #0066cc; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Reset Password
      </a>
    </p>
    <p>If you didn't request this, you can safely ignore this email.</p>
    <p>The password reset link will expire in 1 hour.</p>
    <p>
      If the button above doesn't work, copy and paste this link into your browser:<br>
      ${resetLink}
    </p>
  `;

  const text = `
    Reset Your Password

    We received a request to reset your password for your Proply account.

    Click the link below to reset your password:
    ${resetLink}

    If you didn't request this, you can safely ignore this email.
    The password reset link will expire in 1 hour.
  `;

  return sendAdminNotification({
    to: email,
    subject: 'Reset Your Proply Password',
    html,
    text,
  });
}