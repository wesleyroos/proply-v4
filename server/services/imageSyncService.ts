import { db } from "@db";
import { propdataListings } from "@db/schema";
import { eq } from "drizzle-orm";
import { FilesClient } from "./propdata/filesClient";

export class ImageSyncService {
  async syncMissingImages(): Promise<{
    success: boolean;
    processedProperties: number;
    totalImagesAdded: number;
    errors: number;
  }> {
    let processedProperties = 0;
    let totalImagesAdded = 0;
    let errors = 0;

    try {
      console.log("Starting comprehensive image sync for properties with missing images...");

      // Get all properties that have image IDs but no processed images
      const propertiesWithMissingImages = await db
        .select({
          id: propdataListings.id,
          propdataId: propdataListings.propdataId,
          address: propdataListings.address,
          listingData: propdataListings.listingData,
          images: propdataListings.images
        })
        .from(propdataListings);

      // Filter in JavaScript for more complex conditions
      const filteredProperties = propertiesWithMissingImages.filter(property => {
        const listingData = property.listingData as any;
        const hasImageIds = (
          (listingData?.listing_images && Array.isArray(listingData.listing_images) && listingData.listing_images.length > 0) ||
          (listingData?.header_images && Array.isArray(listingData.header_images) && listingData.header_images.length > 0)
        );
        const hasProcessedImages = property.images && Array.isArray(property.images) && property.images.length > 0;
        return hasImageIds && !hasProcessedImages;
      });

      console.log(`Found ${filteredProperties.length} properties with missing images`);

      const filesClient = new FilesClient();

      for (const property of filteredProperties) {
        try {
          console.log(`Processing images for property ${property.propdataId}: ${property.address}`);

          // Extract image IDs from the listing data
          const imageIds: number[] = [];
          const listingData = property.listingData as any;

          if (listingData.listing_images && Array.isArray(listingData.listing_images)) {
            imageIds.push(...listingData.listing_images);
          }
          if (listingData.header_images && Array.isArray(listingData.header_images)) {
            imageIds.push(...listingData.header_images);
          }

          if (imageIds.length === 0) {
            console.log(`No image IDs found for property ${property.propdataId}`);
            continue;
          }

          console.log(`Fetching ${imageIds.length} images for property ${property.propdataId}`);

          // Fetch actual image URLs
          const imageDetails = await filesClient.fetchMultipleFileDetails(imageIds);
          const imageUrls = imageDetails
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(img => img.file || img.image)
            .filter((url): url is string => Boolean(url));

          if (imageUrls.length > 0) {
            // Update the property with the fetched images
            await db
              .update(propdataListings)
              .set({
                images: imageUrls,
                updatedAt: new Date()
              })
              .where(eq(propdataListings.id, property.id));

            console.log(`Successfully added ${imageUrls.length}/${imageIds.length} images for property ${property.propdataId}`);
            totalImagesAdded += imageUrls.length;
            processedProperties++;
          } else {
            console.log(`No valid image URLs found for property ${property.propdataId}`);
          }

        } catch (propertyError) {
          console.error(`Error processing images for property ${property.propdataId}:`, propertyError);
          errors++;
        }
      }

      console.log(`Image sync completed: ${processedProperties} properties processed, ${totalImagesAdded} images added, ${errors} errors`);

      return {
        success: true,
        processedProperties,
        totalImagesAdded,
        errors
      };

    } catch (error) {
      console.error("Error during image sync:", error);
      return {
        success: false,
        processedProperties,
        totalImagesAdded,
        errors: errors + 1
      };
    }
  }
}

export const imageSyncService = new ImageSyncService();