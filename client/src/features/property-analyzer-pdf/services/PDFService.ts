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

  const revenueChartCanvas = document.createElement("canvas");
  revenueChartCanvas.width = 750;
  revenueChartCanvas.height = 400;

  const ctxRevenue = revenueChartCanvas.getContext("2d");
  if (ctxRevenue) {
    // Set white background
    ctxRevenue.fillStyle = "#ffffff";
    ctxRevenue.fillRect(0, 0, revenueChartCanvas.width, revenueChartCanvas.height);

    // Chart dimensions
    const chartMargin = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = revenueChartCanvas.width - chartMargin.left - chartMargin.right;
    const chartHeight = revenueChartCanvas.height - chartMargin.top - chartMargin.bottom;

    // Get max value for scaling
    const values = monthlyPerformance.map(row => [
      parseFloat(row[5].replace(/[^0-9.-]+/g, "")), // Low
      parseFloat(row[7].replace(/[^0-9.-]+/g, "")), // Medium
      parseFloat(row[9].replace(/[^0-9.-]+/g, "")), // High
      parseFloat(row[10].replace(/[^0-9.-]+/g, "")), // Long term
    ]).flat();
    const maxValue = Math.max(...values);

    // Draw axes
    ctxRevenue.beginPath();
    ctxRevenue.strokeStyle = "#000000";
    ctxRevenue.lineWidth = 1;
    // Y axis
    ctxRevenue.moveTo(chartMargin.left, chartMargin.top);
    ctxRevenue.lineTo(chartMargin.left, chartHeight + chartMargin.top);
    // X axis
    ctxRevenue.moveTo(chartMargin.left, chartHeight + chartMargin.top);
    ctxRevenue.lineTo(chartWidth + chartMargin.left, chartHeight + chartMargin.top);
    ctxRevenue.stroke();

    // Y axis labels and grid lines
    const ySteps = 5;
    const yStepSize = maxValue / ySteps;
    ctxRevenue.textAlign = "right";
    ctxRevenue.font = "10px Arial";
    for (let i = 0; i <= ySteps; i++) {
      const y = chartHeight + chartMargin.top - (i * chartHeight / ySteps);
      // Grid line
      ctxRevenue.beginPath();
      ctxRevenue.strokeStyle = "#e5e7eb";
      ctxRevenue.moveTo(chartMargin.left, y);
      ctxRevenue.lineTo(chartWidth + chartMargin.left, y);
      ctxRevenue.stroke();
      // Label
      ctxRevenue.fillStyle = "#000000";
      ctxRevenue.fillText(formatCurrency(i * yStepSize), chartMargin.left - 5, y + 4);
    }

    // X axis labels
    ctxRevenue.textAlign = "center";
    const xStep = chartWidth / (months.length - 1);
    months.forEach((month, i) => {
      const x = chartMargin.left + i * xStep;
      ctxRevenue.fillText(month, x, chartHeight + chartMargin.top + 20);
    });

    // Draw data lines
    const dataLines = [
      { values: monthlyPerformance.map(row => parseFloat(row[5].replace(/[^0-9.-]+/g, ""))), color: "#FF6B6B", label: "Low Revenue" },
      { values: monthlyPerformance.map(row => parseFloat(row[7].replace(/[^0-9.-]+/g, ""))), color: "#4ECDC4", label: "Medium Revenue" },
      { values: monthlyPerformance.map(row => parseFloat(row[9].replace(/[^0-9.-]+/g, ""))), color: "#45B7D1", label: "High Revenue" },
      { values: monthlyPerformance.map(row => parseFloat(row[10].replace(/[^0-9.-]+/g, ""))), color: "#FFE66D", label: "Long Term" }
    ];

    dataLines.forEach(({ values, color, label }, lineIndex) => {
      ctxRevenue.beginPath();
      ctxRevenue.strokeStyle = color;
      ctxRevenue.lineWidth = 2;

      values.forEach((value, i) => {
        const x = chartMargin.left + i * xStep;
        const y = chartHeight + chartMargin.top - (value / maxValue * chartHeight);
        if (i === 0) {
          ctxRevenue.moveTo(x, y);
        } else {
          ctxRevenue.lineTo(x, y);
        }
      });
      ctxRevenue.stroke();

      // Add legend
      const legendX = chartMargin.left + 20 + (lineIndex * 150);
      const legendY = chartHeight + chartMargin.top + 40;

      // Legend line
      ctxRevenue.beginPath();
      ctxRevenue.strokeStyle = color;
      ctxRevenue.moveTo(legendX, legendY);
      ctxRevenue.lineTo(legendX + 30, legendY);
      ctxRevenue.stroke();

      // Legend text
      ctxRevenue.fillStyle = "#000000";
      ctxRevenue.textAlign = "left";
      ctxRevenue.fillText(label, legendX + 40, legendY + 4);
    });
  }

  // Add chart to PDF
  pdf.addImage(
    revenueChartCanvas.toDataURL(),
    "PNG",
    margin,
    yPosition,
    contentWidth,
    100
  );
  yPosition += 120;

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
    const netOperatingIncome = data.netOperatingIncome || {};

    const tableData = [
      [
        "Annual Revenue",
        ...years.map((year) => formatCurrency(revenueData?.[`year${year}`] || 0)),
      ],
      [
        "Net Operating Income",
        ...years.map((year) => {
          const yearKey = `year${year}`;
          return formatCurrency(netOperatingIncome[yearKey]?.value || 0);
        }),
      ],
      [
        "Annual Bond Payment",
        ...years.map(() =>
          formatCurrency(data.financialMetrics.monthlyBondRepayment * 12),
        ),
      ],
      [
        "Annual Cashflow",
        ...years.map((year) => {
          const yearKey = `year${year}`;
          return formatCurrency(netOperatingIncome[yearKey]?.annualCashflow || 0);
        }),
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

  // Add description
  pdf.setFontSize(10);
  pdf.setTextColor(90);
  pdf.text(
    "This chart illustrates your property's financial trajectory over time. The green bars represent the annual cashflow, showing direct yearly performance. The blue line tracks cumulative cashflow, demonstrating how your total returns compound over the investment period. The horizontal reference line at 0 helps visualize positive versus negative cashflow periods.",
    margin,
    yPosition,
    { maxWidth: contentWidth }
  );
  yPosition += 25;

  // Reset text color and size
  pdf.setTextColor(0);
  pdf.setFontSize(12);

  // Create and render cashflow chart directly
  const cashflowCanvas = document.createElement("canvas");
  const chartWidth = 750;
  const chartHeight = 400;
  cashflowCanvas.width = chartWidth;
  cashflowCanvas.height = chartHeight;

  const ctxCashflow = cashflowCanvas.getContext("2d");
  if (ctxCashflow) {
      // Set white background
      ctxCashflow.fillStyle = "#ffffff";
      ctxCashflow.fillRect(0, 0, chartWidth, chartHeight);

      // Chart dimensions
      const chartMargin = { top: 40, right: 40, bottom: 60, left: 80 };
      const plotWidth = chartWidth - chartMargin.left - chartMargin.right;
      const plotHeight = chartHeight - chartMargin.top - chartMargin.bottom;

      // Data points (years 1-20)
      const years = [1, 2, 3, 4, 5, 10, 20];
      
      // Get annual and cumulative cashflow data
      const shortTermAnnual = years.map(year => data.netOperatingIncome[`year${year}`]?.annualCashflow || 0);
      const longTermAnnual = years.map(year => data.netOperatingIncome[`year${year}`]?.annualCashflow || 0);

      // Calculate cumulative values
      const shortTermCumulative = shortTermAnnual.reduce((acc, curr, i) => {
        acc[i] = (acc[i-1] || 0) + curr;
        return acc;
      }, []);
      
      const longTermCumulative = longTermAnnual.reduce((acc, curr, i) => {
        acc[i] = (acc[i-1] || 0) + curr;
        return acc;
      }, []);

      // Find max and min values for scaling
      const allValues = [...shortTermCumulative, ...longTermCumulative, ...shortTermAnnual, ...longTermAnnual];
      const maxValue = Math.max(...allValues) * 1.1;
      const minValue = Math.min(...allValues) * 1.1;

      // Draw zero reference line
      const zeroY = chartHeight - chartMargin.bottom - ((0 - minValue) / (maxValue - minValue) * plotHeight);
      ctxCashflow.beginPath();
      ctxCashflow.strokeStyle = "#666666";
      ctxCashflow.setLineDash([5, 5]);
      ctxCashflow.moveTo(chartMargin.left, zeroY);
      ctxCashflow.lineTo(chartWidth - chartMargin.right, zeroY);
      ctxCashflow.stroke();
      ctxCashflow.setLineDash([]);

      // Draw axes
      ctxCashflow.beginPath();
      ctxCashflow.strokeStyle = "#000000";
      ctxCashflow.lineWidth = 1;

      // Y axis
      ctxCashflow.moveTo(chartMargin.left, chartMargin.top);
      ctxCashflow.lineTo(chartMargin.left, chartHeight - chartMargin.bottom);

      // X axis
      ctxCashflow.moveTo(chartMargin.left, chartHeight - chartMargin.bottom);
      ctxCashflow.lineTo(chartWidth - chartMargin.right, chartHeight - chartMargin.bottom);
      ctxCashflow.stroke();

      // Y axis labels and grid lines
      const ySteps = 5;
      const yStepSize = (maxValue - minValue) / ySteps;
      ctxCashflow.textAlign = "right";
      ctxCashflow.font = "10px Arial";

      for (let i = 0; i <= ySteps; i++) {
          const value = minValue + (i * yStepSize);
          const y = chartHeight - chartMargin.bottom - (i * plotHeight / ySteps);

          // Grid line
          ctxCashflow.beginPath();
          ctxCashflow.strokeStyle = "#e5e7eb";
          ctxCashflow.moveTo(chartMargin.left, y);
          ctxCashflow.lineTo(chartWidth - chartMargin.right, y);
          ctxCashflow.stroke();

          // Label
          ctxCashflow.fillStyle = "#000000";
          ctxCashflow.fillText(formatCurrency(value), chartMargin.left - 5, y + 4);
      }

      // X axis labels
      ctxCashflow.textAlign = "center";
      const xStep = plotWidth / (years.length - 1);
      years.forEach((year, i) => {
          const x = chartMargin.left + (i * xStep);
          ctxCashflow.fillText(`Year ${year}`, x, chartHeight - chartMargin.bottom + 20);
      });

      // Draw bars for annual cashflow
      const barWidth = xStep * 0.3;
      shortTermData.forEach((value, i) => {
          const x = chartMargin.left + (i * xStep) - barWidth/2;
          const y = chartHeight - chartMargin.bottom - 
                   ((value - minValue) / (maxValue - minValue) * plotHeight);
          const barHeight = ((value - minValue) / (maxValue - minValue)) * plotHeight;
          
          ctxCashflow.fillStyle = "#4CAF5080"; // Green with transparency
          ctxCashflow.fillRect(x, y, barWidth, barHeight);
      });
      shortTermAnnual.forEach((value, i) => {
          const x = chartMargin.left + (i * xStep) - barWidth/2;
          const y = chartHeight - chartMargin.bottom - ((value - minValue) / (maxValue - minValue) * plotHeight);
          const height = Math.abs((value - minValue) / (maxValue - minValue) * plotHeight);
          
          ctxCashflow.fillStyle = "#4CAF5080";
          ctxCashflow.fillRect(x, y, barWidth, height);
      });

      // Draw cumulative lines
      [
          { data: shortTermCumulative, color: "#4CAF50", label: "Short Term" },
          { data: longTermCumulative, color: "#2196F3", label: "Long Term" }
      ].forEach(({ data, color, label }, index) => {
          ctxCashflow.beginPath();
          ctxCashflow.strokeStyle = color;
          ctxCashflow.lineWidth = 2;

          data.forEach((value, i) => {
              const x = chartMargin.left + (i * xStep);
              const y = chartHeight - chartMargin.bottom - 
                       ((value - minValue) / (maxValue - minValue) * plotHeight);

              if (i === 0) {
                  ctxCashflow.moveTo(x, y);
              } else {
                  ctxCashflow.lineTo(x, y);
              }
          });
          ctxCashflow.stroke();

          // Add legend
          const legendX = chartMargin.left + 20 + (index * 120);
          const legendY = chartMargin.top - 15;

          ctxCashflow.beginPath();
          ctxCashflow.strokeStyle = color;
          ctxCashflow.moveTo(legendX, legendY);
          ctxCashflow.lineTo(legendX + 30, legendY);
          ctxCashflow.stroke();

          ctxCashflow.fillStyle = "#000000";
          ctxCashflow.textAlign = "left";
          ctxCashflow.fillText(label, legendX + 40, legendY + 4);
      });
  }

  // Add chart to PDF
  pdf.addImage(
      cashflowCanvas.toDataURL(),
      "PNG",
      margin,
      yPosition,
      contentWidth,
      (contentWidth * chartHeight) / chartWidth
  );
  yPosition += (contentWidth * chartHeight) / chartWidth + 20;

  // Cashflow Projections Chart has already been handled above, removing duplicate code

  yPosition += (contentWidth * 400) / 750 + 20;

  // Asset Growth & Equity Chart
  checkPageBreak(100);
  pdf.setFontSize(16);
  pdf.text("Asset Growth & Equity", margin, yPosition);
  yPosition += 10;

  const yearsArray = [1, 2, 3, 4, 5, 10, 20];
  const calculateAssetMetrics = (year: number) => {
    const initialValue = data.propertyDetails.purchasePrice;
    const appreciation = data.financialMetrics.annualAppreciation || 5;
    const loanAmount = initialValue - data.financialMetrics.depositAmount;
    const monthlyRate = (data.financialMetrics.interestRate / 100) / 12;
    const monthlyPayment = data.financialMetrics.monthlyBondRepayment;
    const totalMonths = year * 12;

    // Calculate property value with appreciation
    const propertyValue = initialValue * Math.pow(1 + appreciation/100, year);

    // Calculate annual appreciation gain
    const appreciationGain = year === 1 
      ? initialValue * (appreciation/100)
      : propertyValue - (initialValue * Math.pow(1 + appreciation/100, year-1));

    // Calculate remaining loan balance
    let loanBalance = loanAmount;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    for (let month = 1; month <= totalMonths; month++) {
      const interestPayment = loanBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      totalInterestPaid += interestPayment;
      totalPrincipalPaid += principalPayment;
      loanBalance -= principalPayment;
    }

    // Calculate interest to principal ratio
    const interestToPrincipalRatio = (totalInterestPaid / totalPrincipalPaid) * 100;

    // Calculate total equity
    const totalEquity = propertyValue - Math.max(0, loanBalance);

    return [
      formatCurrency(propertyValue),
      formatCurrency(appreciationGain),
      formatCurrency(Math.max(0, loanBalance)),
      formatCurrency(totalInterestPaid),
      `${interestToPrincipalRatio.toFixed(1)}%`,
      formatCurrency(totalEquity),
      formatCurrency(totalPrincipalPaid)
    ];
  };

  const assetMetrics = yearsArray.map(year => calculateAssetMetrics(year));

  monthlyPerformance = months.map((month, index) => {
    // Use investment metrics data directly from analysis engine
    const performanceData = data.investmentMetrics.shortTerm[index] || {
      netWorthChange: 0,
      annualReturn: 0,
      netYield: 0,
      grossYield: 0
    };

    return [
      month,
      formatCurrency(performanceData.netWorthChange || 0),
      formatPercentage(performanceData.annualReturn || 0),
      formatPercentage(performanceData.netYield || 0),
      formatPercentage(performanceData.grossYield || 0)
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