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
      // Create a link element
      const link = document.createElement('a')
      link.href = pdfPath
      link.download = `Hollard_Property_Risk_Assessment${propertyAddress ? `_${propertyAddress.split(',')[0]}` : ''}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download Started",
        description: "Your report is being downloaded.",
      })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "Download Failed",
        description: "There was a problem downloading the report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
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