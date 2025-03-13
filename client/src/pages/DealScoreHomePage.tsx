"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, AlertCircle } from "lucide-react";
import { dealCalculationSchema, type DealCalculation, type DealScoreResult } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const [result, setResult] = useState<DealScoreResult | null>(null);

  const form = useForm<DealCalculation>({
    resolver: zodResolver(dealCalculationSchema),
    defaultValues: {
      address: "",
      price: 0,
      propertyType: undefined,
      bedrooms: undefined,
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: DealCalculation) => {
      const response = await apiRequest("POST", "/api/calculate-deal-score", data);
      return response.json();
    },
    onSuccess: (data: DealScoreResult) => {
      setResult(data);
    },
  });

  const onSubmit = (data: DealCalculation) => {
    calculateMutation.mutate(data);
  };

  const resetForm = () => {
    form.reset();
    setResult(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Animated Background */}
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

      <main className="flex-1 relative z-10 w-full flex items-center justify-center">
        <div className="container max-w-7xl mx-auto px-4 py-8 md:py-12 lg:py-16">
          <div className="mx-auto max-w-[800px] space-y-4 text-center mb-12">
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
              Proply Deal Score™
            </h1>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
              Enter the property details below to get an instant deal score based on market data, area rates, and rental yields.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[500px] relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-slow" />

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
                      <Button variant="outline" className="w-full">
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
    </div>
  );
}