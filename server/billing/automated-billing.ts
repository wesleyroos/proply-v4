import cron from 'node-cron';
import { db } from '@db/index';
import { reportGenerations, agencyInvoices, transactionHistory, agencyBillingSettings, agencyBranches, agencyPaymentMethods, systemSettings } from '@db/schema';
import { sql, gte, lt, eq, and, count } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { PayFastService } from '../services/payfast';
import { sendAdminNotification } from '../services/email';

interface BillingCalculation {
  agencyId: string;
  agencyName: string;
  reportCount: number;
  amount: number;
  billingEnabled: boolean;
}

interface PayFastChargeResponse {
  code: number;
  status: string;
  data?: {
    pf_payment_id: string;
    payment_status: string;
    amount_gross: string;
  };
  message?: string;
}

// Calculate tiered billing amount
function calculateTieredBilling(reportCount: number): number {
  let amount = 0;
  let remaining = reportCount;
  
  // Tier 1: 1-50 reports at R200 each
  if (remaining > 0) {
    const tier1Count = Math.min(remaining, 50);
    amount += tier1Count * 200;
    remaining -= tier1Count;
  }
  
  // Tier 2: 51-100 reports at R180 each
  if (remaining > 0) {
    const tier2Count = Math.min(remaining, 50);
    amount += tier2Count * 180;
    remaining -= tier2Count;
  }
  
  // Tier 3: 101-150 reports at R160 each
  if (remaining > 0) {
    const tier3Count = Math.min(remaining, 50);
    amount += tier3Count * 160;
    remaining -= tier3Count;
  }
  
  // Tier 4: 151-200 reports at R140 each
  if (remaining > 0) {
    const tier4Count = Math.min(remaining, 50);
    amount += tier4Count * 140;
    remaining -= tier4Count;
  }
  
  // Tier 5: 200+ reports at R140 each
  if (remaining > 0) {
    amount += remaining * 140;
  }
  
  return amount;
}

// Get monthly usage for agencies with billing enabled
async function getMonthlyUsageByAgency(year: number, month: number): Promise<BillingCalculation[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  
  // Get usage data with billing status check
  const monthlyUsage = await db
    .select({
      agencyId: reportGenerations.agencyId,
      agencyName: reportGenerations.agencyName,
      reportCount: sql<number>`COUNT(*)::int`,
      billingEnabled: agencyBillingSettings.billingEnabled,
    })
    .from(reportGenerations)
    .leftJoin(agencyBranches, eq(reportGenerations.agencyId, agencyBranches.slug))
    .leftJoin(agencyBillingSettings, eq(agencyBranches.id, agencyBillingSettings.agencyBranchId))
    .where(
      and(
        gte(reportGenerations.timestamp, startDate),
        lt(reportGenerations.timestamp, endDate)
      )
    )
    .groupBy(reportGenerations.agencyId, reportGenerations.agencyName, agencyBillingSettings.billingEnabled);

  return monthlyUsage.map(usage => ({
    agencyId: usage.agencyId,
    agencyName: usage.agencyName,
    reportCount: usage.reportCount,
    amount: calculateTieredBilling(usage.reportCount),
    billingEnabled: usage.billingEnabled || false
  }));
}

// Read PayFast test mode setting from DB
async function getIsTestMode(): Promise<boolean> {
  const [setting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, 'payfast_test_mode'))
    .limit(1);
  return setting?.value === 'true';
}

