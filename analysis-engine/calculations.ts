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
  monthlyLevies: z.number().min(0).optional().default(0),
  monthlyRatesTaxes: z.number().min(0).optional().default(0),
  otherMonthlyExpenses: z.number().min(0).optional().default(0),
  maintenancePercent: z.number().min(0).max(100).optional().default(0),
  managementFee: z.number().min(0).max(100).optional().default(0),
  annualAppreciation: z.number().min(0).max(100).optional().default(0)
}).transform((data) => {
  // Handle any necessary data transformations
  return {
    ...data,
    deposit: Number(data.deposit) || 0,
    ratePerSquareMeter: Number(data.ratePerSquareMeter) || 0
  };
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
        year3: number;
        year4: number;
        year5: number;
        year10: number;
        year20: number;
      } | null;
      longTerm: {
        year1: number;
        year2: number;
        year3: number;
        year4: number;
        year5: number;
        year10: number;
        year20: number;
      } | null;
    };
    operatingExpenses: {
      year1: number;
      year2: number;
      year3: number;
      year4: number;
      year5: number;
      year10: number;
      year20: number;
    };
    netOperatingIncome: {
      year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    } | null;
    longTermNetOperatingIncome: {
      year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
      year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number };
    } | null;
    investmentMetrics: {
      shortTerm: InvestmentYearMetrics[];
      longTerm: InvestmentYearMetrics[];
    };
  };
}

interface InvestmentYearMetrics {
  grossYield: number;
  netYield: number;
  returnOnEquity: number;
  annualReturn: number;
  capRate: number;
  cashOnCashReturn: number;
  irr: number;
  netWorthChange: number;
}

function calculateYearlyInvestmentMetrics(
  year: number,
  noi: number,
  purchasePrice: number,
  deposit: number,
  propertyValueIncrease: number,
  grossRevenue: number,
  monthlyBondRepayment: number,
  initialLoanAmount: number,
  loanTerm: number
): InvestmentYearMetrics {
  const annualDebtService = monthlyBondRepayment * 12;
  const appreciationRate = propertyValueIncrease / 100;

  // Calculate future property value considering appreciation
  const futurePropertyValue = purchasePrice * Math.pow(1 + appreciationRate, year);

  // Calculate annual cash flow (NOI - debt service)
  const annualCashflow = noi - annualDebtService;

  // Calculate total appreciation by this year
  const totalAppreciation = futurePropertyValue - purchasePrice;

  // Calculate the equity buildup through loan payments
  const monthlyRate = (11.75 / 100) / 12; // Using standard interest rate
  const monthsPassed = year * 12;
  const remainingLoanBalance = initialLoanAmount *
    (Math.pow(1 + monthlyRate, loanTerm * 12) - Math.pow(1 + monthlyRate, monthsPassed)) /
    (Math.pow(1 + monthlyRate, loanTerm * 12) - 1);
  const equityBuildup = initialLoanAmount - remainingLoanBalance;

  // Calculate net worth change (appreciation + equity buildup + annual cashflow)
  const netWorthChange = totalAppreciation + equityBuildup + annualCashflow;

  return {
    grossYield: (grossRevenue / purchasePrice) * 100,
    netYield: (noi - annualDebtService) / purchasePrice * 100,
    returnOnEquity: (noi / deposit) * 100,
    annualReturn: ((noi + equityBuildup + totalAppreciation) / purchasePrice) * 100, // Updated formula
    capRate: (noi / purchasePrice) * 100, // Purely operational metric
    cashOnCashReturn: ((noi - annualDebtService) / deposit) * 100,
    irr: calculateIRR(
      year,
      purchasePrice,
      annualCashflow + totalAppreciation,
      futurePropertyValue
    ),
    netWorthChange: netWorthChange
  };
}

function calculateNetYieldWithFinancing(
  noi: number,
  annualDebtService: number,
  purchasePrice: number
): number {
  return (noi - annualDebtService) / purchasePrice * 100;
}

function calculateNPV(rate: number, cashflows: number[]): number {
  return cashflows.reduce((npv, cf, t) => npv + cf / Math.pow(1 + rate, t), 0);
}

