import React, { useState } from "react";
import { PDFGenerator } from "./components/PDFGenerator";
import { generatePDF } from "../services/PDFService";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Comprehensive type definitions
export interface PropertyDetails {
  address: string;
  propertyPhoto?: string;
  mapImage?: string;
  bedrooms: number;
  bathrooms: number;
  floorArea: number;
  parkingSpaces: number;
  purchasePrice: number;
  propertyRatePerSquareMeter: number;
  areaRatePerSquareMeter: number;
  rateDifference: number;
  propertyDescription?: string;
}

export interface FinancialMetrics {
  depositAmount: number;
  depositPercentage: number;
  interestRate: number;
  loanTerm: number;
  monthlyBondRepayment: number;
  bondRegistration: number;
  transferCosts: number;
  totalCapitalRequired: number;
}

export interface OperatingExpenses {
  monthlyLevies: number;
  monthlyRatesTaxes: number;
  otherMonthlyExpenses: number;
  maintenancePercent: number;
  managementFee: number;
}

export interface RentalPerformance {
  shortTermNightlyRate: number;
  annualOccupancy: number;
  shortTermAnnualRevenue: number;
  longTermAnnualRevenue: number;
  shortTermGrossYield: number;
  longTermGrossYield: number;
  platformFees: number;
}

export interface InvestmentMetrics {
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

export interface CashflowAnalysis {
  annualCashflow: number;
  cumulativeRentalIncome: number;
  netWorthChange: number;
  revenueProjections: {
    shortTerm: {
      [key: string]: number;
    };
    longTerm: {
      [key: string]: number;
    };
  };
}

export interface RateComparisons {
  propertyRatePerSquareMeter: number;
  areaAverageRate: number;
  rateDifference: number;
}

export interface PropertyData {
  propertyDetails: PropertyDetails;
  financialMetrics: FinancialMetrics;
  operatingExpenses: OperatingExpenses;
  rentalPerformance: RentalPerformance;
  investmentMetrics: InvestmentMetrics;
  cashflowAnalysis: CashflowAnalysis;
  rateComparisons: RateComparisons;
  analysis: {
    shortTermAnnualRevenue: number;
    longTermAnnualRevenue: number;
    purchasePrice: number;
    revenueProjections: {
      shortTerm: {
        [key: string]: number;
      };
    };
    operatingExpenses: {
      [key: string]: number;
    };
    netOperatingIncome: {
      [key: string]: {
        value: number;
        annualCashflow: number;
        cumulativeRentalIncome: number;
        netWorthChange: number;
      };
    };
    longTermNetOperatingIncome: {
      [key: string]: {
        value: number;
        annualCashflow: number;
        cumulativeRentalIncome: number;
        netWorthChange: number;
      };
    };
    investmentMetrics: {
      shortTerm: Array<{
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
      }>;
      longTerm: Array<{
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
      }>;
    };
  };
}

export interface ReportSelections {
  propertyDetails?: {
    address?: boolean;
    propertyPhoto?: boolean;
    mapImage?: boolean;
    bedrooms?: boolean;
    bathrooms?: boolean;
    floorArea?: boolean;
    parkingSpaces?: boolean;
    purchasePrice?: boolean;
    propertyRatePerSquareMeter?: boolean;
    areaRatePerSquareMeter?: boolean;
    rateDifference?: boolean;
    propertyDescription?: boolean;
  };
  financialMetrics?: {
    depositAmount?: boolean;
    depositPercentage?: boolean;
    interestRate?: boolean;
    loanTerm?: boolean;
    monthlyBondRepayment?: boolean;
    bondRegistration?: boolean;
    transferCosts?: boolean;
    totalCapitalRequired?: boolean;
  };
  operatingExpenses?: {
    monthlyLevies?: boolean;
    monthlyRatesTaxes?: boolean;
    otherMonthlyExpenses?: boolean;
    maintenancePercent?: boolean;
    managementFee?: boolean;
  };
  rentalPerformance?: {
    shortTermNightlyRate?: boolean;
    annualOccupancy?: boolean;
    shortTermAnnualRevenue?: boolean;
    longTermAnnualRevenue?: boolean;
    shortTermGrossYield?: boolean;
    longTermGrossYield?: boolean;
    platformFees?: boolean;
  };
  investmentMetrics?: {
    grossYield?: boolean;
    netYield?: boolean;
    returnOnEquity?: boolean;
    annualReturn?: boolean;
    capRate?: boolean;
    cashOnCashReturn?: boolean;
    roiWithoutAppreciation?: boolean;
    roiWithAppreciation?: boolean;
    irr?: boolean;
    netWorthChange?: boolean;
  };
  cashflowAnalysis?: {
    annualCashflow?: boolean;
    cumulativeRentalIncome?: boolean;
    netWorthChange?: boolean;
    revenueProjections?: boolean;
  };
  rateComparisons?: {
    propertyRatePerSquareMeter?: boolean;
    areaAverageRate?: boolean;
    rateDifference?: boolean;
  };
}

interface PropertyAnalyzerPDFProps {
  data: PropertyData;
  companyLogo?: string;
  onClose: () => void;
}

export function PropertyAnalyzerPDF({
  data,
  companyLogo,
  onClose,
}: PropertyAnalyzerPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const validateData = (data: PropertyData): boolean => {
    const requiredFields = [
      "propertyDetails",
      "financialMetrics",
      "operatingExpenses",
      "rentalPerformance",
      "investmentMetrics",
      "analysis",
    ];

    return requiredFields.every((field) => !!data[field as keyof PropertyData]);
  };

  const validateSelections = (selections: ReportSelections): boolean => {
    return Object.values(selections).some(
      (section) => section && Object.values(section).some((value) => value),
    );
  };

  const handleGeneratePDF = async (selections: ReportSelections) => {
    setIsGenerating(true);

    try {
      // Validate data and selections
      if (!validateData(data)) {
        throw new Error("Missing required property data for PDF generation");
      }

      if (!validateSelections(selections)) {
        throw new Error(
          "Please select at least one section to include in the report",
        );
      }

      // Generate PDF
      await generatePDF(data, selections, companyLogo);

      toast({
        title: "Success",
        description: "PDF report generated successfully",
        duration: 3000,
      });

      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);

      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF report",
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleError = (error: unknown) => {
    console.error("PDF Generation Error:", error);

    toast({
      variant: "destructive",
      title: "Error",
      description:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while generating the PDF",
      duration: 5000,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generate Property Analysis Report</DialogTitle>
          <DialogDescription>
            Select the sections you want to include in your report. Choose from
            our templates or customize your selection.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <PDFGenerator
            data={data}
            companyLogo={companyLogo}
            onGeneratePDF={handleGeneratePDF}
            isGenerating={isGenerating}
            onError={handleError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
