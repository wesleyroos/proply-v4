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

      // Add centered copyright text
      const currentYear = new Date().getFullYear();
      pdf.text(
        `© ${currentYear} Proply Tech (Pty) Ltd. All rights reserved.`,
        pageWidth / 2,
        pageHeight - margin - footerPadding,
        { align: "center" },
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
  try {
    // Add data validation with more specific error messages
    if (!data) {
      throw new Error("PDF Generation Error: No data provided");
    }

    if (!data.propertyDetails) {
      throw new Error("PDF Generation Error: Property details missing");
    }

    console.log("1!@!@!@!");
    console.log(selections);
    console.log("2!@!@!@!");
    console.log(data);

    // Create safe references with proper type assertions
    // let details = data.propertyDetails

    // as {
    //   address: string;
    //   purchasePrice: number;
    //   floorArea: number;
    //   ratePerSquareMeter: number;
    //   bedrooms: number;
    //   bathrooms: number;
    //   parkingSpaces: number;
    // };

    // const performance = data.performance || {
    //   shortTermNightlyRate: 0,
    //   annualOccupancy: 0,
    //   shortTermAnnualRevenue: 0,
    //   longTermAnnualRevenue: 0,
    //   shortTermGrossYield: 0,
    //   longTermGrossYield: 0
    // };

    // const metrics = data.financialMetrics || {
    //   depositAmount: 0,
    //   depositPercentage: 0,
    //   interestRate: 0,
    //   monthlyBondRepayment: 0,
    //   bondRegistration: 0,
    //   transferCosts: 0,
    //   loanTerm: 20,
    //   annualAppreciation: 5
    // };

    // const expenses = data.operatingExpenses || {
    //   managementFee: data.propertyDetails?.managementFee || 0,
    //   monthlyLevies: 0,
    //   monthlyRatesTaxes: 0,
    //   otherMonthlyExpenses: 0,
    //   maintenancePercent: 0
    // };

    // const analysis = data.analysis || {
    //   netOperatingIncome: {},
    //   longTermNetOperatingIncome: {},
    //   revenueProjections: { shortTerm: {}, longTerm: {} }
    // };

    // Initialize PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Helper to check if section/item is selected
    const isSelected = (section: string, item: string) => {
      return selections[section]?.[item] === true;
    };

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
      ...(isSelected("propertyDetails", "address")
        ? [["Address", data.propertyDetails.address]]
        : []),
      ...(isSelected("propertyDetails", "purchasePrice")
        ? [
            [
              "Purchase Price",
              formatCurrency(data.propertyDetails.purchasePrice),
            ],
          ]
        : []),
      ...(isSelected("propertyDetails", "floorArea")
        ? [["Floor Area", `${data.propertyDetails.floorArea}m²`]]
        : []),
      [
        "Current Property Rate/m²",
        formatCurrency(
          data.propertyDetails. purchasePrice / data.propertyDetails.floorArea,
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
      ...(isSelected("financialMetrics", "depositAmount")
        ? [
            [
              "Deposit Amount",
              formatCurrency(data.financialMetrics.depositAmount),
            ],
          ]
        : []),
      ...(isSelected("financialMetrics", "depositPercentage")
        ? [
            [
              "Deposit Percentage",
              `${data.financialMetrics.depositPercentage}%`,
            ],
          ]
        : []),
      ...(isSelected("financialMetrics", "interestRate")
        ? [["Interest Rate", `${data.financialMetrics.interestRate}%`]]
        : []),
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
      [
        "Annual Revenue",
        formatCurrency(data.performance.shortTermAnnualRevenue),
      ],
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
      [
        "Annual Revenue",
        formatCurrency(data.performance.longTermAnnualRevenue),
      ],
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
    const baseRate =
      data.performance?.shortTermNightlyRate ||
      data.propertyDetails?.shortTermNightlyRate ||
      0;

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
      ctxRevenue.fillRect(
        0,
        0,
        revenueChartCanvas.width,
        revenueChartCanvas.height,
      );

      // Chart dimensions
      const chartMargin = { top: 40, right: 40, bottom: 60, left: 60 };
      const chartWidth =
        revenueChartCanvas.width - chartMargin.left - chartMargin.right;
      const chartHeight =
        revenueChartCanvas.height - chartMargin.top - chartMargin.bottom;

      // Get max value for scaling
      const values = monthlyPerformance
        .map((row) => [
          parseFloat(row[5].replace(/[^0-9.-]+/g, "")), // Low
          parseFloat(row[7].replace(/[^0-9.-]+/g, "")), // Medium
          parseFloat(row[9].replace(/[^0-9.-]+/g, "")), // High
          parseFloat(row[10].replace(/[^0-9.-]+/g, "")), // Long term
        ])
        .flat();
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
      ctxRevenue.lineTo(
        chartWidth + chartMargin.left,
        chartHeight + chartMargin.top,
      );
      ctxRevenue.stroke();

      // Y axis labels and grid lines
      const ySteps = 5;
      const yStepSize = maxValue / ySteps;
      ctxRevenue.textAlign = "right";
      ctxRevenue.font = "10px Arial";
      for (let i = 0; i <= ySteps; i++) {
        const y = chartHeight + chartMargin.top - (i * chartHeight) / ySteps;
        // Grid line
        ctxRevenue.beginPath();
        ctxRevenue.strokeStyle = "#e5e7eb";
        ctxRevenue.moveTo(chartMargin.left, y);
        ctxRevenue.lineTo(chartWidth + chartMargin.left, y);
        ctxRevenue.stroke();
        // Label
        ctxRevenue.fillStyle = "#000000";
        ctxRevenue.fillText(
          formatCurrency(i * yStepSize),
          chartMargin.left - 5,
          y + 4,
        );
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
        {
          values: monthlyPerformance.map((row) =>
            parseFloat(row[5].replace(/[^0-9.-]+/g, "")),
          ),
          color: "#FF6B6B",
          label: "Low Revenue",
        },
        {
          values: monthlyPerformance.map((row) =>
            parseFloat(row[7].replace(/[^0-9.-]+/g, "")),
          ),
          color: "#4ECDC4",
          label: "Medium Revenue",
        },
        {
          values: monthlyPerformance.map((row) =>
            parseFloat(row[9].replace(/[^0-9.-]+/g, "")),
          ),
          color: "#45B7D1",
          label: "High Revenue",
        },
        {
          values: monthlyPerformance.map((row) =>
            parseFloat(row[10].replace(/[^0-9.-]+/g, "")),
          ),
          color: "#FFE66D",
          label: "Long Term",
        },
      ];

      dataLines.forEach(({ values, color, label }, lineIndex) => {
        ctxRevenue.beginPath();
        ctxRevenue.strokeStyle = color;
        ctxRevenue.lineWidth = 2;

        values.forEach((value, i) => {
          const x = chartMargin.left + i * xStep;
          const y =
            chartHeight + chartMargin.top - (value / maxValue) * chartHeight;
          if (i === 0) {
            ctxRevenue.moveTo(x, y);
          } else {
            ctxRevenue.lineTo(x, y);
          }
        });
        ctxRevenue.stroke();

        // Add legend
        const legendX = chartMargin.left + 20 + lineIndex * 150;
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
      100,
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

    // addCashflowMetricsTable function

    const addCashflowMetricsTable = (
      term: "shortTerm" | "longTerm",
      title: string,
      startY: number,
    ) => {
      // Add detailed debug logging
      console.log(`Detailed Data for ${term} Cashflow Table:`, {
        fullData: data,
        analysis: data.analysis,
        operatingIncome: data.analysis?.netOperatingIncome,
        longTermOperatingIncome: data.analysis?.longTermNetOperatingIncome,
        revenueProjections: data.analysis?.revenueProjections,
        term: term,
        path:
          term === "shortTerm"
            ? "data.analysis.netOperatingIncome"
            : "data.analysis.longTermNetOperatingIncome",
      });

      // Check if we need to start a new page before the table
      if (startY > pdf.internal.pageSize.height - 150) {
        pdf.addPage();
        startY = margin;
      }

      pdf.setFontSize(14);
      pdf.text(title, margin, startY);
      startY += 10;

      const years = [1, 2, 3, 4, 5, 10, 20];
      const operatingIncome = term === "shortTerm" ? data.analysis.netOperatingIncome : data.analysis.longTermNetOperatingIncome || {};
      const revenueData = data.analysis.revenueProjections?.[term] || {};

      // // Add debug log after getting operating income
      // console.log(`${term} Operating Income Data:`, {
      //   operatingIncome,
      //   path:
      //     term === "shortTerm"
      //       ? "data.analysis.netOperatingIncome"
      //       : "data.analysis.longTermNetOperatingIncome",
      // });

      // // Add debug log after getting revenue data
      // console.log(`${term} Revenue Data:`, {
      //   revenueData,
      //   fullRevenueProjections: data.analysis.revenueProjections,
      //   path: `data.analysis.revenueProjections.${term}`,
      // });

      const tableData = [
        [
          "Annual Revenue",
          ...years.map((year) => {
            const yearKey = `year${year}` as keyof typeof revenueData;
            return formatCurrency(revenueData?.[yearKey] || 0);
          }),
        ],
        [
          "Net Operating Income",
          ...years.map((year) => {
            const yearKey = `year${year}` as keyof typeof operatingIncome;
            return formatCurrency(operatingIncome?.[yearKey]?.value || 0);
          }),
        ],
        [
          "Net Operating Expense",
          ...years.map((year) => {
            const yearKey = `year${year}` as keyof typeof operatingIncome;
            return formatCurrency(revenueData?.[yearKey] - operatingIncome?.[yearKey]?.value || 0);
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
            const yearKey = `year${year}` as keyof typeof operatingIncome;
            return formatCurrency(
              operatingIncome?.[yearKey]?.annualCashflow || 0,
            );
          }),
        ],
        [
          "Cumulative Cashflow",
          ...years.map((_, index) => {
            let cumulative = 0;
            for (let i = 0; i <= index; i++) {
              const y = years[i];
              const yearKey = `year${y}` as keyof typeof operatingIncome;
              cumulative += operatingIncome?.[yearKey]?.annualCashflow || 0;
            }
            return formatCurrency(cumulative);
          }),
        ],
      ];

      autoTable(pdf, {
        startY: startY,
        head: [["Metric", ...years.map((year) => `Year ${year}`)]],
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
        [
          "Gross Yield",
          ...years.map((year) => {
            const metric = metrics[year - 1] || {};
            return formatPercentage(metric.grossYield || 0);
          }),
        ],
        [
          "Net Yield",
          ...years.map((year) => {
            const metric = metrics[year - 1] || {};
            return formatPercentage(metric.netYield || 0);
          }),
        ],
        [
          "ROE",
          ...years.map((year) => {
            const metric = metrics[year - 1] || {};
            return formatPercentage(metric.returnOnEquity || 0);
          }),
        ],
        [
          "Annual Return",
          ...years.map((year) => {
            const metric = metrics[year - 1] || {};
            return formatPercentage(metric.annualReturn || 0);
          }),
        ],
        [
          "Cap Rate",
          ...years.map((year) => {
            const metric = metrics[year - 1] || {};
            return formatPercentage(metric.capRate || 0);
          }),
        ],
        [
          "Cash on Cash",
          ...years.map((year) => {
            const metric = metrics[year - 1] || {};
            return formatPercentage(metric.cashOnCashReturn || 0);
          }),
        ],
        [
          "IRR",
          ...years.map((year) => {
            const metric = metrics[year - 1] || {};
            return formatPercentage(metric.irr || 0);
          }),
        ],
        [
          "Net Worth Change",
          ...years.map((year) => {
            const metric = metrics[year - 1] || {};
            return formatCurrency(metric.netWorthChange || 0);
          }),
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
      "This chart illustrates the property's financial trajectory over time. The bars represent the annual cashflow for both long and short-term, showing direct yearly performance. The lines tracks cumulative cashflow for both long and short-term cashflow, demonstrating how the total returns compound over the investment period.",
      margin,
      yPosition,
      { maxWidth: contentWidth },
    );
    yPosition += 25;

    // Reset text color and size
    pdf.setTextColor(0);
    pdf.setFontSize(12);

    /// Create and render cashflow chart directly
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

      // Years array
      const years = [1, 2, 3, 4, 5, 10, 20];

      // Prepare chart data structure similar to Recharts component
      let shortTermCumulativeTotal = 0;
      let longTermCumulativeTotal = 0;

      const chartData = years.map((year) => {
        const yearKey =
          `year${year}` as keyof typeof data.analysis.netOperatingIncome;

        // Short-term calculations
        const shortTermAnnual =
          data.analysis.netOperatingIncome[yearKey].annualCashflow;
        shortTermCumulativeTotal += shortTermAnnual;

        // Long-term calculations
        const longTermAnnual =
          data.analysis.longTermNetOperatingIncome[yearKey].annualCashflow;
        longTermCumulativeTotal += longTermAnnual;

        return {
          year: `Year ${year}`,
          shortTermAnnual,
          shortTermCumulative: shortTermCumulativeTotal,
          longTermAnnual,
          longTermCumulative: longTermCumulativeTotal,
        };
      });

      // Calculate min and max values for Y axis scaling
      const allValues = chartData.flatMap((d) => [
        d.shortTermAnnual,
        d.shortTermCumulative,
        d.longTermAnnual,
        d.longTermCumulative,
      ]);
      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      const roundedMin = Math.floor(minValue / 100000) * 100000;
      const roundedMax = Math.ceil(maxValue / 100000) * 100000;
      const valueRange = roundedMax - roundedMin;

      // Helper function to convert value to Y coordinate
      const getYCoordinate = (value: number) => {
        return (
          chartMargin.top +
          plotHeight -
          ((value - roundedMin) / valueRange) * plotHeight
        );
      };

      // Draw grid lines and Y-axis labels
      const numberOfTicks = 10;
      const tickInterval = valueRange / (numberOfTicks - 1);

      for (let i = 0; i <= numberOfTicks - 1; i++) {
        const value = roundedMin + tickInterval * i;
        const y = getYCoordinate(value);

        // Grid line
        ctxCashflow.beginPath();
        ctxCashflow.strokeStyle = "#e5e7eb";
        ctxCashflow.moveTo(chartMargin.left, y);
        ctxCashflow.lineTo(chartWidth - chartMargin.right, y);
        ctxCashflow.stroke();

        // Y-axis label
        ctxCashflow.fillStyle = "#64748b";
        ctxCashflow.textAlign = "right";
        ctxCashflow.font = "10px Arial";
        ctxCashflow.fillText(
          formatCurrency(value),
          chartMargin.left - 10,
          y + 4,
        );
      }

      // Draw X-axis labels
      chartData.forEach((data, i) => {
        const x = chartMargin.left + i * (plotWidth / (years.length - 1));
        ctxCashflow.fillStyle = "#64748b";
        ctxCashflow.textAlign = "center";
        ctxCashflow.fillText(
          data.year,
          x,
          chartHeight - chartMargin.bottom + 20,
        );
      });

      // Draw zero line
      const zeroY = getYCoordinate(0);
      ctxCashflow.beginPath();
      ctxCashflow.strokeStyle = "#94a3b8";
      ctxCashflow.setLineDash([5, 5]);
      ctxCashflow.moveTo(chartMargin.left, zeroY);
      ctxCashflow.lineTo(chartWidth - chartMargin.right, zeroY);
      ctxCashflow.stroke();
      ctxCashflow.setLineDash([]);

      // Calculate bar dimensions
      const barWidth = plotWidth / (years.length * 4); // Divide space for both sets of bars
      const barSpacing = barWidth / 2;

      // Draw bars and lines
      chartData.forEach((data, i) => {
        const x = chartMargin.left + i * (plotWidth / (years.length - 1));

        // Short-term annual bar (purple)
        const shortTermY = getYCoordinate(data.shortTermAnnual);
        const shortTermHeight = Math.abs(zeroY - shortTermY);
        ctxCashflow.fillStyle = "rgba(136, 132, 216, 0.6)"; // #8884d8 with transparency
        ctxCashflow.fillRect(
          x - barWidth - barSpacing,
          data.shortTermAnnual >= 0 ? shortTermY : zeroY,
          barWidth,
          shortTermHeight,
        );

        // Long-term annual bar (green)
        const longTermY = getYCoordinate(data.longTermAnnual);
        const longTermHeight = Math.abs(zeroY - longTermY);
        ctxCashflow.fillStyle = "rgba(130, 202, 157, 0.6)"; // #82ca9d with transparency
        ctxCashflow.fillRect(
          x + barSpacing,
          data.longTermAnnual >= 0 ? longTermY : zeroY,
          barWidth,
          longTermHeight,
        );

        // Draw cumulative lines
        if (i > 0) {
          const prevX =
            chartMargin.left + (i - 1) * (plotWidth / (years.length - 1));
          const prevData = chartData[i - 1];

          // Short-term cumulative line (purple)
          ctxCashflow.beginPath();
          ctxCashflow.strokeStyle = "#8884d8";
          ctxCashflow.lineWidth = 2;
          ctxCashflow.moveTo(
            prevX,
            getYCoordinate(prevData.shortTermCumulative),
          );
          ctxCashflow.lineTo(x, getYCoordinate(data.shortTermCumulative));
          ctxCashflow.stroke();

          // Short-term dots
          ctxCashflow.beginPath();
          ctxCashflow.fillStyle = "#8884d8";
          ctxCashflow.arc(
            x,
            getYCoordinate(data.shortTermCumulative),
            4,
            0,
            2 * Math.PI,
          );
          ctxCashflow.fill();

          // Long-term cumulative line (green)
          ctxCashflow.beginPath();
          ctxCashflow.strokeStyle = "#82ca9d";
          ctxCashflow.lineWidth = 2;
          ctxCashflow.moveTo(
            prevX,
            getYCoordinate(prevData.longTermCumulative),
          );
          ctxCashflow.lineTo(x, getYCoordinate(data.longTermCumulative));
          ctxCashflow.stroke();

          // Long-term dots
          ctxCashflow.beginPath();
          ctxCashflow.fillStyle = "#82ca9d";
          ctxCashflow.arc(
            x,
            getYCoordinate(data.longTermCumulative),
            4,
            0,
            2 * Math.PI,
          );
          ctxCashflow.fill();
        } else {
          // First point dots
          ctxCashflow.beginPath();
          ctxCashflow.fillStyle = "#8884d8";
          ctxCashflow.arc(
            x,
            getYCoordinate(data.shortTermCumulative),
            4,
            0,
            2 * Math.PI,
          );
          ctxCashflow.fill();

          ctxCashflow.beginPath();
          ctxCashflow.fillStyle = "#82ca9d";
          ctxCashflow.arc(
            x,
            getYCoordinate(data.longTermCumulative),
            4,
            0,
            2 * Math.PI,
          );
          ctxCashflow.fill();
        }
      });

      // Add legend
      const legendY = chartMargin.top - 15;
      const legendItems = [
        { label: "Short-Term Annual", color: "#8884d8", type: "bar" },
        { label: "Long-Term Annual", color: "#82ca9d", type: "bar" },
        { label: "Short-Term Cumulative", color: "#8884d8", type: "line" },
        { label: "Long-Term Cumulative", color: "#82ca9d", type: "line" },
      ];

      legendItems.forEach((item, i) => {
        const x = chartMargin.left + i * 160;

        if (item.type === "bar") {
          // Draw bar sample
          ctxCashflow.fillStyle = item.color + "99";
          ctxCashflow.fillRect(x, legendY - 5, 20, 10);
        } else {
          // Draw line sample
          ctxCashflow.beginPath();
          ctxCashflow.strokeStyle = item.color;
          ctxCashflow.lineWidth = 2;
          ctxCashflow.moveTo(x, legendY);
          ctxCashflow.lineTo(x + 20, legendY);
          ctxCashflow.stroke();

          // Draw dot
          ctxCashflow.beginPath();
          ctxCashflow.fillStyle = item.color;
          ctxCashflow.arc(x + 10, legendY, 3, 0, 2 * Math.PI);
          ctxCashflow.fill();
        }

        // Add legend text
        ctxCashflow.fillStyle = "#374151";
        ctxCashflow.textAlign = "left";
        ctxCashflow.font = "10px Arial";
        ctxCashflow.fillText(item.label, x + 25, legendY + 4);
      });
    }

    // Add chart to PDF
    pdf.addImage(
      cashflowCanvas.toDataURL(),
      "PNG",
      margin,
      yPosition,
      contentWidth,
      (contentWidth * chartHeight) / chartWidth,
    );

    yPosition += (contentWidth * chartHeight) / chartWidth + 20;

    // Add Data Visualizations section
    pdf.addPage();
    yPosition = margin;

    // Cashflow Projections Chart
    pdf.setFontSize(16);
    pdf.setTextColor(0);
    pdf.text("Asset Growth & Equity", margin, yPosition);
    yPosition += 10;

    // Add explainer text
    pdf.setFontSize(10);
    pdf.setTextColor(90);
    pdf.text(
      "This section analyzes the growth of the property's value over time, taking into account appreciation and loan repayment.",
      margin,
      yPosition,
      { maxWidth: contentWidth },
    );
    yPosition += 15;
    pdf.setTextColor(0);

    // Create and render asset growth chart
    const assetGrowthCanvas = document.createElement("canvas");
    assetGrowthCanvas.width = 750;
    assetGrowthCanvas.height = 400;

    const ctx = assetGrowthCanvas.getContext("2d");
    if (ctx) {
      // Set white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, chartWidth, chartHeight);

      // Chart dimensions
      const chartMargin = { top: 40, right: 40, bottom: 60, left: 80 };
      const plotWidth = chartWidth - chartMargin.left - chartMargin.right;
      const plotHeight = chartHeight - chartMargin.top - chartMargin.bottom;

      const years = [1, 2, 3, 4, 5, 10, 20];
      const monthlyRate = data.financialMetrics.interestRate / 100 / 12;
      const totalPayments = data.financialMetrics.loanTerm * 12;
      const loanAmount =
        data.propertyDetails.purchasePrice -
        data.financialMetrics.depositAmount;
      const appreciation = data.financialMetrics.annualAppreciation || 5;

      // Calculate monthly payment
      const calculateMonthlyPayment = () => {
        if (loanAmount <= 0 || monthlyRate <= 0) return 0;
        return (
          (loanAmount *
            monthlyRate *
            Math.pow(1 + monthlyRate, totalPayments)) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1)
        );
      };

      // Calculate loan balance for a given period
      const calculateLoanBalance = (monthsPaid: number): number => {
        if (loanAmount <= 0 || monthlyRate <= 0) return 0;
        if (monthsPaid >= totalPayments) return 0;

        const monthlyPayment = calculateMonthlyPayment();
        const remainingPayments = totalPayments - monthsPaid;
        return (
          monthlyPayment *
          ((1 - Math.pow(1 + monthlyRate, -remainingPayments)) / monthlyRate)
        );
      };

      // Prepare chart data
      const chartData = years.map((year) => {
        const propertyValue =
          data.propertyDetails.purchasePrice *
          Math.pow(1 + appreciation / 100, year);
        const loanBalance = calculateLoanBalance(year * 12);
        const totalEquity = propertyValue - loanBalance;

        return {
          year: `Year ${year}`,
          propertyValue,
          loanBalance,
          totalEquity,
        };
      });

      // Find max value for scaling
      const allValues = chartData.flatMap((d) => [
        d.propertyValue,
        d.loanBalance,
        d.totalEquity,
      ]);
      const maxValue = Math.max(...allValues);

      // Helper function to convert value to Y coordinate
      const getYCoordinate = (value: number) => {
        return chartMargin.top + plotHeight - (value / maxValue) * plotHeight;
      };

      // Draw grid lines and Y-axis labels
      const ySteps = 6;
      for (let i = 0; i <= ySteps; i++) {
        const value = (maxValue / ySteps) * i;
        const y = getYCoordinate(value);

        // Grid line
        ctx.beginPath();
        ctx.strokeStyle = "#e5e7eb";
        ctx.moveTo(chartMargin.left, y);
        ctx.lineTo(chartWidth - chartMargin.right, y);
        ctx.stroke();

        // Y-axis label
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "right";
        ctx.font = "10px Arial";
        // Format as R X.XM
        ctx.fillText(
          `R${(value / 1000000).toFixed(1)}M`,
          chartMargin.left - 10,
          y + 4,
        );
      }

      // Draw X-axis labels
      chartData.forEach((data, i) => {
        const x = chartMargin.left + i * (plotWidth / (years.length - 1));
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "center";
        ctx.fillText(data.year, x, chartHeight - chartMargin.bottom + 20);
      });

      // Function to draw area
      const drawArea = (
        dataKey: "propertyValue" | "loanBalance",
        color: string,
      ) => {
        ctx.beginPath();
        ctx.moveTo(chartMargin.left, getYCoordinate(0));

        // Draw line to first point
        const firstX = chartMargin.left;
        const firstY = getYCoordinate(chartData[0][dataKey]);
        ctx.lineTo(firstX, firstY);

        // Draw lines through all points
        chartData.forEach((data, i) => {
          const x = chartMargin.left + i * (plotWidth / (years.length - 1));
          const y = getYCoordinate(data[dataKey]);
          ctx.lineTo(x, y);
        });

        // Complete the area
        const lastX = chartMargin.left + plotWidth;
        ctx.lineTo(
          lastX,
          getYCoordinate(chartData[chartData.length - 1][dataKey]),
        );
        ctx.lineTo(lastX, getYCoordinate(0));
        ctx.lineTo(chartMargin.left, getYCoordinate(0));

        // Fill area with semi-transparent color
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw the line on top
        ctx.beginPath();
        chartData.forEach((data, i) => {
          const x = chartMargin.left + i * (plotWidth / (years.length - 1));
          const y = getYCoordinate(data[dataKey]);
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.strokeStyle = color;
        ctx.stroke();
      };

      // Draw Property Value area (purple)
      drawArea("propertyValue", "#8884d8");

      // Draw Loan Balance area (green)
      drawArea("loanBalance", "#82ca9d");

      // Draw Total Equity line (orange)
      ctx.beginPath();
      ctx.strokeStyle = "#ff7300";
      ctx.lineWidth = 2;

      chartData.forEach((data, i) => {
        const x = chartMargin.left + i * (plotWidth / (years.length - 1));
        const y = getYCoordinate(data.totalEquity);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw dots separately after the line
      chartData.forEach((data, i) => {
        const x = chartMargin.left + i * (plotWidth / (years.length - 1));
        const y = getYCoordinate(data.totalEquity);

        ctx.beginPath();
        ctx.fillStyle = "#ff7300";
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Add legend
      const legendY = chartMargin.top - 15;
      const legendItems = [
        { label: "Property Value", color: "#8884d8", type: "area" },
        { label: "Loan Balance", color: "#82ca9d", type: "area" },
        { label: "Total Equity", color: "#ff7300", type: "line" },
      ];

      legendItems.forEach((item, i) => {
        const x = chartMargin.left + i * 160;

        if (item.type === "area") {
          // Draw area sample
          ctx.fillStyle = item.color;
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x, legendY - 5, 20, 10);
          ctx.globalAlpha = 1;

          // Draw line on top
          ctx.beginPath();
          ctx.strokeStyle = item.color;
          ctx.moveTo(x, legendY);
          ctx.lineTo(x + 20, legendY);
          ctx.stroke();
        } else {
          // Draw line sample
          ctx.beginPath();
          ctx.strokeStyle = item.color;
          ctx.lineWidth = 2;
          ctx.moveTo(x, legendY);
          ctx.lineTo(x + 20, legendY);
          ctx.stroke();

          // Draw dot
          ctx.beginPath();
          ctx.fillStyle = item.color;
          ctx.arc(x + 10, legendY, 3, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Add legend text
        ctx.fillStyle = "#374151";
        ctx.textAlign = "left";
        ctx.font = "10px Arial";
        ctx.fillText(item.label, x + 25, legendY + 4);
      });
    }

    // Add chart to PDF
    pdf.addImage(
      assetGrowthCanvas.toDataURL(),
      "PNG",
      margin,
      yPosition,
      contentWidth,
      (contentWidth * chartHeight) / chartWidth,
    );

    yPosition += (contentWidth * chartHeight) / chartWidth;

    // Add table immediately after chart
    const yearsArray = [1, 2, 3, 4, 5, 10, 20];
    const calculateAssetMetrics = (year: number) => {
      const initialValue = data.propertyDetails.purchasePrice;
      const appreciation = data.financialMetrics.annualAppreciation || 5;
      const loanAmount = initialValue - data.financialMetrics.depositAmount;
      const monthlyRate = data.financialMetrics.interestRate / 100 / 12;
      const monthlyPayment = data.financialMetrics.monthlyBondRepayment;
      const totalMonths = year * 12;

      // Calculate property value with appreciation
      const propertyValue =
        initialValue * Math.pow(1 + appreciation / 100, year);

      // Calculate annual appreciation gain
      const appreciationGain =
        year === 1
          ? initialValue * (appreciation / 100)
          : propertyValue -
            initialValue * Math.pow(1 + appreciation / 100, year - 1);

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
      const interestToPrincipalRatio =
        (totalInterestPaid / totalPrincipalPaid) * 100;

      // Calculate total equity
      const totalEquity = propertyValue - Math.max(0, loanBalance);

      return [
        formatCurrency(propertyValue),
        formatCurrency(appreciationGain),
        formatCurrency(Math.max(0, loanBalance)),
        formatCurrency(totalInterestPaid),
        `${interestToPrincipalRatio.toFixed(1)}%`,
        formatCurrency(totalEquity),
        formatCurrency(totalPrincipalPaid),
      ];
    };

    const assetMetrics = yearsArray.map((year) => calculateAssetMetrics(year));

    monthlyPerformance = months.map((month, index) => {
      // Use investment metrics data directly from analysis engine
      const performanceData = data.investmentMetrics.shortTerm[index] || {
        netWorthChange: 0,
        annualReturn: 0,
        netYield: 0,
        grossYield: 0,
      };

      return [
        month,
        formatCurrency(performanceData.netWorthChange || 0),
        formatPercentage(performanceData.annualReturn || 0),
        formatPercentage(performanceData.netYield || 0),
        formatPercentage(performanceData.grossYield || 0),
      ];
    });

    yPosition += 10;

    autoTable(pdf, {
      startY: yPosition,
      head: [["Metric", ...yearsArray.map((year) => `Year ${year}`)]],
      body: [
        ["Property Value", ...assetMetrics.map((m) => m[0])],
        ["Annual Appreciation", ...assetMetrics.map((m) => m[1])],
        ["Loan Balance", ...assetMetrics.map((m) => m[2])],
        ["Total Interest Paid", ...assetMetrics.map((m) => m[3])],
        ["Interest-to-Principal Ratio", ...assetMetrics.map((m) => m[4])],
        ["Total Equity", ...assetMetrics.map((m) => m[5])],
        ["Loan Repayment Equity", ...assetMetrics.map((m) => m[6])],
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

    yPosition += (contentWidth * 400) / 750 + 20;

    const totalPages = pdf.getNumberOfPages();
    const currentYear = new Date().getFullYear();

    // Add new page for disclaimer
    pdf.addPage();

    // Add disclaimer heading
    pdf.setFontSize(16);
    pdf.setTextColor(0);
    pdf.text("Important Disclaimers & Legal Notices", margin, margin);

    // Position for disclaimer text below heading
    let disclaimerY = margin + 10;

    // Set disclaimer text style
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

    // Calculate line breaks for disclaimer text
    const lines = disclaimerText
      .map((line) => pdf.splitTextToSize(line, contentWidth))
      .flat();

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
  } finally {
    // Cleanup any remaining resources
  }
}
