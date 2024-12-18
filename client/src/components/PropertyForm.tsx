import { useState } from "react";
import { useProAccess } from "../hooks/use-pro-access";
import { useForm } from "react-hook-form";
import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface RevenueData {
  adr: number;
  occupancy: number;
  percentile: number;
}

interface PropertyFormProps {
  onSubmit: (data: {
    title: string;
    address: string;
    bedrooms: string;
    bathrooms: string;
    longTermRental: string;
    annualEscalation: string;
    shortTermNightly: string;
    annualOccupancy: string;
    managementFee: string;
  }) => void;
}

export default function PropertyForm({ onSubmit }: PropertyFormProps) {
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

  const form = useForm({
    defaultValues: {
      title: "",
      address: "",
      bedrooms: "",
      bathrooms: "",
      longTermRental: "",
      annualEscalation: "",
      shortTermNightly: "",
      annualOccupancy: "",
      managementFee: "",
    },
  });

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const address = form.getValues("address");
      const bedrooms = form.getValues("bedrooms");
      
      if (!address || !bedrooms) {
        alert("Please enter the property address and number of bedrooms first.");
        return;
      }

      const response = await fetch(`/api/revenue-data?address=${encodeURIComponent(address)}&bedrooms=${bedrooms}`);

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
      alert('Failed to fetch revenue data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyPercentileData = (percentile: '25' | '50' | '75' | '90') => {
    if (!revenueData) return;
    
    const data = revenueData[percentile];
    form.setValue("shortTermNightly", data.adr.toString());
    form.setValue("annualOccupancy", data.occupancy.toString());
    setShowPercentileDialog(false);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. The Sentinel Unit 1209" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Address</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="123 Main St" />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrooms</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" />
                  </FormControl>
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
                    <Input {...field} type="number" min="0" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="longTermRental"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Long Term Monthly Rental</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="annualEscalation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Escalation (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="0" max="100" />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="shortTermNightly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Term Nightly Rate</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" className="h-10" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="annualOccupancy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Occupancy (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" max="100" className="h-10" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex flex-col">
                <FormLabel>Market Data</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 mt-[2px]"
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
            </div>
          </div>

          <FormField
              control={form.control}
              name="managementFee"
              rules={{ 
                required: "Management fee percentage is required",
                min: { value: 0, message: "Management fee cannot be negative" },
                max: { value: 100, message: "Management fee cannot exceed 100%" }
              }}
              render={({ field, fieldState }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Management Fee (%)</FormLabel>
                    <span className="text-sm text-muted-foreground">
                      (0% if self-managed)
                    </span>
                  </div>
                  <FormControl>
                    <Input {...field} type="number" min="0" max="100" placeholder="0" />
                  </FormControl>
                  {fieldState.error && (
                    <p className="text-sm text-red-500">{fieldState.error.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Enter 0 for self-managed properties or the percentage charged by your property manager
                  </p>
                </FormItem>
              )}
            />

          <div className="space-y-4">
            <Button type="submit" className="w-full bg-[#1BA3FF] hover:bg-[#114D9D]">
              Compare Options
            </Button>
          </div>
        </form>
      </Form>

      {/* Hidden demo data button */}
      <button
        type="button"
        onClick={() => {
          setDemoClicks(prev => {
            if (prev === 2) {
              // Fill demo data after triple click
              form.reset({
                title: "The Sentinel Unit 1209",
                address: "27 Leeuwen St, Cape Town City Centre, 8001",
                bedrooms: "2",
                bathrooms: "2",
                longTermRental: "18000",
                annualEscalation: "8",
                shortTermNightly: "2500",
                annualOccupancy: "65",
                managementFee: "15",
              });
              return 0;
            }
            return prev + 1;
          });
        }}
        className="fixed bottom-4 right-4 w-4 h-4 opacity-5 hover:opacity-10 bg-gray-500 rounded-full"
        aria-hidden="true"
      />

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to Pro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">Accurate Revenue Data</h4>
                <p className="text-sm text-blue-700">Get real-time nightly rates and occupancy data from actual Airbnb listings in your area</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">With Pro, you get:</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Accurate nightly rates based on local market data
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Real occupancy rates from similar properties
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Seasonal pricing trends and recommendations
                </li>
              </ul>
            </div>

            <Button onClick={() => setShowUpgradeModal(false)} className="w-full">
              Upgrade Now
            </Button>
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="w-full">
              Continue with Manual Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPercentileDialog} onOpenChange={setShowPercentileDialog}>
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
                {revenueData && Object.entries(revenueData).map(([percentile, data]) => (
                  <tr key={percentile} className="border-b">
                    <td className="py-2 px-4">{percentile}th Percentile</td>
                    <td className="text-right py-2 px-4">
                      {new Intl.NumberFormat('en-ZA', {
                        style: 'currency',
                        currency: 'ZAR'
                      }).format(data.adr)}
                    </td>
                    <td className="text-right py-2 px-4">
                      <Button
                        onClick={() => applyPercentileData(percentile as '25' | '50' | '75' | '90')}
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
              <p>Occupancy: {revenueData?.['50'].occupancy.toFixed(1)}%</p>
              <p className="mt-1">Number of Listings: {revenueData?.['50'].occupancy}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}