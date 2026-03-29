// Optional + commented out fields are considered manditory for a report

export interface ReportSelections {
  propertyOverview: {
    // address?: boolean;
    // propertyPhoto?: boolean;
    // map?: boolean;
    // propertyDescription?: boolean;
    // purchasePrice?: boolean;
    // floorArea?: boolean;
    propertyRatePerSquareMeter: boolean;
    areaRatePerSquareMeter: boolean;
    rateDifference: boolean;
    // bedrooms?: boolean;
    // bathrooms?: boolean;
    // parkingSpaces?: boolean;
  };
  financialMetrics: {
    // depositAmount?: boolean;
    // depositPercentage?: boolean;
    // interestRate?: boolean;
    // monthlyBondRepayment?: boolean;
    // bondRegistration?: boolean;
    // transferCosts?: boolean;
    // loanTerm?: boolean;
    totalCapitalRequired: boolean;
  };
  operatingExpenses: {
    // monthlyLevies?: boolean;
    // monthlyRatesTaxes?: boolean;
    // otherMonthlyExpenses?: boolean;
    maintenancePercent: boolean;
    managementFee: boolean;
  };
  rentalPerformance: {
    shortTermNightlyRate: boolean;
    shortTermAnnualOccupancy: boolean;
    shortTermAnnualRevenue: boolean;
    shortTermGrossYield: boolean;
    longTermMonthlyRevenue: boolean;
    longTermAnnualRevenue: boolean;
    longTermGrossYield: boolean;
    rentalPerformanceChart: boolean;
  };
  cashflowMetrics: {
    annualRevenue: boolean;
    netOperatingIncome: boolean;
    netOperatingExpense: boolean;
    annualBondPayment: boolean;
    annualCashflow: boolean;
    cumulativeCashflow: boolean;
    cashflowChart: boolean;
  };
  investmentMetrics: {
    grossYield: boolean;
    netYield: boolean;
    returnOnEquity: boolean;
    annualReturn: boolean;
    capRate: boolean;
    cashOnCashReturn: boolean;
    irr: boolean;
    netWorthChange: boolean;
  };
  assetGrowthAndEquity: {
    propertyValue: boolean;
    annualAppreciation: boolean;
    loanBalance: boolean;
    totalInterestPaid: boolean
    interestToPrincipalRatio: boolean;
    totalEquity: boolean;
    loanRepaymentEquity: boolean;
    assetGrowthAndEquityChart: boolean;
  };
}
