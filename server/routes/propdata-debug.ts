import express from "express";
import { ListingsClient } from "../services/propdata/listingsClient";

const router = express.Router();

// Debug endpoint to examine PropData API response structure
router.get("/debug-listing/:propdataId", async (req, res) => {
  try {
    const { propdataId } = req.params;
    
    const listingsClient = new ListingsClient();
    
    // Fetch the full listing details from PropData API
    const listingDetails = await listingsClient.fetchListingDetails(propdataId);
    
    if (!listingDetails) {
      return res.status(404).json({ error: "Listing not found in PropData API" });
    }

    // Extract all fields that might contain levy information
    const levyRelatedFields: Record<string, any> = {};
    const allFields = Object.keys(listingDetails);
    
    // Look for any field containing "levy", "rate", "municipal", "body_corp", "sectional"
    const levyKeywords = ['levy', 'rate', 'municipal', 'body_corp', 'sectional', 'expense', 'cost', 'fee'];
    
    allFields.forEach(field => {
      const fieldLower = field.toLowerCase();
      if (levyKeywords.some(keyword => fieldLower.includes(keyword))) {
        levyRelatedFields[field] = listingDetails[field];
      }
    });

    res.json({
      propdataId,
      address: [
        listingDetails.street_number,
        listingDetails.street_name,
        listingDetails.suburb,
        listingDetails.city
      ].filter(Boolean).join(", "),
      allFieldsCount: allFields.length,
      allFields: allFields.sort(),
      levyRelatedFields,
      specificLevyFields: {
        levy: listingDetails.levy || null,
        monthly_levy: listingDetails.monthly_levy || null,
        sectional_title_levy: listingDetails.sectional_title_levy || null,
        home_owner_levy: listingDetails.home_owner_levy || null,
        special_levy: listingDetails.special_levy || null,
        monthly_rates: listingDetails.monthly_rates || null,
        body_corp_name: listingDetails.body_corp_name || null,
        body_corp_email: listingDetails.body_corp_email || null,
      },
      rawResponse: listingDetails
    });

  } catch (error: any) {
    console.error("Error debugging PropData listing:", error);
    res.status(500).json({ 
      error: "Failed to fetch PropData listing details",
      message: error.message 
    });
  }
});

export default router;