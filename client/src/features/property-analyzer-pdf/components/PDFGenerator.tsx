import React, { useState } from "react";
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

// Template presets
const REPORT_TEMPLATES = {
  basic: {
    name: "Basic Report",
    description: "Essential property information and key metrics",
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
        propertyDescription: true,
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
        shortTermAnnualRevenue: true,
        longTermAnnualRevenue: true,
        shortTermGrossYield: true,
        longTermGrossYield: true,
      },
      investmentMetrics: {
        grossYield: true,
        netYield: true,
        capRate: true,
      },
      rateComparisons: {
        propertyRatePerSquareMeter: true,
        areaAverageRate: true,
        rateDifference: true,
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
        platformFees: true,
      },
      investmentMetrics: {
        grossYield: true,
        netYield: true,
        returnOnEquity: true,
        annualReturn: true,
        capRate: true,
        cashOnCashReturn: true,
        roiWithoutAppreciation: true,
        roiWithAppreciation: true,
        irr: true,
        netWorthChange: true,
      },
      cashflowAnalysis: {
        annualCashflow: true,
        cumulativeRentalIncome: true,
        netWorthChange: true,
        revenueProjections: true,
      },
      rateComparisons: {
        propertyRatePerSquareMeter: true,
        areaAverageRate: true,
        rateDifference: true,
      },
    },
  },
  custom: {
    name: "Custom",
    description: "Select specific sections to include",
    selections: {},
  },
};

export function PDFGenerator({
  data,
  companyLogo,
  onGeneratePDF,
  isGenerating,
}) {
  const [activeTemplate, setActiveTemplate] = useState("basic");
  const [selections, setSelections] = useState(
    REPORT_TEMPLATES.basic.selections,
  );
  const [progress, setProgress] = useState(0);

  const handleTemplateChange = (template) => {
    setActiveTemplate(template);
    setSelections(REPORT_TEMPLATES[template].selections);
  };

  const handleSectionToggle = (section, item) => {
    setSelections((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [item]: !prev[section][item],
      },
    }));

    // If we modify selections, switch to custom template
    if (activeTemplate !== "custom") {
      setActiveTemplate("custom");
    }
  };

  const handleSelectAll = (selected) => {
    const allSections = {};
    Object.keys(REPORT_TEMPLATES.full.selections).forEach((section) => {
      allSections[section] = {};
      Object.keys(REPORT_TEMPLATES.full.selections[section]).forEach((item) => {
        allSections[section][item] = selected;
      });
    });
    setSelections(allSections);
    setActiveTemplate("custom");
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle logo upload logic
    }
  };

  const handleGeneratePDF = async () => {
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
    }
  };

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
            <TabsTrigger value="propertyDetails">Property Details</TabsTrigger>
            <TabsTrigger value="financialMetrics">Financial</TabsTrigger>
            <TabsTrigger value="operatingExpenses">Expenses</TabsTrigger>
            <TabsTrigger value="rentalPerformance">Rental</TabsTrigger>
            <TabsTrigger value="investmentMetrics">Investment</TabsTrigger>
            <TabsTrigger value="cashflowAnalysis">Cashflow</TabsTrigger>
            <TabsTrigger value="rateComparisons">Rates</TabsTrigger>
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
            ),
          )}
        </Tabs>

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
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("logo-update")?.click()
                      }
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Update Logo
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("logo-upload")?.click()
                    }
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                )}
                <input
                  type="file"
                  id={companyLogo ? "logo-update" : "logo-upload"}
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

      <Progress value={progress} className="w-full" />
    </div>
  );
}
