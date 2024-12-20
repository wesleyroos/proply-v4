import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

// Hooks
import { useProAccess } from "@/hooks/use-pro-access";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Types
interface RevenueData {
  adr: number;
  occupancy: number;
  percentile: number;
}

interface PropertyAnalyzerFormProps {
  onAnalysisComplete?: (data: PropertyAnalyzerFormValues) => Promise<void>;
}

interface PropertyAnalyzerFormData {
  address: string;
  propertyUrl: string;
  purchasePrice: number;
  floorArea: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  depositType: "percentage" | "amount";
  depositAmount: number;
  depositPercentage: number;
  interestRate: number;
  loanTerm: number;
  monthlyLevies: number;
  monthlyRatesTaxes: number;
  otherMonthlyExpenses: number;
  maintenancePercentage: number;
  managementFee: number;
  airbnbNightlyRate: number;
  occupancyRate: number;
  longTermRental: number;
  leaseCycleGap: number;
  annualIncomeGrowth: number;
  annualExpenseGrowth: number;
  annualPropertyAppreciation: number;
  cmaRatePerSqm: number;
  comments: string;
  propertyPhoto?: File | null;
}

// Form schema
const formSchema = z.object({
  // Step 1: Property Details
  address: z.string().min(1, "Address is required"),
  propertyUrl: z.string().url().optional().or(z.literal("")),
  purchasePrice: z.number().min(0, "Purchase price must be positive"),
  floorArea: z.number().min(0, "Floor area must be positive"),
  bedrooms: z.number().min(0.5, "Minimum 0.5 bedrooms required"),
  bathrooms: z.number().min(0, "Bathrooms cannot be negative"),
  parkingSpaces: z
    .number()
    .min(0, "Parking spaces cannot be negative")
    .optional(),
  propertyPhoto: z.instanceof(File).optional().nullable(),

  // Step 2: Financing Details
  depositType: z.enum(["amount", "percentage"]),
  depositAmount: z.number().min(0, "Deposit must be positive"),
  depositPercentage: z
    .number()
    .min(0, "Deposit percentage must be positive")
    .max(100, "Deposit percentage cannot exceed 100"),
  interestRate: z
    .number()
    .min(0, "Interest rate must be positive")
    .max(100, "Interest rate cannot exceed 100"),
  loanTerm: z.number().min(1, "Loan term must be at least 1 year"),

  // Step 3: Operating Expenses
  monthlyLevies: z.coerce.number().min(0, "Monthly levies must be positive").default(0),
  monthlyRatesTaxes: z.coerce
    .number()
    .min(0, "Monthly rates and taxes must be positive")
    .default(0),
  otherMonthlyExpenses: z.coerce
    .number()
    .min(0, "Other monthly expenses must be positive")
    .default(0),
  maintenancePercent: z.coerce
    .number()
    .min(0, "Maintenance percentage must be positive")
    .max(100, "Maintenance percentage cannot exceed 100")
    .default(0),
  managementFee: z.coerce
    .number()
    .min(0, "Management fee cannot be negative")
    .max(100, "Management fee cannot exceed 100")
    .default(0),

  // Step 4: Revenue Performance
  airbnbNightlyRate: z
    .number()
    .min(0, "Nightly rate must be positive")
    .optional(),
  occupancyRate: z
    .number()
    .min(0, "Occupancy rate must be positive")
    .max(100, "Occupancy rate cannot exceed 100")
    .optional(),
  longTermRental: z
    .number()
    .min(0, "Long term rental must be positive")
    .optional(),
  leaseCycleGap: z
    .number()
    .min(0, "Lease cycle gap must be positive")
    .optional(),

  // Step 5: Escalations
  annualIncomeGrowth: z
    .number()
    .min(0, "Annual income growth must be positive")
    .max(100, "Annual income growth cannot exceed 100"),
  annualExpenseGrowth: z
    .number()
    .min(0, "Annual expense growth must be positive")
    .max(100, "Annual expense growth cannot exceed 100"),
  annualPropertyAppreciation: z
    .number()
    .min(0, "Annual property appreciation must be positive")
    .max(100, "Annual property appreciation cannot exceed 100"),

  // Step 6: Miscellaneous
  cmaRatePerSqm: z.number().min(0, "Area rate per m² must be positive"),
  comments: z.string().optional(),
});

type PropertyAnalyzerFormValues = z.infer<typeof formSchema>;

const STEPS = [
  "Property Details",
  "Financing Details",
  "Operating Expenses",
  "Revenue Performance",
  "Escalations",
  "Miscellaneous",
];

