
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Property } from '@/components/PropertyPreviewModal';

export const generatePropertyPreviewPDF = (property: Property) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(property.title, 20, 20);
  
  // Property Details
  doc.setFontSize(16);
  doc.text('Property Details', 20, 40);
  
  const propertyDetails = [
    ['Address', property.address],
    ['Bedrooms', property.bedrooms],
    ['Bathrooms', property.bathrooms],
    property.parkingSpaces ? ['Parking Spaces', property.parkingSpaces] : [],
  ].filter(row => row.length > 0);

  autoTable(doc, {
    startY: 45,
    head: [],
    body: propertyDetails,
    theme: 'plain',
  });

  // Short-Term Performance
  doc.setFontSize(16);
  doc.text('Short-Term Performance', 20, doc.lastAutoTable.finalY + 20);

  const shortTermDetails = [
    ['Annual Revenue', `R${property.shortTermAnnual.toLocaleString()}`],
    ['Monthly Revenue', `R${(property.shortTermAnnual / 12).toLocaleString()}`],
    ['Nightly Rate', `R${property.shortTermNightly.toLocaleString()}`],
    ['Occupancy', `${property.annualOccupancy}%`],
    ['Management Fee', `${property.managementFee}%`],
  ];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 25,
    head: [],
    body: shortTermDetails,
    theme: 'plain',
  });

  // Long-Term Performance
  doc.setFontSize(16);
  doc.text('Long-Term Performance', 20, doc.lastAutoTable.finalY + 20);

  const longTermDetails = [
    ['Annual Revenue', `R${(property.longTermMonthly * 12).toLocaleString()}`],
    ['Monthly Revenue', `R${property.longTermMonthly.toLocaleString()}`],
  ];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 25,
    head: [],
    body: longTermDetails,
    theme: 'plain',
  });

  // Breakeven Analysis
  doc.setFontSize(16);
  doc.text('Breakeven Analysis', 20, doc.lastAutoTable.finalY + 20);
  
  const breakEvenDetails = [
    ['Projected Occupancy', `${property.annualOccupancy}%`],
    ['Break-even Occupancy', `${property.breakEvenOccupancy}%`],
  ];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 25,
    head: [],
    body: breakEvenDetails,
    theme: 'plain',
  });

  doc.save(`${property.title}-preview.pdf`);
};
