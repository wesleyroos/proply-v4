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
          enable: false // Disable click tracking to prevent URL rewriting
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

export async function sendWelcomeEmail(userData: {
  email: string;
  firstName: string;
}): Promise<boolean> {
  try {
    const subject = 'Welcome to Proply!';
    const verifiedWelcomeSender = 'hello@proply.co.za';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <img src="https://proply.co.za/proply-logo-1.png" alt="Proply" style="max-width: 200px; margin: 20px 0;" />
        <h2>Welcome to Proply, ${userData.firstName}!</h2>
        <p>Thank you for joining Proply - your partner in property investment intelligence.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Getting Started</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li style="margin-bottom: 10px;">✨ Analyze your first property</li>
            <li style="margin-bottom: 10px;">📊 Generate detailed reports</li>
            <li style="margin-bottom: 10px;">💡 Get market insights</li>
          </ul>
        </div>
        <p>
          Ready to start? <a href="https://proply.co.za/dashboard" style="color: #1BA3FF;">Visit your dashboard</a>
        </p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>If you need any assistance, don't hesitate to contact our support team.</p>
        </div>
      </div>
    `;

    const text = `
      Welcome to Proply, ${userData.firstName}!

      Thank you for joining Proply - your partner in property investment intelligence.

      Getting Started:
      - Analyze your first property
      - Generate detailed reports
      - Get market insights

      Ready to start? Visit your dashboard at: https://proply.co.za/dashboard

      If you need any assistance, don't hesitate to contact our support team.
    `;

    const msg = {
      to: userData.email,
      from: {
        email: verifiedWelcomeSender,
        name: 'Proply'
      },
      subject,
      text,
      html,
      mailSettings: {
        sandboxMode: {
          enable: false
        }
      },
      trackingSettings: {
        clickTracking: {
          enable: false
        },
        openTracking: {
          enable: true
        }
      }
    };

    console.log('Sending welcome email with SendGrid...');
    await mailService.send(msg);
    console.log('Welcome email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  // Use APPLICATION_URL from environment or fallback to default URL
  const appUrl = process.env.APPLICATION_URL || process.env.APP_URL || 'https://proply.co.za';
  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

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