// Charge agency using stored PayFast payment method
async function chargeAgencyCard(agencyId: string, amount: number, invoiceId: string): Promise<PayFastChargeResponse> {
  try {
    console.log(`Processing PayFast charge for agency ${agencyId}: R${amount}`);
    
    // Find the agency branch to get payment method
    const agencyBranch = await db.query.agencyBranches.findFirst({
      where: eq(agencyBranches.slug, agencyId)
    });

    if (!agencyBranch) {
      throw new Error(`Agency branch not found: ${agencyId}`);
    }

    // Get payment method for this agency
    const paymentMethod = await db.query.agencyPaymentMethods.findFirst({
      where: and(
        eq(agencyPaymentMethods.agencyBranchId, agencyBranch.id),
        eq(agencyPaymentMethods.isActive, true)
      )
    });

    if (!paymentMethod) {
      throw new Error(`No active payment method found for agency: ${agencyId}`);
    }

    const isTestMode = await getIsTestMode();
    const payfast = new PayFastService(isTestMode);
    
    // Create PayFast charge request
    const chargeRequest = {
      amount: amount,
      item_name: 'Monthly Report Billing',
      item_description: `Monthly billing for ${agencyBranch.franchiseName} - ${agencyBranch.branchName}`,
      m_payment_id: invoiceId
    };

    // Execute the charge
    const response = await payfast.chargeToken(paymentMethod.payfastToken, chargeRequest);
    
    if (response.code !== 200 || response.status !== 'success') {
      throw new Error(response.message || 'PayFast charge failed');
    }

    return response;
  } catch (error) {
    console.error(`Failed to charge agency ${agencyId}:`, error);
    throw error;
  }
}

// Create invoice record
async function createInvoice(billing: BillingCalculation, month: string, year: number): Promise<string> {
  const invoiceId = `INV-${year}${month.padStart(2, '0')}-${billing.agencyId.toUpperCase()}`;
  
  await db.insert(agencyInvoices).values({
    invoiceId,
    agencyId: billing.agencyId,
    agencyName: billing.agencyName,
    month: `${year}-${month.padStart(2, '0')}`,
    year,
    reportCount: billing.reportCount,
    amount: billing.amount.toString(),
    invoiceDate: new Date().toISOString().split('T')[0],
    status: 'pending'
  });

  return invoiceId;
}

// Record transaction
async function recordTransaction(
  invoiceId: string, 
  agencyId: string, 
  amount: number, 
  payfastResponse: PayFastChargeResponse,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const transactionId = createId();
  
  await db.insert(transactionHistory).values({
    transactionId,
    invoiceId,
    agencyId,
    amount: amount.toString(),
    payfastTransactionId: payfastResponse.data?.pf_payment_id || 'unknown',
    payfastPaymentId: payfastResponse.data?.pf_payment_id || 'unknown',
    status: success ? 'completed' : 'failed',
    gatewayResponse: payfastResponse,
    errorMessage,
    processedAt: new Date(),
  });
}

// Update invoice status
async function updateInvoiceStatus(invoiceId: string, status: 'paid' | 'failed', paidAt?: Date): Promise<void> {
  await db
    .update(agencyInvoices)
    .set({
      status,
      paidAt,
      updatedAt: new Date()
    })
    .where(eq(agencyInvoices.invoiceId, invoiceId));
}

