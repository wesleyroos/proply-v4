import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, TrendingUp, Home, Calendar, Loader2, ChevronRight, ArrowRight } from "lucide-react";

interface SuburbStats {
  total_sales: number;
  median_price: number | null;
  median_price_per_sqm: number | null;
  avg_floor_size: number | null;
  earliest_sale: string | null;
  latest_sale: string | null;
}

interface PropertyTypeBreakdown {
  property_type: string;
  count: number;
  avg_price: number;
  avg_price_per_sqm: number;
}

interface Sale {
  id: number;
  address: string;
  property_type: string | null;
  bedrooms: number | null;
  floor_size: number | null;
  sale_price: number;
  price_per_sqm: number | null;
  sale_date: string | null;
}

interface SuburbDetail {
  suburb: string;
  stats: SuburbStats;
  propertyTypes: PropertyTypeBreakdown[];
  recentSales: Sale[];
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return `R ${n.toLocaleString("en-ZA")}`;
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SuburbPage() {
  const params = useParams<{ suburb: string }>();
  const suburbSlug = params?.suburb ?? "";

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: SuburbDetail }>({
    queryKey: ["comparable-sales-suburb", suburbSlug],
    queryFn: () =>
      fetch(`/api/comparable-sales/suburb/${suburbSlug}`).then((r) => r.json()),
    enabled: !!suburbSlug,
    staleTime: 5 * 60 * 1000,
  });

  const detail = data?.data;
  const stats = detail?.stats;

  const displaySuburb = detail?.suburb
    ? titleCase(detail.suburb)
    : titleCase(suburbSlug.replace(/-/g, " "));

