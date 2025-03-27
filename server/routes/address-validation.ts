import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Endpoint to validate an address
router.post("/validate", async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    // Format the request according to Google's Address Validation API
    const response = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: {
            addressLines: [address]
          },
          enableUspsCass: true
        })
      }
    );

    const data = await response.json() as any;
    
    // Check if the API call was successful
    if (data.error) {
      console.error("Google Address Validation API error:", data.error);
      return res.status(500).json({ error: "Failed to validate address" });
    }
    
    return res.json(data);
  } catch (error) {
    console.error("Error validating address:", error);
    return res.status(500).json({ error: "Failed to validate address" });
  }
});

// Endpoint for address autocomplete suggestions
router.get("/autocomplete", async (req, res) => {
  try {
    const { input } = req.query;
    
    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    // Call the Google Places Autocomplete API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input as string
      )}&types=address&key=${apiKey}`
    );

    const data = await response.json() as any;
    
    // Check if the API call was successful
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data.status);
      return res.status(500).json({ error: "Failed to get address suggestions" });
    }
    
    return res.json(data);
  } catch (error) {
    console.error("Error getting address suggestions:", error);
    return res.status(500).json({ error: "Failed to get address suggestions" });
  }
});

export default router;