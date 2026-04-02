/**
 * Backfill comparable_sales table from existing valuation_reports.
 *
 * Each valuation report stores KF title deed data in
 * comparable_sales_data->titleDeedProperties (JSONB).
 * This script reads every report that has KF data and upserts
 * it into comparable_sales via the same store function used
 * by the live deal-advisor endpoint.
 *
 * Run once:
 *   npx tsx scripts/backfill-comparable-sales.ts
 */

import { db } from "../db";
import { valuationReports } from "../db/schema";
import { isNotNull, sql } from "drizzle-orm";
import { upsertComparableSales } from "../server/services/comparableSalesStore";

async function main() {
  console.log("Fetching valuation reports with KF comparable sales data…");

  const reports = await db
    .select({
      id: valuationReports.id,
      propdataId: valuationReports.propdataId,
      comparableSalesData: valuationReports.comparableSalesData,
    })
    .from(valuationReports)
    .where(isNotNull(valuationReports.comparableSalesData));

  console.log(`Found ${reports.length} reports with comparable_sales_data.`);

  let processed = 0;
  let skipped = 0;
  let upserted = 0;

  for (const report of reports) {
    const data = report.comparableSalesData as any;
    const titleDeedProperties: any[] = data?.titleDeedProperties ?? [];

    if (titleDeedProperties.length === 0) {
      skipped++;
      continue;
    }

    // Only backfill rows sourced from Knowledge Factory
    const kfProps = titleDeedProperties.filter(
      (p: any) => !p.source || p.source === "knowledgeFactory"
    );

    if (kfProps.length === 0) {
      skipped++;
      continue;
    }

    await upsertComparableSales(kfProps, report.propdataId ?? undefined);
    upserted += kfProps.length;
    processed++;

    if (processed % 50 === 0) {
      console.log(`  processed ${processed} reports, upserted ${upserted} records so far…`);
    }
  }

  console.log(
    `Done. Processed ${processed} reports, skipped ${skipped}, upserted ${upserted} comparable sale records.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
