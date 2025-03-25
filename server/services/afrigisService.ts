import fetch from 'node-fetch';

// AfriGIS Authentication and API URLs
const AFRIGIS_CLIENT_ID = process.env.AFRIGIS_CLIENT_ID || 'rmu83bqbrfter58ckmfj2a5m6';
const AFRIGIS_CLIENT_SECRET = process.env.AFRIGIS_CLIENT_SECRET || 'ftni6b2egm26v7uhm87b5eej7l7c1aopn475v9pvq3lnl7gukeu';
const AFRIGIS_API_KEY = process.env.AFRIGIS_API_KEY || 'ylc26apV506P5fh8v4ymD7UCE7f1jchHEzHovQl8';

const GEOCODING_URL = 'https://services.afrigis.co.za/rest/2/geocode.json';
const PROPERTY_ANALYSIS_URL = 'https://services.afrigis.co.za/rest/2/Property_Analysis.xml';

interface GeocodingResult {
  seoid?: string;
  placeId?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
}

interface PropertyAnalysisResult {
  erfSize?: number;
  buildingSize?: number;
  pricePerSquareMeter?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  historicalSales?: Array<{
    date: string;
    price: number;
  }>;
  zoning?: string;
  propertyType?: string;
}

/**
 * Geocode an address to get its SEOID or Place ID
 * @param address - The address to geocode
 * @returns - The geocoding result including SEOID/placeId
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  try {
    console.log(`Geocoding address: ${address}`);
    
    const params = new URLSearchParams({
      query: address,
      clientId: AFRIGIS_CLIENT_ID,
      clientSecret: AFRIGIS_CLIENT_SECRET,
      apiKey: AFRIGIS_API_KEY
    });

    const response = await fetch(`${GEOCODING_URL}?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AfriGIS Geocoding API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as any;
    console.log('Geocoding response:', JSON.stringify(data, null, 2));
    
    // Extract the SEOID or placeId from the response
    if (data?.result?.length > 0) {
      const firstResult = data.result[0];
      
      return {
        seoid: firstResult.seoid,
        placeId: firstResult.placeId,
        formattedAddress: firstResult.address?.formattedAddress,
        latitude: firstResult.location?.lat,
        longitude: firstResult.location?.lng
      };
    }
    
    throw new Error('No geocoding results found for this address');
  } catch (error) {
    console.error('Error in geocodeAddress:', error);
    throw error;
  }
}

/**
 * Get property analysis data using a SEOID
 * @param seoid - The SEOID of the property
 * @returns - Property analysis data
 */
export async function getPropertyAnalysis(seoid: string): Promise<PropertyAnalysisResult> {
  try {
    console.log(`Getting property analysis for SEOID: ${seoid}`);
    
    const params = new URLSearchParams({
      seoid,
      clientId: AFRIGIS_CLIENT_ID,
      clientSecret: AFRIGIS_CLIENT_SECRET,
      apiKey: AFRIGIS_API_KEY
    });

    const response = await fetch(`${PROPERTY_ANALYSIS_URL}?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AfriGIS Property Analysis API error: ${response.statusText} - ${errorText}`);
    }

    // Parse XML response - using text and simple parsing for now
    // In a production environment, you might want to use an XML parser library
    const xmlData = await response.text();
    console.log('Property Analysis XML response:', xmlData);
    
    // Extract the relevant data using regex or simple string parsing
    // This is a simplified approach - consider using a proper XML parser in production
    const propertyData: PropertyAnalysisResult = {
      erfSize: extractValueFromXml(xmlData, 'erfSize'),
      buildingSize: extractValueFromXml(xmlData, 'buildingSize'),
      pricePerSquareMeter: extractValueFromXml(xmlData, 'pricePerSquareMeter'),
      lastSalePrice: extractValueFromXml(xmlData, 'lastSalePrice'),
      lastSaleDate: extractDateFromXml(xmlData, 'lastSaleDate'),
      zoning: extractStringFromXml(xmlData, 'zoning'),
      propertyType: extractStringFromXml(xmlData, 'propertyType')
    };
    
    // Extract historical sales if available
    const historicalSales: Array<{date: string, price: number}> = [];
    // Implementation would depend on the exact XML structure
    
    return propertyData;
  } catch (error) {
    console.error('Error in getPropertyAnalysis:', error);
    throw error;
  }
}

// Helper functions to extract values from XML
function extractValueFromXml(xml: string, tagName: string): number | undefined {
  const regex = new RegExp(`<${tagName}>(\\d+(\\.\\d+)?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? parseFloat(match[1]) : undefined;
}

function extractStringFromXml(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}>([^<]+)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : undefined;
}

function extractDateFromXml(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}>([^<]+)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : undefined;
}