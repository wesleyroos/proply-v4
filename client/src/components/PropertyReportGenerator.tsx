import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import html2pdf from "html2pdf.js";
import { formatter } from "@/lib/utils";

interface PropertyData {
  propertyDetails: {
    address: string;
    bedrooms: string | number;
    bathrooms: string | number;
    floorArea: number;
    parkingSpaces: number;
    purchasePrice: number;
    ratePerSquareMeter: number;
    propertyPhoto?: string | null;
  };
  financialMetrics: {
    depositAmount: number;
    depositPercentage: number;
    interestRate: number;
    loanTerm: number;
    monthlyBondRepayment: number;
    bondRegistration: number;
    transferCosts: number;
  };
  expenses: {
    monthlyLevies: number;
    monthlyRatesTaxes: number;
    otherMonthlyExpenses: number;
    maintenancePercent: number;
    managementFee: number;
  };
  performance: {
    shortTermNightlyRate: number;
    annualOccupancy: number;
    shortTermAnnualRevenue: number;
    longTermAnnualRevenue: number;
    shortTermGrossYield: number;
    longTermGrossYield: number;
  };
  investmentMetrics: {
    year1: YearlyMetrics;
    year2: YearlyMetrics;
    year3: YearlyMetrics;
    year4: YearlyMetrics;
    year5: YearlyMetrics;
    year10: YearlyMetrics;
    year20: YearlyMetrics;
  };
  operatingExpenses: {
    year1: number;
    year2: number;
    year3: number;
    year4: number;
    year5: number;
    year10: number;
    year20: number;
  };
  netOperatingIncome: {
    year1: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year2: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year3: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year4: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year5: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year10: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
    year20: { value: number; annualCashflow: number; cumulativeRentalIncome: number; netWorthChange: number };
  };
  revenueProjections: {
    shortTerm: {
      year1: number;
      year2: number;
      year3: number;
      year4: number;
      year5: number;
      year10: number;
      year20: number;
    };
  };
}

interface YearlyMetrics {
  grossYield: number;
  netYield: number;
  returnOnEquity: number;
  annualReturn: number;
  capRate: number;
  cashOnCashReturn: number;
  roiWithoutAppreciation: number;
  roiWithAppreciation: number;
  irr: number;
  netWorthChange: number;
}

interface PropertyReportGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PropertyData;
  companyLogo?: string;
}

interface ReportSection {
  id: string;
  label: string;
  checked: boolean;
}

interface SectionGroup {
  title: string;
  sections: ReportSection[];
}

const defaultSectionGroups: SectionGroup[] = [
  {
    title: "Property Details",
    sections: [
      { id: "propertyOverview", label: "Property Overview", checked: true },
      { id: "locationDetails", label: "Location Details", checked: true },
      { id: "specifications", label: "Property Specifications", checked: true },
    ]
  },
  {
    title: "Financial Analysis",
    sections: [
      { id: "purchaseDetails", label: "Purchase Details", checked: true },
      { id: "bondCalculations", label: "Bond Calculations", checked: true },
      { id: "monthlyRepayments", label: "Monthly Repayments", checked: true },
    ]
  },
  {
    title: "Revenue Analysis",
    sections: [
      { id: "shortTermRental", label: "Short-Term Rental Analysis", checked: true },
      { id: "longTermRental", label: "Long-Term Rental Analysis", checked: true },
      { id: "occupancyAnalysis", label: "Occupancy Analysis", checked: true },
    ]
  },
  {
    title: "Investment Performance",
    sections: [
      { id: "returnMetrics", label: "Return on Investment", checked: true },
      { id: "yieldAnalysis", label: "Yield Analysis", checked: true },
      { id: "cashflowProjections", label: "Cashflow Projections", checked: true },
    ]
  },
  {
    title: "Operating Costs",
    sections: [
      { id: "monthlyExpenses", label: "Monthly Expenses", checked: true },
      { id: "annualCosts", label: "Annual Costs", checked: true },
      { id: "maintenanceReserves", label: "Maintenance Reserves", checked: true },
    ]
  },
  {
    title: "Branding",
    sections: [
      { id: "companyBranding", label: "Include Company Branding", checked: true },
      { id: "proplyBranding", label: "Include Proply Branding", checked: true },
    ]
  }
];

