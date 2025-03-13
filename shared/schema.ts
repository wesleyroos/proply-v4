
import { z } from "zod";

// Schema for deal calculation input
export const dealCalculationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  price: z.number().min(1, "Price is required"),
  propertyType: z.enum(["house", "apartment", "townhouse", "land"]),
  bedrooms: z.enum(["1", "2", "3", "4", "5+"]),
});

// Types derived from the schemas
export type DealCalculation = z.infer<typeof dealCalculationSchema>;

// Result type for the deal score calculation
export type DealScoreResult = {
  score: number;
  rating: string;
  color: string;
  percentageDifference: number;
  askingPrice: number;
  estimatedValue: number;
};
