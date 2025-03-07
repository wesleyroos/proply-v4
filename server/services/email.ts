import { MailService } from "@sendgrid/mail";

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY || "");

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendAdminNotification(
  params: EmailParams,
): Promise<boolean> {
  try {
    const adminEmail = "wesley@proply.co.za";
    // Important: This must be your verified sender in SendGrid
    const verifiedSender = "hello@proply.co.za";

    console.log("Preparing to send admin notification email:", {
      to: params.to || adminEmail,
      from: verifiedSender,
      subject: params.subject,
      hasHtml: !!params.html,
      hasText: !!params.text,
    });

    const msg = {
      to: params.to || adminEmail,
      from: {
        email: verifiedSender,
        name: "Proply",
      },
      subject: params.subject,
      text: params.text || "",
      html: params.html,
      mailSettings: {
        sandboxMode: {
          enable: false,
        },
      },
      trackingSettings: {
        clickTracking: {
          enable: false, // Disable click tracking to prevent URL rewriting
        },
        openTracking: {
          enable: true,
        },
      },
    };

    console.log("Sending email with SendGrid...");
    await mailService.send(msg);
    console.log("Admin notification email sent successfully");
    return true;
  } catch (error: unknown) {
    console.error("SendGrid email error:", error);
    if (error instanceof Error && "response" in error) {
      const sendGridError = error as any;
      console.error("SendGrid API detailed error:", {
        body: sendGridError.response?.body,
        statusCode: sendGridError.response?.statusCode,
        message: sendGridError.message,
        name: sendGridError.name,
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
  console.log("Preparing new user notification email for:", {
    userEmail: userData.email,
    name: `${userData.firstName} ${userData.lastName}`,
    type: userData.userType,
  });

  const subject = "New User Registration on Proply";
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
    to: "wesley@proply.co.za",
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
    const verifiedSender = 'hello@proply.co.za';

    const html = `
      <!DOCTYPE html>
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        color: #333333;
        line-height: 1.6;
      ">
        <!-- Header with Logo -->
        <div style="text-align: center; padding: 20px 0 30px;">
          <img src="https://proply.co.za/proply-logo-1.png" alt="Proply" style="max-width: 180px; height: auto;" />
        </div>

        <!-- Main Content -->
        <div style="
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        ">
          <h1 style="
            color: #1e293b;
            font-size: 24px;
            margin: 0 0 20px;
            text-align: center;
          ">Welcome to Proply, ${userData.firstName}! 🎉</h1>

          <p style="
            color: #475569;
            font-size: 16px;
            margin-bottom: 25px;
            text-align: center;
          ">Your journey to smarter property investment starts here.</p>

          <!-- Features Grid -->
          <div style="
            background: #ffffff;
            border-radius: 8px;
            padding: 24px;
            margin: 20px 0;
            border: 1px solid #e2e8f0;
          ">
            <h2 style="
              color: #1e293b;
              font-size: 18px;
              margin: 0 0 20px;
              text-align: center;
            ">Here's what you can do with Proply:</h2>

            <div style="margin: 20px 0;">
              <div style="margin-bottom: 16px; display: flex;">
                <span style="color: #1BA3FF; font-size: 20px; margin-right: 10px;">✨</span>
                <div>
                  <strong style="color: #1e293b;">Analyze Properties</strong>
                  <p style="margin: 5px 0 0; color: #64748b;">Get detailed insights and analytics for any property</p>
                </div>
              </div>

              <div style="margin-bottom: 16px; display: flex;">
                <span style="color: #1BA3FF; font-size: 20px; margin-right: 10px;">📊</span>
                <div>
                  <strong style="color: #1e293b;">Generate Reports</strong>
                  <p style="margin: 5px 0 0; color: #64748b;">Create professional property analysis reports</p>
                </div>
              </div>

              <div style="margin-bottom: 16px; display: flex;">
                <span style="color: #1BA3FF; font-size: 20px; margin-right: 10px;">💡</span>
                <div>
                  <strong style="color: #1e293b;">Market Insights</strong>
                  <p style="margin: 5px 0 0; color: #64748b;">Access valuable market data and trends</p>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="https://proply.co.za/dashboard" 
              style="
                display: inline-block;
                background-color: #1BA3FF;
                color: #ffffff;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                transition: background-color 0.3s ease;
                box-shadow: 0 4px 6px rgba(27, 163, 255, 0.1);
              "
            >
              Go to Dashboard
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          text-align: center;
          padding-top: 30px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
        ">
          <p style="margin: 0 0 10px;">Need help getting started? Our support team is here for you.</p>
          <p style="margin: 0;">
            <a href="mailto:support@proply.co.za" style="color: #1BA3FF; text-decoration: none;">support@proply.co.za</a>
          </p>
        </div>
      </div>
    `;

    const text = `
      Welcome to Proply, ${userData.firstName}! 🎉

      Your journey to smarter property investment starts here.

      Here's what you can do with Proply:

      ✨ Analyze Properties
      Get detailed insights and analytics for any property

      📊 Generate Reports
      Create professional property analysis reports

      💡 Market Insights
      Access valuable market data and trends

      Ready to start? Visit your dashboard at: https://proply.co.za/dashboard

      Need help getting started? Our support team is here for you.
      Contact us at: support@proply.co.za
    `;

    const msg = {
      to: userData.email,
      from: {
        email: verifiedSender,
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

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
): Promise<boolean> {
  // Use APPLICATION_URL from environment or fallback to default URL
  const appUrl =
    process.env.APPLICATION_URL ||
    process.env.APP_URL ||
    "https://proply.co.za";
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
    subject: "Reset Your Proply Password",
    html,
    text,
  });
}