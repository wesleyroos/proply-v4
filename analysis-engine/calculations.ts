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
  annualPropertyAppreciation: z.number().min(0).max(100),
  monthlyLevies: z.number().min(0).optional().default(0),
  monthlyRatesTaxes: z.number().min(0).optional().default(0),
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
      year1: number;
      year2: number;
      year4: number;
      year5: number;
      year10: number;
      year20: number;
    } | null;
  };
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
  let revenueProjections = null;

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
    revenueProjections = {
      shortTerm: {
        year1: shortTermAnnualRevenue,
        year2: shortTermAnnualRevenue * Math.pow(1 + growthRate, 1),
        year3: shortTermAnnualRevenue * Math.pow(1 + growthRate, 2),
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

  // Calculate loan and payment details
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

  // Calculate Net Operating Income (Revenue - Operating Expenses) for each year
  const netOperatingIncome = revenueProjections?.shortTerm ? {
    year1: revenueProjections.shortTerm.year1 - operatingExpenses.year1,
    year2: revenueProjections.shortTerm.year2 - operatingExpenses.year2,
    year3: revenueProjections.shortTerm.year3 - operatingExpenses.year3,
    year4: revenueProjections.shortTerm.year4 - operatingExpenses.year4,
    year5: revenueProjections.shortTerm.year5 - operatingExpenses.year5,
    year10: revenueProjections.shortTerm.year10 - operatingExpenses.year10,
    year20: revenueProjections.shortTerm.year20 - operatingExpenses.year20
  } : null;

  // Calculate asset growth metrics for all projection years
  const years = [1, 2, 3, 4, 5, 10, 20];
  const totalPayments = numberOfPayments; // Use the already calculated numberOfPayments
  
  const assetGrowthMetrics = years.reduce((acc, year) => {
    const monthsPaid = year * 12;
    const remainingPayments = totalPayments - monthsPaid;
    
    // Calculate property value and appreciation
    const propertyValue = data.purchasePrice * Math.pow(1 + (data.annualPropertyAppreciation / 100), year);
    const startValue = year > 1 
      ? data.purchasePrice * Math.pow(1 + (data.annualPropertyAppreciation / 100), year - 1)
      : data.purchasePrice;
    const annualAppreciation = propertyValue - startValue;
    
    // Calculate loan balance and equity from repayment
    const loanBalance = remainingPayments > 0 
      ? (loanAmount * (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, monthsPaid))) 
        / (Math.pow(1 + monthlyRate, totalPayments) - 1)
      : 0;
    const equityFromRepayment = loanAmount - loanBalance;
    
    // Calculate total interest paid
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) 
      / (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const totalPaid = monthsPaid * monthlyPayment;
    const principalPaid = loanAmount - loanBalance;
    const interestPaid = totalPaid - principalPaid;
    
    // Calculate interest-to-principal ratio for current payment
    const interestPayment = loanBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    const interestToPrincipalRatio = (interestPayment / principalPayment) * 100;
    
    // Calculate total equity (including appreciation)
    const totalEquity = propertyValue - loanBalance;
    
    // Calculate net worth change components
    const cumulativeCashflow = years
      .filter(y => y <= year)
      .reduce((acc, y) => {
        const prevYearKey = `year${y}` as keyof typeof netOperatingIncome;
        return acc + (netOperatingIncome?.[prevYearKey] ? 
          (netOperatingIncome[prevYearKey] - (monthlyBondRepayment * 12)) : 0);
      }, 0);
    
    const totalAppreciation = propertyValue - data.purchasePrice;
    const netWorthChange = equityFromRepayment + totalAppreciation + cumulativeCashflow;
    
    // Store all metrics for this year
    acc[`year${year}`] = {
      propertyValue,
      annualAppreciation,
      loanBalance,
      totalInterestPaid: interestPaid,
      interestToPrincipalRatio,
      totalEquity,
      equityFromRepayment,
      netWorthChange
    };
    
    return acc;
  }, {} as Record<string, {
    propertyValue: number;
    annualAppreciation: number;
    loanBalance: number;
    totalInterestPaid: number;
    interestToPrincipalRatio: number;
    totalEquity: number;
    equityFromRepayment: number;
    netWorthChange: number;
  }>);

  // Log the complete metrics for debugging
  console.log('Asset Growth Metrics:', assetGrowthMetrics);

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
      operatingExpenses,
      netOperatingIncome,
      assetGrowthMetrics
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