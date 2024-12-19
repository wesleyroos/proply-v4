import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, BarChart3, TrendingUp, Building2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import PropertyAnalyzerForm from "@/components/PropertyAnalyzerForm";
import PropertyMap from "@/components/PropertyMap";

interface AnalysisResult {
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  propertyDescription: string | null;
  deposit: number | null;
  depositPercentage: number | null;
  interestRate: number | null;
  monthlyBondRepayment: number | null;
  floorArea: number | null;
  ratePerSquareMeter: number | null;
  shortTermNightlyRate: number | null;
  annualOccupancy: number | null;
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
  };
  address: string;
}

export default function PropertyAnalyzerPage() {
  const { user } = useUser();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);

  const handleAnalysisComplete = async (formData: any) => {
    try {
      setAnalysisError(null);
      setFormData(formData);
      
      // Ensure all numbers are properly parsed and validated
      const requestBody = {
        purchasePrice: Number(formData.purchasePrice),
        shortTermNightlyRate: Number(formData.airbnbNightlyRate) || undefined,
        annualOccupancy: Number(formData.occupancyRate) || undefined,
        longTermRental: Number(formData.longTermRental) || undefined,
        leaseCycleGap: Number(formData.leaseCycleGap) || undefined,
        propertyDescription: formData.comments || null,
        address: formData.address,
        deposit: Number(formData.depositAmount),
        interestRate: Number(formData.interestRate),
        floorArea: Number(formData.floorArea),
        ratePerSquareMeter: Number(formData.cmaRatePerSqm)
      };
      
      console.log('Data being sent to analyzer:', requestBody);
      
      console.log('Sending analysis request with body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Raw response from analyzer:', response);
      console.log('Parsed response data:', data);
      
      if (!response.ok) {
        const errorMessage = data.error || response.statusText;
        console.error('Analysis failed with error:', errorMessage);
        throw new Error(errorMessage);
      }

      // Include the nightly rate and occupancy from the request in the analysis result
      setAnalysisResult({
        ...data,
        shortTermNightlyRate: requestBody.shortTermNightlyRate,
        annualOccupancy: requestBody.annualOccupancy
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze property data');
      setAnalysisResult(null);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Property Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Enter property details to generate analysis
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <PropertyAnalyzerForm onAnalysisComplete={handleAnalysisComplete} />

        {analysisError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">Error: {analysisError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {analysisResult && (
          <>
            {/* Analysis Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Analysis Results
              </h2>
              <p className="text-muted-foreground">
                Based on your provided property details
              </p>
            </div>

            {/* Deal Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Deal Structure */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Deal Structure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Property Description</h3>
                    <p className="mt-1">
                      {analysisResult.propertyDescription || "No description available"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Purchase Price</h3>
                    <p className="mt-1 text-lg font-semibold">
                      R{analysisResult.analysis.purchasePrice.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Deposit</h3>
                    <p className="mt-1">
                      R{analysisResult.deposit?.toLocaleString() || "0"} 
                      ({analysisResult.depositPercentage || "0"}%)
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Interest Rate</h3>
                    <p className="mt-1">{analysisResult.interestRate || "0"}%</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Monthly Bond Repayment</h3>
                    <p className="mt-1">R{analysisResult.monthlyBondRepayment?.toLocaleString() || "0"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Middle Column with Revenue and Size/Rate */}
              <div className="space-y-4">
                {/* Revenue Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Revenue Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Short-Term Rental (Year 1)</h3>
                        <div className="mt-2">
                          <p className="text-lg font-semibold">R{analysisResult.analysis.shortTermAnnualRevenue?.toLocaleString() || "0"}</p>
                          <p className="text-sm text-muted-foreground">Gross Yield: {analysisResult.shortTermGrossYield?.toFixed(2) || "0"}%</p>
                          <p className="text-sm text-muted-foreground">Nightly Rate: R{analysisResult.shortTermNightlyRate?.toLocaleString() || "0"}</p>
                          <p className="text-sm text-muted-foreground">Occupancy: {analysisResult.annualOccupancy || "0"}%</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Long-Term Rental (Year 1)</h3>
                        <div className="mt-2">
                          <p className="text-lg font-semibold">R{analysisResult.analysis.longTermAnnualRevenue?.toLocaleString() || "0"}</p>
                          <p className="text-sm text-muted-foreground">Gross Yield: {analysisResult.longTermGrossYield?.toFixed(2) || "0"}%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Size and Rate */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Size and Rate/m²</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">Floor Area: {analysisResult.floorArea || "0"} m²</p>
                      <p className="text-sm mt-2">Area Rate/m²: R{analysisResult.ratePerSquareMeter?.toLocaleString() || "0"}</p>
                      <p className="text-sm mt-2">Rate per Square Meter: R{(analysisResult.analysis.purchasePrice / (analysisResult.floorArea || 1)).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Location Column */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Location</h2>
                {analysisResult && (
                  <div className="rounded-lg overflow-hidden bg-gray-100">
                    <PropertyMap address={analysisResult.address} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}