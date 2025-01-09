import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PDFPreviewProps {
  contentRef: React.RefObject<HTMLElement>;
  onClose: () => void;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  contentRef,
  onClose
}) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>PDF Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4">
          <div className="bg-white shadow-lg p-8 min-h-[297mm] w-[210mm] mx-auto">
            {contentRef.current && (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: contentRef.current.outerHTML 
                }} 
              />
            )}
          </div>
        </ScrollArea>
        <div className="flex justify-end space-x-2 mt-4">
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
