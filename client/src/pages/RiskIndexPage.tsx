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
      {/* Decorative patterns - similar to Deal Score page */}
      <div 
        className="absolute inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(0, 0, 0, 0.2) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, rgba(0, 0, 0, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="relative bg-gradient-to-r from-primary to-blue-600 py-16 px-6 md:px-12">
          <div 
            className="absolute inset-0 z-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(135deg, rgba(255, 255, 255, 0.3) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.3) 75%, transparent 75%, transparent)
              `,
              backgroundSize: '40px 40px',
            }}
          />
          
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 p-4 rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-white">
                  Proply Risk Index™
                </h1>
                <p className="text-white/90 mt-2 max-w-xl">
                  Analyze property risks and investment outlook with our comprehensive assessment tool.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          <div 
            className="mx-auto mt-10 w-full max-w-[600px] bg-background rounded-lg p-6 shadow-lg border border-border"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Property Risk Assessment</h2>
              <p className="text-muted-foreground">
                Enter your property details below to calculate the risk index
              </p>
            </div>

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
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-muted py-6 px-6 mt-12">
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