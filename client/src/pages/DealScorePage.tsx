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

  const [calculatedResults, setCalculatedResults] = useState({ marketPrice: 0, priceDiff: 0 });
  const [displayedResults, setDisplayedResults] = useState({ marketPrice: 0, priceDiff: 0 }); // Added displayedResults state
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

    // Add visual feedback that prefill was triggered
    const feedbackEl = document.createElement('div');
    feedbackEl.textContent = 'Form prefilled!';
    feedbackEl.style.position = 'fixed';
    feedbackEl.style.bottom = '20px';
    feedbackEl.style.left = '50%';
    feedbackEl.style.transform = 'translateX(-50%)';
    feedbackEl.style.padding = '8px 16px';
    feedbackEl.style.backgroundColor = 'rgba(0,0,0,0.7)';
    feedbackEl.style.color = 'white';
    feedbackEl.style.borderRadius = '4px';
    feedbackEl.style.zIndex = '9999';

    document.body.appendChild(feedbackEl);

    // Remove the notification after 2 seconds
    setTimeout(() => {
      document.body.removeChild(feedbackEl);
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    // Remove any non-numeric characters (except decimal point) for number fields
    if (field === "purchasePrice" || field === "size" || field === "areaRate" || 
        field === "nightlyRate" || field === "occupancy" || field === "longTermRental") {
      value = value.replace(/[^0-9.]/g, '');
    }

    // Only update the form data without recalculating results
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Calculate results only when the form is submitted
    const marketPrice = Number(formData.size) * Number(formData.areaRate);
    const priceDiff = ((Number(formData.purchasePrice) - marketPrice) / marketPrice) * 100;
    setCalculatedResults({ marketPrice, priceDiff });
    setDisplayedResults({ marketPrice, priceDiff }); // Update displayedResults
    setShowResults(true);
  };

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
            {showResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Price Justification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg mb-6">
                    <div>
                      <div className="text-sm font-medium">Asking Price</div>
                      <div className="text-3xl font-bold">
                        R{Number(formData.purchasePrice).toLocaleString()}
                      </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
                    <div>
                      <div className="text-sm font-medium">Market Average</div>
                      <div className="text-3xl font-bold">
                        R{displayedResults.marketPrice.toLocaleString()}
                      </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground mx-2" />
                    <div>
                      <div className="text-sm font-medium">Difference</div>
                      <div className={`text-3xl font-bold ${displayedResults.priceDiff > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                        {displayedResults.priceDiff > 0 ? '+' : ''}{Math.round(displayedResults.priceDiff)}%
                      </div>
                    </div>
                  </div>

                  {/* Price per square meter comparison */}
                  <div className="flex justify-between items-center mt-4">
                    <div className="font-medium">Price per m²</div>
                    <div className="font-bold">
                      R{Math.round(Number(formData.purchasePrice) / Number(formData.size)).toLocaleString()}/m²
                    </div>
                    <div className="text-muted-foreground">
                      (vs. area avg R{Number(formData.areaRate).toLocaleString()}/m²)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={Number(formData.purchasePrice) / Number(formData.size) <= Number(formData.areaRate) ? 'text-green-500' : 'text-amber-500'}>
                        {Number(formData.purchasePrice) / Number(formData.size) <= Number(formData.areaRate) ? '-' : '+'}
                        R{Math.abs(Math.round(Number(formData.purchasePrice) / Number(formData.size) - Number(formData.areaRate))).toLocaleString()}/m²
                      </div>
                      <Badge variant="outline" className={displayedResults.priceDiff <= 5 ? 'text-green-500' : 'text-amber-500'}>
                        {displayedResults.priceDiff <= 5 ? 'COMPETITIVE' : 'PREMIUM'}
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