import html2canvas from 'html2canvas';

export async function captureElement(elementId: string): Promise<string> {
  console.log(`chartCapture: Attempting to capture element with id: ${elementId}`);
  const element = document.getElementById(elementId);
  console.log(`chartCapture: Element found: ${!!element}`);
  if (!element) {
    console.warn(`Element with id ${elementId} not found, skipping capture`);
    return '';
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      foreignObjectRendering: true,
      onclone: (clonedDoc) => {
        // Make sure SVG elements are properly rendered
        const svgElements = clonedDoc.getElementsByTagName('svg');
        Array.from(svgElements).forEach(svg => {
          svg.setAttribute('width', svg.getBoundingClientRect().width.toString());
          svg.setAttribute('height', svg.getBoundingClientRect().height.toString());
        });
      }
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing element:', error);
    return '';
  }
}

export interface RentalPerformanceData {
  monthlyData: {
    longTerm: number;
    low: number[];
    medium: number[];
    high: number[];
  };
  occupancyRates: {
    low: number[];
    medium: number[];
    high: number[];
  };
  fees: {
    platformFee: number;
    managementFee: number;
  };
}

export function extractRentalPerformanceData(data: any): RentalPerformanceData {
  // Extract occupancy rates
  const occupancyRates = {
    low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 70],
    medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 85],
    high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
  };

  // Calculate fees
  const platformFee = data.managementFee > 0 ? 0.15 : 0.03;
  const managementFee = data.managementFee || 0;

  // Extract monthly revenue data
  const monthlyData = {
    longTerm: data.longTermMonthly,
    low: Array(12).fill(0).map((_, i) => calculateMonthlyRevenue('low', i, data.shortTermNightly, data.managementFee > 0, data.managementFee)),
    medium: Array(12).fill(0).map((_, i) => calculateMonthlyRevenue('medium', i, data.shortTermNightly, data.managementFee > 0, data.managementFee)),
    high: Array(12).fill(0).map((_, i) => calculateMonthlyRevenue('high', i, data.shortTermNightly, data.managementFee > 0, data.managementFee))
  };

  return {
    monthlyData,
    occupancyRates,
    fees: {
      platformFee,
      managementFee
    }
  };
}

function calculateMonthlyRevenue(
  scenario: 'low' | 'medium' | 'high',
  monthIndex: number,
  nightlyRate: number,
  hasManagement: boolean,
  managementFee: number
): number {
  const occupancyRates = {
    low: [65, 65, 60, 55, 50, 50, 50, 50, 60, 65, 65, 70],
    medium: [80, 78, 73, 68, 63, 60, 60, 60, 70, 75, 75, 85],
    high: [95, 90, 85, 80, 75, 70, 70, 70, 80, 85, 85, 95]
  };

  const seasonalRates = {
    peak: 1.2,
    shoulder: 1.1,
    low: 0.9
  };

  let rateMultiplier = 1;
  if ([11, 0, 1].includes(monthIndex)) {
    rateMultiplier = seasonalRates.peak;
  } else if ([2, 3, 9, 10].includes(monthIndex)) {
    rateMultiplier = seasonalRates.shoulder;
  } else {
    rateMultiplier = seasonalRates.low;
  }

  const adjustedRate = nightlyRate * rateMultiplier;
  const daysInMonth = new Date(2024, monthIndex + 1, 0).getDate();
  const occupancy = occupancyRates[scenario][monthIndex] / 100;
  const grossRevenue = adjustedRate * daysInMonth * occupancy;
  const platformFee = hasManagement ? 0.15 : 0.03;
  const totalFees = platformFee + managementFee;
  return grossRevenue * (1 - totalFees);
}

export async function captureCharts(): Promise<{
  revenueChart: string;
  occupancyChart: string;
  monthlyRevenueTable: string;
  performanceTable: string;
}> {
  const charts = {
    revenueChart: '',
    occupancyChart: '',
    monthlyRevenueTable: '',
    performanceTable: ''
  };

  try {
    // Attempt to capture each chart, but don't fail if one is missing
    charts.revenueChart = await captureElement('revenue-comparison-chart');
    charts.occupancyChart = await captureElement('occupancy-analysis');
    charts.monthlyRevenueTable = await captureElement('monthly-revenue-table');
    charts.performanceTable = await captureElement('performance-metrics-table');

    return charts;
  } catch (error) {
    console.error('Error capturing charts:', error);
    return charts;
  }
}