interface RevenueData {
  adr: number;
  occupancy: number;
  percentile: number;
}

export default function PropertyAnalyzerForm(props: PropertyAnalyzerFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPercentileDialog, setShowPercentileDialog] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [demoClicks, setDemoClicks] = useState(0);
  const [revenueData, setRevenueData] = useState<{
    "25": RevenueData;
    "50": RevenueData;
    "75": RevenueData;
    "90": RevenueData;
  } | null>(null);
  const hasProAccess = useProAccess();
  const { toast } = useToast();

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const address = form.getValues("address");
      const bedrooms = form.getValues("bedrooms");

      if (!address || !bedrooms) {
        toast({
          title: "Missing Information",
          description:
            "Please enter the property address and number of bedrooms first.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `/api/revenue-data?address=${encodeURIComponent(address)}&bedrooms=${bedrooms}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch revenue data: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.KPIsByBedroomCategory?.[bedrooms]) {
        const result = data.KPIsByBedroomCategory[bedrooms];
        setRevenueData({
          "25": {
            adr: result.ADR25PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 25,
          },
          "50": {
            adr: result.ADR50PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 50,
          },
          "75": {
            adr: result.ADR75PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 75,
          },
          "90": {
            adr: result.ADR90PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 90,
          },
        });
        setShowPercentileDialog(true);
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch revenue data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyPercentileData = (percentile: "25" | "50" | "75" | "90") => {
    if (!revenueData) return;

    const data = revenueData[percentile];
    form.setValue("airbnbNightlyRate", data.adr);
    form.setValue("occupancyRate", data.occupancy);
    setShowPercentileDialog(false);
  };

  const form = useForm<PropertyAnalyzerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      propertyUrl: "",
      purchasePrice: undefined,
      floorArea: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      parkingSpaces: undefined,
      depositType: "percentage",
      depositAmount: undefined,
      depositPercentage: undefined,
      interestRate: undefined,
      loanTerm: undefined,
      monthlyLevies: undefined,
      monthlyRatesTaxes: undefined,
      otherMonthlyExpenses: undefined,
      maintenancePercent: undefined,
      managementFee: undefined,
      airbnbNightlyRate: undefined,
      occupancyRate: undefined,
      longTermRental: undefined,
      leaseCycleGap: undefined,
      annualIncomeGrowth: 6,
      annualExpenseGrowth: 4,
      annualPropertyAppreciation: 4,
      cmaRatePerSqm: undefined,
      comments: "",
    },
  });

  const onSubmit = async (data: PropertyAnalyzerFormValues) => {
    setIsSubmitting(true);
    try {
      // Clean and prepare the analysis data
      const analysisData = {
        address: data.address,
        propertyUrl: data.propertyUrl,
        purchasePrice: Number(data.purchasePrice),
        floorArea: Number(data.floorArea),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        parkingSpaces: Number(data.parkingSpaces),
        depositType: data.depositType,
        depositAmount: Number(data.depositAmount),
        depositPercentage: Number(data.depositPercentage),
        interestRate: Number(data.interestRate),
        loanTerm: Number(data.loanTerm),
        monthlyLevies: Number(data.monthlyLevies || 0),
        monthlyRatesTaxes: Number(data.monthlyRatesTaxes || 0),
        otherMonthlyExpenses: Number(data.otherMonthlyExpenses || 0),
        maintenancePercent: Number(data.maintenancePercent || 0),
        managementFee: Number(data.managementFee || 0),
        airbnbNightlyRate: Number(data.airbnbNightlyRate || 0),
        occupancyRate: Number(data.occupancyRate || 0),
        longTermRental: Number(data.longTermRental || 0),
        leaseCycleGap: Number(data.leaseCycleGap || 0),
        annualIncomeGrowth: Number(data.annualIncomeGrowth),
        annualExpenseGrowth: Number(data.annualExpenseGrowth),
        annualPropertyAppreciation: Number(data.annualPropertyAppreciation),
        cmaRatePerSqm: Number(data.cmaRatePerSqm),
        comments: data.comments,
      };

      console.log('Submitting analysis data:', analysisData);

      if (props.onAnalysisComplete) {
        await props.onAnalysisComplete(analysisData);
      }
      toast({
        title: "Success",
        description: "Property analysis completed successfully.",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: "Failed to analyze property data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    const fields = getFieldsForStep(currentStep);
    const isStepValid = fields.every(
      (field) => !form.getFieldState(field).error,
    );

    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    } else {
      // Trigger validation for the current step's fields
      fields.forEach((field) => form.trigger(field));
    }
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (
    step: number,
  ): (keyof PropertyAnalyzerFormValues)[] => {
    switch (step) {
      case 0:
        return [
          "address",
          "propertyUrl",
          "purchasePrice",
          "floorArea",
          "bedrooms",
          "bathrooms",
          "parkingSpaces",
        ];
      case 1:
        return [
          "depositType",
          "depositAmount",
          "depositPercentage",
          "interestRate",
          "loanTerm",
        ];
      case 2:
        return [
          "monthlyLevies",
          "monthlyRatesTaxes",
          "otherMonthlyExpenses",
          "maintenancePercent",
          "managementFee",
        ];
      case 3:
        return [
          "airbnbNightlyRate",
          "occupancyRate",
          "longTermRental",
          "leaseCycleGap",
        ];
      case 4:
        return [
          "annualIncomeGrowth",
          "annualExpenseGrowth",
          "annualPropertyAppreciation",
        ];
      case 5:
        return ["cmaRatePerSqm", "comments"];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Step indicator */}
      <div className="mb-12">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between w-full px-6">
            {STEPS.map((step, index) => {
              const fields = getFieldsForStep(index);
              const isStepComplete = fields.every((field) => {
                const value = form.getValues(field);
                const hasError = form.getFieldState(field).error;
                // Special handling for management fee where 0 is valid
                if (field === "managementFee") {
                  return !hasError && (value === 0 || value > 0);
                }
                return (
                  !hasError &&
                  value !== null &&
                  value !== undefined &&
                  value !== ""
                );
              });

              return (
                <li key={step} className="relative flex flex-col items-center">
                  {/* Connecting line */}
                  {index !== STEPS.length - 1 && (
                    <div
                      className={`absolute top-5 w-[calc(200%_-_2.5rem)] h-[2px] ${
                        index < currentStep || isStepComplete
                          ? "bg-[#3B82F6]"
                          : "bg-gray-300"
                      }`}
                      style={{ left: "4rem" }}
                    />
                  )}

                  <div className="relative flex flex-col items-center">
                    {/* Checkmark for completed steps */}
                    {isStepComplete && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-white rounded-full p-1">
                          <svg
                            className="w-4 h-4 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Step button */}
                    <button
                      type="button"
                      onClick={() => setCurrentStep(index)}
                      className="relative z-10 flex flex-col items-center"
                    >
                      <span
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold ring-2 ring-offset-2 ${
                          index === currentStep
                            ? "bg-[#3B82F6] text-white ring-[#3B82F6]"
                            : isStepComplete
                              ? "bg-white text-green-500 ring-green-500"
                              : "bg-white text-gray-500 ring-gray-300"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="mt-2 text-sm font-medium text-gray-900">
                        {step}
                      </span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6">
            {/* Step 1: Property Details */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter the full property address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="propertyUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter URL of the property listing (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price (R)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter purchase price"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="floorArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor Area (m²)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter floor area in m²"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            placeholder="0.5 for studio"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parkingSpaces"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parking Spaces</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="propertyPhoto"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Property Photo (Optional)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onChange(file);
                              }
                            }}
                            {...field}
                          />
                          {value && (
                            <div className="mt-2">
                              <img
                                src={URL.createObjectURL(value)}
                                alt="Property Preview"
                                className="max-w-xs rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Financing Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="depositType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="amount" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Amount (R)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="percentage" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Percentage (%)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="depositAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>R</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="250000,00"
                              {...field}
                              onChange={(e) => {
                                const amount = e.target.valueAsNumber;
                                field.onChange(amount);
                                // Calculate percentage based on amount
                                const purchasePrice =
                                  form.getValues("purchasePrice");
                                if (purchasePrice && amount) {
                                  const percentage =
                                    (amount / purchasePrice) * 100;
                                  form.setValue(
                                    "depositPercentage",
                                    Number(percentage.toFixed(2)),
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-center px-4">
                    <span className="text-sm font-medium text-gray-600">
                      OR
                    </span>
                  </div>

                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="depositPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>%</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="10"
                              {...field}
                              onChange={(e) => {
                                const percentage = e.target.valueAsNumber;
                                field.onChange(percentage);
                                // Calculate amount based on percentage
                                const purchasePrice =
                                  form.getValues("purchasePrice");
                                if (purchasePrice && percentage) {
                                  const amount =
                                    (percentage / 100) * purchasePrice;
                                  form.setValue(
                                    "depositAmount",
                                    Number(amount.toFixed(0)),
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loanTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Term (Years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Operating Expenses */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="monthlyLevies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Levies (R)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyRatesTaxes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rates & Taxes (R)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherMonthlyExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Monthly Expenses</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="WiFi, electricity, subscriptions, etc."
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maintenancePercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maintenance (% of Revenue)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="5-10% based on rental type"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="managementFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Management Fee (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="0% if self-managed"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Revenue Performance */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="airbnbNightlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Term Nightly Rate</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="occupancyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Occupancy (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Market Data</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10"
                            onClick={() => {
                              if (hasProAccess) {
                                fetchRevenueData();
                              } else {
                                setShowUpgradeModal(true);
                              }
                            }}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Getting Data...
                              </>
                            ) : (
                              <>
                                Get Revenue Data
                                <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  PRO
                                </span>
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Get accurate rates from Airbnb listings in your area
                          </p>
                        </div>
                      </FormControl>
                    </FormItem>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="longTermRental"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Long Term Rental (Monthly)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Monthly long-term rental income"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="leaseCycleGap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lease Cycle Gap (Days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Average days between lease cycles"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 5: Escalations */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="annualIncomeGrowth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Income Growth (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annualExpenseGrowth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Expense Growth (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annualPropertyAppreciation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Property Appreciation (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 6: Miscellaneous */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="cmaRatePerSqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area Rate per m²</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Average rate per m² for similar properties"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any description or comments about the property"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit
              </Button>
            ) : (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            )}
          </div>
        </form>
      </Form>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Pro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">
                  Accurate Revenue Data
                </h4>
                <p className="text-sm text-blue-700">
                  Get real-time nightly rates and occupancy data from actual
                  Airbnb listings in your area
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">With Pro, you get:</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Accurate nightly rates based on local market data
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Real occupancy rates from similar properties
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Seasonal pricing trends and recommendations
                </li>
              </ul>
            </div>

            <Button
              onClick={() => setShowUpgradeModal(false)}
              className="w-full"
            >
              Upgrade Now
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
              className="w-full"
            >
              Continue with Manual Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Percentile Selection Modal */}
      <Dialog
        open={showPercentileDialog}
        onOpenChange={setShowPercentileDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revenue Performance Data</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Select an ADR percentile to use for the analysis:
            </p>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-4">Percentile</th>
                  <th className="text-right py-2 px-4">ADR</th>
                  <th className="text-right py-2 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {revenueData &&
                  Object.entries(revenueData).map(([percentile, data]) => (
                    <tr key={percentile} className="border-b">
                      <td className="py-2 px-4">{percentile}th Percentile</td>
                      <td className="text-right py-2 px-4">
                        {new Intl.NumberFormat("en-ZA", {
                          style: "currency",
                          currency: "ZAR",
                        }).format(data.adr)}
                      </td>
                      <td className="text-right py-2 px-4">
                        <Button
                          onClick={() =>
                            applyPercentileData(
                              percentile as "25" | "50" | "75" | "90",
                            )
                          }
                          variant="secondary"
                          size="sm"
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="mt-4 text-sm text-gray-500">
              <p>Occupancy: {revenueData?.["50"].occupancy.toFixed(1)}%</p>
              <p className="mt-1">
                Number of Listings: {revenueData?.["50"].occupancy}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden demo data button */}
      <button
        type="button"
        onClick={() => {
          setDemoClicks((prev) => {
            if (prev === 2) {
              form.reset({
                address: "27 Leeuwen St, Cape Town City Centre, 8001",
                propertyUrl:
                  "https://property24.com/apartments-for-sale/cape-town-city-centre/western-cape/7925/3142089",
                purchasePrice: 3500000,
                floorArea: 85,
                bedrooms: 2,
                bathrooms: 2,
                parkingSpaces: 1,
                depositType: "percentage",
                depositAmount: 350000,
                depositPercentage: 10,
                interestRate: 11.75,
                loanTerm: 20,
                monthlyLevies: 2500,
                monthlyRatesTaxes: 1800,
                otherMonthlyExpenses: 2000,
                maintenancePercent: 10,
                managementFee: 20,
                airbnbNightlyRate: 2500,
                occupancyRate: 65,
                longTermRental: 25000,
                leaseCycleGap: 7,
                annualIncomeGrowth: 8,
                annualExpenseGrowth: 6,
                annualPropertyAppreciation: 6,
                cmaRatePerSqm: 45000,
                comments:
                  "Prime location in Cape Town CBD. Close to amenities and tourist attractions. High potential for both short-term and long-term rentals.",
              });
              return 0;
            }
            return prev + 1;
          });
        }}
        className="fixed bottom-4 right-4 w-4 h-4 opacity-5 hover:opacity-10 bg-gray-500 rounded-full"
        aria-hidden="true"
      />
    </div>
  );
}
