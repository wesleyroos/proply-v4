export interface PropertyDetails {
  address: string;
  propertyPhoto?: string;
  mapImage?: string;
  bedrooms: number;
  bathrooms: number;
  floorArea: number;
  parkingSpaces: number;
  purchasePrice: number;
  ratePerSquareMeter: number;
  areaRate: number;
  rateDifference: number;
  propertyDescription?: string;
}

export interface FinancialMetrics {
  depositAmount: number;
  depositPercentage: number;
  interestRate: number;
  loanTerm: number;
  monthlyBondRepayment: number;
  bondRegistration: number;
  transferCosts: number;
  totalCapitalRequired: number;
}

export interface OperatingExpenses {
  monthlyLevies: number;
  monthlyRatesTaxes: number;
  otherMonthlyExpenses: number;
  maintenancePercent: number;
  managementFee: number;
}

export interface RentalPerformance {
  shortTermNightlyRate: number;
  annualOccupancy: number;
  shortTermAnnualRevenue: number;
  longTermAnnualRevenue: number;
  shortTermGrossYield: number;
  longTermGrossYield: number;
  platformFee: number;
  feeAdjustedRate: number;
}

export interface YearlyMetrics {
  grossYield: number;
  netYield: number;
  returnOnEquity: number;
  annualReturn: number;
  capRate: number;
  cashOnCashReturn: number;
  irr: number;
  netWorthChange: number;
}

export interface CashflowData {
  year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
  year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
  year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
  year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
  year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
  year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
  year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
}

export interface PropertyData {
  monthlyRevenue?: {
    low: number[];
    medium: number[];
    high: number[];
  };
  propertyDetails: PropertyDetails;
  financialMetrics: FinancialMetrics;
  operatingExpenses: OperatingExpenses;
  performance: RentalPerformance;
  investmentMetrics: {
    shortTerm: YearlyMetrics[];
    longTerm: YearlyMetrics[];
  };
  analysis: {
    netOperatingIncome: CashflowData;
    longTermNetOperatingIncome: CashflowData;
    revenueProjections: {
      shortTerm: {
        year1: number;
        year2: number;
        year3: number;
        year4: number;
        year5: number;
        year10: number;
        year20: number;
      };
      longTerm: {
        year1: number;
        year2: number;
        year3: number;
        year4: number;
        year5: number;
        year10: number;
        year20: number;
      };
    };
  };
}

export interface ReportSelections {
  propertyDetails?: {
    address?: boolean;
    propertyPhoto?: boolean;
    map?: boolean;
    bedrooms?: boolean;
    bathrooms?: boolean;
    floorArea?: boolean;
    parkingSpaces?: boolean;
    propertyRatePerSquareMeter?: boolean;
    areaRatePerSquareMeter?: boolean;
    rateDifference?: boolean;
    propertyDescription?: boolean;
    areaRateM2?: boolean;
    currentPropertyRateM2?: boolean; 
    rateM2Difference?: boolean;
  };
  financialMetrics?: {
    purchasePrice?: boolean;
    depositAmount?: boolean;
    depositPercentage?: boolean;
    interestRate?: boolean;
    loanTerm?: boolean;
    monthlyBondRepayment?: boolean;
    bondRegistration?: boolean;
    transferCosts?: boolean;
    totalCapitalRequired?: boolean;
  };
  operatingExpenses?: {
    monthlyLevies?: boolean;
    monthlyRatesTaxes?: boolean;
    otherMonthlyExpenses?: boolean;
    maintenancePercent?: boolean;
    managementFee?: boolean;
  };
  rentalPerformance?: {
    shortTerm?: boolean;
    longTerm?: boolean;
    platformFee?: boolean;
    feeAdjustedRate?: boolean;
    shortTermNightlyRate?: boolean;
    annualOccupancy?: boolean;
    shortTermAnnualRevenue?: boolean;
    longTermAnnualRevenue?: boolean;
    shortTermGrossYield?: boolean;
    longTermGrossYield?: boolean;
  };
  investmentMetrics?: {
    grossYield?: boolean;
    netYield?: boolean;
    returnOnEquity?: boolean;
    annualReturn?: boolean;
    capRate?: boolean;
    cashOnCashReturn?: boolean;
    irr?: boolean;
    netWorthChange?: boolean;
  };
  cashflowAnalysis?: {
    year1?: boolean;
    year2?: boolean;
    year3?: boolean;
    year4?: boolean;
    year5?: boolean;
    year10?: boolean;
    year20?: boolean;
    cumulativeRentalIncome?: boolean;
    netWorthChange?: boolean;
  };
  revenueProjections?: {
    shortTerm?: boolean;
    longTerm?: boolean;
  };
  dataVisualizations?: {
    charts?: boolean;
  };
  includeWatermark?: boolean;
  includeMap?: boolean;
}