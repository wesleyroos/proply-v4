import { Router } from 'express';
import { geocodeAddress, getTrafficData } from '../services/tomtom-service';
import fetch from 'node-fetch';

const router = Router();

/**
 * GET /api/tomtom-test
 * Test endpoint to directly verify TomTom API functionality
 * Query parameters:
 *  - address: string (optional) - Address to test for geocoding and traffic data
 *  - lat: string (optional) - Latitude coordinate to test directly
 *  - lon: string (optional) - Longitude coordinate to test directly
 */
router.get('/', async (req, res) => {
  const { address, lat, lon } = req.query;
  
  const testResults: any = {
    apiKey: process.env.TOMTOM_API_KEY ? "Present" : "Missing",
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  try {
    // Test 1: Direct TomTom API connection for ping
    try {
      testResults.tests.ping = {
        name: "TomTom API Ping",
        status: "Running"
      };
      
      const pingUrl = `https://api.tomtom.com/search/2/geocode.json?key=${process.env.TOMTOM_API_KEY}&query=test&limit=1`;
      const pingResponse = await fetch(pingUrl);
      
      testResults.tests.ping = {
        name: "TomTom API Ping",
        status: pingResponse.ok ? "Success" : "Failed",
        statusCode: pingResponse.status,
        statusText: pingResponse.statusText
      };
      
      if (!pingResponse.ok) {
        const errorText = await pingResponse.text();
        testResults.tests.ping.errorDetail = errorText;
      }
    } catch (error: any) {
      testResults.tests.ping = {
        name: "TomTom API Ping",
        status: "Error",
        error: error.message
      };
    }
    
    // Test 2: Geocoding test (if address provided)
    if (address && typeof address === 'string') {
      testResults.tests.geocoding = {
        name: "Address Geocoding",
        address,
        status: "Running"
      };
      
      try {
        const geocodeResult = await geocodeAddress(address);
        testResults.tests.geocoding = {
          name: "Address Geocoding",
          address,
          status: "Success",
          result: geocodeResult
        };
        
        // If geocoding succeeds, also test traffic data with those coordinates
        testResults.tests.traffic = {
          name: "Traffic Data",
          coordinates: geocodeResult,
          status: "Running"
        };
        
        try {
          const trafficData = await getTrafficData(
            geocodeResult.latitude, 
            geocodeResult.longitude
          );
          
          testResults.tests.traffic = {
            name: "Traffic Data",
            coordinates: geocodeResult,
            status: "Success",
            result: trafficData
          };
        } catch (error: any) {
          testResults.tests.traffic = {
            name: "Traffic Data",
            coordinates: geocodeResult,
            status: "Error",
            error: error.message
          };
        }
      } catch (error: any) {
        testResults.tests.geocoding = {
          name: "Address Geocoding",
          address,
          status: "Error",
          error: error.message
        };
      }
    }
    
    // Test 3: Direct coordinates test (if lat & lon provided)
    if (lat && lon && typeof lat === 'string' && typeof lon === 'string') {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        testResults.tests.directTraffic = {
          name: "Direct Traffic Data",
          coordinates: { latitude, longitude },
          status: "Running"
        };
        
        try {
          const trafficData = await getTrafficData(latitude, longitude);
          
          testResults.tests.directTraffic = {
            name: "Direct Traffic Data",
            coordinates: { latitude, longitude },
            status: "Success",
            result: trafficData
          };
        } catch (error: any) {
          testResults.tests.directTraffic = {
            name: "Direct Traffic Data", 
            coordinates: { latitude, longitude },
            status: "Error",
            error: error.message
          };
        }
      } else {
        testResults.tests.directTraffic = {
          name: "Direct Traffic Data",
          status: "Error",
          error: "Invalid latitude or longitude values"
        };
      }
    }
    
    // Return all test results
    return res.json(testResults);
  } catch (error: any) {
    console.error("Error in TomTom API test:", error);
    return res.status(500).json({
      error: "TomTom API test failed",
      message: error.message,
      tests: testResults.tests
    });
  }
});

export default router;