export function PropertyReportGenerator({ 
  open, 
  onOpenChange, 
  data, 
  companyLogo 
}: PropertyReportGeneratorProps) {
  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>(defaultSectionGroups);
  const [generating, setGenerating] = useState(false);

  const toggleSection = (groupTitle: string, sectionId: string) => {
    setSectionGroups(sectionGroups.map(group => {
      if (group.title === groupTitle) {
        return {
          ...group,
          sections: group.sections.map(section =>
            section.id === sectionId ? { ...section, checked: !section.checked } : section
          )
        };
      }
      return group;
    }));
  };

  const isSectionChecked = (groupTitle: string, sectionId: string): boolean => {
    const group = sectionGroups.find(g => g.title === groupTitle);
    const section = group?.sections.find(s => s.id === sectionId);
    return section?.checked || false;
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const content = document.createElement('div');
      content.style.padding = '20px';
      content.style.fontFamily = 'Arial, sans-serif';

      // Header with branding
      if (isSectionChecked("Branding", "companyBranding")) {
        content.innerHTML += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            ${companyLogo ? `<img src="${companyLogo}" alt="Company Logo" style="height: 60px; object-fit: contain;" />` : ''}
            ${isSectionChecked("Branding", "proplyBranding") ? `
              <div style="text-align: right;">
                <img src="/proply-logo.png" alt="Proply Logo" style="height: 30px;" />
                <p style="margin: 0; font-size: 12px; color: #666;">Powered by Proply</p>
              </div>
            ` : ''}
          </div>
        `;
      }

      // Property Overview Section
      if (isSectionChecked("Property Details", "propertyOverview")) {
        content.innerHTML += `
          <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Property Details</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <p><strong>Address:</strong><br>${data.propertyDetails.address}</p>
                <p><strong>Purchase Price:</strong><br>${formatter.format(data.propertyDetails.purchasePrice)}</p>
                <p><strong>Floor Area:</strong><br>${data.propertyDetails.floorArea}m²</p>
              </div>
              <div>
                <p><strong>Bedrooms:</strong><br>${data.propertyDetails.bedrooms}</p>
                <p><strong>Bathrooms:</strong><br>${data.propertyDetails.bathrooms}</p>
                <p><strong>Parking:</strong><br>${data.propertyDetails.parkingSpaces}</p>
              </div>
            </div>
          </div>
        `;
      }

      // Financial Analysis Section
      if (isSectionChecked("Financial Analysis", "purchaseDetails")) {
        content.innerHTML += `
          <div style="margin-bottom: 30px; background: #f0f9ff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Financial Analysis</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <p><strong>Deposit Amount:</strong><br>${formatter.format(data.financialMetrics.depositAmount)}</p>
                <p><strong>Deposit Percentage:</strong><br>${data.financialMetrics.depositPercentage}%</p>
                <p><strong>Monthly Bond Repayment:</strong><br>${formatter.format(data.financialMetrics.monthlyBondRepayment)}</p>
              </div>
              <div>
                <p><strong>Interest Rate:</strong><br>${data.financialMetrics.interestRate}%</p>
                <p><strong>Loan Term:</strong><br>${data.financialMetrics.loanTerm} years</p>
                <p><strong>Bond Registration:</strong><br>${formatter.format(data.financialMetrics.bondRegistration)}</p>
              </div>
            </div>
          </div>
        `;
      }

      // Revenue Analysis Section
      if (isSectionChecked("Revenue Analysis", "shortTermRental")) {
        content.innerHTML += `
          <div style="margin-bottom: 30px; background: #f7f9fc; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Revenue Analysis</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <h3 style="color: #4a5568; margin-bottom: 10px;">Short-Term Rental</h3>
                <p><strong>Nightly Rate:</strong><br>${formatter.format(data.performance.shortTermNightlyRate)}</p>
                <p><strong>Annual Revenue:</strong><br>${formatter.format(data.performance.shortTermAnnualRevenue)}</p>
                <p><strong>Gross Yield:</strong><br>${data.performance.shortTermGrossYield.toFixed(1)}%</p>
              </div>
              <div>
                <h3 style="color: #4a5568; margin-bottom: 10px;">Long-Term Rental</h3>
                <p><strong>Annual Revenue:</strong><br>${formatter.format(data.performance.longTermAnnualRevenue)}</p>
                <p><strong>Gross Yield:</strong><br>${data.performance.longTermGrossYield.toFixed(1)}%</p>
                <p><strong>Occupancy Rate:</strong><br>${data.performance.annualOccupancy}%</p>
              </div>
            </div>
          </div>
        `;
      }

      // Operating Costs Section
      if (isSectionChecked("Operating Costs", "monthlyExpenses")) {
        content.innerHTML += `
          <div style="margin-bottom: 30px; background: #f0f9ff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Operating Costs</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              <div>
                <p><strong>Monthly Levies:</strong><br>${formatter.format(data.expenses.monthlyLevies)}</p>
                <p><strong>Monthly Rates & Taxes:</strong><br>${formatter.format(data.expenses.monthlyRatesTaxes)}</p>
                <p><strong>Other Monthly Expenses:</strong><br>${formatter.format(data.expenses.otherMonthlyExpenses)}</p>
              </div>
              <div>
                <p><strong>Maintenance Reserve:</strong><br>${data.expenses.maintenancePercent}% of rental income</p>
                <p><strong>Management Fee:</strong><br>${data.expenses.managementFee}%</p>
                <p><strong>Total Monthly Expenses:</strong><br>${formatter.format(
                  data.expenses.monthlyLevies +
                  data.expenses.monthlyRatesTaxes +
                  data.expenses.otherMonthlyExpenses
                )}</p>
              </div>
            </div>
          </div>
        `;
      }

      // Footer
      content.innerHTML += `
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #718096; font-size: 0.875rem;">
            Generated on ${new Date().toLocaleDateString()}
          </p>
          <p style="color: #718096; font-size: 0.75rem;">
            This report is for informational purposes only and should not be considered as financial advice.
            Values and projections are estimates based on current market conditions and may vary.
          </p>
        </footer>
      `;

      const options = {
        margin: 1,
        filename: `${data.propertyDetails.address.split(',')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(options).from(content).save();
      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Generate Property Analysis Report</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          {sectionGroups.map((group) => (
            <Card key={group.title}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">{group.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {group.sections.map((section) => (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={section.id} 
                        checked={section.checked}
                        onCheckedChange={() => toggleSection(group.title, section.id)}
                      />
                      <label 
                        htmlFor={section.id} 
                        className="text-sm cursor-pointer"
                      >
                        {section.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button 
            onClick={generatePDF} 
            disabled={generating}
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            {generating ? 'Generating PDF...' : 'Generate PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}