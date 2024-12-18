import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Form schema
const formSchema = z.object({
  // Step 1: Property Details
  address: z.string().min(1, "Address is required"),
  propertyUrl: z.string().url().optional().or(z.literal("")),
  purchasePrice: z.number().min(0, "Purchase price must be positive"),
  floorArea: z.number().min(0, "Floor area must be positive"),
  bedrooms: z.number().min(0.5, "Minimum 0.5 bedrooms required"),
  bathrooms: z.number().min(0, "Bathrooms cannot be negative"),
  parkingSpaces: z.number().min(0, "Parking spaces cannot be negative").optional(),
  
  // Step 2: Financing Details
  depositType: z.enum(["amount", "percentage"]),
  depositAmount: z.number().min(0, "Deposit must be positive"),
  depositPercentage: z.number().min(0, "Deposit percentage must be positive").max(100, "Deposit percentage cannot exceed 100"),
  interestRate: z.number().min(0, "Interest rate must be positive").max(100, "Interest rate cannot exceed 100"),
  loanTerm: z.number().min(1, "Loan term must be at least 1 year"),
  
  // Step 3: Operating Expenses
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
  
  // Step 5: Escalations
  annualIncomeGrowth: z.number().min(0, "Annual income growth must be positive").max(100, "Annual income growth cannot exceed 100"),
  annualExpenseGrowth: z.number().min(0, "Annual expense growth must be positive").max(100, "Annual expense growth cannot exceed 100"),
  annualPropertyAppreciation: z.number().min(0, "Annual property appreciation must be positive").max(100, "Annual property appreciation cannot exceed 100"),
  
  // Step 6: Miscellaneous
  cmaRatePerSqm: z.number().min(0, "CMA rate per m² must be positive"),
  comments: z.string().optional(),
});

type PropertyAnalyzerFormValues = z.infer<typeof formSchema>;

const STEPS = [
  "Property Details",
  "Financing Details",
  "Operating Expenses",
  "Revenue Performance",
  "Escalations",
  "Miscellaneous"
];

export default function PropertyAnalyzerForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PropertyAnalyzerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      propertyUrl: "",
      purchasePrice: 0,
      floorArea: 0,
      bedrooms: 0,
      bathrooms: 0,
      parkingSpaces: 0,
      depositType: "percentage",
      depositAmount: 0,
      depositPercentage: 0,
      interestRate: 0,
      loanTerm: 20,
      monthlyLevies: 0,
      monthlyRatesTaxes: 0,
      otherMonthlyExpenses: 0,
      maintenancePercentage: 5,
      managementFee: 0,
      airbnbNightlyRate: 0,
      occupancyRate: 0,
      longTermRental: 0,
      leaseCycleGap: 0,
      annualIncomeGrowth: 0,
      annualExpenseGrowth: 0,
      annualPropertyAppreciation: 0,
      cmaRatePerSqm: 0,
      comments: "",
    },
  });

  const onSubmit = async (data: PropertyAnalyzerFormValues) => {
    setIsSubmitting(true);
    try {
      // TODO: Handle form submission
      console.log(data);
      toast({
        title: "Success",
        description: "Property analysis has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save property analysis.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    const fields = getFieldsForStep(currentStep);
    const isStepValid = fields.every(field => !form.getFieldState(field).error);
    
    if (isStepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    } else {
      // Trigger validation for the current step's fields
      fields.forEach(field => form.trigger(field));
    }
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (step: number): (keyof PropertyAnalyzerFormValues)[] => {
    switch (step) {
      case 0:
        return ['address', 'propertyUrl', 'purchasePrice', 'floorArea', 'bedrooms', 'bathrooms', 'parkingSpaces'];
      case 1:
        return ['depositType', 'depositAmount', 'depositPercentage', 'interestRate', 'loanTerm'];
      case 2:
        return ['monthlyLevies', 'monthlyRatesTaxes', 'otherMonthlyExpenses', 'maintenancePercentage', 'managementFee'];
      case 3:
        return ['airbnbNightlyRate', 'occupancyRate', 'longTermRental', 'leaseCycleGap'];
      case 4:
        return ['annualIncomeGrowth', 'annualExpenseGrowth', 'annualPropertyAppreciation'];
      case 5:
        return ['cmaRatePerSqm', 'comments'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Step indicator */}
      <div className="mb-12">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between w-full px-6">
            {STEPS.map((step, index) => {
              const fields = getFieldsForStep(index);
              const isStepComplete = fields.every(
                field => !form.getFieldState(field).error && form.getValues(field)
              );
              
              return (
                <li key={step} className="relative flex flex-col items-center">
                  {/* Connecting line */}
                  {index !== STEPS.length - 1 && (
                    <div
                      className={`absolute top-5 w-[calc(200%_-_2.5rem)] h-[2px] ${
                        index < currentStep || isStepComplete ? "bg-[#3B82F6]" : "bg-gray-300"
                      }`}
                      style={{ left: '4rem' }}
                    />
                  )}
                  
                  <div className="relative flex flex-col items-center">
                    {/* Checkmark for completed steps */}
                    {isStepComplete && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-white rounded-full p-1">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                      <span className="mt-2 text-sm font-medium text-gray-900">{step}</span>
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
                        <Input placeholder="Enter the full property address" {...field} />
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
                        <Input placeholder="Enter URL of the property listing (optional)" {...field} />
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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

                {form.watch("depositType") === "amount" ? (
                  <FormField
                    control={form.control}
                    name="depositAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Amount (R)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="depositPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Percentage (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                      <FormLabel>Monthly Levies</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                      <FormLabel>Monthly Rates & Taxes</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maintenancePercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maintenance (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="5-10% based on rental type"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="airbnbNightlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Airbnb Nightly Rate</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            placeholder="Average annualised nightly rate"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                        <FormLabel>Occupancy Rate (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Average annualised occupancy rate"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement revenue data fetching
                  }}
                >
                  Get Revenue Data
                </Button>

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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                      <FormLabel>CMA Rate per m²</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="Average rate per m² for similar properties"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
    </div>
  );
}
