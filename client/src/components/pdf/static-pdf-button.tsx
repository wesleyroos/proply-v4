"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StaticPDFButtonProps {
  pdfPath: string
  className?: string
  children?: React.ReactNode
  propertyAddress?: string
}

export function StaticPDFButton({
  pdfPath,
  className,
  children,
  propertyAddress,
}: StaticPDFButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()
  
  // Function to trigger the PDF download directly
  const downloadPDF = () => {
    setIsDownloading(true)
    
    try {
      // For demo purposes, we'll create a simple PDF with some text
      import('jspdf').then(module => {
        const jsPDF = module.default;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 128);
        doc.text("Hollard Property Risk Assessment", 105, 20, { align: 'center' });
        
        // Add property address if available
        if (propertyAddress) {
          doc.setFontSize(16);
          doc.setTextColor(0, 0, 0);
          doc.text(`Property: ${propertyAddress}`, 105, 30, { align: 'center' });
        }
        
        // Add current date
        const currentDate = new Date().toLocaleDateString();
        doc.setFontSize(12);
        doc.text(`Generated on: ${currentDate}`, 105, 40, { align: 'center' });
        
        // Add some sample report content
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text("Risk Assessment Overview", 20, 60);
        
        doc.setFontSize(12);
        doc.text("This comprehensive report provides a detailed analysis of the property risk factors including:", 20, 70);
        
        doc.setFontSize(11);
        const riskCategories = [
          "Security Risk Assessment",
          "Environmental Risk Factors",
          "Flood Risk Analysis",
          "Climate Risk Evaluation",
          "Hail Damage Probability",
          "Building Structure Assessment",
          "Insurance Recommendations"
        ];
        
        let yPos = 80;
        riskCategories.forEach((category, index) => {
          doc.text(`${index + 1}. ${category}`, 25, yPos);
          yPos += 10;
        });
        
        doc.setFontSize(14);
        doc.text("Important Note", 20, yPos + 10);
        
        doc.setFontSize(11);
        doc.text("This is a sample PDF generated for demonstration purposes only.", 20, yPos + 20);
        doc.text("In a production environment, this would be replaced with an actual risk assessment report.", 20, yPos + 30);
        
        // Save the PDF with a dynamic filename
        doc.save(`Hollard_Property_Risk_Assessment${propertyAddress ? `_${propertyAddress.split(',')[0]}` : ''}.pdf`);
        
        toast({
          title: "Download Complete",
          description: "Your property risk assessment report has been downloaded.",
        });
      }).catch(err => {
        console.error('Error generating PDF:', err);
        toast({
          title: "Download Failed",
          description: "There was a problem creating the report. Please try again.",
          variant: "destructive",
        });
      }).finally(() => {
        setIsDownloading(false);
      });
    } catch (error) {
      console.error('Error in download process:', error);
      toast({
        title: "Download Failed",
        description: "There was a problem downloading the report. Please try again.",
        variant: "destructive",
      });
      setIsDownloading(false);
    }
  }

  return (
    <Button
      onClick={downloadPDF}
      disabled={isDownloading}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {children || "Download PDF"}
    </Button>
  )
}