import { calculateYields } from "../analysis-engine/calculations";

export interface PropertyAnalysisInput {
  address: string;
  propertyUrl?: string;
  purchasePrice: number;
  floorArea: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  depositType: "amount" | "percentage";
  depositAmount: number;
  depositPercentage: number;
  interestRate: number;
  loanTerm: number;
  monthlyLevies: number;
  monthlyRatesTaxes: number;
  otherMonthlyExpenses: number;
  maintenancePercent: number;
  managementFee: number;
  airbnbNightlyRate?: number;
  occupancyRate?: number;
  longTermRental?: number;
  leaseCycleGap?: number;
  annualIncomeGrowth: number;
  annualExpenseGrowth: number;
  annualPropertyAppreciation: number;
  cmaRatePerSqm: number;
  comments?: string;
}

export async function analyzeProperty(input: PropertyAnalysisInput) {
  // Calculate yields and other metrics
  const yields = calculateYields({
    purchasePrice: input.purchasePrice,
    deposit: input.depositType === 'amount' ? input.depositAmount : (input.depositPercentage / 100) * input.purchasePrice,
    ratePerSquareMeter: input.cmaRatePerSqm,
    address: input.address,
    interestRate: input.interestRate / 100, // Convert to decimal
    loanTerm: input.loanTerm,
    floorArea: input.floorArea,
    incomeGrowthRate: input.annualIncomeGrowth / 100,
    expenseGrowthRate: input.annualExpenseGrowth / 100,
    propertyAppreciationRate: input.annualPropertyAppreciation / 100,
    monthlyLevies: input.monthlyLevies,
    monthlyRatesTaxes: input.monthlyRatesTaxes,
    otherMonthlyExpenses: input.otherMonthlyExpenses,
    maintenancePercentage: input.maintenancePercent / 100,
    managementFeePercentage: input.managementFee / 100,
    shortTermNightlyRate: input.airbnbNightlyRate || 0,
    avgOccupancyRate: input.occupancyRate ? input.occupancyRate / 100 : 0,
    longTermMonthlyRental: input.longTermRental || 0,
    propertyDescription: input.comments
  });

  return {
    ...yields,
    propertyDetails: {
      address: input.address,
      propertyUrl: input.propertyUrl,
      floorArea: input.floorArea,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      parkingSpaces: input.parkingSpaces,
    },
    escalations: {
      annualIncomeGrowth: input.annualIncomeGrowth,
      annualExpenseGrowth: input.annualExpenseGrowth,
      annualPropertyAppreciation: input.annualPropertyAppreciation,
    },
    cmaRatePerSqm: input.cmaRatePerSqm,
    comments: input.comments,
  };
}