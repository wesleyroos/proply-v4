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
  floorArea: z.number().positive(),
  ratePerSquareMeter: z.number().positive()
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
  floorArea: number;
  ratePerSquareMeter: number;

  // Revenue analysis
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
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
  if (data.shortTermNightlyRate && data.annualOccupancy) {
    shortTermAnnualRevenue = data.shortTermNightlyRate * 365 * (data.annualOccupancy / 100);
    shortTermGrossYield = (shortTermAnnualRevenue / data.purchasePrice) * 100;
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
  const numberOfPayments = 20 * 12; // 20-year term
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
    floorArea: data.floorArea,
    ratePerSquareMeter: data.ratePerSquareMeter,

    // Analysis summary
    analysis: {
      shortTermAnnualRevenue,
      longTermAnnualRevenue,
      purchasePrice: data.purchasePrice
    }
  };
}