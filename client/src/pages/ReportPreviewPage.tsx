import { useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, Bed, Bath, Car, Maximize2, MapPin, Calendar, Phone, Mail, User, Building2, TrendingUp, Home } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportData {
  property: {
    propdataId: string;
    address: string;
    price: string | number;
    bedrooms: number | null;
    bathrooms: number | null;
    garages: number | null;
    parking: number | null;
    erfSize: number | null;
    floorSize: number | null;
    propertyType: string | null;
    description: string | null;
    images: string[] | null;
    status: string;
    lastModified: string | null;
    agentName: string | null;
    agentEmail: string | null;
    agentPhone: string | null;
  };
  valuationReport: {
    valuationData: {
      summary?: string;
      valuations?: Array<{ type: string; formula: string; value: number }>;
      marketContext?: string;
      rentalPerformance?: {
        longTerm?: any;
        shortTerm?: any;
      };
    };
  } | null;
  rentalData: {
    financingAnalysisData?: any;
    cashflowAnalysisData?: any;
    annualPropertyAppreciationData?: any;
  } | null;
  branch: {
    franchiseName: string;
    branchName: string;
    logoUrl: string | null;
    primaryColor: string | null;
    companyName: string | null;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: any) =>
  n != null ? `R ${Number(n).toLocaleString("en-ZA")}` : "N/A";

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatPill({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-sm font-bold" style={{ color: accent || "inherit" }}>{value}</span>
      {sub && <span className="text-[11px] text-slate-400">{sub}</span>}
    </div>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: color }} />
      <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800">{title}</h2>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

function MiniCard({ label, value, sub, valueColor }: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5">{label}</div>
      <div className="text-[15px] font-bold leading-tight" style={{ color: valueColor || "#0d1b2a" }}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReportPreviewPage() {
  const [location] = useLocation();
  const propertyId = location.split("/").pop() || "";
  const headerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError } = useQuery<ReportData>({
    queryKey: ["report-data", propertyId],
    queryFn: async () => {
      const res = await fetch(`/api/propdata-reports/report-data/${propertyId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!propertyId,
    staleTime: Infinity,
  });

  const accentColor = data?.branch?.primaryColor || "#1ba2ff";

  const handleDownload = async () => {
    if (!propertyId) return;
    try {
      const res = await fetch(`/api/pdf-generate/${propertyId}`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proply_Report_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Failed to download PDF. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: accentColor, borderTopColor: "transparent" }}
          />
          <p className="text-slate-500 text-sm">Loading report…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <Home className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Report not found</h1>
          <p className="text-slate-500 text-sm">This report link is invalid or the property no longer exists.</p>
        </div>
      </div>
    );
  }

  const { property: p, valuationReport, rentalData: rd, branch } = data;
  const vd = (valuationReport?.valuationData as any) || null;
  const ltr = vd?.rentalPerformance?.longTerm;
  const str = vd?.rentalPerformance?.shortTerm;
  const price = Number(p.price) || 1;

  const ltrYieldRange =
    ltr?.minYield != null && ltr?.maxYield != null
      ? `${ltr.minYield}% – ${ltr.maxYield}%`
      : null;

  let strYieldRange: string | null = null;
  if (str && price) {
    const p25 = str.percentile25?.annual ? ((str.percentile25.annual / price) * 100).toFixed(1) : null;
    const p75 = str.percentile75?.annual ? ((str.percentile75.annual / price) * 100).toFixed(1) : null;
    if (p25 && p75) strYieldRange = `${p25}% – ${p75}%`;
  }

  const apprRate = rd?.annualPropertyAppreciationData?.finalAppreciationRate;
  const heroImage = (p.images as any)?.[0] || null;
  const dateStr = new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

  const ym = rd?.financingAnalysisData?.yearlyMetrics;
  const equityChartData = ym
    ? [1, 2, 3, 4, 5, 10, 20].map((y) => ({
        year: `Y${y}`,
        equity: Math.round(ym[`year${y}`]?.equityBuildup || 0),
        balance: Math.round(ym[`year${y}`]?.remainingBalance || 0),
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ── Sticky header ── */}
      <header ref={headerRef} className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {branch?.logoUrl && (
              <img src={branch.logoUrl} alt={branch.franchiseName} className="h-7 w-auto object-contain flex-shrink-0" />
            )}
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">
                Property Investment Report
              </span>
              {branch && (
                <span className="text-[11px] text-slate-600 font-medium truncate">{branch.branchName}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: accentColor }}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative bg-slate-900 overflow-hidden" style={{ minHeight: 340 }}>
        {heroImage && (
          <img src={heroImage} alt="Property" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        )}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${accentColor}55 0%, #0d1b2a99 100%)` }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12">
          {p.propertyType && (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
              style={{ background: `${accentColor}30`, color: accentColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
              {p.propertyType}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight mb-3">
            {p.address}
          </h1>
          {p.price && (
            <div className="mb-6">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">Asking Price</div>
              <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{fmt(p.price)}</div>
            </div>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {p.bedrooms != null && (
              <div className="flex items-center gap-2 text-white/80">
                <Bed className="w-4 h-4" />
                <span className="text-sm font-semibold">{p.bedrooms} Bedrooms</span>
              </div>
            )}
            {p.bathrooms != null && (
              <div className="flex items-center gap-2 text-white/80">
                <Bath className="w-4 h-4" />
                <span className="text-sm font-semibold">{p.bathrooms} Bathrooms</span>
              </div>
            )}
            {p.garages != null && (
              <div className="flex items-center gap-2 text-white/80">
                <Car className="w-4 h-4" />
                <span className="text-sm font-semibold">{p.garages} Garages</span>
              </div>
            )}
            {p.floorSize != null && (
              <div className="flex items-center gap-2 text-white/80">
                <Maximize2 className="w-4 h-4" />
                <span className="text-sm font-semibold">{p.floorSize} m² Floor</span>
              </div>
            )}
            {p.erfSize != null && (
              <div className="flex items-center gap-2 text-white/80">
                <Maximize2 className="w-4 h-4" />
                <span className="text-sm font-semibold">{p.erfSize} m² Erf</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Key metrics strip ── */}
      {(ltrYieldRange || strYieldRange || apprRate) && (
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-3 divide-x divide-slate-100 gap-y-4">
            {ltrYieldRange && (
              <div className="px-4 first:pl-0">
                <StatPill label="LTR Gross Yield" value={ltrYieldRange} sub="Long-term rental" accent={accentColor} />
              </div>
            )}
            {strYieldRange && (
              <div className="px-4">
                <StatPill label="STR Gross Yield" value={strYieldRange} sub="Short-term / Airbnb" accent="#16a34a" />
              </div>
            )}
            {apprRate != null && (
              <div className="px-4">
                <StatPill label="Appreciation Rate" value={`${apprRate}% / yr`} sub="Annual estimate" accent="#7c3aed" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Main content ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Valuation Analysis */}
        {vd && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <SectionHeader title="Valuation Analysis" color={accentColor} />
            {vd.summary && <p className="text-sm text-slate-600 leading-relaxed mb-6">{vd.summary}</p>}
            {vd.valuations?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Valuation Estimates</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Estimate Type</th>
                        <th className="text-center px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Formula</th>
                        <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Valuation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vd.valuations.map((v: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3 font-semibold text-slate-800">{v.type}</td>
                          <td className="px-4 py-3 text-center text-slate-500 text-xs">{v.formula || "N/A"}</td>
                          <td className="px-4 py-3 text-right font-bold" style={{ color: accentColor }}>{fmt(v.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {vd.marketContext && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Market Context</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{vd.marketContext}</p>
              </div>
            )}
          </div>
        )}

        {/* Rental Performance */}
        {vd?.rentalPerformance && (ltr || str) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <SectionHeader title="Rental Performance Analysis" color={accentColor} />
            {ltr && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Long-Term Rental</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <MiniCard label="Monthly Range" value={`${fmt(ltr.minRental)} – ${fmt(ltr.maxRental)}`} />
                  <MiniCard label="Gross Yield Range" value={`${ltr.minYield ?? "N/A"}% – ${ltr.maxYield ?? "N/A"}%`} valueColor="#16a34a" />
                  <MiniCard label="Annual Revenue" value={`${fmt(ltr.minRental ? ltr.minRental * 12 : null)} – ${fmt(ltr.maxRental ? ltr.maxRental * 12 : null)}`} />
                  <MiniCard label="Strategy" value="Long-term let" sub="12-month lease" />
                </div>
                {ltr.reasoning && <p className="text-sm text-slate-500 leading-relaxed">{ltr.reasoning}</p>}
              </div>
            )}
            {str && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Short-Term Rental (Airbnb)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {str.occupancy && <MiniCard label="Avg Occupancy" value={`${str.occupancy}%`} />}
                  {[
                    { key: "percentile25", label: "Conservative (25th)" },
                    { key: "percentile50", label: "Median (50th)" },
                    { key: "percentile75", label: "Premium (75th)" },
                  ]
                    .filter((l) => str[l.key]?.annual)
                    .map((l) => {
                      const yld = ((str[l.key].annual / price) * 100).toFixed(1);
                      return <MiniCard key={l.key} label={l.label} value={`${yld}%`} valueColor="#16a34a" />;
                    })}
                </div>
                {[
                  { key: "percentile25", label: "25th — Conservative" },
                  { key: "percentile50", label: "50th — Average" },
                  { key: "percentile75", label: "75th — Premium" },
                  { key: "percentile90", label: "90th — Luxury" },
                ].filter((l) => str[l.key]).some(Boolean) && (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Performance Level</th>
                          <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nightly Rate</th>
                          <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Monthly</th>
                          <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Annual</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { key: "percentile25", label: "25th — Conservative" },
                          { key: "percentile50", label: "50th — Average" },
                          { key: "percentile75", label: "75th — Premium" },
                          { key: "percentile90", label: "90th — Luxury" },
                        ]
                          .filter((l) => str[l.key])
                          .map((l) => {
                            const d = str[l.key];
                            const isMedian = l.key === "percentile50";
                            return (
                              <tr key={l.key} className={`border-b border-slate-50 last:border-0 ${isMedian ? "bg-blue-50/60" : ""}`}>
                                <td className={`px-4 py-3 ${isMedian ? "font-semibold" : ""}`}>{l.label}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{fmt(d.nightly)}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{fmt(d.monthly)}</td>
                                <td className={`px-4 py-3 text-right font-bold ${isMedian ? "" : "text-slate-700"}`} style={isMedian ? { color: accentColor } : {}}>
                                  {fmt(d.annual)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Financial Analysis */}
        {(rd?.financingAnalysisData || rd?.cashflowAnalysisData || rd?.annualPropertyAppreciationData) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <SectionHeader title="Financial Analysis" color={accentColor} />

            {rd?.financingAnalysisData?.financingParameters && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Financing Parameters</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {(() => {
                    const fin = rd.financingAnalysisData.financingParameters;
                    return (
                      <>
                        <MiniCard label="Deposit" value={fmt(Math.round(fin.depositAmount))} sub={`${fin.depositPercentage}% of purchase price`} />
                        <MiniCard label="Loan Amount" value={fmt(Math.round(fin.loanAmount))} />
                        <MiniCard label="Interest Rate" value={`${fin.interestRate}%`} sub="Prime-linked" />
                        <MiniCard label="Loan Term" value={`${fin.loanTerm} years`} />
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {ym && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Bond & Equity Schedule</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-100 mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Metric</th>
                        {[1, 2, 3, 4, 5, 10, 20].map((y) => (
                          <th key={y} className="text-right px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Y{y}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Monthly Bond Payment", key: "monthlyPayment" },
                        { label: "Equity Build-up", key: "equityBuildup" },
                        { label: "Remaining Balance", key: "remainingBalance" },
                      ].map(({ label, key }) => (
                        <tr key={key} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{label}</td>
                          {[1, 2, 3, 4, 5, 10, 20].map((y) => {
                            const v = Math.round(ym[`year${y}`]?.[key] || 0);
                            const isHighlight = (key === "equityBuildup" || key === "remainingBalance") && y >= 10;
                            return (
                              <td key={y} className={`px-3 py-3 text-right text-xs ${isHighlight ? "font-bold" : "text-slate-600"}`} style={isHighlight ? { color: accentColor } : {}}>
                                {fmt(v)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Equity Build-up vs. Remaining Balance</h3>
                <p className="text-xs text-slate-400 mb-4">Loan paydown and equity accumulation over the mortgage term</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={equityChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={accentColor} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(v) => v >= 1_000_000 ? `R${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `R${Math.round(v / 1000)}k` : `R${v}`}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip formatter={(value: any) => fmt(value)} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#64748b" }} formatter={(value) => value === "equity" ? "Equity Built" : "Remaining Balance"} />
                    <Area type="monotone" dataKey="equity" stroke={accentColor} strokeWidth={2.5} fill="url(#equityGrad)" dot={{ r: 3, fill: "white", stroke: accentColor, strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="balance" stroke="#94a3b8" strokeWidth={2.5} dot={{ r: 3, fill: "white", stroke: "#94a3b8", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {rd?.cashflowAnalysisData?.revenueGrowthTrajectory && (() => {
              const traj = rd.cashflowAnalysisData.revenueGrowthTrajectory;
              const pKeys = [
                { key: "percentile25", label: "STR 25th (Conservative)" },
                { key: "percentile50", label: "STR 50th (Median)" },
                { key: "percentile75", label: "STR 75th (Optimistic)" },
                { key: "percentile90", label: "STR 90th (Premium)" },
              ].filter(({ key }) => traj.shortTerm?.[key]);
              const hasRows = pKeys.length > 0 || traj.longTerm;
              if (!hasRows) return null;
              return (
                <div className="mb-8">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Revenue Projections — 8% Annual Growth</h3>
                  <p className="text-xs text-slate-400 mb-4">Projected annual revenue and gross yields over five years</p>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Strategy</th>
                          {["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"].map((h) => (
                            <th key={h} className="text-right px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pKeys.map(({ key, label }) => {
                          const pd = traj.shortTerm[key];
                          const isMedian = key === "percentile50";
                          return (
                            <>
                              <tr key={`${key}-rev`} className={`border-b border-slate-50 ${isMedian ? "bg-blue-50/40" : ""}`}>
                                <td className={`px-4 py-2.5 ${isMedian ? "font-semibold" : "text-slate-600"}`}>{label} — Revenue</td>
                                {[1, 2, 3, 4, 5].map((y) => (
                                  <td key={y} className={`px-3 py-2.5 text-right text-xs ${isMedian ? "font-semibold" : "text-slate-600"}`}>
                                    {fmt(Math.round(pd[`year${y}`]?.revenue || 0))}
                                  </td>
                                ))}
                              </tr>
                              <tr key={`${key}-yld`} className={`border-b border-slate-50 ${isMedian ? "bg-blue-50/40" : ""}`}>
                                <td className={`px-4 py-2.5 ${isMedian ? "font-semibold" : "text-slate-600"}`}>{label} — Gross Yield</td>
                                {[1, 2, 3, 4, 5].map((y) => (
                                  <td key={y} className={`px-3 py-2.5 text-right text-xs ${isMedian ? "font-semibold" : "text-slate-600"}`} style={isMedian ? { color: "#16a34a" } : {}}>
                                    {(pd[`year${y}`]?.grossYield || 0).toFixed(1)}%
                                  </td>
                                ))}
                              </tr>
                            </>
                          );
                        })}
                        {traj.longTerm && (
                          <>
                            <tr className="border-b border-slate-50">
                              <td className="px-4 py-2.5 text-slate-600">Long-term — Revenue</td>
                              {[1, 2, 3, 4, 5].map((y) => (
                                <td key={y} className="px-3 py-2.5 text-right text-xs text-slate-600">{fmt(Math.round(traj.longTerm[`year${y}`]?.revenue || 0))}</td>
                              ))}
                            </tr>
                            <tr>
                              <td className="px-4 py-2.5 text-slate-600">Long-term — Gross Yield</td>
                              {[1, 2, 3, 4, 5].map((y) => (
                                <td key={y} className="px-3 py-2.5 text-right text-xs text-slate-600">{(traj.longTerm[`year${y}`]?.grossYield || 0).toFixed(1)}%</td>
                              ))}
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {rd?.annualPropertyAppreciationData && (() => {
              const appr = rd.annualPropertyAppreciationData;
              const keys = ["year1", "year2", "year3", "year4", "year5", "year10", "year20"].filter((k) => appr.yearlyValues?.[k]);
              return (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Property Value Appreciation</h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold bg-green-50 text-green-700 mb-4">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Annual appreciation rate: {appr.finalAppreciationRate ?? "N/A"}%
                  </div>
                  {keys.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-slate-100 mb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Metric</th>
                            {keys.map((k) => (
                              <th key={k} className="text-right px-3 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Year {k.replace("year", "")}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-3 font-semibold text-slate-800">Estimated Value</td>
                            {keys.map((k) => {
                              const isLong = k === "year10" || k === "year20";
                              return (
                                <td key={k} className={`px-3 py-3 text-right text-xs ${isLong ? "font-bold" : "text-slate-600"}`} style={isLong ? { color: accentColor } : {}}>
                                  {fmt(Math.round(appr.yearlyValues[k]))}
                                </td>
                              );
                            })}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  {appr.reasoning && <p className="text-sm text-slate-500 leading-relaxed">{appr.reasoning}</p>}
                </div>
              );
            })()}
          </div>
        )}

        {/* Additional Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <SectionHeader title="Additional Details" color={accentColor} />
          <div className="grid sm:grid-cols-2 gap-8">
            {(p.agentName || p.agentEmail || p.agentPhone) && (
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Agent Information</h3>
                <div className="space-y-2.5">
                  {p.agentName && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-700">
                      <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      {p.agentName}
                    </div>
                  )}
                  {p.agentPhone && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <a href={`tel:${p.agentPhone}`} className="hover:underline">{p.agentPhone}</a>
                    </div>
                  )}
                  {p.agentEmail && (
                    <div className="flex items-center gap-2.5 text-sm text-slate-700">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <a href={`mailto:${p.agentEmail}`} className="hover:underline">{p.agentEmail}</a>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Listing Information</h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  Property ID: {p.propdataId}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  Status: {p.status}
                </div>
                {p.lastModified && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-700">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    Last Updated: {new Date(p.lastModified).toLocaleDateString("en-ZA")}
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-6 pt-6 border-t border-slate-100">
            Report generated {dateStr} by Proply Tech (Pty) Ltd.
          </p>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-white mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <img
                src="/proply-logo-auth.png"
                alt="Proply"
                className="h-6 w-auto object-contain brightness-0 invert"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="text-white/40 text-xs">© {new Date().getFullYear()} Proply Tech (Pty) Ltd</span>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: accentColor }}
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </button>
          </div>
          <div className="border-t border-white/10 pt-6">
            <p className="text-[11px] text-white/40 leading-relaxed">
              <span className="text-white/60 font-semibold uppercase tracking-wider text-[9px] block mb-2">
                Disclaimers &amp; Legal Notices
              </span>
              The information in this report is provided by Proply Tech (Pty) Ltd for informational
              purposes only. While every effort is made to ensure accuracy, we cannot guarantee the
              absolute accuracy or completeness of the data. This report does not constitute
              financial, investment, legal, or professional advice. Property investment carries
              inherent risks and market conditions can change. Any decisions made based on this
              information are solely the responsibility of the user. Proply Tech (Pty) Ltd
              expressly disclaims any liability for direct, indirect, incidental, or consequential
              damages arising from use of this report. Projections and estimates are indicative only
              and based on data available at the time of generation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
