import { Router } from "express";
import { ListingsClient } from "../services/propdata/listingsClient";

const router = Router();

// This endpoint will fetch PropData listings directly without storing them
// Useful for development and testing when we need to bypass the database
router.get("/propdata/fetch-listings", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Parse pagination parameters
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const maxPages = req.query.maxPages ? parseInt(req.query.maxPages as string) : 3;
    
    // Create listings client instance
    const listingsClient = new ListingsClient();
    
    console.log(`Fetching PropData listings with parameters: limit=${limit}, offset=${offset}, maxPages=${maxPages}`);
    
    // Fetch multiple pages of listings from PropData API
    const options = { limit, offset };
    const response = await listingsClient.fetchMultiplePages(options, maxPages);
    
    // Transform the response for our frontend
    const listings = response.results.map(listing => {
      return {
        id: listing.id,
        propdataId: listing.id.toString(),
        status: "Active", // Default status
        address: [
          listing.street_number,
          listing.street_name,
          listing.lightstone_data?.townName,
          listing.lightstone_data?.township,
          listing.lightstone_data?.province
        ].filter(Boolean).join(", "),
        price: String(parseFloat(listing.price) || 0),
        propertyType: listing.property_type || "Unknown",
        bedrooms: String(parseFloat(listing.bedrooms) || 0),
        bathrooms: String(parseFloat(listing.bathrooms) || 0),
        parkingSpaces: listing.garages ? parseInt(listing.garages) : null,
        floorSize: listing.floor_area?.size || null,
        landSize: listing.erf_size?.size || null,
        location: {
          latitude: listing.gis_data?.latitude || null,
          longitude: listing.gis_data?.longitude || null,
          suburb: listing.lightstone_data?.townName || null,
          city: listing.lightstone_data?.township || null,
          province: listing.lightstone_data?.province || null,
        },
        images: listing.images?.map((img: any) => img.url) || [],
        agentId: listing.agent?.id?.toString() || null,
        agentPhone: listing.agent?.cell_number || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: listing.modified_at ? new Date(listing.modified_at).toISOString() : new Date().toISOString(),
      };
    });
    
    return res.json({
      total: response.count,
      results: listings,
      next: response.next,
      previous: response.previous
    });
  } catch (error) {
    console.error("Error fetching PropData listings:", error);
    return res.status(500).json({ 
      error: "Failed to fetch PropData listings", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;