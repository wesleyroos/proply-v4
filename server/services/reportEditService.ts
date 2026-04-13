/**
 * Report Edit Service
 * Allows agents/partners to adjust AI-generated report values.
 * Handles snapshotting originals, applying edits, recalculating derived data.
 */

import { db } from "../../db";
import { valuationReports, rentalPerformanceData, propdataListings } from "../../db/schema";
import { eq, sql } from "drizzle-orm";

export interface ReportEdits {
  valuations?: Array<{ type: string; formula: string; value: number }>;
  longTermMinRental?: number;
  longTermMaxRental?: number;
  floorSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  depositPercentage?: number;
  interestRate?: number;
  loanTerm?: number;
}

// ─── Financial recalculation helpers (same math as routes.ts computeFinancialAnalysisData) ───

function getMidlineValuation(valuations: any[]): number {
  return valuations?.find((v: any) => v.type === "Midline (Proply est.)")?.value || 0;
}

function buildTrajectory(baseAnnual: number, basePrice: number) {
  return [1, 2, 3, 4, 5].reduce((acc: any, yr) => {
    const revenue = baseAnnual * Math.pow(1.08, yr - 1);
    acc[`year${yr}`] = { revenue, grossYield: basePrice > 0 ? (revenue / basePrice) * 100 : 0 };
    return acc;
  }, {});
}

function computeFinancing(propertyPrice: number, depositPct: number, interestPct: number, loanTermYrs: number) {
  const depositAmount = propertyPrice * (depositPct / 100);
  const loanAmount = propertyPrice - depositAmount;
  const monthlyRate = (interestPct / 100) / 12;
  const loanTermMonths = loanTermYrs * 12;
  const monthlyPayment = monthlyRate > 0
    ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths))) /
      (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
    : loanAmount / loanTermMonths;

  const yearlyMetrics = [1, 2, 3, 4, 5, 10, 20].reduce((acc: any, yr) => {
    let balance = loanAmount;
    let principalPaid = 0;
    const months = Math.min(yr * 12, loanTermMonths);
    for (let m = 0; m < months; m++) {
      const interest = balance * monthlyRate;
      const principal = monthlyPayment - interest;
      principalPaid += principal;
      balance -= principal;
    }
    acc[`year${yr}`] = { monthlyPayment, equityBuildup: principalPaid, remainingBalance: Math.max(0, balance) };
    return acc;
  }, {});

  return {
    financingParameters: { depositAmount, depositPercentage: depositPct, loanAmount, interestRate: interestPct, loanTerm: loanTermYrs, monthlyPayment },
    yearlyMetrics,
  };
}

