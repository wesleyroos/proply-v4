export interface PropertyData {
  propertyDetails: {
    address: string;
    bedrooms: number;
    bathrooms: number;
    floorArea: number;
    parkingSpaces: number;
    purchasePrice: number;
    ratePerSquareMeter: number;
    propertyPhoto?: string;
    mapImage?: string;
    description?: string;
  };
  dealStructure: {
    depositAmount: number;
    depositPercentage: number;
    interestRate: number;
    loanTerm: number;
    monthlyBondRepayment: number;
    bondRegistration: number;
    transferCosts: number;
  };
  operatingExpenses: {
    monthlyLevies: number;
    monthlyRatesTaxes: number;
    otherMonthlyExpenses: number;
    maintenancePercentage: number;
    managementFee: number;
  };
  performance: {
    shortTermNightlyRate: number;
    annualOccupancy: number;
    shortTermAnnualRevenue: number;
    longTermAnnualRevenue: number;
    shortTermGrossYield: number;
    longTermGrossYield: number;
  };
  investmentMetrics: Record<string, {
    grossYield: number;
    netYield: number;
    returnOnEquity: number;
    annualReturn: number;
    capRate: number;
    cashOnCashReturn: number;
    irr: number;
    netWorthChange: number;
  }>;
  cashflow: {
    [key: string]: {
      annualCashflow: number;
      cumulativeRentalIncome: number;
    };
  };
}

export interface ReportSelections {
  propertyDetails?: {
    map?: boolean;
    [key: string]: boolean | undefined;
  };
  [key: string]: {
    [key: string]: boolean | undefined;
  } | undefined;
}
