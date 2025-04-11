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
      // Create a link to the static PDF file that you supplied
      const link = document.createElement('a')
      link.href = '/static-assets/Property Risk Assessment.pdf'
      link.download = `Property_Risk_Assessment${propertyAddress ? `_${propertyAddress.split(',')[0]}` : ''}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download Started",
        description: "Your report is being downloaded.",
      })
      
      // Set a timeout to change the state back to not downloading
      setTimeout(() => {
        setIsDownloading(false)
      }, 2000)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "Download Failed",
        description: "There was a problem downloading the report. Please try again.",
        variant: "destructive",
      })
      setIsDownloading(false)
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