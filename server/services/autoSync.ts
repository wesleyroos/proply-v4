import { db } from "@db";
import { propdataListings, syncTracking, agencyBranches } from "@db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { ListingsClient } from "./propdata/listingsClient";
import { AgentsClient } from "./propdata/agentsClient";
import { FilesClient } from "./propdata/filesClient";
import { ProsprClient } from "./prospr/client";
import { mapProsprToListing } from "./prospr/mapper";
import { decrypt } from "../utils/encryption";


class AutoSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private branchCache = new Map<string, number>(); // Cache PropData branch ID to our branch ID

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

    // Ensure the sequence is ahead of the current max id (guards against out-of-sync sequences)
    await db.execute(
      sql`SELECT setval(pg_get_serial_sequence('sync_tracking', 'id'), COALESCE((SELECT MAX(id) FROM sync_tracking), 0) + 1, false)`
    );

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



          // Map PropData branch to our agency branch (default to Sotheby's Atlantic Seaboard)
          let branchId = null;
          if (listing.branch) {
            // Look up existing branch by PropData branch ID
            const [existingBranch] = await db
              .select({ id: agencyBranches.id })
              .from(agencyBranches)
              .where(eq(agencyBranches.propdataBranchId, listing.branch.toString()))
              .limit(1);
            
            if (existingBranch) {
              branchId = existingBranch.id;
            } else {
              // Default to first Sotheby's branch if no specific branch found
              const [defaultBranch] = await db
                .select({ id: agencyBranches.id })
                .from(agencyBranches)
                .where(eq(agencyBranches.franchiseName, "Sotheby's International Realty"))
                .limit(1);
              branchId = defaultBranch?.id || null;
            }
          }

          const listingData = {
            propdataId: listing.id.toString(),
            branchId: branchId,
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
            
            // Levy fields from PropData API - using correct field names
            monthlyLevy: listing.monthly_levy && parseFloat(listing.monthly_levy) > 0 ? listing.monthly_levy : null,
            sectionalTitleLevy: listing.sectional_title_levy && parseFloat(listing.sectional_title_levy) > 0 ? listing.sectional_title_levy : null,
            specialLevy: listing.special_levy && parseFloat(listing.special_levy) > 0 ? listing.special_levy : null,
            homeOwnerLevy: listing.home_owner_levy && parseFloat(listing.home_owner_levy) > 0 ? listing.home_owner_levy : null,
            
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

      console.log(`PropData quick sync completed: ${newCount} new, ${updatedCount} updated, ${errorCount} errors`);

      // Also sync any active Prospr agencies
      try {
        const prosprResult = await this.syncProsprListings();
        newCount += prosprResult.newListings;
        updatedCount += prosprResult.updatedListings;
        errorCount += prosprResult.errors;
        if (prosprResult.newListings > 0 || prosprResult.updatedListings > 0) {
          console.log(`Prospr sync: ${prosprResult.newListings} new, ${prosprResult.updatedListings} updated, ${prosprResult.errors} errors`);
        }
      } catch (prosprErr) {
        console.error("Prospr sync failed:", prosprErr);
        errorCount++;
      }

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

  /** Sync all active Prospr agencies. Returns aggregate counts. */
  private async syncProsprListings(): Promise<{ newListings: number; updatedListings: number; errors: number }> {
    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    const prosprAgencies = await db
      .select()
      .from(agencyBranches)
      .where(and(eq(agencyBranches.provider, "Prospr"), eq(agencyBranches.status, "active"), eq(agencyBranches.autoSyncEnabled, true)));

    for (const agency of prosprAgencies) {
      if (!agency.apiKey) {
        console.warn(`Prospr agency ${agency.id} (${agency.franchiseName}) has no API key, skipping`);
        continue;
      }

      try {
        const apiKey = decrypt(agency.apiKey);
        const prosprClient = new ProsprClient(apiKey, agency.apiBaseUrl ?? undefined);

        // Get latest lastModified for this branch for incremental sync
        const [latestListing] = await db
          .select({ lastModified: propdataListings.lastModified })
          .from(propdataListings)
          .where(eq(propdataListings.branchId, agency.id))
          .orderBy(desc(propdataListings.lastModified))
          .limit(1);

        const updatedSince = latestListing
          ? new Date(new Date(latestListing.lastModified).getTime() - 60 * 60 * 1000).toISOString()
          : undefined;

        const properties = await prosprClient.fetchAllProperties(
          { updated_since: updatedSince },
          5
        );

        console.log(`Prospr sync for ${agency.franchiseName}: ${properties.length} properties`);

        for (const property of properties) {
          try {
            const [existing] = await db
              .select({ id: propdataListings.id, address: propdataListings.address, addressManuallyEdited: propdataListings.addressManuallyEdited })
              .from(propdataListings)
              .where(eq(propdataListings.propdataId, property.id))
              .limit(1);

            const listingData = mapProsprToListing(property, agency.id);

            // Preserve manually edited address
            if (existing?.addressManuallyEdited) {
              listingData.address = existing.address;
            }

            if (existing) {
              await db.update(propdataListings).set(listingData).where(eq(propdataListings.propdataId, property.id));
              updatedCount++;
            } else {
              await db.insert(propdataListings).values({ ...listingData, createdAt: new Date() });
              newCount++;
            }
          } catch (propErr) {
            console.error(`Error processing Prospr property ${property.id}:`, propErr);
            errorCount++;
          }
        }
      } catch (agencyErr) {
        console.error(`Error syncing Prospr agency ${agency.id}:`, agencyErr);
        errorCount++;
      }
    }

    return { newListings: newCount, updatedListings: updatedCount, errors: errorCount };
  }

  /** Sync a single agency by ID, dispatching to the correct provider. */
  async performSyncForAgency(agencyId: number): Promise<{ success: boolean; newListings: number; updatedListings: number; errors: number; message?: string }> {
    const [agency] = await db.select().from(agencyBranches).where(eq(agencyBranches.id, agencyId)).limit(1);
    if (!agency) {
      return { success: false, newListings: 0, updatedListings: 0, errors: 0, message: "Agency not found" };
    }

    if (agency.provider === "Prospr") {
      if (!agency.apiKey) {
        return { success: false, newListings: 0, updatedListings: 0, errors: 0, message: "Agency has no API key configured" };
      }

      const [syncRecord] = await db.insert(syncTracking).values({
        syncType: "quick",
        status: "running",
        agencyId: agency.id,
        provider: "Prospr",
      }).returning({ id: syncTracking.id });

      let newCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      try {
        const apiKey = decrypt(agency.apiKey);
        const prosprClient = new ProsprClient(apiKey, agency.apiBaseUrl ?? undefined);

        const properties = await prosprClient.fetchAllProperties({}, 10);
        console.log(`Manual Prospr sync for ${agency.franchiseName}: ${properties.length} properties`);

        for (const property of properties) {
          try {
            const [existing] = await db
              .select({ id: propdataListings.id, address: propdataListings.address, addressManuallyEdited: propdataListings.addressManuallyEdited })
              .from(propdataListings)
              .where(eq(propdataListings.propdataId, property.id))
              .limit(1);

            const listingData = mapProsprToListing(property, agency.id);
            if (existing?.addressManuallyEdited) {
              listingData.address = existing.address;
            }

            if (existing) {
              await db.update(propdataListings).set(listingData).where(eq(propdataListings.propdataId, property.id));
              updatedCount++;
            } else {
              await db.insert(propdataListings).values({ ...listingData, createdAt: new Date() });
              newCount++;
            }
          } catch (propErr) {
            console.error(`Error processing Prospr property ${property.id}:`, propErr);
            errorCount++;
          }
        }

        await db.update(syncTracking).set({ status: "completed", completedAt: new Date(), newListings: newCount, updatedListings: updatedCount, errors: errorCount }).where(eq(syncTracking.id, syncRecord.id));
        return { success: true, newListings: newCount, updatedListings: updatedCount, errors: errorCount };
      } catch (err) {
        await db.update(syncTracking).set({ status: "failed", completedAt: new Date(), errors: errorCount + 1, errorMessage: err instanceof Error ? err.message : "Unknown error" }).where(eq(syncTracking.id, syncRecord.id));
        return { success: false, newListings: newCount, updatedListings: updatedCount, errors: errorCount + 1, message: err instanceof Error ? err.message : "Unknown error" };
      }
    }

    // PropData agency — delegate to existing quick sync (which handles all PropData agencies)
    return this.performQuickSync();
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