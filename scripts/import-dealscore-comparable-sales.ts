/**
 * Import comparable sales from Deal Score (Neon DB) into Proply's
 * comparable_sales table (Railway DB).
 *
 * Run once:
 *   DEAL_SCORE_DB="postgresql://..." npx tsx scripts/import-dealscore-comparable-sales.ts
 *
 * Or with .env loaded:
 *   export $(grep -v '^#' .env | xargs) && DEAL_SCORE_DB="postgresql://neondb_owner:npg_vwf6AxlBoWR4@ep-autumn-forest-a5jeqdo2.us-east-2.aws.neon.tech/neondb?sslmode=require" npx tsx scripts/import-dealscore-comparable-sales.ts
 */

import pg from "pg";
import { upsertComparableSales } from "../server/services/comparableSalesStore";

const DEAL_SCORE_DB = process.env.DEAL_SCORE_DB;
if (!DEAL_SCORE_DB) {
  console.error("DEAL_SCORE_DB env var is required");
  process.exit(1);
}

async function main() {
  const client = new pg.Client({ connectionString: DEAL_SCORE_DB, ssl: { rejectUnauthorized: false } });
  await client.connect();

  console.log("Fetching Deal Score knowledge_factory_sales records…");

  const result = await client.query(`
    SELECT rs.id, rs.report_id, rs.section_data
    FROM report_sections rs
    WHERE rs.section_name = 'knowledge_factory_sales'
      AND rs.status = 'completed'
      AND rs.section_data::text LIKE '%salePrice%'
    ORDER BY rs.id
  `);

  const rows = result.rows;
  console.log(`Found ${rows.length} reports with KF comparable sales.`);

  await client.end();

  let processed = 0;
  let skipped = 0;
  let totalSales = 0;

  for (const row of rows) {
    // section_data may be stored as a JSON string or already parsed
    const data = typeof row.section_data === "string"
      ? JSON.parse(row.section_data)
      : row.section_data;

    const titleDeedProperties: any[] = data?.titleDeedProperties ?? [];

    if (titleDeedProperties.length === 0) {
      skipped++;
      continue;
    }

    // Normalise property type: Deal Score stores "Sectional Title" as full string
    // comparableSalesStore expects KF single-letter codes — keep as-is, store full string
    await upsertComparableSales(titleDeedProperties);
    processed++;
    totalSales += titleDeedProperties.length;

    if (processed % 50 === 0) {
      console.log(`  ${processed} reports processed, ${totalSales} sales upserted so far…`);
    }
  }

  console.log(
    `\nDone. Processed ${processed} reports, skipped ${skipped}, upserted ${totalSales} comparable sale records.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
