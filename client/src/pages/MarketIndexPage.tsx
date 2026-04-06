import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  TrendingUp,
  Loader2,
  Search,
  X,
  FileText,
  Database,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

interface SuburbSummary {
  suburb: string;
  province: string | null;
  suburbSlug: string;
  sale_count: number;
  avg_price: number;
  avg_price_per_sqm: number;
  latest_sale: string | null;
  recent_avg_price: number | null;
  prior_avg_price: number | null;
}

type SortBy = "active" | "price_asc" | "price_desc" | "sqm" | "growth";

function fmt(n: number): string {
  return `R ${n.toLocaleString("en-ZA")}`;
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `R${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R${Math.round(n / 1_000)}k`;
  return `R${n}`;
}

function computeGrowth(s: SuburbSummary): number | null {
  if (!s.recent_avg_price || !s.prior_avg_price || s.prior_avg_price === 0) return null;
  return ((s.recent_avg_price - s.prior_avg_price) / s.prior_avg_price) * 100;
}

function ShortlistCard({ s, stat }: { s: SuburbSummary; stat: React.ReactNode }) {
  return (
    <Link href={`/market/${s.suburbSlug}`}>
      <div className="flex-shrink-0 w-44 bg-white border border-slate-200 rounded-xl p-4 hover:border-proply-blue/40 hover:shadow-md transition-all cursor-pointer group">
        <div className="font-semibold text-slate-900 text-sm leading-tight mb-0.5 group-hover:text-proply-blue transition-colors line-clamp-2">
          {s.suburb}
        </div>
        {s.province && <div className="text-xs text-slate-400 mb-2">{s.province}</div>}
        <div className="mt-auto">{stat}</div>
      </div>
    </Link>
  );
}

function ShortlistRow({
  title,
  items,
  renderStat,
  emptyMessage,
}: {
  title: string;
  items: SuburbSummary[];
  renderStat: (s: SuburbSummary) => React.ReactNode;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return emptyMessage ? null : null;
  }
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900 mb-3">{title}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((s) => (
          <ShortlistCard key={s.suburb} s={s} stat={renderStat(s)} />
        ))}
      </div>
    </div>
  );
}

