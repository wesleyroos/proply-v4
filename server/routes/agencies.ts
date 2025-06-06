import { Router } from "express";
import { db } from "@db";
import { propdataListings, syncTracking } from "@db/schema";
import { desc, count, eq } from "drizzle-orm";

const router = Router();

// GET /api/agencies - Get all connected agencies with their status
router.get("/agencies", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get total listings count
    const [totalListings] = await db
      .select({ count: count() })
      .from(propdataListings);

    // Get last sync info
    const [lastSync] = await db
      .select()
      .from(syncTracking)
      .orderBy(desc(syncTracking.startedAt))
      .limit(1);

    // Get recent sync history (last 5 syncs)
    const recentSyncs = await db
      .select()
      .from(syncTracking)
      .orderBy(desc(syncTracking.startedAt))
      .limit(5);

    // Currently we only have Sotheby's integrated via PropData
    // This will be expanded when we add NOX and other agencies
    const agencies = [
      {
        id: "sothebys",
        name: "Sotheby's International Realty",
        provider: "PropData",
        status: lastSync?.status === "running" ? "syncing" : 
               lastSync?.status === "completed" ? "active" : 
               lastSync?.status === "failed" ? "error" : "inactive",
        lastSync: lastSync?.completedAt || lastSync?.startedAt || null,
        totalProperties: totalListings.count,
        lastSyncResult: lastSync ? {
          newListings: lastSync.newListings || 0,
          updatedListings: lastSync.updatedListings || 0,
          errors: lastSync.errors || 0,
          errorMessage: lastSync.errorMessage
        } : null,
        autoSyncEnabled: true,
        syncFrequency: "5 minutes"
      }
    ];

    return res.json({
      agencies,
      recentSyncs: recentSyncs.map(sync => ({
        id: sync.id,
        status: sync.status,
        startedAt: sync.startedAt,
        completedAt: sync.completedAt,
        newListings: sync.newListings || 0,
        updatedListings: sync.updatedListings || 0,
        errors: sync.errors || 0,
        errorMessage: sync.errorMessage
      }))
    });
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return res.status(500).json({ error: "Failed to fetch agencies" });
  }
});

// POST /api/agencies/:agencyId/sync - Trigger sync for specific agency
router.post("/agencies/:agencyId/sync", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { agencyId } = req.params;
    const { forceFullSync = false } = req.body;

    // Currently only supporting Sotheby's (PropData)
    if (agencyId !== "sothebys") {
      return res.status(400).json({ error: "Unsupported agency" });
    }

    // Trigger the existing PropData sync
    const syncUrl = forceFullSync 
      ? "/api/propdata/listings/sync"
      : "/api/propdata/listings/quick-sync";

    // Forward the request to the existing sync endpoint
    const response = await fetch(`${req.protocol}://${req.get('host')}${syncUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || ''
      },
      body: JSON.stringify({ forceFullSync })
    });

    const result = await response.json();
    return res.json(result);
  } catch (error) {
    console.error("Error triggering agency sync:", error);
    return res.status(500).json({ error: "Failed to trigger sync" });
  }
});

export default router;