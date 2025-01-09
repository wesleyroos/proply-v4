import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { PropertyData, ReportSelections } from '../types/propertyReport';
import { optimizeCanvas } from '../utils/optimization';
import { formatCurrency, formatPercentage } from '../utils/formatting';

export async function generatePDF(
  data: PropertyData,
  selections: ReportSelections,
  companyLogo?: string
): Promise<void> {
  try {
    // Initialize PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;

    // Add header with logo if available
    if (companyLogo) {
      const img = new Image();
      img.src = companyLogo;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      pdf.addImage(companyLogo, 'PNG', 20, yPosition, 40, 20);
      yPosition += 30;
    }

    // Title
    pdf.setFontSize(20);
    pdf.text('Property Analysis Report', 20, yPosition);
    yPosition += 15;

    // Add content sections based on selections
    if (selections.propertyDetails) {
      yPosition = await addPropertyDetails(pdf, data, selections, yPosition);
    }

    if (selections.financialMetrics) {
      yPosition = await addFinancialMetrics(pdf, data, selections, yPosition);
    }

    if (selections.operatingExpenses) {
      yPosition = await addOperatingExpenses(pdf, data, selections, yPosition);
    }

    if (selections.rentalPerformance) {
      yPosition = await addRentalPerformance(pdf, data, selections, yPosition);
    }

    if (selections.investmentMetrics) {
      yPosition = await addInvestmentMetrics(pdf, data, selections, yPosition);
    }

    if (selections.cashflowAnalysis) {
      yPosition = await addCashflowAnalysis(pdf, data, selections, yPosition);
    }

    // Add finishing touches
    addPageNumbers(pdf);
    if (selections.includeWatermark) {
      addWatermark(pdf, "Property Analysis Report");
    }

    // Save the PDF
    pdf.save(`${data.propertyDetails.address}_analysis.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

async function addPropertyDetails(
  pdf: jsPDF,
  data: PropertyData,
  selections: ReportSelections,
  startY: number
): Promise<number> {
  let y = startY;

  // Property Overview Section
  pdf.setFontSize(16);
  pdf.text('Property Overview', 20, y);
  y += 10;
  pdf.setFontSize(12);

  // Location and Basic Info
  const basicInfo = [];
  if (selections.propertyDetails.address) {
    basicInfo.push(['Address', data.propertyDetails.address]);
  }
  if (selections.propertyDetails.bedrooms) {
    basicInfo.push(['Bedrooms', data.propertyDetails.bedrooms]);
  }
  if (selections.propertyDetails.bathrooms) {
    basicInfo.push(['Bathrooms', data.propertyDetails.bathrooms]);
  }
  if (selections.propertyDetails.floorArea) {
    basicInfo.push(['Floor Area', `${data.propertyDetails.floorArea}m²`]);
  }
  if (selections.propertyDetails.parkingSpaces) {
    basicInfo.push(['Parking Spaces', data.propertyDetails.parkingSpaces]);
  }

  if (basicInfo.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [['Feature', 'Details']],
      body: basicInfo,
      margin: { left: 20 },
      theme: 'plain'
    });
    y += basicInfo.length * 8 + 15;
  }

  // Property Valuation
  y += 5;
  pdf.setFontSize(14);
  pdf.text('Property Valuation', 20, y);
  y += 8;

  const valuationData = [];
  valuationData.push(['Purchase Price', formatCurrency(data.propertyDetails.purchasePrice)]);
  if (selections.propertyDetails.propertyRatePerSquareMeter) {
    valuationData.push(
      ['Property Rate/m²', formatCurrency(data.propertyDetails.ratePerSquareMeter)],
      ['Area Average Rate/m²', formatCurrency(data.propertyDetails.areaRatePerSquareMeter)],
      ['Market Position', formatCurrency(data.propertyDetails.rateDifference) + ' vs market average']
    );
  }
    
    autoTable(pdf, {
      startY: y,
      head: [['Metric', 'Value']],
      body: valuationData,
      margin: { left: 20 }
    });
    y += 30;
  

  if (selections.propertyDetails.propertyPhoto && data.propertyDetails.propertyPhoto) {
    try {
      const img = new Image();
      img.src = data.propertyDetails.propertyPhoto;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      pdf.addImage(data.propertyDetails.propertyPhoto, 'PNG', 20, y, 80, 60);
      y += 70;
    } catch (error) {
      console.error('Error adding property photo:', error);
    }
  }

  const details = [];
  if (selections.propertyDetails.bedrooms && data.propertyDetails.bedrooms !== undefined) {
    details.push(['Bedrooms', data.propertyDetails.bedrooms.toString()]);
  }
  if (selections.propertyDetails.bathrooms && data.propertyDetails.bathrooms !== undefined) {
    details.push(['Bathrooms', data.propertyDetails.bathrooms.toString()]);
  }
  if (selections.propertyDetails.floorArea && data.propertyDetails.floorArea !== undefined) {
    details.push(['Floor Area', `${data.propertyDetails.floorArea}m²`]);
  }
  if (selections.propertyDetails.parkingSpaces && data.propertyDetails.parkingSpaces !== undefined) {
    details.push(['Parking Spaces', data.propertyDetails.parkingSpaces.toString()]);
  }
  if (selections.propertyDetails.ratePerSquareMeter && data.propertyDetails.ratePerSquareMeter !== undefined) {
    details.push(['Rate per m²', formatCurrency(data.propertyDetails.ratePerSquareMeter)]);
  }

  if (details.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [['Feature', 'Value']],
      body: details,
      margin: { left: 20 }
    });
    y += (details.length + 1) * 10 + 10;
  }

  return y;
}

async function addFinancialMetrics(
  pdf: jsPDF,
  data: PropertyData,
  selections: ReportSelections,
  startY: number
): Promise<number> {
  let y = startY;

  // Investment Structure
  pdf.setFontSize(16);
  pdf.text('Investment Structure', 20, y);
  y += 10;

  const investmentStructure = [
    ['Total Investment Required', formatCurrency(data.propertyDetails.purchasePrice)],
    ['Required Deposit', `${formatCurrency(data.financialMetrics.depositAmount)} (${data.financialMetrics.depositPercentage}%)`],
    ['Bond Amount', formatCurrency(data.propertyDetails.purchasePrice - data.financialMetrics.depositAmount)]
  ];

  // Financing Terms
  const financingTerms = [
    ['Interest Rate', `${data.financialMetrics.interestRate}%`],
    ['Loan Term', `${data.financialMetrics.loanTerm} years`],
    ['Monthly Bond Payment', formatCurrency(data.financialMetrics.monthlyBondRepayment)]
  ];

  // Associated Costs
  const associatedCosts = [
    ['Bond Registration', formatCurrency(data.financialMetrics.bondRegistration)],
    ['Transfer Costs', formatCurrency(data.financialMetrics.transferCosts)],
    ['Total Capital Required', formatCurrency(data.financialMetrics.depositAmount + 
      data.financialMetrics.bondRegistration + data.financialMetrics.transferCosts)]
  ];
  if (selections.financialMetrics.depositAmount && data.financialMetrics.depositAmount !== undefined) {
    metrics.push(['Deposit Amount', formatCurrency(data.financialMetrics.depositAmount)]);
    metrics.push(['Deposit Percentage', `${data.financialMetrics.depositPercentage}%`]);
  }
  if (selections.financialMetrics.interestRate && data.financialMetrics.interestRate !== undefined) {
    metrics.push(['Interest Rate', `${data.financialMetrics.interestRate}%`]);
  }
  if (selections.financialMetrics.monthlyBondRepayment && data.financialMetrics.monthlyBondRepayment !== undefined) {
    metrics.push(['Monthly Bond Repayment', formatCurrency(data.financialMetrics.monthlyBondRepayment)]);
  }

  if (metrics.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [['Metric', 'Value']],
      body: metrics,
      margin: { left: 20 }
    });
    y += (metrics.length + 1) * 10 + 10;
  }

  return y;
}

async function addOperatingExpenses(
  pdf: jsPDF,
  data: PropertyData,
  selections: ReportSelections,
  startY: number
): Promise<number> {
  let y = startY;

  pdf.setFontSize(16);
  pdf.text('Operating Expenses', 20, y);
  y += 10;

  const expenses = [];
  if (selections.operatingExpenses.monthlyLevies && data.operatingExpenses.monthlyLevies !== undefined) {
    expenses.push(['Monthly Levies', formatCurrency(data.operatingExpenses.monthlyLevies)]);
  }
  if (selections.operatingExpenses.monthlyRatesTaxes && data.operatingExpenses.monthlyRatesTaxes !== undefined) {
    expenses.push(['Monthly Rates & Taxes', formatCurrency(data.operatingExpenses.monthlyRatesTaxes)]);
  }
  if (selections.operatingExpenses.otherMonthlyExpenses && data.operatingExpenses.otherMonthlyExpenses !== undefined) {
    expenses.push(['Other Monthly Expenses', formatCurrency(data.operatingExpenses.otherMonthlyExpenses)]);
  }
  if (selections.operatingExpenses.maintenancePercent && data.operatingExpenses.maintenancePercent !== undefined) {
    expenses.push(['Maintenance', `${data.operatingExpenses.maintenancePercent}% of rental income`]);
  }

  if (expenses.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [['Expense', 'Amount']],
      body: expenses,
      margin: { left: 20 }
    });
    y += (expenses.length + 1) * 10 + 10;
  }

  return y;
}

async function addRentalPerformance(
  pdf: jsPDF,
  data: PropertyData,
  selections: ReportSelections,
  startY: number
): Promise<number> {
  let y = startY;

  pdf.setFontSize(16);
  pdf.text('Rental Performance', 20, y);
  y += 10;

  const performance = [];
  if (selections.rentalPerformance.shortTermNightlyRate && data.performance.shortTermNightlyRate !== undefined) {
    performance.push(['Short Term Nightly Rate', formatCurrency(data.performance.shortTermNightlyRate)]);
    performance.push(['Annual Occupancy', `${data.performance.annualOccupancy}%`]);
    performance.push(['Short Term Annual Revenue', formatCurrency(data.performance.shortTermAnnualRevenue)]);
    performance.push(['Short Term Gross Yield', `${data.performance.shortTermGrossYield.toFixed(2)}%`]);
  }

  if (selections.rentalPerformance.longTerm && data.performance.longTermAnnualRevenue !== undefined) {
    performance.push(['Long Term Monthly Revenue', formatCurrency(data.performance.longTermAnnualRevenue / 12)]);
    performance.push(['Long Term Annual Revenue', formatCurrency(data.performance.longTermAnnualRevenue)]);
    performance.push(['Long Term Gross Yield', `${data.performance.longTermGrossYield.toFixed(2)}%`]);
  }

  if (performance.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [['Metric', 'Value']],
      body: performance,
      margin: { left: 20 }
    });
    y += (performance.length + 1) * 10 + 10;
  }

  return y;
}

async function addInvestmentMetrics(
  pdf: jsPDF,
  data: PropertyData,
  selections: ReportSelections,
  startY: number
): Promise<number> {
  let y = startY;

  pdf.setFontSize(16);
  pdf.text('Investment Metrics', 20, y);
  y += 10;

  const metrics = [];
  const shortTermMetrics = data.investmentMetrics.shortTerm[0];

  if (selections.investmentMetrics.grossYield && shortTermMetrics.grossYield !== undefined) {
    metrics.push(['Gross Yield', `${shortTermMetrics.grossYield.toFixed(2)}%`]);
  }
  if (selections.investmentMetrics.netYield && shortTermMetrics.netYield !== undefined) {
    metrics.push(['Net Yield', `${shortTermMetrics.netYield.toFixed(2)}%`]);
  }
  if (selections.investmentMetrics.returnOnEquity && shortTermMetrics.returnOnEquity !== undefined) {
    metrics.push(['Return on Equity', `${shortTermMetrics.returnOnEquity.toFixed(2)}%`]);
  }
  if (selections.investmentMetrics.capRate && shortTermMetrics.capRate !== undefined) {
    metrics.push(['Cap Rate', `${shortTermMetrics.capRate.toFixed(2)}%`]);
  }
  if (selections.investmentMetrics.cashOnCashReturn && shortTermMetrics.cashOnCashReturn !== undefined) {
    metrics.push(['Cash on Cash Return', `${shortTermMetrics.cashOnCashReturn.toFixed(2)}%`]);
  }
  if (selections.investmentMetrics.irr && shortTermMetrics.irr !== undefined) {
    metrics.push(['IRR', `${shortTermMetrics.irr.toFixed(2)}%`]);
  }

  if (metrics.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [['Metric', 'Value']],
      body: metrics,
      margin: { left: 20 }
    });
    y += (metrics.length + 1) * 10 + 10;
  }

  return y;
}

async function addCashflowAnalysis(
  pdf: jsPDF,
  data: PropertyData,
  selections: ReportSelections,
  startY: number
): Promise<number> {
  let y = startY;

  if (!selections.cashflowAnalysis) {
    return y;
  }

  pdf.setFontSize(16);
  pdf.text('Cashflow Analysis', 20, y);
  y += 10;

  const years = [1, 2, 3, 5, 10, 20];
  const cashflow = years.map(year => {
    const yearKey = `year${year}` as keyof typeof data.netOperatingIncome;
    const value = data.netOperatingIncome?.[yearKey]?.annualCashflow ?? 0;
    return [`Year ${year}`, formatCurrency(value)];
  });

  if (cashflow.length > 0) {
    autoTable(pdf, {
      startY: y,
      head: [['Period', 'Annual Cashflow']],
      body: cashflow,
      margin: { left: 20 }
    });
    y += (cashflow.length + 1) * 10 + 10;
  }

  return y;
}

function addPageNumbers(pdf: jsPDF): void {
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pdf.internal.pageSize.getWidth() / 2,
      pdf.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
}

function addWatermark(pdf: jsPDF, text: string): void {
  const pages = pdf.getNumberOfPages();
  pdf.setFontSize(40);
  pdf.setTextColor(200);

  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.text(
      text,
      pdf.internal.pageSize.getWidth() / 2,
      pdf.internal.pageSize.getHeight() / 2,
      {
        angle: 45,
        align: 'center'
      }
    );
  }
}