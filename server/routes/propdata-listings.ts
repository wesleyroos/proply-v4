import { Router } from "express";
import { db } from "@db";
import { propdataListings, syncTracking, agencyBranches, valuationReports } from "@db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { ListingsClient } from "../services/propdata/listingsClient";
import { AgentsClient } from "../services/propdata/agentsClient";
import { FilesClient } from "../services/propdata/filesClient";
import { autoSyncService } from "../services/autoSync";

const router = Router();

// GET /api/propdata/listings - Fetch PropData listings with agency-based filtering
router.get("/propdata/listings", async (req, res) => {
  try {
    // Allow system admins, franchise admins, and branch admins
    if (!req.user?.isAdmin && req.user?.role !== 'franchise_admin' && req.user?.role !== 'branch_admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Build base query
    let query = db
      .select({
        id: propdataListings.id,
        propdataId: propdataListings.propdataId,
        status: propdataListings.status,
        listingData: propdataListings.listingData,
        address: propdataListings.address,
        price: propdataListings.price,
        propertyType: propdataListings.propertyType,
        bedrooms: propdataListings.bedrooms,
        bathrooms: propdataListings.bathrooms,
        parkingSpaces: propdataListings.parkingSpaces,
        floorSize: propdataListings.floorSize,
        landSize: propdataListings.landSize,
        location: propdataListings.location,
        features: propdataListings.features,
        images: propdataListings.images,
        agentId: propdataListings.agentId,
        agentPhone: propdataListings.agentPhone,
        agentName: propdataListings.agentName,
        agentEmail: propdataListings.agentEmail,
        lastModified: propdataListings.lastModified,
        createdAt: propdataListings.createdAt,
        updatedAt: propdataListings.updatedAt,
        listingDate: propdataListings.listingDate,
        addressManuallyEdited: propdataListings.addressManuallyEdited,
        monthlyLevy: propdataListings.monthlyLevy,
        sectionalTitleLevy: propdataListings.sectionalTitleLevy,
        specialLevy: propdataListings.specialLevy,
        homeOwnerLevy: propdataListings.homeOwnerLevy,
        branchId: propdataListings.branchId,
        // Add valuation report information
        reportGenerated: valuationReports.createdAt,
        reportId: valuationReports.id,
        franchiseName: agencyBranches.franchiseName,
        branchName: agencyBranches.branchName,
      })
      .from(propdataListings)
      .leftJoin(agencyBranches, eq(propdataListings.branchId, agencyBranches.id))
      .leftJoin(valuationReports, eq(propdataListings.propdataId, valuationReports.propertyId));

    // Apply agency-based filtering based on user role
    let listings;
    if (req.user?.role === 'branch_admin' && req.user?.branchId) {
      // Branch admins see only their specific branch properties
      listings = await query
        .where(eq(propdataListings.branchId, req.user.branchId))
        .orderBy(desc(propdataListings.listingDate));
    } else if (req.user?.role === 'franchise_admin' && req.user?.franchiseId) {
      // Franchise admins see all branches within their franchise
      listings = await query
        .where(eq(agencyBranches.id, req.user.franchiseId))
        .orderBy(desc(propdataListings.listingDate));
    } else {
      // System admins see all properties, with optional agency filter
      const agencySlug = req.query.agency as string | undefined;
      if (agencySlug && agencySlug !== 'all') {
        listings = await query
          .where(eq(agencyBranches.slug, agencySlug))
          .orderBy(desc(propdataListings.listingDate));
      } else {
        listings = await query.orderBy(desc(propdataListings.listingDate));
      }
    }
    
    // Parse JSON fields in the response
    const parsedListings = listings.map((listing: any) => ({
      ...listing,
      images: typeof listing.images === 'string' ? 
        (() => {
          try {
            return JSON.parse(listing.images as string);
          } catch (e) {
            return [];
          }
        })() : 
        (listing.images || []),
      location: typeof listing.location === 'string' ? 
        (() => {
          try {
            return JSON.parse(listing.location as string);
          } catch (e) {
            return null;
          }
        })() : 
        listing.location,
      features: typeof listing.features === 'string' ? 
        (() => {
          try {
            return JSON.parse(listing.features as string);
          } catch (e) {
            return [];
          }
        })() : 
        (listing.features || [])
    }));
    
    return res.json(parsedListings);
  } catch (error) {
    console.error("Error fetching PropData listings:", error);
    return res.status(500).json({ error: "Failed to fetch PropData listings" });
  }
});

// GET /api/propdata/listings/sync-status - Get last sync information
router.get("/propdata/listings/sync-status", async (req, res) => {
  try {
    if (!req.user?.isAdmin && req.user?.role !== 'franchise_admin' && req.user?.role !== 'branch_admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const lastSync = await autoSyncService.getLastSyncInfo();
    return res.json(lastSync);
  } catch (error) {
    console.error("Error fetching sync status:", error);
    return res.status(500).json({ error: "Failed to fetch sync status" });
  }
});

// POST /api/propdata/listings/quick-sync - Trigger manual quick sync
router.post("/propdata/listings/quick-sync", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const result = await autoSyncService.performQuickSync();
    return res.json(result);
  } catch (error) {
    console.error("Error performing quick sync:", error);
    return res.status(500).json({ error: "Failed to perform quick sync" });
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

    // Create listings, agents, and files client instances
    const listingsClient = new ListingsClient();
    const agentsClient = new AgentsClient();
    const filesClient = new FilesClient();
    
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
    let processedCount = 0;
    const totalListings = response.results.length;
    
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
        status: firstListing.status,
        // Image fields
        images: firstListing.images,
        header_images: firstListing.header_images,
        listing_images: firstListing.listing_images
      });
      
      // Log image-related fields specifically
      console.log('Image fields in listing:', {
        hasImages: !!firstListing.images,
        imagesType: typeof firstListing.images,
        imagesLength: Array.isArray(firstListing.images) ? firstListing.images.length : 'not array',
        hasHeaderImages: !!firstListing.header_images,
        headerImagesType: typeof firstListing.header_images,
        headerImagesLength: Array.isArray(firstListing.header_images) ? firstListing.header_images.length : 'not array',
        hasListingImages: !!firstListing.listing_images,
        listingImagesType: typeof firstListing.listing_images,
        listingImagesLength: Array.isArray(firstListing.listing_images) ? firstListing.listing_images.length : 'not array'
      });
      
      // Log all available fields for complete debugging
      console.log('All available fields:', Object.keys(firstListing).sort());
    }
    
    // First pass: collect agent IDs from all listings
    for (const listing of response.results) {
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

    // Fetch agent details for all collected IDs
    console.log(`Found ${agentIds.size} unique agents to fetch details for`);
    const agentDetails = agentIds.size > 0 ? 
      await agentsClient.fetchAgents(Array.from(agentIds)) : 
      new Map();

    // Process each listing (all statuses)
    for (const listing of response.results) {
      try {
        // Process all property statuses to capture complete market lifecycle
        console.log(`Processing ${listing.status || 'Unknown'} property: ${listing.id}`);

        // With the expand parameter, we should now get full image objects directly
        // No need to fetch detailed listing separately since we're using expand=listing_images,header_images
        console.log(`Processing listing ${listing.id} with expanded image data...`);
        
        // Log image data structure for debugging (limit to first 5 for testing)
        if (processedCount < 5) {
          console.log(`Image fields in expanded listing ${listing.id}:`, {
            hasImages: !!listing.images,
            imagesCount: Array.isArray(listing.images) ? listing.images.length : 0,
            imagesType: typeof listing.images,
            imagesValue: listing.images,
            hasHeaderImages: !!listing.header_images,
            headerImagesCount: Array.isArray(listing.header_images) ? listing.header_images.length : 0,
            headerImagesType: typeof listing.header_images,
            headerImagesValue: listing.header_images,
            hasListingImages: !!listing.listing_images,
            listingImagesCount: Array.isArray(listing.listing_images) ? listing.listing_images.length : 0,
            listingImagesType: typeof listing.listing_images,
            listingImagesValue: listing.listing_images
          });
          
          // Log all fields to see if there are other image-related fields
          const imageRelatedFields: Record<string, any> = {};
          Object.keys(listing).forEach(key => {
            if (key.toLowerCase().includes('image') || 
                key.toLowerCase().includes('photo') || 
                key.toLowerCase().includes('picture') ||
                key.toLowerCase().includes('media') ||
                key.toLowerCase().includes('file')) {
              imageRelatedFields[key] = listing[key];
            }
          });
          console.log(`All image-related fields for listing ${listing.id}:`, imageRelatedFields);
        }
        processedCount++;

        // Log progress every 10 listings
        if (processedCount % 10 === 0 || processedCount === totalListings) {
          const progress = Math.round((processedCount / totalListings) * 100);
          console.log(`Progress: ${processedCount}/${totalListings} (${progress}%) - New: ${newCount}, Updated: ${updatedCount}, Errors: ${errorCount}`);
        }

        // Check if listing already exists and if address was manually edited
        const [existingListingCheck] = await db
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
          // Try multiple sources for location data
          listing.suburb || listing.lightstone_data?.townName,
          listing.city || listing.lightstone_data?.township,
          listing.region || listing.lightstone_data?.province
        ].filter(Boolean).join(", ");

        // Extract key fields from the listing with proper PropData API field mapping
        const listingData = {
          propdataId: listing.id.toString(),
          agencyId: 1, // Default agency ID - replace with actual agency ID
          branchId: 1, // Default to Sotheby's Atlantic Seaboard branch
          status: listing.status || "Active",
          listingData: listing, // Store full API response
          
          // Preserve manually edited address, otherwise use API address
          address: existingListingCheck?.addressManuallyEdited ? 
            existingListingCheck.address : 
            apiAddress,
          
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
          images: [] as any[], // Will be populated asynchronously after processing
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

        // Extract image IDs and fetch actual image URLs
        const imageIds: number[] = [];
        
        // Collect image IDs from various fields
        if (listing.listing_images && Array.isArray(listing.listing_images)) {
          listing.listing_images.forEach((img: any) => {
            if (typeof img === 'number') {
              imageIds.push(img);
            } else if (img && typeof img === 'object' && img.id) {
              imageIds.push(img.id);
            }
          });
        }
        
        if (listing.header_images && Array.isArray(listing.header_images)) {
          listing.header_images.forEach((img: any) => {
            if (typeof img === 'number') {
              imageIds.push(img);
            } else if (img && typeof img === 'object' && img.id) {
              imageIds.push(img.id);
            }
          });
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

        // Handle image processing for all properties
        if (imageIds.length > 0) {
          console.log(`Found ${imageIds.length} image IDs for listing ${listing.id} (${listing.created || 'unknown date'}):`, imageIds.slice(0, 5));
          try {
            const imageDetails = await filesClient.fetchMultipleFileDetails(imageIds);
            const imageUrls = imageDetails
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(img => img.file || img.image)
              .filter((url): url is string => Boolean(url));
            
            console.log(`Successfully fetched ${imageUrls.length}/${imageIds.length} image URLs for listing ${listing.id}`);
            if (imageUrls.length > 0) {
              console.log(`Sample URLs:`, imageUrls.slice(0, 2));
              listingData.images = imageUrls;
            } else {
              console.log(`No gallery images found for listing ${listing.id}, checking for direct URLs in listing data`);
              
              // Fallback: Check if listing data contains direct image URLs
              const fallbackImages: string[] = [];
              
              // Check various possible direct URL fields in the listing response
              if (listing.images && Array.isArray(listing.images)) {
                listing.images.forEach((img: any) => {
                  if (typeof img === 'string' && img.startsWith('http')) {
                    fallbackImages.push(img);
                  } else if (img && typeof img === 'object' && (img.url || img.file || img.image)) {
                    const url = img.url || img.file || img.image;
                    if (typeof url === 'string' && url.startsWith('http')) {
                      fallbackImages.push(url);
                    }
                  }
                });
              }
              
              // Check header images for direct URLs
              if (listing.header_images && Array.isArray(listing.header_images)) {
                listing.header_images.forEach((img: any) => {
                  if (typeof img === 'string' && img.startsWith('http')) {
                    fallbackImages.push(img);
                  } else if (img && typeof img === 'object' && (img.url || img.file || img.image)) {
                    const url = img.url || img.file || img.image;
                    if (typeof url === 'string' && url.startsWith('http')) {
                      fallbackImages.push(url);
                    }
                  }
                });
              }
              
              if (fallbackImages.length > 0) {
                console.log(`Found ${fallbackImages.length} direct image URLs for listing ${listing.id}`);
                listingData.images = fallbackImages;
              } else {
                listingData.images = [];
              }
            }
          } catch (error) {
            console.error(`Failed to fetch images for listing ${listing.id}:`, error);
          }
        } else {
          // No image IDs found, check for direct URLs in listing data
          const fallbackImages: string[] = [];
          
          // Check for direct image URLs in various fields
          ['images', 'header_images', 'listing_images', 'photos', 'gallery'].forEach(field => {
            if (listing[field] && Array.isArray(listing[field])) {
              listing[field].forEach((img: any) => {
                if (typeof img === 'string' && img.startsWith('http')) {
                  fallbackImages.push(img);
                } else if (img && typeof img === 'object') {
                  const url = img.url || img.file || img.image || img.src;
                  if (typeof url === 'string' && url.startsWith('http')) {
                    fallbackImages.push(url);
                  }
                }
              });
            }
          });
          
          if (fallbackImages.length > 0) {
            console.log(`Found ${fallbackImages.length} direct image URLs for listing ${listing.id} (no IDs)`);
            listingData.images = fallbackImages;
          } else {
            listingData.images = [];
          }
        }

        if (existingListingCheck) {
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

// POST /api/propdata/listings/:id/fetch-images - Force fetch images for a specific property
router.post("/propdata/listings/:id/fetch-images", async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    // Get the property with image IDs
    const [property] = await db
      .select()
      .from(propdataListings)
      .where(eq(propdataListings.propdataId, propertyId))
      .limit(1);
    
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    // Extract image IDs from listing data
    const listingData = property.listingData as any;
    const imageIds: number[] = [];
    
    if (listingData.listing_images && Array.isArray(listingData.listing_images)) {
      imageIds.push(...listingData.listing_images);
    }
    if (listingData.header_images && Array.isArray(listingData.header_images)) {
      imageIds.push(...listingData.header_images);
    }
    if (listingData.images && Array.isArray(listingData.images)) {
      listingData.images.forEach((img: any) => {
        if (typeof img === 'number') {
          imageIds.push(img);
        } else if (img && typeof img === 'object' && img.id) {
          imageIds.push(img.id);
        }
      });
    }
    
    console.log(`Fetching ${imageIds.length} images for property ${propertyId}`);
    
    if (imageIds.length === 0) {
      return res.json({ success: false, message: "No image IDs found for this property" });
    }
    
    // Fetch image details using PropData Files API
    const filesClient = new FilesClient();
    const imageDetails = await filesClient.fetchMultipleFileDetails(imageIds);
    
    // Extract image URLs
    const imageUrls = imageDetails
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(img => img.file || img.image)
      .filter((url): url is string => Boolean(url));
    
    console.log(`Successfully fetched ${imageUrls.length}/${imageIds.length} image URLs for property ${propertyId}`);
    
    // Update the property with the fetched images
    await db
      .update(propdataListings)
      .set({
        images: imageUrls,
        updatedAt: new Date()
      })
      .where(eq(propdataListings.propdataId, propertyId));
    
    return res.json({
      success: true,
      message: `Fetched ${imageUrls.length} images for property ${propertyId}`,
      imageCount: imageUrls.length,
      totalImageIds: imageIds.length,
      images: imageUrls.slice(0, 3) // Show first 3 URLs for debugging
    });
    
  } catch (error) {
    console.error(`Error fetching images for property ${req.params.id}:`, error);
    return res.status(500).json({ 
      error: "Failed to fetch images", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /api/propdata/listings/debug/files/:fileId - Debug endpoint to test file service endpoints
router.get("/propdata/listings/debug/files/:fileId", async (req, res) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const fileId = parseInt(req.params.fileId);
    if (isNaN(fileId)) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    const filesClient = new FilesClient();
    console.log(`Testing file endpoints for ID: ${fileId}`);
    
    const fileDetails = await filesClient.fetchFileDetails(fileId);
    
    if (fileDetails) {
      return res.json({
        success: true,
        fileId,
        fileDetails
      });
    } else {
      return res.json({
        success: false,
        fileId,
        message: "File not found at any known endpoint"
      });
    }
  } catch (error) {
    console.error("Error testing file endpoints:", error);
    return res.status(500).json({ 
      error: "Failed to test file endpoints", 
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