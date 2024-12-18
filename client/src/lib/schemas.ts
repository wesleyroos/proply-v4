import { z } from "zod";

// Form schema
export const formSchema = z.object({
  // Step 1: Property Details
  address: z.string().min(1, "Address is required"),
  propertyUrl: z.string().url().optional().or(z.literal("")),
  purchasePrice: z.number().min(0, "Purchase price must be positive"),
  floorArea: z.number().min(0, "Floor area must be positive"),
  bedrooms: z.number().min(0.5, "Minimum 0.5 bedrooms required"),
  bathrooms: z.number().min(0, "Bathrooms cannot be negative"),
  parkingSpaces: z.number().min(0, "Parking spaces cannot be negative").optional(),
  
  // Step 2: Purchase Details
  depositType: z.enum(["amount", "percentage"]),
  depositAmount: z.number().min(0, "Deposit must be positive"),
  depositPercentage: z.number().min(0, "Deposit percentage must be positive").max(100, "Deposit percentage cannot exceed 100"),
  interestRate: z.number().min(0, "Interest rate must be positive").max(100, "Interest rate cannot exceed 100"),
  loanTerm: z.number().min(1, "Loan term must be at least 1 year"),
  
  // Step 3: Operating Costs
  monthlyLevies: z.number().min(0, "Monthly levies must be positive"),
  monthlyRatesTaxes: z.number().min(0, "Monthly rates and taxes must be positive"),
  otherMonthlyExpenses: z.number().min(0, "Other monthly expenses must be positive"),
  maintenancePercentage: z.number().min(0, "Maintenance percentage must be positive").max(100, "Maintenance percentage cannot exceed 100"),
  managementFee: z.number().min(0, "Management fee must be positive").max(100, "Management fee cannot exceed 100"),
  
  // Step 4: Revenue Performance
  airbnbNightlyRate: z.number().min(0, "Nightly rate must be positive").optional(),
  occupancyRate: z.number().min(0, "Occupancy rate must be positive").max(100, "Occupancy rate cannot exceed 100").optional(),
  longTermRental: z.number().min(0, "Long term rental must be positive").optional(),
  leaseCycleGap: z.number().min(0, "Lease cycle gap must be positive").optional(),
  
  // Step 5: Growth Projections
  annualIncomeGrowth: z.number().min(0, "Annual income growth must be positive").max(100, "Annual income growth cannot exceed 100"),
  annualExpenseGrowth: z.number().min(0, "Annual expense growth must be positive").max(100, "Annual expense growth cannot exceed 100"),
  annualPropertyAppreciation: z.number().min(0, "Annual property appreciation must be positive").max(100, "Annual property appreciation cannot exceed 100"),
  
  // Step 6: Miscellaneous
  cmaRatePerSqm: z.number().min(0, "CMA rate per m² must be positive"),
  comments: z.string().optional(),
});

export type PropertyAnalyzerFormValues = z.infer<typeof formSchema>;
