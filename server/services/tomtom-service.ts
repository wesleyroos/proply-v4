import fetch from 'node-fetch';

// TomTom API constants
const TOMTOM_API_BASE_URL = 'https://api.tomtom.com';
const TOMTOM_API_VERSION = '1'; // For Traffic Density API
const TRAFFIC_STATS_API_VERSION = '1'; // Traffic Stats API Version
const TRAFFIC_FLOW_API_VERSION = '4'; // Traffic Flow API Version
const GEOCODING_API_VERSION = '2';

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

interface TrafficDensityResponse {
  density?: number; // Traffic density value from TomTom
  currentSpeed?: number; // Current vehicle speed
  freeFlowSpeed?: number; // Free flow speed without traffic
  confidence?: string; // Confidence level of the data
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
  const url = `${TOMTOM_API_BASE_URL}/search/${GEOCODING_API_VERSION}/geocode/${encodedAddress}.json?key=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TomTom Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json() as GeocodingResponse;
    
    if (!data.results || data.results.length === 0) {
      throw new Error('No geocoding results found for the given address');
    }
    
    const { lat, lon } = data.results[0].position;
    
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
 * Fetches traffic density from TomTom for a specific location and time period
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @param days Days of the week (weekdays, weekends, all)
 * @param hours Hours of the day (comma-separated)
 * @returns Promise with traffic density data
 */
async function fetchTrafficDensity(
  latitude: number,
  longitude: number,
  days: string,
  hours: string
): Promise<TrafficDensityResponse> {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    throw new Error('TomTom API key is not set in environment variables');
  }

  // Use Traffic Flow API endpoint
  const url = `${TOMTOM_API_BASE_URL}/traffic/${TRAFFIC_FLOW_API_VERSION}/flowSegmentData/${latitude},${longitude}/json?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TomTom Traffic API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract traffic flow information and convert to density equivalent
    const flowData = data as any; // Type assertion to avoid TypeScript errors
    const currentSpeed = flowData?.flowSegmentData?.currentSpeed || 0;
    const freeFlowSpeed = flowData?.flowSegmentData?.freeFlowSpeed || 1; // Prevent division by zero
    
    // Calculate congestion level - higher means more congested
    // Convert to a scale that mimics density (0-10 where 10 is completely congested)
    let congestionLevel = 0;
    if (freeFlowSpeed > 0) {
      // Calculate as percentage of speed reduction from free flow
      congestionLevel = Math.max(0, Math.min(10, 10 * (1 - (currentSpeed / freeFlowSpeed))));
    }
    
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
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Traffic density data formatted for our application
 */
export async function getTrafficData(latitude: number, longitude: number): Promise<TrafficDensityData> {
  try {
    // Since the flow API doesn't have time-of-day parameters,
    // we'll use the current traffic flow and simulate time-of-day patterns
    // based on typical traffic patterns
    
    // Get current traffic flow
    const currentData = await fetchTrafficDensity(latitude, longitude, "", "");
    const currentScore = calculateTrafficScore(currentData);
    
    // Apply time-of-day & day-of-week simulated adjustments based on typical traffic patterns
    // We're using a base value and adjusting up or down for different times

    // Morning rush hour typically has 20-30% higher congestion than base
    const morningMultiplier = 1.3;
    const morningScore = Math.min(100, Math.round(currentScore * morningMultiplier));
    
    // Evening rush hour typically has 30-40% higher congestion than base
    const eveningMultiplier = 1.4;
    const eveningScore = Math.min(100, Math.round(currentScore * eveningMultiplier));
    
    // Weekend typically has 20-30% less congestion than base
    const weekendMultiplier = 0.7;
    const weekendScore = Math.round(currentScore * weekendMultiplier);
    
    // Determine the overall traffic rating
    const overallRating = determineOverallRating(morningScore, eveningScore, weekendScore);
    
    return {
      morningRushHour: morningScore,
      eveningRushHour: eveningScore,
      weekendTraffic: weekendScore,
      overallRating
    };
  } catch (error) {
    console.error('Error getting traffic data:', error);
    throw error;
  }
}