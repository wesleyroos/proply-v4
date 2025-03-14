"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, AlertCircle, CreditCard, Wallet } from "lucide-react";
import { dealCalculationSchema, type DealCalculation, type DealScoreResult } from "@/types/dealScore";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const calculateDealScore = (
  priceDiff: number,
  propertyCondition: string,
  propertyRate: number,
  areaRate: number,
  rentalYield: number | null
): { score: number; rating: string; color: string } => {
  // Base score starts at 50
  let score = 50;

  // Price difference impact (-20 to +20 points)
  // Negative price diff means property is below market value (good)
  score -= priceDiff * 0.5; // Each percent difference affects score by 0.5 points

  // Property condition impact (-10 to +10 points)
  switch (propertyCondition) {
    case "excellent":
      score += 10;
      break;
    case "good":
      score += 5;
      break;
    case "fair":
      score -= 5;
      break;
    case "poor":
      score -= 10;
      break;
  }

  // Area rate comparison impact (-10 to +10 points)
  const rateDiff = ((propertyRate - areaRate) / areaRate) * 100;
  score -= rateDiff * 0.2; // Each percent difference affects score by 0.2 points

  // Rental yield impact (0 to +10 points)
  if (rentalYield !== null) {
    // Good rental yield is considered 8% or above
    if (rentalYield >= 8) {
      score += 10;
    } else if (rentalYield >= 6) {
      score += 5;
    }
  }

  // Ensure score stays within 0-100 range
  score = Math.max(0, Math.min(100, score));

  // Determine rating and color based on score
  let rating: string;
  let color: string;

  if (score >= 90) {
    rating = "Excellent Deal";
    color = "bg-emerald-500";
  } else if (score >= 75) {
    rating = "Great Deal";
    color = "bg-green-500";
  } else if (score >= 60) {
    rating = "Good Deal";
    color = "bg-blue-500";
  } else if (score >= 40) {
    rating = "Fair Deal";
    color = "bg-yellow-500";
  } else if (score >= 25) {
    rating = "Poor Deal";
    color = "bg-orange-500";
  } else {
    rating = "Bad Deal";
    color = "bg-red-500";
  }

  return {
    score: Math.round(score),
    rating,
    color,
  };
};

