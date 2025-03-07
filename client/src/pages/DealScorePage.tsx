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

  const [showResults, setShowResults] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
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

  // Calculate market price and price difference
  const marketPrice = Number(formData.size) * Number(formData.areaRate);
  const priceDiff = ((Number(formData.purchasePrice) - marketPrice) / marketPrice) * 100;

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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}