// Send billing notification emails via SendGrid
async function sendBillingNotification(agencyId: string, success: boolean, amount: number, errorMessage?: string): Promise<void> {
  const adminEmail = 'wesley@proply.co.za';

  // Look up billing contact email
  const agencyBranch = await db.query.agencyBranches.findFirst({
    where: eq(agencyBranches.slug, agencyId)
  });
  const billingSettings = agencyBranch
    ? await db.query.agencyBillingSettings.findFirst({
        where: eq(agencyBillingSettings.agencyBranchId, agencyBranch.id)
      })
    : null;
  const billingEmail = billingSettings?.billingContactEmail || null;
  const agencyDisplayName = agencyBranch
    ? `${agencyBranch.franchiseName} — ${agencyBranch.branchName}`
    : agencyId;
  const amtFormatted = `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  if (success) {
    if (billingEmail) {
      await sendAdminNotification({
        to: billingEmail,
        subject: `Proply Invoice — ${amtFormatted} charged successfully`,
        html: `<p>Hi,</p>
<p>Your monthly Proply invoice of <strong>${amtFormatted}</strong> for <em>${agencyDisplayName}</em> has been processed successfully.</p>
<p>Thank you for using Proply.</p>
<p style="color:#888;font-size:12px">This is an automated message from Proply Billing.</p>`,
        text: `Your Proply invoice of ${amtFormatted} for ${agencyDisplayName} was charged successfully.`
      });
    }
  } else {
    // Notify billing contact (if known) and admin about failure
    const failSubject = `Proply billing failed — ${amtFormatted} for ${agencyDisplayName}`;
    const failHtml = `<p>Hi,</p>
<p>We were unable to process your Proply invoice of <strong>${amtFormatted}</strong> for <em>${agencyDisplayName}</em>.</p>
${errorMessage ? `<p>Reason: ${errorMessage}</p>` : ''}
<p>Please ensure your payment method is up to date. We will retry automatically on the 4th of this month.</p>
<p style="color:#888;font-size:12px">This is an automated message from Proply Billing.</p>`;
    const failText = `Proply billing failed: ${amtFormatted} for ${agencyDisplayName}.${errorMessage ? ` Reason: ${errorMessage}` : ''} Retry will occur on the 4th.`;

    if (billingEmail) {
      await sendAdminNotification({ to: billingEmail, subject: failSubject, html: failHtml, text: failText });
    }
    // Always notify admin on failure
    await sendAdminNotification({ to: adminEmail, subject: `[Admin] ${failSubject}`, html: failHtml, text: failText });
  }

  console.log(`Billing notification sent for ${agencyId}: ${success ? 'SUCCESS' : 'FAILED'} - ${amtFormatted}`);
}

// Process monthly billing for a single agency
async function processAgencyBilling(billing: BillingCalculation, month: number, year: number): Promise<void> {
  if (billing.reportCount === 0 || billing.amount === 0) {
    console.log(`Skipping ${billing.agencyId} - no reports generated`);
    return;
  }

  if (!billing.billingEnabled) {
    console.log(`Skipping ${billing.agencyId} - billing not enabled for this agency`);
    return;
  }

  try {
    console.log(`Processing billing for ${billing.agencyId}: ${billing.reportCount} reports, R${billing.amount}`);
    
    // Create invoice
    const invoiceId = await createInvoice(billing, month.toString(), year);
    
    // Charge the card
    const payfastResponse = await chargeAgencyCard(billing.agencyId, billing.amount, invoiceId);
    
    const success = payfastResponse.code === 200 && payfastResponse.status === 'success';
    
    // Record transaction
    await recordTransaction(
      invoiceId,
      billing.agencyId,
      billing.amount,
      payfastResponse,
      success,
      payfastResponse.message
    );
    
    // Update invoice status
    await updateInvoiceStatus(
      invoiceId,
      success ? 'paid' : 'failed',
      success ? new Date() : undefined
    );
    
    // Send notification
    await sendBillingNotification(
      billing.agencyId,
      success,
      billing.amount,
      payfastResponse.message
    );
    
    console.log(`Billing completed for ${billing.agencyId}: ${success ? 'SUCCESS' : 'FAILED'}`);
    
  } catch (error) {
    console.error(`Billing failed for ${billing.agencyId}:`, error);
    
    // Record failed transaction if invoice was created
    try {
      const invoiceId = `INV-${year}${month.toString().padStart(2, '0')}-${billing.agencyId.toUpperCase()}`;
      await recordTransaction(
        invoiceId,
        billing.agencyId,
        billing.amount,
        { code: 500, status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      await updateInvoiceStatus(invoiceId, 'failed');
      await sendBillingNotification(billing.agencyId, false, billing.amount, error instanceof Error ? error.message : 'Unknown error');
    } catch (recordError) {
      console.error(`Failed to record error for ${billing.agencyId}:`, recordError);
    }
  }
}

// Main monthly billing process
export async function runMonthlyBilling(): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based, so this is the previous month
  
  console.log(`Starting monthly billing for ${year}-${(month + 1).toString().padStart(2, '0')}`);
  
  try {
    // Get all agency usage for the previous month
    const agencyBilling = await getMonthlyUsageByAgency(year, month + 1);
    
    console.log(`Found ${agencyBilling.length} agencies with usage`);
    
    const billableAgencies = agencyBilling.filter(a => a.billingEnabled);
    console.log(`${billableAgencies.length} agencies have billing enabled`);
    
    // Process each billable agency sequentially to avoid rate limiting
    for (const billing of billableAgencies) {
      await processAgencyBilling(billing, month + 1, year);
      
      // Small delay between charges to be respectful to payment processor
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Monthly billing completed successfully');
    
  } catch (error) {
    console.error('Monthly billing process failed:', error);
    throw error;
  }
}

// Retry failed invoices from the previous billing month
async function retryFailedInvoices(): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based → previous month
  const billingMonth = `${year}-${month.toString().padStart(2, '0')}`;

  console.log(`Retrying failed invoices for ${billingMonth}`);

  const adminEmail = 'wesley@proply.co.za';

  const failedInvoices = await db
    .select()
    .from(agencyInvoices)
    .where(and(eq(agencyInvoices.month, billingMonth), eq(agencyInvoices.status, 'failed')));

  console.log(`Found ${failedInvoices.length} failed invoices to retry`);

  for (const invoice of failedInvoices) {
    try {
      // Count previous failed transactions for this invoice to detect second failure
      const [{ failCount }] = await db
        .select({ failCount: count() })
        .from(transactionHistory)
        .where(and(eq(transactionHistory.invoiceId, invoice.invoiceId), eq(transactionHistory.status, 'failed')));

      if (failCount >= 2) {
        // Already failed twice — mark overdue and notify admin
        await db.update(agencyInvoices)
          .set({ status: 'overdue', updatedAt: new Date() })
          .where(eq(agencyInvoices.invoiceId, invoice.invoiceId));

        await sendAdminNotification({
          to: adminEmail,
          subject: `[Admin] Invoice ${invoice.invoiceId} marked OVERDUE`,
          html: `<p>Invoice <strong>${invoice.invoiceId}</strong> for <em>${invoice.agencyName}</em> (${invoice.month}) has been marked <strong>overdue</strong> after 2 failed charge attempts.</p><p>Amount: R${invoice.amount}</p>`,
          text: `Invoice ${invoice.invoiceId} for ${invoice.agencyName} marked overdue after 2 failed attempts. Amount: R${invoice.amount}`
        });
        console.log(`Invoice ${invoice.invoiceId} marked overdue after 2 failures`);
        continue;
      }

      const amount = parseFloat(invoice.amount);
      const payfastResponse = await chargeAgencyCard(invoice.agencyId, amount, invoice.invoiceId);
      const success = payfastResponse.code === 200 && payfastResponse.status === 'success';

      await recordTransaction(invoice.invoiceId, invoice.agencyId, amount, payfastResponse, success, payfastResponse.message);
      await updateInvoiceStatus(invoice.invoiceId, success ? 'paid' : 'failed', success ? new Date() : undefined);
      await sendBillingNotification(invoice.agencyId, success, amount, payfastResponse.message);

      console.log(`Retry for ${invoice.invoiceId}: ${success ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.error(`Retry failed for invoice ${invoice.invoiceId}:`, error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await sendAdminNotification({
        to: adminEmail,
        subject: `[Admin] Retry failed for invoice ${invoice.invoiceId}`,
        html: `<p>Retry charge for invoice <strong>${invoice.invoiceId}</strong> (${invoice.agencyName}) failed with error: ${errorMsg}</p>`,
        text: `Retry for invoice ${invoice.invoiceId} failed: ${errorMsg}`
      });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Retry run completed for ${billingMonth}`);
}

// Schedule monthly billing to run on the 1st of each month at 9:00 AM
export function startAutomatedBilling(): void {
  console.log('Starting automated billing scheduler');

  // Initial charge: 9:00 AM on the 1st of every month
  cron.schedule('0 9 1 * *', async () => {
    console.log('Automated monthly billing triggered');
    try {
      await runMonthlyBilling();
    } catch (error) {
      console.error('Automated billing failed:', error);
      await sendAdminNotification({
        to: 'wesley@proply.co.za',
        subject: '[Admin] Monthly billing process failed',
        html: `<p>The automated monthly billing process failed with error: ${error instanceof Error ? error.message : 'Unknown error'}</p>`,
        text: `Monthly billing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, { timezone: 'Africa/Johannesburg' });

  // Retry failed charges: 9:00 AM on the 4th of every month
  cron.schedule('0 9 4 * *', async () => {
    console.log('Automated billing retry triggered');
    try {
      await retryFailedInvoices();
    } catch (error) {
      console.error('Billing retry run failed:', error);
    }
  }, { timezone: 'Africa/Johannesburg' });

  console.log('Automated billing scheduler started — 1st (initial charge) and 4th (retry) of each month at 9:00 AM SAST');
}

// Manual trigger for testing
export async function triggerManualBilling(): Promise<void> {
  console.log('Manual billing triggered');
  await runMonthlyBilling();
}