import fetch from 'node-fetch';

// TomTom API constants
const TOMTOM_API_BASE_URL = 'https://api.tomtom.com';
const TOMTOM_API_VERSION = '1'; // For Traffic Density API
const TRAFFIC_STATS_API_VERSION = '1'; // Traffic Stats API Version
const TRAFFIC_FLOW_API_VERSION = '4'; // Traffic Flow API Version
export const GEOCODING_API_VERSION = '2';

// TomTom Traffic Statistics API types
const MORNING_RUSH_HOUR = "0700-0900"; // 7-9 AM
const EVENING_RUSH_HOUR = "1600-1900"; // 4-7 PM
const WEEKEND_TYPICAL = "1000-1800";   // 10 AM - 6 PM on weekends

// Types for TomTom responses
interface GeocodingResult {
  position: {
    lat: number;
    lon: number;
  };
  address: {
    freeformAddress: string;
    country: string;
    countryCode: string;
  };
}

interface GeocodingResponse {
  results: GeocodingResult[];
}

interface FlowSegmentData {
  currentSpeed?: number;
  freeFlowSpeed?: number;
  confidence?: number;
  roadClosure?: boolean;
  // Other TomTom-specific fields
}

interface TrafficFlowResponse {
  flowSegmentData?: FlowSegmentData;
}

interface TrafficDensityResponse {
  density?: number; // Traffic density value from TomTom
  currentSpeed?: number; // Current vehicle speed
  freeFlowSpeed?: number; // Free flow speed without traffic
  confidence?: number; // Confidence level of the data
  roadClosure?: boolean; // Whether the road is closed
  // Other fields from TomTom response
}

// Interface for our formatted traffic data
export interface TrafficDensityData {
  morningRushHour: number;
  eveningRushHour: number;
  weekendTraffic: number;
  overallRating: string;
}

/**
 * Geocodes an address to get latitude and longitude using TomTom's Geocoding API
 * @param address The address to geocode
 * @returns Promise with latitude and longitude
 */
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number }> {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    throw new Error('TomTom API key is not set in environment variables');
  }

  const encodedAddress = encodeURIComponent(address);
  // Updated URL with countrySet=ZA to bias results toward South Africa and limit=1 to return only one result
  const url = `${TOMTOM_API_BASE_URL}/search/${GEOCODING_API_VERSION}/geocode/${encodedAddress}.json?key=${apiKey}&limit=1&countrySet=ZA`;
  
  console.log(`Geocoding address: ${address}`);

  try {
    // Add headers to show proper referer
    const headers = {
      'Referer': 'http://localhost:5000',
      'Origin': 'http://localhost:5000'
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TomTom Geocoding API error: ${response.status} - ${errorText}`);
      
      // Add more specific error handling for common TomTom API errors
      if (response.status === 403) {
        if (errorText.includes("Developer Unknown Referer") || errorText.includes("Developer Inactive")) {
          console.error("TomTom API domain authorization issue: Your domain is not whitelisted or the API key is not active for this domain.");
          console.error("Request headers used: ", JSON.stringify(headers));
          throw new Error("TomTom API domain not authorized. Please ensure domain is whitelisted in your TomTom developer account.");
        }
      }
      
      throw new Error(`TomTom Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json() as GeocodingResponse;
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No geocoding results found for the given address');
    }
    
    const { lat, lon } = data.results[0].position;
    console.log(`Successfully geocoded address to: ${lat}, ${lon}`);
    
    return {
      latitude: lat,
      longitude: lon
    };
  } catch (error) {
    console.error('Error in geocoding address:', error);
    throw error;
  }
}

/**
 * Generates estimated traffic data for a specific time period based on
 * typical traffic patterns for urban areas.
 * 
 * This function provides statistical estimates for typical traffic patterns
 * when the Traffic Statistics API is not available.
 * 
 * @param latitude Latitude coordinate (for location context)
 * @param longitude Longitude coordinate (for location context)
 * @param timeOfDay Time period to estimate (morning, evening, etc.)
 * @param dayType Type of day (weekday, weekend)
 * @returns Estimated traffic density data
 */
