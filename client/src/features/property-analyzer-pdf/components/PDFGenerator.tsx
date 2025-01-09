import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PropertyData, ReportSelections } from '../types/propertyReport';

interface PDFGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PropertyData;
  companyLogo?: string;
  onGeneratePDF: (selections: ReportSelections) => Promise<void>;
}

const sectionConfig = [
  {
    id: 'propertyDetails',
    title: 'Property Details',
    items: [
      { id: 'address', label: 'Address' },
      { id: 'propertyPhoto', label: 'Property Photo' },
      { id: 'map', label: 'Property Map' },
      { id: 'bedrooms', label: 'Bedrooms' },
      { id: 'bathrooms', label: 'Bathrooms' },
      { id: 'floorArea', label: 'Floor Area' },
      { id: 'parkingSpaces', label: 'Parking Spaces' },
      { id: 'ratePerSquareMeter', label: 'Rate per Square Meter' },
      { id: 'propertyDescription', label: 'Property Description' }
    ]
  },
  {
    id: 'financialMetrics',
    title: 'Financial Metrics',
    items: [
      { id: 'purchasePrice', label: 'Purchase Price' },
      { id: 'depositAmount', label: 'Deposit Amount' },
      { id: 'interestRate', label: 'Interest Rate' },
      { id: 'loanTerm', label: 'Loan Term' },
      { id: 'monthlyBondRepayment', label: 'Monthly Bond Payment' }
    ]
  },
  {
    id: 'operatingExpenses',
    title: 'Operating Expenses',
    items: [
      { id: 'monthlyLevies', label: 'Monthly Levies' },
      { id: 'monthlyRatesTaxes', label: 'Monthly Rates & Taxes' },
      { id: 'otherMonthlyExpenses', label: 'Other Monthly Expenses' },
      { id: 'maintenancePercent', label: 'Maintenance Percentage' },
      { id: 'managementFee', label: 'Management Fee' }
    ]
  },
  {
    id: 'performanceMetrics',
    title: 'Performance Metrics',
    items: [
      { id: 'shortTerm', label: 'Short Term Rental Analysis' },
      { id: 'longTerm', label: 'Long Term Rental Analysis' },
      { id: 'investmentMetrics', label: 'Investment Metrics' },
      { id: 'cashflow', label: 'Cashflow Analysis' }
    ]
  },
  {
    id: 'visualizations',
    title: 'Visualizations',
    items: [
      { id: 'charts', label: 'Charts and Graphs' },
      { id: 'comparisons', label: 'Performance Comparisons' }
    ]
  }
];

export function PDFGenerator({
  open,
  onOpenChange,
  data,
  companyLogo,
  onGeneratePDF
}: PDFGeneratorProps) {
  const { toast } = useToast();
  const [selections, setSelections] = useState<ReportSelections>({});
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleSelectAll = (selected: boolean) => {
    const newSelections: ReportSelections = {};
    sectionConfig.forEach(section => {
      section.items.forEach(item => {
        if (!newSelections[section.id as keyof ReportSelections]) {
          newSelections[section.id as keyof ReportSelections] = {};
        }
        (newSelections[section.id as keyof ReportSelections] as any)[item.id] = selected;
      });
    });
    setSelections(newSelections);
  };

  const toggleSection = (sectionId: string, itemId: string) => {
    setSelections(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId as keyof ReportSelections] || {}),
        [itemId]: !(prev[sectionId as keyof ReportSelections] as any)?.[itemId]
      }
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
    }
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    setProgress(0);
    try {
      await onGeneratePDF({
        ...selections,
        includeWatermark: true,
        includeMap: true
      });
      toast({
        title: "Success",
        description: "PDF report generated successfully",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF report",
      });
    } finally {
      setGenerating(false);
      setProgress(100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Generate Property Analysis Report</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-x-2">
              <Button variant="outline" onClick={() => handleSelectAll(true)}>
                <Check className="w-4 h-4 mr-2" />
                Select All
              </Button>
              <Button variant="outline" onClick={() => handleSelectAll(false)}>
                Deselect All
              </Button>
            </div>
          </div>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {sectionConfig.map((section) => (
              <Card key={section.id}>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
                  <div className="grid gap-4">
                    {section.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${section.id}-${item.id}`}
                          checked={
                            (selections[section.id as keyof ReportSelections] as any)?.[item.id] || false
                          }
                          onCheckedChange={() => toggleSection(section.id, item.id)}
                        />
                        <Label htmlFor={`${section.id}-${item.id}`}>
                          {item.label}
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
            disabled={generating}
          >
            {generating ? (
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

          {generating && (
            <Progress value={progress} className="w-full" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
