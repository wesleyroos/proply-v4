import sgMail from '@sendgrid/mail';

export async function sendDowngradeProcessingReport(results: Array<{
  userId: number;
  email: string;
  status: string;
  error?: string;
}>) {
  if (!results.length) return;

  const successCount = results.filter(r => r.status === 'success').length;
  const failureCount = results.filter(r => r.status === 'error').length;

  const errorDetails = results
    .filter(r => r.status === 'error')
    .map(r => `User ${r.email}: ${r.error}`)
    .join('\n');

  try {
    await sgMail.send({
      to: 'wesley@proply.co.za',
      from: 'notifications@proply.co.za',
      subject: 'Subscription Downgrade Processing Report',
      html: `
        <h2>Subscription Downgrade Processing Report</h2>
        <p>Processing Summary:</p>
        <ul>
          <li>Total processed: ${results.length}</li>
          <li>Successful: ${successCount}</li>
          <li>Failed: ${failureCount}</li>
        </ul>
        ${failureCount > 0 ? `
        <h3>Error Details:</h3>
        <pre>${errorDetails}</pre>
        ` : ''}
      `,
    });
  } catch (error) {
    console.error('Failed to send downgrade processing report:', error);
  }
}
