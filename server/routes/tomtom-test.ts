import { Router } from 'express';
import { geocodeAddress, getTrafficData, GEOCODING_API_VERSION } from '../services/tomtom-service';
import fetch from 'node-fetch';

// Traffic Flow API version (same as in tomtom-service.ts)
const TRAFFIC_FLOW_API_VERSION = '4';

// Interface for raw TomTom Traffic Flow API response
interface RawTrafficFlowResponse {
  flowSegmentData?: {
    currentSpeed?: number;
    freeFlowSpeed?: number;
    confidence?: number;
    roadClosure?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

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
    apiKeyMasked: process.env.TOMTOM_API_KEY ? `${process.env.TOMTOM_API_KEY.substring(0, 4)}...${process.env.TOMTOM_API_KEY.substring(process.env.TOMTOM_API_KEY.length - 4)}` : "Missing",
    tests: {}
  };
  
  try {
    // Test 1: Direct TomTom API connection for ping
    try {
      testResults.tests.ping = {
        name: "TomTom API Ping",
        status: "Running"
      };
      
      // Use a known working endpoint for the ping test
      const pingUrl = `https://api.tomtom.com/search/${GEOCODING_API_VERSION}/geocode/Cape%20Town.json?key=${process.env.TOMTOM_API_KEY}&limit=1`;
      
      // Add headers to show proper referer
      const headers = {
        'Referer': 'http://localhost:5000',
        'Origin': 'http://localhost:5000'
      };
      
      console.log("Sending request to TomTom with headers:", JSON.stringify(headers));
      const pingResponse = await fetch(pingUrl, { headers });
      
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
        
        // Additional test: Direct call to TomTom Traffic Flow API
        testResults.tests.rawTrafficFlowAPI = {
          name: "Raw Traffic Flow API Test",
          coordinates: { latitude, longitude },
          status: "Running"
        };
        
        try {
          // Create a small bounding box around the given point
          const latOffset = 0.01;
          const lonOffset = 0.01;
          const minLat = latitude - latOffset;
          const minLon = longitude - lonOffset;
          const maxLat = latitude + latOffset;
          const maxLon = longitude + lonOffset;
          
          const apiKey = process.env.TOMTOM_API_KEY;
          const trafficFlowUrl = `https://api.tomtom.com/traffic/services/${TRAFFIC_FLOW_API_VERSION}/flowSegmentData/relative0/10/json?key=${apiKey}&bbox=${minLon},${minLat},${maxLon},${maxLat}&zoom=10`;
          
          console.log(`Testing direct Traffic Flow API at: ${trafficFlowUrl.substring(0, trafficFlowUrl.indexOf('?') + 30)}...`);
          
          const headers = {
            'Referer': 'http://localhost:5000',
            'Origin': 'http://localhost:5000'
          };
          
          const response = await fetch(trafficFlowUrl, { headers });
          
          if (!response.ok) {
            const errorText = await response.text();
            testResults.tests.rawTrafficFlowAPI = {
              name: "Raw Traffic Flow API Test",
              coordinates: { latitude, longitude },
              status: "Failed",
              statusCode: response.status,
              statusText: response.statusText,
              errorDetail: errorText
            };
          } else {
            const data = await response.json() as RawTrafficFlowResponse;
            testResults.tests.rawTrafficFlowAPI = {
              name: "Raw Traffic Flow API Test",
              coordinates: { latitude, longitude },
              status: "Success",
              statusCode: response.status,
              hasFlowData: !!data.flowSegmentData,
              dataPreview: JSON.stringify(data).substring(0, 300) + '...'
            };
          }
        } catch (error: any) {
          testResults.tests.rawTrafficFlowAPI = {
            name: "Raw Traffic Flow API Test",
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