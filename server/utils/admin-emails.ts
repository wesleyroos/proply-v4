interface AdminInvitationEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  token: string;
  agencyName: string;
  invitedBy: string;
}

export async function sendAdminInvitationEmail(data: AdminInvitationEmailData): Promise<void> {
  const { email, firstName, lastName, role, token, agencyName, invitedBy } = data;
  
  // Determine role display name
  const roleDisplayName = role === 'franchise_admin' ? 'Franchise Administrator' : 'Branch Administrator';
  
  // Create invitation URL
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' // Replace with actual domain
    : 'http://localhost:5000';
  
  const invitationUrl = `${baseUrl}/admin-invitation/${token}`;
  
  const subject = `You're invited to join ${agencyName} as ${roleDisplayName}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Invitation - Proply</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f4f4f4; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          padding: 0; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #1E293B 0%, #334155 100%); 
          color: white; 
          padding: 30px; 
          text-align: center; 
          border-radius: 8px 8px 0 0; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .content { 
          padding: 30px; 
        }
        .content h2 { 
          color: #1E293B; 
          margin-top: 0; 
          font-size: 20px; 
        }
        .invitation-details { 
          background: #f8fafc; 
          border-left: 4px solid #1E293B; 
          padding: 20px; 
          margin: 20px 0; 
          border-radius: 0 4px 4px 0; 
        }
        .invitation-details strong { 
          color: #1E293B; 
        }
        .cta-button { 
          display: inline-block; 
          background: #1E293B; 
          color: white; 
          text-decoration: none; 
          padding: 12px 24px; 
          border-radius: 6px; 
          font-weight: 600; 
          margin: 20px 0; 
          text-align: center; 
        }
        .cta-button:hover { 
          background: #334155; 
        }
        .footer { 
          background: #f8fafc; 
          padding: 20px 30px; 
          border-radius: 0 0 8px 8px; 
          border-top: 1px solid #e2e8f0; 
          font-size: 14px; 
          color: #64748b; 
        }
        .warning { 
          background: #fef3cd; 
          border: 1px solid #fbbf24; 
          border-radius: 4px; 
          padding: 15px; 
          margin: 20px 0; 
          color: #92400e; 
        }
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .header, .content, .footer { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 Admin Invitation</h1>
          <p>Welcome to Proply's Property Intelligence Platform</p>
        </div>
        
        <div class="content">
          <h2>Hello ${firstName},</h2>
          
          <p>You've been invited by <strong>${invitedBy}</strong> to join <strong>${agencyName}</strong> as a <strong>${roleDisplayName}</strong> on the Proply platform.</p>
          
          <div class="invitation-details">
            <p><strong>Your Role:</strong> ${roleDisplayName}</p>
            <p><strong>Agency:</strong> ${agencyName}</p>
            <p><strong>Platform:</strong> Proply Property Intelligence</p>
            <p><strong>Invited By:</strong> ${invitedBy}</p>
          </div>
          
          <p>As a ${roleDisplayName}, you'll have access to:</p>
          <ul>
            <li>📊 <strong>Analytics Dashboard</strong> - Monitor property report generation and agent engagement</li>
            <li>📋 <strong>Report Management</strong> - Oversee automated property analysis reports sent to agents</li>
            <li>👥 <strong>User Oversight</strong> - Manage agent access and communication preferences</li>
            <li>💰 <strong>Billing Insights</strong> - Track usage and costs across your ${role === 'franchise_admin' ? 'franchise' : 'branch'}</li>
            <li>⚙️ <strong>Settings Control</strong> - Configure report preferences and notification settings</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" class="cta-button">Accept Invitation & Create Account</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This invitation expires in 7 days. Please accept it promptly to maintain access to your admin dashboard.
          </div>
          
          <p>If you have any questions about your role or the platform, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>
          The Proply Team</p>
        </div>
        
        <div class="footer">
          <p><strong>Need Help?</strong> Contact us at support@proply.co.za</p>
          <p>If you can't click the button above, copy and paste this link into your browser:<br>
          <code>${invitationUrl}</code></p>
          <p style="margin-top: 15px; font-size: 12px;">
            This invitation was sent to ${email}. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Hello ${firstName},

You've been invited by ${invitedBy} to join ${agencyName} as a ${roleDisplayName} on the Proply platform.

Your Role: ${roleDisplayName}
Agency: ${agencyName}
Platform: Proply Property Intelligence
Invited By: ${invitedBy}

As a ${roleDisplayName}, you'll have access to:
- Analytics Dashboard - Monitor property report generation and agent engagement
- Report Management - Oversee automated property analysis reports sent to agents
- User Oversight - Manage agent access and communication preferences
- Billing Insights - Track usage and costs across your ${role === 'franchise_admin' ? 'franchise' : 'branch'}
- Settings Control - Configure report preferences and notification settings

To accept this invitation and create your account, visit:
${invitationUrl}

⚠️ Important: This invitation expires in 7 days. Please accept it promptly to maintain access to your admin dashboard.

If you have any questions about your role or the platform, please don't hesitate to contact our support team at support@proply.co.za.

Best regards,
The Proply Team

---
This invitation was sent to ${email}. If you didn't expect this invitation, you can safely ignore this email.
  `;

  // Check if email service is configured
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email service not configured. Invitation details:');
    console.log('To:', email);
    console.log('Subject:', subject);
    console.log('Invitation URL:', invitationUrl);
    console.log('Role:', roleDisplayName);
    console.log('Agency:', agencyName);
    return;
  }

  try {
    const sgMail = (await import('@sendgrid/mail')).default;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@proply.co.za',
      subject,
      text: textContent,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log(`Admin invitation email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send admin invitation email:', error);
    throw error;
  }
}

export async function sendWelcomeEmailToAdmin(data: {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  agencyName: string;
}): Promise<void> {
  const { email, firstName, lastName, role, agencyName } = data;
  
  const roleDisplayName = role === 'franchise_admin' ? 'Franchise Administrator' : 'Branch Administrator';
  
  const subject = `Welcome to Proply, ${firstName}! Your admin account is ready`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Proply</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1E293B 0%, #334155 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .cta-button { display: inline-block; background: #1E293B; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Proply!</h1>
          <p>Your admin account is now active</p>
        </div>
        <div class="content">
          <h2>Hello ${firstName},</h2>
          <p>Congratulations! Your account has been successfully created and you now have <strong>${roleDisplayName}</strong> access for <strong>${agencyName}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:5000'}/login" class="cta-button">Access Your Dashboard</a>
          </div>
          <p>Your admin dashboard is ready and waiting for you. Start exploring your new capabilities today!</p>
          <p>Best regards,<br>The Proply Team</p>
        </div>
        <div class="footer">
          <p>Need assistance? Contact us at support@proply.co.za</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Similar email sending logic as above
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Welcome email would be sent to:', email);
    return;
  }

  try {
    const sgMail = (await import('@sendgrid/mail')).default;
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@proply.co.za',
      subject,
      html: htmlContent,
    });
    
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}