export default function DealScorePublicPage() {
  const [result, setResult] = useState<DealScoreResult | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [processingPayment, setProcessingPayment] = useState(false);

  const form = useForm<DealCalculation>({
    resolver: zodResolver(dealCalculationSchema),
    defaultValues: {
      address: "",
      price: undefined,
      propertyType: undefined,
      bedrooms: undefined,
      propertyCondition: undefined,
      floorArea: undefined,
      areaRate: undefined,
      monthlyRental: undefined,
      occupancyRate: undefined,
      nightlyRate: undefined,
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: DealCalculation) => {
      // Calculate property rate and area rate difference
      const propertyRate = data.price / data.floorArea;
      const priceDiff = ((propertyRate - data.areaRate) / data.areaRate) * 100;

      // Calculate rental yield if rental data is provided
      let rentalYield = null;
      if (data.monthlyRental) {
        rentalYield = (data.monthlyRental * 12 / data.price) * 100;
      } else if (data.nightlyRate && data.occupancyRate) {
        const annualRevenue = data.nightlyRate * 365 * (data.occupancyRate / 100);
        rentalYield = (annualRevenue / data.price) * 100;
      }

      // Calculate deal score
      const { score, rating, color } = calculateDealScore(
        priceDiff,
        data.propertyCondition,
        propertyRate,
        data.areaRate,
        rentalYield
      );

      // Calculate estimated market value
      const estimatedValue = data.areaRate * data.floorArea;

      return {
        score,
        rating,
        color,
        percentageDifference: ((estimatedValue - data.price) / data.price) * 100,
        askingPrice: data.price,
        estimatedValue
      };
    },
    onSuccess: (data: DealScoreResult) => {
      setResult(data);
    },
  });

  const handlePayment = () => {
    setProcessingPayment(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessingPayment(false);
      setShowPaymentModal(false);
      // Here you would normally redirect to the report or show a success message
      alert("Payment successful! Redirecting to full report...");
    }, 2000);
  };

  const onSubmit = (data: DealCalculation) => {
    calculateMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset();
    setResult(null);
  };

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-background">
      {/* Logo */}
      <div className="absolute top-8 left-8 z-20">
        <img
          src="/proply-logo-auth.png"
          alt="Proply Logo"
          className="h-8 w-auto"
        />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#8884_1px,transparent_1px),linear-gradient(to_bottom,#8884_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        {/* Animated Circles */}
        <div className="circle-animation absolute -top-[150px] -left-[150px] w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl"></div>
        <div className="circle-animation animation-delay-1000 absolute top-[20%] -right-[100px] w-[200px] h-[200px] rounded-full bg-blue-400/10 blur-3xl"></div>
        <div className="circle-animation animation-delay-2000 absolute -bottom-[150px] left-[20%] w-[250px] h-[250px] rounded-full bg-primary/10 blur-3xl"></div>

        {/* Data Points */}
        <div className="data-points absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-primary/40"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.2,
                animationDelay: `${Math.random() * 5000}ms`,
                animationDuration: `${Math.random() * 10000 + 5000}ms`,
              }}
            />
          ))}
        </div>

        {/* Geometric Shapes */}
        <div className="absolute top-[15%] left-[10%] w-16 h-16 border-2 border-primary/20 rounded-lg rotate-12 animate-float"></div>
        <div className="absolute bottom-[20%] right-[15%] w-20 h-20 border-2 border-primary/20 rounded-full animate-float animation-delay-1000"></div>
        <div className="absolute top-[60%] right-[25%] w-12 h-12 border-2 border-primary/20 rotate-45 animate-float animation-delay-2000"></div>

        {/* Data Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,100 Q150,50 300,200 T600,100 T900,100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary animate-draw"
          />
          <path
            d="M0,200 Q200,150 400,250 T800,200"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary animate-draw animation-delay-1000"
          />
        </svg>
      </div>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center pt-8">
        <div className="container flex flex-col items-center px-4 py-8 text-center md:py-16 lg:py-24">
          <div className="mx-auto max-w-[800px] space-y-4">
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">Proply Deal Score™</h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
              Enter the property details below to get an instant deal score based on market data, area rates, and rental
              yields.
            </p>
          </div>

          <div className="mx-auto mt-12 w-full max-w-[500px] relative">
            {/* Card Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>

            <div className="relative bg-background rounded-lg p-1">
              {!result ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 p-5 bg-card rounded-lg shadow-sm">
                    {calculateMutation.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {calculateMutation.error instanceof Error
                            ? calculateMutation.error.message
                            : "An error occurred while calculating the deal score"}
                        </AlertDescription>
                      </Alert>
                    )}

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
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asking Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                              <Input
                                type="number"
                                placeholder="0"
                                className="pl-7"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select property type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="house">House</SelectItem>
                              <SelectItem value="apartment">Apartment</SelectItem>
                              <SelectItem value="townhouse">Townhouse</SelectItem>
                              <SelectItem value="land">Vacant Land</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrooms</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Number of bedrooms" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="5+">5+</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="propertyCondition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Condition</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select property condition" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="excellent">Excellent</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="poor">Poor</SelectItem>
                            </SelectContent>
                          </Select>
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
                              placeholder=""
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="areaRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area Rate (R/m²)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                              <Input
                                type="number"
                                placeholder="0"
                                className="pl-7"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyRental"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Long-term Monthly Rental (Optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                              <Input
                                type="number"
                                placeholder=""
                                className="pl-7"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nightlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short-term Nightly Rate (Optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                              <Input
                                type="number"
                                placeholder=""
                                className="pl-7"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </div>
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
                          <FormLabel>Annual Occupancy % (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder=""
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button className="mt-2" type="submit" disabled={calculateMutation.isPending}>
                      {calculateMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Analyzing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Calculate Deal Score
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="rounded-lg bg-card p-6 text-card-foreground shadow-sm">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold">Deal Assessment</h2>
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">✨ Deal Score:</span>
                          <span className="text-3xl font-bold text-primary">{result.score}%</span>
                        </div>
                        <div className={`rounded-full px-4 py-1 text-sm font-medium text-primary-foreground ${result.color}`}>
                          {result.rating}
                        </div>
                      </div>
                    </div>

                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                        style={{ width: `${result.score}%` }}
                      />
                      <div
                        className="absolute -top-1 h-4 w-4 rounded-full border-2 border-white shadow-sm"
                        style={{ left: `${result.score}%`, backgroundColor: result.color }}
                      />
                      <div className="absolute left-0 right-0 top-4 flex justify-between text-xs text-muted-foreground">
                        <span>Poor</span>
                        <span>Average</span>
                        <span>Good</span>
                        <span>Great</span>
                        <span>Excellent</span>
                      </div>
                    </div>

                    <div className="space-y-4 text-left">
                      <p className="text-sm text-muted-foreground">
                        This property is{" "}
                        <span className="font-medium text-primary">
                          {result.percentageDifference.toFixed(1)}%
                        </span>
                        {result.percentageDifference > 0 ? " below" : " above"} the estimated market value.
                      </p>
                      <div className="grid gap-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Asking Price:</span>
                          <span className="font-medium">R{result.askingPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Estimated Market Value:</span>
                          <span className="font-medium">R{result.estimatedValue.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Score based on price difference, property condition, area rates, and rental yields
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="w-full" onClick={resetForm}>
                        Calculate Another
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => setShowPaymentModal(true)}>
                        View Full Report
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Purchase Full Property Report</DialogTitle>
            <DialogDescription>
              Get detailed insights, comparable properties, and investment projections for this property.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Full Property Report</div>
              <div className="font-bold text-lg">R100</div>
            </div>

            <div className="border-t border-b py-4">
              <div className="font-medium mb-3">What's included:</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Detailed property valuation analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Comparable property listings in the area</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>5-year investment projection</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-primary mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Neighborhood growth trends</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="font-medium">Payment Method</div>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  <RadioGroupItem value="card" id="card" className="sr-only" />
                  <CreditCard className="mb-3 h-6 w-6" />
                  <span className="text-sm">Credit Card</span>
                </Label>
                <Label htmlFor="instant-eft" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                  <RadioGroupItem value="instant-eft" id="instant-eft" className="sr-only" />
                  <Wallet className="mb-3 h-6 w-6" />
                  <span className="text-sm">Instant EFT</span>
                </Label>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={processingPayment}>
              {processingPayment ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </div>
              ) : (
                "Pay R100"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Prefill Button */}
      <div
        onClick={() => {
          const now = Date.now();
          if (!window.lastClick) {
            window.lastClick = now;
            window.clickCount = 1;
          } else if (now - window.lastClick < 500) {
            window.clickCount = (window.clickCount || 0) + 1;
            if (window.clickCount === 3) {
              // Fill form data
              form.reset({
                address: "27 Leeuwen St, Cape Town City Centre, 8001",
                price: 3500000,
                propertyType: "apartment",
                bedrooms: "2",
                propertyCondition: "excellent",
                floorArea: 85,
                areaRate: 45000,
                monthlyRental: 25000,
                nightlyRate: 2500,
                occupancyRate: 70
              });
              window.clickCount = 0;
            }
          } else {
            window.lastClick = now;
            window.clickCount = 1;
          }
        }}
        className="fixed bottom-4 right-4 w-8 h-8 rounded-full bg-gray-400 cursor-default select-none hover:bg-gray-500 transition-all"
        style={{ opacity: 0.4 }}
      />
    </div>
  );
}