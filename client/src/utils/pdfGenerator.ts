import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatter } from '@/utils/formatting';
import { SEASONALITY_FACTORS, OCCUPANCY_RATES, getSeasonalNightlyRate, getFeeAdjustedRate, calculateMonthlyRevenue } from '@/utils/rentalPerformance';

export function generatePropertyReport(
  data: {
    propertyDetails: {
      address: string;
      bedrooms?: string;
      bathrooms?: string;
      floorArea: number;
      parkingSpaces: number;
      purchasePrice: number;
      ratePerSquareMeter: number;
      propertyPhoto?: string | null;
    };
    financialMetrics: {
      depositAmount: number;
      depositPercentage: number;
      interestRate: number;
      loanTerm: number;
      monthlyBondRepayment: number;
      bondRegistration: number;
      transferCosts: number;
    };
    expenses: {
      monthlyLevies: number;
      monthlyRatesTaxes: number;
      otherMonthlyExpenses: number;
      maintenancePercent: number;
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
    netOperatingIncome?: {
      year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
      year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    };
    investmentMetrics?: {
      year1: {
        grossYield: number;
        netYield: number;
        returnOnEquity: number;
        annualReturn: number;
        capRate: number;
        cashOnCashReturn: number;
        roiWithoutAppreciation: number;
        roiWithAppreciation: number;
        irr: number;
        netWorthChange: number;
      };
    };
  },
  selectedSections: Record<string, string[]>,
  companyLogo?: string | null
): jsPDF {
  const doc = new jsPDF();
  let yPos = 20;

  console.group('PDF Generator - Data Processing');
  console.log('Selected Sections:', selectedSections);
  console.log('Available Data Keys:', Object.keys(data));

  if (companyLogo && selectedSections["Company Branding"]?.includes("companyLogo")) {
    doc.addImage(companyLogo, "PNG", 160, 10, 40, 20);
    yPos = 50;
  }

  if (selectedSections["Property Details"]) {
    console.log('Processing Property Details:', selectedSections["Property Details"]);
    if (selectedSections["Property Details"].includes("propertyAddress") ||
        selectedSections["Property Details"].includes("propertySpecs") ||
        selectedSections["Property Details"].includes("propertyPrice")) {
      doc.setFontSize(14);
      doc.text('Property Details', 20, yPos);
      yPos += 10;

      const propertyData = [
        ['Address', data.propertyDetails.address],
        ['Bedrooms', data.propertyDetails.bedrooms || 'N/A'],
        ['Bathrooms', data.propertyDetails.bathrooms || 'N/A'],
        ['Floor Area', `${data.propertyDetails.floorArea}m²`],
        ['Parking Spaces', data.propertyDetails.parkingSpaces.toString()],
        ['Purchase Price', formatter.format(data.propertyDetails.purchasePrice)],
        ['Rate per m²', formatter.format(data.propertyDetails.ratePerSquareMeter)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Detail', 'Value']],
        body: propertyData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  if (selectedSections["Deal Structure"]) {
    console.log('Processing Deal Structure:', selectedSections["Deal Structure"]);
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Deal Structure', 20, yPos);
    yPos += 10;

    const dealStructureData = [
      ['Deposit Amount', formatter.format(data.financialMetrics.depositAmount)],
      ['Deposit Percentage', `${data.financialMetrics.depositPercentage}%`],
      ['Interest Rate', `${data.financialMetrics.interestRate}%`],
      ['Loan Term', `${data.financialMetrics.loanTerm} years`],
      ['Monthly Bond Payment', formatter.format(data.financialMetrics.monthlyBondRepayment)],
      ['Bond Registration', formatter.format(data.financialMetrics.bondRegistration)],
      ['Transfer Costs', formatter.format(data.financialMetrics.transferCosts)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Detail', 'Value']],
      body: dealStructureData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  if (selectedSections["Rental Performance"]) {
    console.log('Processing Rental Performance:', selectedSections["Rental Performance"]);
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Rental Performance Overview', 20, yPos);
    yPos += 10;

    const rentalOverviewData = [
      ['Short-Term Nightly Rate', formatter.format(data.performance.shortTermNightlyRate)],
      ['Annual Occupancy', `${data.performance.annualOccupancy}%`],
      ['Short-Term Annual Revenue', formatter.format(data.performance.shortTermAnnualRevenue)],
      ['Short-Term Monthly Average', formatter.format(data.performance.shortTermAnnualRevenue / 12)],
      ['Long-Term Annual Revenue', formatter.format(data.performance.longTermAnnualRevenue)],
      ['Long-Term Monthly Revenue', formatter.format(data.performance.longTermAnnualRevenue / 12)],
      ['Short-Term Gross Yield', `${data.performance.shortTermGrossYield}%`],
      ['Long-Term Gross Yield', `${data.performance.longTermGrossYield}%`]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: rentalOverviewData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    doc.text('Monthly Performance Analysis', 20, yPos);
    yPos += 10;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let totalSeasonalRate = 0;
    let totalFeeAdjustedRate = 0;
    let totalLowRevenue = 0;
    let totalMediumRevenue = 0;
    let totalHighRevenue = 0;
    let totalLongTermMonthly = data.performance.longTermAnnualRevenue;

    const monthlyPerformanceData = months.map((month, index) => {
      const baseRate = data.performance.shortTermNightlyRate;
      const seasonalRate = getSeasonalNightlyRate(baseRate, index);
      const feeAdjustedRate = getFeeAdjustedRate(seasonalRate, data.expenses.managementFee > 0);

      const lowRevenue = calculateMonthlyRevenue('low', index, baseRate, data.expenses.managementFee > 0);
      const mediumRevenue = calculateMonthlyRevenue('medium', index, baseRate, data.expenses.managementFee > 0);
      const highRevenue = calculateMonthlyRevenue('high', index, baseRate, data.expenses.managementFee > 0);
      const longTermMonthly = data.performance.longTermAnnualRevenue / 12;

      totalSeasonalRate += seasonalRate;
      totalFeeAdjustedRate += feeAdjustedRate;
      totalLowRevenue += lowRevenue;
      totalMediumRevenue += mediumRevenue;
      totalHighRevenue += highRevenue;

      return [
        month,
        formatter.format(seasonalRate),
        formatter.format(feeAdjustedRate),
        `${OCCUPANCY_RATES.low[index]}%`,
        formatter.format(lowRevenue),
        `${OCCUPANCY_RATES.medium[index]}%`,
        formatter.format(mediumRevenue),
        `${OCCUPANCY_RATES.high[index]}%`,
        formatter.format(highRevenue),
        formatter.format(longTermMonthly)
      ];
    });

    monthlyPerformanceData.push([
      'Total',
      formatter.format(totalSeasonalRate),
      formatter.format(totalFeeAdjustedRate),
      '-',
      formatter.format(totalLowRevenue),
      '-',
      formatter.format(totalMediumRevenue),
      '-',
      formatter.format(totalHighRevenue),
      formatter.format(totalLongTermMonthly)
    ]);

    monthlyPerformanceData.push([
      'Average',
      formatter.format(totalSeasonalRate / 12),
      formatter.format(totalFeeAdjustedRate / 12),
      `${Math.round(OCCUPANCY_RATES.low.reduce((a, b) => a + b, 0) / 12)}%`,
      formatter.format(totalLowRevenue / 12),
      `${Math.round(OCCUPANCY_RATES.medium.reduce((a, b) => a + b, 0) / 12)}%`,
      formatter.format(totalMediumRevenue / 12),
      `${Math.round(OCCUPANCY_RATES.high.reduce((a, b) => a + b, 0) / 12)}%`,
      formatter.format(totalHighRevenue / 12),
      formatter.format(totalLongTermMonthly / 12)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [[
        'Month',
        'Rate',
        'Adj Rate',
        'Low %',
        'Low Rev',
        'Med %',
        'Med Rev',
        'High %',
        'High Rev',
        'Long-Term'
      ]],
      body: monthlyPerformanceData,
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { 
        fillColor: [243, 244, 246], 
        textColor: [31, 41, 55],
        fontSize: 7
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 18 },
        2: { cellWidth: 18 },
        3: { cellWidth: 15 },
        4: { fillColor: [254, 242, 242], cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { fillColor: [255, 251, 235], cellWidth: 20 },
        7: { cellWidth: 15 },
        8: { fillColor: [240, 253, 244], cellWidth: 20 },
        9: { fillColor: [239, 246, 255], cellWidth: 20 },
      },
      didDrawCell: (data) => {
        if (data.row.index === monthlyPerformanceData.length - 2 || 
            data.row.index === monthlyPerformanceData.length - 1) {
          doc.setFillColor(243, 244, 246);
          doc.setTextColor(31, 41, 55);
          doc.setFont(undefined, 'bold');
        }
      }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('Color Legend:', 20, yPos);
    yPos += 5;

    const legendItems = [
      { color: [254, 242, 242], text: 'Low Occupancy' },
      { color: [255, 251, 235], text: 'Medium Occupancy' },
      { color: [240, 253, 244], text: 'High Occupancy' },
      { color: [239, 246, 255], text: 'Long-Term' }
    ];

    legendItems.forEach((item, index) => {
      const xPos = 20 + (index * 40);
      doc.setFillColor(...item.color);
      doc.rect(xPos, yPos, 3, 3, 'F');
      doc.text(item.text, xPos + 5, yPos + 2);
    });

    yPos += 10;

    doc.setFontSize(7);
    doc.text(`Note: Platform fees of ${data.expenses.managementFee > 0 ? '15%' : '3%'} are applied to nightly rates.`, 20, yPos);
    yPos += 10;
  }

  if (selectedSections["Operating Expenses"]) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Operating Expenses', 20, yPos);
    yPos += 10;

    const expensesData = [
      ['Monthly Levies', formatter.format(data.expenses.monthlyLevies)],
      ['Monthly Rates & Taxes', formatter.format(data.expenses.monthlyRatesTaxes)],
      ['Other Monthly Expenses', formatter.format(data.expenses.otherMonthlyExpenses)],
      ['Maintenance (%)', `${data.expenses.maintenancePercent}%`],
      ['Management Fee (%)', `${data.expenses.managementFee}%`]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Expense Type', 'Amount']],
      body: expensesData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  if (selectedSections["Investment Metrics"] && data.investmentMetrics?.year1) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Investment Metrics (Year 1)', 20, yPos);
    yPos += 10;

    const metrics = data.investmentMetrics.year1;
    const investmentData = [
      ['Gross Yield', `${metrics.grossYield?.toFixed(1) || 0}%`],
      ['Net Yield', `${metrics.netYield?.toFixed(1) || 0}%`],
      ['Return on Equity', `${metrics.returnOnEquity?.toFixed(1) || 0}%`],
      ['Annual Return', `${metrics.annualReturn?.toFixed(1) || 0}%`],
      ['Cap Rate', `${metrics.capRate?.toFixed(1) || 0}%`],
      ['Cash on Cash Return', `${metrics.cashOnCashReturn?.toFixed(1) || 0}%`],
      ['ROI (Without Appreciation)', `${metrics.roiWithoutAppreciation?.toFixed(1) || 0}%`],
      ['ROI (With Appreciation)', `${metrics.roiWithAppreciation?.toFixed(1) || 0}%`],
      ['IRR', `${metrics.irr?.toFixed(1) || 0}%`]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: investmentData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  if (selectedSections["Cashflow Analysis"] && data.netOperatingIncome) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Cashflow Analysis', 20, yPos);
    yPos += 10;

    const years = [1, 2, 3, 4, 5, 10, 20];
    const cashflowData = years.map(year => {
      const yearKey = `year${year}` as keyof typeof data.netOperatingIncome;
      const yearData = data.netOperatingIncome![yearKey];
      return [
        `Year ${year}`,
        formatter.format(yearData.annualCashflow),
        formatter.format(yearData.cumulativeRentalIncome),
        formatter.format(yearData.netWorthChange)
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Year', 'Annual Cashflow', 'Cumulative Rental Income', 'Net Worth Change']],
      body: cashflowData,
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      20,
      280
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      170,
      280
    );
  }

  return doc;
}