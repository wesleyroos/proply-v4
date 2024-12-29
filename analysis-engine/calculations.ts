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
      year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    } | null;
    longTermNetOperatingIncome: {
      year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
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
  roiWithoutAppreciation: number;
  roiWithAppreciation: number;
  irr: number;
  netWorthChange: number;
}

function calculateYearlyInvestmentMetrics(
  year: number,
  noi: number,
  annualCashflow: number,
  purchasePrice: number,
  deposit: number,
  propertyValueIncrease: number,
  grossRevenue: number,
  monthlyBondRepayment: number,
  initialLoanAmount: number,
  loanTerm: number,
): InvestmentYearMetrics {
  // 1. Calculate Annual Cashflow (NOI - Debt Service)
  const annualDebtService = monthlyBondRepayment * 12;
  console.log(`Year ${year} - Step 1: Annual Cashflow`, {
    noi,
    annualDebtService,
    annualCashflow
  });

  // 2. Calculate Annual Property Appreciation
  const appreciationRate = propertyValueIncrease / 100;
  const startOfYearValue = purchasePrice * Math.pow(1 + appreciationRate, year - 1);
  const endOfYearValue = purchasePrice * Math.pow(1 + appreciationRate, year);
  const annualAppreciation = endOfYearValue - startOfYearValue;

  console.log(`Year ${year} - Step 2: Property Appreciation`, {
    appreciationRate,
    startOfYearValue,
    endOfYearValue,
    annualAppreciation
  });

  // 3. Calculate Equity Gain from Loan Paydown
  const monthlyRate = 0.09 / 12; // 9% annual interest rate
  const totalPayments = loanTerm * 12;
  const startOfYearPayments = (year - 1) * 12;
  const endOfYearPayments = year * 12;

  const startOfYearBalance = year === 1 ? initialLoanAmount :
    initialLoanAmount *
    (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, startOfYearPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);

  const endOfYearBalance = initialLoanAmount *
    (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, endOfYearPayments)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);

  const annualEquityGain = startOfYearBalance - endOfYearBalance;

  console.log(`Year ${year} - Step 3: Equity Gain`, {
    startOfYearBalance,
    endOfYearBalance,
    annualEquityGain
  });

  // Calculate Net Worth Change
  const netWorthChange = annualCashflow + annualAppreciation + annualEquityGain;

  console.log(`Year ${year} - Final Net Worth Change`, {
    components: {
      annualCashflow,
      annualAppreciation,
      annualEquityGain
    },
    total: netWorthChange
  });

  return {
    grossYield: (grossRevenue / purchasePrice) * 100,
    netYield: (noi - annualDebtService) / purchasePrice * 100,
    returnOnEquity: (noi / deposit) * 100,
    annualReturn: ((noi + annualAppreciation) / purchasePrice) * 100,
    capRate: (noi / endOfYearValue) * 100,
    cashOnCashReturn: (annualCashflow / deposit) * 100,
    roiWithoutAppreciation: (noi / (deposit + purchasePrice)) * 100,
    roiWithAppreciation: ((noi + annualAppreciation) / (deposit + purchasePrice)) * 100,
    irr: calculateIRR(year, deposit, annualCashflow, annualAppreciation),
    netWorthChange
  };
}

function calculateNetYieldWithFinancing(
  noi: number,
  annualDebtService: number,
  purchasePrice: number
): number {
  return (noi - annualDebtService) / purchasePrice * 100;
}

function calculateIRR(
  year: number,
  initialInvestment: number,
  annualCashflow: number,
  appreciation: number
): number {
  const totalReturn = (annualCashflow * year) + appreciation;
  const averageAnnualReturn = totalReturn / year;
  return (averageAnnualReturn / initialInvestment) * 100;
}

function calculateRemainingLoanBalance(
  year: number,
  initialLoanAmount: number,
  loanTerm: number
): number {
  const monthlyRate = 0.09 / 12;
  const totalPayments = loanTerm * 12;
  const paymentsCompleted = year * 12;

  return initialLoanAmount *
    (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, paymentsCompleted)) /
    (Math.pow(1 + monthlyRate, totalPayments) - 1);
}

