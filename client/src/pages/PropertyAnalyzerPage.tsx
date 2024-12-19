import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, BarChart3, TrendingUp, Building2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import PropertyAnalyzerForm from "@/components/PropertyAnalyzerForm";

interface AnalysisResult {
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  propertyDescription?: string;
  deposit?: number;
  depositPercentage?: number;
  interestRate?: number;
  monthlyBondRepayment?: number;
  analysis: {
    shortTermAnnualRevenue: number | null;
    longTermAnnualRevenue: number | null;
    purchasePrice: number;
  };
}

export default function PropertyAnalyzerPage() {
  const { user } = useUser();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalysisComplete = async (formData: any) => {
    try {
      setAnalysisError(null); // Clear any previous errors
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          purchasePrice: formData.purchasePrice,
          airbnbNightlyRate: formData.airbnbNightlyRate,
          occupancyRate: formData.occupancyRate,
          longTermRental: formData.longTermRental,
          leaseCycleGap: formData.leaseCycleGap
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Analysis failed: ${response.statusText}`);
      }

      setAnalysisResult(data);
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
        {/* Deal Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Deal Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Deal Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Property Description</h3>
                <p className="mt-1">
                  {analysisResult?.propertyDescription || "No description available"}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Purchase Price</h3>
                <p className="mt-1 text-lg font-semibold">
                  R{analysisResult?.analysis.purchasePrice?.toLocaleString() || "0"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Deposit</h3>
                <p className="mt-1">
                  R{analysisResult?.deposit?.toLocaleString() || "0"} 
                  ({analysisResult?.depositPercentage || "0"}%)
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Interest Rate</h3>
                <p className="mt-1">{analysisResult?.interestRate || "0"}%</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Monthly Bond Repayment</h3>
                <p className="mt-1">R{analysisResult?.monthlyBondRepayment?.toLocaleString() || "0"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Performance - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Revenue Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {/* To be implemented */}
            </CardContent>
          </Card>

          {/* Location - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Location</CardTitle>
            </CardHeader>
            <CardContent>
              {/* To be implemented */}
            </CardContent>
          </Card>
        </div>

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                Based on your provided property details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Short-Term Rental Yield
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.shortTermGrossYield !== null ? (
                      <>
                        <div className="text-2xl font-bold">
                          {analysisResult.shortTermGrossYield.toFixed(2)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Annual Revenue: R{analysisResult.analysis.shortTermAnnualRevenue?.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Based on nightly rate × occupancy
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not enough data for short-term calculation
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Long-Term Rental Yield
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.longTermGrossYield !== null ? (
                      <>
                        <div className="text-2xl font-bold">
                          {analysisResult.longTermGrossYield.toFixed(2)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Annual Revenue: R{analysisResult.analysis.longTermAnnualRevenue?.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Adjusted for lease cycle gap
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Not enough data for long-term calculation
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Property Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R{analysisResult.analysis.purchasePrice.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}