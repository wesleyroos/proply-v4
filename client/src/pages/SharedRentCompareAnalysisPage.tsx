import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Building2,
  TrendingUp,
} from "lucide-react";
import PropertyMap from "@/components/PropertyMap";
import ComparisonChart from "@/components/ComparisonChart";
import { formatter } from "@/utils/formatting";

export default function SharedRentCompareAnalysisPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data: property, isLoading, error } = useQuery({
    queryKey: ["/api/properties/shared", token],
    queryFn: async () => {
      const res = await fetch(`/api/properties/shared/${token}`);
      if (!res.ok) throw new Error("Analysis not found");
      return res.json();
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading analysis...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="border-red-200 bg-red-50 max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">
                This shared analysis could not be found or may have expired.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shortTermNightly = Number(property.shortTermNightly || 0);
  const annualOccupancy = Number(property.annualOccupancy || 0);
  const managementFee = Number(property.managementFee || 0);
  const longTermMonthly = Number(property.longTermMonthly || 0);
  const longTermAnnual = Number(property.longTermAnnual || 0);
  const shortTermMonthly = Number(property.shortTermMonthly || 0);
  const shortTermAnnual = Number(property.shortTermAnnual || 0);
  const shortTermAfterFees = Number(property.shortTermAfterFees || 0);
  const breakEvenOccupancy = Number(property.breakEvenOccupancy || 0);

  const platformFee = managementFee > 0 ? 15 : 3;

  const comparisonData = {
    title: property.title,
    longTermMonthly,
    shortTermMonthly,
    longTermAnnual,
    shortTermAnnual,
    shortTermAfterFees,
    breakEvenOccupancy,
    shortTermNightly,
    managementFee,
    annualOccupancy,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Branded header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src="/proply-logo-1.png" alt="Proply" className="h-8 object-contain" />
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">Rent Compare Report</p>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-3 bg-slate-50 border-t">
          <h1 className="text-xl font-bold text-slate-900">{property.title} — {property.address}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Shared via Proply · Property Investment Intelligence</p>
        </div>
      </div>

      <div className="px-6 py-8 space-y-6 max-w-7xl mx-auto">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden">
                <PropertyMap address={property.address} />
              </div>
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">Bedrooms</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">Bathrooms</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{property.bathrooms}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Long-Term Monthly Rental</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{formatter.format(longTermMonthly)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Short-Term Nightly Rate</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{formatter.format(shortTermNightly)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Annual Occupancy</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{annualOccupancy}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">Short-Term Annual (gross)</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{formatter.format(shortTermAnnual)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Short-Term Annual (after fees)</p>
                <p className="mt-1 text-2xl font-bold text-green-700">{formatter.format(shortTermAfterFees)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Long-Term Annual</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{formatter.format(longTermAnnual)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Break-Even Occupancy</p>
                <p className={`mt-1 text-2xl font-bold ${breakEvenOccupancy < annualOccupancy ? "text-green-700" : "text-orange-600"}`}>
                  {breakEvenOccupancy.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Fees</p>
                <p className="mt-1 text-sm text-slate-700">
                  Platform: {platformFee}%
                  {managementFee > 0 && ` · Management: ${managementFee}%`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Short-Term vs Long-Term Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonChart data={comparisonData} address={property.address} />
          </CardContent>
        </Card>

      </div>

      {/* Branded footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src="/proply-logo-1.png" alt="Proply" className="h-7 object-contain opacity-80" />
            <p className="text-sm text-muted-foreground text-center">
              This report was generated using <span className="font-semibold text-slate-700">Proply</span> — South Africa's property investment intelligence platform.
            </p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              © {new Date().getFullYear()} Proply Tech (Pty) Ltd
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Disclaimer: All figures are indicative only and based on inputs provided at the time of analysis. This report does not constitute financial, legal, or investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}