export default function MarketIndexPage() {
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("active");

  const { data, isLoading, isError } = useQuery<{ success: boolean; data: SuburbSummary[] }>({
    queryKey: ["comparable-sales-suburbs"],
    queryFn: () => fetch("/api/comparable-sales/suburbs").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const suburbs = data?.data ?? [];
  const totalSuburbs = suburbs.length;
  const totalSales = suburbs.reduce((sum, s) => sum + s.sale_count, 0);

  const provinces = Array.from(
    new Set(suburbs.map((s) => s.province).filter(Boolean) as string[])
  ).sort();

  const provinceSelected = province !== "";

  // Base set for shortlists — province-filtered when selected, otherwise all
  const shortlistBase = provinceSelected
    ? suburbs.filter((s) => s.province === province)
    : suburbs;

  const topActive = [...shortlistBase]
    .sort((a, b) => b.sale_count - a.sale_count)
    .slice(0, 12);

  const topAffordable = [...shortlistBase]
    .filter((s) => s.avg_price > 0 && s.sale_count >= 5)
    .sort((a, b) => a.avg_price - b.avg_price)
    .slice(0, 12);

  const topGrowth = [...shortlistBase]
    .map((s) => ({ ...s, growth: computeGrowth(s) }))
    .filter((s) => s.growth !== null && isFinite(s.growth) && s.sale_count >= 5)
    .sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0))
    .slice(0, 12);

  const provinceLabel = province || "all provinces";

  // Grid: only shown when province is selected
  const filtered = !provinceSelected
    ? []
    : (() => {
        const base = suburbs.filter((s) => {
          if (s.province !== province) return false;
          if (search.trim() && !s.suburb.toLowerCase().includes(search.toLowerCase())) return false;
          return true;
        });
        return [...base].sort((a, b) => {
          switch (sortBy) {
            case "active":    return b.sale_count - a.sale_count;
            case "price_asc": return a.avg_price - b.avg_price;
            case "price_desc":return b.avg_price - a.avg_price;
            case "sqm":       return b.avg_price_per_sqm - a.avg_price_per_sqm;
            case "growth": {
              const ga = computeGrowth(a) ?? -Infinity;
              const gb = computeGrowth(b) ?? -Infinity;
              return gb - ga;
            }
            default: return 0;
          }
        });
      })();

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
        <section className="relative py-20 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="container mx-auto px-4">
            <span className="inline-flex items-center bg-proply-blue/20 text-proply-blue text-sm font-medium px-3 py-1 rounded-full mb-5">
              <MapPin className="w-4 h-4 mr-1.5" />
              Market Data
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              Property Market Data
            </h1>
            <p className="text-lg text-gray-300 max-w-xl mb-8">
              Real title deed sale prices for South African suburbs — free, accurate, and updated as new reports are run.
            </p>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <Select value={province} onValueChange={(v) => { setProvince(v); setSearch(""); }}>
                <SelectTrigger className="w-full sm:w-64 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select a province to explore…" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {provinceSelected && (
                <>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search suburb…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 pr-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                    <SelectTrigger className="w-full sm:w-52 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Most active</SelectItem>
                      <SelectItem value="price_asc">Lowest price</SelectItem>
                      <SelectItem value="price_desc">Highest price</SelectItem>
                      <SelectItem value="sqm">Highest R/m²</SelectItem>
                      <SelectItem value="growth">Highest growth</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* Stats */}
            {!isLoading && (
              <div className="flex gap-10 mt-8">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-proply-blue">
                    {totalSales.toLocaleString("en-ZA")}
                  </div>
                  <div className="text-gray-400 text-sm mt-0.5">title deed sales</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-proply-blue">
                    {totalSuburbs}
                  </div>
                  <div className="text-gray-400 text-sm mt-0.5">suburbs</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Value proposition strip */}
        <section className="py-12 bg-white border-b border-slate-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-10 h-10 rounded-lg bg-proply-blue/10 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-proply-blue" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Real sale prices</h3>
                <p className="text-sm text-slate-500">From title deeds, not listing prices. What properties actually sold for.</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-lg bg-proply-blue/10 flex items-center justify-center mx-auto mb-3">
                  <Database className="w-5 h-5 text-proply-blue" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">100% free</h3>
                <p className="text-sm text-slate-500">LightStone charges for this data. We make it freely available to everyone.</p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-lg bg-proply-blue/10 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-5 h-5 text-proply-blue" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Make informed decisions</h3>
                <p className="text-sm text-slate-500">Stop guessing. See actual transaction data before buying, selling, or investing.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Shortlists + grid */}
        <section className="container mx-auto px-4 py-14 space-y-10">
          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          )}

          {isError && (
            <p className="text-center text-slate-500 py-20">Failed to load suburb data.</p>
          )}

          {!isLoading && !isError && (
            <>
              {/* Shortlists */}
              <div className="space-y-8">
                <div>
                  <p className="text-sm text-slate-500 mb-6">
                    {provinceSelected
                      ? `Showing highlights for ${province}`
                      : "Select a province above to browse all suburbs, or explore highlights below."}
                  </p>
                </div>

                <ShortlistRow
                  title={`Most Active${provinceSelected ? ` in ${province}` : ""}`}
                  items={topActive}
                  renderStat={(s) => (
                    <>
                      <div className="text-proply-blue font-bold text-sm">{s.sale_count} sales</div>
                      {s.avg_price > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5">{fmtShort(s.avg_price)} avg</div>
                      )}
                    </>
                  )}
                />

                <ShortlistRow
                  title={`Most Affordable${provinceSelected ? ` in ${province}` : ""}`}
                  items={topAffordable}
                  renderStat={(s) => (
                    <>
                      <div className="text-proply-blue font-bold text-sm">{fmtShort(s.avg_price)}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{s.sale_count} sales</div>
                    </>
                  )}
                />

                {topGrowth.length > 0 && (
                  <ShortlistRow
                    title={`Highest Growth${provinceSelected ? ` in ${province}` : ""}`}
                    items={topGrowth}
                    renderStat={(s) => {
                      const g = computeGrowth(s);
                      return (
                        <>
                          <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            {g !== null ? `+${g.toFixed(1)}%` : "—"}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">vs prior year</div>
                        </>
                      );
                    }}
                  />
                )}
              </div>

              {/* Province gate — full suburb grid */}
              {!provinceSelected && (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-proply-blue/10 mb-4">
                    <MapPin className="w-5 h-5 text-proply-blue" />
                  </div>
                  <p className="text-slate-500 text-sm">Select a province above to browse all suburbs.</p>
                </div>
              )}

              {provinceSelected && filtered.length === 0 && (
                <p className="text-center text-slate-400 py-10">
                  No suburbs found{search ? ` matching "${search}"` : ""}.
                </p>
              )}

              {provinceSelected && filtered.length > 0 && (
                <div>
                  <p className="text-sm text-slate-500 mb-4">
                    {filtered.length} {filtered.length === 1 ? "suburb" : "suburbs"} in {province}
                    {search ? ` matching "${search}"` : ""}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filtered.map((s) => {
                      const growth = computeGrowth(s);
                      return (
                        <Link key={s.suburb} href={`/market/${s.suburbSlug}`}>
                          <Card className="hover:shadow-md hover:border-proply-blue/30 transition-all cursor-pointer h-full group">
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-slate-900 text-base leading-tight group-hover:text-proply-blue transition-colors">
                                  {s.suburb}
                                </h3>
                                <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                                  {s.sale_count}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                {s.avg_price > 0 && (
                                  <div className="text-sm font-semibold text-proply-blue">
                                    {fmt(s.avg_price)}
                                  </div>
                                )}
                                {s.avg_price_per_sqm > 0 && (
                                  <div className="text-xs text-slate-400">
                                    {fmt(s.avg_price_per_sqm)}/m²
                                  </div>
                                )}
                                {growth !== null && (
                                  <div className={`text-xs font-medium flex items-center gap-0.5 ${growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                    <ArrowUpRight className="w-3 h-3" />
                                    {growth >= 0 ? "+" : ""}{growth.toFixed(1)}% YoY
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Deal Score CTA */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-flex items-center bg-proply-blue/20 text-proply-blue text-sm font-medium px-3 py-1 rounded-full mb-5">
              Powered by Deal Score
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Want a full AI analysis for a specific property?
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              Deal Score uses this comparable sales data to generate detailed AI-powered property reports — valuations, neighbourhood insights, and investment scoring. Free to try.
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
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