function calculateIRR(
  year: number,
  initialInvestment: number,
  annualCashflow: number,
  propertyValue: number
): number {
  // Initial investment is negative
  const cashflows = [-initialInvestment];

  // Add consistent annual cash flows
  for (let i = 1; i <= year; i++) {
    cashflows.push(annualCashflow);
  }

  // Add property value to final year (simulating sale)
  cashflows[cashflows.length - 1] += propertyValue;

  let rate = 0.05; // Start with 5% as initial guess
  const maxIterations = 1000;
  const tolerance = 0.00001;

  try {
    for (let i = 0; i < maxIterations; i++) {
      const npv = calculateNPV(rate, cashflows);

      if (Math.abs(npv) < tolerance) {
        break;
      }

      // Calculate NPV derivative for Newton-Raphson method
      const derivative = cashflows.reduce((sum, cf, t) => {
        return sum - (t * cf) / Math.pow(1 + rate, t + 1);
      }, 0);

      // Prevent division by zero
      if (Math.abs(derivative) < tolerance) {
        rate = 0;
        break;
      }

      // Update rate using Newton-Raphson formula
      const newRate = rate - npv / derivative;

      // Check for convergence
      if (Math.abs(newRate - rate) < tolerance) {
        rate = newRate;
        break;
      }

      // Prevent negative rates and rates > 100%
      if (newRate <= -1 || newRate > 1) {
        rate = 0;
        break;
      }

      rate = newRate;
    }
  } catch (error) {
    console.error('IRR calculation error:', error);
    rate = 0;
  }

  return rate * 100; // Convert to percentage
}

