import { db } from "../../db";
import { agencyBillingCycles, agencyBillingSettings } from "../../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Track a report generation against an agency's billing cycle.
 * Creates or increments the monthly billing cycle record.
 */
export async function trackAgencyReportUsage(
  agencyBranchId: number,
  userId: number,
  propertyAddress: string
): Promise<void> {
  try {
    const currentDate = new Date();
    const billingPeriod = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, "0")}`;

    // Get or create billing cycle for this month
    let [billingCycle] = await db
      .select()
      .from(agencyBillingCycles)
      .where(
        and(
          eq(agencyBillingCycles.agencyBranchId, agencyBranchId),
          eq(agencyBillingCycles.billingPeriod, billingPeriod)
        )
      )
      .limit(1);

    if (!billingCycle) {
      // Get billing settings for pricing
      const [settings] = await db
        .select()
        .from(agencyBillingSettings)
        .where(eq(agencyBillingSettings.agencyBranchId, agencyBranchId))
        .limit(1);

      const pricePerReport = parseFloat(settings?.pricePerReport || "200.00");

      // Create new billing cycle
      [billingCycle] = await db
        .insert(agencyBillingCycles)
        .values({
          agencyBranchId,
          billingPeriod,
          reportCount: 1,
          pricePerReport: pricePerReport.toFixed(2),
          subtotal: pricePerReport.toFixed(2),
          vatAmount: "0.00",
          totalAmount: pricePerReport.toFixed(2),
          status: "pending",
          dueDate: new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            settings?.billingDay || 1
          ),
        })
        .returning();
    } else {
      // Update existing billing cycle
      const newReportCount = (billingCycle.reportCount || 0) + 1;
      const pricePerReport = parseFloat(billingCycle.pricePerReport);
      const newSubtotal = newReportCount * pricePerReport;

      await db
        .update(agencyBillingCycles)
        .set({
          reportCount: newReportCount,
          subtotal: newSubtotal.toFixed(2),
          vatAmount: "0.00",
          totalAmount: newSubtotal.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(agencyBillingCycles.id, billingCycle.id));
    }

    console.log(`Agency billing: Tracked report usage for branch ${agencyBranchId}, period ${billingPeriod}`);
  } catch (error) {
    console.error("Error tracking agency report usage:", error);
  }
}
