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
  propertyDetails: PropertyDetails;
  financialMetrics: FinancialMetrics;
  operatingExpenses: OperatingExpenses;
  performance: RentalPerformance;
  investmentMetrics: {
    shortTerm: YearlyMetrics[];
    longTerm: YearlyMetrics[];
  };
  netOperatingIncome: CashflowData;
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
  };
  cashflowAnalysis?: boolean;
  financialMetrics?: {
    purchasePrice?: boolean;
    depositAmount?: boolean;
    interestRate?: boolean;
    loanTerm?: boolean;
    monthlyBondRepayment?: boolean;
    bondRegistration?: boolean;
    transferCosts?: boolean;
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
  cashflowAnalysis: boolean;
  dataVisualizations?: {
    charts?: boolean;
  };
  includeWatermark?: boolean;
  includeMap?: boolean;
}