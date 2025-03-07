import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // We'll handle the submission logic later
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <PageTransition>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Deal Score</h1>

        <Card className="max-w-2xl">
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
                  type="number"
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
                  type="number"
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
                  type="number"
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
                  type="number"
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
                  type="number"
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
                  type="number"
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
    </PageTransition>
  );
}