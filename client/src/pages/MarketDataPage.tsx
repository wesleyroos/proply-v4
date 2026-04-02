import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  TrendingUp,
  MapPin,
  DollarSign,
  Maximize2,
  Loader2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ComparableSale {
  id: number;
  address: string;
  suburb: string | null;
  city: string | null;
  propertyType: string | null;
  bedrooms: string | null;
  bathrooms: string | null;
  floorSize: number | null;
  erfSize: number | null;
  salePrice: number;
  pricePerSqm: number | null;
  saleDate: string | null;
  source: string;
  titleDeedNo: string | null;
  latitude: string | null;
  longitude: string | null;
  seenCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  total: number;
  suburbs: number;
  cities: number;
  earliest_sale: string | null;
  latest_sale: string | null;
  avg_price: number | null;
  avg_price_per_sqm: number | null;
  min_price: number | null;
  max_price: number | null;
}

const PROPERTY_TYPES = [
  { value: "F", label: "Freehold" },
  { value: "S", label: "Sectional Title" },
  { value: "A", label: "Agricultural" },
  { value: "H", label: "Agricultural Holding" },
  { value: "C", label: "Gated Community" },
];

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return "R " + n.toLocaleString("en-ZA");
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return d.substring(0, 10);
}

export default function MarketDataPage() {
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    suburb: "",
    city: "",
    propertyType: "",
    minBeds: "",
    maxBeds: "",
    minSize: "",
    maxSize: "",
    minPrice: "",
    maxPrice: "",
    minPricePerSqm: "",
    maxPricePerSqm: "",
    fromDate: "",
    toDate: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [sortField, setSortField] = useState<"saleDate" | "salePrice" | "pricePerSqm">("saleDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const buildParams = useCallback(
    (f: typeof appliedFilters, p: number) => {
      const params = new URLSearchParams({ page: String(p), limit: "50" });
      Object.entries(f).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      return params.toString();
    },
    []
  );

  const { data: statsData } = useQuery<{ success: boolean; data: Stats }>({
    queryKey: ["comparable-sales-stats"],
    queryFn: () => fetch("/api/comparable-sales/stats").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isFetching } = useQuery<{
    success: boolean;
    data: ComparableSale[];
    pagination: Pagination;
  }>({
    queryKey: ["comparable-sales", appliedFilters, page],
    queryFn: () =>
      fetch(`/api/comparable-sales?${buildParams(appliedFilters, page)}`).then((r) => r.json()),
    staleTime: 60 * 1000,
  });

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const clearFilters = () => {
    const empty = Object.fromEntries(Object.keys(filters).map((k) => [k, ""])) as typeof filters;
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const rows = data?.data ?? [];
  const pagination = data?.pagination;
  const stats = statsData?.data;

  // Client-side sort (within current page)
  const sorted = [...rows].sort((a, b) => {
    let va: number, vb: number;
    if (sortField === "saleDate") {
      va = a.saleDate ? new Date(a.saleDate).getTime() : 0;
      vb = b.saleDate ? new Date(b.saleDate).getTime() : 0;
    } else if (sortField === "salePrice") {
      va = a.salePrice;
      vb = b.salePrice;
    } else {
      va = a.pricePerSqm ?? 0;
      vb = b.pricePerSqm ?? 0;
    }
    return sortDir === "desc" ? vb - va : va - vb;
  });

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30 ml-1 inline" />;
    return sortDir === "desc" ? (
      <ChevronDown className="h-3 w-3 ml-1 inline" />
    ) : (
      <ChevronUp className="h-3 w-3 ml-1 inline" />
    );
  }

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Market Data</h1>
          </div>
          <p className="text-sm text-slate-500 ml-11">
            Title deed sale records sourced from Knowledge Factory
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Records", value: stats.total?.toLocaleString() ?? "—", icon: Database },
              { label: "Suburbs", value: stats.suburbs?.toLocaleString() ?? "—", icon: MapPin },
              { label: "Avg Sale Price", value: fmt(stats.avg_price), icon: DollarSign },
              { label: "Avg R/m²", value: stats.avg_price_per_sqm ? `R ${stats.avg_price_per_sqm.toLocaleString("en-ZA")}` : "—", icon: Maximize2 },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                  <s.icon className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                  <p className="text-sm font-bold text-slate-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter panel */}
        <div className="bg-white rounded-xl border border-slate-100">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-700"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{activeFilterCount} active</Badge>
              )}
            </span>
            {filtersOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>

          {filtersOpen && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Suburb</label>
                  <Input
                    placeholder="e.g. Rondebosch"
                    value={filters.suburb}
                    onChange={(e) => setFilters((f) => ({ ...f, suburb: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">City</label>
                  <Input
                    placeholder="e.g. Cape Town"
                    value={filters.city}
                    onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Property Type</label>
                  <Select
                    value={filters.propertyType || "_all"}
                    onValueChange={(v) => setFilters((f) => ({ ...f, propertyType: v === "_all" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">All types</SelectItem>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Bedrooms</label>
                  <div className="flex gap-1">
                    <Input placeholder="Min" value={filters.minBeds} onChange={(e) => setFilters((f) => ({ ...f, minBeds: e.target.value }))} />
                    <Input placeholder="Max" value={filters.maxBeds} onChange={(e) => setFilters((f) => ({ ...f, maxBeds: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Floor Size (m²)</label>
                  <div className="flex gap-1">
                    <Input placeholder="Min" value={filters.minSize} onChange={(e) => setFilters((f) => ({ ...f, minSize: e.target.value }))} />
                    <Input placeholder="Max" value={filters.maxSize} onChange={(e) => setFilters((f) => ({ ...f, maxSize: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Sale Price (R)</label>
                  <div className="flex gap-1">
                    <Input placeholder="Min" value={filters.minPrice} onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))} />
                    <Input placeholder="Max" value={filters.maxPrice} onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">R/m²</label>
                  <div className="flex gap-1">
                    <Input placeholder="Min" value={filters.minPricePerSqm} onChange={(e) => setFilters((f) => ({ ...f, minPricePerSqm: e.target.value }))} />
                    <Input placeholder="Max" value={filters.maxPricePerSqm} onChange={(e) => setFilters((f) => ({ ...f, maxPricePerSqm: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Sale Date</label>
                  <div className="flex gap-1">
                    <Input type="date" value={filters.fromDate} onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))} />
                    <Input type="date" value={filters.toDate} onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={applyFilters} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Apply Filters
                </Button>
                {activeFilterCount > 0 && (
                  <Button onClick={clearFilters} size="sm" variant="outline">
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {(isLoading || isFetching) && (
            <div className="flex items-center gap-2 px-5 py-3 bg-indigo-50 border-b border-indigo-100">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
              <span className="text-xs text-indigo-600">Loading…</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-xs font-semibold text-slate-500 whitespace-nowrap">Address</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Suburb</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Type</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-right">Beds</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 text-right">Size m²</TableHead>
                  <TableHead
                    className="text-xs font-semibold text-slate-500 text-right cursor-pointer select-none"
                    onClick={() => toggleSort("salePrice")}
                  >
                    Sale Price <SortIcon field="salePrice" />
                  </TableHead>
                  <TableHead
                    className="text-xs font-semibold text-slate-500 text-right cursor-pointer select-none"
                    onClick={() => toggleSort("pricePerSqm")}
                  >
                    R/m² <SortIcon field="pricePerSqm" />
                  </TableHead>
                  <TableHead
                    className="text-xs font-semibold text-slate-500 text-right cursor-pointer select-none whitespace-nowrap"
                    onClick={() => toggleSort("saleDate")}
                  >
                    Sale Date <SortIcon field="saleDate" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-slate-400 py-12">
                      No records found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                )}
                {sorted.map((row) => {
                  const ptLabel = PROPERTY_TYPES.find((t) => t.value === row.propertyType)?.label ?? row.propertyType ?? "—";
                  return (
                    <TableRow key={row.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="text-xs text-slate-700 max-w-[220px] truncate" title={row.address}>
                        {row.address}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{row.suburb ?? "—"}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{ptLabel}</span>
                      </TableCell>
                      <TableCell className="text-xs text-right text-slate-600">
                        {row.bedrooms ? parseFloat(row.bedrooms) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right text-slate-600">
                        {row.floorSize ? `${row.floorSize}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold text-slate-800 whitespace-nowrap">
                        {fmt(row.salePrice)}
                      </TableCell>
                      <TableCell className="text-xs text-right text-slate-600 whitespace-nowrap">
                        {row.pricePerSqm ? `R ${row.pricePerSqm.toLocaleString("en-ZA")}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right text-slate-500 whitespace-nowrap">
                        {fmtDate(row.saleDate)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {((pagination.page - 1) * pagination.limit + 1).toLocaleString()}–
                {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()} of{" "}
                {pagination.total.toLocaleString()} records
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="text-xs h-7 px-2"
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="text-xs h-7 px-2"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

