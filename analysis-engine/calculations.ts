export interface PropertyData {
  purchasePrice: number;
  shortTermNightlyRate?: number;
  annualOccupancy?: number;
  longTermRental?: number;
  leaseCycleGap?: number;
  propertyDescription?: string;
  deposit?: number;
  interestRate?: number;
  floorArea?: number;
  ratePerSquareMeter?: number;
}

export interface YieldAnalysis {
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  propertyDescription: string | null;
  deposit: number | null;
  depositPercentage: number | null;
  interestRate: number | null;
  monthlyBondRepayment: number | null;
  floorArea: number | null;
  ratePerSquareMeter: number | null;
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

  // Calculate monthly bond repayment if we have both deposit and interest rate
  let monthlyBondRepayment = null;
  if (data.deposit !== undefined && data.interestRate !== undefined) {
    const loanAmount = data.purchasePrice - data.deposit;
    const monthlyRate = (data.interestRate / 100) / 12;
    const numberOfPayments = 20 * 12; // 20-year term
    monthlyBondRepayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  }

  // Calculate deposit percentage if deposit is provided
  const depositPercentage = data.deposit ? (data.deposit / data.purchasePrice) * 100 : null;

  // Return calculated values along with passed-through form data
  return {
    // Calculated values
    shortTermGrossYield: shortTermGrossYield !== null ? Number(shortTermGrossYield.toFixed(2)) : null,
    longTermGrossYield: longTermGrossYield !== null ? Number(longTermGrossYield.toFixed(2)) : null,
    monthlyBondRepayment: monthlyBondRepayment !== null ? Number(monthlyBondRepayment.toFixed(2)) : null,
    depositPercentage: depositPercentage !== null ? Number(depositPercentage.toFixed(2)) : null,
    
    // Pass-through values from form
    propertyDescription: data.propertyDescription || null,
    deposit: data.deposit || null,
    interestRate: data.interestRate || null,
    floorArea: data.floorArea || null,
    ratePerSquareMeter: data.ratePerSquareMeter || null,
    
    // Analysis summary
    analysis: {
      shortTermAnnualRevenue,
      longTermAnnualRevenue,
      purchasePrice: data.purchasePrice
    }
  };
}
