import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { pdfService } from '@/services/pdf/PDFService';
import { PDFPreview } from './PDFPreview';

interface PDFGeneratorProps {
  title: string;
  contentRef: React.RefObject<HTMLElement>;
  sections?: {
    id: string;
    label: string;
  }[];
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({
  title,
  contentRef,
  sections = []
}) => {
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGeneratePDF = async () => {
    if (!contentRef.current) {
      toast({
        title: 'Error',
        description: 'Content not ready for PDF generation',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const pdfBlob = await pdfService.generatePDF(
        contentRef.current,
        {
          sections: selectedSections,
          companyLogo,
          title,
          watermark: 'Property Analysis Report'
        },
        setProgress
      );

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'PDF generated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="company-logo">Company Logo</Label>
          <Input
            id="company-logo"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            ref={fileInputRef}
            className="mt-1"
          />
        </div>

        {sections.length > 0 && (
          <div className="space-y-2">
            <Label>Sections to Include</Label>
            {sections.map((section) => (
              <div key={section.id} className="flex items-center space-x-2">
                <Checkbox
                  id={section.id}
                  checked={selectedSections.includes(section.id)}
                  onCheckedChange={() => handleSectionToggle(section.id)}
                />
                <Label htmlFor={section.id}>{section.label}</Label>
              </div>
            ))}
          </div>
        )}

        <div className="space-x-2">
          <Button
            onClick={() => setShowPreview(true)}
            variant="outline"
            disabled={isGenerating}
          >
            Preview
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate PDF'}
          </Button>
        </div>

        {isGenerating && (
          <Progress value={progress} className="w-full" />
        )}
      </div>

      {showPreview && (
        <PDFPreview
          contentRef={contentRef}
          onClose={() => setShowPreview(false)}
        />
      )}
    </Card>
  );
};
