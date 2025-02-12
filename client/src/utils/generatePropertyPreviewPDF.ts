
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { formatter } from "./formatting";

export const generatePropertyPreviewPDF = async (
  data: any,
  includeCompanyBranding: boolean = false,
  userData?: any
) => {
  if (!data) return;

  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Add logos
  if (includeCompanyBranding && userData?.companyLogo) {
    try {
      const logoWidth = 40;
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.height / img.width;
          const logoHeight = logoWidth * aspectRatio;
          doc.addImage(
            userData.companyLogo,
            "PNG",
            margin,
            20,
            logoWidth,
            logoHeight
          );
          resolve();
        };
        img.onerror = () => resolve();
        img.crossOrigin = "Anonymous";
        img.src = userData.companyLogo;
      });
    } catch (error) {
      console.error("Error adding company logo:", error);
    }
  }

  // Title and Description
  doc.setFontSize(20);
  doc.text("Rental Strategy Comparison", 20, yPos += 20);
  
  doc.setFontSize(12);
  doc.text("Property Details", 20, yPos += 20);

  // Property Details Table
  const propertyDetails = [
    ["Address", data.address],
    ["Bedrooms", data.bedrooms || "N/A"],
    ["Bathrooms", data.bathrooms || "N/A"],
  ];

  autoTable(doc, {
    startY: yPos += 10,
    head: [["Feature", "Value"]],
    body: propertyDetails,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [27, 163, 255] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Revenue Comparison
  doc.setFontSize(12);
  doc.text("Revenue Comparison", 20, yPos);

  const revenueDetails = [
    ["Long Term Monthly", formatter.format(data.longTermMonthly)],
    ["Long Term Annual", formatter.format(data.longTermAnnual)],
    ["Short Term Monthly", formatter.format(data.shortTermMonthly)],
    ["Short Term Annual", formatter.format(data.shortTermAnnual)],
    ["Short Term After Fees", formatter.format(data.shortTermAfterFees)],
  ];

  autoTable(doc, {
    startY: yPos += 10,
    head: [["Metric", "Amount"]],
    body: revenueDetails,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [27, 163, 255] },
  });

  // Capture and add chart
  const chartElement = document.querySelector(".revenue-chart");
  if (chartElement) {
    const canvas = await html2canvas(chartElement);
    const chartImage = canvas.toDataURL("image/png");
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    doc.addImage(chartImage, "PNG", 20, (doc as any).lastAutoTable.finalY + 20, imgWidth, imgHeight);
  }

  // Add footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 20,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
  }

  doc.save(`Rental Comparison - ${data.address}.pdf`);
};
