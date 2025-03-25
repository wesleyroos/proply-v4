import express from 'express';
import { geocodeAddress, getPropertyAnalysis } from '../services/afrigisService';
import { getAreaRate } from '../services/areaRateService';

const router = express.Router();

/**
 * Endpoint to get property analysis data from AfriGIS
 * Takes an address and returns property data including SEOID, size, and price per square meter
 */
router.post('/', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    console.log(`Processing property analysis request for ${address}`);
    
    // Step 1: Geocode the address to get SEOID
    const geocodingResult = await geocodeAddress(address);
    
    if (!geocodingResult.seoid) {
      throw new Error('Could not find a valid SEOID for this address');
    }
    
    // Step 2: Get the property analysis data using the SEOID
    const propertyData = await getPropertyAnalysis(geocodingResult.seoid);
    
    // Step 3: Get the area rate as a fallback or additional data point
    let areaRate;
    try {
      areaRate = await getAreaRate(address);
    } catch (areaRateError) {
      console.error('Error fetching area rate, continuing with property analysis:', areaRateError);
      // Continue without area rate - it's a fallback
    }
    
    // Step 4: Return combined results
    res.json({
      success: true,
      propertyData: {
        ...propertyData,
        address: geocodingResult.formattedAddress,
        location: {
          latitude: geocodingResult.latitude,
          longitude: geocodingResult.longitude
        },
        seoid: geocodingResult.seoid
      },
      areaRate: propertyData.pricePerSquareMeter || areaRate || null
    });
  } catch (error) {
    console.error('Error in property analysis endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch property analysis data',
      details: error instanceof Error ? error.message : 'Unknown error',
      message: 'Could not analyze property. Please try again or enter details manually.'
    });
  }
});

export default router;