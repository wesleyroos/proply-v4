import html2canvas from 'html2canvas';

export async function captureElement(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
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