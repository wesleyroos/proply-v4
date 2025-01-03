import { useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { formatter } from "../utils/formatting";

interface PDFReportProps {
  data: {
    propertyDetails: {
      address: string;
      bedrooms: string;
      bathrooms: string;
      floorArea: number;
      parkingSpaces: number;
      purchasePrice: number;
      ratePerSquareMeter: number;
    };
    financialMetrics: {
      depositAmount: number;
      depositPercentage: number;
      interestRate: number;
      loanTerm: number;
      monthlyBondRepayment: number;
    };
    expenses: {
      monthlyLevies: number;
      monthlyRatesTaxes: number;
      otherMonthlyExpenses: number;
      maintenancePercent: number;
    };
    performance: {
      shortTermNightlyRate: number;
      annualOccupancy: number;
      shortTermAnnualRevenue: number;
      longTermAnnualRevenue: number;
      shortTermGrossYield: number;
      longTermGrossYield: number;
      managementFee: number;
    };
    investmentMetrics: {
      shortTerm: Array<{
        grossYield: number;
        netYield: number;
        returnOnEquity: number;
        annualReturn: number;
        capRate: number;
        cashOnCashReturn: number;
        irr: number;
        netWorthChange: number;
      }>;
      longTerm: Array<{
        grossYield: number;
        netYield: number;
        returnOnEquity: number;
        annualReturn: number;
        capRate: number;
        cashOnCashReturn: number;
        irr: number;
        netWorthChange: number;
      }>;
    };
  };
  onClose: () => void;
}

export default function PDFReport({ data, onClose }: PDFReportProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generatePDF = () => {
      const doc = new jsPDF();

      // Add company logo and Proply branding
      doc.addImage("/proply-logo.png", "PNG", 160, 10, 40, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Powered by Proply", 160, 35);

      // Title
      doc.setFontSize(24);
      doc.setTextColor(0);
      doc.text("Property Investment Analysis", 20, 30);

      // Property Details Section
      doc.setFontSize(16);
      doc.setTextColor(0, 121, 255);
      doc.text("Property Overview", 20, 50);

      autoTable(doc, {
        startY: 55,
        head: [["Property Details", "Specifications"]],
        body: [
          ["Address", data.propertyDetails.address],
          ["Bedrooms", data.propertyDetails.bedrooms],
          ["Bathrooms", data.propertyDetails.bathrooms],
          ["Floor Area", `${data.propertyDetails.floorArea} m²`],
          ["Parking Spaces", data.propertyDetails.parkingSpaces.toString()],
          ["Purchase Price", formatter.format(data.propertyDetails.purchasePrice)],
          ["Rate per m²", formatter.format(data.propertyDetails.ratePerSquareMeter)],
        ],
        theme: 'striped',
        styles: { fontSize: 12, cellPadding: 5 },
        headStyles: { fillColor: [0, 121, 255] }
      });

      // Financial Details Section
      doc.setFontSize(16);
      doc.setTextColor(0, 121, 255);
      doc.text("Financial Details", 20, doc.lastAutoTable.finalY + 20);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [["Financial Metric", "Value"]],
        body: [
          ["Deposit Amount", formatter.format(data.financialMetrics.depositAmount)],
          ["Deposit Percentage", `${data.financialMetrics.depositPercentage}%`],
          ["Interest Rate", `${data.financialMetrics.interestRate}%`],
          ["Loan Term", `${data.financialMetrics.loanTerm} years`],
          ["Monthly Bond Repayment", formatter.format(data.financialMetrics.monthlyBondRepayment)],
        ],
        theme: 'striped',
        styles: { fontSize: 12, cellPadding: 5 },
        headStyles: { fillColor: [0, 121, 255] }
      });

      // Monthly Expenses Section
      doc.setFontSize(16);
      doc.setTextColor(0, 121, 255);
      doc.text("Monthly Expenses", 20, doc.lastAutoTable.finalY + 20);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [["Expense Type", "Amount"]],
        body: [
          ["Monthly Levies", formatter.format(data.expenses.monthlyLevies)],
          ["Monthly Rates & Taxes", formatter.format(data.expenses.monthlyRatesTaxes)],
          ["Other Monthly Expenses", formatter.format(data.expenses.otherMonthlyExpenses)],
          ["Maintenance", `${data.expenses.maintenancePercent}% of rental income`],
        ],
        theme: 'striped',
        styles: { fontSize: 12, cellPadding: 5 },
        headStyles: { fillColor: [0, 121, 255] }
      });

      // Add new page for performance metrics
      doc.addPage();

      // Rental Performance Section
      doc.setFontSize(16);
      doc.setTextColor(0, 121, 255);
      doc.text("Rental Performance", 20, 20);

      autoTable(doc, {
        startY: 25,
        head: [["Performance Metric", "Value"]],
        body: [
          ["Short-Term Nightly Rate", formatter.format(data.performance.shortTermNightlyRate)],
          ["Annual Occupancy", `${data.performance.annualOccupancy}%`],
          ["Short-Term Annual Revenue", formatter.format(data.performance.shortTermAnnualRevenue)],
          ["Long-Term Annual Revenue", formatter.format(data.performance.longTermAnnualRevenue)],
          ["Short-Term Gross Yield", `${data.performance.shortTermGrossYield.toFixed(1)}%`],
          ["Long-Term Gross Yield", `${data.performance.longTermGrossYield.toFixed(1)}%`],
          ["Management Fee", `${data.performance.managementFee}%`],
        ],
        theme: 'striped',
        styles: { fontSize: 12, cellPadding: 5 },
        headStyles: { fillColor: [0, 121, 255] }
      });

      // Investment Metrics Section
      doc.setFontSize(16);
      doc.setTextColor(0, 121, 255);
      doc.text("Short-Term Investment Metrics (Year 1)", 20, doc.lastAutoTable.finalY + 20);

      const shortTermMetrics = data.investmentMetrics.shortTerm[0];
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 25,
        head: [["Metric", "Value"]],
        body: [
          ["Gross Yield", `${shortTermMetrics.grossYield.toFixed(1)}%`],
          ["Net Yield", `${shortTermMetrics.netYield.toFixed(1)}%`],
          ["Return on Equity", `${shortTermMetrics.returnOnEquity.toFixed(1)}%`],
          ["Annual Return", `${shortTermMetrics.annualReturn.toFixed(1)}%`],
          ["Cap Rate", `${shortTermMetrics.capRate.toFixed(1)}%`],
          ["Cash on Cash Return", `${shortTermMetrics.cashOnCashReturn.toFixed(1)}%`],
          ["IRR", `${shortTermMetrics.irr.toFixed(1)}%`],
          ["Net Worth Change", formatter.format(shortTermMetrics.netWorthChange)],
        ],
        theme: 'striped',
        styles: { fontSize: 12, cellPadding: 5 },
        headStyles: { fillColor: [0, 121, 255] }
      });

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        // Add line above footer
        doc.line(20, 280, 190, 280);
        // Add footer text
        doc.text(`Report generated by Proply on ${new Date().toLocaleDateString()}`, 20, 285);
        doc.text(`Page ${i} of ${pageCount}`, 180, 285);
      }

      // Add disclaimer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Disclaimer: All data is based on current market analysis and may vary. Proply assumes no liability for discrepancies.", 20, 290);

      // Save the PDF
      doc.save(`Property-Analysis-${data.propertyDetails.address.split(",")[0]}.pdf`);
      onClose();
    };

    generatePDF();
  }, [data, onClose]);

  return <div ref={reportRef} style={{ display: 'none' }}></div>;
}