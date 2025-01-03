import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import html2pdf from "html2pdf.js";
import { formatter } from "@/lib/utils";

type Year = 'year1' | 'year2' | 'year3' | 'year4' | 'year5' | 'year10' | 'year20';

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
  investmentMetrics: Record<Year, YearlyMetrics>;
  operatingExpenses: Record<Year, number>;
  netOperatingIncome: Record<Year, {
    value: number;
    annualCashflow: number;
    cumulativeRentalIncome: number;
    netWorthChange: number;
  }>;
  revenueProjections: {
    shortTerm: Record<Year, number>;
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
      { id: "address", label: "Address", checked: true },
      { id: "purchasePrice", label: "Purchase Price", checked: true },
      { id: "floorArea", label: "Floor Area", checked: true },
      { id: "ratePerM2", label: "Rate per m²", checked: true },
      { id: "areaRatePerM2", label: "Area Rate/m²", checked: true },
      { id: "ratePerM2Difference", label: "Rate/m² Difference", checked: true }
    ]
  },
  {
    title: "Short-Term Rental (Year 1)",
    sections: [
      { id: "stAnnualRevenue", label: "Annual Revenue", checked: true },
      { id: "stMonthlyRevenue", label: "Monthly Revenue", checked: true },
      { id: "stGrossYield", label: "Gross Yield", checked: true },
      { id: "stNightlyRate", label: "Nightly Rate", checked: true },
      { id: "stFeeAdjustedRate", label: "Fee-adjusted Rate", checked: true },
      { id: "stPlatformFee", label: "Platform Fee", checked: true },
      { id: "stManagementFee", label: "Management Fee", checked: true },
      { id: "stOccupancy", label: "Occupancy", checked: true }
    ]
  },
  {
    title: "Long-Term Rental (Year 1)",
    sections: [
      { id: "ltAnnualRevenue", label: "Annual Revenue", checked: true },
      { id: "ltMonthlyRevenue", label: "Monthly Revenue", checked: true },
      { id: "ltGrossYield", label: "Gross Yield", checked: true }
    ]
  },
  {
    title: "Performance Projections",
    sections: [
      { id: "rentalPerformance", label: "Rental Performance Table & Chart", checked: true },
      { id: "cashflowProjections", label: "Annual Cashflow Projections", checked: true },
      { id: "propertyValueProjections", label: "Property Value Projections", checked: true },
      { id: "loanBalanceProjections", label: "Loan Balance Over Time", checked: true },
      { id: "netWorthProjections", label: "Net Worth Change", checked: true }
    ]
  },
  {
    title: "Investment Metrics (Year 1)",
    sections: [
      { id: "grossYield", label: "Gross Yield", checked: true },
      { id: "netYield", label: "Net Yield", checked: true },
      { id: "returnOnEquity", label: "Return on Equity", checked: true },
      { id: "annualReturn", label: "Annual Return", checked: true },
      { id: "capRate", label: "Cap Rate", checked: true },
      { id: "cashOnCashReturn", label: "Cash on Cash Return", checked: true },
      { id: "irr", label: "IRR", checked: true }
    ]
  },
  {
    title: "Operating Financials",
    sections: [
      { id: "opAnnualRevenue", label: "Annual Revenue (Year 1)", checked: true },
      { id: "opNetExpenses", label: "Net Operating Expenses (Year 1)", checked: true },
      { id: "opNetIncome", label: "Net Operating Income (Year 1)", checked: true },
      { id: "opAnnualBondPayment", label: "Annual Bond Payment", checked: true },
      { id: "opCumulativeCashflow", label: "Cumulative Cashflow (Year 1)", checked: true },
      { id: "totalInterestPaid", label: "Total Interest Paid Over Time", checked: true }
    ]
  },
  {
    title: "Branding",
    sections: [
      { id: "companyBranding", label: "Include Company Branding", checked: true },
      { id: "proplyBranding", label: "Include Proply Branding", checked: true }
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

      // Add branding if selected
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

      // Property Details Section
      if (sectionGroups[0].sections.some(s => s.checked)) {
        content.innerHTML += `
          <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Property Details</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              ${isSectionChecked("Property Details", "address") ?
                `<p><strong>Address:</strong><br>${data.propertyDetails.address}</p>` : ''}
              ${isSectionChecked("Property Details", "purchasePrice") ?
                `<p><strong>Purchase Price:</strong><br>${formatter.format(data.propertyDetails.purchasePrice)}</p>` : ''}
              ${isSectionChecked("Property Details", "floorArea") ?
                `<p><strong>Floor Area:</strong><br>${data.propertyDetails.floorArea}m²</p>` : ''}
              ${isSectionChecked("Property Details", "ratePerM2") ?
                `<p><strong>Rate per m²:</strong><br>${formatter.format(data.propertyDetails.ratePerSquareMeter)}/m²</p>` : ''}
              ${isSectionChecked("Property Details", "areaRatePerM2") ?
                `<p><strong>Area Rate/m²:</strong><br>${formatter.format(data.propertyDetails.ratePerSquareMeter)}/m²</p>` : ''}
              ${isSectionChecked("Property Details", "ratePerM2Difference") ?
                `<p><strong>Rate/m² Difference:</strong><br>${formatter.format(data.propertyDetails.ratePerSquareMeter - data.propertyDetails.ratePerSquareMeter)}/m²</p>` : ''}
            </div>
          </div>
        `;
      }

      // Short-Term Rental Section
      if (sectionGroups[1].sections.some(s => s.checked)) {
        content.innerHTML += `
          <div style="margin-bottom: 30px; background: #f7f9fc; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Short-Term Rental (Year 1)</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              ${isSectionChecked("Short-Term Rental (Year 1)", "stAnnualRevenue") ?
                `<p><strong>Annual Revenue:</strong><br>${formatter.format(data.performance.shortTermAnnualRevenue)}</p>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stMonthlyRevenue") ?
                `<p><strong>Monthly Revenue:</strong><br>${formatter.format(data.performance.shortTermAnnualRevenue / 12)}</p>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stGrossYield") ?
                `<p><strong>Gross Yield:</strong><br>${data.performance.shortTermGrossYield.toFixed(1)}%</p>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stNightlyRate") ?
                `<p><strong>Nightly Rate:</strong><br>${formatter.format(data.performance.shortTermNightlyRate)}</p>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stFeeAdjustedRate") ?
                `<p><strong>Fee-adjusted Rate:</strong><br>${formatter.format(data.performance.shortTermNightlyRate * (1 - data.expenses.managementFee / 100))}</p>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stManagementFee") ?
                `<p><strong>Management Fee:</strong><br>${data.expenses.managementFee}%</p>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stOccupancy") ?
                `<p><strong>Occupancy:</strong><br>${data.performance.annualOccupancy}%</p>` : ''}
            </div>
          </div>
        `;
      }

      // Long-Term Rental Section
      if (sectionGroups[2].sections.some(s => s.checked)) {
        content.innerHTML += `
          <div style="margin-bottom: 30px; background: #f7f9fc; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Long-Term Rental (Year 1)</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              ${isSectionChecked("Long-Term Rental (Year 1)", "ltAnnualRevenue") ?
                `<p><strong>Annual Revenue:</strong><br>${formatter.format(data.performance.longTermAnnualRevenue)}</p>` : ''}
              ${isSectionChecked("Long-Term Rental (Year 1)", "ltMonthlyRevenue") ?
                `<p><strong>Monthly Revenue:</strong><br>${formatter.format(data.performance.longTermAnnualRevenue / 12)}</p>` : ''}
              ${isSectionChecked("Long-Term Rental (Year 1)", "ltGrossYield") ?
                `<p><strong>Gross Yield:</strong><br>${data.performance.longTermGrossYield.toFixed(1)}%</p>` : ''}
            </div>
          </div>
        `;
      }

      // Performance Projections Section
      if (sectionGroups[3].sections.some(s => s.checked)) {
        if (isSectionChecked("Performance Projections", "cashflowProjections")) {
          const years: Year[] = ['year1', 'year2', 'year3', 'year4', 'year5', 'year10', 'year20'];
          content.innerHTML += `
            <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #2d3748; margin-bottom: 15px;">Annual Cashflow Projections</h2>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                ${years.map(year => `
                  <div>
                    <p><strong>Year ${year.replace('year', '')}:</strong><br>${formatter.format(data.netOperatingIncome[year].annualCashflow)}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
      }

      // Investment Metrics Section
      if (sectionGroups[4].sections.some(s => s.checked)) {
        const year1Metrics = data.investmentMetrics.year1;
        content.innerHTML += `
          <div style="margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Investment Metrics (Year 1)</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              ${isSectionChecked("Investment Metrics (Year 1)", "grossYield") ?
                `<p><strong>Gross Yield:</strong><br>${year1Metrics.grossYield.toFixed(1)}%</p>` : ''}
              ${isSectionChecked("Investment Metrics (Year 1)", "netYield") ?
                `<p><strong>Net Yield:</strong><br>${year1Metrics.netYield.toFixed(1)}%</p>` : ''}
              ${isSectionChecked("Investment Metrics (Year 1)", "returnOnEquity") ?
                `<p><strong>Return on Equity:</strong><br>${year1Metrics.returnOnEquity.toFixed(1)}%</p>` : ''}
              ${isSectionChecked("Investment Metrics (Year 1)", "annualReturn") ?
                `<p><strong>Annual Return:</strong><br>${year1Metrics.annualReturn.toFixed(1)}%</p>` : ''}
              ${isSectionChecked("Investment Metrics (Year 1)", "capRate") ?
                `<p><strong>Cap Rate:</strong><br>${year1Metrics.capRate.toFixed(1)}%</p>` : ''}
              ${isSectionChecked("Investment Metrics (Year 1)", "cashOnCashReturn") ?
                `<p><strong>Cash on Cash Return:</strong><br>${year1Metrics.cashOnCashReturn.toFixed(1)}%</p>` : ''}
              ${isSectionChecked("Investment Metrics (Year 1)", "irr") ?
                `<p><strong>IRR:</strong><br>${year1Metrics.irr.toFixed(1)}%</p>` : ''}
            </div>
          </div>
        `;
      }

      // Operating Financials Section
      if (sectionGroups[5].sections.some(s => s.checked)) {
        content.innerHTML += `
          <div style="margin-bottom: 30px; background: #f0f9ff; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2d3748; margin-bottom: 15px;">Operating Financials</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              ${isSectionChecked("Operating Financials", "opAnnualRevenue") ?
                `<p><strong>Annual Revenue (Year 1):</strong><br>${formatter.format(data.performance.shortTermAnnualRevenue)}</p>` : ''}
              ${isSectionChecked("Operating Financials", "opNetExpenses") ?
                `<p><strong>Net Operating Expenses (Year 1):</strong><br>${formatter.format(data.operatingExpenses.year1)}</p>` : ''}
              ${isSectionChecked("Operating Financials", "opNetIncome") ?
                `<p><strong>Net Operating Income (Year 1):</strong><br>${formatter.format(data.netOperatingIncome.year1.value)}</p>` : ''}
              ${isSectionChecked("Operating Financials", "opAnnualBondPayment") ?
                `<p><strong>Annual Bond Payment:</strong><br>${formatter.format(data.financialMetrics.monthlyBondRepayment * 12)}</p>` : ''}
              ${isSectionChecked("Operating Financials", "opCumulativeCashflow") ?
                `<p><strong>Cumulative Cashflow (Year 1):</strong><br>${formatter.format(data.netOperatingIncome.year1.cumulativeRentalIncome)}</p>` : ''}
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