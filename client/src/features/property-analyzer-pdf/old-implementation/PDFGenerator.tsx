// This file is deprecated. Using new implementation from features/property-analyzer-pdf

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PDFGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;  // We'll type this properly based on your data structure
  companyLogo?: string;
  onGeneratePDF: (selectedSections: any) => Promise<void>;
}

// Define all selectable sections with their items
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
    id: 'dealStructure',
    title: 'Deal Structure',
    items: [
      { id: 'purchasePrice', label: 'Purchase Price' },
      { id: 'depositAmount', label: 'Deposit Amount' },
      { id: 'depositPercentage', label: 'Deposit Percentage' },
      { id: 'interestRate', label: 'Interest Rate' },
      { id: 'loanTerm', label: 'Loan Term' },
      { id: 'monthlyBondPayment', label: 'Monthly Bond Payment' },
      { id: 'bondRegistration', label: 'Bond Registration' },
      { id: 'transferCosts', label: 'Transfer Costs' }
    ]
  },
  {
    id: 'operatingExpenses',
    title: 'Operating Expenses',
    items: [
      { id: 'monthlyLevies', label: 'Monthly Levies' },
      { id: 'monthlyRatesTaxes', label: 'Monthly Rates & Taxes' },
      { id: 'otherMonthlyExpenses', label: 'Other Monthly Expenses' },
      { id: 'maintenancePercentage', label: 'Maintenance Percentage' },
      { id: 'managementFee', label: 'Management Fee' }
    ]
  },
  {
    id: 'rentalPerformance',
    title: 'Rental Performance',
    items: [
      { id: 'shortTermRental', label: 'Short Term Rental Details' },
      { id: 'longTermRental', label: 'Long Term Rental Details' }
    ]
  },
  {
    id: 'investmentMetrics',
    title: 'Investment Metrics',
    items: [
      { id: 'grossYield', label: 'Gross Yield' },
      { id: 'netYield', label: 'Net Yield' },
      { id: 'returnOnEquity', label: 'Return on Equity' },
      { id: 'annualReturn', label: 'Annual Return' },
      { id: 'capRate', label: 'Cap Rate' },
      { id: 'cashOnCashReturn', label: 'Cash on Cash Return' },
      { id: 'irr', label: 'IRR' },
      { id: 'netWorthChange', label: 'Net Worth Change' }
    ]
  },
  {
    id: 'cashflowAnalysis',
    title: 'Cashflow Analysis',
    items: [
      { id: 'year1', label: 'Year 1' },
      { id: 'year2', label: 'Year 2' },
      { id: 'year3', label: 'Year 3' },
      { id: 'year4', label: 'Year 4' },
      { id: 'year5', label: 'Year 5' },
      { id: 'year10', label: 'Year 10' },
      { id: 'year20', label: 'Year 20' }
    ]
  },
  {
    id: 'dataVisualizations',
    title: 'Data Visualizations',
    items: [
      { id: 'charts', label: 'Include Charts and Graphs' }
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
  const [selections, setSelections] = useState<Record<string, Record<string, boolean>>>({});
  const [generating, setGenerating] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const totalItems = sectionConfig.reduce((acc, section) => acc + section.items.length, 0);
  const selectedCount = Object.values(selections).reduce(
    (acc, section) => acc + Object.values(section).filter(Boolean).length,
    0
  );

  // Initialize selections on mount
  useEffect(() => {
    const initialSelections: Record<string, Record<string, boolean>> = {};
    sectionConfig.forEach(section => {
      initialSelections[section.id] = {};
      section.items.forEach(item => {
        initialSelections[section.id][item.id] = true; // All selected by default
      });
    });
    setSelections(initialSelections);
  }, []);

  const handleSelectAll = (selected: boolean) => {
    const newSelections = { ...selections };
    sectionConfig.forEach(section => {
      section.items.forEach(item => {
        if (!newSelections[section.id]) newSelections[section.id] = {};
        newSelections[section.id][item.id] = selected;
      });
    });
    setSelections(newSelections);
  };

  const toggleSection = (sectionId: string, itemId: string) => {
    setSelections(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [itemId]: !prev[sectionId]?.[itemId]
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
    try {
      await onGeneratePDF(selections);
      toast({
        title: "Success",
        description: "PDF report generated successfully!",
        duration: 3000,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF report",
        duration: 5000,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Generate PDF Report</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
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
            <div className="text-sm text-muted-foreground">
              Selected: {selectedCount}/{totalItems}
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
                          checked={selections[section.id]?.[item.id] ?? false}
                          onCheckedChange={() => toggleSection(section.id, item.id)}
                        />
                        <label
                          htmlFor={`${section.id}-${item.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {item.label}
                        </label>
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
                  {companyLogo ? (
                    <div className="p-4 bg-muted rounded-lg">
                      <img
                        src={companyLogo}
                        alt="Current Logo"
                        className="h-12 object-contain mb-4"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-update"
                      />
                      <label
                        htmlFor="logo-update"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 w-fit"
                      >
                        <Upload className="w-4 h-4" />
                        Update Logo
                      </label>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload your company logo to include it in the report
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 w-fit"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={handleGeneratePDF}
            className="w-full mt-6"
            disabled={generating || selectedCount === 0}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}