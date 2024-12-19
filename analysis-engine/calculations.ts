export interface PropertyData {
  // Property Details
  address: string;
  propertyLink?: string;
  purchasePrice: number;
  floorArea: number;
  beds: number;
  baths: number;
  parkings: number;

  // Financing Details
  depositAmount: number;
  depositPercentage: number;
  interestRate: number;
  termYears: number;

  // Operating Expenses
  levies: number;
  ratesTaxes: number;
  otherExpenses: number;
  maintenance: number;  // percentage
  managementFee: number;  // percentage

  // Revenue Performance
  nightlyRate: number;
  occupancy: number;  // percentage
  longTermRental: number;
  leaseCycleGap: number;  // in days

  // Escalations
  incomeGrowth: number;  // percentage
  expenseGrowth: number;  // percentage
  annualAppreciation: number;  // percentage

  // Miscellaneous
  avgRatePerM2: number;
  comments?: string;
}

export interface YieldAnalysis {
  // Property Details
  address: string;
  propertyLink: string | null;
  purchasePrice: number;
  floorArea: number;
  beds: number;
  baths: number;
  parkings: number;
  avgRatePerM2: number;

  // Financial Analysis
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  depositAmount: number;
  depositPercentage: number;
  interestRate: number;
  monthlyBondRepayment: number;
  termYears: number;

  // Operating Costs
  monthlyLevies: number;
  monthlyRatesTaxes: number;
  monthlyOtherExpenses: number;
  maintenancePercentage: number;
  managementFeePercentage: number;
  totalMonthlyExpenses: number;

  // Revenue Analysis
  shortTermMonthly: number | null;
  shortTermAnnual: number | null;
  longTermMonthly: number | null;
  longTermAnnual: number | null;
  occupancyRate: number;
  nightlyRate: number | null;
  leaseCycleGap: number;

  // Growth Projections
  incomeGrowth: number;
  expenseGrowth: number;
  annualAppreciation: number;

  // Miscellaneous
  comments: string | null;
}

export function calculateYields(data: PropertyData): YieldAnalysis {
  // Calculate short-term revenue
  const shortTermMonthly = data.nightlyRate * 30 * (data.occupancy / 100);
  const shortTermAnnual = shortTermMonthly * 12;
  const shortTermGrossYield = (shortTermAnnual / data.purchasePrice) * 100;

  // Calculate long-term revenue with lease cycle gap adjustment
  const occupiedDays = 365 - data.leaseCycleGap;
  const occupancyRatio = occupiedDays / 365;
  const longTermMonthly = data.longTermRental;
  const longTermAnnual = longTermMonthly * 12 * occupancyRatio;
  const longTermGrossYield = (longTermAnnual / data.purchasePrice) * 100;

  // Calculate monthly bond repayment
  const loanAmount = data.purchasePrice - data.depositAmount;
  const monthlyRate = (data.interestRate / 100) / 12;
  const numberOfPayments = data.termYears * 12;
  const monthlyBondRepayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  // Calculate total monthly expenses
  const totalMonthlyExpenses = 
    data.levies + 
    data.ratesTaxes + 
    data.otherExpenses + 
    (data.purchasePrice * (data.maintenance / 100) / 12) +
    (shortTermMonthly * (data.managementFee / 100));

  return {
    // Property Details
    address: data.address,
    propertyLink: data.propertyLink || null,
    purchasePrice: data.purchasePrice,
    floorArea: data.floorArea,
    beds: data.beds,
    baths: data.baths,
    parkings: data.parkings,
    avgRatePerM2: data.avgRatePerM2,

    // Financial Analysis
    shortTermGrossYield: Number(shortTermGrossYield.toFixed(2)),
    longTermGrossYield: Number(longTermGrossYield.toFixed(2)),
    depositAmount: data.depositAmount,
    depositPercentage: data.depositPercentage,
    interestRate: data.interestRate,
    monthlyBondRepayment: Number(monthlyBondRepayment.toFixed(2)),
    termYears: data.termYears,

    // Operating Costs
    monthlyLevies: data.levies,
    monthlyRatesTaxes: data.ratesTaxes,
    monthlyOtherExpenses: data.otherExpenses,
    maintenancePercentage: data.maintenance,
    managementFeePercentage: data.managementFee,
    totalMonthlyExpenses: Number(totalMonthlyExpenses.toFixed(2)),

    // Revenue Analysis
    shortTermMonthly: Number(shortTermMonthly.toFixed(2)),
    shortTermAnnual: Number(shortTermAnnual.toFixed(2)),
    longTermMonthly: Number(longTermMonthly.toFixed(2)),
    longTermAnnual: Number(longTermAnnual.toFixed(2)),
    occupancyRate: data.occupancy,
    nightlyRate: data.nightlyRate,
    leaseCycleGap: data.leaseCycleGap,

    // Growth Projections
    incomeGrowth: data.incomeGrowth,
    expenseGrowth: data.expenseGrowth,
    annualAppreciation: data.annualAppreciation,

    // Miscellaneous
    comments: data.comments || null
  };
}
