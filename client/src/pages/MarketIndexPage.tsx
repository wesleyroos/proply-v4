import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, Loader2 } from "lucide-react";

interface SuburbSummary {
  suburb: string;
  suburbSlug: string;
  sale_count: number;
  avg_price: number;
  avg_price_per_sqm: number;
  latest_sale: string | null;
}

function fmt(n: number): string {
  return `R ${n.toLocaleString("en-ZA")}`;
}

export default function MarketIndexPage() {
  const { data, isLoading, isError } = useQuery<{ success: boolean; data: SuburbSummary[] }>({
    queryKey: ["comparable-sales-suburbs"],
    queryFn: () => fetch("/api/comparable-sales/suburbs").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const suburbs = data?.data ?? [];
  const totalSuburbs = suburbs.length;
  const totalSales = suburbs.reduce((sum, s) => sum + s.sale_count, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "South Africa Property Market Data by Suburb | Proply",
    description: `Browse real title deed sale prices across ${totalSuburbs} South African suburbs.`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalSuburbs,
      itemListElement: suburbs.slice(0, 50).map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: s.suburb,
        url: `https://app.proply.co.za/market/${s.suburbSlug}`,
      })),
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Helmet>
        <title>South Africa Property Market Data by Suburb | Proply</title>
        <meta
          name="description"
          content={`Browse real title deed sale prices across ${totalSuburbs} South African suburbs. Median prices, R/m² and recent sales — all free.`}
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white border-b border-slate-200 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
              <MapPin className="w-4 h-4" />
              <span>South Africa</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Property Market Data
            </h1>
            <p className="text-slate-600 max-w-xl">
              Real title deed sale prices sourced from South Africa's deeds office. Browse by suburb to see median prices, R/m² and recent sales.
            </p>
            {!isLoading && (
              <div className="flex gap-6 mt-6 text-sm">
                <div>
                  <span className="font-semibold text-slate-900">{totalSales.toLocaleString("en-ZA")}</span>
                  <span className="text-slate-500 ml-1">title deed sales</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">{totalSuburbs}</span>
                  <span className="text-slate-500 ml-1">suburbs</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 py-10">
          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          )}

          {isError && (
            <p className="text-center text-slate-500 py-20">Failed to load suburb data.</p>
          )}

          {!isLoading && !isError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suburbs.map((s) => (
                <Link key={s.suburb} href={`/market/${s.suburbSlug}`}>
                  <Card className="hover:shadow-md hover:border-blue-200 transition-all cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-slate-900 text-sm leading-tight">
                          {s.suburb}
                        </h3>
                        <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                          {s.sale_count} {s.sale_count === 1 ? "sale" : "sales"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-slate-500">
                        {s.avg_price > 0 && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Avg {fmt(s.avg_price)}</span>
                          </div>
                        )}
                        {s.avg_price_per_sqm > 0 && (
                          <div className="text-slate-400">
                            {fmt(s.avg_price_per_sqm)}/m²
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
