import { Router } from 'express';
import { geocodeAddress, getTrafficData } from '../services/tomtom-service';

const router = Router();

/**
 * GET /api/traffic-data
 * Fetch traffic data for a given address
 * Query parameters:
 *  - address: string (required) - The property address to analyze
 */
router.get('/traffic-data', async (req, res) => {
  const { address } = req.query;
  
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    // First, geocode the address to get latitude and longitude
    const { latitude, longitude } = await geocodeAddress(address);
    
    // Then fetch the traffic data
    const trafficData = await getTrafficData(latitude, longitude);
    
    return res.json(trafficData);
  } catch (error) {
    console.error("Error fetching traffic data:", error);
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('No geocoding results')) {
        return res.status(404).json({ error: "Unable to geocode this address. Please check and try again." });
      } else if (error.message.includes('TomTom API')) {
        return res.status(503).json({ error: "External service unavailable. Please try again later." });
      }
    }
    
    return res.status(500).json({ error: "Failed to fetch traffic data" });
  }
});

export default router;