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
    description: string;
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
    longTerm: Record<Year, number>;
  };
  monthlyPerformance?: {
    [month: string]: {
      nightlyRate: number;
      occupancy: number;
      revenue: number;
    };
  };
  propertyValue?: Record<Year, number>;
  loanBalance?: Record<Year, number>;
  equityBuildUp?: Record<Year, number>;
  appreciation?: Record<Year, {
    value: number;
    percentage: number;
    rand: number;
  }>;
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
    title: "Deal Summary",
    sections: [
      { id: "propertyDetails", label: "Property Details", checked: true },
      { id: "dealStructure", label: "Deal Structure", checked: true },
      { id: "sizeAndRate", label: "Size and Rate/m²", checked: true }
    ]
  },
  {
    title: "Income Performance",
    sections: [
      { id: "shortTermYear1", label: "Short-Term Rental (Year 1)", checked: true },
      { id: "longTermYear1", label: "Long-Term Rental (Year 1)", checked: true },
      { id: "airbnbPerformance", label: "Airbnb Performance - Year 1", checked: true },
      { id: "monthlyOccupancy", label: "Monthly Occupancy & Revenue", checked: true }
    ]
  },
  {
    title: "Cashflow Metrics",
    sections: [
      { id: "revenue", label: "Revenue", checked: true },
      { id: "operatingExpenses", label: "Operating Expenses", checked: true },
      { id: "noi", label: "Net Operating Income", checked: true },
      { id: "bondPayment", label: "Bond Payment", checked: true },
      { id: "annualCashflow", label: "Annual Cashflow", checked: true },
      { id: "cumulativeCashflow", label: "Cumulative Cashflow", checked: true },
      { id: "equityBuildUp", label: "Equity Buildup", checked: true }
    ]
  },
  {
    title: "Investment Metrics",
    sections: [
      { id: "grossYield", label: "Gross Yield", checked: true },
      { id: "netYield", label: "Net Yield", checked: true },
      { id: "roe", label: "Return on Equity", checked: true },
      { id: "annualReturn", label: "Annual Return", checked: true },
      { id: "capRate", label: "Cap Rate", checked: true },
      { id: "cashOnCash", label: "Cash on Cash Return", checked: true },
      { id: "roi", label: "ROI", checked: true },
      { id: "irr", label: "IRR", checked: true }
    ]
  },
  {
    title: "Property Value",
    sections: [
      { id: "loanBalance", label: "Loan Balance", checked: true },
      { id: "equityBuildup", label: "Equity Buildup", checked: true },
      { id: "propertyValue", label: "Property Value", checked: true },
      { id: "appreciation", label: "Appreciation", checked: true }
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

      // Deal Summary Section
      if (isSectionChecked("Deal Summary", "propertyDetails")) {
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Deal Summary</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Item</th>
                <th style="${tableHeaderStyle}">Value</th>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Property Address</td>
                <td style="${tableCellStyle}">${data.propertyDetails.address}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Property Description</td>
                <td style="${tableCellStyle}">${data.propertyDetails.description}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Purchase Price</td>
                <td style="${tableCellStyle}">${formatter.format(data.propertyDetails.purchasePrice)}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Deposit</td>
                <td style="${tableCellStyle}">${formatter.format(data.financialMetrics.depositAmount)} (${data.financialMetrics.depositPercentage}%)</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Interest Rate</td>
                <td style="${tableCellStyle}">${data.financialMetrics.interestRate}%</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Monthly Bond Repayment</td>
                <td style="${tableCellStyle}">${formatter.format(data.financialMetrics.monthlyBondRepayment)}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Bond Registration</td>
                <td style="${tableCellStyle}">${formatter.format(data.financialMetrics.bondRegistration)}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Transfer Costs</td>
                <td style="${tableCellStyle}">${formatter.format(data.financialMetrics.transferCosts)}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Total Capital Required</td>
                <td style="${tableCellStyle}">${formatter.format(
                  data.financialMetrics.depositAmount +
                  data.financialMetrics.bondRegistration +
                  data.financialMetrics.transferCosts
                )}</td>
              </tr>
            </table>
          </div>
        `;
      }

      if (isSectionChecked("Deal Summary", "sizeAndRate")) {
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Size and Rate/m²</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Item</th>
                <th style="${tableHeaderStyle}">Value</th>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Floor Area</td>
                <td style="${tableCellStyle}">${data.propertyDetails.floorArea} m²</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Beds</td>
                <td style="${tableCellStyle}">${data.propertyDetails.bedrooms}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Baths</td>
                <td style="${tableCellStyle}">${data.propertyDetails.bathrooms}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Parking</td>
                <td style="${tableCellStyle}">${data.propertyDetails.parkingSpaces}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Avg. Rate per m²</td>
                <td style="${tableCellStyle}">${formatter.format(data.propertyDetails.ratePerSquareMeter)}/m²</td>
              </tr>
            </table>
          </div>
        `;
      }

      // Income Performance Section
      if (isSectionChecked("Income Performance", "shortTermYear1")) {
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Income Performance</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Item</th>
                <th style="${tableHeaderStyle}">Value</th>
              </tr>
              <tr>
                <td style="${tableCellStyle}">STR Year 1 Revenue</td>
                <td style="${tableCellStyle}">${formatter.format(data.performance.shortTermAnnualRevenue)}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">STR Year 1 Gross Yield</td>
                <td style="${tableCellStyle}">${data.performance.shortTermGrossYield.toFixed(2)}%</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Nightly Rate</td>
                <td style="${tableCellStyle}">${formatter.format(data.performance.shortTermNightlyRate)}</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">Occupancy (%)</td>
                <td style="${tableCellStyle}">${data.performance.annualOccupancy}%</td>
              </tr>
              <tr>
                <td style="${tableCellStyle}">STR Monthly Revenue</td>
                <td style="${tableCellStyle}">${formatter.format(data.performance.shortTermAnnualRevenue / 12)}</td>
              </tr>
            </table>
          </div>
        `;
      }

      if (data.monthlyPerformance && isSectionChecked("Income Performance", "airbnbPerformance")) {
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Airbnb Performance - Year 1</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Month</th>
                <th style="${tableHeaderStyle}">Nightly Rate</th>
                <th style="${tableHeaderStyle}">Occupancy</th>
                <th style="${tableHeaderStyle}">Revenue</th>
              </tr>
              ${Object.entries(data.monthlyPerformance).map(([month, data]) => `
                <tr>
                  <td style="${tableCellStyle}">${month}</td>
                  <td style="${tableCellStyle}">${formatter.format(data.nightlyRate)}</td>
                  <td style="${tableCellStyle}">${data.occupancy}%</td>
                  <td style="${tableCellStyle}">${formatter.format(data.revenue)}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        `;
      }

      // Cashflow Metrics Section
      if (sectionGroups[2].sections.some(s => s.checked)) {
        const years: Year[] = ['year1', 'year2', 'year3', 'year4', 'year5', 'year10', 'year20'];
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Cashflow Metrics</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Metric</th>
                ${years.map(year => `<th style="${tableHeaderStyle}">Year ${year.replace('year', '')}</th>`).join('')}
              </tr>
              ${isSectionChecked("Cashflow Metrics", "revenue") ? `
                <tr>
                  <td style="${tableCellStyle}">Revenue</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${formatter.format(data.revenueProjections.shortTerm[year])}</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Cashflow Metrics", "operatingExpenses") ? `
                <tr>
                  <td style="${tableCellStyle}">Operating Expenses</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${formatter.format(data.operatingExpenses[year])}</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Cashflow Metrics", "noi") && data.netOperatingIncome ? `
                <tr>
                  <td style="${tableCellStyle}">NOI</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${formatter.format(data.netOperatingIncome[year].value)}</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Cashflow Metrics", "annualCashflow") && data.netOperatingIncome ? `
                <tr>
                  <td style="${tableCellStyle}">Annual Cashflow</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${formatter.format(data.netOperatingIncome[year].annualCashflow)}</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Cashflow Metrics", "cumulativeCashflow") && data.netOperatingIncome ? `
                <tr>
                  <td style="${tableCellStyle}">Cumulative Cashflow</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${formatter.format(data.netOperatingIncome[year].cumulativeRentalIncome)}</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Cashflow Metrics", "equityBuildUp") && data.equityBuildUp ? `
                <tr>
                  <td style="${tableCellStyle}">Equity Buildup</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${formatter.format(data.equityBuildUp[year])}</td>`).join('')}
                </tr>
              ` : ''}
            </table>
          </div>
        `;
      }

      // Investment Metrics Section
      if (sectionGroups[3].sections.some(s => s.checked) && data.investmentMetrics) {
        const years: Year[] = ['year1', 'year2', 'year3', 'year4', 'year5', 'year10', 'year20'];
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Investment Metrics</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Metric</th>
                ${years.map(year => `<th style="${tableHeaderStyle}">Year ${year.replace('year', '')}</th>`).join('')}
              </tr>
              ${isSectionChecked("Investment Metrics", "grossYield") ? `
                <tr>
                  <td style="${tableCellStyle}">Gross Yield</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${data.investmentMetrics[year]?.grossYield.toFixed(2) ?? 'N/A'}%</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Investment Metrics", "netYield") ? `
                <tr>
                  <td style="${tableCellStyle}">Net Yield</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${data.investmentMetrics[year]?.netYield.toFixed(2) ?? 'N/A'}%</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Investment Metrics", "roe") ? `
                <tr>
                  <td style="${tableCellStyle}">ROE</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${data.investmentMetrics[year]?.returnOnEquity.toFixed(2) ?? 'N/A'}%</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Investment Metrics", "annualReturn") ? `
                <tr>
                  <td style="${tableCellStyle}">Annual Return</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${data.investmentMetrics[year]?.annualReturn.toFixed(2) ?? 'N/A'}%</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Investment Metrics", "capRate") ? `
                <tr>
                  <td style="${tableCellStyle}">Cap Rate</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${data.investmentMetrics[year]?.capRate.toFixed(2) ?? 'N/A'}%</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Investment Metrics", "cashOnCash") ? `
                <tr>
                  <td style="${tableCellStyle}">Cash on Cash</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${data.investmentMetrics[year]?.cashOnCashReturn.toFixed(2) ?? 'N/A'}%</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Investment Metrics", "roi") ? `
                <tr>
                  <td style="${tableCellStyle}">ROI (with appreciation)</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${data.investmentMetrics[year]?.roiWithAppreciation.toFixed(2) ?? 'N/A'}%</td>`).join('')}
                </tr>
                <tr>
                  <td style="${tableCellStyle}">ROI (without appreciation)</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${data.investmentMetrics[year]?.roiWithoutAppreciation.toFixed(2) ?? 'N/A'}%</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Investment Metrics", "irr") ? `
                <tr>
                  <td style="${tableCellStyle}">IRR</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${data.investmentMetrics[year]?.irr.toFixed(2) ?? 'N/A'}%</td>`).join('')}
                </tr>
              ` : ''}
            </table>
          </div>
        `;
      }

      // Property Value Section
      if (sectionGroups[4].sections.some(s => s.checked)) {
        const years: Year[] = ['year1', 'year2', 'year3', 'year4', 'year5', 'year10', 'year20'];
        content.innerHTML += `
          <div style="margin-bottom: 40px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Property Metrics</h2>
            <table style="${tableStyle}">
              <tr>
                <th style="${tableHeaderStyle}">Metric</th>
                ${years.map(year => `<th style="${tableHeaderStyle}">Year ${year.replace('year', '')}</th>`).join('')}
              </tr>
              ${isSectionChecked("Property Value", "loanBalance") && data.loanBalance ? `
                <tr>
                  <td style="${tableCellStyle}">Loan Balance</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${formatter.format(data.loanBalance[year])}</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Property Value", "equityBuildup") && data.equityBuildUp ? `
                <tr>
                  <td style="${tableCellStyle}">Equity Buildup</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${formatter.format(data.equityBuildUp[year])}</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Property Value", "propertyValue") && data.propertyValue ? `
                <tr>
                  <td style="${tableCellStyle}">Property Value</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${formatter.format(data.propertyValue[year])}</td>`).join('')}
                </tr>
              ` : ''}
              ${isSectionChecked("Property Value", "appreciation") && data.appreciation ? `
                <tr>
                  <td style="${tableCellStyle}">Appreciation</td>
                  ${years.map(year => `<td style="${tableCellStyle}">${data.appreciation[year].percentage.toFixed(2)}%<br/>${formatter.format(data.appreciation[year].rand)}</td>`).join('')}
                </tr>
              ` : ''}
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
        margin: 15,
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
        description: error instanceof Error ? error.message : "Failed to generate PDF report. Please try again.",
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