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
import autoTable from 'jspdf-autotable';
import PropertyForm from "../components/PropertyForm";
import ComparisonChart from "../components/ComparisonChart";
import { useUser } from "@/hooks/use-user";
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

      const startY = 20;
      let maxLogoHeight = 0;

      // Always add Proply logo in top right
      try {
        const proplyLogoWidth = 40;
        await new Promise<void>((resolve) => {
          const proplyLogo = new Image();
          proplyLogo.onload = () => {
            const aspectRatio = proplyLogo.height / proplyLogo.width;
            const proplyLogoHeight = proplyLogoWidth * aspectRatio;
            maxLogoHeight = Math.max(maxLogoHeight, proplyLogoHeight);
            doc.addImage(
              "/proply-logo-1.png",
              "PNG",
              doc.internal.pageSize.getWidth() - 60,
              startY,
              proplyLogoWidth,
              proplyLogoHeight,
            );
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(
              "Powered by Proply",
              doc.internal.pageSize.getWidth() - 60,
              startY + proplyLogoHeight + 5,
            );
            resolve();
          };
          proplyLogo.onerror = () => {
            console.error("Error loading Proply logo");
            resolve();
          };
          proplyLogo.src = "/proply-logo-1.png";
        });
      } catch (error) {
        console.error("Error adding Proply logo:", error);
      }

      // Add company logo if user has Pro access and a logo
      if (withBranding && user?.companyLogo) {
        try {
          const logoWidth = 40;
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const aspectRatio = img.height / img.width;
              const logoHeight = logoWidth * aspectRatio;
              maxLogoHeight = Math.max(maxLogoHeight, logoHeight);
              doc.addImage(
                user.companyLogo,
                "PNG",
                margin,
                startY,
                logoWidth,
                logoHeight,
              );
              resolve();
            };
            img.onerror = () => {
              console.error("Error loading company logo");
              resolve();
            };
            img.crossOrigin = "Anonymous";
            img.src = user.companyLogo;
          });
        } catch (error) {
          console.error("Error adding company logo:", error);
        }
      }

      let currentY = startY + maxLogoHeight + 10;
      currentY = Math.max(currentY, 50);

      // Title and description
      doc.setFontSize(20);
      doc.setTextColor(0);
      doc.text("Rent Compare Analysis", margin, currentY);
      currentY += 10;

      // Add description
      doc.setFontSize(10);
      doc.setTextColor(90);
      const contentWidth = pageWidth - 2 * margin;
      const descriptionText =
        "A comprehensive comparison of short-term and long-term rental strategies for your property, analyzing potential returns, occupancy requirements, and break-even points to help you make an informed investment decision.";
      const lines = doc.splitTextToSize(descriptionText, contentWidth);
      lines.forEach((line: string) => {
        doc.text(line, margin, currentY);
        currentY += 5;
      });
      currentY += 15;

      // Property Details section
      if (comparisonData) {
        doc.setFontSize(16);
        doc.text("Property Details", margin, currentY);
        currentY += 10;

        const propertyDetails = [
          ["Property Name", comparisonData.title],
          ["Address", address],
          ["Bedrooms", comparisonData.bedrooms],
          ["Bathrooms", comparisonData.bathrooms],
        ].filter(Boolean);

        autoTable(doc, {
          startY: currentY,
          head: [["Feature", "Value"]],
          body: propertyDetails,
          theme: "grid",
          styles: { fontSize: 10, halign: "center" },
          headStyles: { fillColor: [27, 163, 255], textColor: 255 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 20;

        // Short-Term Performance
        doc.setFontSize(16);
        doc.text("Short-Term Performance", margin, currentY);
        currentY += 10;

        const platformFee = comparisonData.managementFee > 0 ? 15 : 3;
        const shortTermDetails = [
          ["Annual Revenue", formatter.format(comparisonData.shortTermAnnual)],
          ["Monthly Average", formatter.format(comparisonData.shortTermMonthly)],
          ["Nightly Rate", formatter.format(comparisonData.shortTermNightly)],
          ["Platform Fee", `${platformFee}%`],
          ["Annual Occupancy", `${comparisonData.annualOccupancy}%`],
          ["Management Fee", `${comparisonData.managementFee}%`],
        ];

        autoTable(doc, {
          startY: currentY,
          head: [["Metric", "Value"]],
          body: shortTermDetails,
          theme: "grid",
          styles: { fontSize: 10, halign: "center" },
          headStyles: { fillColor: [27, 163, 255], textColor: 255 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 20;

        // Long-Term Performance
        doc.setFontSize(16);
        doc.text("Long-Term Performance", margin, currentY);
        currentY += 10;

        const longTermDetails = [
          ["Annual Revenue", formatter.format(comparisonData.longTermAnnual)],
          ["Monthly Revenue", formatter.format(comparisonData.longTermMonthly)],
        ];

        autoTable(doc, {
          startY: currentY,
          head: [["Metric", "Value"]],
          body: longTermDetails,
          theme: "grid",
          styles: { fontSize: 10, halign: "center" },
          headStyles: { fillColor: [27, 163, 255], textColor: 255 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 20;
      }


      // Add footer elements to all pages
      const totalPages = doc.getNumberOfPages();
      const footerMargin = 20;
      const footerPadding = 10;

      try {
        const logo = new Image();
        logo.src = "/proply-logo-1.png";

        await new Promise((resolve) => {
          logo.onload = () => {
            for (let i = 1; i <= totalPages; i++) {
              doc.setPage(i);

              if (withBranding) {
                // Add Proply logo to bottom left
                const logoHeight = 6;
                const aspectRatio = logo.width / logo.height;
                const logoWidth = logoHeight * aspectRatio;
                doc.addImage(
                  logo,
                  "PNG",
                  footerMargin,
                  pageHeight - footerPadding - logoHeight,
                  logoWidth,
                  logoHeight,
                );
              }

              // Add page numbers to bottom right
              doc.setFontSize(8);
              doc.setTextColor(100);
              doc.text(
                `Page ${i} of ${totalPages}`,
                pageWidth - margin,
                pageHeight - footerPadding,
                { align: "right" },
              );

              // Add copyright text to center if branding is enabled
              if (withBranding) {
                const currentYear = new Date().getFullYear();
                doc.text(
                  `© ${currentYear} Proply Tech (Pty) Ltd. All rights reserved.`,
                  pageWidth / 2,
                  pageHeight - footerPadding,
                  { align: "center" },
                );
              }
            }
            resolve(null);
          };
          logo.onerror = () => {
            console.error("Error loading logo in footer");
            resolve(null);
          };
        });
      } catch (error) {
        console.error("Error adding footer elements:", error);
        // If logo fails, still add page numbers
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth - margin,
            pageHeight - footerPadding,
            { align: "right" },
          );
          if (withBranding) {
            const currentYear = new Date().getFullYear();
            doc.text(
              `© ${currentYear} Proply Tech (Pty) Ltd. All rights reserved.`,
              pageWidth / 2,
              pageHeight - footerPadding,
              { align: "center" },
            );
          }
        }
      }

      // Add disclaimer page if branding is enabled
      if (withBranding) {
        doc.addPage();

        // Add disclaimer heading
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Important Disclaimers & Legal Notices", margin, 40);

        // Set disclaimer text style
        doc.setFontSize(7);
        doc.setTextColor(90);

        const currentYear = new Date().getFullYear();
        const disclaimerText = [
          "DISCLAIMER: The information contained in this report is provided by Proply Tech (Pty) Ltd for informational purposes only. While we make best efforts to ensure the accuracy and reliability of all data presented, including sourcing information from trusted third-party providers, we cannot guarantee its absolute accuracy or completeness.",
          "",
          "This report is intended to serve as a general guide and should not be considered as financial, investment, legal, or professional advice. Any decisions made based on this information are solely the responsibility of the user. Property investment carries inherent risks, and market conditions can change rapidly.",
          "",
          "Proply Tech (Pty) Ltd and its affiliates expressly disclaim any and all liability for any direct, indirect, incidental, or consequential damages arising from the use of this information. Actual results may vary significantly from the projections and estimates presented.",
          "",
          "By using this report, you acknowledge that the calculations and projections are indicative only and based on the information available at the time of generation. Factors beyond our control, including but not limited to market fluctuations, regulatory changes, and economic conditions, may impact actual outcomes.",
          "",
          `© ${currentYear} Proply Tech (Pty) Ltd. All rights reserved.`,
        ];

        let yPosition = 60;
        disclaimerText.forEach((text) => {
          if (text === "") {
            yPosition += 5;
            return;
          }
          const lines = doc.splitTextToSize(text, 170);
          lines.forEach((line: string) => {
            doc.text(line, margin, yPosition);
            yPosition += 5;
          });
        });
      }

      // Save the PDF
      doc.save(
        `Rent Compare Analysis - ${address.replace(/[^a-zA-Z0-9]/g, " ")}.pdf`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatter = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  });

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#262626]">
            Proply Rent Compare
          </h1>
        </div>

        <div className="max-w-4xl space-y-6">
          <Card>
            <CardContent className="pt-6">
              <PropertyForm onSubmit={handleCompare} />
            </CardContent>
          </Card>

          {comparisonData && (
            <Card id="comparison-results">
              <CardContent className="pt-6">
                <h2 className="text-xl font-medium mb-4">Comparison Results</h2>
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
                          <p>Occupancy: {revenueData?.["50"].occupancy?.toFixed(1)}%</p>
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