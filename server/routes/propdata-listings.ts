import { Router } from "express";
import { db } from "@db";
import { propdataListings } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import { ListingsClient } from "../services/propdata/listingsClient";

const router = Router();

// GET /api/propdata/listings - Fetch all PropData listings
router.get("/propdata/listings", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Query database for PropData listings
    const listings = await db.select().from(propdataListings).orderBy(desc(propdataListings.createdAt));
    
    return res.json(listings);
  } catch (error) {
    console.error("Error fetching PropData listings:", error);
    return res.status(500).json({ error: "Failed to fetch PropData listings" });
  }
});

// POST /api/propdata/listings/sync - Sync listings from PropData API
router.post("/propdata/listings/sync", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Parse request parameters
    const forceFullSync = req.body.forceFullSync === true;
    const maxPages = req.body.maxPages || 5; // Limit number of pages to sync (default 5)
    const pageSize = req.body.pageSize || 100; // Number of listings per page (default 100)
    
    console.log(`PropData sync requested. Force full sync: ${forceFullSync}, Max pages: ${maxPages}, Page size: ${pageSize}`);

    // Create listings client instance
    const listingsClient = new ListingsClient();
    
    // For incremental sync, get timestamp of most recent listing
    let options: { 
      limit: number;
      modified_since?: Date;
    } = { limit: pageSize };
    
    if (!forceFullSync) {
      const [latestListing] = await db
        .select({ lastModified: propdataListings.lastModified })
        .from(propdataListings)
        .orderBy(desc(propdataListings.lastModified))
        .limit(1);
      
      if (latestListing) {
        // Use modified_since for incremental sync
        const modifiedSince = new Date(latestListing.lastModified);
        console.log(`Using incremental sync with modified_since: ${modifiedSince.toISOString()}`);
        options.modified_since = modifiedSince;
      } else {
        console.log("No existing listings found. Performing initial sync.");
      }
    } else {
      console.log("Forced full sync requested. Ignoring modified_since parameter.");
    }
    
    // Fetch first page of listings from PropData API
    const response = await listingsClient.fetchListings(options);
    
    // Track counts for response
    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each listing
    for (const listing of response.results) {
      try {
        // Extract key fields from the listing
        const listingData = {
          propdataId: listing.id,
          agencyId: 1, // Default agency ID - replace with actual agency ID
          status: "Active", // Default status
          listingData: listing, // Store full API response
          address: [
            listing.street_number,
            listing.street_name,
            listing.lightstone_data?.townName,
            listing.lightstone_data?.township,
            listing.lightstone_data?.province
          ].filter(Boolean).join(", "),
          price: listing.asking_price || 0,
          propertyType: listing.category || "Unknown",
          bedrooms: parseFloat(listing.bedrooms) || 0,
          bathrooms: parseFloat(listing.bathrooms) || 0,
          parkingSpaces: listing.garages || null,
          floorSize: listing.floor_area?.size || null,
          landSize: listing.erf_size?.size || null,
          location: {
            latitude: listing.gis_data?.latitude || null,
            longitude: listing.gis_data?.longitude || null,
            suburb: listing.lightstone_data?.townName || null,
            city: listing.lightstone_data?.township || null,
            province: listing.lightstone_data?.province || null,
          },
          features: listing.features || [],
          images: listing.images?.map((img: any) => img.url) || [],
          agentId: listing.agent?.id?.toString() || null,
          agentPhone: listing.agent?.cell_number || null,
          lastModified: new Date(listing.modified_at || new Date()),
          updatedAt: new Date(),
        };

        // Check if listing already exists
        const existingListing = await db
          .select({ id: propdataListings.id })
          .from(propdataListings)
          .where(eq(propdataListings.propdataId, listingData.propdataId))
          .limit(1);

        if (existingListing.length > 0) {
          // Update existing listing
          await db
            .update(propdataListings)
            .set(listingData)
            .where(eq(propdataListings.propdataId, listingData.propdataId));
          updatedCount++;
        } else {
          // Insert new listing
          await db
            .insert(propdataListings)
            .values({
              ...listingData,
              createdAt: new Date(),
            });
          newCount++;
        }
      } catch (listingError) {
        console.error(`Error processing listing ${listing.id}:`, listingError);
        errorCount++;
      }
    }

    return res.json({
      success: true,
      message: `Sync completed: ${newCount} new listings, ${updatedCount} updated, ${errorCount} errors`,
      total: response.count,
      new: newCount,
      updated: updatedCount,
      errors: errorCount
    });
  } catch (error) {
    console.error("Error syncing PropData listings:", error);
    return res.status(500).json({ 
      error: "Failed to sync PropData listings", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;