export function calculateYields(inputData: PropertyData): AnalysisResult {
  console.log('=== Starting Property Analysis ===');
  console.log('Raw Input Data:', JSON.stringify(inputData, null, 2));

  // Validate input data
  const data = propertyDataSchema.parse(inputData);
  console.log('Validated Data after Schema Parse:', {
    monthlyLevies: data.monthlyLevies,
    monthlyRatesTaxes: data.monthlyRatesTaxes,
    otherMonthlyExpenses: data.otherMonthlyExpenses,
    maintenancePercent: data.maintenancePercent,
    managementFee: data.managementFee
  });

  // Initialize revenue calculations
  let shortTermGrossYield: number | null = null;
  let shortTermAnnualRevenue: number | null = null;
  let longTermGrossYield: number | null = null;
  let longTermAnnualRevenue: number | null = null;
  let revenueProjections = { shortTerm: null, longTerm: null };
  let netOperatingIncome: { [key: string]: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number } } | null = null;
  let longTermNetOperatingIncome: { [key: string]: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number } } | null = null;

  // Initialize and log all expense-related input values
  console.log('=== Starting Property Analysis ===');
  console.log('Raw request body:', JSON.stringify(inputData, null, 2));
  console.log('Converted property data:', JSON.stringify(data, null, 2));

  // Initialize and log all expense-related input values
  console.log('Expense Input Values:', {
    monthlyLevies: data.monthlyLevies,
    monthlyRatesTaxes: data.monthlyRatesTaxes,
    otherMonthlyExpenses: data.otherMonthlyExpenses,
    maintenancePercent: data.maintenancePercent,
    managementFee: data.managementFee
  });

  // Calculate fixed monthly expenses with explicit number conversions
  const fixedMonthlyExpenses = Number(data.monthlyLevies || 0) + Number(data.monthlyRatesTaxes || 0) + Number(data.otherMonthlyExpenses || 0);

  console.log('Fixed Monthly Expenses Breakdown:', {
    monthlyLevies: Number(data.monthlyLevies || 0),
    monthlyRatesTaxes: Number(data.monthlyRatesTaxes || 0),
    otherMonthlyExpenses: Number(data.otherMonthlyExpenses || 0),
    total: fixedMonthlyExpenses
  });
  let maintenanceExpense = 0;
  let managementFeeExpense = 0;
  let totalMonthlyExpenses = fixedMonthlyExpenses; // Initialize with fixed expenses
  let baseAnnualExpenses = 0;

  console.log('Initial Fixed Monthly Expenses:', {
    fixedMonthlyExpenses,
    breakdown: {
      monthlyLevies: Number(data.monthlyLevies || 0),
      monthlyRatesTaxes: Number(data.monthlyRatesTaxes || 0),
      otherMonthlyExpenses: Number(data.otherMonthlyExpenses || 0)
    }
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

    // Calculate gross monthly revenue and expenses
    const annualGrossRevenue = data.shortTermNightlyRate * 365 * (data.annualOccupancy / 100);
    const grossMonthlyRevenue = annualGrossRevenue / 12;

    // Calculate maintenance and management fees based on gross revenue
    maintenanceExpense = (grossMonthlyRevenue * Number(data.maintenancePercent || 0)) / 100;
    managementFeeExpense = (grossMonthlyRevenue * Number(data.managementFee || 0)) / 100;

    console.log('Gross Revenue Calculations:', {
      annualGrossRevenue,
      grossMonthlyRevenue,
      maintenanceExpense,
      managementFeeExpense
    });

    // Update total monthly expenses (fixed + variable)
    totalMonthlyExpenses = fixedMonthlyExpenses + maintenanceExpense + managementFeeExpense;

    console.log('Revenue-based Expense Calculation Details:', {
      grossMonthlyRevenue,
      maintenanceCalc: {
        percent: Number(data.maintenancePercent || 0),
        amount: maintenanceExpense
      },
      managementCalc: {
        percent: Number(data.managementFee || 0),
        amount: managementFeeExpense
      },
      totalMonthlyExpenses
    });

    console.log('Revenue-based Monthly Expenses:', {
      grossMonthlyRevenue,
      maintenanceExpense,
      managementFeeExpense,
      maintenancePercent: Number(data.maintenancePercent || 0),
      managementFee: Number(data.managementFee || 0),
      totalMonthlyExpenses
    });

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

  // Calculate total monthly expenses by summing all components
  totalMonthlyExpenses = fixedMonthlyExpenses + maintenanceExpense + managementFeeExpense;

  console.log('Monthly Expense Calculation Details:', {
    components: {
      fixedMonthlyExpenses,
      maintenanceExpense,
      managementFeeExpense
    },
    breakdown: {
      monthlyLevies: data.monthlyLevies,
      monthlyRatesTaxes: data.monthlyRatesTaxes,
      otherMonthlyExpenses: data.otherMonthlyExpenses,
      maintenancePercent: data.maintenancePercent,
      managementFee: data.managementFee
    },
    totalMonthlyExpenses,
    shortTermAnnualRevenue
  });

  // Calculate annual expenses (NOE)
  console.log('Monthly Expense Components:', {
    fixed: {
      monthlyLevies: data.monthlyLevies,
      monthlyRatesTaxes: data.monthlyRatesTaxes,
      otherMonthlyExpenses: data.otherMonthlyExpenses,
      total: fixedMonthlyExpenses
    },
    variable: {
      maintenance: maintenanceExpense,
      management: managementFeeExpense,
      total: maintenanceExpense + managementFeeExpense
    },
    total: totalMonthlyExpenses
  });

  // Calculate base annual expenses (before growth)
  baseAnnualExpenses = totalMonthlyExpenses * 12;

  // Year 1 is base expenses (no growth applied)
  const noeYear1 = baseAnnualExpenses;

  console.log('Annual NOE Calculation:', {
    monthlyExpenses: totalMonthlyExpenses,
    baseAnnualExpenses,
    noeYear1,
    breakdown: {
      fixed: fixedMonthlyExpenses * 12,
      maintenance: maintenanceExpense * 12,
      management: managementFeeExpense * 12
    }
  });

  console.log('Final Annual Expense Calculations:', {
    monthlyBreakdown: {
      fixedMonthlyExpenses,
      maintenanceExpense,
      managementFeeExpense,
      totalMonthlyExpenses,
    },
    calculations: {
      baseAnnualExpenses,
      expenseGrowthRate: data.expenseGrowthRate,
      noeYear1
    },
    expenseComponents: {
      monthlyLevies: data.monthlyLevies,
      monthlyRatesTaxes: data.monthlyRatesTaxes,
      otherMonthlyExpenses: data.otherMonthlyExpenses,
      maintenancePercent: data.maintenancePercent,
      managementFee: data.managementFee
    }
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
  // Start with noeYear1 (which already includes first year's growth)
  const expenseGrowthRate = data.expenseGrowthRate / 100;
  const operatingExpenses = {
    year1: baseAnnualExpenses,  // No growth in first year
    year2: baseAnnualExpenses * (1 + expenseGrowthRate),
    year3: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 2),
    year4: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 3),
    year5: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 4),
    year10: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 9),
    year20: baseAnnualExpenses * Math.pow(1 + expenseGrowthRate, 19)
  };

  // Calculate Net Operating Income and Net Worth Change for each year

  function calculateAnnualNetWorthChange(
    year: number,
    annualRevenue: number,
    annualExpenses: number,
    propertyData: PropertyData,
    initialLoanAmount: number,
    monthlyBondPayment: number
  ): {
    value: number;
    annualCashflow: number;
    cumulativeRentalIncome: number;
    netWorthChange: number;
  } {
    // 1. Calculate annual cashflow (most straightforward)
    const noi = annualRevenue - annualExpenses;
    const annualBondPayment = monthlyBondPayment * 12;
    const annualCashflow = noi - annualBondPayment;

    // 2. Calculate this year's appreciation
    const appreciationRate = propertyData.annualAppreciation / 100;
    const startOfYearValue = propertyData.purchasePrice * Math.pow(1 + appreciationRate, year - 1);
    const endOfYearValue = propertyData.purchasePrice * Math.pow(1 + appreciationRate, year);
    const annualAppreciation = endOfYearValue - startOfYearValue;

    // 3. Calculate this year's equity gain from loan paydown
    const monthlyRate = (propertyData.interestRate / 100) / 12;
    const totalPayments = propertyData.loanTerm * 12;

    // Start of year loan balance
    const startOfYearPayments = (year - 1) * 12;
    const startOfYearBalance = year === 1 ? initialLoanAmount :
      initialLoanAmount * (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, startOfYearPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);

    // End of year loan balance
    const endOfYearPayments = year * 12;
    const endOfYearBalance = initialLoanAmount *
      (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, endOfYearPayments)) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);

    const annualEquityGain = startOfYearBalance - endOfYearBalance;

    // Calculate total net worth change for this year
    const netWorthChange = annualCashflow + annualAppreciation + annualEquityGain;

    console.log(`Year ${year} Net Worth Change Calculation:`, {
      annualCashflow: {
        noi,
        annualBondPayment,
        annualCashflow,
        calculation: `${noi} - ${annualBondPayment} = ${annualCashflow}`
      },
      annualAppreciation: {
        startOfYearValue,
        endOfYearValue,
        annualAppreciation,
        calculation: `${endOfYearValue} - ${startOfYearValue} = ${annualAppreciation}`
      },
      annualEquityGain: {
        startOfYearBalance,
        endOfYearBalance,
        annualEquityGain,
        calculation: `${startOfYearBalance} - ${endOfYearBalance} = ${annualEquityGain}`
      },
      netWorthChange: {
        components: [annualCashflow, annualAppreciation, annualEquityGain],
        calculation: `${annualCashflow} + ${annualAppreciation} + ${annualEquityGain} = ${netWorthChange}`
      }
    });

    return {
      value: noi,
      annualCashflow,
      cumulativeRentalIncome: annualCashflow,
      netWorthChange
    };
  }

  netOperatingIncome = revenueProjections?.shortTerm ? {
    year1: calculateAnnualNetWorthChange(1, revenueProjections.shortTerm.year1, operatingExpenses.year1, data, loanAmount, monthlyBondRepayment),
    year2: calculateAnnualNetWorthChange(2, revenueProjections.shortTerm.year2, operatingExpenses.year2, data, loanAmount, monthlyBondRepayment),
    year3: calculateAnnualNetWorthChange(3, revenueProjections.shortTerm.year3, operatingExpenses.year3, data, loanAmount, monthlyBondRepayment),
    year4: calculateAnnualNetWorthChange(4, revenueProjections.shortTerm.year4, operatingExpenses.year4, data, loanAmount, monthlyBondRepayment),
    year5: calculateAnnualNetWorthChange(5, revenueProjections.shortTerm.year5, operatingExpenses.year5, data, loanAmount, monthlyBondRepayment),
    year10: calculateAnnualNetWorthChange(10, revenueProjections.shortTerm.year10, operatingExpenses.year10, data, loanAmount, monthlyBondRepayment),
    year20: calculateAnnualNetWorthChange(20, revenueProjections.shortTerm.year20, operatingExpenses.year20, data, loanAmount, monthlyBondRepayment)
  } : null;

  longTermNetOperatingIncome = revenueProjections?.longTerm ? {
    year1: calculateAnnualNetWorthChange(1, revenueProjections.longTerm.year1, operatingExpenses.year1, data, loanAmount, monthlyBondRepayment),
    year2: calculateAnnualNetWorthChange(2, revenueProjections.longTerm.year2, operatingExpenses.year2, data, loanAmount, monthlyBondRepayment),
    year3: calculateAnnualNetWorthChange(3, revenueProjections.longTerm.year3, operatingExpenses.year3, data, loanAmount, monthlyBondRepayment),
    year4: calculateAnnualNetWorthChange(4, revenueProjections.longTerm.year4, operatingExpenses.year4, data, loanAmount, monthlyBondRepayment),
    year5: calculateAnnualNetWorthChange(5, revenueProjections.longTerm.year5, operatingExpenses.year5, data, loanAmount, monthlyBondRepayment),
    year10: calculateAnnualNetWorthChange(10, revenueProjections.longTerm.year10, operatingExpenses.year10, data, loanAmount, monthlyBondRepayment),
    year20: calculateAnnualNetWorthChange(20, revenueProjections.longTerm.year20, operatingExpenses.year20, data, loanAmount, monthlyBondRepayment)
  } : null;


  const investmentMetrics = {
    shortTerm: [
      calculateYearlyInvestmentMetrics(
        1,
        netOperatingIncome?.year1.value || 0,
        netOperatingIncome?.year1.annualCashflow || 0,
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
        netOperatingIncome?.year2.annualCashflow || 0,
        data.purchasePrice,
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
        netOperatingIncome?.year3.annualCashflow || 0,
        data.purchasePrice,
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
        netOperatingIncome?.year4.annualCashflow || 0,
        data.purchasePrice,
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
        netOperatingIncome?.year5.annualCashflow || 0,
        data.purchasePrice,
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
        netOperatingIncome?.year10.annualCashflow || 0,
        data.purchasePrice,
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
        netOperatingIncome?.year20.annualCashflow || 0,
        data.purchasePrice,
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
        longTermNetOperatingIncome?.year1.annualCashflow || 0,
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
        longTermNetOperatingIncome?.year2.annualCashflow || 0,
        data.purchasePrice,
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
        longTermNetOperatingIncome?.year3.annualCashflow || 0,
        data.purchasePrice,
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
        longTermNetOperatingIncome?.year4.annualCashflow || 0,
        data.purchasePrice,
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
        longTermNetOperatingIncome?.year5.annualCashflow || 0,
        data.purchasePrice,
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
        longTermNetOperatingIncome?.year10.annualCashflow || 0,
        data.purchasePrice,
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
        longTermNetOperatingIncome?.year20.annualCashflow || 0,
        data.purchasePrice,
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
    longTermGrossYield: longTermGrossYield !== null ? Number(longTermGrossYield.toFixed(2)): null,
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

  console.log('Final Analysis Result:', JSON.stringify(result, null, 2));
  console.log('Final Operating Expenses State:', {
    monthlyExpenses: totalMonthlyExpenses,
    annualExpenses: baseAnnualExpenses,
    expenseProjections: result.analysis.operatingExpenses
  });
  return result;
}