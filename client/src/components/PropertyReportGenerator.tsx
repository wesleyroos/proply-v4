import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

const tableHeaderStyle = `
  background-color: #2c5282;
  color: white;
  padding: 8px;
  font-weight: bold;
  text-align: left;
`;

const tableCellStyle = `
  padding: 8px;
  border: 1px solid #e2e8f0;
`;

const tableStyle = `
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background-color: white;
`;

export function PropertyReportGenerator({
  open,
  onOpenChange,
  data,
  companyLogo
}: PropertyReportGeneratorProps) {
  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>(defaultSectionGroups);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

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
      content.style.padding = '40px';
      content.style.maxWidth = '1000px';
      content.style.margin = '0 auto';
      content.style.fontFamily = 'Arial, sans-serif';
      content.style.backgroundColor = '#ffffff';

      // Add branding if selected
      if (isSectionChecked("Branding", "companyBranding")) {
        content.innerHTML += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
            ${companyLogo ? `<img src="${companyLogo}" alt="Company Logo" style="height: 60px; object-fit: contain;" />` : ''}
            ${isSectionChecked("Branding", "proplyBranding") ? `
              <div style="text-align: right;">
                <img src="/proply-logo.png" alt="Proply Logo" style="height: 30px;" />
                <p style="margin: 0; font-size: 12px; color: #666;">Powered by Proply</p>
              </div>
            ` : ''}
          </div>
          <h1 style="color: #2c5282; font-size: 24px; margin-bottom: 30px;">Property Analysis Report</h1>
        `;
      }

      // Property Details Section
      if (sectionGroups[0].sections.some(s => s.checked)) {
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Property Details</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Item</th>
                <th style="${tableHeaderStyle}">Value</th>
              </tr>
              ${isSectionChecked("Property Details", "address") ?
                `<tr><td style="${tableCellStyle}">Property Address</td><td style="${tableCellStyle}">${data.propertyDetails.address}</td></tr>` : ''}
              ${isSectionChecked("Property Details", "purchasePrice") ?
                `<tr><td style="${tableCellStyle}">Purchase Price</td><td style="${tableCellStyle}">${formatter.format(data.propertyDetails.purchasePrice)}</td></tr>` : ''}
              ${isSectionChecked("Property Details", "floorArea") ?
                `<tr><td style="${tableCellStyle}">Floor Area</td><td style="${tableCellStyle}">${data.propertyDetails.floorArea}m²</td></tr>` : ''}
              ${isSectionChecked("Property Details", "ratePerM2") ?
                `<tr><td style="${tableCellStyle}">Rate per m²</td><td style="${tableCellStyle}">${formatter.format(data.propertyDetails.ratePerSquareMeter)}/m²</td></tr>` : ''}
              ${isSectionChecked("Property Details", "areaRatePerM2") ?
                `<tr><td style="${tableCellStyle}">Area Rate/m²</td><td style="${tableCellStyle}">${formatter.format(data.propertyDetails.ratePerSquareMeter)}/m²</td></tr>` : ''}
              ${isSectionChecked("Property Details", "ratePerM2Difference") ?
                `<tr><td style="${tableCellStyle}">Rate/m² Difference</td><td style="${tableCellStyle}">${formatter.format(data.propertyDetails.ratePerSquareMeter - data.propertyDetails.ratePerSquareMeter)}/m²</td></tr>` : ''}
            </table>
          </div>
        `;
      }

      // Short-Term Rental Section
      if (sectionGroups[1].sections.some(s => s.checked)) {
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Short-Term Rental Performance</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Metric</th>
                <th style="${tableHeaderStyle}">Value</th>
              </tr>
              ${isSectionChecked("Short-Term Rental (Year 1)", "stAnnualRevenue") ?
                `<tr><td style="${tableCellStyle}">Annual Revenue</td><td style="${tableCellStyle}">${formatter.format(data.performance.shortTermAnnualRevenue)}</td></tr>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stMonthlyRevenue") ?
                `<tr><td style="${tableCellStyle}">Monthly Revenue</td><td style="${tableCellStyle}">${formatter.format(data.performance.shortTermAnnualRevenue / 12)}</td></tr>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stGrossYield") ?
                `<tr><td style="${tableCellStyle}">Gross Yield</td><td style="${tableCellStyle}">${data.performance.shortTermGrossYield.toFixed(1)}%</td></tr>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stNightlyRate") ?
                `<tr><td style="${tableCellStyle}">Nightly Rate</td><td style="${tableCellStyle}">${formatter.format(data.performance.shortTermNightlyRate)}</td></tr>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stFeeAdjustedRate") ?
                `<tr><td style="${tableCellStyle}">Fee-adjusted Rate</td><td style="${tableCellStyle}">${formatter.format(data.performance.shortTermNightlyRate * (1 - data.expenses.managementFee/100))}</td></tr>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stManagementFee") ?
                `<tr><td style="${tableCellStyle}">Management Fee</td><td style="${tableCellStyle}">${data.expenses.managementFee}%</td></tr>` : ''}
              ${isSectionChecked("Short-Term Rental (Year 1)", "stOccupancy") ?
                `<tr><td style="${tableCellStyle}">Occupancy</td><td style="${tableCellStyle}">${data.performance.annualOccupancy}%</td></tr>` : ''}
            </table>
          </div>
        `;
      }

      // Long-Term Rental Section
      if (sectionGroups[2].sections.some(s => s.checked)) {
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Long-Term Rental Performance</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Metric</th>
                <th style="${tableHeaderStyle}">Value</th>
              </tr>
              ${isSectionChecked("Long-Term Rental (Year 1)", "ltAnnualRevenue") ?
                `<tr><td style="${tableCellStyle}">Annual Revenue</td><td style="${tableCellStyle}">${formatter.format(data.performance.longTermAnnualRevenue)}</td></tr>` : ''}
              ${isSectionChecked("Long-Term Rental (Year 1)", "ltMonthlyRevenue") ?
                `<tr><td style="${tableCellStyle}">Monthly Revenue</td><td style="${tableCellStyle}">${formatter.format(data.performance.longTermAnnualRevenue / 12)}</td></tr>` : ''}
              ${isSectionChecked("Long-Term Rental (Year 1)", "ltGrossYield") ?
                `<tr><td style="${tableCellStyle}">Gross Yield</td><td style="${tableCellStyle}">${data.performance.longTermGrossYield.toFixed(1)}%</td></tr>` : ''}
            </table>
          </div>
        `;
      }

      // Performance Projections Section
      if (sectionGroups[3].sections.some(s => s.checked)) {
        if (isSectionChecked("Performance Projections", "cashflowProjections") && data.netOperatingIncome) {
          const years: Year[] = ['year1', 'year2', 'year3', 'year4', 'year5', 'year10', 'year20'];
          content.innerHTML += `
            <div style="margin-bottom: 40px;">
              <h2 style="color: #2d3748; margin-bottom: 20px;">Annual Cashflow Projections</h2>
              <table style="${tableStyle}">
                <tr>
                  <th style="${tableHeaderStyle}">Year</th>
                  <th style="${tableHeaderStyle}">Annual Cashflow</th>
                </tr>
                ${years.map(year => data.netOperatingIncome[year] ? `
                  <tr>
                    <td style="${tableCellStyle}">Year ${year.replace('year', '')}</td>
                    <td style="${tableCellStyle}">${formatter.format(data.netOperatingIncome[year].annualCashflow)}</td>
                  </tr>
                ` : '').join('')}
              </table>
            </div>
          `;
        }
      }

      // Investment Metrics Section
      if (sectionGroups[4].sections.some(s => s.checked)) {
        const yearMetrics = data.investmentMetrics?.year1;
        if (yearMetrics) {
          content.innerHTML += `
            <div style="margin-bottom: 40px;">
              <h2 style="color: #2d3748; margin-bottom: 20px;">Investment Metrics (Year 1)</h2>
              <table style="${tableStyle}">
                <tr>
                  <th style="${tableHeaderStyle}">Metric</th>
                  <th style="${tableHeaderStyle}">Value</th>
                </tr>
                ${isSectionChecked("Investment Metrics (Year 1)", "grossYield") ?
                  `<tr><td style="${tableCellStyle}">Gross Yield</td><td style="${tableCellStyle}">${yearMetrics.grossYield.toFixed(1)}%</td></tr>` : ''}
                ${isSectionChecked("Investment Metrics (Year 1)", "netYield") ?
                  `<tr><td style="${tableCellStyle}">Net Yield</td><td style="${tableCellStyle}">${yearMetrics.netYield.toFixed(1)}%</td></tr>` : ''}
                ${isSectionChecked("Investment Metrics (Year 1)", "returnOnEquity") ?
                  `<tr><td style="${tableCellStyle}">Return on Equity</td><td style="${tableCellStyle}">${yearMetrics.returnOnEquity.toFixed(1)}%</td></tr>` : ''}
                ${isSectionChecked("Investment Metrics (Year 1)", "annualReturn") ?
                  `<tr><td style="${tableCellStyle}">Annual Return</td><td style="${tableCellStyle}">${yearMetrics.annualReturn.toFixed(1)}%</td></tr>` : ''}
                ${isSectionChecked("Investment Metrics (Year 1)", "capRate") ?
                  `<tr><td style="${tableCellStyle}">Cap Rate</td><td style="${tableCellStyle}">${yearMetrics.capRate.toFixed(1)}%</td></tr>` : ''}
                ${isSectionChecked("Investment Metrics (Year 1)", "cashOnCashReturn") ?
                  `<tr><td style="${tableCellStyle}">Cash on Cash Return</td><td style="${tableCellStyle}">${yearMetrics.cashOnCashReturn.toFixed(1)}%</td></tr>` : ''}
                ${isSectionChecked("Investment Metrics (Year 1)", "irr") ?
                  `<tr><td style="${tableCellStyle}">IRR</td><td style="${tableCellStyle}">${yearMetrics.irr.toFixed(1)}%</td></tr>` : ''}
              </table>
            </div>
          `;
        }
      }

      // Operating Financials Section
      if (sectionGroups[5].sections.some(s => s.checked) && data.netOperatingIncome?.year1) {
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Operating Financials</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Metric</th>
                <th style="${tableHeaderStyle}">Value</th>
              </tr>
              ${isSectionChecked("Operating Financials", "opAnnualRevenue") ?
                `<tr><td style="${tableCellStyle}">Annual Revenue (Year 1)</td><td style="${tableCellStyle}">${formatter.format(data.performance.shortTermAnnualRevenue)}</td></tr>` : ''}
              ${isSectionChecked("Operating Financials", "opNetExpenses") ?
                `<tr><td style="${tableCellStyle}">Net Operating Expenses (Year 1)</td><td style="${tableCellStyle}">${formatter.format(data.operatingExpenses.year1)}</td></tr>` : ''}
              ${isSectionChecked("Operating Financials", "opNetIncome") ?
                `<tr><td style="${tableCellStyle}">Net Operating Income (Year 1)</td><td style="${tableCellStyle}">${formatter.format(data.netOperatingIncome.year1.value)}</td></tr>` : ''}
              ${isSectionChecked("Operating Financials", "opAnnualBondPayment") ?
                `<tr><td style="${tableCellStyle}">Annual Bond Payment</td><td style="${tableCellStyle}">${formatter.format(data.financialMetrics.monthlyBondRepayment * 12)}</td></tr>` : ''}
              ${isSectionChecked("Operating Financials", "opCumulativeCashflow") ?
                `<tr><td style="${tableCellStyle}">Cumulative Cashflow (Year 1)</td><td style="${tableCellStyle}">${formatter.format(data.netOperatingIncome.year1.cumulativeRentalIncome)}</td></tr>` : ''}
            </table>
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
        margin: [15, 15],
        filename: `${data.propertyDetails.address.split(',')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase()}_analysis.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(options).from(content).save();

      toast({
        title: "Success",
        description: "PDF report has been generated successfully!",
        duration: 5000,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
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