import express from "express";
import { getComparableSales } from "../services/comparableSalesService";
import { findComparableProperties, scrapeProperty24 } from "../services/property24Scraper";

const router = express.Router();

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
      bypassAuth = false, // Allow public access with explicit flag
      useOpenAI = false, // Flag to force OpenAI usage for testing
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

    // Convert to appropriate types
    const size = Number(propertySize);
    const beds = Number(bedrooms);
    const luxury = luxuryRating ? Number(luxuryRating) : undefined;

    // Validate conversions
    if (isNaN(size) || isNaN(beds) || (luxury !== undefined && isNaN(luxury))) {
      return res.status(400).json({
        success: false,
        error: "Invalid numeric values provided",
      });
    }

    console.log(`Finding comparable sales for ${address} (${propertyType || 'apartment'}, ${beds} beds, ${size}m²)`);

    // STEP 1: Try to get real property listings using Property24 scraper
    let comparableProperties = [];
    let averageSalePrice = 0;
    let dataSource = "property24";
    
    // If not forcing OpenAI, try the Property24 scraper first
    if (!useOpenAI) {
      try {
        comparableProperties = await findComparableProperties(
          address,
          size,
          beds,
          propertyType || 'apartment',
          15
        );
        
        if (comparableProperties.length > 0) {
          // Calculate average sale price
          const totalPrice = comparableProperties.reduce((sum, p) => sum + p.salePrice, 0);
          averageSalePrice = Math.round(totalPrice / comparableProperties.length);
          
          console.log(`Using ${comparableProperties.length} real property listings from Property24`);
        }
      } catch (scrapingError) {
        console.error("Error using Property24 scraper:", scrapingError);
      }
    }
    
    // STEP 2: If Property24 failed or returned no results, fallback to OpenAI
    if (comparableProperties.length === 0 || useOpenAI) {
      console.log("Falling back to OpenAI for comparable sales data");
      dataSource = "openai";
      
      const comparableSalesData = await getComparableSales(
        address,
        size,
        beds,
        propertyType,
        propertyCondition,
        luxury
      );
      
      // Use the OpenAI data
      comparableProperties = comparableSalesData.properties;
      averageSalePrice = comparableSalesData.averageSalePrice;
    }

    // Structure the final response
    const responseData = {
      properties: comparableProperties,
      averageSalePrice,
      dataSource
    };
    
    // Return the data
    return res.json({
      success: true,
      data: responseData,
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

// DEVELOPMENT ENDPOINTS - These are for testing and development only

// Endpoint to directly test Property24 scraper
router.post("/scrape-property24", async (req, res) => {
  try {
    const { 
      suburb, 
      propertyType = 'flat', 
      minBedrooms = 0, 
      maxBedrooms = 10,
      bypassAuth = true  // Allow bypassing auth for development endpoints
    } = req.body;
    
    // Check authentication unless bypassed
    if (!bypassAuth && (!req.user || !req.user.id)) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Validate suburb
    if (!suburb) {
      return res.status(400).json({
        success: false,
        error: "suburb is required",
      });
    }

    // Run the scraper
    console.log(`Scraping Property24 for ${suburb}, property type: ${propertyType}, beds: ${minBedrooms}-${maxBedrooms}`);
    
    const results = await scrapeProperty24(
      suburb,
      propertyType,
      'for-sale',
      0, // minPrice
      0, // maxPrice (0 = no limit)
      minBedrooms,
      maxBedrooms
    );
    
    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error in Property24 scraper test endpoint:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

// Endpoint to test finding comparable properties
router.post("/find-comparable", async (req, res) => {
  try {
    const { address, propertySize, bedrooms, propertyType } = req.body;

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

    // Validate conversions
    if (isNaN(size) || isNaN(beds)) {
      return res.status(400).json({
        success: false,
        error: "Invalid numeric values provided",
      });
    }

    console.log(`Testing findComparableProperties with: ${address}, size: ${size}, beds: ${beds}, type: ${propertyType || 'apartment'}`);
    
    // Find comparable properties
    const comparableProperties = await findComparableProperties(
      address,
      size,
      beds,
      propertyType || 'apartment',
      15
    );
    
    return res.json({
      success: true,
      count: comparableProperties.length,
      data: comparableProperties,
    });
  } catch (error) {
    console.error("Error in find comparable properties test endpoint:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
});

export default router;