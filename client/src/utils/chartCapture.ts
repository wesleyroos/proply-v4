import html2canvas from 'html2canvas';

export async function captureElement(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing element:', error);
    throw error;
  }
}

export async function captureCharts() {
  const charts = {
    revenueChart: await captureElement('revenue-comparison-chart'),
    occupancyChart: await captureElement('occupancy-analysis-chart'),
    monthlyRevenueTable: await captureElement('monthly-revenue-table'),
    performanceTable: await captureElement('performance-metrics-table')
  };

  return charts;
}
