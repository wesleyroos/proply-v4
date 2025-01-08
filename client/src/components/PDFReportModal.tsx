import React, { useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PDFReport } from './PDFReport';
import { PropertyData, ReportSelections } from '../types/propertyReport';

interface PDFReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PropertyData;
  selections: ReportSelections;
  companyLogo?: string;
}

export function PDFReportModal({
  open,
  onOpenChange,
  data,
  selections,
  companyLogo
}: PDFReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] w-full">
        <div className="max-h-[80vh] overflow-y-auto">
          <PDFReport
            ref={reportRef}
            data={data}
            selections={selections}
            companyLogo={companyLogo}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
