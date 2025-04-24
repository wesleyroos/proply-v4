/**
 * Interface representing a comparable property from sales data
 */
export interface ComparableProperty {
  similarity: string | number; // Can be a number (0-100) or string like "Similar" or "Comparable"
  address: string;
  salePrice: number;
  size: number;
  pricePerSqM: number;
  bedrooms: number;
  saleDate: string;
  url?: string; // Link to the property listing
}

/**
 * Interface representing the full response from the comparable sales API
 */
export interface ComparableSalesData {
  properties: ComparableProperty[];
  averageSalePrice: number;
}

/**
 * Interface for the OpenAI-generated suburb sentiment analysis
 */
export interface SuburbSentiment {
  name: string;
  description: string;
  investmentPotential: string;
  developmentActivity: string;
  trend: string;
  safetyRating?: number;
  amenitiesRating?: number;
  schoolsRating?: number;
  transportRating?: number;
}