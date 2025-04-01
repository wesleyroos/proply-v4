import fetch from 'node-fetch';

// TomTom API constants
const TOMTOM_API_BASE_URL = 'https://api.tomtom.com';
const TOMTOM_API_VERSION = '1'; // For Traffic Density API
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

  const url = `${TOMTOM_API_BASE_URL}/traffic-stats/density/${TOMTOM_API_VERSION}/position/${latitude},${longitude}/days/${days}/hours/${hours}?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TomTom Traffic API error: ${response.status}`);
    }
    
    return await response.json() as TrafficDensityResponse;
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
    // Fetch traffic data for different time periods
    // Morning rush hour (7-9 AM on weekdays)
    const morningData = await fetchTrafficDensity(latitude, longitude, "weekdays", "7,8,9");
    
    // Evening rush hour (4-6 PM on weekdays)
    const eveningData = await fetchTrafficDensity(latitude, longitude, "weekdays", "16,17,18");
    
    // Weekend traffic (midday hours on weekends)
    const weekendData = await fetchTrafficDensity(latitude, longitude, "weekends", "10,11,12,13,14,15,16");
    
    // Calculate scores for each time period
    const morningScore = calculateTrafficScore(morningData);
    const eveningScore = calculateTrafficScore(eveningData);
    const weekendScore = calculateTrafficScore(weekendData);
    
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