import { Router } from "express";
import { requireAuth } from "../auth";
import { db } from "../../db";
import { agencyBranches, users, propdataListings, valuationReports } from "../../db/schema";
import { eq, and, count, desc, sql } from "drizzle-orm";

const router = Router();

// Get branch metrics for branch admin dashboard
router.get("/branch/:branchId/metrics", requireAuth, async (req, res) => {
  try {
    const branchId = parseInt(req.params.branchId);
    const user = req.user;

    // Verify user has access to this branch
    if (user?.role !== 'branch_admin' || user?.branchId !== branchId) {
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Get branch info
    const [branch] = await db
      .select()
      .from(agencyBranches)
      .where(eq(agencyBranches.id, branchId));

    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }

    // Get total agents in this branch
    const [totalAgentsResult] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.branchId, branchId));

    // Get active listings count for this branch
    const [activeListingsResult] = await db
      .select({ count: count() })
      .from(propdataListings)
      .where(eq(propdataListings.branchId, branchId));

    // Get reports generated this month (mock data for now)
    const reportsGenerated = Math.floor(Math.random() * 50) + 10;
    
    // Calculate mock revenue (this would come from actual billing data)
    const monthlyRevenue = reportsGenerated * 150; // R150 per report
    
    // Mock growth calculation
    const monthlyGrowth = Math.floor(Math.random() * 20) + 5;

    const metrics = {
      totalAgents: totalAgentsResult.count,
      activeListings: activeListingsResult.count,
      reportsGenerated,
      monthlyRevenue,
      monthlyGrowth,
      branchName: branch.branchName,
    };

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching branch metrics:", error);
    res.status(500).json({ error: "Failed to fetch branch metrics" });
  }
});

// Get agent performance for branch
router.get("/branch/:branchId/agents", requireAuth, async (req, res) => {
  try {
    const branchId = parseInt(req.params.branchId);
    const user = req.user;

    // Verify user has access to this branch
    if (user?.role !== 'branch_admin' || user?.branchId !== branchId) {
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Get agents in this branch with their listing counts
    const agents = await db
      .select({
        id: users.id,
        name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        email: users.email,
        lastActivity: users.updatedAt,
        status: sql<string>`CASE WHEN ${users.updatedAt} > NOW() - INTERVAL '30 days' THEN 'active' ELSE 'inactive' END`,
      })
      .from(users)
      .where(eq(users.branchId, branchId));

    // For each agent, get their listing count and mock reports
    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        const [listingsResult] = await db
          .select({ count: count() })
          .from(propdataListings)
          .where(eq(propdataListings.agentId, agent.id.toString()));

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          listingsCount: listingsResult.count,
          reportsThisMonth: Math.floor(Math.random() * 10) + 1,
          lastActivity: agent.lastActivity.toISOString(),
          status: agent.status as 'active' | 'inactive',
        };
      })
    );

    res.json(agentPerformance);
  } catch (error) {
    console.error("Error fetching agent performance:", error);
    res.status(500).json({ error: "Failed to fetch agent performance" });
  }
});

// Get recent activity for branch
router.get("/branch/:branchId/activity", requireAuth, async (req, res) => {
  try {
    const branchId = parseInt(req.params.branchId);
    const user = req.user;

    // Verify user has access to this branch
    if (user?.role !== 'branch_admin' || user?.branchId !== branchId) {
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Get recent listings as activity
    const recentListings = await db
      .select({
        id: propdataListings.id,
        address: propdataListings.address,
        agentId: propdataListings.agentId,
        agentName: propdataListings.agentName,
        createdAt: propdataListings.createdAt,
      })
      .from(propdataListings)
      .where(eq(propdataListings.branchId, branchId))
      .orderBy(desc(propdataListings.createdAt))
      .limit(10);

    const activity = recentListings.map((listing, index) => ({
      id: listing.id,
      type: 'listing_added' as const,
      description: `New property listing added: ${listing.address}`,
      agentName: listing.agentName || 'Unknown Agent',
      timestamp: listing.createdAt.toISOString(),
      status: 'success' as const,
    }));

    res.json(activity);
  } catch (error) {
    console.error("Error fetching branch activity:", error);
    res.status(500).json({ error: "Failed to fetch branch activity" });
  }
});

// Get top listings for branch
router.get("/branch/:branchId/top-listings", requireAuth, async (req, res) => {
  try {
    const branchId = parseInt(req.params.branchId);
    const user = req.user;

    // Verify user has access to this branch
    if (user?.role !== 'branch_admin' || user?.branchId !== branchId) {
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Get top 10 highest-priced listings for this branch
    const topListings = await db
      .select({
        id: propdataListings.id,
        address: propdataListings.address,
        price: propdataListings.price,
        propertyType: propdataListings.propertyType,
        agentName: propdataListings.agentName,
        createdAt: propdataListings.createdAt,
        status: propdataListings.status,
      })
      .from(propdataListings)
      .where(eq(propdataListings.branchId, branchId))
      .orderBy(desc(propdataListings.price))
      .limit(10);

    const listings = topListings.map(listing => ({
      id: listing.id,
      address: listing.address,
      price: Number(listing.price),
      propertyType: listing.propertyType,
      agentName: listing.agentName || 'Unassigned',
      listingDate: listing.createdAt.toISOString(),
      reportGenerated: Math.random() > 0.7, // Mock report generation status
      status: listing.status,
    }));

    res.json(listings);
  } catch (error) {
    console.error("Error fetching top listings:", error);
    res.status(500).json({ error: "Failed to fetch top listings" });
  }
});

export default router;