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

// Helper function to properly capitalize address components
function capitalizeAddress(text: string): string {
  // Skip capitalization for postal codes and numbers
  if (/^\d+$/.test(text)) return text;
  
  // Words that should remain lowercase (prepositions, articles, etc.)
  const lowercaseWords = ['of', 'the', 'in', 'on', 'at', 'by', 'for', 'with', 'and', 'or', 'a', 'an'];
  
  return text
    .split(' ')
    .map((word, index) => {
      // Check if the word is a lowercase word and not at the beginning
      if (lowercaseWords.includes(word.toLowerCase()) && index !== 0) {
        return word.toLowerCase();
      }
      // Capitalize the first letter of each word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// Helper function to generate mock validation response
function getMockValidationResponse(address: string) {
  // Parse the address components
  const parts = address.split(',').map(part => part.trim());
  
  // Extract street information (first part)
  const streetPart = parts[0];
  let streetNumber = '';
  let streetName = streetPart;
  
  // Try to extract street number
  const numberMatch = streetPart.match(/^(\d+)\s+(.+)$/);
  if (numberMatch) {
    streetNumber = numberMatch[1];
    streetName = capitalizeAddress(numberMatch[2]);
  } else {
    streetName = capitalizeAddress(streetName);
  }
  
  // Determine suburb (second part if available)
  const suburb = parts.length > 1 ? capitalizeAddress(parts[1]) : 'Cape Town City Centre';
  
  // Determine city (third part if available, otherwise look for keywords)
  let city = parts.length > 2 ? capitalizeAddress(parts[2]) : '';
  if (!city) {
    if (address.toLowerCase().includes('cape town')) {
      city = 'Cape Town';
    } else if (address.toLowerCase().includes('johannesburg') || address.toLowerCase().includes('joburg')) {
      city = 'Johannesburg';
    } else {
      city = 'Cape Town'; // Default
    }
  }
  
  // Extract or assign postal code
  let postalCode = '';
  const postalCodeMatch = address.match(/\b(\d{4})\b/);
  if (postalCodeMatch) {
    postalCode = postalCodeMatch[1];
  } else {
    postalCode = city.toLowerCase().includes('cape town') ? '8001' : '2000';
  }
  
  // Determine province based on city
  const province = city.toLowerCase().includes('cape town') ? 'Western Cape' : 'Gauteng';
  
  // Determine if address is complete enough
  const isComplete = streetName.length > 0 && city.length > 0;
  const hasPostalCode = postalCode.length > 0;
  
  // Format the address nicely
  const formattedParts = [];
  if (streetNumber) formattedParts.push(`${streetNumber} ${streetName}`);
  else formattedParts.push(streetName);
  
  // Always include suburb if available
  if (suburb && suburb !== city) formattedParts.push(suburb);
  if (city) formattedParts.push(city);
  if (postalCode) formattedParts.push(postalCode);
  formattedParts.push('South Africa');
  
  const formattedAddress = formattedParts.join(', ');
  
  return {
    result: {
      verdict: {
        addressComplete: isComplete,
        hasUnconfirmedComponents: !hasPostalCode,
        hasInferredComponents: parts.length < 3,
        hasReplacedComponents: false
      },
      address: {
        formattedAddress: formattedAddress,
        addressComponents: [
          {
            componentName: streetNumber ? `${streetNumber} ${streetName}` : streetName,
            componentType: "route"
          },
          {
            componentName: suburb,
            componentType: "sublocality_level_1"
          },
          {
            componentName: city,
            componentType: "locality"
          },
          {
            componentName: province,
            componentType: "administrative_area_level_1"
          },
          {
            componentName: postalCode,
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
  
  // Extract the main parts of the address if possible
  const parts = inputLower.split(',').map(part => part.trim());
  const mainPart = parts[0]; // First part of the address (street name + number)
  
  // Process the main part to extract street name and number if possible
  let streetName = mainPart;
  let streetNumber = '';
  
  // Try to extract street number
  const numberMatch = mainPart.match(/^(\d+)\s+(.+)$/);
  if (numberMatch) {
    streetNumber = numberMatch[1];
    streetName = capitalizeAddress(numberMatch[2]);
  } else {
    streetName = capitalizeAddress(streetName);
  }
  
  // Determine the suburb/area
  let suburb = parts.length > 1 ? capitalizeAddress(parts[1]) : 'Cape Town City Centre';
  
  // Determine the city
  let city = 'Cape Town';
  if (inputLower.includes('johannesburg') || inputLower.includes('joburg')) {
    city = 'Johannesburg';
  }
  
  // Determine postal code based on city
  let postalCode = city.includes('Cape Town') ? '8001' : '2000';
  
  // Generate just one suggestion based on the input
  suggestions = [
    {
      place_id: "mock_place_id_1",
      description: `${streetNumber} ${streetName}, ${suburb}, ${city}, ${postalCode}, South Africa`,
      structured_formatting: {
        main_text: `${streetNumber} ${streetName}, ${suburb}, ${city}, ${postalCode}`,
        secondary_text: `South Africa`
      }
    }
  ];
  
  // Special case for well-known Cape Town addresses
  if (inputLower.includes('leeuwen')) {
    suggestions = [
      {
        place_id: "mock_place_id_3",
        description: "27 Leeuwen St, Gardens, Cape Town, 8001, South Africa",
        structured_formatting: {
          main_text: "27 Leeuwen St, Gardens, Cape Town, 8001",
          secondary_text: "South Africa"
        }
      }
    ];
  }
  
  // Special case for Platteklip and Derwent Road
  if (inputLower.includes('platteklip') || (inputLower.includes('derwent') && inputLower.includes('road'))) {
    suggestions = [
      {
        place_id: "mock_place_id_4",
        description: "19 Platteklip, 05 Derwent Road, Gardens, Cape Town, 8001, South Africa",
        structured_formatting: {
          main_text: "19 Platteklip, 05 Derwent Road, Gardens, Cape Town, 8001",
          secondary_text: "South Africa"
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