export function calculateYields(inputData: PropertyData): AnalysisResult {
  const data = propertyDataSchema.parse(inputData);
  let shortTermGrossYield: number | null = null;
  let shortTermAnnualRevenue: number | null = null;
  let longTermGrossYield: number | null = null;
  let longTermAnnualRevenue: number | null = null;
  let revenueProjections = { shortTerm: null, longTerm: null };
  let netOperatingIncome: { [key: string]: { value: number; annualCashflow: number; cumulativeRentalIncome: number } } | null = null;
  let longTermNetOperatingIncome: { [key: string]: { value: number; annualCashflow: number; cumulativeRentalIncome: number } } | null = null;

  // Calculate fixed monthly expenses
  const fixedMonthlyExpenses = Number(data.monthlyLevies || 0) + Number(data.monthlyRatesTaxes || 0) + Number(data.otherMonthlyExpenses || 0);
  let maintenanceExpense = 0;
  let managementFeeExpense = 0;
  let totalMonthlyExpenses = fixedMonthlyExpenses;
  let baseAnnualExpenses = 0;

  // Calculate short-term rental metrics
  if (data.shortTermNightlyRate && data.annualOccupancy) {
    const platformFeeRate = data.managementFee > 0 ? 0.15 : 0.03;
    const feeAdjustedNightlyRate = data.shortTermNightlyRate * (1 - platformFeeRate);

    shortTermAnnualRevenue = feeAdjustedNightlyRate * 365 * (data.annualOccupancy / 100);
    shortTermGrossYield = (shortTermAnnualRevenue / data.purchasePrice) * 100;

    const annualGrossRevenue = data.shortTermNightlyRate * 365 * (data.annualOccupancy / 100);
    const grossMonthlyRevenue = annualGrossRevenue / 12;

    maintenanceExpense = (grossMonthlyRevenue * Number(data.maintenancePercent || 0)) / 100;
    managementFeeExpense = (grossMonthlyRevenue * Number(data.managementFee || 0)) / 100;

    totalMonthlyExpenses = fixedMonthlyExpenses + maintenanceExpense + managementFeeExpense;

    const growthRate = data.incomeGrowthRate / 100;
    revenueProjections.shortTerm = {
      year1: shortTermAnnualRevenue,
      year2: shortTermAnnualRevenue * Math.pow(1 + growthRate, 1),
      year3: shortTermAnnualRevenue * Math.pow(1 + growthRate, 2),
      year4: shortTermAnnualRevenue * Math.pow(1 + growthRate, 3),
      year5: shortTermAnnualRevenue * Math.pow(1 + growthRate, 4),
      year10: shortTermAnnualRevenue * Math.pow(1 + growthRate, 9),
      year20: shortTermAnnualRevenue * Math.pow(1 + growthRate, 19)
    };
  }

  // Calculate long-term rental metrics
  if (data.longTermRental) {
    const vacancyDays = data.leaseCycleGap || 0;
    const occupiedDays = 365 - vacancyDays;
    const occupancyRatio = occupiedDays / 365;

    longTermAnnualRevenue = data.longTermRental * 12 * occupancyRatio;
    longTermGrossYield = (longTermAnnualRevenue / data.purchasePrice) * 100;
    revenueProjections.longTerm = {
      year1: longTermAnnualRevenue,
      year2: longTermAnnualRevenue * Math.pow(1 + data.incomeGrowthRate / 100, 1),
      year3: longTermAnnualRevenue * Math.pow(1 + data.incomeGrowthRate / 100, 2),
      year4: longTermAnnualRevenue * Math.pow(1 + data.incomeGrowthRate / 100, 3),
      year5: longTermAnnualRevenue * Math.pow(1 + data.incomeGrowthRate / 100, 4),
      year10: longTermAnnualRevenue * Math.pow(1 + data.incomeGrowthRate / 100, 9),
      year20: longTermAnnualRevenue * Math.pow(1 + data.incomeGrowthRate / 100, 19)
    };
  }

  totalMonthlyExpenses = fixedMonthlyExpenses + maintenanceExpense + managementFeeExpense;
  baseAnnualExpenses = totalMonthlyExpenses * 12;

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
    year2: baseAnnualExpenses * (1 + expenseGrowthRate),
    year3: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 2),
    year4: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 3),
    year5: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 4),
    year10: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 9),
    year20: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 19)
  };

  // Calculate Net Operating Income for each year
  netOperatingIncome = revenueProjections?.shortTerm ? {
    year1: { value: revenueProjections.shortTerm.year1 - operatingExpenses.year1, annualCashflow: revenueProjections.shortTerm.year1 - operatingExpenses.year1 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.shortTerm.year1 - operatingExpenses.year1 - (monthlyBondRepayment * 12) },
    year2: { value: revenueProjections.shortTerm.year2 - operatingExpenses.year2, annualCashflow: revenueProjections.shortTerm.year2 - operatingExpenses.year2 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.shortTerm.year2 - operatingExpenses.year2 - (monthlyBondRepayment * 12) },
    year3: { value: revenueProjections.shortTerm.year3 - operatingExpenses.year3, annualCashflow: revenueProjections.shortTerm.year3 - operatingExpenses.year3 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.shortTerm.year3 - operatingExpenses.year3 - (monthlyBondRepayment * 12) },
    year4: { value: revenueProjections.shortTerm.year4 - operatingExpenses.year4, annualCashflow: revenueProjections.shortTerm.year4 - operatingExpenses.year4 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.shortTerm.year4 - operatingExpenses.year4 - (monthlyBondRepayment * 12) },
    year5: { value: revenueProjections.shortTerm.year5 - operatingExpenses.year5, annualCashflow: revenueProjections.shortTerm.year5 - operatingExpenses.year5 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.shortTerm.year5 - operatingExpenses.year5 - (monthlyBondRepayment * 12) },
    year10: { value: revenueProjections.shortTerm.year10 - operatingExpenses.year10, annualCashflow: revenueProjections.shortTerm.year10 - operatingExpenses.year10 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.shortTerm.year10 - operatingExpenses.year10 - (monthlyBondRepayment * 12) },
    year20: { value: revenueProjections.shortTerm.year20 - operatingExpenses.year20, annualCashflow: revenueProjections.shortTerm.year20 - operatingExpenses.year20 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.shortTerm.year20 - operatingExpenses.year20 - (monthlyBondRepayment * 12) }
  } : null;

  longTermNetOperatingIncome = revenueProjections?.longTerm ? {
    year1: { value: revenueProjections.longTerm.year1 - operatingExpenses.year1, annualCashflow: revenueProjections.longTerm.year1 - operatingExpenses.year1 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.longTerm.year1 - operatingExpenses.year1 - (monthlyBondRepayment * 12) },
    year2: { value: revenueProjections.longTerm.year2 - operatingExpenses.year2, annualCashflow: revenueProjections.longTerm.year2 - operatingExpenses.year2 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.longTerm.year2 - operatingExpenses.year2 - (monthlyBondRepayment * 12) },
    year3: { value: revenueProjections.longTerm.year3 - operatingExpenses.year3, annualCashflow: revenueProjections.longTerm.year3 - operatingExpenses.year3 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.longTerm.year3 - operatingExpenses.year3 - (monthlyBondRepayment * 12) },
    year4: { value: revenueProjections.longTerm.year4 - operatingExpenses.year4, annualCashflow: revenueProjections.longTerm.year4 - operatingExpenses.year4 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.longTerm.year4 - operatingExpenses.year4 - (monthlyBondRepayment * 12) },
    year5: { value: revenueProjections.longTerm.year5 - operatingExpenses.year5, annualCashflow: revenueProjections.longTerm.year5 - operatingExpenses.year5 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.longTerm.year5 - operatingExpenses.year5 - (monthlyBondRepayment * 12) },
    year10: { value: revenueProjections.longTerm.year10 - operatingExpenses.year10, annualCashflow: revenueProjections.longTerm.year10 - operatingExpenses.year10 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.longTerm.year10 - operatingExpenses.year10 - (monthlyBondRepayment * 12) },
    year20: { value: revenueProjections.longTerm.year20 - operatingExpenses.year20, annualCashflow: revenueProjections.longTerm.year20 - operatingExpenses.year20 - (monthlyBondRepayment * 12), cumulativeRentalIncome: revenueProjections.longTerm.year20 - operatingExpenses.year20 - (monthlyBondRepayment * 12) }
  } : null;

  const investmentMetrics = {
    shortTerm: [
      calculateYearlyInvestmentMetrics(
        1,
        netOperatingIncome?.year1.value || 0,
        data.purchasePrice,
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.shortTerm?.year1 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        2,
        netOperatingIncome?.year2.value || 0,
        data.purchasePrice * (1 + data.annualAppreciation / 100),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.shortTerm?.year2 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        3,
        netOperatingIncome?.year3.value || 0,
        data.purchasePrice * Math.pow(1 + data.annualAppreciation / 100, 2),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.shortTerm?.year3 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        4,
        netOperatingIncome?.year4.value || 0,
        data.purchasePrice * Math.pow(1 + data.annualAppreciation / 100, 3),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.shortTerm?.year4 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        5,
        netOperatingIncome?.year5.value || 0,
        data.purchasePrice * Math.pow(1 + data.annualAppreciation / 100, 4),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.shortTerm?.year5 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        10,
        netOperatingIncome?.year10.value || 0,
        data.purchasePrice * Math.pow(1 + data.annualAppreciation / 100, 9),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.shortTerm?.year10 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        20,
        netOperatingIncome?.year20.value || 0,
        data.purchasePrice * Math.pow(1 + data.annualAppreciation / 100, 19),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.shortTerm?.year20 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      )
    ],
    longTerm: [
      calculateYearlyInvestmentMetrics(
        1,
        longTermNetOperatingIncome?.year1.value || 0,
        data.purchasePrice,
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.longTerm?.year1 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        2,
        longTermNetOperatingIncome?.year2.value || 0,
        data.purchasePrice * (1 + data.annualAppreciation / 100),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.longTerm?.year2 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        3,
        longTermNetOperatingIncome?.year3.value || 0,
        data.purchasePrice * Math.pow(1 + data.annualAppreciation / 100, 2),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.longTerm?.year3 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        4,
        longTermNetOperatingIncome?.year4.value || 0,
        data.purchasePrice * Math.pow(1 + data.annualAppreciation / 100, 3),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.longTerm?.year4 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        5,
        longTermNetOperatingIncome?.year5.value || 0,
        data.purchasePrice * Math.pow(1 + data.annualAppreciation / 100, 4),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.longTerm?.year5 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        10,
        longTermNetOperatingIncome?.year10.value || 0,
        data.purchasePrice * Math.pow(1 + data.annualAppreciation / 100, 9),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.longTerm?.year10 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      ),
      calculateYearlyInvestmentMetrics(
        20,
        longTermNetOperatingIncome?.year20.value || 0,
        data.purchasePrice * Math.pow(1 + data.annualAppreciation / 100, 19),
        data.deposit,
        data.annualAppreciation,
        revenueProjections?.longTerm?.year20 || 0,
        monthlyBondRepayment,
        loanAmount,
        data.loanTerm
      )
    ]
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
      revenueProjections,
      operatingExpenses,
      netOperatingIncome,
      longTermNetOperatingIncome,
      investmentMetrics
    }
  };

  // Calculate current property rate per square meter
  const currentPropertyRatePerSqm = data.purchasePrice / data.floorArea;
  
  return {
    ...result,
    currentPropertyRatePerSqm,
    rateDifference: data.ratePerSquareMeter - currentPropertyRatePerSqm
  };
}