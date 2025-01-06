
import { useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { formatter } from "@/utils/formatting";

interface PDFReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
}

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

export function PDFReportModal({ open, onOpenChange, data }: PDFReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const generateReport = () => {
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
    
    // Prepare revenue data
    const revenueData = ['low', 'medium', 'high'].map(scenario => {
      const monthlyRevenues = months.map((_, i) => 
        calculateMonthlyRevenue(
          scenario as 'low' | 'medium' | 'high',
          i,
          data.shortTermNightly,
          data.managementFee > 0,
          data.managementFee
        )
      );
      const total = monthlyRevenues.reduce((sum, rev) => sum + rev, 0);
      return {
        scenario,
        revenues: monthlyRevenues,
        total,
        average: total / 12
      };
    });

    // Revenue table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [["Revenue Scenario", ...months, "Annual", "Monthly Avg"]],
      body: [
        ...revenueData.map(data => [
          `Revenue ${data.scenario.charAt(0).toUpperCase() + data.scenario.slice(1)}`,
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

    doc.save(`Property-Analysis-${data.address.split(",")[0]}.pdf`);
  };

  useEffect(() => {
    if (open && data) {
      generateReport();
      onOpenChange(false);
    }
  }, [open, data]);

  return null;
}
