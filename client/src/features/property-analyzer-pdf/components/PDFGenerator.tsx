import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, Check, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PropertyData, ReportSelections } from '../types/propertyReport';

interface PDFGeneratorProps {
  data: PropertyData;
  companyLogo?: string;
  onGeneratePDF: (selections: ReportSelections) => Promise<void>;
  onPreview: (selections: ReportSelections) => void;
  isGenerating: boolean;
}

const defaultSelections: ReportSelections = {
  propertyDetails: {
    address: true,
    propertyPhoto: true,
    map: true,
    bedrooms: true,
    bathrooms: true,
    floorArea: true,
    parkingSpaces: true,
    ratePerSquareMeter: true,
    propertyDescription: true
  },
  financialMetrics: {
    purchasePrice: true,
    depositAmount: true,
    interestRate: true,
    loanTerm: true,
    monthlyBondRepayment: true,
    bondRegistration: true,
    transferCosts: true
  },
  operatingExpenses: {
    monthlyLevies: true,
    monthlyRatesTaxes: true,
    otherMonthlyExpenses: true,
    maintenancePercent: true,
    managementFee: true
  },
  rentalPerformance: {
    shortTerm: true,
    longTerm: true
  },
  investmentMetrics: {
    grossYield: true,
    netYield: true,
    returnOnEquity: true,
    annualReturn: true,
    capRate: true,
    cashOnCashReturn: true,
    irr: true,
    netWorthChange: true
  },
  cashflowAnalysis: {
    year1: true,
    year2: true,
    year3: true,
    year5: true,
    year10: true,
    year20: true
  },
  includeWatermark: true,
  includeMap: true
};

export function PDFGenerator({
  data,
  companyLogo,
  onGeneratePDF,
  onPreview,
  isGenerating
}: PDFGeneratorProps) {
  const [selections, setSelections] = useState<ReportSelections>(defaultSelections);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleSelectAll = (selected: boolean) => {
    const newSelections = { ...defaultSelections };
    Object.keys(newSelections).forEach(sectionKey => {
      if (typeof newSelections[sectionKey as keyof ReportSelections] === 'object') {
        const section = newSelections[sectionKey as keyof ReportSelections];
        if (section && typeof section === 'object') {
          Object.keys(section).forEach(itemKey => {
            (section as any)[itemKey] = selected;
          });
        }
      }
    });
    setSelections(newSelections);
  };

  const toggleSection = (sectionId: string, itemId: string) => {
    setSelections(prev => {
      const newSelections = { ...prev };
      const section = newSelections[sectionId as keyof ReportSelections];
      if (section && typeof section === 'object') {
        (section as any)[itemId] = !(section as any)[itemId];
      }
      return newSelections;
    });
  };

  const handleGeneratePDF = async () => {
    setProgress(0);
    try {
      await onGeneratePDF(selections);
      toast({
        title: "Success",
        description: "PDF report generated successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF report",
      });
    } finally {
      setProgress(100);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="space-x-2">
          <Button variant="outline" onClick={() => handleSelectAll(true)}>
            <Check className="w-4 h-4 mr-2" />
            Select All
          </Button>
          <Button variant="outline" onClick={() => handleSelectAll(false)}>
            Deselect All
          </Button>
        </div>
        <Button variant="outline" onClick={() => onPreview(selections)}>
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {Object.entries(defaultSelections).map(([sectionId, sectionItems]) => (
          <Card key={sectionId}>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">{sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
              <div className="grid gap-4">
                {Object.entries(sectionItems).map(([itemId, _]) => (
                  <div key={itemId} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${sectionId}-${itemId}`}
                      checked={selections[sectionId as keyof ReportSelections][itemId as keyof typeof sectionItems]}
                      onCheckedChange={() => toggleSection(sectionId, itemId)}
                    />
                    <Label htmlFor={`${sectionId}-${itemId}`}>
                      {itemId === 'shortTerm' ? 'Short Term Rental' : itemId === 'longTerm' ? 'Long Term Rental' : itemId.charAt(0).toUpperCase() + itemId.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Company Branding</h3>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                {companyLogo ? (
                  <div className="space-y-4">
                    <img
                      src={companyLogo}
                      alt="Company Logo"
                      className="h-12 object-contain"
                    />
                    <Button variant="outline" onClick={() => document.getElementById('logo-update')?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Update Logo
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                )}
                <input
                  type="file"
                  id={companyLogo ? 'logo-update' : 'logo-upload'}
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        className="w-full"
        onClick={handleGeneratePDF}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            Generate PDF Report
          </>
        )}
      </Button>

      {isGenerating && (
        <Progress value={progress} className="w-full" />
      )}
    </div>
  );
}