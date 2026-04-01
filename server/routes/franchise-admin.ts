import { Router } from "express";
import { requireAuth } from "../auth";
import { db } from "../../db";
import { agencyBranches, propdataListings, valuationReports } from "../../db/schema";
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

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const [agentsResult, reportsResult] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(DISTINCT agent_name) as count
        FROM propdata_listings
        WHERE branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
          AND agent_name IS NOT NULL AND agent_name != ''
      `),
      db.execute(sql`
        SELECT
          COUNT(CASE WHEN vr.created_at >= ${startOfMonth} THEN 1 END) as this_month,
          COUNT(CASE WHEN vr.created_at >= ${startOfLastMonth} AND vr.created_at < ${startOfMonth} THEN 1 END) as last_month
        FROM valuation_reports vr
        WHERE vr.property_id IN (
          SELECT propdata_id FROM propdata_listings
          WHERE branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
        )
        AND vr.created_at >= ${startOfLastMonth}
      `),
    ]);

    const reportsThisMonth = parseInt(reportsResult.rows[0]?.this_month as string) || 0;
    const reportsLastMonth = parseInt(reportsResult.rows[0]?.last_month as string) || 0;
    const monthlyGrowth = reportsLastMonth > 0
      ? Math.round(((reportsThisMonth - reportsLastMonth) / reportsLastMonth) * 100)
      : 0;

    res.json({
      totalBranches: branchIds.length,
      totalAgents: parseInt(agentsResult.rows[0]?.count as string) || 0,
      reportsGenerated: reportsThisMonth,
      totalRevenue: 0, // billing data not yet aggregated at franchise level
      monthlyGrowth,
    });
  } catch (error) {
    console.error("Error fetching franchise metrics:", error);
    res.status(500).json({ error: "Failed to fetch franchise metrics" });
  }
});

// GET /api/franchise/:franchiseId/branches
router.get("/:franchiseId/branches", requireAuth, async (req, res) => {
  try {
    const franchiseId = parseInt(req.params.franchiseId);
    const user = req.user as any;

    if (user?.role !== "franchise_admin" || user?.franchiseId !== franchiseId) {
      if (!user?.isAdmin) return res.status(403).json({ error: "Access denied" });
    }

    const branchIds = await getFranchiseBranchIds(franchiseId);
    if (!branchIds.length) return res.json([]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const branches = await Promise.all(branchIds.map(async (branchId) => {
      const [branchRow, agentsRow, reportsRow, lastActivityRow] = await Promise.all([
        db.select({ id: agencyBranches.id, branchName: agencyBranches.branchName })
          .from(agencyBranches).where(eq(agencyBranches.id, branchId)).limit(1),
        db.execute(sql`
          SELECT COUNT(DISTINCT agent_name) as count
          FROM propdata_listings
          WHERE branch_id = ${branchId} AND agent_name IS NOT NULL AND agent_name != ''
        `),
        db.execute(sql`
          SELECT COUNT(*) as count FROM valuation_reports vr
          WHERE vr.property_id IN (
            SELECT propdata_id FROM propdata_listings WHERE branch_id = ${branchId}
          ) AND vr.created_at >= ${startOfMonth}
        `),
        db.execute(sql`
          SELECT MAX(last_modified) as last_activity FROM propdata_listings
          WHERE branch_id = ${branchId}
        `),
      ]);

      const branch = branchRow[0];
      const lastActivity = lastActivityRow.rows[0]?.last_activity as string | null;
      const agentCount = parseInt(agentsRow.rows[0]?.count as string) || 0;

      return {
        id: branchId,
        branchName: branch?.branchName || `Branch ${branchId}`,
        agentCount,
        reportsThisMonth: parseInt(reportsRow.rows[0]?.count as string) || 0,
        revenue: 0,
        lastActivity: lastActivity || new Date().toISOString(),
        status: agentCount > 0 ? "active" : "inactive",
      };
    }));

    res.json(branches);
  } catch (error) {
    console.error("Error fetching franchise branches:", error);
    res.status(500).json({ error: "Failed to fetch franchise branches" });
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

    const recentListings = await db.execute(sql`
      SELECT pl.id, pl.address, pl.agent_name, pl.created_at, ab.branch_name
      FROM propdata_listings pl
      LEFT JOIN agency_branches ab ON ab.id = pl.branch_id
      WHERE pl.branch_id = ANY(ARRAY[${sql.raw(branchIdList)}]::int[])
      ORDER BY pl.created_at DESC
      LIMIT 15
    `);

    const activity = recentListings.rows.map((row: any) => ({
      id: row.id,
      type: "report_generated" as const,
      description: `Property listing: ${row.address}`,
      branchName: row.branch_name || "Unknown Branch",
      timestamp: row.created_at,
      status: "success" as const,
    }));

    res.json(activity);
  } catch (error) {
    console.error("Error fetching franchise activity:", error);
    res.status(500).json({ error: "Failed to fetch franchise activity" });
  }
});

export default router;
