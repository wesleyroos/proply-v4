import express from "express";
import fetch from "node-fetch";

const router = express.Router();

/**
 * Get the Google Maps API key from environment variables
 * @returns The API key or throws an error if not found
 */
function getGoogleMapsApiKey(): string {
  // Try to get the API key from import.meta.env first (Vite style)
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
  
  if (!apiKey) {
    throw new Error("Google Maps API key is not configured");
  }
  
  return apiKey;
}

// Helper function to generate mock validation response
function getMockValidationResponse(address: string) {
  const hasPostalCode = /\d{4}/.test(address);
  const isComplete = address.includes('Cape Town') || address.includes('Johannesburg');
  
  return {
    result: {
      verdict: {
        addressComplete: isComplete,
        hasUnconfirmedComponents: !hasPostalCode,
        hasInferredComponents: false,
        hasReplacedComponents: false
      },
      address: {
        formattedAddress: address,
        addressComponents: [
          {
            componentName: address.split(',')[0].trim(),
            componentType: "route"
          },
          {
            componentName: address.includes('Cape Town') ? 'Cape Town' : 'Johannesburg',
            componentType: "locality"
          },
          {
            componentName: address.includes('Cape Town') ? 'Western Cape' : 'Gauteng',
            componentType: "administrative_area_level_1"
          },
          {
            componentName: hasPostalCode ? address.match(/\d{4}/)?.[0] || '8001' : '8001',
            componentType: "postal_code"
          },
          {
            componentName: "South Africa",
            componentType: "country"
          }
        ]
      }
    }
  };
}

// Endpoint to validate an address
router.post("/validate", async (req, res) => {
  try {
    const { address, testMode } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }

    // Use mock data if test mode is enabled
    const useMockData = testMode === true;
    
    if (useMockData) {
      console.log("Using mock address validation data");
      return res.json(getMockValidationResponse(address));
    }

    let apiKey: string;
    try {
      apiKey = getGoogleMapsApiKey();
    } catch (error) {
      console.error("API Key error:", error);
      console.log("Falling back to mock validation data due to API key issue");
      return res.json(getMockValidationResponse(address));
    }
    
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
      console.log("Falling back to mock validation data due to API error");
      return res.json(getMockValidationResponse(address));
    }
    
    return res.json(data);
  } catch (error) {
    console.error("Error validating address:", error);
    return res.status(500).json({ error: "Failed to validate address" });
  }
});

// Helper function to generate mock address suggestions for development
function getMockAddressSuggestions(input: string) {
  const inputLower = input.toLowerCase();
  let suggestions = [];
  
  // Cape Town addresses
  if (inputLower.includes('leeuwen') || inputLower.includes('cape')) {
    suggestions = [
      {
        place_id: "mock_place_id_1",
        description: "27 Leeuwen St, Cape Town City Centre, Cape Town, 8001, South Africa",
        structured_formatting: {
          main_text: "27 Leeuwen St",
          secondary_text: "Cape Town City Centre, Cape Town, 8001, South Africa"
        }
      },
      {
        place_id: "mock_place_id_2",
        description: "25 Leeuwen St, Cape Town City Centre, Cape Town, 8001, South Africa",
        structured_formatting: {
          main_text: "25 Leeuwen St",
          secondary_text: "Cape Town City Centre, Cape Town, 8001, South Africa"
        }
      }
    ];
  } else {
    // Default suggestions
    suggestions = [
      {
        place_id: "mock_place_id_3",
        description: inputLower + " Street, Cape Town, 8000, South Africa",
        structured_formatting: {
          main_text: inputLower + " Street",
          secondary_text: "Cape Town, 8000, South Africa"
        }
      },
      {
        place_id: "mock_place_id_4",
        description: inputLower + " Avenue, Johannesburg, 2000, South Africa",
        structured_formatting: {
          main_text: inputLower + " Avenue",
          secondary_text: "Johannesburg, 2000, South Africa"
        }
      }
    ];
  }
  
  return {
    predictions: suggestions,
    status: "OK"
  };
}

// Endpoint for address autocomplete suggestions
router.get("/autocomplete", async (req, res) => {
  try {
    const { input, testMode } = req.query;
    
    if (!input) {
      return res.status(400).json({ error: "Input is required" });
    }

    // Use mock data if test mode is enabled or if we don't have a valid API key
    const useMockData = testMode === 'true';
    
    if (useMockData) {
      console.log("Using mock address suggestions data");
      return res.json(getMockAddressSuggestions(input as string));
    }
    
    let apiKey: string;
    try {
      apiKey = getGoogleMapsApiKey();
    } catch (error) {
      console.error("API Key error:", error);
      console.log("Falling back to mock address data due to API key issue");
      return res.json(getMockAddressSuggestions(input as string));
    }
    
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
      console.log("Falling back to mock address data due to API error");
      return res.json(getMockAddressSuggestions(input as string));
    }
    
    return res.json(data);
  } catch (error) {
    console.error("Error getting address suggestions:", error);
    return res.status(500).json({ error: "Failed to get address suggestions" });
  }
});

export default router;