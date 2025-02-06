import React, { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Loader2, Check, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProAccess } from "@/hooks/use-pro-access";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ReportSelections } from "@/types/ReportSelections";
import { BrandingDialog } from "@/components/BrandingDialog"; // Assuming this import is needed


const FULL_TEMPLATE_SELECTIONS: ReportSelections = {
  propertyOverview: {
    // address: true,
    // propertyPhoto: true,
    // map: true,
    // propertyDescription: true,
    // purchasePrice: true,
    // floorArea: true,
    propertyRatePerSquareMeter: true,
    areaRatePerSquareMeter: true,
    rateDifference: true,
    // bedrooms: true,
    // bathrooms: true,
    // parkingSpaces: true,
  },
  financialMetrics: {
    // depositAmount: true,
    // depositPercentage: true,
    // interestRate: true,
    // monthlyBondRepayment: true,
    // bondRegistration: true,
    // transferCosts: true,
    // loanTerm: true,
    totalCapitalRequired: true,
  },
  operatingExpenses: {
    // monthlyLevies: true,
    // monthlyRatesTaxes: true,
    // otherMonthlyExpenses: true,
    maintenancePercent: true,
    managementFee: true,
  },
  rentalPerformance: {
    shortTermNightlyRate: true,
    shortTermAnnualOccupancy: true,
    shortTermAnnualRevenue: true,
    shortTermGrossYield: true,
    longTermMonthlyRevenue: true,
    longTermAnnualRevenue: true,
    longTermGrossYield: true,
    rentalPerforamceChart: true,
  },
  cashflowMetrics: {
    annualRevenue: true,
    netOperatingIncome: true,
    netOperatingExpense: true,
    anualBondPayment: true,
    annualCashflow: true,
    cumulativeCashflow: true,
    cashflowChart: true,
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
  assetGrowthAndEquity: {
    propertyValue: true,
    annualAppreciation: true,
    loanBalance: true,
    totalInterestPaid: true,
    interestToPrincipalRatio: true,
    totalEquity: true,
    loanRepaymentEquity: true,
    assetGrowthAndEquityChart: true,
  },
};

const BASIC_TEMPLATE_SELECTIONS: ReportSelections = {
  propertyOverview: {
    // address: true,
    // propertyPhoto: true,
    // map: true,
    // propertyDescription: true,
    // purchasePrice: true,
    // floorArea: true,
    propertyRatePerSquareMeter: false,
    areaRatePerSquareMeter: false,
    rateDifference: false,
    // bedrooms: true,
    // bathrooms: true,
    // parkingSpaces: true,
  },
  financialMetrics: {
    // depositAmount: true,
    // depositPercentage: true,
    // interestRate: true,
    // monthlyBondRepayment: true,
    // bondRegistration: true,
    // transferCosts: true,
    // loanTerm: true,
    totalCapitalRequired: false,
  },
  operatingExpenses: {
    // monthlyLevies: true,
    // monthlyRatesTaxes: true,
    // otherMonthlyExpenses: true,
    maintenancePercent: false,
    managementFee: false,
  },
  rentalPerformance: {
    shortTermNightlyRate: false,
    shortTermAnnualOccupancy: false,
    shortTermAnnualRevenue: false,
    shortTermGrossYield: false,
    longTermMonthlyRevenue: false,
    longTermAnnualRevenue: false,
    longTermGrossYield: false,
    rentalPerforamceChart: false,
  },
  cashflowMetrics: {
    annualRevenue: false,
    netOperatingIncome: false,
    netOperatingExpense: false,
    anualBondPayment: false,
    annualCashflow: false,
    cumulativeCashflow: false,
    cashflowChart: false,
  },
  investmentMetrics: {
    grossYield: false,
    netYield: false,
    returnOnEquity: false,
    annualReturn: false,
    capRate: false,
    cashOnCashReturn: false,
    irr: false,
    netWorthChange: false,
  },
  assetGrowthAndEquity: {
    propertyValue: false,
    annualAppreciation: false,
    loanBalance: false,
    totalInterestPaid: false,
    interestToPrincipalRatio: false,
    totalEquity: false,
    loanRepaymentEquity: false,
    assetGrowthAndEquityChart: false,
  },
};

const REPORT_TEMPLATES = {
  basic: {
    name: "Basic Report",
    description: "Essential property information and key metrics",
    selections: BASIC_TEMPLATE_SELECTIONS,
  },
  full: {
    name: "Full Analysis",
    description: "Comprehensive property analysis with all metrics",
    selections: FULL_TEMPLATE_SELECTIONS,
  },
  custom: {
    name: "Custom",
    description: "Select specific sections to include",
    selections: {},
  },
};

interface Props {
  onGeneratePDF: (selections: ReportSelections) => Promise<void>;
  isGenerating: boolean;
  companyLogo?: string;
}

export function PDFGenerator({
  onGeneratePDF,
  isGenerating,
  companyLogo,
}: Props) {
  const [activeTemplate, setActiveTemplate] = useState("basic");
  const [selections, setSelections] = useState<ReportSelections>(
    REPORT_TEMPLATES.basic.selections,
  );
  const [progress, setProgress] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [brandingDialogOpen, setBrandingDialogOpen] = useState(false);
  const { hasAccess: hasProAccess } = useProAccess();

  const handleTemplateChange = useCallback((template: string) => {
    setActiveTemplate(template);
    setSelections(
      REPORT_TEMPLATES[template as keyof typeof REPORT_TEMPLATES].selections,
    );
  }, []);

  const handleSectionToggle = useCallback(
    (section: string, item: string) => {
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
    },
    [activeTemplate],
  );

  const handleSelectAll = useCallback((selected: boolean) => {
    const allSections = {} as ReportSelections;
    Object.entries(REPORT_TEMPLATES.full.selections).forEach(
      ([section, items]) => {
        allSections[section] = {};
        Object.keys(items).forEach((item) => {
          allSections[section][item] = selected;
        });
      },
    );
    setSelections(allSections);
    setActiveTemplate("custom");
  }, []);

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

  const handleShowUpgrade = () => {
    setBrandingDialogOpen(false); 
    setUpgradeOpen(true); 
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        {!hasProAccess && (
          <Button
            onClick={() => setBrandingDialogOpen(true)} // Open BrandingDialog instead
            className="absolute right-9 top-4 bg-primary hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        )}
        <div className="flex items-center space-x-4 w-full">
          <Select value={activeTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Choose template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic Analysis</SelectItem>
              {hasProAccess ? (
                <>
                  <SelectItem value="full">Full Analysis</SelectItem>
                  <SelectItem value="custom">Custom Analysis</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="full" disabled className="opacity-50">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        Full Analysis
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs text-primary mr-2">Pro</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBrandingDialogOpen(true); // Open BrandingDialog
                        }}
                        className="text-xs text-primary underline hover:text-primary/80"
                      >
                      </button>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom" disabled className="opacity-50">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        Custom Analysis
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs text-primary mr-2">Pro</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBrandingDialogOpen(true); // Open BrandingDialog
                        }}
                        className="text-xs text-primary underline hover:text-primary/80"
                      >
                      </button>
                    </div>
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm flex-grow">
            {
              REPORT_TEMPLATES[activeTemplate as keyof typeof REPORT_TEMPLATES]
                .description
            }
          </span>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => hasProAccess && handleSelectAll(true)}
            className="text-sm"
            disabled={!hasProAccess}
          >
            <Check className="w-4 h-4 mr-2" />
            Select All
            {!hasProAccess && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                PRO
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => hasProAccess && handleSelectAll(false)}
            className="text-sm"
            disabled={!hasProAccess}
          >
            Deselect All
            {!hasProAccess && (
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                PRO
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="max-h-[calc(70vh-120px)] overflow-y-auto pr-2 space-y-6 mb-6">
        {Object.entries(REPORT_TEMPLATES.full.selections).map(
          ([sectionId, sectionItems]) => (
            <Card key={sectionId}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  {sectionId
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase())}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(sectionItems).map((itemId) => (
                    <div key={itemId} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${sectionId}-${itemId}`}
                        checked={selections[sectionId]?.[itemId] ?? false}
                        onCheckedChange={() =>
                          handleSectionToggle(sectionId, itemId)
                        }
                        disabled={!hasProAccess && activeTemplate === "basic"}
                      />
                      <Label
                        htmlFor={`${sectionId}-${itemId}`}
                        className="text-sm cursor-pointer"
                      >
                        {itemId
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())
                          .replace(/\b M2/, "/m²")}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ),
        )}
      </div>

      <div className="border-t pt-4 bg-background">
        <div className="flex space-x-4 mb-2">
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
        </div>
        {isGenerating && <Progress value={progress} className="w-full" />}
      </div>
      <BrandingDialog 
        open={brandingDialogOpen}
        onOpenChange={setBrandingDialogOpen}
        onGeneratePDF={onGeneratePDF}
        onShowUpgrade={handleShowUpgrade}
      />
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}