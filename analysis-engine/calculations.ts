export interface PropertyData {
  purchasePrice: number;
  shortTermNightlyRate?: number;
  annualOccupancy?: number;
  longTermRental?: number;
  leaseCycleGap?: number;
  propertyDescription?: string | null;
  deposit?: number;
  interestRate?: number;
  floorArea?: number;
  ratePerSquareMeter?: number;
}

export interface YieldAnalysis {
  // Financial calculations
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  monthlyBondRepayment: number | null;
  depositPercentage: number | null;

  // Pass-through property details
  propertyDescription: string | null;
  deposit: number | null;
  interestRate: number | null;
  floorArea: number | null;
  ratePerSquareMeter: number | null;

  // Analysis summary
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
  };
}

export function calculateYields(data: PropertyData): YieldAnalysis {
  console.log('Calculating yields with data:', data);
  
  // Initialize calculation variables
  let shortTermGrossYield = null;
  let longTermGrossYield = null;
  let shortTermAnnualRevenue = null;
  let longTermAnnualRevenue = null;
  let monthlyBondRepayment = null;
  let depositPercentage = null;

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
  if (data.deposit !== undefined && data.interestRate !== undefined) {
    const loanAmount = data.purchasePrice - data.deposit;
    const monthlyRate = (data.interestRate / 100) / 12;
    const numberOfPayments = 20 * 12; // 20-year term
    monthlyBondRepayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  }

  // Calculate deposit percentage if deposit is provided
  if (data.deposit !== undefined) {
    depositPercentage = (data.deposit / data.purchasePrice) * 100;
  }

  // Format the result with proper type handling
  const result = {
    // Calculated values (with proper number formatting)
    shortTermGrossYield: shortTermGrossYield !== null ? Number(shortTermGrossYield.toFixed(2)) : null,
    longTermGrossYield: longTermGrossYield !== null ? Number(longTermGrossYield.toFixed(2)) : null,
    monthlyBondRepayment: monthlyBondRepayment !== null ? Number(monthlyBondRepayment.toFixed(2)) : null,
    depositPercentage: depositPercentage !== null ? Number(depositPercentage.toFixed(2)) : null,

    // Pass-through values from form (with explicit null handling)
    propertyDescription: data.propertyDescription ?? null,
    deposit: typeof data.deposit === 'number' ? Number(data.deposit) : null,
    interestRate: typeof data.interestRate === 'number' ? Number(data.interestRate) : null,
    floorArea: typeof data.floorArea === 'number' ? Number(data.floorArea) : null,
    ratePerSquareMeter: typeof data.ratePerSquareMeter === 'number' ? Number(data.ratePerSquareMeter) : null,

    // Analysis summary
    analysis: {
      shortTermAnnualRevenue,
      longTermAnnualRevenue,
      purchasePrice: data.purchasePrice
    }
  };

  console.log('Analysis result:', result);
  return result;
}