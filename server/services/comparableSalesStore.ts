import { db } from "../../db";
import { comparableSales } from "../../db/schema";
import { sql } from "drizzle-orm";

function normaliseAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/\bst\b/g, "street")
    .replace(/\brd\b/g, "road")
    .replace(/\bave\b/g, "avenue")
    .replace(/\bdr\b/g, "drive")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function upsertComparableSales(
  properties: any[],
  triggeringPropertyId?: string
): Promise<void> {
  if (!properties || properties.length === 0) return;

  for (const p of properties) {
    if (!p.address || !p.salePrice || p.salePrice <= 0) continue;

    const addressNormalised = normaliseAddress(p.address);
    const saleDate = p.saleDate ? String(p.saleDate).substring(0, 10) : null;

    try {
      await db.execute(sql`
        INSERT INTO comparable_sales (
          address_normalised, address, suburb, city, erf_number,
          latitude, longitude, property_type, bedrooms, bathrooms,
          floor_size, erf_size, sale_price, price_per_sqm, sale_date,
          source, title_deed_no, seen_count, property_ids,
          first_seen_at, last_seen_at
        ) VALUES (
          ${addressNormalised},
          ${p.address},
          ${p.suburb ?? null},
          ${p.city ?? null},
          ${p.erfNumber ?? null},
          ${p.latitude ?? null},
          ${p.longitude ?? null},
          ${p.propertyType ?? null},
          ${p.bedrooms ?? null},
          ${p.bathrooms ?? null},
          ${p.size ?? p.floorSize ?? null},
          ${p.erfSize ?? null},
          ${p.salePrice},
          ${p.pricePerSqM ? Math.round(p.pricePerSqM) : null},
          ${saleDate},
          ${p.source ?? 'knowledgeFactory'},
          ${p.titleDeedNo ?? null},
          1,
          ${triggeringPropertyId ? JSON.stringify([triggeringPropertyId]) : '[]'},
          now(),
          now()
        )
        ON CONFLICT (address_normalised, sale_date, sale_price)
        DO UPDATE SET
          seen_count   = comparable_sales.seen_count + 1,
          last_seen_at = now(),
          property_ids = CASE
            WHEN ${triggeringPropertyId ?? null} IS NOT NULL
              AND NOT (comparable_sales.property_ids @> ${triggeringPropertyId ? `'"${triggeringPropertyId}"'` : "'null'"}::jsonb)
            THEN comparable_sales.property_ids || ${triggeringPropertyId ? `'"${triggeringPropertyId}"'::jsonb` : "'null'::jsonb"}
            ELSE comparable_sales.property_ids
          END,
          latitude     = COALESCE(comparable_sales.latitude,  ${p.latitude ?? null}),
          longitude    = COALESCE(comparable_sales.longitude, ${p.longitude ?? null}),
          price_per_sqm = COALESCE(comparable_sales.price_per_sqm, ${p.pricePerSqM ? Math.round(p.pricePerSqM) : null})
      `);
    } catch (err) {
      // Non-fatal — log and continue
      console.warn(`comparable_sales upsert failed for "${p.address}":`, err instanceof Error ? err.message : err);
    }
  }
}
