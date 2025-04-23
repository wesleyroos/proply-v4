/**
 * Interface representing a comparable property from sales data
 */
export interface ComparableProperty {
  similarity: string; // "Similar" or "Comparable"
  address: string;
  salePrice: number;
  size: number;
  pricePerSqM: number;
  bedrooms: number;
  saleDate: string;
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