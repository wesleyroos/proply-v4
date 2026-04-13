import { useRef, useState, useEffect, useCallback } from "react";
import { initGoogleMaps } from "../lib/maps";
import PropertyMap from "../components/PropertyMap";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, Bed, Bath, Car, Maximize2, MapPin, Calendar, Phone, Mail, User, Building2, TrendingUp, Home, ChevronDown, Pencil, Save, X } from "lucide-react";
import { AiAdvisor } from "../components/AiAdvisor";

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
    comparableSalesData?: {
      titleDeedProperties: any[];
      properties: any[];
      averageSalePrice: number;
      dataSource: string;
    } | null;
    manualOverrides?: Record<string, boolean> | null;
    lastEditedAt?: string | null;
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

function AccordionSection({ title, color, open, onToggle, children }: {
  title: string;
  color: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-6 sm:px-8 py-5 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 flex-1">{title}</span>
        <ChevronDown
          className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="px-6 sm:px-8 pb-8 pt-1 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

function EditableNumber({ value, onChange, editing, prefix = "", suffix = "", className = "" }: {
  value: number | null;
  onChange: (v: number) => void;
  editing: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  if (!editing) return null; // Caller renders display mode
  return (
    <div className="relative inline-flex items-center">
      {prefix && <span className="text-slate-400 text-xs mr-1">{prefix}</span>}
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`border border-blue-300 rounded px-2 py-1 text-sm font-semibold bg-blue-50 focus:ring-2 focus:ring-blue-400 focus:outline-none w-32 ${className}`}
      />
      {suffix && <span className="text-slate-400 text-xs ml-1">{suffix}</span>}
    </div>
  );
}

function ComparableSalesMap({ subjectAddress, properties }: {
  subjectAddress: string;
  properties: Array<{ address: string; latitude?: number; longitude?: number; salePrice?: number }>;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await initGoogleMaps();
        if (!isMounted || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          zoom: 14,
          center: { lat: -33.918861, lng: 18.4233 },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'cooperative',
        });

        // Geocode subject property and add primary marker
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: subjectAddress }, (results: any, status: any) => {
          if (!isMounted) return;
          if (status === 'OK' && results?.[0]) {
            const pos = results[0].geometry.location;
            map.setCenter(pos);
            new google.maps.Marker({
              map,
              position: pos,
              title: subjectAddress,
              label: { text: '★', color: 'white', fontSize: '14px' },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: '#1e40af',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              },
            });
          }
        });

        // Plot comparable sales that have coordinates
        const plotted = properties.filter(p => p.latitude && p.longitude);
        plotted.forEach((p, i) => {
          const pos = { lat: p.latitude!, lng: p.longitude! };
          const marker = new google.maps.Marker({
            map,
            position: pos,
            title: p.address,
            label: { text: String(i + 1), color: 'white', fontSize: '11px', fontWeight: 'bold' },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#64748b',
              fillOpacity: 0.9,
              strokeColor: 'white',
              strokeWeight: 1.5,
            },
          });
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="font-size:12px;max-width:200px">
              <div style="font-weight:600">${p.address}</div>
              ${p.salePrice ? `<div style="color:#1e40af;font-weight:700">R${p.salePrice.toLocaleString()}</div>` : ''}
            </div>`,
          });
          marker.addListener('click', () => infoWindow.open(map, marker));
        });
      } catch (e) {
        if (isMounted) setError('Map unavailable');
      }
    };

    init();
    return () => { isMounted = false; };
  }, [subjectAddress, properties]);

  if (error) return null;

  return <div ref={mapRef} className="w-full rounded-xl overflow-hidden border border-slate-100" style={{ height: 320 }} />;
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

// ─── Image Lightbox ───────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Previous */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-xl z-10"
        onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); }}
      >‹</button>

      {/* Image */}
      <img
        src={images[index]}
        alt={`Photo ${index + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-xl z-10"
        onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % images.length); }}
      >›</button>

      {/* Counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-semibold px-3 py-1 rounded-full">
        {index + 1} / {images.length}
      </div>

      {/* Close */}
      <button
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-lg"
        onClick={onClose}
      >✕</button>
    </div>
  );
}

