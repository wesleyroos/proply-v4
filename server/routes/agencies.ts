import { Router } from "express";
import { db } from "@db";
import { propdataListings, syncTracking, agencyBranches, agencyBillingSettings, agencyPaymentMethods } from "@db/schema";
import { desc, count, eq, inArray, sql, and } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getBranchesClient } from "../services/propdata/branchesClient";
import { ProsprClient } from "../services/prospr/client";
import { autoSyncService } from "../services/autoSync";
import { encrypt } from "../utils/encryption";

const router = Router();

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'agency-logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const agencyId = req.params.agencyId;
    cb(null, `agency-${agencyId}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

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

        // Get the main branch (first one) for franchise-level data
        const mainBranch = franchise.branches[0];
        
        // Get billing settings for the main branch
        let billingSettings = null;
        let paymentMethods: any[] = [];
        if (mainBranch) {
          billingSettings = await db.query.agencyBillingSettings.findFirst({
            where: eq(agencyBillingSettings.agencyBranchId, mainBranch.id)
          });
          
          // Get active payment methods for this branch
          paymentMethods = await db
            .select()
            .from(agencyPaymentMethods)
            .where(and(
              eq(agencyPaymentMethods.agencyBranchId, mainBranch.id),
              eq(agencyPaymentMethods.isActive, true)
            ));
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
          logoUrl: mainBranch?.logoUrl || null,
          primaryColor: mainBranch?.primaryColor || null,
          productAnalyzerEnabled: mainBranch?.productAnalyzerEnabled ?? false,
          productRentCompareEnabled: mainBranch?.productRentCompareEnabled ?? false,
          franchiseName: mainBranch?.franchiseName || franchise.name,
          branchName: mainBranch?.branchName || null,
          mainBranchId: mainBranch?.id || null,
          billingEnabled: billingSettings?.billingEnabled || false,
          syncFrequency: mainBranch?.syncFrequency || franchise.syncFrequency || "5 minutes",
          autoSyncEnabled: mainBranch?.autoSyncEnabled ?? franchise.autoSyncEnabled ?? true,
          hasPaymentMethod: paymentMethods.length > 0,
          paymentMethodCount: paymentMethods.length,
          paymentMethodInfo: paymentMethods.length > 0 ? {
            cardBrand: paymentMethods[0].cardBrand,
            lastFour: paymentMethods[0].cardLastFour,
            expiryMonth: paymentMethods[0].expiryMonth,
            expiryYear: paymentMethods[0].expiryYear
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
        syncFrequency: "5 minutes",
        billingEnabled: false
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
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { agencyId } = req.params;

    // Allow system admins, or franchise/branch admins for their own agency
    if (!user.isAdmin && user.role !== 'system_admin' && user.role !== 'admin') {
      if (user.role === 'franchise_admin' || user.role === 'branch_admin') {
        const userAgencyId = user.franchiseId || user.branchId;
        const numId = parseInt(agencyId, 10);
        if (!userAgencyId || (userAgencyId !== numId && agencyId !== String(userAgencyId))) {
          return res.status(403).json({ error: "Access denied — you can only sync your own agency" });
        }
      } else {
        return res.status(403).json({ error: "Admin access required" });
      }
    }
    const { forceFullSync = false } = req.body;

    // Look up agency by slug or numeric ID
    let agency;
    const numericId = parseInt(agencyId, 10);
    if (!isNaN(numericId)) {
      const [row] = await db.select().from(agencyBranches).where(eq(agencyBranches.id, numericId)).limit(1);
      agency = row;
    } else {
      const [row] = await db.select().from(agencyBranches).where(eq(agencyBranches.slug, agencyId)).limit(1);
      agency = row;
    }

    if (!agency && agencyId !== "sothebys") {
      return res.status(404).json({ error: "Agency not found" });
    }

    if (agency?.provider === "Prospr") {
      const result = await autoSyncService.performSyncForAgency(agency.id);
      return res.json(result);
    }

    // PropData agency — use existing sync endpoints
    const syncUrl = forceFullSync
      ? "/api/propdata/listings/sync"
      : "/api/propdata/listings/quick-sync";

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

// POST /api/agencies/search-franchise - Search for franchise/agency in PropData
router.post("/agencies/search-franchise", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Agency name is required" });
    }

    // Search franchises via PropData API using authenticated client
    const client = getBranchesClient();
    const franchises = await client.searchFranchises(name);

    if (franchises.length === 0) {
      return res.status(404).json({ error: "No agency found with that name in PropData" });
    }

    // Return all matches so the user can pick the right one
    const results = await Promise.all(
      franchises.map(async (franchise) => {
        const branches = await client.getBranchesForFranchise(franchise.id);
        return {
          id: franchise.id,
          name: franchise.name,
          branches: branches.map((b) => ({
            id: b.id,
            name: b.name,
            address: b.address ?? null,
          })),
        };
      })
    );

    return res.json({ results });
  } catch (error) {
    console.error("Error searching franchise:", error);
    return res.status(500).json({
      error: "Failed to search PropData",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/agencies/list-franchises - Get all available franchises from PropData
router.get("/agencies/list-franchises", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Call PropData API to get all franchises
    const franchiseResponse = await fetch('https://staging.api-gw.propdata.net/branches/api/v1/franchises/search/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${process.env.PROPDATA_API_TOKEN}`
      },
      body: JSON.stringify({
        filters: {},
        pagination: {
          page: 1,
          page_size: 1000  // Get up to 1000 franchises
        }
      })
    });

    if (!franchiseResponse.ok) {
      throw new Error('Failed to fetch franchises from PropData API');
    }

    const franchiseData = await franchiseResponse.json();
    
    if (!franchiseData.results) {
      return res.json({ franchises: [] });
    }

    // Get branch counts for each franchise
    const franchisesWithBranchCounts = await Promise.all(
      franchiseData.results.map(async (franchise: any) => {
        try {
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

          const branchesData = await branchesResponse.json();
          return {
            id: franchise.id,
            name: franchise.name,
            branchCount: branchesData.results ? branchesData.results.length : 0
          };
        } catch (error) {
          return {
            id: franchise.id,
            name: franchise.name,
            branchCount: 0
          };
        }
      })
    );

    // Sort by name
    franchisesWithBranchCounts.sort((a, b) => a.name.localeCompare(b.name));

    return res.json({
      franchises: franchisesWithBranchCounts,
      total: franchisesWithBranchCounts.length
    });
  } catch (error) {
    console.error("Error fetching franchises:", error);
    return res.status(500).json({ 
      error: "Failed to fetch franchises", 
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

    const { propdataKey, branchName, franchiseName } = req.body;

    if (!propdataKey?.trim() || !branchName?.trim()) {
      return res.status(400).json({ error: "PropData key and branch name are required" });
    }

    const effectiveFranchiseName = franchiseName?.trim() || branchName.trim();

    // Generate slug from franchise name
    const slug = effectiveFranchiseName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // Check for duplicate branch ID
    const existingByKey = await db
      .select()
      .from(agencyBranches)
      .where(eq(agencyBranches.propdataBranchId, propdataKey.trim()))
      .limit(1);

    if (existingByKey.length > 0) {
      return res.status(400).json({ error: "An agency with this PropData key is already integrated" });
    }

    await db.insert(agencyBranches).values({
      franchiseName: effectiveFranchiseName,
      slug,
      branchName: branchName.trim(),
      propdataFranchiseId: slug,
      propdataBranchId: propdataKey.trim(),
      provider: 'PropData',
      status: 'active',
      autoSyncEnabled: true,
      syncFrequency: '5 minutes',
    });

    return res.json({
      success: true,
      franchiseName: effectiveFranchiseName,
      message: `Successfully integrated ${effectiveFranchiseName}`
    });
  } catch (error) {
    console.error("Error adding agency integration:", error);
    return res.status(500).json({
      error: "Failed to add agency integration",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /api/agencies/add-direct-integration - Add a direct (non-PropData) agency integration
router.post("/agencies/add-direct-integration", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { provider, agencyName, branchName, apiKey, apiBaseUrl } = req.body;

    if (!provider?.trim() || !agencyName?.trim() || !branchName?.trim() || !apiKey?.trim()) {
      return res.status(400).json({ error: "provider, agencyName, branchName, and apiKey are required" });
    }

    if (provider !== "Prospr") {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    // Validate the API key
    const prosprClient = new ProsprClient(apiKey.trim(), apiBaseUrl?.trim() || undefined);
    const { valid, error: validationError } = await prosprClient.validateApiKey();
    if (!valid) {
      return res.status(400).json({ error: validationError || "API key validation failed" });
    }

    const effectiveFranchiseName = agencyName.trim();
    const slug = effectiveFranchiseName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // Check for duplicate slug
    const [existingBySlug] = await db.select().from(agencyBranches).where(eq(agencyBranches.slug, slug)).limit(1);
    if (existingBySlug) {
      return res.status(400).json({ error: "An agency with this name is already integrated" });
    }

    const encryptedKey = encrypt(apiKey.trim());

    await db.insert(agencyBranches).values({
      franchiseName: effectiveFranchiseName,
      slug,
      branchName: branchName.trim(),
      propdataFranchiseId: null,
      propdataBranchId: null,
      provider: "Prospr",
      status: "active",
      autoSyncEnabled: true,
      syncFrequency: "5 minutes",
      apiKey: encryptedKey,
      apiBaseUrl: apiBaseUrl?.trim() || null,
    });

    // Trigger an initial sync in the background
    const [newAgency] = await db.select().from(agencyBranches).where(eq(agencyBranches.slug, slug)).limit(1);
    if (newAgency) {
      autoSyncService.performSyncForAgency(newAgency.id).catch((err) => {
        console.error(`Initial sync failed for ${effectiveFranchiseName}:`, err);
      });
    }

    return res.json({
      success: true,
      franchiseName: effectiveFranchiseName,
      message: `Successfully integrated ${effectiveFranchiseName} via ${provider}`,
    });
  } catch (error) {
    console.error("Error adding direct integration:", error);
    return res.status(500).json({
      error: "Failed to add direct integration",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/agencies/:agencyId/upload-logo - Upload agency logo
router.post("/agencies/:agencyId/upload-logo", upload.single('logo'), async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const agencyId = parseInt(req.params.agencyId);
    if (isNaN(agencyId)) {
      return res.status(400).json({ error: "Invalid agency ID" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Check if agency exists
    const existingAgency = await db
      .select()
      .from(agencyBranches)
      .where(eq(agencyBranches.id, agencyId))
      .limit(1);

    if (existingAgency.length === 0) {
      // Delete uploaded file if agency doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Agency not found" });
    }

    // Remove old logo if it exists
    if (existingAgency[0].logoUrl) {
      // Handle both old and new URL formats
      const logoPath = existingAgency[0].logoUrl.startsWith('/static-assets/') 
        ? existingAgency[0].logoUrl.replace('/static-assets/', '')
        : existingAgency[0].logoUrl.replace('/', '');
      const oldLogoPath = path.join(process.cwd(), 'public', logoPath);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Update agency with new logo URL
    const logoUrl = `/static-assets/agency-logos/${req.file.filename}`;
    await db
      .update(agencyBranches)
      .set({ 
        logoUrl,
        updatedAt: new Date()
      })
      .where(eq(agencyBranches.id, agencyId));

    return res.json({
      success: true,
      logoUrl,
      message: "Logo uploaded successfully"
    });
  } catch (error) {
    console.error("Error uploading agency logo:", error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({ 
      error: "Failed to upload logo", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// DELETE /api/agencies/:agencyId/logo - Remove agency logo
router.delete("/agencies/:agencyId/logo", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const agencyId = parseInt(req.params.agencyId);
    if (isNaN(agencyId)) {
      return res.status(400).json({ error: "Invalid agency ID" });
    }

    // Get current agency
    const agency = await db
      .select()
      .from(agencyBranches)
      .where(eq(agencyBranches.id, agencyId))
      .limit(1);

    if (agency.length === 0) {
      return res.status(404).json({ error: "Agency not found" });
    }

    if (!agency[0].logoUrl) {
      return res.status(400).json({ error: "No logo to remove" });
    }

    // Delete logo file
    const logoPath = path.join(process.cwd(), 'public', agency[0].logoUrl);
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    // Update database
    await db
      .update(agencyBranches)
      .set({ 
        logoUrl: null,
        updatedAt: new Date()
      })
      .where(eq(agencyBranches.id, agencyId));

    return res.json({
      success: true,
      message: "Logo removed successfully"
    });
  } catch (error) {
    console.error("Error removing agency logo:", error);
    return res.status(500).json({ 
      error: "Failed to remove logo", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// PATCH /api/agencies/:agencyId/primary-color - Set agency brand color
router.patch("/agencies/:agencyId/primary-color", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const agencyId = parseInt(req.params.agencyId);
    if (isNaN(agencyId)) {
      return res.status(400).json({ error: "Invalid agency ID" });
    }

    const { primaryColor } = req.body;
    if (!primaryColor || typeof primaryColor !== 'string') {
      return res.status(400).json({ error: "primaryColor is required" });
    }

    // Basic hex color validation
    if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) {
      return res.status(400).json({ error: "Invalid color format. Use #RRGGBB" });
    }

    await db
      .update(agencyBranches)
      .set({ primaryColor, updatedAt: new Date() })
      .where(eq(agencyBranches.id, agencyId));

    return res.json({ success: true, primaryColor });
  } catch (error) {
    console.error("Error updating agency primary color:", error);
    return res.status(500).json({ error: "Failed to update primary color" });
  }
});

// PATCH /api/agencies/:agencyId/products - Toggle products for an agency
router.patch("/agencies/:agencyId/products", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const agencyId = parseInt(req.params.agencyId);
    if (isNaN(agencyId)) {
      return res.status(400).json({ error: "Invalid agency ID" });
    }

    const { productAnalyzerEnabled, productRentCompareEnabled } = req.body;

    await db
      .update(agencyBranches)
      .set({
        productAnalyzerEnabled: Boolean(productAnalyzerEnabled),
        productRentCompareEnabled: Boolean(productRentCompareEnabled),
        updatedAt: new Date(),
      })
      .where(eq(agencyBranches.id, agencyId));

    return res.json({ success: true, productAnalyzerEnabled, productRentCompareEnabled });
  } catch (error) {
    console.error("Error updating agency products:", error);
    return res.status(500).json({ error: "Failed to update products" });
  }
});

export default router;