// Utility functions for formatting currency and percentages

// Format currency values consistently
export const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `R${(value / 1000).toFixed(2)}k`;
  }
  return `R${value.toFixed(2)}`;
};

// Format percentage values consistently
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// ZAR currency formatter for detailed amounts
export const formatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});