  const pageTitle = `Property Sales in ${displaySuburb} | Proply`;
  const pageDescription = stats?.total_sales
    ? `${stats.total_sales} title deed sales in ${displaySuburb}${stats.median_price ? ` | Median ${fmt(stats.median_price)}` : ""}${stats.median_price_per_sqm ? ` | ${fmt(stats.median_price_per_sqm)}/m²` : ""}.`
    : `Explore recent property sales in ${displaySuburb}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: displaySuburb,
    description: pageDescription,
    additionalProperty: [
      stats?.median_price && { "@type": "PropertyValue", name: "Median Sale Price", value: fmt(stats.median_price) },
      stats?.median_price_per_sqm && { "@type": "PropertyValue", name: "Median R/m²", value: fmt(stats.median_price_per_sqm) },
      stats?.total_sales && { "@type": "PropertyValue", name: "Total Sales", value: stats.total_sales },
    ].filter(Boolean),
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <PublicHeader />

      <main className="flex-1">
        {/* Hero — dark gradient */}
        <section className="relative py-16 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
              <Link href="/market" className="hover:text-white transition-colors">Market</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-300">{displaySuburb}</span>
            </div>
            <span className="inline-flex items-center bg-proply-blue/20 text-proply-blue text-sm font-medium px-3 py-1 rounded-full mb-4">
              <MapPin className="w-4 h-4 mr-1.5" />
              Suburb Data
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{displaySuburb}</h1>
            <p className="text-gray-300 text-base mt-2">
              Title deed sales sourced from South Africa's deeds office
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16 space-y-12">
          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          )}

          {isError && (
            <p className="text-center text-slate-500 py-20">Failed to load suburb data.</p>
          )}

          {!isLoading && !isError && detail && (
            <>
              {/* Stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="w-8 h-8 rounded-lg bg-proply-blue/10 flex items-center justify-center mb-3">
                      <TrendingUp className="w-4 h-4 text-proply-blue" />
                    </div>
                    <div className="text-sm text-slate-500 mb-1">Median Price</div>
                    <div className="text-2xl sm:text-3xl font-bold text-proply-blue">
                      {fmt(stats?.median_price ?? null)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="w-8 h-8 rounded-lg bg-proply-blue/10 flex items-center justify-center mb-3">
                      <Home className="w-4 h-4 text-proply-blue" />
                    </div>
                    <div className="text-sm text-slate-500 mb-1">Median R/m²</div>
                    <div className="text-2xl sm:text-3xl font-bold text-proply-blue">
                      {fmt(stats?.median_price_per_sqm ?? null)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="w-8 h-8 rounded-lg bg-proply-blue/10 flex items-center justify-center mb-3">
                      <MapPin className="w-4 h-4 text-proply-blue" />
                    </div>
                    <div className="text-sm text-slate-500 mb-1">Total Sales</div>
                    <div className="text-2xl sm:text-3xl font-bold text-proply-blue">
                      {stats?.total_sales ?? "—"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="w-8 h-8 rounded-lg bg-proply-blue/10 flex items-center justify-center mb-3">
                      <Calendar className="w-4 h-4 text-proply-blue" />
                    </div>
                    <div className="text-sm text-slate-500 mb-1">Latest Sale</div>
                    <div className="text-xl sm:text-2xl font-bold text-proply-blue">
                      {stats?.latest_sale ? stats.latest_sale.substring(0, 10) : "—"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Property type breakdown */}
              {detail.propertyTypes.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-proply-blue/10 text-proply-blue text-xs font-medium px-3 py-1 rounded-full">Breakdown</span>
                    <h2 className="text-xl font-bold text-slate-900">By Property Type</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {detail.propertyTypes.map((t) => (
                      <div
                        key={t.property_type}
                        className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-proply-blue/10 text-proply-blue text-xs font-semibold px-2 py-0.5 rounded-full">
                            {t.count}
                          </span>
                          <span className="font-semibold text-slate-800 text-sm">{t.property_type}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Avg {fmt(t.avg_price)}
                          {t.avg_price_per_sqm > 0 && ` · ${fmt(t.avg_price_per_sqm)}/m²`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent sales table */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-proply-blue/10 text-proply-blue text-xs font-medium px-3 py-1 rounded-full">Recent</span>
                  <h2 className="text-xl font-bold text-slate-900">
                    Recent Sales
                    <span className="text-slate-400 font-normal text-sm ml-2">(last {detail.recentSales.length})</span>
                  </h2>
                </div>
                <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-900">
                        <TableHead className="text-xs text-gray-300">Address</TableHead>
                        <TableHead className="text-xs text-gray-300">Type</TableHead>
                        <TableHead className="text-xs text-gray-300 text-right">Beds</TableHead>
                        <TableHead className="text-xs text-gray-300 text-right">Size m²</TableHead>
                        <TableHead className="text-xs text-gray-300 text-right">Sale Price</TableHead>
                        <TableHead className="text-xs text-gray-300 text-right">R/m²</TableHead>
                        <TableHead className="text-xs text-gray-300 text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.recentSales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-slate-50">
                          <TableCell className="max-w-[200px] truncate text-xs text-slate-700">
                            {sale.address}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {sale.property_type ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-slate-500">
                            {sale.bedrooms ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-slate-500">
                            {sale.floor_size ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold text-proply-blue">
                            {fmt(sale.sale_price)}
                          </TableCell>
                          <TableCell className="text-right text-xs text-slate-500">
                            {fmt(sale.price_per_sqm)}
                          </TableCell>
                          <TableCell className="text-right text-xs text-slate-400">
                            {sale.sale_date ? sale.sale_date.substring(0, 10) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Deal Score CTA */}
              <div className="bg-slate-900 rounded-2xl p-8 sm:p-10 text-center text-white">
                <span className="inline-flex items-center bg-proply-blue/20 text-proply-blue text-sm font-medium px-3 py-1 rounded-full mb-4">
                  Powered by Deal Score
                </span>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  Want an AI-powered analysis for a property in {displaySuburb}?
                </h3>
                <p className="text-gray-400 max-w-lg mx-auto mb-6">
                  Deal Score combines comparable sales data with AI to generate detailed property reports — valuations, neighbourhood insights, and investment scoring. Free to try.
                </p>
                <a
                  href="https://dealscore.co.za/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-proply-blue hover:bg-proply-blue/90 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                >
                  Try Deal Score free
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </>
          )}

          {!isLoading && !isError && !detail && (
            <p className="text-center text-slate-500 py-20">No data found for this suburb.</p>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
