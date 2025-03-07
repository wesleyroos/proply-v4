import { useState } from "react";
import { PageTransition } from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PropertyScoreModal } from "@/components/PropertyScoreModal";

export default function DealScorePage() {
  const [propertyDetails, setPropertyDetails] = useState({
    address: "",
    purchasePrice: 0,
    marketAvgPrice: 0,
  });

  const [showScore, setShowScore] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowScore(true);
  };

  return (
    <PageTransition>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Deal Score</h1>

        {!showScore ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Enter Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Property Address</Label>
                  <Input
                    id="address"
                    value={propertyDetails.address}
                    onChange={(e) => setPropertyDetails(prev => ({
                      ...prev,
                      address: e.target.value
                    }))}
                    placeholder="Enter property address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    value={propertyDetails.purchasePrice || ''}
                    onChange={(e) => setPropertyDetails(prev => ({
                      ...prev,
                      purchasePrice: Number(e.target.value)
                    }))}
                    placeholder="Enter purchase price"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketAvgPrice">Market Average Price</Label>
                  <Input
                    id="marketAvgPrice"
                    type="number"
                    value={propertyDetails.marketAvgPrice || ''}
                    onChange={(e) => setPropertyDetails(prev => ({
                      ...prev,
                      marketAvgPrice: Number(e.target.value)
                    }))}
                    placeholder="Enter market average price"
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Calculate Deal Score
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <PropertyScoreModal
            isOpen={true}
            onOpenChange={() => setShowScore(false)}
            propertyAddress={propertyDetails.address}
            purchasePrice={propertyDetails.purchasePrice}
            marketAvgPrice={propertyDetails.marketAvgPrice}
          />
        )}
      </div>
    </PageTransition>
  );
}