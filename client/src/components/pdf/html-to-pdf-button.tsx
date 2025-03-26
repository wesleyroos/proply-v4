"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"

interface HTMLToPDFButtonProps {
  elementId: string
  filename: string
  className?: string
  children?: React.ReactNode
}

export function HTMLToPDFButton({
  elementId,
  filename,
  className,
  children,
}: HTMLToPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      // Dynamic import of html2pdf to reduce initial bundle size
      const html2pdf = (await import('html2pdf.js')).default
      
      const element = document.getElementById(elementId)
      
      if (!element) {
        console.error(`Element with id ${elementId} not found`)
        setIsGenerating(false)
        return
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
      }
      
      // Clone the element to modify for PDF generation
      const clonedElement = element.cloneNode(true) as HTMLElement
      
      // Remove any elements with print:hidden class
      const hiddenElements = clonedElement.querySelectorAll('.print\\:hidden')
      hiddenElements.forEach(el => el.remove())
      
      // Apply PDF-specific styles
      const sections = clonedElement.querySelectorAll('.pdf-section')
      sections.forEach(section => {
        // Apply PDF-specific styles to sections if needed
        // (section as HTMLElement).style.pageBreakBefore = 'always'
      })
      
      // Generate the PDF
      await html2pdf().from(clonedElement).set(opt).save()
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={handleGeneratePDF}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>Generating PDF...</>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {children || "Download PDF"}
        </>
      )}
    </Button>
  )
}