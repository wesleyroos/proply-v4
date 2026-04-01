import { Router } from "express";
import { requireAuth } from "../auth";
import { db } from "../../db";
import { agencyBranches } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

// Helper: get all branch IDs belonging to the same franchise as the given branchId
async function getFranchiseBranchIds(franchiseId: number): Promise<number[]> {
  const result = await db.execute(sql`
    SELECT id FROM agency_branches
    WHERE slug = (SELECT slug FROM agency_branches WHERE id = ${franchiseId})
  `);
  return result.rows.map((r: any) => r.id as number);
}

// GET /api/franchise/:franchiseId/metrics
router.get("/:franchiseId/metrics", requireAuth, async (req, res) => {
  try {
    const franchiseId = parseInt(req.params.franchiseId);
    const user = req.user as any;
    if (user?.role !== "franchise_admin" || user?.franchiseId !== franchiseId) {
      if (!user?.isAdmin) return res.status(403).json({ error: "Access denied" });
    }

    const branchIds = await getFranchiseBranchIds(franchiseId);
    if (!branchIds.length) return res.status(404).json({ error: "Franchise not found" });
    const branchIdList = branchIds.join(",");

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [listingsRow, reportsRow, reportsThisMonthRow, coverageRow] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*) as total,
               COUNT(CASE WHEN status = 'Active' THEN 1 END) as active
        FROM propdata_listings
        WHERE branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
      `),
      db.execute(sql`
        SELECT COUNT(DISTINCT vr.id) as total
        FROM valuation_reports vr
        WHERE vr.property_id IN (
          SELECT propdata_id FROM propdata_listings
          WHERE branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
        )
      `),
      db.execute(sql`
        SELECT COUNT(DISTINCT vr.id) as total
        FROM valuation_reports vr
        WHERE vr.property_id IN (
          SELECT propdata_id FROM propdata_listings
          WHERE branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
        )
        AND vr.created_at >= ${startOfMonth}
      `),
      db.execute(sql`
        SELECT COUNT(DISTINCT pl.propdata_id) as with_report
        FROM propdata_listings pl
        WHERE pl.branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
          AND pl.status = 'Active'
          AND EXISTS (
            SELECT 1 FROM valuation_reports vr WHERE vr.property_id = pl.propdata_id
          )
      `),
    ]);

    const activeListings = parseInt(listingsRow.rows[0]?.active as string) || 0;
    const totalReports = parseInt(reportsRow.rows[0]?.total as string) || 0;
    const reportsThisMonth = parseInt(reportsThisMonthRow.rows[0]?.total as string) || 0;
    const withReport = parseInt(coverageRow.rows[0]?.with_report as string) || 0;
    const coveragePct = activeListings > 0 ? Math.round((withReport / activeListings) * 100) : 0;

    res.json({
      activeListings,
      totalReports,
      reportsThisMonth,
      coveragePct,
      listingsWithReport: withReport,
      listingsWithoutReport: activeListings - withReport,
    });
  } catch (error) {
    console.error("Error fetching franchise metrics:", error);
    res.status(500).json({ error: "Failed to fetch franchise metrics" });
  }
});

// GET /api/franchise/:franchiseId/listings-without-reports
router.get("/:franchiseId/listings-without-reports", requireAuth, async (req, res) => {
  try {
    const franchiseId = parseInt(req.params.franchiseId);
    const user = req.user as any;
    if (user?.role !== "franchise_admin" || user?.franchiseId !== franchiseId) {
      if (!user?.isAdmin) return res.status(403).json({ error: "Access denied" });
    }

    const branchIds = await getFranchiseBranchIds(franchiseId);
    if (!branchIds.length) return res.json([]);
    const branchIdList = branchIds.join(",");

    const rows = await db.execute(sql`
      SELECT pl.propdata_id, pl.address, pl.agent_name, pl.price, pl.property_type,
             pl.listing_date, pl.bedrooms, pl.bathrooms, pl.status
      FROM propdata_listings pl
      WHERE pl.branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
        AND pl.status = 'Active'
        AND NOT EXISTS (
          SELECT 1 FROM valuation_reports vr WHERE vr.property_id = pl.propdata_id
        )
      ORDER BY pl.listing_date DESC NULLS LAST
      LIMIT 50
    `);

    res.json(rows.rows);
  } catch (error) {
    console.error("Error fetching listings without reports:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// GET /api/franchise/:franchiseId/agent-leaderboard
router.get("/:franchiseId/agent-leaderboard", requireAuth, async (req, res) => {
  try {
    const franchiseId = parseInt(req.params.franchiseId);
    const user = req.user as any;
    if (user?.role !== "franchise_admin" || user?.franchiseId !== franchiseId) {
      if (!user?.isAdmin) return res.status(403).json({ error: "Access denied" });
    }

    const branchIds = await getFranchiseBranchIds(franchiseId);
    if (!branchIds.length) return res.json([]);
    const branchIdList = branchIds.join(",");

    const rows = await db.execute(sql`
      SELECT
        pl.agent_name,
        COUNT(DISTINCT pl.propdata_id) FILTER (WHERE pl.status = 'Active') as active_listings,
        COUNT(DISTINCT vr.id) as reports_generated,
        CASE
          WHEN COUNT(DISTINCT pl.propdata_id) FILTER (WHERE pl.status = 'Active') > 0
          THEN ROUND(
            COUNT(DISTINCT CASE WHEN vr.id IS NOT NULL AND pl.status = 'Active' THEN pl.propdata_id END)::decimal
            / COUNT(DISTINCT pl.propdata_id) FILTER (WHERE pl.status = 'Active')::decimal * 100, 0
          )
          ELSE 0
        END as coverage_pct
      FROM propdata_listings pl
      LEFT JOIN valuation_reports vr ON vr.property_id = pl.propdata_id
      WHERE pl.branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
        AND pl.agent_name IS NOT NULL AND pl.agent_name != ''
      GROUP BY pl.agent_name
      ORDER BY reports_generated DESC, active_listings DESC
      LIMIT 20
    `);

    res.json(rows.rows);
  } catch (error) {
    console.error("Error fetching agent leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch agent leaderboard" });
  }
});

// GET /api/franchise/:franchiseId/activity
router.get("/:franchiseId/activity", requireAuth, async (req, res) => {
  try {
    const franchiseId = parseInt(req.params.franchiseId);
    const user = req.user as any;
    if (user?.role !== "franchise_admin" || user?.franchiseId !== franchiseId) {
      if (!user?.isAdmin) return res.status(403).json({ error: "Access denied" });
    }

    const branchIds = await getFranchiseBranchIds(franchiseId);
    if (!branchIds.length) return res.json([]);
    const branchIdList = branchIds.join(",");

    const rows = await db.execute(sql`
      SELECT ra.id, ra.activity_type, ra.recipient_email, ra.timestamp,
             pl.address, pl.agent_name
      FROM report_activity ra
      JOIN propdata_listings pl ON pl.propdata_id = ra.property_id
      WHERE pl.branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
      ORDER BY ra.timestamp DESC
      LIMIT 20
    `);

    res.json(rows.rows);
  } catch (error) {
    console.error("Error fetching franchise activity:", error);
    res.status(500).json({ error: "Failed to fetch franchise activity" });
  }
});

// GET /api/franchise/:franchiseId/reports-per-month
router.get("/:franchiseId/reports-per-month", requireAuth, async (req, res) => {
  try {
    const franchiseId = parseInt(req.params.franchiseId);
    const user = req.user as any;
    if (user?.role !== "franchise_admin" || user?.franchiseId !== franchiseId) {
      if (!user?.isAdmin) return res.status(403).json({ error: "Access denied" });
    }

    const branchIds = await getFranchiseBranchIds(franchiseId);
    if (!branchIds.length) return res.json([]);
    const branchIdList = branchIds.join(",");

    const rows = await db.execute(sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', vr.created_at), 'Mon YYYY') as month,
        DATE_TRUNC('month', vr.created_at) as month_date,
        COUNT(*) as reports
      FROM valuation_reports vr
      WHERE vr.property_id IN (
        SELECT propdata_id FROM propdata_listings
        WHERE branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
      )
      AND vr.created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', vr.created_at)
      ORDER BY month_date ASC
    `);

    res.json(rows.rows);
  } catch (error) {
    console.error("Error fetching reports per month:", error);
    res.status(500).json({ error: "Failed to fetch reports per month" });
  }
});

export default router;
