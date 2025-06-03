import { Router } from "express";
import { db } from "@db";
import { propdataListings } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import { ListingsClient } from "../services/propdata/listingsClient";
import { AgentsClient } from "../services/propdata/agentsClient";

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

    // Create listings and agents client instances
    const listingsClient = new ListingsClient();
    const agentsClient = new AgentsClient();
    
    // For incremental sync, get timestamp of most recent listing
    let options: { 
      limit: number;
      modified_since?: Date;
      listing_type?: string;
      order_by?: string;
    } = { 
      limit: pageSize,
      listing_type: 'For Sale', // Only fetch properties for sale, not rentals
      order_by: '-modified' // Order by most recently modified first (PropData uses 'modified', not 'modified_at')
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
    
    // Collect agent IDs to fetch their details
    const agentIds = new Set<number>();
    
    // Log sample of returned listings for debugging
    if (response.results.length > 0) {
      const firstListing = response.results[0];
      console.log(`Sample listing data structure:`, {
        id: firstListing.id,
        // Date fields
        created: firstListing.created,
        modified: firstListing.modified,
        modified_at: firstListing.modified_at,
        mandate_start_date: firstListing.mandate_start_date,
        // Address fields
        street_number: firstListing.street_number,
        street_name: firstListing.street_name,
        suburb: firstListing.suburb,
        city: firstListing.city,
        region: firstListing.region,
        // Price fields
        asking_price: firstListing.asking_price,
        price: firstListing.price,
        // Size fields
        building_size: firstListing.building_size,
        land_size: firstListing.land_size,
        floor_area: firstListing.floor_area,
        erf_size: firstListing.erf_size,
        // Status
        status: firstListing.status
      });
      
      // Log all available fields for complete debugging
      console.log('All available fields:', Object.keys(firstListing).sort());
    }
    
    // First pass: collect agent IDs from active listings
    for (const listing of response.results) {
      if (listing.status && listing.status.toLowerCase() === 'active') {
        // Collect primary agent ID
        if (listing.agent && typeof listing.agent === 'number') {
          agentIds.add(listing.agent);
        }
        // Collect additional agent IDs from agents array
        if (listing.agents && Array.isArray(listing.agents)) {
          listing.agents.forEach((agentId: any) => {
            if (typeof agentId === 'number') {
              agentIds.add(agentId);
            }
          });
        }
      }
    }

    // Fetch agent details for all collected IDs
    console.log(`Found ${agentIds.size} unique agents to fetch details for`);
    const agentDetails = agentIds.size > 0 ? 
      await agentsClient.fetchAgents(Array.from(agentIds)) : 
      new Map();

    // Process each listing, but only include Active properties
    for (const listing of response.results) {
      try {
        // Skip non-active properties (Archived, Sold, etc.)
        if (listing.status && listing.status.toLowerCase() !== 'active') {
          console.log(`Skipping ${listing.status} property: ${listing.id}`);
          continue;
        }

        // Extract key fields from the listing with proper PropData API field mapping
        const listingData = {
          propdataId: listing.id.toString(),
          agencyId: 1, // Default agency ID - replace with actual agency ID
          status: listing.status || "Active",
          listingData: listing, // Store full API response
          
          // Build comprehensive address from available PropData fields
          // Handle both direct fields and nested location data
          address: [
            listing.street_number,
            listing.street_name,
            // Try multiple sources for location data
            listing.suburb || listing.lightstone_data?.townName,
            listing.city || listing.lightstone_data?.township,
            listing.region || listing.lightstone_data?.province
          ].filter(Boolean).join(", "),
          
          // Use asking_price as primary, fallback to price
          price: (parseFloat(listing.asking_price || listing.price) || 0).toString(),
          propertyType: listing.property_type || "Unknown",
          bedrooms: Math.floor(parseFloat(listing.bedrooms) || 0).toString(),
          bathrooms: Math.floor(parseFloat(listing.bathrooms) || 0).toString(),
          
          // Handle parking spaces from multiple possible fields
          parkingSpaces: listing.garages ? Math.floor(parseFloat(listing.garages)) : 
                        (listing.parkings ? Math.floor(parseFloat(listing.parkings)) : null),
          
          // Handle building and land sizes from PropData API fields
          floorSize: listing.floor_size ? Math.floor(parseFloat(listing.floor_size)) : 
                    (listing.building_size ? Math.floor(parseFloat(listing.building_size)) : 
                    (listing.floor_area?.size ? Math.floor(parseFloat(listing.floor_area.size)) : 
                    (listing.floor_area ? Math.floor(parseFloat(listing.floor_area)) : null))),
          landSize: listing.erf_size ? Math.floor(parseFloat(listing.erf_size)) : 
                   (listing.land_size ? Math.floor(parseFloat(listing.land_size)) : 
                   (listing.erf_size?.size ? Math.floor(parseFloat(listing.erf_size.size)) : null)),
          
          location: {
            latitude: listing.latitude || listing.gis_data?.latitude || null,
            longitude: listing.longitude || listing.gis_data?.longitude || null,
            suburb: listing.suburb || listing.lightstone_data?.townName || null,
            city: listing.city || listing.lightstone_data?.township || null,
            province: listing.region || listing.lightstone_data?.province || null,
          },
          features: listing.tags || listing.extras || listing.features || [],
          images: listing.images?.map((img: any) => typeof img === 'string' ? img : img.url) || 
                  listing.header_images || [],
          agentId: listing.agent?.toString() || null,
          agentName: listing.agent && agentDetails.has(listing.agent) ? agentDetails.get(listing.agent)?.full_name || null : null,
          agentEmail: listing.agent && agentDetails.has(listing.agent) ? agentDetails.get(listing.agent)?.email || null : null,
          agentPhone: listing.agent && agentDetails.has(listing.agent) ? agentDetails.get(listing.agent)?.mobile || null : null,

          // Use created field for listing date (when agent uploaded)
          // Fallback to modified if created not available
          lastModified: listing.modified 
            ? new Date(listing.modified) 
            : (listing.created 
                ? new Date(listing.created)
                : new Date()),
          updatedAt: new Date(),
          listingDate: listing.created 
            ? new Date(listing.created)
            : (listing.modified 
                ? new Date(listing.modified)
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
            .values(listingData);
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