import express from "express";
import { db } from "../../db";
import { comparableSales } from "../../db/schema";
import { sql, and, gte, lte, eq, ilike } from "drizzle-orm";

const router = express.Router();

function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function unslugify(slug: string): string {
  return slug.replace(/-/g, " ");
}

/**
 * GET /api/comparable-sales/suburbs
 * All suburbs with aggregate stats, grouped by city.
 */
router.get("/suburbs", async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT
        city,
        suburb,
        count(*)::int                              AS sale_count,
        round(avg(sale_price))::int                AS avg_price,
        round(avg(price_per_sqm))::int             AS avg_price_per_sqm,
        max(sale_date)                             AS latest_sale
      FROM comparable_sales
      WHERE suburb IS NOT NULL AND city IS NOT NULL
      GROUP BY city, suburb
      ORDER BY city, suburb
    `);

    const data = result.rows.map((r: any) => ({
      ...r,
      citySlug: slugify(r.city),
      suburbSlug: slugify(r.suburb),
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching suburb list:", error);
    return res.status(500).json({ success: false, error: "Unknown error" });
  }
});

/**
 * GET /api/comparable-sales/suburb/:city/:suburb
 * Aggregate stats + property type breakdown + last 20 sales for one suburb.
 */
router.get("/suburb/:city/:suburb", async (req, res) => {
  try {
    const cityName = unslugify(req.params.city);
    const suburbName = unslugify(req.params.suburb);

    const [statsResult, typesResult, salesResult] = await Promise.all([
      db.execute(sql`
        SELECT
          count(*)::int                                                          AS total_sales,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY sale_price)::int          AS median_price,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY price_per_sqm)::int       AS median_price_per_sqm,
          round(avg(floor_size))::int                                            AS avg_floor_size,
          min(sale_date)                                                         AS earliest_sale,
          max(sale_date)                                                         AS latest_sale
        FROM comparable_sales
        WHERE suburb ILIKE ${suburbName} AND city ILIKE ${cityName}
      `),
      db.execute(sql`
        SELECT
          property_type,
          count(*)::int                              AS count,
          round(avg(sale_price))::int                AS avg_price,
          round(avg(price_per_sqm))::int             AS avg_price_per_sqm
        FROM comparable_sales
        WHERE suburb ILIKE ${suburbName} AND city ILIKE ${cityName}
          AND property_type IS NOT NULL
        GROUP BY property_type
        ORDER BY count DESC
      `),
      db.execute(sql`
        SELECT id, address, suburb, city, property_type, bedrooms, floor_size,
               sale_price, price_per_sqm, sale_date
        FROM comparable_sales
        WHERE suburb ILIKE ${suburbName} AND city ILIKE ${cityName}
        ORDER BY sale_date DESC NULLS LAST
        LIMIT 20
      `),
    ]);

    const stats = statsResult.rows[0] ?? {};

    return res.json({
      success: true,
      data: {
        city: cityName,
        suburb: suburbName,
        stats,
        propertyTypes: typesResult.rows,
        recentSales: salesResult.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching suburb detail:", error);
    return res.status(500).json({ success: false, error: "Unknown error" });
  }
});

/**
 * GET /api/comparable-sales
 * Query the comparable_sales table with optional filters.
 * Query params:
 *   suburb, city, propertyType, minBeds, maxBeds, minSize, maxSize,
 *   minPrice, maxPrice, minPricePerSqm, maxPricePerSqm,
 *   fromDate, toDate (YYYY-MM-DD), page, limit
 */
router.get("/", async (req, res) => {
  try {
    const {
      suburb,
      city,
      propertyType,
      minBeds,
      maxBeds,
      minSize,
      maxSize,
      minPrice,
      maxPrice,
      minPricePerSqm,
      maxPricePerSqm,
      fromDate,
      toDate,
      page = "1",
      limit = "50",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];

    if (suburb) conditions.push(ilike(comparableSales.suburb, `%${suburb}%`));
    if (city) conditions.push(ilike(comparableSales.city, `%${city}%`));
    if (propertyType) conditions.push(eq(comparableSales.propertyType, propertyType));
    if (minBeds) conditions.push(gte(sql`${comparableSales.bedrooms}::numeric`, parseFloat(minBeds)));
    if (maxBeds) conditions.push(lte(sql`${comparableSales.bedrooms}::numeric`, parseFloat(maxBeds)));
    if (minSize) conditions.push(gte(comparableSales.floorSize, parseInt(minSize)));
    if (maxSize) conditions.push(lte(comparableSales.floorSize, parseInt(maxSize)));
    if (minPrice) conditions.push(gte(comparableSales.salePrice, parseInt(minPrice)));
    if (maxPrice) conditions.push(lte(comparableSales.salePrice, parseInt(maxPrice)));
    if (minPricePerSqm) conditions.push(gte(comparableSales.pricePerSqm, parseInt(minPricePerSqm)));
    if (maxPricePerSqm) conditions.push(lte(comparableSales.pricePerSqm, parseInt(maxPricePerSqm)));
    if (fromDate) conditions.push(gte(comparableSales.saleDate, fromDate));
    if (toDate) conditions.push(lte(comparableSales.saleDate, toDate));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(comparableSales)
        .where(where)
        .orderBy(sql`${comparableSales.saleDate} DESC NULLS LAST`)
        .limit(limitNum)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(comparableSales)
        .where(where),
    ]);

    const total = countResult[0]?.count ?? 0;

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error querying comparable sales:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/comparable-sales/stats
 * Aggregate stats: total records, distinct suburbs, date range, avg price.
 */
router.get("/stats", async (_req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT
        count(*)::int                                           AS total,
        count(DISTINCT suburb)::int                            AS suburbs,
        count(DISTINCT city)::int                              AS cities,
        min(sale_date)                                         AS earliest_sale,
        max(sale_date)                                         AS latest_sale,
        round(avg(sale_price))::int                            AS avg_price,
        round(avg(price_per_sqm))::int                         AS avg_price_per_sqm,
        min(sale_price)::int                                   AS min_price,
        max(sale_price)::int                                   AS max_price
      FROM comparable_sales
    `);
    const stats = result.rows[0] ?? {};

    return res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching comparable sales stats:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
