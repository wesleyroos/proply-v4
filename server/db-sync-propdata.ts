import { db } from "@db";
import { propdataListings } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import { ListingsClient } from "./services/propdata/listingsClient";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Verify required environment variables
const requiredEnvVars = [
  "PROPDATA_SERVER_URL",
  "PROPDATA_API_USERNAME",
  "PROPDATA_API_PASSWORD",
  "DATABASE_URL"
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

async function syncPropDataListings() {
  console.log("Starting PropData listings synchronization...");

  try {
    // Create listings client instance
    const listingsClient = new ListingsClient();
    
    // Get timestamp of most recent listing (for incremental sync)
    const [latestListing] = await db
      .select({ lastModified: propdataListings.lastModified })
      .from(propdataListings)
      .orderBy(desc(propdataListings.lastModified))
      .limit(1);
    
    console.log("Latest listing timestamp:", latestListing?.lastModified || "No existing listings");
    
    // If we have a latest listing, use its timestamp for modified_since
    const options = latestListing 
      ? { 
          modified_since: new Date(latestListing.lastModified),
          listing_type: 'For Sale' // Only fetch properties for sale, not rentals
        }
      : { 
          listing_type: 'For Sale' // Only fetch properties for sale, not rentals
        };
    
    // Fetch listings from PropData API
    console.log("Fetching listings from PropData API...");
    const response = await listingsClient.fetchListings(options);
    
    console.log(`Retrieved ${response.results.length} listings from PropData API`);
    
    // Track counts for response
    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each listing
    for (const listing of response.results) {
      try {
        // Extract key fields from the listing
        const listingData = {
          propdataId: listing.id.toString(),
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
          price: String(parseFloat(listing.price) || 0),
          propertyType: listing.property_type || "Unknown",
          bedrooms: String(parseFloat(listing.bedrooms) || 0),
          bathrooms: String(parseFloat(listing.bathrooms) || 0),
          parkingSpaces: listing.garages ? Math.floor(parseFloat(listing.garages)) : null,
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
          // Use mandate_start_date as the original listing date when available
          // Otherwise fall back to modified_at or current date
          lastModified: listing.mandate_start_date 
            ? new Date(listing.mandate_start_date) 
            : new Date(listing.modified_at || new Date()),
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
          console.log(`Updated listing: ${listingData.propdataId}`);
        } else {
          // Insert new listing
          await db
            .insert(propdataListings)
            .values({
              ...listingData,
              createdAt: new Date(),
            });
          newCount++;
          console.log(`Inserted new listing: ${listingData.propdataId}`);
        }
      } catch (listingError) {
        console.error(`Error processing listing ${listing.id}:`, listingError);
        errorCount++;
      }
    }

    console.log("\nSync completed successfully:");
    console.log(`- Total listings found: ${response.count}`);
    console.log(`- New listings added: ${newCount}`);
    console.log(`- Existing listings updated: ${updatedCount}`);
    console.log(`- Errors encountered: ${errorCount}`);
    
  } catch (error) {
    console.error("Error syncing PropData listings:", error);
    process.exit(1);
  }
}

// Run the sync process
syncPropDataListings()
  .then(() => {
    console.log("PropData sync completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("PropData sync failed:", error);
    process.exit(1);
  });