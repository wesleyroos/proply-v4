import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { SEASONALITY_FACTORS, OCCUPANCY_RATES, getSeasonalNightlyRate, getFeeAdjustedRate, calculateMonthlyRevenue } from '@/utils/rentalPerformance';

// Define the formatter function locally to ensure consistency
const formatter = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R 0';
  }
  return `R ${value.toLocaleString('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export interface PropertyData {
  propertyDetails: {
    address: string;
    bedrooms?: string;
    bathrooms?: string;
    floorArea: number;
    parkingSpaces: number;
    purchasePrice: number;
    ratePerSquareMeter: number;
    propertyPhoto?: string | null;
    areaRatePerSquareMeter?: number;
    mapImage?: string | null;
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
    };
  };
  netOperatingIncome?: {
    [key: string]: {
      value: number;
      annualCashflow: number;
      cumulativeRentalIncome: number;
      netWorthChange: number;
    };
  };
}

interface Section {
  id: string;
  title: string;
  render: (doc: jsPDF, yPos: number, data: PropertyData) => number;
}

export interface ReportSections {
  [key: string]: string[];
}

const sections: Section[] = [
  {
    id: "propertyDetails",
    title: "Property Details",
    render: (doc, yPos, data) => {
      doc.setFontSize(14);
      doc.text('Property Details', 20, yPos);
      yPos += 10;

      const actualRatePerSqM = Math.round(data.propertyDetails.purchasePrice / data.propertyDetails.floorArea);
      const areaRatePerSqM = data.propertyDetails.areaRatePerSquareMeter || 0;
      const rateDifference = areaRatePerSqM - actualRatePerSqM;

      const propertyData = [
        ['Address', data.propertyDetails.address],
        ['Bedrooms', data.propertyDetails.bedrooms || 'N/A'],
        ['Bathrooms', data.propertyDetails.bathrooms || 'N/A'],
        ['Floor Area', `${data.propertyDetails.floorArea}m²`],
        ['Parking Spaces', data.propertyDetails.parkingSpaces.toString()],
        ['Purchase Price', formatter(data.propertyDetails.purchasePrice)],
        ['Rate per m²', formatter(actualRatePerSqM)],
        ['Area Rate/m²', formatter(areaRatePerSqM)],
        ['Rate/m² Difference', formatter(rateDifference)]
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

      if (data.propertyDetails.mapImage) {
        try {
          const mapWidth = 170;
          const mapHeight = 100;
          doc.addImage(data.propertyDetails.mapImage, 'PNG', 20, yPos, mapWidth, mapHeight);
          yPos += mapHeight + 20;
        } catch (error) {
          console.error('Error adding map to PDF:', error);
        }
      }

      return yPos;
    }
  },
  {
    id: "dealStructure",
    title: "Deal Structure",
    render: (doc, yPos, data) => {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Deal Structure', 20, yPos);
      yPos += 10;

      const dealStructureData = [
        ['Deposit Amount', formatter(data.financialMetrics.depositAmount)],
        ['Deposit Percentage', `${data.financialMetrics.depositPercentage}%`],
        ['Interest Rate', `${data.financialMetrics.interestRate}%`],
        ['Loan Term', `${data.financialMetrics.loanTerm} years`],
        ['Monthly Bond Payment', formatter(data.financialMetrics.monthlyBondRepayment)],
        ['Bond Registration', formatter(data.financialMetrics.bondRegistration)],
        ['Transfer Costs', formatter(data.financialMetrics.transferCosts)]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Detail', 'Value']],
        body: dealStructureData,
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] }
      });

      return (doc as any).lastAutoTable.finalY + 15;
    }
  },
  {
    id: "operatingExpenses",
    title: "Operating Expenses",
    render: (doc, yPos, data) => {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Operating Expenses', 20, yPos);
      yPos += 10;

      const expensesData = [
        ['Monthly Levies', formatter(data.expenses.monthlyLevies)],
        ['Monthly Rates & Taxes', formatter(data.expenses.monthlyRatesTaxes)],
        ['Other Monthly Expenses', formatter(data.expenses.otherMonthlyExpenses)],
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

      return (doc as any).lastAutoTable.finalY + 15;
    }
  },
  {
    id: "rentalPerformance",
    title: "Rental Performance",
    render: (doc, yPos, data) => {
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Rental Performance', 20, yPos);
      yPos += 10;

      // Short-term rental performance
      const shortTermData = [
        ['Short-Term Performance', ''],
        ['Nightly Rate', formatter(data.performance.shortTermNightlyRate)],
        ['Annual Occupancy', `${data.performance.annualOccupancy}%`],
        ['Annual Revenue', formatter(data.performance.shortTermAnnualRevenue)],
        ['Monthly Average', formatter(data.performance.shortTermAnnualRevenue / 12)],
        ['Gross Yield', `${data.performance.shortTermGrossYield}%`]
      ];

      // Long-term rental performance
      const longTermData = [
        ['Long-Term Performance', ''],
        ['Annual Revenue', formatter(data.performance.longTermAnnualRevenue)],
        ['Monthly Revenue', formatter(data.performance.longTermAnnualRevenue / 12)],
        ['Gross Yield', `${data.performance.longTermGrossYield}%`]
      ];

      // Combine both tables with a gap between them
      autoTable(doc, {
        startY: yPos,
        body: [...shortTermData, ['', ''], ...longTermData],
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55] },
        didParseCell: function(data) {
          if (data.row.index === 0 || data.row.index === 7) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 244, 246];
          }
        }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;

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
          formatter(seasonalRate),
          formatter(feeAdjustedRate),
          `${OCCUPANCY_RATES.low[index]}%`,
          formatter(lowRevenue),
          `${OCCUPANCY_RATES.medium[index]}%`,
          formatter(mediumRevenue),
          `${OCCUPANCY_RATES.high[index]}%`,
          formatter(highRevenue),
          formatter(longTermMonthly)
        ];
      });

      monthlyPerformanceData.push([
        'Total',
        formatter(totalSeasonalRate),
        formatter(totalFeeAdjustedRate),
        '-',
        formatter(totalLowRevenue),
        '-',
        formatter(totalMediumRevenue),
        '-',
        formatter(totalHighRevenue),
        formatter(totalLongTermMonthly)
      ]);

      monthlyPerformanceData.push([
        'Average',
        formatter(totalSeasonalRate / 12),
        formatter(totalFeeAdjustedRate / 12),
        `${Math.round(OCCUPANCY_RATES.low.reduce((a, b) => a + b, 0) / 12)}%`,
        formatter(totalLowRevenue / 12),
        `${Math.round(OCCUPANCY_RATES.medium.reduce((a, b) => a + b, 0) / 12)}%`,
        formatter(totalMediumRevenue / 12),
        `${Math.round(OCCUPANCY_RATES.high.reduce((a, b) => a + b, 0) / 12)}%`,
        formatter(totalHighRevenue / 12),
        formatter(totalLongTermMonthly / 12)
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
          9: { fillColor: [239, 246, 255], cellWidth: 20 }
        },
        didParseCell: function(data) {
          // Make total and average rows bold
          if (data.row.index === monthlyPerformanceData.length - 2 ||
              data.row.index === monthlyPerformanceData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 244, 246];
            data.cell.styles.textColor = [31, 41, 55];
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
      return yPos;
    }
  },
  {
    id: "investmentMetrics",
    title: "Investment Metrics",
    render: (doc, yPos, data) => {
      if (!data.investmentMetrics?.year1) return yPos;

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

      return (doc as any).lastAutoTable.finalY + 15;
    }
  },
  {
    id: "cashflowAnalysis",
    title: "Cashflow Analysis",
    render: (doc, yPos, data) => {
      if (!data.netOperatingIncome) return yPos;

      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.text('Cashflow Analysis', 20, yPos);
      yPos += 10;

      const years = [1, 2, 3, 4, 5, 10, 20];
      const cashflowData = years.map(year => {
        const yearKey = `year${year}`;
        const yearData = data.netOperatingIncome![yearKey];
        return [
          `Year ${year}`,
          formatter(yearData.annualCashflow),
          formatter(yearData.cumulativeRentalIncome),
          formatter(yearData.netWorthChange)
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

      return (doc as any).lastAutoTable.finalY + 15;
    }
  }
];

export async function generatePropertyReport(
  data: PropertyData,
  selectedSections: ReportSections,
  companyLogo?: string | null,
): Promise<jsPDF> {
  const doc = new jsPDF();
  let yPos = 20;

  // Add company logo if available
  if (companyLogo) {
    try {
      const logoWidth = 40;
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.height / img.width;
          const logoHeight = logoWidth * aspectRatio;
          doc.addImage(companyLogo, "PNG", 20, 10, logoWidth, logoHeight);
          resolve();
        };
        img.onerror = () => {
          console.error('Error loading company logo');
          resolve();
        };
        img.crossOrigin = "Anonymous";
        img.src = companyLogo;
      });
    } catch (error) {
      console.error('Error adding company logo:', error);
    }
  }

  // Add Proply branding
  try {
    const proplyLogoWidth = 40;
    await new Promise<void>((resolve) => {
      const proplyLogo = new Image();
      proplyLogo.onload = () => {
        const aspectRatio = proplyLogo.height / proplyLogo.width;
        const proplyLogoHeight = proplyLogoWidth * aspectRatio;
        doc.addImage("/proply-logo-1.png", "PNG", 140, 10, proplyLogoWidth, proplyLogoHeight);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Powered by Proply", 140, 35);
        resolve();
      };
      proplyLogo.src = "/proply-logo-1.png";
    });
  } catch (error) {
    console.error('Error loading Proply logo:', error);
  }

  yPos = 50;

  // Generate selected sections
  for (const section of sections) {
    if (selectedSections[section.title]?.includes(section.id)) {
      yPos = section.render(doc, yPos, data);
    }
  }

  // Add page numbers and disclaimer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    if (i === pageCount) {
      const disclaimerY = doc.internal.pageSize.height - 80;
      doc.setFontSize(6);
      doc.setTextColor(100);

      const disclaimerText = [
        "DISCLAIMER: The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While we make best efforts to ensure the accuracy and reliability of all data presented, we cannot guarantee its absolute accuracy or completeness.",
        "",
        "This report is intended to serve as a general guide and should not be considered as financial, investment, legal, or professional advice. Property investment carries inherent risks, and market conditions can change rapidly.",
        "",
        "© 2025 Proply Tech (Pty) Ltd. All rights reserved."
      ];

      let currentY = disclaimerY;
      for (const text of disclaimerText) {
        if (text === "") {
          currentY += 3;
          continue;
        }
        const lines = doc.splitTextToSize(text, 170);
        for (const line of lines) {
          doc.text(line, 20, currentY);
          currentY += 3;
        }
      }
    }

    // Add page info
    doc.setFontSize(10);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      20,
      doc.internal.pageSize.height - 20
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      170,
      doc.internal.pageSize.height - 20
    );
  }

  return doc;
}

// Helper function to capture map image
export async function captureMap(mapElement: HTMLElement | null): Promise<string | null> {
  if (!mapElement) {
    console.log('Map element not found');
    return null;
  }

  try {
    const canvas = await html2canvas(mapElement, {
      useCORS: true,
      allowTaint: true,
      logging: true,
      onclone: (clonedDoc) => {
        const clonedMap = clonedDoc.querySelector('#map-container');
        if (clonedMap instanceof HTMLElement) {
          clonedMap.style.display = 'block';
          clonedMap.style.height = '300px';
          clonedMap.style.width = '100%';
        }
      }
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing map:', error);
    return null;
  }
}