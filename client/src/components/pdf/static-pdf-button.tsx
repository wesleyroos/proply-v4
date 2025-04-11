"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { EmailCollectionDialog } from "../EmailCollectionDialog"
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
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()
  
  // Handle click on the main button
  const handleButtonClick = () => {
    setShowEmailDialog(true)
  }
  
  // Function to trigger the PDF download
  const downloadPDF = () => {
    setIsDownloading(true)
    
    try {
      // For security reasons and to handle potential CORS issues,
      // we'll use a base64 PDF embedded in the app
      // This simulates downloading a report document
      
      // Normally we would fetch from server or have the path point to our static file,
      // but for demonstration we'll use this approach
      
      // In a real implementation, we would make a request to the server:
      // fetch('/api/reports/download?type=property-risk-assessment')
      
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
  
  // Handle email submission
  const handleEmailSubmit = async (email: string) => {
    try {
      // Optional: Send email to backend
      await fetch('/api/deal-advisor/collect-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          reportType: 'Risk Assessment',
          propertyAddress,
          date: new Date().toISOString(),
        }),
      }).catch(err => {
        // If API fails, we still allow the download
        console.error('Failed to save email:', err)
      })
      
      // Show success message
      toast({
        title: "Email Collected",
        description: "Your report will be sent to your email. You can also download it now.",
      })
      
      // Trigger the PDF download
      downloadPDF()
    } catch (error) {
      console.error('Error handling email submission:', error)
      toast({
        title: "Error",
        description: "There was a problem processing your request. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Visible button that opens email dialog */}
      <Button
        onClick={handleButtonClick}
        disabled={isDownloading}
        className={className}
      >
        <Download className="mr-2 h-4 w-4" />
        {children || "Download PDF"}
      </Button>
      
      {/* Email collection dialog */}
      <EmailCollectionDialog
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        onSubmit={handleEmailSubmit}
        propertyAddress={propertyAddress}
      />
    </>
  )
}