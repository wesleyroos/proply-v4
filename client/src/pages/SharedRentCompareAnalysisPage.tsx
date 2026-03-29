import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import RentCompareReport from "@/components/RentCompareReport";
import { generateRentComparePDF } from "@/utils/rentComparePDF";

export default function SharedRentCompareAnalysisPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: property, isLoading, error } = useQuery({
    queryKey: ["/api/properties/shared", token],
    queryFn: async () => {
      const res = await fetch(`/api/properties/shared/${token}`);
      if (!res.ok) throw new Error("Analysis not found");
      return res.json();
    },
    enabled: !!token,
  });

  const handleDownloadPDF = async () => {
    if (!property) return;
    setIsExporting(true);
    try {
      await generateRentComparePDF(property);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading analysis…</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="border-red-200 bg-red-50 max-w-md w-full">
          <CardContent className="pt-6 flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              This shared analysis could not be found or may have expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Branded header ── */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src="/proply-logo-1.png" alt="Proply" className="h-8 object-contain" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-semibold text-slate-700">Rent Compare Report</p>
              <p className="text-[10px] text-slate-400">
                {new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-slate-700 border-slate-300"
              onClick={handleDownloadPDF}
              disabled={isExporting}
            >
              <FileText className="h-3.5 w-3.5" />
              {isExporting ? "Generating…" : "Download PDF"}
            </Button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-2.5 bg-slate-50 border-t border-slate-100">
          <p className="text-[13px] font-semibold text-slate-800 truncate">{property.title}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{property.address}</p>
        </div>
      </header>

      {/* ── Report content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <RentCompareReport property={property} />
      </div>

      {/* ── Branded footer ── */}
      <footer className="bg-white border-t border-slate-200 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src="/proply-logo-1.png" alt="Proply" className="h-7 object-contain opacity-70" />
            <p className="text-[12px] text-slate-500 text-center">
              This report was generated using{" "}
              <span className="font-semibold text-slate-700">Proply</span> — South Africa's property
              investment intelligence platform.
            </p>
            <p className="text-[11px] text-slate-400 whitespace-nowrap">
              © {new Date().getFullYear()} Proply Tech (Pty) Ltd
            </p>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 text-center leading-relaxed">
            Disclaimer: All figures are indicative only and based on inputs provided at the time of
            analysis. This report does not constitute financial, legal, or investment advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
