import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface InvitationEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'franchise_admin' | 'branch_admin';
  franchiseName?: string;
  branchName?: string;
  invitationToken: string;
  expiresAt: Date;
  invitedBy: string;
}

export async function sendAdminInvitationEmail(data: InvitationEmailData): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key not configured, skipping email send');
    return;
  }

  const invitationUrl = `${process.env.VITE_APP_URL || 'http://localhost:5000'}/accept-invitation?token=${data.invitationToken}`;
  
  const roleTitle = data.role === 'franchise_admin' ? 'Franchise Administrator' : 'Branch Administrator';
  const agencyName = data.franchiseName || data.branchName || 'Unknown Agency';
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; margin-bottom: 10px;">Proply Admin Invitation</h1>
        <p style="color: #6b7280; font-size: 16px;">You've been invited to join as an administrator</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.firstName},</h2>
        <p style="color: #374151; line-height: 1.5;">
          ${data.invitedBy} has invited you to join Proply as a <strong>${roleTitle}</strong> for <strong>${agencyName}</strong>.
        </p>
        <p style="color: #374151; line-height: 1.5;">
          As a ${roleTitle.toLowerCase()}, you will have access to:
        </p>
        <ul style="color: #374151; line-height: 1.5;">
          ${data.role === 'franchise_admin' 
            ? '<li>All franchise branches and their data</li><li>User management across the franchise</li><li>Comprehensive reporting and analytics</li>'
            : '<li>Your branch\'s property listings and data</li><li>Agent and user management for your branch</li><li>Branch-specific reporting and analytics</li>'
          }
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
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
    </div>
  `;

  const msg = {
    to: data.email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@proply.co.za',
      name: 'Proply'
    },
    subject: `Invitation to join Proply as ${roleTitle}`,
    html: emailContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`Admin invitation email sent to ${data.email}`);
  } catch (error) {
    console.error('Failed to send admin invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
}

export async function sendInvitationReminderEmail(data: InvitationEmailData): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid API key not configured, skipping reminder email send');
    return;
  }

  const invitationUrl = `${process.env.VITE_APP_URL || 'http://localhost:5000'}/accept-invitation?token=${data.invitationToken}`;
  
  const roleTitle = data.role === 'franchise_admin' ? 'Franchise Administrator' : 'Branch Administrator';
  const agencyName = data.franchiseName || data.branchName || 'Unknown Agency';
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1f2937; margin-bottom: 10px;">Reminder: Proply Admin Invitation</h1>
        <p style="color: #6b7280; font-size: 16px;">Don't forget to accept your administrator invitation</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.firstName},</h2>
        <p style="color: #374151; line-height: 1.5;">
          This is a friendly reminder that you have a pending invitation to join Proply as a <strong>${roleTitle}</strong> for <strong>${agencyName}</strong>.
        </p>
        <p style="color: #374151; line-height: 1.5;">
          Your invitation is still valid and waiting for your acceptance.
        </p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invitationUrl}" 
           style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          Accept Invitation Now
        </a>
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>⚠️ Expires Soon:</strong> This invitation expires on ${data.expiresAt.toLocaleDateString()} at ${data.expiresAt.toLocaleTimeString()}.
        </p>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; color: #6b7280; font-size: 14px;">
        <p>If you're having trouble with the button above, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${invitationUrl}
        </p>
      </div>
    </div>
  `;

  const msg = {
    to: data.email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@proply.co.za',
      name: 'Proply'
    },
    subject: `Reminder: Accept your Proply ${roleTitle} invitation`,
    html: emailContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`Admin invitation reminder email sent to ${data.email}`);
  } catch (error) {
    console.error('Failed to send admin invitation reminder email:', error);
    throw new Error('Failed to send reminder email');
  }
}