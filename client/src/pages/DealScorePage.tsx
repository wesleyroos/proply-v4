import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DealScorePage() {
  const [formData, setFormData] = useState({
    address: "",
    purchasePrice: "",
    size: "",
    areaRate: "",
    nightlyRate: "",
    occupancy: "",
    longTermRental: "",
    propertyCondition: "excellent"
  });

  // Separate state for submitted data
  const [submittedData, setSubmittedData] = useState<typeof formData | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Prefill data handler
  const handlePrefill = () => {
    setFormData({
      address: "27 Leeuwen St, Cape Town City Centre, 8001",
      purchasePrice: "3500000",
      size: "85",
      areaRate: "45000",
      nightlyRate: "2500",
      occupancy: "70",
      longTermRental: "25000",
      propertyCondition: "excellent"
    });
  };

  const handleInputChange = (field: string, value: string) => {
    // Remove any non-numeric characters (except decimal point) for number fields
    if (field === "purchasePrice" || field === "size" || field === "areaRate" || 
        field === "nightlyRate" || field === "occupancy" || field === "longTermRental") {
      value = value.replace(/[^0-9.]/g, '');
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedData(formData); // Update submitted data
    setShowResults(true);
  };

  // Calculate results only from submitted data
  const marketPrice = submittedData ? Number(submittedData.size) * Number(submittedData.areaRate) : 0;
  const priceDiff = submittedData ? ((Number(submittedData.purchasePrice) - marketPrice) / marketPrice) * 100 : 0;

  return (
    <PageTransition>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Deal Score</h1>

        <div className="flex gap-8">
          {/* Form Section */}
          <div className="w-[500px]">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Property Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Enter property address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price (R)</Label>
                    <Input
                      id="purchasePrice"
                      type="text"
                      inputMode="numeric"
                      value={formData.purchasePrice}
                      onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                      placeholder="Enter purchase price"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Size (m²)</Label>
                    <Input
                      id="size"
                      type="text"
                      inputMode="numeric"
                      value={formData.size}
                      onChange={(e) => handleInputChange("size", e.target.value)}
                      placeholder="Enter property size"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="areaRate">Area Rate (R/m²)</Label>
                    <Input
                      id="areaRate"
                      type="text"
                      inputMode="numeric"
                      value={formData.areaRate}
                      onChange={(e) => handleInputChange("areaRate", e.target.value)}
                      placeholder="Enter area rate per square meter"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nightlyRate">Nightly Rate (R)</Label>
                    <Input
                      id="nightlyRate"
                      type="text"
                      inputMode="numeric"
                      value={formData.nightlyRate}
                      onChange={(e) => handleInputChange("nightlyRate", e.target.value)}
                      placeholder="Enter nightly rate"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupancy">Occupancy (%)</Label>
                    <Input
                      id="occupancy"
                      type="text"
                      inputMode="numeric"
                      min="0"
                      max="100"
                      value={formData.occupancy}
                      onChange={(e) => handleInputChange("occupancy", e.target.value)}
                      placeholder="Enter expected occupancy rate"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longTermRental">Long Term Rental (R/month)</Label>
                    <Input
                      id="longTermRental"
                      type="text"
                      inputMode="numeric"
                      value={formData.longTermRental}
                      onChange={(e) => handleInputChange("longTermRental", e.target.value)}
                      placeholder="Enter long term rental amount"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyCondition">Property Condition</Label>
                    <Select
                      value={formData.propertyCondition}
                      onValueChange={(value) => handleInputChange("propertyCondition", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full">
                    Calculate Deal Score
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="flex-1">
            {showResults && submittedData && (
              <Card>
                <CardHeader>
                  <CardTitle>Price Justification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-6">
                    <div>
                      <div className="text-sm font-medium">Asking Price</div>
                      <div className="text-3xl font-bold">
                        R{Number(submittedData.purchasePrice).toLocaleString()}
                      </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
                    <div>
                      <div className="text-sm font-medium">Market Average</div>
                      <div className="text-3xl font-bold">
                        R{marketPrice.toLocaleString()}
                      </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
                    <div>
                      <div className="text-sm font-medium">Difference</div>
                      <div className={`text-3xl font-bold ${priceDiff > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                        {priceDiff > 0 ? '+' : ''}{Math.round(priceDiff)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="font-medium">Price per m²</div>
                    <div className="font-bold">
                      R{submittedData ? Math.round(Number(submittedData.purchasePrice) / Number(submittedData.size)).toLocaleString() : "0"}/m²
                    </div>
                    <div className="text-muted-foreground">
                      (vs. area avg R{submittedData ? Number(submittedData.areaRate).toLocaleString() : "0"}/m²)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={submittedData && (Number(submittedData.purchasePrice) / Number(submittedData.size) <= Number(submittedData.areaRate)) ? 'text-green-500' : 'text-amber-500'}>
                        {submittedData && (Number(submittedData.purchasePrice) / Number(submittedData.size) <= Number(submittedData.areaRate)) ? '-' : '+'}
                        R{submittedData ? Math.abs(Math.round(Number(submittedData.purchasePrice) / Number(submittedData.size) - Number(submittedData.areaRate))).toLocaleString() : "0"}/m²
                      </div>
                      <Badge variant="outline" className={priceDiff <= 0 ? 'text-green-500' : 'text-amber-500'}>
                        {priceDiff <= 0 ? 'Under Paying' : 'Over Paying'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Prefill Button */}
        <div 
          onClick={(e) => {
            // Track clicks to detect triple click
            const now = new Date().getTime();
            if (!window.lastClick) window.lastClick = 0;
            if (!window.clickCount) window.clickCount = 0;

            // Reset counter if more than 500ms between clicks
            if (now - window.lastClick > 500) {
              window.clickCount = 1;
            } else {
              window.clickCount++;
            }

            window.lastClick = now;

            // If triple click detected, call handlePrefill
            if (window.clickCount === 3) {
              handlePrefill();
              window.clickCount = 0;
            }
          }}
          className="fixed bottom-4 right-4 w-8 h-8 rounded-full bg-gray-100/20 cursor-default select-none"
          style={{ opacity: 0.1 }}
        />
      </div>
    </PageTransition>
  );
}