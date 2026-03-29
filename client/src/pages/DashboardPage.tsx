import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useProAccess } from "@/hooks/use-pro-access";
import { formatter } from "../utils/formatting";
import {
  Building2,
  Calculator,
  Home,
  ChartBar,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react";
import DashboardMap from "@/components/DashboardMap";
import BranchAdminDashboard from "./BranchAdminDashboard";
import FranchiseAdminDashboard from "./FranchiseAdminDashboard";

interface CompareProperty {
  id: number;
  title: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  longTermMonthly: number;
  shortTermAnnual: number;
  shortTermAfterFees: number;
  breakEvenOccupancy: number;
  shortTermNightly: number;
  annualOccupancy: number;
  createdAt: string;
}

interface AnalyzerProperty {
  id: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  purchasePrice: number;
  shortTermGrossYield: number | null;
  longTermGrossYield: number | null;
  longTermAnnualRevenue: number | null;
  shortTermAnnualRevenue: number | null;
  createdAt: string;
}

interface PropertyMapData {
  id: number;
  address: string;
  type: "analyzer" | "compare";
}

export default function DashboardPage() {
  const { user } = useUser();
  const { hasAccess: hasProAccess } = useProAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: analyzerProperties, isLoading: isLoadingAnalyzer } = useQuery<AnalyzerProperty[]>({
    queryKey: ["/api/property-analyzer/properties", user?.id],
    enabled: !!user?.id,
  });

  const { data: compareProperties, isLoading: isLoadingCompare } = useQuery<CompareProperty[]>({
    queryKey: ["/api/properties", user?.id],
    enabled: !!user?.id,
  });

  if (user?.role === "branch_admin") return <BranchAdminDashboard />;
  if (user?.role === "franchise_admin") return <FranchiseAdminDashboard />;

  // ── Derived stats ─────────────────────────────────────────────────────────
  const analyzerCount  = analyzerProperties?.length || 0;
  const compareCount   = compareProperties?.length  || 0;
  const totalProperties = analyzerCount + compareCount;

  const averageYields = analyzerProperties?.reduce(
    (acc, p) => {
      if (p.shortTermGrossYield !== null && !isNaN(Number(p.shortTermGrossYield))) {
        acc.shortTerm.sum += Number(p.shortTermGrossYield);
        acc.shortTerm.count++;
      }
      if (p.longTermGrossYield !== null && !isNaN(Number(p.longTermGrossYield))) {
        acc.longTerm.sum += Number(p.longTermGrossYield);
        acc.longTerm.count++;
      }
      return acc;
    },
    { shortTerm: { sum: 0, count: 0 }, longTerm: { sum: 0, count: 0 } }
  );

  const avgShortTermYield = averageYields?.shortTerm.count > 0
    ? (averageYields.shortTerm.sum / averageYields.shortTerm.count).toFixed(1)
    : "—";
  const avgLongTermYield = averageYields?.longTerm.count > 0
    ? (averageYields.longTerm.sum / averageYields.longTerm.count).toFixed(1)
    : "—";

  const formatYield = (value: number | null) =>
    value === null || isNaN(Number(value)) ? "—" : `${Number(value).toFixed(1)}%`;

  const allProperties: PropertyMapData[] = [
    ...(analyzerProperties?.map((p) => ({ id: p.id, address: p.address, type: "analyzer" as const })) || []),
    ...(compareProperties?.map((p)  => ({ id: p.id, address: p.address, type: "compare"  as const })) || []),
  ];

  const today = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="px-4 sm:px-6 py-8 space-y-5">

        {/* ── Hero card ── */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-lg">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">
                Portfolio Overview
              </p>
              <h1 className="text-2xl font-bold text-white leading-tight">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
              <p className="text-slate-300 mt-1.5 text-sm">
                Here's a summary of your property portfolio and recent activity.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-5">
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-[11px] font-medium px-3 py-1.5 rounded-full">
                  <Building2 className="h-3 w-3" /> {analyzerCount} {analyzerCount === 1 ? "Analysis" : "Analyses"}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-[11px] font-medium px-3 py-1.5 rounded-full">
                  <ArrowUpDown className="h-3 w-3" /> {compareCount} {compareCount === 1 ? "Comparison" : "Comparisons"}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0 hidden sm:flex flex-col items-end gap-3">
              <div>
                <p className="text-slate-500 text-[10px] uppercase tracking-wide">Today</p>
                <p className="text-slate-200 text-sm font-semibold mt-0.5">{today}</p>
              </div>
              {!hasProAccess && (
                <Button
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-1.5"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI tiles ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Properties",
              value: String(totalProperties),
              sub:   `${analyzerCount} analyses · ${compareCount} comparisons`,
              bar:   "bg-slate-400",
              color: "text-slate-800",
            },
            {
              label: "Avg ST Gross Yield",
              value: avgShortTermYield === "—" ? "—" : `${avgShortTermYield}%`,
              sub:   `Across ${averageYields?.shortTerm.count || 0} properties`,
              bar:   "bg-blue-500",
              color: "text-blue-700",
            },
            {
              label: "Avg LT Gross Yield",
              value: avgLongTermYield === "—" ? "—" : `${avgLongTermYield}%`,
              sub:   `Across ${averageYields?.longTerm.count || 0} properties`,
              bar:   "bg-purple-500",
              color: "text-purple-700",
            },
            {
              label: "Properties on Map",
              value: String(allProperties.length),
              sub:   "Geocoded locations",
              bar:   "bg-emerald-500",
              color: "text-emerald-700",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`h-1 ${kpi.bar}`} />
              <div className="p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                <p className={`text-xl font-bold mt-2 leading-tight ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/property-analyzer">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-white" />
                    <h3 className="font-bold text-white text-[14px]">Property Analyzer</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <div className="px-5 py-3">
                <p className="text-[12px] text-slate-500">Analyse new investment opportunities with full financial modelling</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/rent-compare">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-white" />
                    <h3 className="font-bold text-white text-[14px]">Rent Compare</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-purple-200 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <div className="px-5 py-3">
                <p className="text-[12px] text-slate-500">Compare short-term vs long-term rental strategies side by side</p>
              </div>
            </div>
          </Link>

          <Link href="/properties">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-white" />
                    <h3 className="font-bold text-white text-[14px]">Properties</h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <div className="px-5 py-3">
                <p className="text-[12px] text-slate-500">View and manage all your analysed and compared properties</p>
              </div>
            </div>
          </Link>
        </div>

        {/* ── Recent properties + Map ── */}
        <div className="grid gap-5 md:grid-cols-2">

          {/* Left: recent tables */}
          <div className="space-y-5">

            {/* Recent Analyses */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-500" />
                  <h3 className="font-bold text-slate-800 text-[15px]">Recent Analyses</h3>
                </div>
                <Link href="/properties">
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-1 text-xs">
                    See all <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {isLoadingAnalyzer ? (
                  <p className="px-6 py-4 text-sm text-slate-400">Loading…</p>
                ) : !analyzerProperties?.length ? (
                  <div className="px-6 py-6 text-center">
                    <p className="text-sm text-slate-400 mb-3">No analyses yet.</p>
                    <Link href="/dashboard/property-analyzer">
                      <Button variant="outline" size="sm">Analyse your first property</Button>
                    </Link>
                  </div>
                ) : (
                  analyzerProperties
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 3)
                    .map((p) => (
                      <Link key={p.id} href={`/properties/analyzer/${p.id}`}>
                        <div className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-800 truncate">{p.address}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {p.bedrooms} bed · {p.bathrooms} bath
                              </p>
                            </div>
                            <p className="text-[13px] font-bold text-slate-700 shrink-0">
                              {formatter.format(p.purchasePrice)}
                            </p>
                          </div>
                          <div className="flex gap-4 mt-2">
                            <span className="text-[11px] text-blue-600 font-medium">
                              ST {formatYield(p.shortTermGrossYield)}
                            </span>
                            <span className="text-[11px] text-purple-600 font-medium">
                              LT {formatYield(p.longTermGrossYield)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                )}
              </div>
            </div>

            {/* Recent Comparisons */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-purple-500" />
                  <h3 className="font-bold text-slate-800 text-[15px]">Recent Comparisons</h3>
                </div>
                <Link href="/properties">
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 gap-1 text-xs">
                    See all <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {isLoadingCompare ? (
                  <p className="px-6 py-4 text-sm text-slate-400">Loading…</p>
                ) : !compareProperties?.length ? (
                  <div className="px-6 py-6 text-center">
                    <p className="text-sm text-slate-400 mb-3">No comparisons yet.</p>
                    <Link href="/dashboard/rent-compare">
                      <Button variant="outline" size="sm">Compare your first property</Button>
                    </Link>
                  </div>
                ) : (
                  compareProperties
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 3)
                    .map((p) => (
                      <Link key={p.id} href={`/properties/rent-compare/${p.id}`}>
                        <div className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-800 truncate">{p.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{p.address}</p>
                            </div>
                          </div>
                          <div className="flex gap-4 mt-2">
                            <span className="text-[11px] text-blue-600 font-medium">
                              ST {formatter.format(p.shortTermAfterFees)}/yr
                            </span>
                            <span className="text-[11px] text-purple-600 font-medium">
                              LT {formatter.format(p.longTermMonthly * 12)}/yr
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {p.annualOccupancy}% occupancy
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Map */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <h3 className="font-bold text-slate-800 text-[15px]">Property Locations</h3>
              <span className="text-[11px] text-slate-400 ml-1">{allProperties.length} properties</span>
            </div>
            <div className="h-[460px] relative">
              {allProperties.length > 0 ? (
                <DashboardMap properties={allProperties} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <TrendingUp className="h-8 w-8 text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">Your properties will appear here once analysed.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </div>
  );
}
