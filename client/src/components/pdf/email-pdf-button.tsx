"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { HTMLToPDFButton } from "./html-to-pdf-button"
import { EmailCollectionDialog } from "../EmailCollectionDialog"
import { useToast } from "@/hooks/use-toast"

interface EmailPDFButtonProps {
  elementId: string
  filename: string
  className?: string
  children?: React.ReactNode
  propertyAddress?: string
}

export function EmailPDFButton({
  elementId,
  filename,
  className,
  children,
  propertyAddress,
}: EmailPDFButtonProps) {
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()
  
  // Reference to the PDF generation button
  const pdfButtonRef = React.useRef<HTMLButtonElement | null>(null)
  
  // Handle click on the main button
  const handleButtonClick = () => {
    setShowEmailDialog(true)
  }
  
  // Handle email submission
  const handleEmailSubmit = async (email: string) => {
    // Here you would send the email to your backend
    try {
      // Optional: Send email to backend
      await fetch('/api/deal-advisor/collect-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          reportType: 'Deal Score',
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
      if (pdfButtonRef.current) {
        pdfButtonRef.current.click()
      }
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
        disabled={isGenerating}
        className={className}
      >
        <Download className="mr-2 h-4 w-4" />
        {children || "Download PDF"}
      </Button>
      
      {/* Hidden actual PDF button that will be triggered after email collection */}
      <div className="hidden">
        <button
          ref={pdfButtonRef}
          onClick={() => {
            // Dynamically import and use html2pdf
            import('html2pdf.js').then(async module => {
              const html2pdf = module.default;
              setIsGenerating(true);
              
              try {
                const element = document.getElementById(elementId);
                
                if (!element) {
                  console.error(`Element with id ${elementId} not found`);
                  setIsGenerating(false);
                  return;
                }
                
                const opt = {
                  margin: 10,
                  filename: filename,
                  image: { type: 'jpeg', quality: 0.98 },
                  html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                  },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                
                // Clone the element to modify for PDF generation
                const clonedElement = element.cloneNode(true) as HTMLElement;
                
                // Remove any elements with print:hidden class
                const hiddenElements = clonedElement.querySelectorAll('.print\\:hidden');
                hiddenElements.forEach(el => el.remove());
                
                // Generate the PDF
                await html2pdf().from(clonedElement).set(opt).save();
              } catch (error) {
                console.error('Error generating PDF:', error);
              } finally {
                setIsGenerating(false);
              }
            }).catch(err => {
              console.error('Failed to load html2pdf:', err);
              setIsGenerating(false);
            });
          }}
        >
          Hidden PDF Button
        </button>
      </div>
      
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