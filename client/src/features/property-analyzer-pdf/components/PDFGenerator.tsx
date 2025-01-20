import React, { useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Check, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportSelections } from '../types/propertyReport';

// Define template presets with TypeScript types
const REPORT_TEMPLATES = {
  basic: {
    name: "Basic Report",
    description: "Essential property information and key metrics",
    selections: {
      propertyDetails: {
        address: true,
        propertyPhoto: true,
        bedrooms: true,
        bathrooms: true,
        floorArea: true,
        parkingSpaces: true,
        purchasePrice: true,
      },
      financialMetrics: {
        depositAmount: true,
        depositPercentage: true,
        monthlyBondRepayment: true,
        totalCapitalRequired: true,
      },
      operatingExpenses: {
        monthlyLevies: true,
        monthlyRatesTaxes: true,
      },
      rentalPerformance: {
        shortTermNightlyRate: true,
        shortTermAnnualRevenue: true,
        longTermAnnualRevenue: true,
      },
    },
  },
  full: {
    name: "Full Analysis",
    description: "Comprehensive property analysis with all metrics",
    selections: {
      propertyDetails: {
        address: true,
        propertyPhoto: true,
        mapImage: true,
        bedrooms: true,
        bathrooms: true,
        floorArea: true,
        parkingSpaces: true,
        purchasePrice: true,
        propertyRatePerSquareMeter: true,
        areaRatePerSquareMeter: true,
        rateDifference: true,
        propertyDescription: true,
      },
      financialMetrics: {
        depositAmount: true,
        depositPercentage: true,
        interestRate: true,
        loanTerm: true,
        monthlyBondRepayment: true,
        bondRegistration: true,
        transferCosts: true,
        totalCapitalRequired: true,
      },
      operatingExpenses: {
        monthlyLevies: true,
        monthlyRatesTaxes: true,
        otherMonthlyExpenses: true,
        maintenancePercent: true,
        managementFee: true,
      },
      rentalPerformance: {
        shortTermNightlyRate: true,
        annualOccupancy: true,
        shortTermAnnualRevenue: true,
        longTermAnnualRevenue: true,
        shortTermGrossYield: true,
        longTermGrossYield: true,
        platformFee: true,
      },
      investmentMetrics: {
        grossYield: true,
        netYield: true,
        returnOnEquity: true,
        annualReturn: true,
        capRate: true,
        cashOnCashReturn: true,
        irr: true,
        netWorthChange: true,
      },
      cashflowAnalysis: {
        year1: true,
        year2: true,
        year3: true,
        year4: true,
        year5: true,
        year10: true,
        year20: true,
      },
    },
  },
  custom: {
    name: "Custom",
    description: "Select specific sections to include",
    selections: {},
  },
};

interface Props {
  onGeneratePDF: (selections: ReportSelections) => Promise<void>;
  onPreview?: () => void;
  isGenerating: boolean;
  companyLogo?: string;
}

export function ReportSectionManager({
  onGeneratePDF,
  onPreview,
  isGenerating,
  companyLogo,
}: Props) {
  const [activeTemplate, setActiveTemplate] = useState("basic");
  const [selections, setSelections] = useState<ReportSelections>(
    REPORT_TEMPLATES.basic.selections
  );
  const [progress, setProgress] = useState(0);

  // Handle template changes with type checking
  const handleTemplateChange = useCallback((template: string) => {
    setActiveTemplate(template);
    setSelections(REPORT_TEMPLATES[template as keyof typeof REPORT_TEMPLATES].selections);
  }, []);

  // Handle individual section toggles
  const handleSectionToggle = useCallback((section: string, item: string) => {
    setSelections((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [item]: !(prev[section]?.[item] ?? false),
      },
    }));

    if (activeTemplate !== "custom") {
      setActiveTemplate("custom");
    }
  }, [activeTemplate]);

  // Handle select/deselect all with proper typing
  const handleSelectAll = useCallback((selected: boolean) => {
    const allSections = {} as ReportSelections;
    Object.entries(REPORT_TEMPLATES.full.selections).forEach(([section, items]) => {
      allSections[section] = {};
      Object.keys(items).forEach((item) => {
        allSections[section][item] = selected;
      });
    });
    setSelections(allSections);
    setActiveTemplate("custom");
  }, []);

  // Handle PDF generation with progress tracking
  const handleGeneratePDF = useCallback(async () => {
    setProgress(0);
    try {
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 300);

      await onGeneratePDF(selections);

      clearInterval(interval);
      setProgress(100);
    } catch (error) {
      console.error("PDF Generation error:", error);
      setProgress(0);
    }
  }, [selections, onGeneratePDF]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Select value={activeTemplate} onValueChange={handleTemplateChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Choose template" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(REPORT_TEMPLATES).map(([key, template]) => (
              <SelectItem key={key} value={key}>
                <div className="flex flex-col">
                  <span>{template.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {template.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => handleSelectAll(true)}
            className="text-sm"
          >
            <Check className="w-4 h-4 mr-2" />
            Select All
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSelectAll(false)}
            className="text-sm"
          >
            Deselect All
          </Button>
        </div>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <Tabs defaultValue="propertyDetails" className="w-full">
          <TabsList className="w-full justify-start">
            {Object.keys(REPORT_TEMPLATES.full.selections).map((section) => (
              <TabsTrigger key={section} value={section}>
                {section
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(REPORT_TEMPLATES.full.selections).map(
            ([sectionId, sectionItems]) => (
              <TabsContent key={sectionId} value={sectionId}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.keys(sectionItems).map((itemId) => (
                        <div
                          key={itemId}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`${sectionId}-${itemId}`}
                            checked={selections[sectionId]?.[itemId] ?? false}
                            onCheckedChange={() =>
                              handleSectionToggle(sectionId, itemId)
                            }
                          />
                          <Label
                            htmlFor={`${sectionId}-${itemId}`}
                            className="text-sm cursor-pointer"
                          >
                            {itemId
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          )}
        </Tabs>
      </div>

      <div className="flex space-x-4">
        <Button
          className="flex-1"
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
              Generate PDF
            </>
          )}
        </Button>
        {onPreview && (
          <Button
            variant="outline"
            onClick={onPreview}
            disabled={isGenerating}
          >
            Preview
          </Button>
        )}
      </div>

      {isGenerating && <Progress value={progress} className="w-full" />}
    </div>
  );
}