function recalculateAll(vd: any, propertyPrice: number, depositPct: number, interestPct: number, loanTermYrs: number) {
  // Fall back to midline if no price
  propertyPrice = propertyPrice > 0 ? propertyPrice : getMidlineValuation(vd?.valuations);

  // 1. Appreciation
  const components = vd?.propertyAppreciation?.components;
  const appreciationRate = components
    ? (components.baseSuburbRate?.rate || 0) +
      (components.locationPremium?.adjustment || 0) +
      (components.propertyTypeModifier?.adjustment || 0) +
      (components.visualConditionAdjustment?.adjustment || 0) +
      (components.levyImpact?.adjustment || 0)
    : (vd?.propertyAppreciation?.annualAppreciationRate || 8.0);

  const annualPropertyAppreciationData = {
    baseSuburbRate: vd?.propertyAppreciation?.suburbAppreciationRate || 8.0,
    propertyAdjustments: vd?.propertyAppreciation?.adjustments || {},
    finalAppreciationRate: appreciationRate,
    yearlyValues: [1, 2, 3, 4, 5, 10, 20].reduce((acc: any, yr) => {
      acc[`year${yr}`] = propertyPrice * Math.pow(1 + appreciationRate / 100, yr);
      return acc;
    }, {}),
    reasoning: vd?.propertyAppreciation?.reasoning || "Standard market appreciation",
  };

  // 2. Cashflow
  const strPercentiles = vd?.rentalPerformance?.shortTerm;
  const ltrData = vd?.rentalPerformance?.longTerm || vd?.rentalEstimates?.longTerm;

  let shortTermTrajectory: any = null;
  if (strPercentiles) {
    shortTermTrajectory = {};
    for (const key of ["percentile25", "percentile50", "percentile75", "percentile90"]) {
      const annual = strPercentiles[key]?.annual;
      if (annual) shortTermTrajectory[key] = buildTrajectory(annual, propertyPrice);
    }
  }

  const ltrMinRental = ltrData?.minRental ?? ltrData?.minMonthlyRental;
  const ltrMaxRental = ltrData?.maxRental ?? ltrData?.maxMonthlyRental;
  const longTermTrajectory = (ltrMinRental != null && ltrMaxRental != null)
    ? buildTrajectory(((ltrMinRental + ltrMaxRental) / 2) * 12, propertyPrice)
    : null;

  const cashflowAnalysisData = {
    revenueGrowthTrajectory: { shortTerm: shortTermTrajectory, longTerm: longTermTrajectory },
    recommendedStrategy: shortTermTrajectory && longTermTrajectory
      ? ((strPercentiles?.percentile50?.annual || 0) > ((ltrMinRental || 0) + (ltrMaxRental || 0)) / 2 * 12
          ? "shortTerm" : "longTerm")
      : (shortTermTrajectory ? "shortTerm" : "longTerm"),
    strategyReasoning: "Based on gross rental yields comparison",
  };

  // 3. Financing
  const financingAnalysisData = computeFinancing(propertyPrice, depositPct, interestPct, loanTermYrs);

  return { annualPropertyAppreciationData, cashflowAnalysisData, financingAnalysisData, propertyPrice };
}

// ─── Main edit function ───

