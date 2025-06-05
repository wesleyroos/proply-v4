import { db } from "@db";
import { propdataListings, syncTracking } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import { ListingsClient } from "./propdata/listingsClient";
import { AgentsClient } from "./propdata/agentsClient";
import { FilesClient } from "./propdata/filesClient";

class AutoSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.startAutoSync();
  }

  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Run sync every 5 minutes (300,000 ms)
    this.syncInterval = setInterval(() => {
      this.performQuickSync();
    }, 5 * 60 * 1000);

    console.log("Auto-sync started: Quick sync will run every 5 minutes");
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("Auto-sync stopped");
    }
  }

  async performQuickSync(): Promise<{
    success: boolean;
    newListings: number;
    updatedListings: number;
    errors: number;
    message?: string;
  }> {
    if (this.isRunning) {
      console.log("Sync already running, skipping this cycle");
      return {
        success: false,
        newListings: 0,
        updatedListings: 0,
        errors: 0,
        message: "Sync already in progress"
      };
    }

    this.isRunning = true;
    
    // Create sync tracking record
    const [syncRecord] = await db
      .insert(syncTracking)
      .values({
        syncType: 'quick',
        status: 'running'
      })
      .returning({ id: syncTracking.id });

    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    try {
      console.log("Starting automated quick sync...");

      const listingsClient = new ListingsClient();
      const agentsClient = new AgentsClient();

      // Get timestamp of most recent listing for incremental sync
      const [latestListing] = await db
        .select({ lastModified: propdataListings.lastModified })
        .from(propdataListings)
        .orderBy(desc(propdataListings.lastModified))
        .limit(1);

      const options: any = {
        limit: 50, // Smaller batch for quick sync
        listing_type: 'For Sale',
        order_by: '-modified'
      };

      if (latestListing) {
        // Look for listings modified in the last hour to catch any updates
        const modifiedSince = new Date(latestListing.lastModified);
        modifiedSince.setHours(modifiedSince.getHours() - 1);
        options.modified_since = modifiedSince;
      }

      const response = await listingsClient.fetchListings(options);
      console.log(`Quick sync found ${response.results.length} listings to process`);

      // Collect agent IDs
      const agentIds = new Set<number>();
      for (const listing of response.results) {
        if (listing.agent && typeof listing.agent === 'number') {
          agentIds.add(listing.agent);
        }
      }

      // Fetch agent details
      const agentDetails = agentIds.size > 0 ? 
        await agentsClient.fetchAgents(Array.from(agentIds)) : 
        new Map();

      // Process listings
      for (const listing of response.results) {
        try {
          // Check if listing already exists
          const [existingListing] = await db
            .select({ 
              id: propdataListings.id, 
              address: propdataListings.address,
              addressManuallyEdited: propdataListings.addressManuallyEdited 
            })
            .from(propdataListings)
            .where(eq(propdataListings.propdataId, listing.id.toString()))
            .limit(1);

          // Build address from API data
          const apiAddress = [
            listing.street_number,
            listing.street_name,
            listing.suburb || listing.lightstone_data?.townName,
            listing.city || listing.lightstone_data?.township,
            listing.region || listing.lightstone_data?.province
          ].filter(Boolean).join(", ");



          const listingData = {
            propdataId: listing.id.toString(),
            agencyId: 1,
            status: listing.status || "Unknown",
            listingData: listing,
            // Preserve manually edited address, otherwise use API address
            address: existingListing?.addressManuallyEdited ? 
              existingListing.address : 
              apiAddress,
            price: (parseFloat(listing.asking_price || listing.price) || 0).toString(),
            propertyType: listing.property_type || "Unknown",
            bedrooms: Math.floor(parseFloat(listing.bedrooms) || 0).toString(),
            bathrooms: Math.floor(parseFloat(listing.bathrooms) || 0).toString(),
            parkingSpaces: listing.garages ? Math.floor(parseFloat(listing.garages)) : null,
            floorSize: listing.floor_size ? Math.floor(parseFloat(listing.floor_size)) : null,
            landSize: listing.erf_size ? Math.floor(parseFloat(listing.erf_size)) : null,
            location: {
              latitude: listing.latitude || listing.gis_data?.latitude || null,
              longitude: listing.longitude || listing.gis_data?.longitude || null,
              suburb: listing.suburb || listing.lightstone_data?.townName || null,
              city: listing.city || listing.lightstone_data?.township || null,
              province: listing.region || listing.lightstone_data?.province || null,
            },
            features: listing.tags || listing.extras || listing.features || [],
            images: [], // Will be updated with actual URLs below
            agentId: listing.agent?.toString() || null,
            agentName: listing.agent && agentDetails.has(listing.agent) ? 
              agentDetails.get(listing.agent)?.full_name || null : null,
            agentEmail: listing.managing_agent_email || 
              (listing.agent && agentDetails.has(listing.agent) ? 
                agentDetails.get(listing.agent)?.email || null : null),
            agentPhone: listing.managing_agent_telephone_number || 
              (listing.agent && agentDetails.has(listing.agent) ? 
                agentDetails.get(listing.agent)?.mobile || null : null),
            lastModified: listing.modified ? new Date(listing.modified) : new Date(),
            updatedAt: new Date(),
            listingDate: listing.created ? new Date(listing.created) : null,
          };

          // Extract and fetch image URLs
          const imageIds: number[] = [];
          if (listing.listing_images && Array.isArray(listing.listing_images)) {
            imageIds.push(...listing.listing_images);
          }
          if (listing.header_images && Array.isArray(listing.header_images)) {
            imageIds.push(...listing.header_images);
          }
          if (listing.images && Array.isArray(listing.images)) {
            listing.images.forEach((img: any) => {
              if (typeof img === 'number') {
                imageIds.push(img);
              } else if (img && typeof img === 'object' && img.id) {
                imageIds.push(img.id);
              }
            });
          }

          // Fetch actual image URLs if we have image IDs
          if (imageIds.length > 0) {
            try {
              const filesClient = new FilesClient();
              const imageDetails = await filesClient.fetchMultipleFileDetails(imageIds);
              const imageUrls = imageDetails
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map(img => img.file || img.image)
                .filter((url): url is string => Boolean(url));
              
              listingData.images = imageUrls;
              console.log(`Fetched ${imageUrls.length}/${imageIds.length} images for property ${listing.id}`);
            } catch (imageError) {
              console.error(`Failed to fetch images for property ${listing.id}:`, imageError);
              listingData.images = [];
            }
          }

          if (existingListing) {
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

      // Update sync tracking record
      await db
        .update(syncTracking)
        .set({
          status: 'completed',
          completedAt: new Date(),
          newListings: newCount,
          updatedListings: updatedCount,
          errors: errorCount
        })
        .where(eq(syncTracking.id, syncRecord.id));

      console.log(`Quick sync completed: ${newCount} new, ${updatedCount} updated, ${errorCount} errors`);

      return {
        success: true,
        newListings: newCount,
        updatedListings: updatedCount,
        errors: errorCount
      };

    } catch (error) {
      console.error("Quick sync failed:", error);
      
      // Update sync tracking record with error
      await db
        .update(syncTracking)
        .set({
          status: 'failed',
          completedAt: new Date(),
          errors: errorCount + 1,
          errorMessage: error instanceof Error ? error.message : "Unknown error"
        })
        .where(eq(syncTracking.id, syncRecord.id));

      return {
        success: false,
        newListings: newCount,
        updatedListings: updatedCount,
        errors: errorCount + 1,
        message: error instanceof Error ? error.message : "Unknown error"
      };
    } finally {
      this.isRunning = false;
    }
  }

  async getLastSyncInfo() {
    const [lastSync] = await db
      .select()
      .from(syncTracking)
      .orderBy(desc(syncTracking.startedAt))
      .limit(1);

    return lastSync;
  }
}

// Create singleton instance
export const autoSyncService = new AutoSyncService();