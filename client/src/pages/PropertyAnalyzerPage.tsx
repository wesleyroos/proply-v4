import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  AlertCircle,
  BarChart3,
  TrendingUp,
  Building2,
  MapPin,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import PropertyAnalyzerForm from "@/components/PropertyAnalyzerForm";
import PropertyMap from "@/components/PropertyMap";

export default function PropertyAnalyzerPage() {
  const { user } = useUser();
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [formData, setFormData] = useState(null);

  const handleAnalysisComplete = async (formData) => {
    try {
      setAnalysisError(null);
      setFormData(formData);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyze data");

      setAnalysisResult(data);
    } catch (error) {
      setAnalysisError(error.message);
      setAnalysisResult(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white fixed top-0 left-0 h-full">
        <div className="p-6">
          <h2 className="text-xl font-bold">Sidebar</h2>
          {/* Sidebar content */}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 bg-white">
        <div className="container mx-auto px-6 sm:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Property Analyzer</h1>

          {/* Form Section */}
          <div className="space-y-6">
            <PropertyAnalyzerForm onAnalysisComplete={handleAnalysisComplete} />

            {analysisError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent>
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm font-medium">Error: {analysisError}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysisResult && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Location and Photo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-indigo-500" />
                      Location & Photo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PropertyMap address={analysisResult.address} />
                  </CardContent>
                </Card>

                {/* Deal Structure */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-indigo-500" />
                      Deal Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{analysisResult.propertyDescription || "No description available"}</p>
                  </CardContent>
                </Card>

                {/* Revenue Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Revenue Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Short-term revenue: {analysisResult?.analysis?.shortTermAnnualRevenue}</p>
                    <p>Long-term revenue: {analysisResult?.analysis?.longTermAnnualRevenue}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}