import { z } from "zod";

export const riskIndexSchema = z.object({
  address: z.string().min(1, "Address is required"),
  propertyType: z.string().min(1, "Property type is required"),
  propertySize: z.string().min(1, "Property size is required"),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  parking: z.string().optional(),
  propertyCondition: z.string().min(1, "Property condition is required"),
  purchasePrice: z.string().min(1, "Purchase price is required"),
});

export type RiskIndexFormData = z.infer<typeof riskIndexSchema>;

export interface RiskFactor {
  name: string;
  score: number;
  description: string;
  impact: "low" | "medium" | "high";
  trend: "improving" | "stable" | "worsening";
}

export interface RiskCategory {
  name: string;
  score: number;
  description: string;
  factors: RiskFactor[];
}

export interface RiskIndexReport {
  // Property Details
  address: string;
  propertyValue: number;
  propertySize: number;
  bedrooms: string;
  bathrooms: string;
  parking: string;
  propertyCondition: string;
  propertyType: string;
  
  // Risk Assessment
  overallRiskScore: number;
  riskRating: string;
  riskColor: string;
  riskCategories: RiskCategory[];
  
  // Financial Risk
  pricePerSqM: number;
  estimatedMarketValue: number;
  valuationDeviation: number;
  
  // Market Risk
  marketVolatility: number;
  demandTrend: "increasing" | "stable" | "decreasing";
  supplyTrend: "increasing" | "stable" | "decreasing";
  
  // Recommendations
  riskMitigationStrategies: string[];
  investmentRecommendation: string;
  
  // Report Metadata
  reportDate: string;
}