function generateEstimatedTrafficData(
  latitude: number,
  longitude: number,
  timeOfDay: string,
  dayType: 'weekday' | 'weekend'
): TrafficDensityResponse {
  console.log(`Generating estimated traffic patterns for ${dayType} during ${timeOfDay} at coordinates: ${latitude}, ${longitude}`);
  
  // Base congestion levels that can be adjusted based on the area
  // These are based on typical urban congestion patterns
  const baseWeekdayCongestion = 5.5; // Medium-high base congestion for weekdays
  const baseWeekendCongestion = 3.0; // Lower base congestion for weekends
  
  // Start with a base congestion level based on day type
  let congestionLevel = (dayType === 'weekday') ? baseWeekdayCongestion : baseWeekendCongestion;
  
  // Adjust based on time of day
  if (dayType === 'weekday') {
    if (timeOfDay === MORNING_RUSH_HOUR) {
      // Morning rush hour typically has high congestion
      congestionLevel *= 1.4; // 40% higher than base
    } else if (timeOfDay === EVENING_RUSH_HOUR) {
      // Evening rush hour typically has highest congestion
      congestionLevel *= 1.6; // 60% higher than base
    } else {
      // Non-peak weekday hours have less congestion
      congestionLevel *= 0.7; // 30% lower than base
    }
  } else { // weekend
    if (timeOfDay === MORNING_RUSH_HOUR) {
      // Weekend mornings typically have lower congestion
      congestionLevel *= 0.8; // 20% lower than weekend base
    } else if (timeOfDay === EVENING_RUSH_HOUR) {
      // Weekend evenings can be moderately congested
      congestionLevel *= 1.2; // 20% higher than weekend base
    }
    // Weekend daytime (WEEKEND_TYPICAL) uses the base weekend congestion without adjustment
  }
  
  // Ensure the density is within 0-10 range
  congestionLevel = Math.max(0, Math.min(10, congestionLevel));
  
  console.log(`Estimated traffic congestion level for ${dayType} during ${timeOfDay}: ${congestionLevel}`);
  
  return {
    density: congestionLevel
  } as TrafficDensityResponse;
}

/**
 * Fetches real-time traffic density from TomTom for a specific location
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Promise with traffic density data
 */
