import { Router } from "express";
import { db } from "@db";
import { propdataListings, syncTracking, agencyBranches } from "@db/schema";
import { desc, count, eq, inArray, sql } from "drizzle-orm";

const router = Router();

// GET /api/agencies - Get all connected agencies with their status
router.get("/agencies", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get all agency branches from database
    const branches = await db
      .select()
      .from(agencyBranches)
      .orderBy(agencyBranches.franchiseName);

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

    // Group branches by franchise and create agency objects
    const franchiseGroups = branches.reduce((acc, branch) => {
      if (!acc[branch.slug]) {
        acc[branch.slug] = {
          id: branch.slug,
          name: branch.franchiseName,
          provider: branch.provider,
          status: branch.status,
          autoSyncEnabled: branch.autoSyncEnabled,
          syncFrequency: branch.syncFrequency,
          branches: []
        };
      }
      acc[branch.slug].branches.push(branch);
      return acc;
    }, {} as any);

    // Convert to agencies array and get property counts
    const agencies = await Promise.all(
      Object.values(franchiseGroups).map(async (franchise: any) => {
        // Get property count for this franchise's branches
        const branchIds = franchise.branches.map((b: any) => b.id);
        
        let propertyCount;
        if (branchIds.length > 0) {
          [propertyCount] = await db
            .select({ count: count() })
            .from(propdataListings)
            .where(inArray(propdataListings.branchId, branchIds));
        } else {
          propertyCount = { count: 0 };
        }

        return {
          ...franchise,
          totalProperties: propertyCount?.count || 0,
          lastSync: lastSync?.completedAt || lastSync?.startedAt || null,
          lastSyncResult: lastSync ? {
            newListings: lastSync.newListings || 0,
            updatedListings: lastSync.updatedListings || 0,
            errors: lastSync.errors || 0,
            errorMessage: lastSync.errorMessage
          } : null,
        };
      })
    );

    // If no agencies in database, show Sotheby's as legacy (for backward compatibility)
    if (agencies.length === 0) {
      const [totalListings] = await db
        .select({ count: count() })
        .from(propdataListings);

      agencies.push({
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
      });
    }

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
    const response = await fetch(`http://localhost:5000${syncUrl}`, {
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

// POST /api/agencies/search-franchise - Search for franchise in PropData
router.post("/agencies/search-franchise", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Franchise name is required" });
    }

    // Call PropData API to search for franchise
    const franchiseResponse = await fetch('https://staging.api-gw.propdata.net/branches/api/v1/franchises/search/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.PROPDATA_API_TOKEN}`
      },
      body: JSON.stringify({
        filters: {
          name__icontains: name
        }
      })
    });

    if (!franchiseResponse.ok) {
      throw new Error('Failed to search PropData API');
    }

    const franchiseData = await franchiseResponse.json();
    
    if (!franchiseData.results || franchiseData.results.length === 0) {
      return res.status(404).json({ error: "No franchise found with that name" });
    }

    // Get the first franchise match
    const franchise = franchiseData.results[0];

    // Get branches for this franchise
    const branchesResponse = await fetch('https://staging.api-gw.propdata.net/branches/api/v1/branches/search/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.PROPDATA_API_TOKEN}`
      },
      body: JSON.stringify({
        filters: {
          franchises: [franchise.id]
        }
      })
    });

    if (!branchesResponse.ok) {
      throw new Error('Failed to fetch branches from PropData API');
    }

    const branchesData = await branchesResponse.json();

    const result = {
      id: franchise.id,
      name: franchise.name,
      branches: branchesData.results.map((branch: any) => ({
        id: branch.id,
        name: branch.name,
        address: branch.address
      }))
    };

    return res.json(result);
  } catch (error) {
    console.error("Error searching franchise:", error);
    return res.status(500).json({ 
      error: "Failed to search franchise", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/agencies/add-integration - Add new agency integration
router.post("/agencies/add-integration", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id: franchiseId, name: franchiseName, branches } = req.body;
    
    if (!franchiseId || !franchiseName || !branches || !Array.isArray(branches)) {
      return res.status(400).json({ error: "Invalid franchise data" });
    }

    // Generate slug from franchise name
    const slug = franchiseName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // Check if this franchise is already integrated
    const existingBranch = await db
      .select()
      .from(agencyBranches)
      .where(eq(agencyBranches.propdataFranchiseId, franchiseId))
      .limit(1);

    if (existingBranch.length > 0) {
      return res.status(400).json({ error: "This franchise is already integrated" });
    }

    // Insert all branches
    const branchRecords = branches.map((branch: any) => ({
      franchiseName,
      slug,
      branchName: branch.name,
      propdataFranchiseId: franchiseId,
      propdataBranchId: branch.id,
      provider: 'PropData',
      status: 'active',
      autoSyncEnabled: true,
      syncFrequency: '5 minutes'
    }));

    await db.insert(agencyBranches).values(branchRecords);

    return res.json({
      success: true,
      franchiseName,
      branchCount: branches.length,
      message: `Successfully integrated ${franchiseName} with ${branches.length} branches`
    });
  } catch (error) {
    console.error("Error adding agency integration:", error);
    return res.status(500).json({ 
      error: "Failed to add agency integration", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;