
import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { formatter } from "@/utils/formatting";

interface PDFReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
}

export function PDFReportModal({ open, onOpenChange, data }: PDFReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Header with logo
    doc.addImage("/proply-logo.png", "PNG", 160, 10, 40, 20);
    doc.setFontSize(24);
    doc.text("Property Analysis Report", 20, 30);

    // Property Details
    doc.setFontSize(16);
    doc.setTextColor(0, 121, 255);
    doc.text("Property Details", 20, 50);

    autoTable(doc, {
      startY: 55,
      head: [["Detail", "Value"]],
      body: [
        ["Title", data.title],
        ["Address", data.address],
        ["Bedrooms", data.bedrooms || 'N/A'],
        ["Bathrooms", data.bathrooms || 'N/A'],
        ["Short-Term Nightly Rate", formatter.format(data.shortTermNightly)],
        ["Annual Occupancy", `${data.annualOccupancy}%`],
        ["Management Fee", `${(data.managementFee * 100).toFixed(1)}%`]
      ],
      theme: 'striped',
      styles: { fontSize: 12 },
      headStyles: { fillColor: [0, 121, 255] }
    });

    // Rental Performance Section
    doc.setFontSize(16);
    doc.text("Rental Performance Analysis", 20, doc.lastAutoTable.finalY + 20);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Nightly Rates Table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [["Rate Type", ...months, "Annual", "Monthly Avg"]],
      body: [
        ["Nightly Rate", ...months.map((_, i) => formatter.format(getSeasonalNightlyRate(data.shortTermNightly, i))), "-", "-"],
        ["Fee-Adjusted Rate", ...months.map((_, i) => formatter.format(getFeeAdjustedRate(getSeasonalNightlyRate(data.shortTermNightly, i), data.managementFee > 0))), "-", "-"],
        ["Occupancy Low", ...OCCUPANCY_RATES.low.map(rate => `${rate}%`), "-", `${OCCUPANCY_RATES.low.reduce((a, b) => a + b, 0) / 12}%`],
        ["Occupancy Medium", ...OCCUPANCY_RATES.medium.map(rate => `${rate}%`), "-", `${OCCUPANCY_RATES.medium.reduce((a, b) => a + b, 0) / 12}%`],
        ["Occupancy High", ...OCCUPANCY_RATES.high.map(rate => `${rate}%`), "-", `${OCCUPANCY_RATES.high.reduce((a, b) => a + b, 0) / 12}%`],
      ],
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 121, 255] }
    });

    // Revenue Scenarios Table
    const scenarios = ['low', 'medium', 'high'] as const;
    const revenueData = scenarios.map(scenario => {
      const monthlyRevenues = months.map((_, i) => 
        calculateMonthlyRevenue(scenario, i, data.shortTermNightly, data.managementFee > 0, data.managementFee)
      );
      const total = monthlyRevenues.reduce((sum, rev) => sum + rev, 0);
      return {
        scenario: scenario.charAt(0).toUpperCase() + scenario.slice(1),
        revenues: monthlyRevenues,
        total,
        average: total / 12
      };
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Revenue Scenario", ...months, "Annual", "Monthly Avg"]],
      body: [
        ...revenueData.map(data => [
          `Revenue ${data.scenario}`,
          ...data.revenues.map(rev => formatter.format(rev)),
          formatter.format(data.total),
          formatter.format(data.average)
        ]),
        [
          "Long Term Rental",
          ...Array(12).fill(formatter.format(data.longTermMonthly)),
          formatter.format(data.longTermMonthly * 12),
          formatter.format(data.longTermMonthly)
        ]
      ],
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 121, 255] }
    });

    // Break-even Analysis
    doc.setFontSize(16);
    doc.text("Break-even Analysis", 20, doc.lastAutoTable.finalY + 20);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [['Month', 'Low Revenue', 'Medium Revenue', 'High Revenue', 'Long Term']],
      body: months.map((month, i) => [
        month,
        formatter.format(revenueData[i].low),
        formatter.format(revenueData[i].medium),
        formatter.format(revenueData[i].high),
        formatter.format(revenueData[i].longTerm)
      ]),
      theme: 'striped',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 121, 255] }
    });

    // Occupancy Analysis
    doc.setFontSize(16);
    doc.text("Occupancy Analysis", 20, doc.lastAutoTable.finalY + 20);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [["Metric", "Value"]],
      body: [
        ["Projected Occupancy", `${data.annualOccupancy}%`],
        ["Break-even Occupancy", `${data.breakEvenOccupancy}%`],
        ["Revenue Comparison", data.annualOccupancy > data.breakEvenOccupancy 
          ? `At ${data.annualOccupancy}% projected occupancy, short-term rental is more profitable.`
          : `At ${data.annualOccupancy}% projected occupancy, long-term rental may be more suitable.`]
      ],
      theme: 'striped',
      styles: { fontSize: 12 },
      headStyles: { fillColor: [0, 121, 255] }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Generated by Proply on ${new Date().toLocaleDateString()}`, 20, 285);
      doc.text(`Page ${i} of ${pageCount}`, 180, 285);
    }

    doc.save(`${data.title.replace(/[^a-zA-Z0-9]/g, '-')}-analysis.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate PDF Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate a detailed PDF report containing your property analysis results.
          </p>
          <button
            onClick={generatePDF}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Download Report
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Reuse the same calculation functions from ComparisonChart
const OCCUPANCY_RATES = {
  low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 65],
  medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 80],
  high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
};

const SEASONALITY_FACTORS = [2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03];

function getSeasonalMultiplier(month: number): number {
  return SEASONALITY_FACTORS[month];
}

function getSeasonalNightlyRate(baseRate: number, month: number): number {
  return baseRate * getSeasonalMultiplier(month);
}

function getFeeAdjustedRate(rate: number, hasManagementFee: boolean): number {
  return hasManagementFee ? rate * 0.85 : rate * 0.97;
}

function calculateMonthlyRevenue(
  scenario: 'low' | 'medium' | 'high',
  month: number,
  nightly: number,
  hasManagementFee: boolean,
  managementFeePercent: number
): number {
  const occupancyRate = OCCUPANCY_RATES[scenario][month] / 100;
  const daysInMonth = new Date(2024, month + 1, 0).getDate();
  const seasonalRate = getSeasonalNightlyRate(nightly, month);
  const feeAdjustedRate = getFeeAdjustedRate(seasonalRate, hasManagementFee);
  let revenue = feeAdjustedRate * daysInMonth * occupancyRate;
  if (hasManagementFee) {
    revenue *= (1 - managementFeePercent);
  }
  return revenue;
}
