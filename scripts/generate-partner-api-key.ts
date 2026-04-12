/**
 * Generate and store an API key for a partner agency branch.
 *
 * Usage:
 *   npx tsx scripts/generate-partner-api-key.ts <branch_slug_or_id>
 *
 * Example:
 *   npx tsx scripts/generate-partner-api-key.ts prosper
 *
 * Requires:
 *   - DATABASE_URL env var
 *   - AGENCY_ENCRYPTION_KEY env var (64-char hex string)
 */

import { randomBytes } from "crypto";
import { db } from "../db";
import { agencyBranches } from "../db/schema";
import { eq, or } from "drizzle-orm";
import { encrypt } from "../server/utils/encryption";

async function main() {
  const identifier = process.argv[2];
  if (!identifier) {
    console.error("Usage: npx tsx scripts/generate-partner-api-key.ts <branch_slug_or_id>");
    process.exit(1);
  }

  // Find the branch by slug or numeric ID
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

    // List available branches
    const all = await db
      .select({ id: agencyBranches.id, slug: agencyBranches.slug, name: agencyBranches.franchiseName, branch: agencyBranches.branchName })
      .from(agencyBranches);
    console.log("\nAvailable branches:");
    for (const b of all) {
      console.log(`  id=${b.id}  slug=${b.slug}  ${b.name} — ${b.branch}`);
    }
    process.exit(1);
  }

  // Generate a 48-byte random key, base64url encoded (64 chars)
  const rawKey = randomBytes(48).toString("base64url");
  const encryptedKey = encrypt(rawKey);

  // Store the encrypted key
  await db
    .update(agencyBranches)
    .set({ partnerApiKey: encryptedKey })
    .where(eq(agencyBranches.id, branch.id));

  console.log("=".repeat(60));
  console.log(`API key generated for: ${branch.franchiseName} — ${branch.branchName}`);
  console.log(`Branch ID: ${branch.id}`);
  console.log(`Slug: ${branch.slug}`);
  console.log("=".repeat(60));
  console.log();
  console.log("API KEY (share this with the partner — it will not be shown again):");
  console.log();
  console.log(`  ${rawKey}`);
  console.log();
  console.log("=".repeat(60));
  console.log("The encrypted key has been saved to the database.");
  console.log(`Test it: curl -H "x-api-key: ${rawKey}" https://proply.co.za/api/partner/listings`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