export async function applyReportEdits(
  propertyId: string,
  edits: ReportEdits,
  editedBy: string
) {
  // 1. Fetch current report
  const report = await db.query.valuationReports.findFirst({
    where: eq(valuationReports.propertyId, propertyId),
  });
  if (!report) throw new Error("Report not found");

  const vd = { ...(report.valuationData as any) };
  const currentOverrides = ((report as any).manualOverrides as Record<string, boolean>) || {};

  // 2. Snapshot original on first edit
  const isFirstEdit = !(report as any).originalValuationData;

  // 3. Apply valuation edits
  if (edits.valuations) {
    vd.valuations = edits.valuations;
    currentOverrides.valuations = true;
  }

  // 4. Apply rental edits
  if (edits.longTermMinRental != null || edits.longTermMaxRental != null) {
    if (!vd.rentalPerformance) vd.rentalPerformance = {};
    if (!vd.rentalPerformance.longTerm) vd.rentalPerformance.longTerm = {};

    const ltr = vd.rentalPerformance.longTerm;
    if (edits.longTermMinRental != null) ltr.minRental = edits.longTermMinRental;
    if (edits.longTermMaxRental != null) ltr.maxRental = edits.longTermMaxRental;

    // Recalculate yields based on base price
    const basePrice = Number(report.price) || getMidlineValuation(vd.valuations);
    if (basePrice > 0) {
      ltr.minYield = parseFloat(((ltr.minRental * 12 / basePrice) * 100).toFixed(1));
      ltr.maxYield = parseFloat(((ltr.maxRental * 12 / basePrice) * 100).toFixed(1));
    }
    currentOverrides.rental = true;
  }

  // 5. Apply property detail edits
  const propertyUpdates: any = {};
  if (edits.floorSize != null) {
    propertyUpdates.floorSize = edits.floorSize.toString();
    currentOverrides.propertyDetails = true;
  }
  if (edits.bedrooms != null) {
    propertyUpdates.bedrooms = Math.floor(edits.bedrooms);
    currentOverrides.propertyDetails = true;
  }
  if (edits.bathrooms != null) {
    propertyUpdates.bathrooms = Math.floor(edits.bathrooms);
    currentOverrides.propertyDetails = true;
  }

  // 6. Determine financing params (use edits or current values)
  const depositPct = edits.depositPercentage ?? parseFloat(report.currentDepositPercentage?.toString() || "20");
  const interestPct = edits.interestRate ?? parseFloat(report.currentInterestRate?.toString() || "11.75");
  const loanTermYrs = edits.loanTerm ?? (report.currentLoanTerm || 20);
  if (edits.depositPercentage != null || edits.interestRate != null || edits.loanTerm != null) {
    currentOverrides.financing = true;
  }

  // 7. Recalculate all derived data
  const listingPrice = Number(report.price) || 0;
  const { annualPropertyAppreciationData, cashflowAnalysisData, financingAnalysisData, propertyPrice } =
    recalculateAll(vd, listingPrice, depositPct, interestPct, loanTermYrs);

  // Recalculate price per sqm if floor size changed
  const floorSize = edits.floorSize ?? parseFloat(report.floorSize?.toString() || "0");
  const pricePerSquareMeter = floorSize > 0 ? propertyPrice / floorSize : null;

  // 8. Update valuation_reports
  const updateData: any = {
    valuationData: vd,
    annualPropertyAppreciationData,
    cashflowAnalysisData,
    financingAnalysisData,
    manualOverrides: currentOverrides,
    lastEditedAt: new Date(),
    lastEditedBy: editedBy,
    currentDepositPercentage: depositPct.toString(),
    currentInterestRate: interestPct.toString(),
    currentLoanTerm: loanTermYrs,
    currentDepositAmount: financingAnalysisData.financingParameters.depositAmount.toString(),
    currentLoanAmount: financingAnalysisData.financingParameters.loanAmount.toString(),
    currentMonthlyRepayment: financingAnalysisData.financingParameters.monthlyPayment.toString(),
    ...propertyUpdates,
  };
  if (pricePerSquareMeter != null) {
    updateData.pricePerSquareMeter = pricePerSquareMeter.toString();
  }
  if (isFirstEdit) {
    updateData.originalValuationData = report.valuationData;
  }

  await db.update(valuationReports)
    .set(updateData)
    .where(eq(valuationReports.id, report.id));

  // 9. Update rental_performance_data too (if rental or financial data changed)
  try {
    const ltr = vd.rentalPerformance?.longTerm;
    await db.execute(sql`
      UPDATE rental_performance_data SET
        long_term_min_rental = ${ltr?.minRental?.toString() ?? null},
        long_term_max_rental = ${ltr?.maxRental?.toString() ?? null},
        long_term_min_yield = ${ltr?.minYield?.toString() ?? null},
        long_term_max_yield = ${ltr?.maxYield?.toString() ?? null},
        annual_property_appreciation_data = ${JSON.stringify(annualPropertyAppreciationData)},
        cashflow_analysis_data = ${JSON.stringify(cashflowAnalysisData)},
        financing_analysis_data = ${JSON.stringify(financingAnalysisData)},
        current_deposit_percentage = ${depositPct.toString()},
        current_interest_rate = ${interestPct.toString()},
        current_loan_term = ${loanTermYrs},
        current_deposit_amount = ${financingAnalysisData.financingParameters.depositAmount.toString()},
        current_loan_amount = ${financingAnalysisData.financingParameters.loanAmount.toString()},
        current_monthly_repayment = ${financingAnalysisData.financingParameters.monthlyPayment.toString()},
        updated_at = NOW()
      WHERE property_id = ${propertyId}
    `);
  } catch (err) {
    console.warn("[reportEditService] Failed to update rental_performance_data:", err);
  }

  // 10. Update propdata_listings if property details changed
  if (Object.keys(propertyUpdates).length > 0) {
    try {
      await db.update(propdataListings)
        .set(propertyUpdates)
        .where(eq(propdataListings.propdataId, propertyId));
    } catch (err) {
      console.warn("[reportEditService] Failed to update propdata_listings:", err);
    }
  }

  return {
    propertyId,
    valuationData: vd,
    annualPropertyAppreciationData,
    cashflowAnalysisData,
    financingAnalysisData,
    manualOverrides: currentOverrides,
    lastEditedAt: new Date().toISOString(),
    lastEditedBy: editedBy,
  };
}
