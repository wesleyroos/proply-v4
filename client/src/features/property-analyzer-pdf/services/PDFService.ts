import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { PropertyData, ReportSelections } from "../types/propertyReport";
import { formatCurrency, formatPercentage } from "../utils/formatting";
import {
  getSeasonalNightlyRate,
  getFeeAdjustedRate,
  calculateMonthlyRevenue,
  OCCUPANCY_RATES,
  SEASONALITY_FACTORS,
} from "@/utils/rentalPerformance";

// Footer handler function
const addPageFooters = async (
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
) => {
  const totalPages = pdf.getNumberOfPages();
  const footerPadding = 5; // Padding from bottom of page

  try {
    // Load favicon
    const faviconHeight = 6;
    const faviconUrl = "/proply-logo-1.png";

    // Add footer to each page
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      // Add favicon to bottom left
      const logo = new Image();
      logo.src = faviconUrl;
      await new Promise((resolve, reject) => {
        logo.onload = () => {
          const aspectRatio = logo.width / logo.height;
          const width = faviconHeight * aspectRatio;
          pdf.addImage(
            logo,
            "PNG",
            margin,
            pageHeight - margin - faviconHeight - footerPadding,
            width,
            faviconHeight,
          );
          resolve(null);
        };
        logo.onerror = () => {
          console.error("Error loading logo in footer");
          resolve(null);
        };
      });

      // Add page numbers to bottom right
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - margin - footerPadding,
        { align: "right" },
      );
    }
  } catch (error) {
    console.error("Error adding favicon to pages:", error);
    // If favicon fails, still add page numbers
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100);
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - margin - footerPadding,
        { align: "right" },
      );
    }
  }
};

