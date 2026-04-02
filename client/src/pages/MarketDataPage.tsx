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
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Market Data</h1>
          <p className="text-muted-foreground">
            Title deed sale records sourced from Knowledge Factory.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Records", value: stats.total?.toLocaleString() ?? "0", icon: Database },
            { label: "Suburbs", value: stats.suburbs?.toLocaleString() ?? "0", icon: MapPin },
            { label: "Avg Sale Price", value: fmt(stats.avg_price), icon: DollarSign },
            { label: "Avg R/m²", value: stats.avg_price_per_sqm ? `R ${stats.avg_price_per_sqm.toLocaleString("en-ZA")}` : "—", icon: Maximize2 },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border px-4 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Filter panel */}
        <div className="bg-white rounded-xl border">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{activeFilterCount} active</Badge>
              )}
            </span>
            {filtersOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {filtersOpen && (
            <div className="px-5 pb-5 border-t pt-4">
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
                <Button onClick={applyFilters} size="sm">
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
        <div className="bg-white rounded-xl border overflow-hidden">
          {(isLoading || isFetching) && (
            <div className="flex items-center gap-2 px-5 py-3 border-b">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Address</TableHead>
                  <TableHead>Suburb</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Beds</TableHead>
                  <TableHead className="text-right">Size m²</TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => toggleSort("salePrice")}
                  >
                    Sale Price <SortIcon field="salePrice" />
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none"
                    onClick={() => toggleSort("pricePerSqm")}
                  >
                    R/m² <SortIcon field="pricePerSqm" />
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none whitespace-nowrap"
                    onClick={() => toggleSort("saleDate")}
                  >
                    Sale Date <SortIcon field="saleDate" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-12">
                      No records found. Records are populated automatically as comparable sales are fetched from Knowledge Factory.
                    </TableCell>
                  </TableRow>
                )}
                {sorted.map((row) => {
                  const ptLabel = PROPERTY_TYPES.find((t) => t.value === row.propertyType)?.label ?? row.propertyType ?? "—";
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm max-w-[220px] truncate" title={row.address}>
                        {row.address}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.suburb ?? "—"}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">{ptLabel}</span>
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {row.bedrooms ? parseFloat(row.bedrooms) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {row.floorSize ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-right font-semibold whitespace-nowrap">
                        {fmt(row.salePrice)}
                      </TableCell>
                      <TableCell className="text-sm text-right whitespace-nowrap">
                        {row.pricePerSqm ? `R ${row.pricePerSqm.toLocaleString("en-ZA")}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-right text-muted-foreground whitespace-nowrap">
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
            <div className="flex items-center justify-between px-5 py-3 border-t">
              <p className="text-xs text-muted-foreground">
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
  );
}

