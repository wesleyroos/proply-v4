import cron from 'node-cron';
import { db } from '@db/index';
import { reportGenerations, agencyInvoices, transactionHistory, agencyBillingSettings, agencyBranches, agencyPaymentMethods } from '@db/schema';
import { sql, gte, lt, eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { PayFastService } from '../services/payfast';

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

    // Initialize PayFast service (default to live mode for production billing)
    const payfast = new PayFastService(false);
    
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
  yocoResponse: YocoChargeResponse,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const transactionId = createId();
  
  await db.insert(transactionHistory).values({
    transactionId,
    invoiceId,
    agencyId,
    amount: amount.toString(),
    yocoTransactionId: yocoResponse.id,
    yocoPaymentId: yocoResponse.id,
    status: success ? 'completed' : 'failed',
    gatewayResponse: yocoResponse,
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

// Send notification email (placeholder for now)
async function sendBillingNotification(agencyId: string, success: boolean, amount: number, errorMessage?: string): Promise<void> {
  console.log(`Billing notification for ${agencyId}: ${success ? 'SUCCESS' : 'FAILED'} - R${amount}${errorMessage ? ` - ${errorMessage}` : ''}`);
  // TODO: Implement actual email sending using SendGrid
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
    const yocoResponse = await chargeAgencyCard(billing.agencyId, billing.amount, invoiceId);
    
    const success = yocoResponse.status === 'successful';
    
    // Record transaction
    await recordTransaction(
      invoiceId,
      billing.agencyId,
      billing.amount,
      yocoResponse,
      success,
      yocoResponse.failure_reason
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
      yocoResponse.failure_reason
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
        { id: 'failed', status: 'failed', amount: billing.amount, currency: 'ZAR', created_date: new Date().toISOString() },
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

// Schedule monthly billing to run on the 1st of each month at 9:00 AM
export function startAutomatedBilling(): void {
  console.log('Starting automated billing scheduler');
  
  // Run at 9:00 AM on the 1st of every month
  cron.schedule('0 9 1 * *', async () => {
    console.log('Automated monthly billing triggered');
    try {
      await runMonthlyBilling();
    } catch (error) {
      console.error('Automated billing failed:', error);
      // TODO: Send alert to administrators
    }
  }, {
    timezone: 'Africa/Johannesburg'
  });
  
  console.log('Automated billing scheduler started - will run at 9:00 AM on the 1st of each month');
}

// Manual trigger for testing
export async function triggerManualBilling(): Promise<void> {
  console.log('Manual billing triggered');
  await runMonthlyBilling();
}