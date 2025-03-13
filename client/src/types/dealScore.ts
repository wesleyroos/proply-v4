import { z } from "zod";

export const dealCalculationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  price: z.number().min(1, "Price must be greater than 0"),
  propertyType: z.enum(["house", "apartment", "townhouse", "land"]),
  bedrooms: z.enum(["1", "2", "3", "4", "5+"]),
});

export type DealCalculation = z.infer<typeof dealCalculationSchema>;

export interface DealScoreResult {
  score: number;
  rating: string;
  color: string;
  percentageDifference: number;
  askingPrice: number;
  estimatedValue: number;
}
