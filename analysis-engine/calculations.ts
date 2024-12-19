export interface PropertyData {
  purchasePrice: number;
  shortTermNightlyRate?: number;
  annualOccupancy?: number;
  longTermRental?: number;
  leaseCycleGap?: number;
}

export interface YieldAnalysis {
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
  };
}

export function calculateYields(data: PropertyData): YieldAnalysis {
  let shortTermGrossYield = null;
  let longTermGrossYield = null;
  let shortTermAnnualRevenue = null;
  let longTermAnnualRevenue = null;

  // Calculate short-term rental yield if data is available
  if (data.shortTermNightlyRate && data.annualOccupancy) {
    shortTermAnnualRevenue = data.shortTermNightlyRate * 365 * (data.annualOccupancy / 100);
    shortTermGrossYield = (shortTermAnnualRevenue / data.purchasePrice) * 100;
  }

  // Calculate long-term rental yield if data is available
  if (data.longTermRental) {
    // Calculate days of vacancy due to lease cycle gap
    const vacancyDays = data.leaseCycleGap || 0;
    const occupiedDays = 365 - vacancyDays;
    const occupancyRatio = occupiedDays / 365;
    
    longTermAnnualRevenue = data.longTermRental * 12 * occupancyRatio;
    longTermGrossYield = (longTermAnnualRevenue / data.purchasePrice) * 100;
  }

  return {
    shortTermGrossYield: shortTermGrossYield !== null ? Number(shortTermGrossYield.toFixed(2)) : null,
    longTermGrossYield: longTermGrossYield !== null ? Number(longTermGrossYield.toFixed(2)) : null,
    analysis: {
      shortTermAnnualRevenue,
      longTermAnnualRevenue,
      purchasePrice: data.purchasePrice
    }
  };
}
