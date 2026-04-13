import express from "express";
import fetch from "node-fetch";
import { db } from "../../db";
import { propdataListings } from "../../db/schema";
import { eq } from "drizzle-orm";
import { getComparableSales } from "../services/comparableSalesService";
import { getComparableSalesByCoordinates, KnowledgeFactoryProperty } from "../services/knowledgeFactoryService";
import { upsertComparableSales } from "../services/comparableSalesStore";

const router = express.Router();

/**
 * Geocode an address string to lat/lng using Google's Geocoding API.
 * Returns null if the address can't be resolved — callers should handle gracefully.
 */
async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      address,
      key: apiKey,
      components: 'country:ZA',
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    const data = await response.json() as any;

    if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) {
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}

// Map common property type labels to Knowledge Factory single-letter codes
const KF_PROPERTY_TYPE_MAP: Record<string, string> = {
  sectional_title: 'S',
  apartment: 'S',
  flat: 'S',
  house: 'F',
  freehold: 'F',
  townhouse: 'F',
  farm: 'A',
  agricultural: 'A',
  agricultural_holding: 'H',
  gated_community: 'C',
};

// Endpoint to get comparable sales data
router.post("/comparable-sales", async (req, res) => {
  try {
    const {
      address,
      propertySize,
      bedrooms,
      propertyType,
      propertyCondition,
      luxuryRating,
      coordinates: providedCoordinates,
      propdataId,
      bypassAuth = false,
    } = req.body;

    // Check authentication unless bypassed
    if (!bypassAuth && (!req.user || !req.user.id)) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Validate required fields
    if (!address || !propertySize || !bedrooms) {
      return res.status(400).json({
        success: false,
        error: "Address, property size, and number of bedrooms are required",
      });
    }

    const size = Number(propertySize);
    const beds = Number(bedrooms);
    const luxury = luxuryRating ? Number(luxuryRating) : undefined;

    if (isNaN(size) || isNaN(beds) || (luxury !== undefined && isNaN(luxury))) {
      return res.status(400).json({
        success: false,
        error: "Invalid numeric values provided",
      });
    }

    console.log(`Finding comparable sales for ${address} (${propertyType || 'property'}, ${beds} beds, ${size}m²)`);

    // STEP 1: Get real title deed data from Knowledge Factory
    let titleDeedProperties: any[] = [];
    let averageSalePrice = 0;
    let dataSource = "openai";

    try {
      // Use provided coordinates or geocode the address
      let coordinates = (providedCoordinates?.latitude && providedCoordinates?.longitude)
        ? providedCoordinates
        : await geocodeAddress(address);

      // South Africa: lat ≈ -22 to -35, lng ≈ 16 to 33.
      // If lat is positive and in the lng range, coordinates are likely swapped.
      if (coordinates) {
        const lat = Number(coordinates.latitude);
        const lng = Number(coordinates.longitude);
        if (lat > 0 && lat >= 16 && lat <= 34 && lng > 0 && lng >= 22 && lng <= 35) {
          console.warn(`[deal-advisor] Coordinates appear swapped (lat=${lat}, lng=${lng}) — correcting`);
          coordinates = { latitude: -lng, longitude: lat };
          // Fix the listing so future requests don't hit this
          if (propdataId) {
            db.update(propdataListings)
              .set({ location: { latitude: -lng, longitude: lat } })
              .where(eq(propdataListings.propdataId, propdataId))
              .catch(() => {});
          }
        }
      }

      // Cache geocoded coordinates back onto the listing so future requests skip this step
      if (coordinates && !providedCoordinates?.latitude && propdataId) {
        db.update(propdataListings)
          .set({ location: { latitude: coordinates.latitude, longitude: coordinates.longitude } })
          .where(eq(propdataListings.propdataId, propdataId))
          .catch(() => {}); // fire-and-forget, non-critical
      }

      if (coordinates) {
        const kfPropertyType = propertyType
          ? KF_PROPERTY_TYPE_MAP[propertyType.toLowerCase()] ?? undefined
          : undefined;

        const kfProperties = await getComparableSalesByCoordinates(coordinates, kfPropertyType);

        if (kfProperties.length > 0) {
          titleDeedProperties = kfProperties.map((p: KnowledgeFactoryProperty) => ({
            propertyId: p.propertyId,
            address: p.address,
            suburb: p.suburb,
            salePrice: p.salePrice,
            size: p.size,
            pricePerSqM: p.pricePerSqM,
            saleDate: p.saleDate,
            distanceKM: p.distanceKM,
            titleDeedNo: p.titleDeedNo,
            propertyType: p.propertyType,
            buyerName: p.buyerName,
            sellerName: p.sellerName,
            latitude: p.latitude,
            longitude: p.longitude,
            source: 'knowledgeFactory',
          }));

          const validPrices = titleDeedProperties.filter(p => p.salePrice > 0);
          if (validPrices.length > 0) {
            averageSalePrice = Math.round(
              validPrices.reduce((sum, p) => sum + p.salePrice, 0) / validPrices.length
            );
          }

          dataSource = "knowledgeFactory";
          console.log(`Knowledge Factory returned ${titleDeedProperties.length} title deed records`);

          // Store all KF records in the comparable_sales table (fire-and-forget)
          upsertComparableSales(titleDeedProperties, propdataId).catch(err =>
            console.warn("comparable_sales background upsert failed:", err)
          );
        }
      } else {
        console.log(`Could not resolve coordinates for "${address}" — skipping Knowledge Factory`);
      }
    } catch (kfError) {
      console.error("Knowledge Factory error (non-fatal):", kfError instanceof Error ? kfError.message : kfError);
    }

    // STEP 2: Fall back to OpenAI if Knowledge Factory returned nothing
    let comparableProperties: any[] = [];
    if (titleDeedProperties.length === 0) {
      console.log("No title deed data — falling back to OpenAI");
      dataSource = "openai";

      const aiData = await getComparableSales(address, size, beds, propertyType, propertyCondition, luxury);
      comparableProperties = aiData.properties;
      averageSalePrice = aiData.averageSalePrice;
    }

    return res.json({
      success: true,
      data: {
        titleDeedProperties,
        properties: comparableProperties,
        averageSalePrice,
        dataSource,
      },
    });
  } catch (error) {
    console.error("Error in comparable sales endpoint:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

// Endpoint to get suburb sentiment
router.post("/suburb-sentiment", async (req, res) => {
  try {
    const { suburb } = req.body;

    if (!suburb) {
      return res.status(400).json({
        success: false,
        error: "Suburb name is required",
      });
    }

    // This would normally call a service to get sentiment data
    // For now, returning mock data
    const sentimentData = {
      name: suburb,
      description: `${suburb} is a desirable suburb with a mix of residential properties. The area has seen steady growth in property values over the past few years, attracting a diverse range of residents.`,
      investmentPotential: "High potential for capital growth with increasing demand",
      developmentActivity: "Moderate development with several new projects planned",
      trend: "Upward trend in property values expected to continue",
    };

    return res.json({
      success: true,
      data: sentimentData,
    });
  } catch (error) {
    console.error("Error in suburb sentiment endpoint:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

// Endpoint to get area rate
router.post("/area-rate", async (req, res) => {
  try {
    const { address, propertyType, luxuryRating } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Address is required",
      });
    }

    // This would normally call a service to get area rate data
    // For now, returning mock data
    const areaRate = Math.round(35000 + Math.random() * 15000);

    return res.json({
      success: true,
      areaRate,
    });
  } catch (error) {
    console.error("Error in area rate endpoint:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

// Endpoint to get rental amount
router.post("/rental-amount", async (req, res) => {
  try {
    const { address, propertySize, bedrooms, condition, luxuryRating } = req.body;

    // Validate required fields
    if (!address || !propertySize || !bedrooms) {
      return res.status(400).json({
        success: false,
        error: "Address, property size, and number of bedrooms are required",
      });
    }

    // Convert to appropriate types
    const size = Number(propertySize);
    const beds = Number(bedrooms);
    const luxury = luxuryRating ? Number(luxuryRating) : 5;

    // Validate conversions
    if (isNaN(size) || isNaN(beds) || (luxury !== undefined && isNaN(luxury))) {
      return res.status(400).json({
        success: false,
        error: "Invalid numeric values provided",
      });
    }

    // Calculate base rental amount
    const baseRental = beds * 5000 + size * 100;
    
    // Apply condition multiplier
    let conditionMultiplier = 1.0;
    if (condition === "excellent") {
      conditionMultiplier = 1.2;
    } else if (condition === "good") {
      conditionMultiplier = 1.1;
    } else if (condition === "poor") {
      conditionMultiplier = 0.8;
    }
    
    // Apply luxury rating multiplier (1-10 scale)
    const luxuryMultiplier = 0.9 + (luxury / 10);
    
    // Calculate final rental amount
    const rentalAmount = Math.round(baseRental * conditionMultiplier * luxuryMultiplier);
    
    // Calculate min/max range
    const minRental = Math.round(rentalAmount * 0.9);
    const maxRental = Math.round(rentalAmount * 1.1);
    
    return res.json({
      success: true,
      rentalAmount,
      rentalRange: {
        min: minRental,
        max: maxRental
      }
    });
  } catch (error) {
    console.error("Error in rental amount endpoint:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

export default router;