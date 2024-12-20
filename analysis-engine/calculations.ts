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
  incomeGrowthRate: z.number().min(0).max(100).optional().default(8),
  expenseGrowthRate: z.number().min(0).max(100).optional().default(6),
  levies: z.number().min(0).optional().default(0),
  ratesAndTaxes: z.number().min(0).optional().default(0),
  otherMonthlyExpenses: z.number().min(0).optional().default(0),
  maintenancePercent: z.number().min(0).max(100).optional().default(0),
  managementFee: z.number().min(0).max(100).optional().default(0)
});

export type PropertyData = z.infer<typeof propertyDataSchema>;

export interface AnalysisResult {
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  monthlyBondRepayment: number;
  depositPercentage: number;
  propertyDescription: string | null;
  address: string;
  deposit: number;
  interestRate: number;
  loanTerm: number;
  floorArea: number;
  ratePerSquareMeter: number;
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
    operatingExpenses: {
      year1: number;
      year2: number;
      year4: number;
      year5: number;
      year10: number;
      year20: number;
    };
  };
}

export function calculateYields(inputData: PropertyData): AnalysisResult {
  console.log('=== Starting Property Analysis ===');
  console.log('Input data:', JSON.stringify(inputData, null, 2));
  
  // Validate input data
  const data = propertyDataSchema.parse(inputData);
  
  // Initialize revenue calculations
  let shortTermGrossYield: number | null = null;
  let shortTermAnnualRevenue: number | null = null;
  let longTermGrossYield: number | null = null;
  let longTermAnnualRevenue: number | null = null;
  let revenueProjections = null;

  // Initialize expense variables
  let fixedMonthlyExpenses = (data.levies || 0) + (data.ratesAndTaxes || 0) + (data.otherMonthlyExpenses || 0);
  let maintenanceExpense = 0;
  let managementFeeExpense = 0;
  let totalMonthlyExpenses = 0;
  let baseAnnualExpenses = 0;

  console.log('Initial expense values:', {
    levies: data.levies,
    ratesAndTaxes: data.ratesAndTaxes,
    otherMonthlyExpenses: data.otherMonthlyExpenses,
    fixedMonthlyExpenses
  });

  // Calculate short-term rental metrics
  if (data.shortTermNightlyRate && data.annualOccupancy) {
    const platformFeeRate = data.managementFee > 0 ? 0.15 : 0.03;
    const feeAdjustedNightlyRate = data.shortTermNightlyRate * (1 - platformFeeRate);
    
    shortTermAnnualRevenue = feeAdjustedNightlyRate * 365 * (data.annualOccupancy / 100);
    shortTermGrossYield = (shortTermAnnualRevenue / data.purchasePrice) * 100;

    console.log('Short-term Revenue Calculations:', {
      nightlyRate: data.shortTermNightlyRate,
      platformFeeRate,
      feeAdjustedNightlyRate,
      occupancyRate: data.annualOccupancy,
      annualRevenue: shortTermAnnualRevenue
    });

    // Update maintenance and management fee expenses based on revenue
    maintenanceExpense = (shortTermAnnualRevenue * (data.maintenancePercent || 0)) / 100 / 12;
    managementFeeExpense = (shortTermAnnualRevenue * (data.managementFee || 0)) / 100 / 12;

    console.log('Variable Expenses:', {
      maintenanceExpense,
      managementFeeExpense,
      maintenancePercent: data.maintenancePercent,
      managementFee: data.managementFee
    });

    const growthRate = data.incomeGrowthRate / 100;
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

  // Calculate total monthly and annual expenses
  totalMonthlyExpenses = fixedMonthlyExpenses + maintenanceExpense + managementFeeExpense;
  baseAnnualExpenses = totalMonthlyExpenses * 12;

  console.log('Final Expense Calculations:', {
    fixedMonthlyExpenses,
    maintenanceExpense,
    managementFeeExpense,
    totalMonthlyExpenses,
    baseAnnualExpenses
  });

  // Calculate bond repayment
  const loanAmount = data.purchasePrice - data.deposit;
  const monthlyRate = (data.interestRate / 100) / 12;
  const numberOfPayments = data.loanTerm * 12;
  const monthlyBondRepayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  // Calculate deposit percentage
  const depositPercentage = (data.deposit / data.purchasePrice) * 100;

  // Calculate operating expenses projections
  const expenseGrowthRate = data.expenseGrowthRate / 100;
  const operatingExpenses = {
    year1: baseAnnualExpenses,
    year2: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 1),
    year4: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 3),
    year5: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 4),
    year10: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 9),
    year20: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 19)
  };

  const result = {
    shortTermGrossYield: shortTermGrossYield !== null ? Number(shortTermGrossYield.toFixed(2)) : null,
    longTermGrossYield: longTermGrossYield !== null ? Number(longTermGrossYield.toFixed(2)) : null,
    monthlyBondRepayment: Number(monthlyBondRepayment.toFixed(2)),
    depositPercentage: Number(depositPercentage.toFixed(2)),
    propertyDescription: data.propertyDescription || null,
    address: data.address,
    deposit: data.deposit,
    interestRate: data.interestRate,
    loanTerm: data.loanTerm,
    floorArea: data.floorArea,
    ratePerSquareMeter: data.ratePerSquareMeter,
    analysis: {
      shortTermAnnualRevenue,
      longTermAnnualRevenue,
      purchasePrice: data.purchasePrice,
      revenueProjections: {
        shortTerm: revenueProjections?.shortTerm || null
      },
      operatingExpenses
    }
  };

  console.log('Final Analysis Result:', JSON.stringify(result, null, 2));
  return result;
}
