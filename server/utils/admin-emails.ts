import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface AdminInvitationEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token: string;
  expiresAt: Date;
  agencyName: string;
  invitedBy: string;
}

export async function sendAdminInvitationEmail(data: AdminInvitationEmailData): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured - email not sent');
    return false;
  }

  const invitationUrl = `${process.env.FRONTEND_URL || 'https://proply.co.za'}/admin/accept-invitation?token=${data.token}`;
  
  const roleDisplay = data.role === 'franchise_admin' ? 'Franchise Administrator' : 
                     data.role === 'branch_admin' ? 'Branch Administrator' : 
                     'Administrator';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Invitation - Proply</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 600;">
            Admin Invitation
          </h1>
          <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">
            Proply Property Intelligence Platform
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            Hi ${data.firstName},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            You've been invited by <strong>${data.invitedBy}</strong> to join Proply as a <strong>${roleDisplay}</strong> for <strong>${data.agencyName}</strong>.
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
            As an admin, you'll have access to advanced property analytics, rental performance insights, and comprehensive property management tools.
          </p>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${invitationUrl}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>⚠️ Important:</strong> This invitation expires on ${data.expiresAt.toLocaleDateString()} at ${data.expiresAt.toLocaleTimeString()}.
          </p>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
          <p>If you're having trouble with the button above, copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${invitationUrl}
          </p>
          <p style="margin-top: 20px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2025 Proply. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const msg = {
    to: data.email,
    from: {
      email: 'admin@proply.co.za',
      name: 'Proply Admin'
    },
    subject: `Admin Invitation - ${roleDisplay} Access`,
    html: htmlContent,
    text: `
Hi ${data.firstName},

You've been invited by ${data.invitedBy} to join Proply as a ${roleDisplay} for ${data.agencyName}.

Click this link to accept your invitation:
${invitationUrl}

This invitation expires on ${data.expiresAt.toLocaleDateString()} at ${data.expiresAt.toLocaleTimeString()}.

If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The Proply Team
    `.trim()
  };

  try {
    await sgMail.send(msg);
    console.log(`Admin invitation email sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error('Error sending admin invitation email:', error);
    return false;
  }
}