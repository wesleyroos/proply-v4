import { db } from "@db/index";
import { users } from "@db/schema";
import { generateMonthlyInvoice } from "./invoiceService";
import { lte } from "drizzle-orm";
import { and, eq, lt, isNotNull } from "drizzle-orm";
import fetch from "node-fetch";
import { getPayFastHeaders } from "./payfast";
import { sendDowngradeProcessingReport } from "./monitoring";
import sgMail from '@sendgrid/mail';

export async function checkAndGenerateInvoices() {
  // Get all pro users whose next billing date is today or in the past
  const usersToInvoice = await db
    .select()
    .from(users)
    .where(
      lte(users.subscriptionNextBillingDate, new Date())
    );

  for (const user of usersToInvoice) {
    await generateMonthlyInvoice(user.id);
    
    // Update next billing date
    await db
      .update(users)
      .set({
        subscriptionNextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      .where(eq(users.id, user.id));
  }
}

export async function processSubscriptionDowngrades() {
  try {
    // Find users with pending downgrades where expiry date has passed
    const usersToDowngrade = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.pendingDowngrade, true),
          lt(users.subscriptionExpiryDate, new Date()),
          isNotNull(users.payfastToken),
          eq(users.payfastSubscriptionStatus, "active")
        )
      );

    console.log(`Found ${usersToDowngrade.length} users to process downgrades for`);

    const results = [];
    for (const user of usersToDowngrade) {
      try {
        // Get PayFast headers with proper signature
        const headers = getPayFastHeaders(user.payfastToken!, "cancel");

        // Call PayFast API to cancel subscription
        const response = await fetch(
          `https://api.payfast.co.za/subscriptions/${user.payfastToken}/cancel`,
          {
            method: "PUT",
            headers,
          }
        );

        if (!response.ok) {
          throw new Error(`PayFast API error: ${response.statusText}`);
        }

        // Update user subscription status
        await db.transaction(async (tx) => {
          // Update user record
          await tx
            .update(users)
            .set({
              subscriptionStatus: "free",
              pendingDowngrade: false,
              payfastSubscriptionStatus: "cancelled",
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));
        });

        // Send confirmation email to user
        try {
          await sgMail.send({
            to: user.email,
            from: 'notifications@proply.co.za',
            subject: 'Subscription Downgrade Completed',
            html: `
              <h2>Subscription Downgrade Complete</h2>
              <p>Hello ${user.firstName || 'there'},</p>
              <p>As requested, your Pro subscription has been downgraded to the free plan.</p>
              <p>Your recurring payment has been cancelled, and no further charges will be made.</p>
              <p>You can upgrade back to Pro at any time from your account settings.</p>
              <p>Thank you for using Proply!</p>
            `,
          });
        } catch (emailError) {
          console.error('Error sending downgrade confirmation email:', emailError);
          // Don't fail the process if email fails
        }

        results.push({
          userId: user.id,
          email: user.email,
          status: "success",
        });
      } catch (error) {
        console.error(`Error processing downgrade for user ${user.id}:`, error);
        results.push({
          userId: user.id,
          email: user.email,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Send monitoring report if any users were processed
    if (results.length > 0) {
      await sendDowngradeProcessingReport(results);
    }

    return results;
  } catch (error) {
    console.error("Error in processSubscriptionDowngrades:", error);
    throw error;
  }
}