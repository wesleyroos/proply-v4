import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Loader2, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProAccess } from "@/hooks/use-pro-access";
import { UpgradeModal } from "@/components/UpgradeModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertyScoreModal } from "@/components/PropertyScoreModal";
import { Progress } from "@/components/ui/progress"; // Add this import

interface RevenueData {
  adr: number;
  occupancy: number;
  percentile: number;
  revpar: number;
  revpam: number;
  leadTime: number;
  stayLength: number;
  activeListings: number;
  seasonalityIndex: number;
  demandScore: number;
  ratePosition: number;
  revparPosition: number;
}

export default function DealScorePage() {
  const [formData, setFormData] = useState({
    address: "",
    purchasePrice: "",
    size: "",
    areaRate: "",
    bedrooms: "",
    nightlyRate: "",
    occupancy: "",
    longTermRental: "",
    propertyCondition: "excellent",
  });

  // States for revenue data
  const [isLoading, setIsLoading] = useState(false);
  const [showPercentileDialog, setShowPercentileDialog] = useState(false);
  const [revenueData, setRevenueData] = useState<{
    "25": RevenueData;
    "50": RevenueData;
    "75": RevenueData;
    "90": RevenueData;
  } | null>(null);

  const hasProAccess = useProAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<typeof formData | null>(
    null,
  );
  const [showResults, setShowResults] = useState(false);
  const [showPropertyScoreModal, setShowPropertyScoreModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Prefill data handler
  const handlePrefill = () => {
    setFormData({
      address: "27 Leeuwen St, Cape Town City Centre, 8001",
      purchasePrice: "3500000",
      size: "85",
      areaRate: "45000",
      bedrooms: "2",
      nightlyRate: "2500",
      occupancy: "70",
      longTermRental: "25000",
      propertyCondition: "excellent",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    if (
      field === "purchasePrice" ||
      field === "size" ||
      field === "areaRate" ||
      field === "nightlyRate" ||
      field === "occupancy" ||
      field === "longTermRental" ||
      field === "bedrooms"
    ) {
      value = value.replace(/[^0-9.]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    // Simulate calculation time
    setTimeout(() => {
      setSubmittedData(formData);
      setShowResults(true);
      setIsCalculating(false);
    }, 3000);
  };

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const address = formData.address;
      const bedrooms = formData.bedrooms;

      if (!address || !bedrooms) {
        alert(
          "Please enter the property address and number of bedrooms first.",
        );
        return;
      }

      const response = await fetch(
        `/api/revenue-data?address=${encodeURIComponent(
          address,
        )}&bedrooms=${bedrooms}`,
      );

      const data = await response.json();

      if (data.KPIsByBedroomCategory?.[bedrooms]) {
        const result = data.KPIsByBedroomCategory[bedrooms];
        const processedData = {
          "25": {
            adr: result.ADR25PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 25,
            revpar: result.RevPARAvg,
            revpam: result.RevPAMAvg,
            leadTime: result.BookingLeadTimeDays,
            stayLength: result.LengthOfStayDays,
            activeListings: result.ActiveListings,
            seasonalityIndex: result.MonthlySeasonalityIndex,
            demandScore: result.MonthlyDemandScore,
            ratePosition: result.RatePositionPercentile,
            revparPosition: result.RevPARPositionPercentile,
          },
          "50": {
            adr: result.ADR50PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 50,
            activeListings: result.NoOfListings,
          },
          "75": {
            adr: result.ADR75PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 75,
            activeListings: result.NoOfListings,
          },
          "90": {
            adr: result.ADR90PercentileAvg,
            occupancy: result.AvgAdjustedOccupancy,
            percentile: 90,
            activeListings: result.NoOfListings,
          },
        };
        setRevenueData(processedData);
        setShowPercentileDialog(true);
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      alert("Failed to fetch revenue data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyPercentileData = (percentile: "25" | "50" | "75" | "90") => {
    if (!revenueData) return;

    const data = revenueData[percentile];
    setFormData((prev) => ({
      ...prev,
      nightlyRate: data.adr.toString(),
      occupancy: data.occupancy.toString(),
    }));
    setShowPercentileDialog(false);
  };

  // Calculate results only from submitted data
  const marketPrice = submittedData
    ? Number(submittedData.size) * Number(submittedData.areaRate)
    : 0;
  const priceDiff = submittedData
    ? ((Number(submittedData.purchasePrice) - marketPrice) / marketPrice) * 100
    : 0;

  const getConditionDetails = (condition: string) => {
    switch (condition) {
      case "excellent":
        return {
          description: "(minimal repairs needed)",
          badge: "MOVE-IN READY",
          badgeColor: "text-emerald-500",
        };
      case "good":
        return {
          description: "(some repairs needed)",
          badge: "MINOR WORK",
          badgeColor: "text-blue-500",
        };
      case "fair":
        return {
          description: "(significant repairs needed)",
          badge: "NEEDS WORK",
          badgeColor: "text-amber-500",
        };
      case "poor":
        return {
          description: "(major repairs needed)",
          badge: "MAJOR WORK",
          badgeColor: "text-red-500",
        };
      default:
        return {
          description: "",
          badge: "",
          badgeColor: "",
        };
    }
  };

  return (
    <PageTransition>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Deal Score</h1>
          {hasProAccess.hasAccess && (
            <Button
              variant="outline"
              onClick={() => setShowPropertyScoreModal(true)}
            >
              View Property Score <BarChart3 className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        <div className="flex gap-8">
          {/* Form Section */}
          <div className="w-[700px]">
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
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("purchasePrice", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("size", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("areaRate", e.target.value)
                      }
                      placeholder="Enter area rate per square meter"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="text"
                      inputMode="numeric"
                      value={formData.bedrooms}
                      onChange={(e) =>
                        handleInputChange("bedrooms", e.target.value)
                      }
                      placeholder="Enter number of bedrooms"
                      required
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nightlyRate">Nightly Rate (R)</Label>
                        <Input
                          id="nightlyRate"
                          type="text"
                          inputMode="numeric"
                          value={formData.nightlyRate}
                          onChange={(e) =>
                            handleInputChange("nightlyRate", e.target.value)
                          }
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
                          onChange={(e) =>
                            handleInputChange("occupancy", e.target.value)
                          }
                          placeholder="Enter expected occupancy rate"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Market Data</Label>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-10"
                          onClick={() => {
                            if (hasProAccess.hasAccess) {
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
                              <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                PRO
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longTermRental">
                      Long Term Rental (R/month)
                    </Label>
                    <Input
                      id="longTermRental"
                      type="text"
                      inputMode="numeric"
                      value={formData.longTermRental}
                      onChange={(e) =>
                        handleInputChange("longTermRental", e.target.value)
                      }
                      placeholder="Enter long term rental amount"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyCondition">
                      Property Condition
                    </Label>
                    <Select
                      value={formData.propertyCondition}
                      onValueChange={(value) =>
                        handleInputChange("propertyCondition", value)
                      }
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

                  <Button type="submit" className="w-full" disabled={isCalculating}>
                    {isCalculating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      "Calculate Deal Score"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="flex-1">
            {showResults && submittedData && (
              <div className="space-y-4">
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

                    <div className="flex justify-between items-center mt-4">
                      <div className="font-medium">Property Condition</div>
                      <div className="font-bold capitalize">
                        {submittedData.propertyCondition}
                      </div>
                      <div className="text-muted-foreground">
                        {getConditionDetails(submittedData.propertyCondition).description}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getConditionDetails(submittedData.propertyCondition).badgeColor}>
                          {getConditionDetails(submittedData.propertyCondition).badge}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="font-medium">Recent Area Sales</div>
                      <div className="font-bold">
                        R3.4M - R3.7M
                      </div>
                      <div className="text-muted-foreground">
                        (last 3 months)
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-blue-600">
                          WITHIN RANGE
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Making This a Good Deal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">To make this a good deal, consider:</p>
                        <p className="text-lg font-medium">
                          Make an offer between{" "}
                          <span className="font-bold text-green-600">
                            R{(marketPrice * 0.9).toLocaleString()}
                          </span>
                          {" "}and{" "}
                          <span className="font-bold text-amber-600">
                            R{(marketPrice * 1.1).toLocaleString()}
                          </span>
                        </p>
                      </div>

                      <div className="mt-6">
                        <div className="flex justify-between mb-2">
                          <div className="text-sm font-medium">Deal Rating</div>
                          <div className="text-sm font-medium">
                            {priceDiff <= -5 && submittedData?.propertyCondition === "excellent"
                              ? "Great"
                              : priceDiff <= 0
                              ? "Good"
                              : priceDiff <= 10
                              ? "Fair"
                              : "Bad"}
                          </div>
                        </div>
                        <div className="relative">
                          <div className="h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-500 via-green-500 to-blue-500" />
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>Bad</span>
                            <span>Fair</span>
                            <span>Good</span>
                            <span>Great</span>
                          </div>
                          <div className="absolute -top-2 w-full">
                            <div
                              className="absolute w-4 h-4 rounded-full border-2 border-white bg-primary shadow-lg transform -translate-x-1/2"
                              style={{
                                left: `${
                                  priceDiff <= -5 && submittedData?.propertyCondition === "excellent"
                                    ? 100
                                    : priceDiff <= 0
                                    ? 75
                                    : priceDiff <= 10
                                    ? 50
                                    : 25
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        <div
          onClick={(e) => {
            const now = new Date().getTime();
            if (!window.lastClick) window.lastClick = 0;
            if (!window.clickCount) window.clickCount = 0;

            if (now - window.lastClick > 500) {
              window.clickCount = 1;
            } else {
              window.clickCount++;
            }

            window.lastClick = now;

            if (window.clickCount === 3) {
              handlePrefill();
              window.clickCount = 0;
            }
          }}
          className="fixed bottom-4 right-4 w-8 h-8 rounded-full bg-gray-100/20 cursor-default select-none"
          style={{ opacity: 0.1 }}
        />

        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
        />

        <Dialog
          open={showPercentileDialog}
          onOpenChange={setShowPercentileDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Revenue Performance Data</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500 mb-4">
                Select an Average Daily Rate (ADR) percentile to use for the
                analysis:
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
                  {revenueData &&
                    Object.entries(revenueData).map(([percentile, data]) => (
                      <tr key={percentile} className="border-b">
                        <td className="py-2 px-4">{percentile}th Percentile</td>
                        <td className="text-right py-2 px-4">
                          {new Intl.NumberFormat("en-ZA", {
                            style: "currency",
                            currency: "ZAR",
                          }).format(data.adr)}
                        </td>
                        <td className="text-right py-2 px-4">
                          <Button
                            onClick={() =>
                              applyPercentileData(
                                percentile as "25" | "50" | "75" | "90",
                              )
                            }
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
              <div className="mt-4">
                <div className="text-sm text-gray-500">
                  <p>
                    Average Occupancy Rate:{" "}
                    {revenueData?.["50"].occupancy?.toFixed(1) || "--"}%
                  </p>
                  <p className="mt-1">
                    Number of Active Listings:{" "}
                    {revenueData?.["50"].activeListings || "--"}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <PropertyScoreModal
          isOpen={showPropertyScoreModal}
          onOpenChange={setShowPropertyScoreModal}
        />
      </div>
    </PageTransition>
  );
}