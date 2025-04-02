"use client";

import { useState } from "react";
import {
  ArrowRight,
  Loader2,
  MapPin,
  Home,
  Building,
  Package2,
  Car,
  BarChart3,
  Star,
} from "lucide-react";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function RiskIndexPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Property Details
    address: "",
    purchasePrice: "",
    size: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    propertyCondition: "excellent",
    propertyType: "apartment", // Default to apartment
  });

  const formatWithThousandSeparators = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, "");
    if (!numericValue) return "";
    const parts = numericValue.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
  };

  const parseFormattedNumber = (value: string): string => {
    return value.replace(/,/g, "");
  };

  const handleInputChange = (field: string, value: string) => {
    let numericValue = value;

    if (field === "bedrooms") {
      if (value.toLowerCase() === "studio") {
        numericValue = "0";
      } else if (value.toLowerCase() === "room") {
        numericValue = "-1";
      } else {
        numericValue = value.replace(/,/g, "");
        numericValue = numericValue.replace(/[^0-9.-]/g, "");
        const decimalCount = (numericValue.match(/\./g) || []).length;
        if (decimalCount > 1) {
          numericValue = numericValue.slice(0, numericValue.lastIndexOf("."));
        }
      }
    } else if (
      field === "purchasePrice" ||
      field === "size" ||
      field === "bathrooms" ||
      field === "parking"
    ) {
      numericValue = parseFormattedNumber(value);
      numericValue = numericValue.replace(/[^0-9.]/g, "");
      const formattedValue = formatWithThousandSeparators(numericValue);
      value = formattedValue;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.address || !formData.purchasePrice || !formData.size) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Mock calculation for now - will implement actual risk calculation later
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    
    // For now, just show a success toast
    toast({
      title: "Risk Index Calculated",
      description: "Your property risk analysis is complete.",
    });
  };

  // Check if a field is required and empty
  const checkRequiredFields = (field: string) => {
    if (field === "address" || field === "purchasePrice" || field === "size") {
      return formData[field as keyof typeof formData] === "";
    }
    return false;
  };

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-background">
      <div className="absolute top-8 left-8 z-20">
        <img
          src="/proply-logo-auth.png"
          alt="Proply Logo"
          className="h-8 w-auto"
        />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#8884_1px,transparent_1px),linear-gradient(to_bottom,#8884_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      </div>

      <div className="flex-1 relative z-10 flex flex-col items-center pt-8">
        <div className="container flex flex-col items-center px-2 py-8 text-center md:py-16 lg:py-24 max-w-[1600px]">
          <div className="w-full max-w-[1400px] space-y-4">
            <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
              Proply Risk Index™
            </h1>
            <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl">
              Get an instant risk assessment based on property details and market conditions.
            </p>
          </div>
        </div>

        <Card className="mx-auto mt-6 w-full max-w-[600px] bg-background rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Proply Risk Index™
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Address */}
            <div>
              <div className="flex flex-col w-full">
                <AddressAutocomplete
                  id="address"
                  name="address"
                  label="Property Address"
                  placeholder="Enter the full property address"
                  value={formData.address}
                  onChange={(value) => handleInputChange("address", value)}
                  onAddressValidated={(addressData) => {
                    if (addressData.validationStatus === "valid") {
                      handleInputChange("address", addressData.formattedAddress);
                    }
                  }}
                  className={
                    checkRequiredFields("address") ? "border-red-500" : ""
                  }
                  required
                />
                {checkRequiredFields("address") && (
                  <p className="text-red-500 text-xs mt-1">
                    Please enter the property address
                  </p>
                )}
              </div>
            </div>

            {/* Property Type */}
            <div>
              <Label htmlFor="propertyType" className="mb-1 block">
                Property Type
              </Label>
              <Select
                value={formData.propertyType}
                onValueChange={(value) => handleInputChange("propertyType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Property Size */}
            <div>
              <Label
                htmlFor="size"
                className="mb-1 block"
                data-error={checkRequiredFields("size")}
              >
                Property Size (m²)
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="size"
                  placeholder="0"
                  value={formData.size}
                  onChange={(e) => handleInputChange("size", e.target.value)}
                  className={
                    checkRequiredFields("size") ? "border-red-500 pr-16" : "pr-16"
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-muted-foreground">m²</span>
                </div>
              </div>
              {checkRequiredFields("size") && (
                <p className="text-red-500 text-xs mt-1">
                  Please enter the property size
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bedrooms */}
              <div>
                <Label htmlFor="bedrooms" className="mb-1 block">
                  Bedrooms
                </Label>
                <Input
                  id="bedrooms"
                  placeholder="2"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                />
              </div>

              {/* Bathrooms */}
              <div>
                <Label htmlFor="bathrooms" className="mb-1 block">
                  Bathrooms
                </Label>
                <Input
                  id="bathrooms"
                  placeholder="2"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                />
              </div>
            </div>

            {/* Parking */}
            <div>
              <Label htmlFor="parking" className="mb-1 block">
                Parking Spaces
              </Label>
              <Input
                id="parking"
                placeholder="1"
                value={formData.parking}
                onChange={(e) => handleInputChange("parking", e.target.value)}
              />
            </div>

            {/* Property Condition */}
            <div>
              <Label htmlFor="propertyCondition" className="mb-1 block">
                Property Condition
              </Label>
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

            {/* Purchase Price */}
            <div>
              <Label
                htmlFor="purchasePrice"
                className="mb-1 block"
                data-error={checkRequiredFields("purchasePrice")}
              >
                Purchase Price/Property Value
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-muted-foreground">R</span>
                </div>
                <Input
                  id="purchasePrice"
                  placeholder="0"
                  value={formData.purchasePrice}
                  onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                  className={
                    checkRequiredFields("purchasePrice")
                      ? "border-red-500 pl-8"
                      : "pl-8"
                  }
                />
              </div>
              {checkRequiredFields("purchasePrice") && (
                <p className="text-red-500 text-xs mt-1">
                  Please enter the purchase price
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
              <Button type="submit" className="ml-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    Calculate Risk Index
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <footer className="bg-muted py-6 px-6 w-full mt-12">
          <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Proply. All rights reserved.</p>
            <p className="mt-1">
              The Proply Risk Index™ is a proprietary algorithm designed to assess investment risk.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}