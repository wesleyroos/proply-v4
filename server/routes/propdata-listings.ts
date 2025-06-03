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

    // Query database for PropData listings, ordered by actual listing date
    const listings = await db.select().from(propdataListings).orderBy(desc(propdataListings.listingDate));
    
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
      listing_type?: string;
      order_by?: string;
    } = { 
      limit: pageSize,
      listing_type: 'For Sale', // Only fetch properties for sale, not rentals
      order_by: '-modified_at' // Order by most recently modified first
    };
    
    if (!forceFullSync) {
      const [latestListing] = await db
        .select({ lastModified: propdataListings.lastModified })
        .from(propdataListings)
        .orderBy(desc(propdataListings.lastModified))
        .limit(1);
      
      if (latestListing) {
        // Subtract 1 hour from the latest timestamp to ensure we don't miss any listings
        // This accounts for potential timezone differences or slight timing issues
        const modifiedSince = new Date(latestListing.lastModified);
        modifiedSince.setHours(modifiedSince.getHours() - 1);
        console.log(`Using incremental sync with modified_since: ${modifiedSince.toISOString()}`);
        options.modified_since = modifiedSince;
      } else {
        console.log("No existing listings found. Performing initial sync.");
      }
    } else {
      console.log("Forced full sync requested. Ignoring modified_since parameter.");
    }
    
    // Fetch multiple pages of listings from PropData API
    console.log(`PropData API request options:`, JSON.stringify(options, null, 2));
    const response = await listingsClient.fetchMultiplePages(options, maxPages);
    
    console.log(`PropData API Response Summary:`);
    console.log(`- Total listings available: ${response.count}`);
    console.log(`- Listings returned in this batch: ${response.results.length}`);
    console.log(`- Has more pages: ${response.next ? 'Yes' : 'No'}`);
    
    // Track counts for response
    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Log sample of returned listings for debugging
    if (response.results.length > 0) {
      const firstListing = response.results[0];
      console.log(`Sample listing data:`, {
        id: firstListing.id,
        modified_at: firstListing.modified_at,
        mandate_start_date: firstListing.mandate_start_date,
        address: firstListing.street_name,
        price: firstListing.price,
        status: firstListing.status
      });
    }
    
    // Process each listing
    for (const listing of response.results) {
      try {
        // Extract key fields from the listing with proper type conversion
        const listingData = {
          propdataId: listing.id.toString(),
          agencyId: 1, // Default agency ID - replace with actual agency ID
          status: listing.status || "Active",
          listingData: listing, // Store full API response
          address: [
            listing.street_number,
            listing.street_name,
            listing.lightstone_data?.townName,
            listing.lightstone_data?.township,
            listing.lightstone_data?.province
          ].filter(Boolean).join(", "),
          price: String(parseFloat(listing.price) || 0),
          propertyType: listing.category || "Unknown",
          bedrooms: String(parseFloat(listing.bedrooms) || 0),
          bathrooms: String(parseFloat(listing.bathrooms) || 0),
          // Convert decimal string to integer for parkingSpaces
          parkingSpaces: listing.garages ? Math.floor(parseFloat(listing.garages)) : null,
          // Convert to integers for size fields
          floorSize: listing.floor_area?.size ? Math.floor(parseFloat(listing.floor_area.size)) : null,
          landSize: listing.erf_size?.size ? Math.floor(parseFloat(listing.erf_size.size)) : null,
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
          // Use modified_at as the primary timestamp for sync detection
          // This ensures we capture when listings are actually updated in PropData
          lastModified: listing.modified_at 
            ? new Date(listing.modified_at) 
            : (listing.mandate_start_date 
                ? new Date(listing.mandate_start_date)
                : new Date()),
          updatedAt: new Date(),
          // Add the actual listing date for display purposes
          listingDate: listing.mandate_start_date 
            ? new Date(listing.mandate_start_date)
            : (listing.modified_at 
                ? new Date(listing.modified_at)
                : new Date()),
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

// GET /api/propdata/listings/debug - Debug endpoint to check PropData API directly
router.get("/propdata/listings/debug", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const listingsClient = new ListingsClient();
    
    // Test different query strategies
    const results: {
      recentListings: any;
      activeListings: any;
      allListings: any;
      sampleListing: any;
    } = {
      recentListings: null,
      activeListings: null,
      allListings: null,
      sampleListing: null
    };

    try {
      // Get most recent listings (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      console.log("Fetching recent listings...");
      const recentResponse = await listingsClient.fetchListings({
        modified_since: sevenDaysAgo,
        listing_type: 'For Sale',
        limit: 10,
        order_by: '-modified_at'
      });
      results.recentListings = {
        count: recentResponse.count,
        returned: recentResponse.results.length,
        listings: recentResponse.results.map(l => ({
          id: l.id,
          modified_at: l.modified_at,
          mandate_start_date: l.mandate_start_date,
          address: l.street_name,
          price: l.price,
          status: l.status
        }))
      };
    } catch (error: any) {
      results.recentListings = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    try {
      // Get active listings
      console.log("Fetching active listings...");
      const activeResponse = await listingsClient.fetchListings({
        listing_type: 'For Sale',
        limit: 10,
        order_by: '-modified_at'
      });
      results.activeListings = {
        count: activeResponse.count,
        returned: activeResponse.results.length
      };
    } catch (error: any) {
      results.activeListings = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    try {
      // Get all listings (no filters)
      console.log("Fetching all listings...");
      const allResponse = await listingsClient.fetchListings({
        limit: 5
      });
      results.allListings = {
        count: allResponse.count,
        returned: allResponse.results.length
      };
      
      if (allResponse.results.length > 0) {
        const sample = allResponse.results[0];
        results.sampleListing = {
          fullData: sample,
          importantFields: {
            id: sample.id,
            modified_at: sample.modified_at,
            mandate_start_date: sample.mandate_start_date,
            status: sample.status,
            listing_type: sample.listing_type,
            price: sample.price,
            address: sample.street_name
          }
        };
      }
    } catch (error: any) {
      results.allListings = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return res.status(500).json({ 
      error: "Debug endpoint failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;