import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, ChevronDown } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import PropertyForm from "../components/PropertyForm";
import ComparisonChart from "../components/ComparisonChart";
import { useUser } from "../hooks/use-user";
import { useQueryClient } from "@tanstack/react-query";
import { useProAccess } from "@/hooks/use-pro-access";
import { useToast } from "@/hooks/use-toast";

export default function ComparisonPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { hasAccess: hasProAccess } = useProAccess();
  const { toast } = useToast();
  const [address, setAddress] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const queryClient = useQueryClient();

  interface ComparisonData {
    title: string;
    longTermMonthly: number;
    shortTermMonthly: number;
    longTermAnnual: number;
    shortTermAnnual: number;
    shortTermAfterFees: number;
    breakEvenOccupancy: number;
    shortTermNightly: number;
    managementFee: number;
    annualOccupancy: number;
    bedrooms?: string;
    bathrooms?: string;
  }

  const handleCompare = async (data: any) => {
    setAddress(data.address);
    setTimeout(() => {
      const yOffset = -20;
      const element = document.getElementById("comparison-results");
      if (element) {
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 100);

    const longTermMonthly = parseFloat(data.longTermRental);
    const longTermAnnual = longTermMonthly * 12;

    const shortTermNightly = parseFloat(data.shortTermNightly);
    const occupancyRate = parseFloat(data.annualOccupancy) / 100;
    const managementFee = parseFloat(data.managementFee) / 100;

    const SEASONALITY_FACTORS = [
      2.11, 1.69, 1.27, 1.27, 0.76, 0.68, 0.68, 0.68, 0.76, 0.93, 1.27, 2.03,
    ];

    const shortTermAnnual = Array(12).fill(0).reduce((sum, _, month) => {
      const daysInMonth = new Date(2024, month + 1, 0).getDate();
      const seasonalMultiplier = SEASONALITY_FACTORS[month];
      return sum + (shortTermNightly * seasonalMultiplier * daysInMonth * occupancyRate);
    }, 0);
    const shortTermMonthly = shortTermAnnual / 12;

    const platformFeeRate = managementFee > 0 ? 0.15 : 0.03;
    const platformFeeAmount = shortTermAnnual * platformFeeRate;
    const shortTermAfterPlatformFee = shortTermAnnual * (1 - platformFeeRate);

    const managementFeeAmount = managementFee > 0 ? shortTermAfterPlatformFee * managementFee : 0;
    const shortTermAfterFees = shortTermAfterPlatformFee - managementFeeAmount;

    const platformFeeMultiplier = managementFee > 0 ? 0.85 : 0.97;
    const managementFeeMultiplier = 1 - managementFee;
    const netDailyRateNeeded =
      longTermAnnual / (365 * platformFeeMultiplier * managementFeeMultiplier);
    const breakEvenOccupancy = (netDailyRateNeeded / shortTermNightly) * 100;

    setComparisonData({
      title: data.title,
      longTermMonthly,
      shortTermMonthly,
      longTermAnnual,
      shortTermAnnual,
      shortTermAfterFees,
      breakEvenOccupancy: Math.round(breakEvenOccupancy * 10) / 10,
      shortTermNightly,
      managementFee,
      annualOccupancy: parseFloat(data.annualOccupancy),
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
    });

    // After successful save, set isSaved to true
    setIsSaved(true);

    console.log("Fetching revenue data for bedrooms:", data.bedrooms);
    fetch(`/api/revenue/${data.bedrooms}`)
      .then(res => res.json())
      .then(data => {
        console.log("Revenue API Response:", data);
        if (data.KPIsByBedroomCategory?.[data.bedrooms]) {
          const result = data.KPIsByBedroomCategory[data.bedrooms];
          setRevenueData({
            "25": {
              adr: result.ADR25PercentileAvg,
              occupancy: result.AvgAdjustedOccupancy,
              percentile: 25,
              revpar: result.RevPARAvg,
              revpam: result.RevPAMAvg,
              leadTime: result.BookingLeadTimeDays,
              stayLength: result.LengthOfStayDays,
              activeListings: result.ActiveListings,
              seasonalityIndex: result.MonthlySeasonalityIndex,
              demandScore: result.MonthlyDemandScore,
              ratePosition: result.RatePositionPercentile,
              revparPosition: result.RevPARPositionPercentile
            },
            "50": {
              adr: result.ADR50PercentileAvg,
              occupancy: result.AvgAdjustedOccupancy,
              percentile: 50,
              revpar: result.RevPARAvg,
              revpam: result.RevPAMAvg,
              leadTime: result.BookingLeadTimeDays,
              stayLength: result.LengthOfStayDays,
              activeListings: result.ActiveListings,
              seasonalityIndex: result.MonthlySeasonalityIndex,
              demandScore: result.MonthlyDemandScore,
              ratePosition: result.RatePositionPercentile,
              revparPosition: result.RevPARPositionPercentile
            },
            "75": {
              adr: result.ADR75PercentileAvg,
              occupancy: result.AvgAdjustedOccupancy,
              percentile: 75,
              revpar: result.RevPARAvg,
              revpam: result.RevPAMAvg,
              leadTime: result.BookingLeadTimeDays,
              stayLength: result.LengthOfStayDays,
              activeListings: result.ActiveListings,
              seasonalityIndex: result.MonthlySeasonalityIndex,
              demandScore: result.MonthlyDemandScore,
              ratePosition: result.RatePositionPercentile,
              revparPosition: result.RevPARPositionPercentile
            },
            "90": {
              adr: result.ADR90PercentileAvg,
              occupancy: result.AvgAdjustedOccupancy,
              percentile: 90,
              revpar: result.RevPARAvg,
              revpam: result.RevPAMAvg,
              leadTime: result.BookingLeadTimeDays,
              stayLength: result.LengthOfStayDays,
              activeListings: result.ActiveListings,
              seasonalityIndex: result.MonthlySeasonalityIndex,
              demandScore: result.MonthlyDemandScore,
              ratePosition: result.RatePositionPercentile,
              revparPosition: result.RevPARPositionPercentile
            },
          });
        }
      });
  };

  const handleExportPDF = async (withBranding: boolean = false) => {
    try {
      if (withBranding && !hasProAccess) {
        toast({
          title: "Pro Feature",
          description: "Branded reports are only available to Pro users. Upgrade to access this feature.",
          variant: "destructive",
        });
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let currentY = margin;

      // Add Proply branding if selected
      if (withBranding) {
        const logo = new Image();
        logo.src = "/proply-logo-auth.png";
        await new Promise((resolve) => {
          logo.onload = () => {
            const aspectRatio = logo.height / logo.width;
            const logoWidth = 40;
            const logoHeight = logoWidth * aspectRatio;
            doc.addImage(logo, "PNG", margin, currentY, logoWidth, logoHeight);
            currentY += logoHeight + 10;
            resolve(null);
          };
          logo.onerror = () => {
            console.error("Error loading Proply logo");
            resolve(null);
          };
        });
      }

      // Add title and date
      doc.setFontSize(20);
      doc.text("Property Comparison Report", margin, currentY);
      currentY += 15;

      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, currentY);
      currentY += 20;

      // Add property details
      if (comparisonData) {
        doc.setFontSize(14);
        doc.text("Property Details", margin, currentY);
        currentY += 10;

        doc.setFontSize(12);
        doc.text(`Address: ${address}`, margin, currentY);
        currentY += 8;
        doc.text(`Bedrooms: ${comparisonData.bedrooms}`, margin, currentY);
        currentY += 8;
        doc.text(`Bathrooms: ${comparisonData.bathrooms}`, margin, currentY);
        currentY += 20;

        // Add comparison results
        doc.setFontSize(14);
        doc.text("Comparison Results", margin, currentY);
        currentY += 10;

        const metrics = [
          ["Short Term Nightly Rate", formatter.format(comparisonData.shortTermNightly)],
          ["Annual Occupancy", `${comparisonData.annualOccupancy}%`],
          ["Short Term Monthly Average", formatter.format(comparisonData.shortTermMonthly)],
          ["Long Term Monthly", formatter.format(comparisonData.longTermMonthly)],
          ["Short Term Annual Revenue", formatter.format(comparisonData.shortTermAnnual)],
          ["Long Term Annual Revenue", formatter.format(comparisonData.longTermAnnual)],
          ["Break Even Occupancy", `${comparisonData.breakEvenOccupancy}%`],
        ];

        metrics.forEach(([label, value]) => {
          doc.setFontSize(12);
          doc.text(`${label}: ${value}`, margin, currentY);
          currentY += 8;
        });
      }

      // Add comparison chart
      const chartElement = document.querySelector("#comparison-results");
      if (chartElement) {
        currentY += 10;
        const canvas = await html2canvas(chartElement as HTMLElement);
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 20;
      }

      // Add footer with branding if selected
      doc.setFontSize(10);
      doc.setTextColor(100);
      const footerText = withBranding 
        ? `Generated by Proply - ${new Date().toLocaleDateString()}`
        : new Date().toLocaleDateString();
      doc.text(
        footerText,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      // Save the PDF
      doc.save("property-comparison-report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-[#262626] mb-6">
          Proply Rent Compare
        </h1>

        <div className="max-w-4xl space-y-6">
          <Card>
            <CardContent className="pt-6">
              <PropertyForm onSubmit={handleCompare} />
            </CardContent>
          </Card>

          {comparisonData && (
            <Card id="comparison-results">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium">Comparison Results</h2>
                  {isSaved && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export Report
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportPDF(false)}>
                          Export Report
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleExportPDF(true)}
                          className={!hasProAccess ? "text-muted-foreground" : ""}
                        >
                          Export with Branding
                          {!hasProAccess && " (Pro)"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <ComparisonChart data={comparisonData} address={address} />
                {revenueData && (
                  <div>
                    <h2 className="text-xl font-medium mb-4">Percentile Data</h2>
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                        <div>
                          <h4 className="font-medium mb-2">Market Stats</h4>
                          <p>RevPAR: {formatter.format(revenueData?.["50"].revpar || 0)}</p>
                          <p>RevPAM: {formatter.format(revenueData?.["50"].revpam || 0)}</p>
                          <p>Avg Lead Time: {revenueData?.["50"].leadTime || 0} days</p>
                          <p>Avg Length of Stay: {revenueData?.["50"].stayLength || 0} days</p>
                          <p>Active Listings: {revenueData?.["50"].activeListings || 0}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Market Position</h4>
                          <p>Rate Position: {revenueData?.["50"].ratePosition || 0}%</p>
                          <p>RevPAR Position: {revenueData?.["50"].revparPosition || 0}%</p>
                          <p>Seasonality Index: {revenueData?.["50"].seasonalityIndex || 0}</p>
                          <p>Demand Score: {revenueData?.["50"].demandScore || 0}</p>
                          <p>Occupancy: {revenueData?.["50"].occupancy.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}