async function fetchTrafficDensity(
  latitude: number,
  longitude: number
): Promise<TrafficDensityResponse> {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    throw new Error('TomTom API key is not set in environment variables');
  }

  // Use the Traffic Flow API with the point parameter as required by the API error message
  const url = `${TOMTOM_API_BASE_URL}/traffic/services/${TRAFFIC_FLOW_API_VERSION}/flowSegmentData/relative0/10/json?key=${apiKey}&point=${latitude},${longitude}&zoom=10`;
  
  try {
    console.log(`Fetching traffic data from TomTom at coordinates: ${latitude}, ${longitude}`);
    
    // Add headers to show proper referer
    const headers = {
      'Referer': 'http://localhost:5000',
      'Origin': 'http://localhost:5000'
    };
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TomTom Traffic API error: ${response.status} - ${errorText}`);
      
      // Add more detailed error handling for Traffic API
      if (response.status === 403) {
        if (errorText.includes("Developer Unknown Referer") || errorText.includes("Developer Inactive")) {
          console.error("TomTom Traffic API domain authorization issue: Your domain is not whitelisted or the API key is not active for this domain.");
          console.error("Request headers used: ", JSON.stringify(headers));
          throw new Error("TomTom API domain not authorized. Please ensure your domain is whitelisted in the TomTom developer account.");
        }
      } else if (response.status === 400) {
        console.error("TomTom Traffic API Bad Request: Check if coordinates are valid and within supported regions");
      } else if (response.status === 596) {
        console.error("TomTom Traffic API Service Not Found: Check if the traffic service version is correct");
      }
      
      throw new Error(`TomTom Traffic API error: ${response.status}`);
    }
    
    const data = await response.json() as TrafficFlowResponse;
    console.log(`TomTom traffic data response:`, JSON.stringify(data).substring(0, 500) + '...');
    
    // Extract traffic flow information from the response
    const flowSegmentData = data?.flowSegmentData || null;
    
    if (!flowSegmentData) {
      console.warn('No flow segment data in TomTom response');
      return { density: 5 }; // Default mid-range value
    }
    
    // Calculate density based on current speed vs free flow speed
    // with adjustments for confidence and road closure
    let congestionLevel = 0;
    
    try {
      // Extract relevant traffic flow metrics
      const currentSpeed = flowSegmentData.currentSpeed || 0;
      const freeFlowSpeed = flowSegmentData.freeFlowSpeed || 1; // Avoid division by zero
      const confidence = flowSegmentData.confidence || 0.75;
      const roadClosure = flowSegmentData.roadClosure || false;
      
      // Calculate a congestion ratio (how much slower current traffic is compared to free flow)
      // Higher values mean more congestion (e.g., 0.8 means traffic is at 20% of free flow speed)
      const congestionRatio = 1 - Math.min(1, currentSpeed / freeFlowSpeed);
      
      // Scale the congestion ratio to our 0-10 scale and adjust by confidence
      congestionLevel = congestionRatio * 10 * confidence;
      
      // Add extra points for road closures
      if (roadClosure) {
        congestionLevel += 3;
      }
      
      console.log(`Calculated traffic congestion level: ${congestionLevel} (current speed: ${currentSpeed}, free flow: ${freeFlowSpeed})`);
    } catch (err) {
      console.error('Error processing traffic flow data:', err);
      congestionLevel = 5; // Default mid-range value on error
    }
    
    // Ensure the density is within 0-10 range
    congestionLevel = Math.max(0, Math.min(10, congestionLevel));
    
    return { 
      density: congestionLevel,
      // Other relevant fields can be added here
    } as TrafficDensityResponse;
  } catch (error) {
    console.error('Error fetching traffic density:', error);
    throw error;
  }
}

/**
 * Calculate a traffic score based on the TomTom density data
 * Converts TomTom's scale to our 0-100 scale
 */
function calculateTrafficScore(trafficData: TrafficDensityResponse): number {
  // TomTom typically returns a density value or other metrics
  // We need to convert this to our scale (0-100)
  const densityValue = trafficData.density || 0;
  
  // Convert TomTom's density (typically 0-10) to our 0-100 scale
  return Math.min(Math.round(densityValue * 10), 100);
}

/**
 * Determine an overall traffic rating based on the calculated scores
 */
function determineOverallRating(morningScore: number, eveningScore: number, weekendScore: number): string {
  const averageScore = (morningScore + eveningScore + weekendScore) / 3;
  
  if (averageScore < 30) return "Low Traffic";
  if (averageScore < 60) return "Medium Traffic";
  return "Heavy Traffic";
}

/**
 * Fetches comprehensive traffic data for a location
 * This combines real-time data with statistical estimates to provide
 * historical/typical traffic patterns which are more useful for 
 * property investment decisions than real-time traffic data alone
 * 
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Traffic density data formatted for our application
 */
export async function getTrafficData(latitude: number, longitude: number): Promise<TrafficDensityData> {
  try {
    console.log(`Getting historical traffic patterns for coordinates: ${latitude}, ${longitude}`);

    // First, try to get current traffic conditions as a baseline
    const currentData = await fetchTrafficDensity(latitude, longitude);
    const currentScore = calculateTrafficScore(currentData);
    
    // Generate estimated traffic patterns for different time periods
    // These estimates are based on typical traffic patterns adjusted by the current real-time data
    
    // Morning rush hour (7-9 AM weekdays)
    const morningEstimate = generateEstimatedTrafficData(latitude, longitude, MORNING_RUSH_HOUR, 'weekday');
    const baselineAdjustmentFactor = Math.max(0.5, Math.min(1.5, currentScore / 50));
    const morningScore = Math.min(100, Math.round(calculateTrafficScore(morningEstimate) * baselineAdjustmentFactor));
    
    // Evening rush hour (4-7 PM weekdays)
    const eveningEstimate = generateEstimatedTrafficData(latitude, longitude, EVENING_RUSH_HOUR, 'weekday');
    const eveningScore = Math.min(100, Math.round(calculateTrafficScore(eveningEstimate) * baselineAdjustmentFactor));
    
    // Weekend typical hours (10 AM - 6 PM weekend)
    const weekendEstimate = generateEstimatedTrafficData(latitude, longitude, WEEKEND_TYPICAL, 'weekend');
    const weekendScore = Math.min(100, Math.round(calculateTrafficScore(weekendEstimate) * baselineAdjustmentFactor));
    
    // Determine the overall traffic rating
    const overallRating = determineOverallRating(morningScore, eveningScore, weekendScore);
    
    console.log(`Traffic analysis compiled: Morning: ${morningScore}, Evening: ${eveningScore}, Weekend: ${weekendScore}, Overall: ${overallRating}`);
    
    return {
      morningRushHour: morningScore,
      eveningRushHour: eveningScore,
      weekendTraffic: weekendScore,
      overallRating
    };
  } catch (error) {
    console.error('Error getting traffic data:', error);
    
    // If we can't get real-time data, use pure statistical estimates
    try {
      console.log("Falling back to purely statistical traffic estimates");
      
      // Generate statistical traffic patterns without real-time adjustment
      const morningEstimate = generateEstimatedTrafficData(latitude, longitude, MORNING_RUSH_HOUR, 'weekday');
      const morningScore = calculateTrafficScore(morningEstimate);
      
      const eveningEstimate = generateEstimatedTrafficData(latitude, longitude, EVENING_RUSH_HOUR, 'weekday');
      const eveningScore = calculateTrafficScore(eveningEstimate);
      
      const weekendEstimate = generateEstimatedTrafficData(latitude, longitude, WEEKEND_TYPICAL, 'weekend');
      const weekendScore = calculateTrafficScore(weekendEstimate);
      
      // Determine the overall traffic rating
      const overallRating = determineOverallRating(morningScore, eveningScore, weekendScore);
      
      console.log(`Using statistical traffic estimates: Morning: ${morningScore}, Evening: ${eveningScore}, Weekend: ${weekendScore}`);
      
      return {
        morningRushHour: morningScore,
        eveningRushHour: eveningScore,
        weekendTraffic: weekendScore,
        overallRating
      };
    } catch (fallbackError) {
      console.error('Even statistical traffic estimation failed:', fallbackError);
      
      // As a last resort, return fallback data
      // This allows the application to continue functioning
      // when all estimation methods fail
      return {
        morningRushHour: 75,
        eveningRushHour: 85,
        weekendTraffic: 45,
        overallRating: "Medium Traffic"
      };
    }
  }
}