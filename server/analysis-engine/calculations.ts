import { PropertyAnalysisInput } from "../services/propertyAnalysis";

interface CalculateYieldsInput {
  purchasePrice: number;
  deposit: number;
  ratePerSquareMeter: number;
  address: string;
  interestRate: number;
  loanTerm: number;
  floorArea: number;
  incomeGrowthRate: number;
  expenseGrowthRate: number;
  propertyAppreciationRate: number;
  monthlyLevies: number;
  monthlyRatesTaxes: number;
  otherMonthlyExpenses: number;
  maintenancePercentage: number;
  managementFeePercentage: number;
  shortTermNightlyRate: number;
  avgOccupancyRate: number;
  longTermMonthlyRental: number;
  propertyDescription?: string;
}

export function calculateYields(input: CalculateYieldsInput) {
  // Calculate loan amount
  const loanAmount = input.purchasePrice - input.deposit;
  
  // Calculate monthly bond payment using the mortgage formula
  const monthlyInterestRate = input.interestRate / 12;
  const numberOfPayments = input.loanTerm * 12;
  const monthlyBondPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
                            (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

  // Calculate annual expenses
  const annualLevies = input.monthlyLevies * 12;
  const annualRatesTaxes = input.monthlyRatesTaxes * 12;
  const annualOtherExpenses = input.otherMonthlyExpenses * 12;
  const annualBondPayments = monthlyBondPayment * 12;

  // Calculate short term rental income
  const shortTermAnnualRevenue = input.shortTermNightlyRate * 365 * input.avgOccupancyRate;
  const shortTermManagementFees = shortTermAnnualRevenue * input.managementFeePercentage;
  const shortTermMaintenanceCosts = shortTermAnnualRevenue * input.maintenancePercentage;

  // Calculate long term rental income
  const longTermAnnualRevenue = input.longTermMonthlyRental * 12;
  const longTermManagementFees = longTermAnnualRevenue * input.managementFeePercentage;
  const longTermMaintenanceCosts = longTermAnnualRevenue * input.maintenancePercentage;

  // Calculate total expenses for both scenarios
  const baseAnnualExpenses = annualLevies + annualRatesTaxes + annualOtherExpenses + annualBondPayments;
  
  const totalShortTermExpenses = baseAnnualExpenses + shortTermManagementFees + shortTermMaintenanceCosts;
  const totalLongTermExpenses = baseAnnualExpenses + longTermManagementFees + longTermMaintenanceCosts;

  // Calculate net operating income
  const shortTermNOI = shortTermAnnualRevenue - totalShortTermExpenses;
  const longTermNOI = longTermAnnualRevenue - totalLongTermExpenses;

  // Calculate yields
  const shortTermGrossYield = (shortTermAnnualRevenue / input.purchasePrice) * 100;
  const longTermGrossYield = (longTermAnnualRevenue / input.purchasePrice) * 100;
  const shortTermNetYield = (shortTermNOI / input.purchasePrice) * 100;
  const longTermNetYield = (longTermNOI / input.purchasePrice) * 100;

  // Calculate price per square meter metrics
  const pricePerSqm = input.purchasePrice / input.floorArea;
  const pricePerSqmDiff = input.ratePerSquareMeter - pricePerSqm;
  const pricePerSqmDiffPercentage = (pricePerSqmDiff / input.ratePerSquareMeter) * 100;

  return {
    propertyDetails: {
      address: input.address,
      purchasePrice: input.purchasePrice,
      floorArea: input.floorArea,
      description: input.propertyDescription,
    },
    financingDetails: {
      deposit: input.deposit,
      loanAmount,
      monthlyBondPayment,
      annualBondPayments,
    },
    operatingExpenses: {
      annualLevies,
      annualRatesTaxes,
      annualOtherExpenses,
      baseAnnualExpenses,
      totalShortTermExpenses,
      totalLongTermExpenses,
    },
    revenueProjections: {
      shortTerm: {
        annualRevenue: shortTermAnnualRevenue,
        managementFees: shortTermManagementFees,
        maintenanceCosts: shortTermMaintenanceCosts,
        grossYield: shortTermGrossYield,
        netYield: shortTermNetYield,
        netOperatingIncome: shortTermNOI,
      },
      longTerm: {
        annualRevenue: longTermAnnualRevenue,
        managementFees: longTermManagementFees,
        maintenanceCosts: longTermMaintenanceCosts,
        grossYield: longTermGrossYield,
        netYield: longTermNetYield,
        netOperatingIncome: longTermNOI,
      },
    },
    marketComparison: {
      pricePerSqm,
      areaAveragePricePerSqm: input.ratePerSquareMeter,
      pricePerSqmDiff,
      pricePerSqmDiffPercentage,
    },
    projectedGrowth: {
      incomeGrowthRate: input.incomeGrowthRate * 100,
      expenseGrowthRate: input.expenseGrowthRate * 100,
      propertyAppreciationRate: input.propertyAppreciationRate * 100,
    },
  };
}
