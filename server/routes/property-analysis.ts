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
    let geocodingResult;
    try {
      geocodingResult = await geocodeAddress(address);
      
      if (!geocodingResult.seoid) {
        console.warn('No SEOID found for address, falling back to area rate');
        throw new Error('Could not find a valid SEOID for this address');
      }
    } catch (geocodingError) {
      console.error('Error in geocodeAddress:', geocodingError);
      
      // Fall back to area rate if geocoding fails
      let areaRate;
      try {
        areaRate = await getAreaRate(address);
        return res.json({
          success: true,
          propertyData: {
            address,
            hasAfriGISData: false // Flag to indicate data did NOT come from AfriGIS
          },
          areaRate: areaRate || null,
          source: 'area-rate-fallback'
        });
      } catch (areaRateError) {
        console.error('Both geocoding and area rate failed:', areaRateError);
        throw geocodingError; // Re-throw the original error
      }
    }
    
    // Step 2: Get the property analysis data using the SEOID
    let propertyData;
    try {
      propertyData = await getPropertyAnalysis(geocodingResult.seoid);
    } catch (propertyAnalysisError) {
      console.error('Error in getPropertyAnalysis:', propertyAnalysisError);
      
      // Fall back to area rate if property analysis fails
      let areaRate;
      try {
        areaRate = await getAreaRate(address);
        return res.json({
          success: true,
          propertyData: {
            address: geocodingResult.formattedAddress || address,
            location: {
              latitude: geocodingResult.latitude,
              longitude: geocodingResult.longitude
            },
            seoid: geocodingResult.seoid,
            hasAfriGISData: false // Flag to indicate data did NOT come from AfriGIS
          },
          areaRate: areaRate || null,
          source: 'geocoding-only'
        });
      } catch (areaRateError) {
        console.error('Property analysis and area rate failed:', areaRateError);
        throw propertyAnalysisError; // Re-throw the property analysis error
      }
    }
    
    // Step 3: Get the area rate as additional validation
    let areaRate;
    try {
      areaRate = await getAreaRate(address);
    } catch (areaRateError) {
      console.warn('Error fetching area rate, continuing with property analysis data only:', areaRateError);
      // Continue without area rate - we have property data
    }
    
    // Step 4: Return combined results
    res.json({
      success: true,
      propertyData: {
        ...propertyData,
        address: geocodingResult.formattedAddress || address,
        location: {
          latitude: geocodingResult.latitude,
          longitude: geocodingResult.longitude
        },
        seoid: geocodingResult.seoid,
        hasAfriGISData: true // Flag to indicate data came from AfriGIS
      },
      areaRate: propertyData.pricePerSquareMeter || areaRate || null,
      source: 'afrigis-full'
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