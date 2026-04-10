/**
 * Set up billing for an agency branch.
 *
 * Usage:
 *   npx tsx scripts/setup-agency-billing.ts <branch_slug_or_id> [billing_contact_email]
 *
 * Example:
 *   npx tsx scripts/setup-agency-billing.ts prospr-real-estate james@prospr.co.za
 */

import { db } from "../db";
import { agencyBranches, agencyBillingSettings } from "../db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const identifier = process.argv[2];
  const billingEmail = process.argv[3];

  if (!identifier) {
    console.error("Usage: npx tsx scripts/setup-agency-billing.ts <branch_slug_or_id> [billing_contact_email]");
    process.exit(1);
  }

  const isNumeric = /^\d+$/.test(identifier);
  const [branch] = await db
    .select()
    .from(agencyBranches)
    .where(
      isNumeric
        ? eq(agencyBranches.id, parseInt(identifier))
        : eq(agencyBranches.slug, identifier)
    )
    .limit(1);

  if (!branch) {
    console.error(`No agency branch found with ${isNumeric ? "id" : "slug"}: ${identifier}`);
    const all = await db
      .select({ id: agencyBranches.id, slug: agencyBranches.slug, name: agencyBranches.franchiseName })
      .from(agencyBranches);
    console.log("\nAvailable branches:");
    for (const b of all) console.log(`  id=${b.id}  slug=${b.slug}  ${b.name}`);
    process.exit(1);
  }

  // Check if billing settings already exist
  const [existing] = await db
    .select()
    .from(agencyBillingSettings)
    .where(eq(agencyBillingSettings.agencyBranchId, branch.id))
    .limit(1);

  if (existing) {
    // Update existing settings — enable billing
    await db
      .update(agencyBillingSettings)
      .set({
        billingEnabled: true,
        billingContactEmail: billingEmail || existing.billingContactEmail,
        updatedAt: new Date(),
      })
      .where(eq(agencyBillingSettings.id, existing.id));

    console.log(`Updated billing settings for ${branch.franchiseName} — ${branch.branchName}`);
    console.log(`  Billing: ENABLED`);
    console.log(`  Price per report: R${existing.pricePerReport}`);
    console.log(`  Billing day: ${existing.billingDay}st of month`);
    console.log(`  Contact email: ${billingEmail || existing.billingContactEmail || "not set"}`);
  } else {
    // Create new billing settings
    await db.insert(agencyBillingSettings).values({
      agencyBranchId: branch.id,
      billingEnabled: true,
      pricePerReport: "200.00",
      billingContactEmail: billingEmail || null,
      billingDay: 1,
      autoBilling: true,
    });

    console.log(`Created billing settings for ${branch.franchiseName} — ${branch.branchName}`);
    console.log(`  Billing: ENABLED`);
    console.log(`  Price per report: R200.00 (tiered: R200/R180/R160/R140)`);
    console.log(`  Billing day: 1st of month`);
    console.log(`  Contact email: ${billingEmail || "not set"}`);
  }

  console.log("\nBilling is now active. Reports generated via the Partner API will be tracked and billed monthly.");
  console.log("\nNote: A PayFast payment method must be tokenized before auto-charging will work.");
  console.log("Use the admin panel or POST /api/payfast/create-tokenize-url to set up card payment.");

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
