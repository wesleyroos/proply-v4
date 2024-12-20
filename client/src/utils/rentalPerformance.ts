// Seasonality factors for each month (Jan-Dec)
export const SEASONALITY_FACTORS = [2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03];

// Occupancy rates for different scenarios
export const OCCUPANCY_RATES = {
  low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 65],
  medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 80],
  high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
};

export const getSeasonalNightlyRate = (baseRate: number, monthIndex: number): number => {
  return baseRate * SEASONALITY_FACTORS[monthIndex];
};

export const getFeeAdjustedRate = (rate: number, isManaged: boolean, managementFee: number): number => {
  // If managed (management fee > 0), apply 15% platform fee, otherwise 3%
  const platformFeeRate = isManaged ? 0.15 : 0.03;
  return Math.round(rate * (1 - platformFeeRate));
};

export const calculateMonthlyRevenue = (
  scenario: 'low' | 'medium' | 'high',
  monthIndex: number,
  baseRate: number,
  isManaged: boolean,
  managementFee: number
): number => {
  // First get the fee-adjusted base rate
  const feeAdjustedBaseRate = getFeeAdjustedRate(baseRate, isManaged, managementFee);
  // Then apply seasonality to the fee-adjusted rate
  const seasonalRate = getSeasonalNightlyRate(feeAdjustedBaseRate, monthIndex);
  const daysInMonth = new Date(2024, monthIndex + 1, 0).getDate();
  const occupancyRate = OCCUPANCY_RATES[scenario][monthIndex] / 100;
  
  const monthlyRevenue = seasonalRate * daysInMonth * occupancyRate;
  return Math.round(monthlyRevenue * (1 - managementFee));
};

// Format numbers with 'R' prefix and proper thousands separators
export const formatter = (value: number): string => {
  return `R ${value.toLocaleString('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};
