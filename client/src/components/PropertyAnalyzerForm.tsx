import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProAccess } from "@/hooks/use-pro-access";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { formSchema, type PropertyAnalyzerFormValues } from "@/lib/schemas";

const STEPS = [
  "Property Details",
  "Purchase Details",
  "Operating Costs",
  "Revenue Performance",
  "Growth Projections",
  "Miscellaneous"
];

interface RevenueData {
  adr: number;
  occupancy: number;
  percentile: number;
}

export default function PropertyAnalyzerForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPercentileDialog, setShowPercentileDialog] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [demoClicks, setDemoClicks] = useState(0);
  const [revenueData, setRevenueData] = useState<{
    '25': RevenueData;
    '50': RevenueData;
    '75': RevenueData;
    '90': RevenueData;
  } | null>(null);
  const hasProAccess = useProAccess();
  const { toast } = useToast();

  const form = useForm<PropertyAnalyzerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      depositType: "amount",
    },
  });

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const address = form.getValues("address");
      const bedrooms = form.getValues("bedrooms");
      
      if (!address || !bedrooms) {
        toast({
          title: "Missing Information",
          description: "Please enter the property address and number of bedrooms first.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/revenue-data?address=${encodeURIComponent(address)}&bedrooms=${bedrooms}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch revenue data: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.KPIsByBedroomCategory?.[bedrooms]) {
        const result = data.KPIsByBedroomCategory[bedrooms];
        setRevenueData({
          '25': {
            adr: result.ADR25PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 25
          },
          '50': {
            adr: result.ADR50PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 50
          },
          '75': {
            adr: result.ADR75PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 75
          },
          '90': {
            adr: result.ADR90PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 90
          }
        });
        setShowPercentileDialog(true);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch revenue data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyPercentileData = (percentile: '25' | '50' | '75' | '90') => {
    if (!revenueData) return;
    
    const data = revenueData[percentile];
    form.setValue("airbnbNightlyRate", data.adr);
    form.setValue("occupancyRate", data.occupancy);
    setShowPercentileDialog(false);
  };

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data: PropertyAnalyzerFormValues) => {
    setIsSubmitting(true);
    try {
      // Handle form submission
      console.log(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step Progress */}
          <div className="mb-8">
            <div className="flex justify-between">
              {STEPS.map((step, index) => (
                <span
                  key={step}
                  className={`text-sm ${
                    index === currentStep
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
              ))}
            </div>
            <div className="relative mt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-1 bg-border rounded" />
              </div>
              <div
                className="relative flex justify-between"
                style={{
                  width: `${((currentStep + 1) / STEPS.length) * 100}%`,
                }}
              >
                {STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index <= currentStep ? "bg-primary" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

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

            {/* Step 2: Purchase Details */}
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
                                const purchasePrice = form.getValues("purchasePrice");
                                if (purchasePrice && amount) {
                                  const percentage = (amount / purchasePrice) * 100;
                                  form.setValue("depositPercentage", Number(percentage.toFixed(2)));
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
                    <span className="text-sm font-medium text-gray-600">OR</span>
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
                                const purchasePrice = form.getValues("purchasePrice");
                                if (purchasePrice && percentage) {
                                  const amount = (percentage / 100) * purchasePrice;
                                  form.setValue("depositAmount", Number(amount.toFixed(0)));
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

            {/* Step 3: Operating Costs */}
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
                <div className="grid grid-cols-7 gap-4">
                  <div className="col-span-2">
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
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
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
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3">
                    <FormItem>
                      <FormLabel>Market Data</FormLabel>
                      <FormControl>
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-[40px]"
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
                                <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">PRO</span>
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
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

            {/* Step 5: Growth Projections */}
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
                          placeholder="Enter annual growth rate"
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

      {/* Percentile Selection Modal */}
      <Dialog open={showPercentileDialog} onOpenChange={setShowPercentileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Performance Level</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Choose a performance level to populate the revenue fields with market data:
            </p>
            <div className="grid grid-cols-2 gap-4">
              {revenueData && Object.entries(revenueData).map(([percentile, data]) => (
                <Button
                  key={percentile}
                  variant="outline"
                  onClick={() => applyPercentileData(percentile as '25' | '50' | '75' | '90')}
                  className="p-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">
                      {percentile}th Percentile
                    </div>
                    <div className="text-sm text-muted-foreground">
                      R{data.adr.toFixed(2)}/night
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {data.occupancy.toFixed(1)}% occupancy
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden demo data button */}
      <button
        type="button"
        onClick={() => {
          setDemoClicks(prev => {
            if (prev === 2) {
              form.reset({
                address: "27 Leeuwen St, Cape Town City Centre, 8001",
                propertyUrl: "https://property24.com/apartments-for-sale/cape-town-city-centre/western-cape/7925/3142089",
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
                otherMonthlyExpenses: 500,
                maintenancePercentage: 8,
                managementFee: 15,
                airbnbNightlyRate: 2500,
                occupancyRate: 65,
                longTermRental: 25000,
                leaseCycleGap: 7,
                annualIncomeGrowth: 8,
                annualExpenseGrowth: 6,
                annualPropertyAppreciation: 12,
                cmaRatePerSqm: 45000,
                comments: "Prime location in Cape Town CBD. Close to amenities and tourist attractions. High potential for both short-term and long-term rentals."
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