export async function generatePDF(
  data: PropertyData,
  selections: ReportSelections,
  companyLogo?: string,
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Constants for layout
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  const footerHeight = 20; // Reserved space for footer
  const disclaimerMargin = 40; // Space above footer for disclaimer

  let yPosition = margin;

  // Helper function to check and add new page if needed
  const checkPageBreak = (requiredSpace: number = 100) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Add company logo if available
  if (companyLogo) {
    try {
      const logoWidth = 40;
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.height / img.width;
          const logoHeight = logoWidth * aspectRatio;
          pdf.addImage(
            companyLogo,
            "PNG",
            margin,
            yPosition,
            logoWidth,
            logoHeight,
          );
          yPosition += logoHeight + 10;
          resolve();
        };
        img.onerror = () => {
          console.error("Error loading company logo");
          resolve();
        };
        img.crossOrigin = "Anonymous";
        img.src = companyLogo;
      });
    } catch (error) {
      console.error("Error adding company logo:", error);
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
        pdf.addImage(
          "/proply-logo-1.png",
          "PNG",
          pageWidth - margin - proplyLogoWidth,
          margin,
          proplyLogoWidth,
          proplyLogoHeight,
        );
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(
          "Powered by Proply",
          pageWidth - margin - proplyLogoWidth,
          margin + proplyLogoHeight + 5,
        );
        resolve();
      };
      proplyLogo.src = "/proply-logo-1.png";
    });
  } catch (error) {
    console.error("Error loading Proply logo:", error);
  }

  yPosition = Math.max(yPosition, 60);

  // Add title
  pdf.setFontSize(20);
  pdf.setTextColor(0);
  pdf.text("Property Analysis Report", margin, yPosition);
  yPosition += 15;

  // Property Overview
  pdf.setFontSize(16);
  pdf.text("Property Overview", margin, yPosition);
  yPosition += 10;

  // Add description
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(
    "Key details about the property including location, size, and basic features.",
    margin,
    yPosition,
  );
  yPosition += 5;

  // Reset text color for the rest of the content
  pdf.setTextColor(0);

  const propertyDetails = [
    ["Address", data.propertyDetails.address],
    ["Purchase Price", formatCurrency(data.propertyDetails.purchasePrice)],
    ["Floor Area", `${data.propertyDetails.floorArea}m²`],
    [
      "Current Property Rate/m²",
      formatCurrency(
        data.propertyDetails.purchasePrice / data.propertyDetails.floorArea,
      ),
    ],
    ["Area Rate/m²", formatCurrency(data.propertyDetails.ratePerSquareMeter)],
    [
      "Rate/m² Difference",
      formatCurrency(
        data.propertyDetails.ratePerSquareMeter -
          data.propertyDetails.purchasePrice / data.propertyDetails.floorArea,
      ),
    ],
    ["Bedrooms", data.propertyDetails.bedrooms.toString()],
    ["Bathrooms", data.propertyDetails.bathrooms.toString()],
    ["Parking Spaces", data.propertyDetails.parkingSpaces.toString()],
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [["Feature", "Details"]],
    body: propertyDetails,
    margin: { left: margin },
    styles: {
      minCellHeight: 6,
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 144, 255],
      textColor: 255,
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Only create new page if there isn't enough space for the Financial Overview section
  const requiredSpace = 80; // Reduced from 150 to 100mm
  if (yPosition + requiredSpace > pageHeight - margin) {
    pdf.addPage();
    yPosition = margin;
  }

  // Financial Overview section (moved outside the if-else)
  pdf.setFontSize(16);
  pdf.text("Financial Overview", margin, yPosition);
  yPosition += 10;

  // Add description
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(
    "Summary of the financial requirements including deposit, costs, and monthly repayments.",
    margin,
    yPosition,
  );
  yPosition += 5;

  // Reset text color
  pdf.setTextColor(0);

  const financialMetrics = [
    ["Deposit Amount", formatCurrency(data.financialMetrics.depositAmount)],
    ["Deposit Percentage", `${data.financialMetrics.depositPercentage}%`],
    ["Interest Rate", `${data.financialMetrics.interestRate}%`],
    [
      "Monthly Bond Repayment",
      formatCurrency(data.financialMetrics.monthlyBondRepayment),
    ],
    [
      "Bond Registration",
      formatCurrency(data.financialMetrics.bondRegistration),
    ],
    ["Transfer Costs", formatCurrency(data.financialMetrics.transferCosts)],
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [["Metric", "Value"]],
    body: financialMetrics,
    margin: { left: margin },
    styles: {
      minCellHeight: 6,
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 144, 255],
      textColor: 255,
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Start Rental Performance on new page
  pdf.addPage();
  yPosition = margin;

  // Rental Performance Section
  pdf.setFontSize(16);
  pdf.text("Rental Performance", margin, yPosition);
  yPosition += 10;

  // Add description
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(
    "Analysis of potential rental income for both short-term and long-term letting strategies.",
    margin,
    yPosition,
  );
  yPosition += 15;

  // Reset text color
  pdf.setTextColor(0);

  // Short Term Performance
  pdf.setFontSize(14);
  pdf.text("Short Term Rental", margin, yPosition);
  yPosition += 10;

  const shortTermPerformance = [
    ["Nightly Rate", formatCurrency(data.performance.shortTermNightlyRate)],
    ["Annual Occupancy", `${data.performance.annualOccupancy}%`],
    ["Annual Revenue", formatCurrency(data.performance.shortTermAnnualRevenue)],
    [
      "Gross Yield",
      `${formatPercentage(data.performance.shortTermGrossYield)}%`,
    ],
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [["Metric", "Value"]],
    body: shortTermPerformance,
    margin: { left: margin },
    styles: {
      minCellHeight: 6,
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 144, 255],
      textColor: 255,
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  // Long Term Performance
  pdf.setFontSize(14);
  pdf.text("Long Term Rental", margin, yPosition);
  yPosition += 10;

  const longTermPerformance = [
    [
      "Monthly Revenue",
      formatCurrency(data.performance.longTermAnnualRevenue / 12),
    ],
    ["Annual Revenue", formatCurrency(data.performance.longTermAnnualRevenue)],
    [
      "Gross Yield",
      `${formatPercentage(data.performance.longTermGrossYield)}%`,
    ],
  ];

  autoTable(pdf, {
    startY: yPosition,
    head: [["Metric", "Value"]],
    body: longTermPerformance,
    margin: { left: margin },
    styles: {
      minCellHeight: 6,
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 144, 255],
      textColor: 255,
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 15;

  checkPageBreak(150);

  // Monthly Revenue Performance Graph
  pdf.setFontSize(14);
  pdf.text("Monthly Revenue Performance", margin, yPosition);
  yPosition += 10;

  // Add description
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(
    "Detailed breakdown of expected monthly revenue across different occupancy scenarios.",
    margin,
    yPosition,
  );
  yPosition += 5;

  // Reset text color
  pdf.setTextColor(0);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const baseRate = data.performance.shortTermNightlyRate;
  const platformFee = data.expenses.managementFee || 0;

  let monthlyPerformance = months.map((month, index) => {
    const lowOcc = OCCUPANCY_RATES.low[index];
    const medOcc = OCCUPANCY_RATES.medium[index];
    const highOcc = OCCUPANCY_RATES.high[index];
    const monthlyLongTerm = data.performance.longTermAnnualRevenue / 12;

    // Get seasonal nightly rate
    const seasonalRate = baseRate * SEASONALITY_FACTORS[index];

    // Calculate platform fee amount (15% if managed, 3% if not)
    const platformFeeRate = data.expenses.managementFee > 0 ? 0.15 : 0.03;
    const platformFeeAmount = seasonalRate * platformFeeRate;
    const feeAdjustedRate = seasonalRate * (1 - platformFeeRate);

    // Calculate monthly revenue for each occupancy scenario
    const daysInMonth = 30;
    const lowRevenue = feeAdjustedRate * daysInMonth * (lowOcc / 100);
    const medRevenue = feeAdjustedRate * daysInMonth * (medOcc / 100);
    const highRevenue = feeAdjustedRate * daysInMonth * (highOcc / 100);

    return [
      month,
      formatCurrency(seasonalRate),
      formatCurrency(platformFeeAmount),
      formatCurrency(feeAdjustedRate),
      `${lowOcc}%`,
      formatCurrency(lowRevenue),
      `${medOcc}%`,
      formatCurrency(medRevenue),
      `${highOcc}%`,
      formatCurrency(highRevenue),
      formatCurrency(monthlyLongTerm),
    ];
  });

  const lineChartCanvas = document.createElement("canvas");
  lineChartCanvas.width = 750;
  lineChartCanvas.height = 300;

  const ctx = lineChartCanvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, lineChartCanvas.width, lineChartCanvas.height);

    const datasets = [
      {
        data: monthlyPerformance.map((row) =>
          parseFloat(row[5].replace(/[^0-9.-]+/g, "")),
        ),
        color: "#FF6B6B",
        label: "Low Revenue",
      },
      {
        data: monthlyPerformance.map((row) =>
          parseFloat(row[7].replace(/[^0-9.-]+/g, "")),
        ),
        color: "#4ECDC4",
        label: "Medium Revenue",
      },
      {
        data: monthlyPerformance.map((row) =>
          parseFloat(row[9].replace(/[^0-9.-]+/g, "")),
        ),
        color: "#45B7D1",
        label: "High Revenue",
      },
      {
        data: monthlyPerformance.map((row) =>
          parseFloat(row[10].replace(/[^0-9.-]+/g, "")),
        ),
        color: "#FFE66D",
        label: "Long Term",
      },
    ];

    const maxValue = Math.max(...datasets.flatMap((d) => d.data));
    const steps = 5;
    const stepSize = maxValue / steps;

    // Draw grid lines and labels
    ctx.strokeStyle = "#e5e7eb";
    ctx.fillStyle = "#4b5563";
    ctx.font = "10px Arial";

    for (let i = 0; i <= steps; i++) {
      const y = 250 - i * (200 / steps);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(700, y);
      ctx.stroke();
      ctx.fillText(formatCurrency(i * stepSize), 0, y + 5);
    }

    // Draw x-axis labels (months)
    months.forEach((month, i) => {
      const x = 50 + i * (650 / 11);
      ctx.fillText(month, x - 10, 270);
    });

    // Draw lines
    datasets.forEach(({ data, color, label }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((value, i) => {
        const x = 50 + i * (650 / 11);
        const y = 250 - (value / maxValue) * 200;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Add legend
      const legendY = 290 + datasets.indexOf({ data, color, label }) * 15;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(50 + datasets.indexOf({ data, color, label }) * 150, legendY);
      ctx.lineTo(80 + datasets.indexOf({ data, color, label }) * 150, legendY);
      ctx.stroke();
      ctx.fillStyle = "#000000";
      ctx.fillText(
        label,
        85 + datasets.indexOf({ data, color, label }) * 150,
        legendY + 5,
      );
    });
  }

  // Add the chart to PDF
  pdf.addImage(
    lineChartCanvas.toDataURL(),
    "PNG",
    margin,
    yPosition,
    contentWidth,
    80,
  );
  yPosition += 90;

  checkPageBreak();

  // Add Monthly Performance Table
  // Add total row
  monthlyPerformance.push([
    "Total",
    "-",
    "-",
    "-",
    "-",
    formatCurrency(
      monthlyPerformance.reduce(
        (sum, row) => sum + parseFloat(row[5].replace(/[^0-9.-]+/g, "")),
        0,
      ),
    ),
    "-",
    formatCurrency(
      monthlyPerformance.reduce(
        (sum, row) => sum + parseFloat(row[7].replace(/[^0-9.-]+/g, "")),
        0,
      ),
    ),
    "-",
    formatCurrency(
      monthlyPerformance.reduce(
        (sum, row) => sum + parseFloat(row[9].replace(/[^0-9.-]+/g, "")),
        0,
      ),
    ),
    formatCurrency(data.performance.longTermAnnualRevenue),
  ]);

  // Add average row
  monthlyPerformance.push([
    "Average",
    formatCurrency(baseRate),
    `${data.expenses.managementFee > 0 ? "15" : "3"}%`,
    formatCurrency(
      baseRate * (1 - (data.expenses.managementFee > 0 ? 0.15 : 0.03)),
    ),
    "45%",
    formatCurrency(monthlyPerformance[12][5].replace(/[^0-9.-]+/g, "") / 12),
    "65%",
    formatCurrency(monthlyPerformance[12][7].replace(/[^0-9.-]+/g, "") / 12),
    "85%",
    formatCurrency(monthlyPerformance[12][9].replace(/[^0-9.-]+/g, "") / 12),
    formatCurrency(data.performance.longTermAnnualRevenue / 12),
  ]);

  autoTable(pdf, {
    startY: yPosition,
    head: [
      [
        "Month",
        "Nightly Rate",
        "Platform Fee",
        "Adj Rate",
        "Low Occ",
        "Low Rev",
        "Med Occ",
        "Med Rev",
        "High Occ",
        "High Rev",
        "Long Term",
      ],
    ],
    body: monthlyPerformance,
    margin: { left: margin },
    styles: {
      minCellHeight: 5,
      fontSize: 6,
      cellWidth: "auto",
      cellPadding: 1,
    },
    headStyles: {
      fillColor: [30, 144, 255],
      textColor: 255,
      fontSize: 7,
    },
    columnStyles: {
      5: { fillColor: [255, 107, 107] }, // #FF6B6B - Low Revenue
      7: { fillColor: [78, 205, 196] }, // #4ECDC4 - Medium Revenue
      9: { fillColor: [69, 183, 209] }, // #45B7D1 - High Revenue
      10: { fillColor: [255, 230, 109] }, // #FFE66D - Long Term
    },
    didParseCell: function (data) {
      // Make total and average rows bold
      if (
        data.row.index === monthlyPerformance.length - 2 ||
        data.row.index === monthlyPerformance.length - 1
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.font = "helvetica";
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [243, 244, 246];
        data.cell.styles.textColor = [31, 41, 55];
      }
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 20;

  // Add Cashflow Metrics (on new page)
  pdf.addPage();
  yPosition = margin;

  pdf.setFontSize(16);
  pdf.setTextColor(0);
  pdf.text("Cashflow Metrics", margin, yPosition);
  yPosition += 10;

  // Add description
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(
    "Long and short financial projections showing expected returns and cash flows over time.",
    margin,
    yPosition,
  );
  yPosition += 15;

  // Reset text color
  pdf.setTextColor(0);

  const addCashflowMetricsTable = (
    term: "shortTerm" | "longTerm",
    title: string,
    startY: number,
  ) => {
    // Check if we need to start a new page before the table
    if (startY > pdf.internal.pageSize.height - 150) {
      pdf.addPage();
      startY = margin;
    }

    pdf.setFontSize(14);
    pdf.text(title, margin, startY);
    startY += 10;

    const years = [1, 2, 3, 4, 5, 10, 20];
    const metrics = data.investmentMetrics?.[term] || [];
    const revenueData = data.revenueProjections?.[term] || {};

    const tableData = [
      [
        "Annual Revenue",
        ...years.map((year) => formatCurrency(revenueData[`year${year}`] || 0)),
      ],
      [
        "Net Operating Income",
        ...years.map((year) =>
          formatCurrency(
            revenueData[`year${year}`] -
              (data.operatingExpenses[`year${year}`] || 0),
          ),
        ),
      ],
      [
        "Annual Bond Payment",
        ...years.map(() =>
          formatCurrency(data.financialMetrics.monthlyBondRepayment * 12),
        ),
      ],
      [
        "Annual Cashflow",
        ...metrics.map((m) => formatCurrency(m.netWorthChange || 0)),
      ],
      [
        "Cumulative Cashflow",
        ...metrics.map((m, i) =>
          formatCurrency(
            metrics
              .slice(0, i + 1)
              .reduce((sum, curr) => sum + (curr.netWorthChange || 0), 0),
          ),
        ),
      ],
    ];

    autoTable(pdf, {
      startY: startY,
      head: [
        [
          "Metric",
          "Year 1",
          "Year 2",
          "Year 3",
          "Year 4",
          "Year 5",
          "Year 10",
          "Year 20",
        ],
      ],
      body: tableData,
      margin: { left: margin },
      styles: {
        minCellHeight: 6,
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [30, 144, 255],
        textColor: 255,
      },
    });
    return (pdf as any).lastAutoTable.finalY + 15;
  };

  yPosition = addCashflowMetricsTable(
    "shortTerm",
    "Short Term Cashflow Metrics",
    yPosition,
  );
  yPosition = addCashflowMetricsTable(
    "longTerm",
    "Long Term Cashflow Metrics",
    yPosition,
  );

  // Add Investment Metrics (on new page)
  pdf.addPage();
  yPosition = margin;

  pdf.setFontSize(16);
  pdf.setTextColor(0);
  pdf.text("Investment Metrics", margin, yPosition);
  yPosition += 10;

  // Add description
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(
    "Key performance indicators showing returns and yields over different time periods.",
    margin,
    yPosition,
  );
  yPosition += 15;

  // Reset text color
  pdf.setTextColor(0);

  const addInvestmentMetricsTable = (
    term: "shortTerm" | "longTerm",
    title: string,
    startY: number,
  ) => {
    pdf.setFontSize(14);
    pdf.text(title, margin, startY);
    startY += 10;

    const years = [1, 2, 3, 4, 5, 10, 20];
    const metrics = data.investmentMetrics?.[term] || [];

    const tableData = [
      ["Gross Yield", ...metrics.map((m) => formatPercentage(m.grossYield))],
      ["Net Yield", ...metrics.map((m) => formatPercentage(m.netYield))],
      ["ROE", ...metrics.map((m) => formatPercentage(m.returnOnEquity))],
      [
        "Annual Return",
        ...metrics.map((m) => formatPercentage(m.annualReturn)),
      ],
      ["Cap Rate", ...metrics.map((m) => formatPercentage(m.capRate))],
      [
        "Cash on Cash",
        ...metrics.map((m) => formatPercentage(m.cashOnCashReturn)),
      ],
      ["IRR", ...metrics.map((m) => formatPercentage(m.irr))],
      [
        "Net Worth Change",
        ...metrics.map((m) => formatCurrency(m.netWorthChange)),
      ],
    ];

    autoTable(pdf, {
      startY: startY,
      head: [["Metric", ...years.map((year) => `Year ${year}`)]],
      body: tableData,
      margin: { left: margin },
      styles: {
        minCellHeight: 6,
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [30, 144, 255],
        textColor: 255,
      },
    });
    return (pdf as any).lastAutoTable.finalY + 15;
  };

  yPosition = addInvestmentMetricsTable(
    "shortTerm",
    "Short Term Investment Metrics",
    yPosition,
  );
  yPosition = addInvestmentMetricsTable(
    "longTerm",
    "Long Term Investment Metrics",
    yPosition,
  );

  // Add Data Visualizations section
  pdf.addPage();
  yPosition = margin;

  // Cashflow Projections Chart
  pdf.setFontSize(16);
  pdf.setTextColor(0);
  pdf.text("Cashflow Projections", margin, yPosition);
  yPosition += 10;

  const cashflowCanvas = document.createElement("canvas");
  const cashflowChart = document.querySelector('[data-testid="cashflow-chart"]');
  if (cashflowChart) {
    const chartWidth = 750;
    const chartHeight = 400;
    cashflowCanvas.width = chartWidth;
    cashflowCanvas.height = chartHeight;

    try {
      await html2canvas(cashflowChart, {
        canvas: cashflowCanvas,
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        windowWidth: chartWidth,
        windowHeight: chartHeight
      });
    } catch (error) {
      console.error('Error capturing cashflow chart:', error);
    }

    pdf.addImage(
      cashflowCanvas.toDataURL(),
      "PNG",
      margin,
      yPosition,
      contentWidth,
      (contentWidth * chartHeight) / chartWidth
    );
  }

  yPosition += (contentWidth * 400) / 750 + 20;

  // Asset Growth & Equity Chart
  checkPageBreak(100);
  pdf.setFontSize(16);
  pdf.text("Asset Growth & Equity", margin, yPosition);
  yPosition += 10;

// Update how we access the investment metrics
const yearsArray = [1, 2, 3, 4, 5, 10, 20];
const assetMetrics = yearsArray.map((year, i) => {
  const metrics = data.investmentMetrics.shortTerm[i];
  return [
    formatCurrency(metrics.propertyValue || 0),
    formatCurrency(metrics.appreciationGain || 0),
    formatCurrency(metrics.loanBalance || 0),
    formatCurrency(metrics.interestPaid || 0),
    `${metrics.interestToPrincipalRatio || 0}%`,
    formatCurrency(metrics.totalEquity || 0),
    formatCurrency(metrics.principalPaid || 0)
  ];
});

  // Use the existing performance calculations since they're based on the pre-calculated values
  const performanceData = data.performance.yearlyPerformance?.[`year${index + 1}`] || {
    revenue: 0,
    expenses: 0,
    netIncome: 0,
    occupancy: 0,
    cashflow: 0
  };

  return [
      month,
      formatCurrency(performanceData.revenue),
      formatCurrency(performanceData.expenses),
      formatCurrency(performanceData.netIncome),
      `${performanceData.occupancy}%`,
      formatCurrency(performanceData.cashflow)
    ];
  });

  yPosition += (contentWidth * 400) / 750 + 20;
  checkPageBreak(200);

  autoTable(pdf, {
    startY: yPosition,
    head: [
      ["Metric", ...yearsArray.map(year => `Year ${year}`)],
    ],
    body: [
      ["Property Value", ...assetMetrics.map(m => m[0])],
      ["Annual Appreciation", ...assetMetrics.map(m => m[1])],
      ["Loan Balance", ...assetMetrics.map(m => m[2])],
      ["Total Interest Paid", ...assetMetrics.map(m => m[3])],
      ["Interest-to-Principal Ratio", ...assetMetrics.map(m => m[4])],
      ["Total Equity", ...assetMetrics.map(m => m[5])],
      ["Loan Repayment Equity",...assetMetrics.map(m => m[6])]
    ],
    margin: { left: margin },
    styles: {
      minCellHeight: 6,
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [30, 144, 255],
      textColor: 255,
    },
  });

  yPosition = (pdf as any).lastAutoTable.finalY + 20;

  const assetGrowthCanvas = document.createElement("canvas");
  const assetGrowthChart = document.getElementById("asset-growth-chart");
  if (assetGrowthChart) {
    const chartWidth = 750;
    const chartHeight = 400;
    assetGrowthCanvas.width = chartWidth;
    assetGrowthCanvas.height = chartHeight;

    await html2canvas(assetGrowthChart, {
      canvas: assetGrowthCanvas,
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    pdf.addImage(
      assetGrowthCanvas.toDataURL(),
      "PNG",
      margin,
      yPosition,
      contentWidth,
      (contentWidth * chartHeight) / chartWidth
    );
  }

  yPosition += (contentWidth * 400) / 750 + 20;

  // Get the current page count before adding disclaimer
  const totalPages = pdf.getNumberOfPages();
  const currentYear = new Date().getFullYear();

  // Set to last page for disclaimer
  pdf.setPage(totalPages);

  // Calculate space needed for disclaimer
  const currentY = (pdf as any).lastAutoTable.finalY;

  // Position for disclaimer (anchored above the footer)
  let disclaimerY = pageHeight - footerHeight - disclaimerMargin - 10; // Adjusted to move it up

  // Define disclaimer text
  pdf.setFontSize(8);
  pdf.setTextColor(90);

  const disclaimerText = [
    "DISCLAIMER: The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While we make best efforts to ensure the accuracy and reliability of all data presented, including sourcing information from trusted third-party providers, we cannot guarantee its absolute accuracy or completeness.",
    "",
    "This report is intended to serve as a general guide and should not be considered as financial, investment, legal, or professional advice. Any decisions made based on this information are solely the responsibility of the user. Property investment carries inherent risks, and market conditions can change rapidly.",
    "",
    "Proply Tech (Pty) Ltd and its affiliates expressly disclaim any and all liability for any direct, indirect, incidental, or consequential damages arising from the use of this information. Actual results may vary significantly from the projections and estimates presented.",
    "",
    "By using this report, you acknowledge that the calculations and projections are indicative only and based on the information available at the time of generation. Factors beyond our control, including but not limited to market fluctuations, regulatory changes, and economic conditions, may impact actual outcomes.",
    "",
    `© ${currentYear} Proply Tech (Pty) Ltd. All rights reserved.`,
  ];

  // Calculate total height needed for disclaimer
  const lines = disclaimerText
    .map((line) => pdf.splitTextToSize(line, contentWidth))
    .flat();
  const totalDisclaimerHeight =
    lines.length * 3 + (disclaimerText.length - 1) * 2;

  // If disclaimer doesn't fit, add a new page
  if (currentY + totalDisclaimerHeight + footerHeight + margin > pageHeight) {
    pdf.addPage();
    disclaimerY = pageHeight - footerHeight - disclaimerMargin - 40; // Adjusted to move it up
  }

  // Add disclaimer text properly
  disclaimerText.forEach((line) => {
    const splitLines = pdf.splitTextToSize(line, contentWidth);
    splitLines.forEach((splitLine) => {
      pdf.text(splitLine, margin, disclaimerY);
      disclaimerY += 3;
    });
    disclaimerY += 2;
  });

  // Add footers to all pages (including favicon and page numbers)
  await addPageFooters(pdf, pageWidth, pageHeight, margin);

  // Save the PDF
  const pdfOutput = pdf.output("blob");
  const url = URL.createObjectURL(pdfOutput);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.propertyDetails.address.replace(/[^a-zA-Z0-9]/g, "_")}_analysis.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}