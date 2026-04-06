import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, TrendingUp, Home, Calendar, Loader2, ChevronRight } from "lucide-react";

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

  const displaySuburb = detail?.suburb ? titleCase(detail.suburb) : titleCase(suburbSlug.replace(/-/g, " "));

  const pageTitle = `Property Sales in ${displaySuburb} | Proply`;
  const pageDescription = stats?.total_sales
    ? `${stats.total_sales} title deed sales in ${displaySuburb}${stats.median_price ? ` | Median ${fmt(stats.median_price)}` : ""}${stats.median_price_per_sqm ? ` | ${fmt(stats.median_price_per_sqm)}/m²` : ""}.`
    : `Explore recent property sales in ${displaySuburb}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${displaySuburb}, ${displayCity}`,
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
        {/* Breadcrumb + hero */}
        <section className="bg-white border-b border-slate-200 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
              <Link href="/market" className="hover:text-slate-600 transition-colors">Market</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600">{displaySuburb}</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{displaySuburb}</h1>
            <p className="text-slate-500 text-sm">Title deed sales sourced from South Africa's deeds office</p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
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
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Median Price
                    </div>
                    <div className="text-lg font-bold text-slate-900">{fmt(stats?.median_price ?? null)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Home className="w-3.5 h-3.5" />
                      Median R/m²
                    </div>
                    <div className="text-lg font-bold text-slate-900">{fmt(stats?.median_price_per_sqm ?? null)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Total Sales
                    </div>
                    <div className="text-lg font-bold text-slate-900">{stats?.total_sales ?? "—"}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Latest Sale
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      {stats?.latest_sale ? stats.latest_sale.substring(0, 10) : "—"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Property type breakdown */}
              {detail.propertyTypes.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold text-slate-800 mb-3">By Property Type</h2>
                  <div className="flex flex-wrap gap-2">
                    {detail.propertyTypes.map((t) => (
                      <div
                        key={t.property_type}
                        className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{t.count}</Badge>
                          <span className="font-medium text-slate-800">{t.property_type}</span>
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
                <h2 className="text-base font-semibold text-slate-800 mb-3">
                  Recent Sales
                  <span className="text-slate-400 font-normal text-sm ml-2">(last {detail.recentSales.length})</span>
                </h2>
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs">Address</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs text-right">Beds</TableHead>
                        <TableHead className="text-xs text-right">Size m²</TableHead>
                        <TableHead className="text-xs text-right">Sale Price</TableHead>
                        <TableHead className="text-xs text-right">R/m²</TableHead>
                        <TableHead className="text-xs text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.recentSales.map((sale) => (
                        <TableRow key={sale.id} className="text-sm">
                          <TableCell className="max-w-[220px] truncate text-xs text-slate-700">
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
                          <TableCell className="text-right text-xs font-medium text-slate-900">
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

              {/* CTA */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
                <h3 className="font-semibold text-slate-900 mb-1">Need a full property valuation?</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Proply's AI-powered Property Analyzer uses comparable sales data like this to generate detailed valuation reports.
                </p>
                <Link href="/property-analyzer">
                  <span className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer">
                    Try Property Analyzer
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
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