// ─── Image Gallery ────────────────────────────────────────────────────────────
function ImageGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const mainImg = images[activeIndex];
  const thumbs = images.slice(0, 5);

  return (
    <>
      {lightboxIndex !== null && (
        <Lightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
      <div className="flex flex-col gap-1.5">
        <div
          className="relative w-full rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in"
          style={{ aspectRatio: "16/10" }}
          onClick={() => setLightboxIndex(activeIndex)}
        >
          <img src={mainImg} alt="Property" className="w-full h-full object-cover" />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i - 1 + images.length) % images.length); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors text-sm"
              >‹</button>
              <button
                onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i + 1) % images.length); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors text-sm"
              >›</button>
              <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {activeIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
        {thumbs.length > 1 && (
          <div className="grid grid-cols-5 gap-1">
            {thumbs.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                onDoubleClick={() => setLightboxIndex(i)}
                className={`rounded-lg overflow-hidden border-2 transition-all ${i === activeIndex ? "border-slate-700 opacity-100" : "border-transparent opacity-60 hover:opacity-90"}`}
                style={{ aspectRatio: "1" }}
              >
                <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Outlier Detection ────────────────────────────────────────────────────────
// Returns a boolean[] where true = outlier.
// Uses median-ratio (works for any count ≥ 2) then IQR for larger sets.
function detectOutliers(rows: any[]): boolean[] {
  const sqmValues = rows.map((r) => (r.pricePerSqM != null && r.pricePerSqM > 0 ? r.pricePerSqM : null));
  const valid = sqmValues.filter((v): v is number => v !== null);
  if (valid.length < 2) return rows.map(() => false);

  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  // Flag anything < 45% or > 220% of the median (catches classic data-entry errors)
  const lo = median * 0.45;
  const hi = median * 2.2;

  // For 4+ values also apply IQR and take the union
  let iqrLo = -Infinity, iqrHi = Infinity;
  if (valid.length >= 4) {
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    iqrLo = q1 - 1.5 * iqr;
    iqrHi = q3 + 1.5 * iqr;
  }

  return sqmValues.map((v) =>
    v !== null && (v < lo || v > hi || v < iqrLo || v > iqrHi)
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReportPreviewPage() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const propertyId = location.split("/").pop()?.split("?")[0] || "";
  const headerRef = useRef<HTMLDivElement>(null);

  // Edit mode
  const editToken = new URLSearchParams(window.location.search).get("edit");
  const canEdit = !!editToken;
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editDraft, setEditDraft] = useState<{
    valuations?: Array<{ type: string; formula: string; value: number }>;
    longTermMinRental?: number;
    longTermMaxRental?: number;
    floorSize?: number;
    bedrooms?: number;
    bathrooms?: number;
  }>({});

  const startEditing = useCallback(() => {
    setEditDraft({});
    setIsEditing(true);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditDraft({});
    setIsEditing(false);
  }, []);

  const hasPendingEdits = Object.keys(editDraft).length > 0;

  const saveEdits = useCallback(async () => {
    if (!hasPendingEdits || !editToken) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/propdata-reports/report-data/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editToken, ...editDraft }),
      });
      if (!res.ok) throw new Error("Save failed");
      queryClient.invalidateQueries({ queryKey: ["report-data", propertyId] });
      setEditDraft({});
      setIsEditing(false);
    } catch {
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [editDraft, editToken, propertyId, hasPendingEdits, queryClient]);

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

  // Comparable sales selection state (auto-deselects outliers on first load)
  const [csSelected, setCsSelected] = useState<Set<number>>(new Set());
  const [csInitialized, setCsInitialized] = useState(false);

  // Accordion open/closed state — all closed by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    valuation: false,
    rental: false,
    comparables: false,
    financial: false,
    details: false,
  });
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (data && !csInitialized) {
      const cs = data.valuationReport?.comparableSalesData;
      const rows = cs?.titleDeedProperties?.length ? cs.titleDeedProperties : cs?.properties ?? [];
      if (rows.length > 0) {
        const outlierFlags = detectOutliers(rows);
        const initial = new Set(rows.map((_: any, i: number) => i).filter((i: number) => !outlierFlags[i]));
        setCsSelected(initial);
        setCsInitialized(true);
      }
    }
  }, [data, csInitialized]);

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
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
  const midlineValuation = vd?.valuations?.find((v: any) => v.type === "Midline (Proply est.)")?.value;
  const price = Number(p.price) || midlineValuation || 0;

  const ltrYieldRange =
    ltr?.minYield != null && ltr?.maxYield != null
      ? `${ltr.minYield}% – ${ltr.maxYield}%`
      : null;

  let strYieldRange: string | null = null;
  if (str && price > 0) {
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
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* ── Sticky header ── */}
      <header ref={headerRef} className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {branch?.logoUrl && (
              <img src={branch.logoUrl} alt={branch.franchiseName} className="h-10 w-auto object-contain flex-shrink-0" />
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
          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
                <button
                  onClick={saveEdits}
                  disabled={!hasPendingEdits || isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#16a34a" }}
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">{isSaving ? "Saving…" : "Save"}</span>
                </button>
              </>
            )}
            {!isEditing && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold flex-shrink-0 transition-opacity hover:opacity-90"
                style={{ background: accentColor }}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-slate-100 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 sm:px-8 py-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {p.status && (
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${
                  /evaluation|valuation/i.test(p.status)
                    ? 'border-slate-200 bg-slate-50 text-slate-500'
                    : p.status.toLowerCase() === 'sold'
                    ? 'border-red-100 bg-red-50 text-red-500'
                    : p.status.toLowerCase().includes('offer')
                    ? 'border-orange-100 bg-orange-50 text-orange-500'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  /evaluation|valuation/i.test(p.status) ? 'bg-slate-400' :
                  p.status.toLowerCase() === 'sold' ? 'bg-red-400' :
                  p.status.toLowerCase().includes('offer') ? 'bg-orange-400' : 'bg-slate-400'
                }`} />
                {p.status}
              </span>
            )}
            {p.propertyType && (
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: `${accentColor}18`, color: accentColor }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                {p.propertyType}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4">
            {p.address}
          </h1>
          {/evaluation|valuation/i.test(p.status ?? '') ? (
            (() => {
              const vals: any[] = vd?.valuations ?? [];
              const conservative = vals.find((v: any) => /conserv/i.test(v.type ?? ''))?.value ?? null;
              const optimistic = vals.find((v: any) => /optim/i.test(v.type ?? ''))?.value ?? null;
              const midline = vals.find((v: any) => /midline|mid/i.test(v.type ?? ''))?.value ?? midlineValuation ?? null;
              const hasRange = conservative != null && optimistic != null && conservative > 0 && optimistic > 0;
              const hasMidline = midline != null && midline > 0;
              if (!hasRange && !hasMidline) return null;
              return (
                <div className="mb-6">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Midline Estimate</div>
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: accentColor }}>
                    {fmt(hasMidline ? midline : (hasRange ? (conservative + optimistic) / 2 : null))}
                  </div>
                  {hasRange && (
                    <div className="text-xs text-slate-400 mt-1.5">
                      Range: {fmt(conservative)} – {fmt(optimistic)}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            p.price && Number(p.price) > 0 && (
              <div className="mb-6">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Asking Price</div>
                <div className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: accentColor }}>{fmt(p.price)}</div>
              </div>
            )
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {p.bedrooms != null && (
              <div className="flex items-center gap-2 text-slate-500">
                <Bed className="w-4 h-4" />
                {isEditing ? (
                  <input type="number" value={editDraft.bedrooms ?? p.bedrooms ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, bedrooms: parseFloat(e.target.value) || 0 }))} className="border border-blue-300 rounded px-2 py-1 text-sm font-semibold bg-blue-50 focus:ring-2 focus:ring-blue-400 focus:outline-none w-16" />
                ) : (
                  <span className="text-sm font-semibold">{p.bedrooms} Bedrooms</span>
                )}
              </div>
            )}
            {p.bathrooms != null && (
              <div className="flex items-center gap-2 text-slate-500">
                <Bath className="w-4 h-4" />
                {isEditing ? (
                  <input type="number" value={editDraft.bathrooms ?? p.bathrooms ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, bathrooms: parseFloat(e.target.value) || 0 }))} className="border border-blue-300 rounded px-2 py-1 text-sm font-semibold bg-blue-50 focus:ring-2 focus:ring-blue-400 focus:outline-none w-16" />
                ) : (
                  <span className="text-sm font-semibold">{p.bathrooms} Bathrooms</span>
                )}
              </div>
            )}
            {p.garages != null && (
              <div className="flex items-center gap-2 text-slate-500">
                <Car className="w-4 h-4" />
                <span className="text-sm font-semibold">{p.garages} Garages</span>
              </div>
            )}
            {(p.floorSize != null || isEditing) && (
              <div className="flex items-center gap-2 text-slate-500">
                <Maximize2 className="w-4 h-4" />
                {isEditing ? (
                  <span className="flex items-center gap-1">
                    <input type="number" value={editDraft.floorSize ?? p.floorSize ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, floorSize: parseFloat(e.target.value) || 0 }))} className="border border-blue-300 rounded px-2 py-1 text-sm font-semibold bg-blue-50 focus:ring-2 focus:ring-blue-400 focus:outline-none w-20" />
                    <span className="text-sm">m²</span>
                  </span>
                ) : (
                  <span className="text-sm font-semibold">{p.floorSize} m² Floor</span>
                )}
              </div>
            )}
            {p.erfSize != null && (
              <div className="flex items-center gap-2 text-slate-500">
                <Maximize2 className="w-4 h-4" />
                <span className="text-sm font-semibold">{p.erfSize} m² Erf</span>
              </div>
            )}
          </div>
        </div>
        </div>
      </section>

      {/* ── Manually adjusted banner ── */}
      {data.valuationReport?.manualOverrides && Object.keys(data.valuationReport.manualOverrides).length > 0 && !isEditing && (
        <section className="bg-slate-100 pb-2">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-2 text-xs text-amber-700">
              <Pencil className="w-3 h-3" />
              <span>Some values in this report have been manually adjusted from the original AI estimates.</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Key metrics strip ── */}
      {(ltrYieldRange || strYieldRange || apprRate) && (
        <section className="bg-slate-100 pb-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 sm:px-8 py-5 grid grid-cols-2 sm:grid-cols-3 divide-x divide-slate-100 gap-y-4">
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
          </div>
        </section>
      )}

      {/* ── Images + Map ── */}
      {(p.images?.length || p.address) && (
        <section className="bg-slate-100 pb-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Images */}
                {p.images && p.images.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <ImageGallery images={p.images as string[]} />
                  </div>
                )}
                {/* Map */}
                <div className={p.images && p.images.length > 0 ? "h-full min-h-[260px]" : "h-80"}>
                  <PropertyMap
                    address={p.address}
                    mapClassName="w-full h-full rounded-xl overflow-hidden border border-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Main content ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Valuation Analysis */}
        {vd && (
          <AccordionSection title="Valuation Analysis" color={accentColor} open={openSections.valuation} onToggle={() => toggleSection('valuation')}>
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
                        <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">Valuation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editDraft.valuations || vd.valuations).map((v: any, i: number) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-3 font-semibold text-slate-800">{v.type}</td>
                          <td className="px-4 py-3 text-center text-slate-500 text-xs">
                            {isEditing ? (
                              <input
                                type="text"
                                value={(editDraft.valuations || vd.valuations)[i].formula || ""}
                                onChange={(e) => {
                                  const updated = [...(editDraft.valuations || vd.valuations.map((x: any) => ({ ...x })))];
                                  updated[i] = { ...updated[i], formula: e.target.value };
                                  setEditDraft((d) => ({ ...d, valuations: updated }));
                                }}
                                className="border border-blue-300 rounded px-2 py-1 text-xs bg-blue-50 focus:ring-2 focus:ring-blue-400 focus:outline-none w-full max-w-xs"
                              />
                            ) : (v.formula || "N/A")}
                          </td>
                          <td className="px-4 py-3 text-right font-bold whitespace-nowrap" style={{ color: accentColor }}>
                            {isEditing ? (
                              <input
                                type="number"
                                value={(editDraft.valuations || vd.valuations)[i].value || ""}
                                onChange={(e) => {
                                  const updated = [...(editDraft.valuations || vd.valuations.map((x: any) => ({ ...x })))];
                                  updated[i] = { ...updated[i], value: parseFloat(e.target.value) || 0 };
                                  setEditDraft((d) => ({ ...d, valuations: updated }));
                                }}
                                className="border border-blue-300 rounded px-2 py-1 text-sm font-bold bg-blue-50 focus:ring-2 focus:ring-blue-400 focus:outline-none w-36 text-right"
                                style={{ color: accentColor }}
                              />
                            ) : fmt(v.value)}
                          </td>
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
          </AccordionSection>
        )}

        {/* Rental Performance */}
        {vd?.rentalPerformance && (ltr || str) && (
          <AccordionSection title="Rental Performance Analysis" color={accentColor} open={openSections.rental} onToggle={() => toggleSection('rental')}>
            {ltr && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Long-Term Rental</h3>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-blue-200">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">Min Monthly Rental</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-sm">R</span>
                        <input
                          type="number"
                          value={editDraft.longTermMinRental ?? ltr.minRental ?? ""}
                          onChange={(e) => setEditDraft((d) => ({ ...d, longTermMinRental: parseFloat(e.target.value) || 0 }))}
                          className="border border-blue-300 rounded px-2 py-1 text-sm font-semibold bg-blue-50 focus:ring-2 focus:ring-blue-400 focus:outline-none w-full"
                        />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-blue-200">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">Max Monthly Rental</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-sm">R</span>
                        <input
                          type="number"
                          value={editDraft.longTermMaxRental ?? ltr.maxRental ?? ""}
                          onChange={(e) => setEditDraft((d) => ({ ...d, longTermMaxRental: parseFloat(e.target.value) || 0 }))}
                          className="border border-blue-300 rounded px-2 py-1 text-sm font-semibold bg-blue-50 focus:ring-2 focus:ring-blue-400 focus:outline-none w-full"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <MiniCard label="Monthly Range" value={`${fmt(ltr.minRental)} – ${fmt(ltr.maxRental)}`} />
                    <MiniCard label="Gross Yield Range" value={`${ltr.minYield ?? "N/A"}% – ${ltr.maxYield ?? "N/A"}%`} valueColor="#16a34a" />
                    <MiniCard label="Annual Revenue" value={`${fmt(ltr.minRental ? ltr.minRental * 12 : null)} – ${fmt(ltr.maxRental ? ltr.maxRental * 12 : null)}`} />
                    <MiniCard label="Strategy" value="Long-term let" sub="12-month lease" />
                  </div>
                )}
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
          </AccordionSection>
        )}

        {/* Comparable Sales */}
        {(() => {
          const cs = data.valuationReport?.comparableSalesData;
          const rows = cs?.titleDeedProperties?.length ? cs.titleDeedProperties : cs?.properties ?? [];
          if (!rows.length) return null;

          const outlierFlags = detectOutliers(rows);
          const allSelected = rows.every((_: any, i: number) => csSelected.has(i));
          const selectedRows = rows.filter((_: any, i: number) => csSelected.has(i));
          const avgPrice = selectedRows.length > 0
            ? Math.round(selectedRows.reduce((s: number, r: any) => s + (r.salePrice ?? 0), 0) / selectedRows.length)
            : 0;
          const sqmRows = selectedRows.filter((r: any) => r.pricePerSqM != null && r.pricePerSqM > 0);
          const avgSqm = sqmRows.length > 0
            ? Math.round(sqmRows.reduce((s: number, r: any) => s + r.pricePerSqM, 0) / sqmRows.length)
            : 0;

          const toggleRow = (i: number) => {
            setCsSelected((prev) => {
              const next = new Set(prev);
              next.has(i) ? next.delete(i) : next.add(i);
              return next;
            });
          };
          const toggleAll = () => {
            setCsSelected(allSelected ? new Set() : new Set(rows.map((_: any, i: number) => i)));
          };
          const deselectOutliers = () => {
            setCsSelected(new Set(rows.map((_: any, i: number) => i).filter((i: number) => !outlierFlags[i])));
          };

          return (
            <AccordionSection title="Comparable Sales" color={accentColor} open={openSections.comparables} onToggle={() => toggleSection('comparables')}>

              {/* Map */}
              <ComparableSalesMap
                subjectAddress={p.address}
                properties={rows.map((r: any) => ({
                  address: r.address,
                  latitude: r.latitude,
                  longitude: r.longitude,
                  salePrice: r.salePrice,
                }))}
              />

              {/* Controls + averages */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 mb-3">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-500">
                    {cs?.dataSource === "knowledgeFactory"
                      ? "Title deed records — Deeds Office"
                      : "AI-estimated comparable sales"}
                  </p>
                  {outlierFlags.some(Boolean) && (
                    <button
                      onClick={deselectOutliers}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Deselect outliers
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {avgPrice > 0 && (
                    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg text-white min-w-[90px]" style={{ background: accentColor }}>
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-white/60 leading-none mb-0.5">Avg Price</span>
                      <span className="text-xs font-bold leading-none">R{avgPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {avgSqm > 0 && (
                    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg text-white min-w-[90px]" style={{ background: accentColor }}>
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-white/60 leading-none mb-0.5">Avg R/m²</span>
                      <span className="text-xs font-bold leading-none">R{avgSqm.toLocaleString()}</span>
                    </div>
                  )}
                  <span className="text-[11px] text-slate-400 ml-1">{csSelected.size}/{rows.length} selected</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2 px-2 w-8">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          className="rounded border-slate-300 cursor-pointer"
                        />
                      </th>
                      <th className="text-left py-2 px-3 font-semibold text-slate-500 uppercase tracking-wider">Address</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-500 uppercase tracking-wider">Sale Price</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-500 uppercase tracking-wider">Size</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-500 uppercase tracking-wider">R/m²</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-500 uppercase tracking-wider">Sale Date</th>
                      {cs?.dataSource === "knowledgeFactory" && (
                        <th className="text-right py-2 px-3 font-semibold text-slate-500 uppercase tracking-wider">Distance</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r: any, i: number) => {
                      const isOutlier = outlierFlags[i];
                      const isSelected = csSelected.has(i);
                      return (
                        <tr
                          key={i}
                          className={`border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                            isOutlier
                              ? "bg-red-50/60 hover:bg-red-50"
                              : isSelected
                              ? "hover:bg-slate-50/50"
                              : "opacity-50 hover:opacity-70"
                          }`}
                          onClick={() => toggleRow(i)}
                        >
                          <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRow(i)}
                              className="rounded border-slate-300 cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <div className={`font-medium ${isOutlier ? "text-red-700" : "text-slate-800"}`}>{r.address}</div>
                            {r.suburb && <div className="text-slate-400">{r.suburb}</div>}
                            {isOutlier && <div className="text-[10px] text-red-500 font-semibold mt-0.5">Possible outlier</div>}
                          </td>
                          <td className={`py-2 px-3 text-right font-semibold ${isOutlier ? "text-red-700" : "text-slate-800"}`}>
                            R{r.salePrice?.toLocaleString() ?? "—"}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">{r.size ? `${r.size}m²` : "—"}</td>
                          <td className={`py-2 px-3 text-right font-semibold ${isOutlier ? "text-red-600" : "text-slate-500"}`}>
                            {r.pricePerSqM ? `R${r.pricePerSqM.toLocaleString()}` : "—"}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {r.saleDate
                              ? new Date(r.saleDate).toLocaleDateString("en-ZA", { year: "numeric", month: "short" })
                              : "—"}
                          </td>
                          {cs?.dataSource === "knowledgeFactory" && (
                            <td className="py-2 px-3 text-right text-slate-500">
                              {r.distanceKM != null ? `${r.distanceKM.toFixed(1)} km` : "—"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </AccordionSection>
          );
        })()}

        {/* Financial Analysis */}
        {(rd?.financingAnalysisData || rd?.cashflowAnalysisData || rd?.annualPropertyAppreciationData) && (
          <AccordionSection title="Financial Analysis" color={accentColor} open={openSections.financial} onToggle={() => toggleSection('financial')}>

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
                  <ComposedChart data={equityChartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                  </ComposedChart>
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
          </AccordionSection>
        )}

        {/* Additional Details */}
        <AccordionSection title="Additional Details" color={accentColor} open={openSections.details} onToggle={() => toggleSection('details')}>
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
        </AccordionSection>
      </main>

      {/* ── AI Property Advisor ── */}
      {vd && (() => {
        const vals: any[] = vd.valuations ?? [];
        const midVal = vals.find((v: any) => /midline|mid/i.test(v.type))?.value;
        const cs = data.valuationReport?.comparableSalesData;
        const csRows = cs?.titleDeedProperties?.length ? cs.titleDeedProperties : cs?.properties ?? [];
        const sqmRows = csRows.filter((r: any) => r.pricePerSqM > 0);

        return (
          <AiAdvisor
            advisorType="report"
            title="Property Advisor"
            accentColor={accentColor}
            placeholder="Ask about this property..."
            context={{
              address: p.address,
              propertyType: p.propertyType,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              floorSize: p.floorSize,
              price: p.price,
              valuations: vals,
              ltrMinRental: ltr?.minRental,
              ltrMaxRental: ltr?.maxRental,
              ltrMinYield: ltr?.minYield,
              ltrMaxYield: ltr?.maxYield,
              strMedianAnnual: str?.percentile50?.annual,
              appreciationRate: rd?.annualPropertyAppreciationData?.finalAppreciationRate,
              comparableSalesCount: csRows.length,
              avgSalePrice: cs?.averageSalePrice,
              avgPricePerSqm: sqmRows.length > 0 ? Math.round(sqmRows.reduce((s: number, r: any) => s + r.pricePerSqM, 0) / sqmRows.length) : null,
              summary: vd.summary,
            }}
            welcomeMessage={`I've reviewed the full valuation report for **${p.address}**.\n\n${
              midVal ? `**Midline estimate: R${Number(midVal).toLocaleString('en-ZA')}**` : ''
            }${ltr ? ` | **LTR: R${ltr.minRental?.toLocaleString('en-ZA')}–R${ltr.maxRental?.toLocaleString('en-ZA')}/mo**` : ''}${
              csRows.length > 0 ? ` | **${csRows.length} comparable sales**` : ''
            }\n\nWhat would you like to know?`}
            actions={[
              { label: "Is this property fairly priced?", prompt: `Based on the ${csRows.length} comparable sales and the valuation range, is this property fairly priced? Break down the evidence.` },
              { label: "STR vs LTR — what's better?", prompt: `Compare the short-term rental potential (STR median annual: R${str?.percentile50?.annual?.toLocaleString('en-ZA') || 'N/A'}) vs long-term rental (R${ltr?.minRental?.toLocaleString('en-ZA') || 'N/A'}–R${ltr?.maxRental?.toLocaleString('en-ZA') || 'N/A'}/mo). Which strategy wins and by how much?` },
              { label: "Draft a client summary", prompt: `Draft a professional 3-paragraph summary of this property that I can send to a client. Include the valuation range, rental potential, and key investment highlights.` },
              { label: "What are the risks?", prompt: `What are the key investment risks for this property? Consider the market, location, pricing relative to comparables, and rental assumptions.` },
            ]}
          />
        );
      })()}

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
