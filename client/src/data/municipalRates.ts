/**
 * Municipal Rates Data
 * 
 * This file contains Rate-in-the-Rand values for different municipalities,
 * used to calculate property rates based on municipal property values.
 * 
 * Formula: Property Rates = Municipal Value × Rate-in-the-Rand
 * 
 * Note: These rates should be updated annually as municipalities publish
 * new rates for each financial year.
 */

export interface MunicipalRate {
  municipality: string;
  rateInTheRand: number;
  financialYear: string;
  lastUpdated: string;
}

/**
 * Municipal Rates Database
 * Contains Rate-in-the-Rand values for different municipalities
 */
export const municipalRates: MunicipalRate[] = [
  {
    municipality: "Cape Town",
    rateInTheRand: 0.006631,
    financialYear: "2024/2025",
    lastUpdated: "2025-04-02"
  },
  {
    municipality: "Johannesburg",
    rateInTheRand: 0.009125,
    financialYear: "2024/2025",
    lastUpdated: "2025-04-02"
  },
  // Add other municipalities here as needed
];

/**
 * Calculate monthly property rates based on municipal value and municipality
 * 
 * @param municipalValue The municipal value of the property
 * @param municipality The municipality where the property is located (defaults to "Cape Town")
 * @returns Monthly property rates in Rand
 */
export function calculateMonthlyRates(municipalValue: number, municipality: string = "Cape Town"): number {
  // Find the rate for the specified municipality
  const rate = municipalRates.find(r => r.municipality === municipality);
  
  if (!rate) {
    // If municipality not found, default to Cape Town rate
    const defaultRate = municipalRates.find(r => r.municipality === "Cape Town");
    if (!defaultRate) return 0; // Safeguard in case the data is empty
    
    // Calculate annual rates and divide by 12 for monthly
    return (municipalValue * defaultRate.rateInTheRand) / 12;
  }
  
  // Calculate annual rates and divide by 12 for monthly
  return (municipalValue * rate.rateInTheRand) / 12;
}

/**
 * Get a list of all available municipalities
 * 
 * @returns Array of municipality names
 */
export function getAvailableMunicipalities(): string[] {
  return municipalRates.map(rate => rate.municipality);
}

/**
 * Estimate monthly costs based on property value
 * This includes rates plus an estimate for water, electricity, and other municipal services
 * 
 * @param municipalValue The municipal value of the property 
 * @param municipality The municipality where the property is located
 * @returns Estimated total monthly costs
 */
export function estimateMonthlyMunicipalCosts(municipalValue: number, municipality: string = "Cape Town"): number {
  // Get the base rates
  const monthlyRates = calculateMonthlyRates(municipalValue, municipality);
  
  // Add estimated costs for other services (approximately 40% on top of rates for a typical property)
  // This is a simplified estimate and could be refined with more detailed data
  const estimatedOtherCosts = monthlyRates * 0.4;
  
  return monthlyRates + estimatedOtherCosts;
}