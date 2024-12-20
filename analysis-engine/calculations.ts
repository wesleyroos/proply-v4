import { z } from "zod";

// Zod schema for input validation
const propertyDataSchema = z.object({
  purchasePrice: z.number().positive(),
  shortTermNightlyRate: z.number().positive().nullable().optional(),
  annualOccupancy: z.number().min(0).max(100).nullable().optional(),
  longTermRental: z.number().positive().nullable().optional(),
  leaseCycleGap: z.number().min(0).nullable().optional(),
  propertyDescription: z.string().nullable().optional(),
  address: z.string(),
  deposit: z.number().positive(),
  interestRate: z.number().min(0).max(100),
  loanTerm: z.number().min(1, "Loan term must be at least 1 year"),
  floorArea: z.number().positive(),
  ratePerSquareMeter: z.number().positive(),
  incomeGrowthRate: z.number().min(0).max(100).default(5)
});

// TypeScript type derived from Zod schema
export type PropertyData = z.infer<typeof propertyDataSchema>;

export interface AnalysisResult {
  // Financial metrics
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  monthlyBondRepayment: number;
  depositPercentage: number;

  // Property details
  propertyDescription: string | null;
  address: string;
  deposit: number;
  interestRate: number;
  loanTerm: number;
  floorArea: number;
  ratePerSquareMeter: number;

  // Revenue analysis
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
    revenueProjections: {
      shortTerm: {
        year1: number;
        year2: number;
        year4: number;
        year5: number;
        year10: number;
        year20: number;
      } | null;
    };
  };
}

export function calculateYields(inputData: PropertyData): AnalysisResult {
  console.log('Calculating yields with input data:', inputData);

  // Validate input data
  const data = propertyDataSchema.parse(inputData);
  
  // Initialize revenue calculations
  let shortTermGrossYield: number | null = null;
  let shortTermAnnualRevenue: number | null = null;
  let longTermGrossYield: number | null = null;
  let longTermAnnualRevenue: number | null = null;

  // Calculate short-term rental metrics
  let revenueProjections = null;
  if (data.shortTermNightlyRate && data.annualOccupancy) {
    // Calculate platform fee based on management fee presence
    const platformFeeRate = data.managementFee > 0 ? 0.15 : 0.03;
    const feeAdjustedNightlyRate = data.shortTermNightlyRate * (1 - platformFeeRate);
    
    // Calculate base annual revenue (Year 1)
    shortTermAnnualRevenue = feeAdjustedNightlyRate * 365 * (data.annualOccupancy / 100);
    shortTermGrossYield = (shortTermAnnualRevenue / data.purchasePrice) * 100;

    // Calculate revenue projections for future years
    const growthRate = (data.incomeGrowthRate || 5) / 100;
    revenueProjections = {
      shortTerm: {
        year1: shortTermAnnualRevenue,
        year2: shortTermAnnualRevenue * Math.pow(1 + growthRate, 1),
        year4: shortTermAnnualRevenue * Math.pow(1 + growthRate, 3),
        year5: shortTermAnnualRevenue * Math.pow(1 + growthRate, 4),
        year10: shortTermAnnualRevenue * Math.pow(1 + growthRate, 9),
        year20: shortTermAnnualRevenue * Math.pow(1 + growthRate, 19)
      }
    };
  }

  // Calculate long-term rental metrics
  if (data.longTermRental) {
    const vacancyDays = data.leaseCycleGap || 0;
    const occupiedDays = 365 - vacancyDays;
    const occupancyRatio = occupiedDays / 365;
    
    longTermAnnualRevenue = data.longTermRental * 12 * occupancyRatio;
    longTermGrossYield = (longTermAnnualRevenue / data.purchasePrice) * 100;
  }

  // Calculate bond repayment
  const loanAmount = data.purchasePrice - data.deposit;
  const monthlyRate = (data.interestRate / 100) / 12;
  const numberOfPayments = data.loanTerm * 12; // Use actual loan term from input
  const monthlyBondRepayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  // Calculate deposit percentage
  const depositPercentage = (data.deposit / data.purchasePrice) * 100;

  return {
    // Financial calculations with precise number formatting
    shortTermGrossYield: shortTermGrossYield !== null ? Number(shortTermGrossYield.toFixed(2)) : null,
    longTermGrossYield: longTermGrossYield !== null ? Number(longTermGrossYield.toFixed(2)) : null,
    monthlyBondRepayment: Number(monthlyBondRepayment.toFixed(2)),
    depositPercentage: Number(depositPercentage.toFixed(2)),

    // Property details (passing through validated data)
    propertyDescription: data.propertyDescription,
    address: data.address,
    deposit: data.deposit,
    interestRate: data.interestRate,
    loanTerm: data.loanTerm,
    floorArea: data.floorArea,
    ratePerSquareMeter: data.ratePerSquareMeter,

    // Analysis summary
    analysis: {
      shortTermAnnualRevenue,
      longTermAnnualRevenue,
      purchasePrice: data.purchasePrice,
      revenueProjections: {
        shortTerm: revenueProjections?.shortTerm || null
      }
    }
  };
}