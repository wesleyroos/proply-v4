import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatter, formatCurrency } from "@/utils/formatting";
import MapView from "@/components/MapView";
import { BedDouble, Bath, TrendingUp } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// Normalized so weighted sum × days = 365: nightly_rate × 365 × occupancy = gross annual
const SEASONALITY_FACTORS = [1.7953,1.4379,1.0806,1.0806,0.6465,0.5786,0.5786,0.5786,0.6465,0.7913,1.0806,1.7272];
const OCCUPANCY_RATES = {
  low:    [65,65,60,55,50,50,50,50,60,65,65,65],
  medium: [80,78,73,68,63,60,60,60,70,75,75,85],
  high:   [95,90,85,80,75,70,70,70,80,85,85,95],
};

export interface RentCompareProperty {
  title: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  shortTermNightly: string;
  annualOccupancy: string;
  managementFee: string;
  longTermMonthly: string;
  longTermAnnual: string;
  shortTermAnnual: string;
  shortTermAfterFees: string;
  breakEvenOccupancy: string;
  annualEscalation: string;
  createdAt: string;
}

interface Props {
  property: RentCompareProperty;
}

export default function RentCompareReport({ property }: Props) {
  const stNightly       = Number(property.shortTermNightly || 0);
  const annualOccupancy = Number(property.annualOccupancy  || 0);
  const managementFee   = Number(property.managementFee   || 0); // decimal
  const ltMonthly       = Number(property.longTermMonthly || 0);
  const ltAnnual        = Number(property.longTermAnnual  || 0);

  // Always recalculate from raw inputs so stale stored values don't affect display
  const occupancyRate  = annualOccupancy / 100;
  const platformRate   = managementFee > 0 ? 0.15 : 0.03;
  const stAnnual       = SEASONALITY_FACTORS.reduce((sum, factor, month) => {
    const days = new Date(2023, month + 1, 0).getDate();
    return sum + stNightly * factor * days * occupancyRate;
  }, 0);
  const platformAmt    = stAnnual * platformRate;
  const afterPlatform  = stAnnual - platformAmt;
  const mgmtAmt        = managementFee > 0 ? afterPlatform * managementFee : 0;
  const stAfterFees    = afterPlatform - mgmtAmt;

  const platformFeeMultiplier   = managementFee > 0 ? 0.85 : 0.97;
  const managementFeeMultiplier = 1 - managementFee;
  const netDailyRateNeeded      = ltAnnual / (365 * platformFeeMultiplier * managementFeeMultiplier);
  const breakEven               = stNightly > 0 ? (netDailyRateNeeded / stNightly) * 100 : 0;

  const platformPct = platformRate * 100;
  const advantage   = stAfterFees - ltAnnual;

  const analysisDate = new Date(property.createdAt).toLocaleDateString("en-ZA", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const monthlyChartData = useMemo(() => {
    const mgmtM = managementFee > 0 ? 1 - managementFee : 1;
    return MONTHS.map((month, i) => {
      const days = new Date(2023, i + 1, 0).getDate();
      const seasonal = stNightly * SEASONALITY_FACTORS[i];
      const net = seasonal * (1 - platformRate) * mgmtM;
      return {
        month,
        Conservative: Math.round(net * (OCCUPANCY_RATES.low[i]    / 100) * days),
        Moderate:     Math.round(net * (OCCUPANCY_RATES.medium[i]  / 100) * days),
        Optimistic:   Math.round(net * (OCCUPANCY_RATES.high[i]    / 100) * days),
        "Long Term":  Math.round(ltMonthly),
      };
    });
  }, [stNightly, managementFee, platformRate, ltMonthly]);

  const monthlyTable = useMemo(() => {
    const mgmtM = managementFee > 0 ? 1 - managementFee : 1;
    return MONTHS.map((month, i) => {
      const days = new Date(2023, i + 1, 0).getDate();
      const seasonal = stNightly * SEASONALITY_FACTORS[i];
      const netRate = seasonal * (1 - platformRate) * mgmtM;
      const stNet = Math.round(netRate * (annualOccupancy / 100) * days);
      const lt = Math.round(ltMonthly);
      return { month, seasonal, stNet, lt, diff: stNet - lt };
    });
  }, [stNightly, managementFee, platformRate, annualOccupancy, ltMonthly]);

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-lg">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">
              Rent Compare Analysis
            </p>
            <h1 className="text-2xl font-bold text-white leading-tight">{property.title}</h1>
            <p className="text-slate-300 mt-1.5 text-sm">{property.address}</p>
            <div className="flex flex-wrap items-center gap-2 mt-5">
              {[
                { icon: <BedDouble className="h-3 w-3" />, label: `${property.bedrooms} Bedrooms` },
                { icon: <Bath className="h-3 w-3" />,     label: `${property.bathrooms} Bathrooms` },
                { icon: <TrendingUp className="h-3 w-3" />, label: `${annualOccupancy}% Target Occupancy` },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-[11px] font-medium px-3 py-1.5 rounded-full"
                >
                  {chip.icon} {chip.label}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-slate-500 text-[10px] uppercase tracking-wide">Analysis Date</p>
            <p className="text-slate-200 text-sm font-semibold mt-1">{analysisDate}</p>
          </div>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Short-Term Annual",
            sub:   "Net, after all fees",
            value: formatter.format(stAfterFees),
            color: "text-emerald-700",
            bar:   "bg-emerald-500",
          },
          {
            label: "Long-Term Annual",
            sub:   `At ${formatter.format(ltMonthly)}/month`,
            value: formatter.format(ltAnnual),
            color: "text-purple-700",
            bar:   "bg-purple-500",
          },
          {
            label: "Annual Advantage",
            sub:   "Short-term vs long-term",
            value: `${advantage > 0 ? "+" : ""}${formatter.format(advantage)}`,
            color: advantage > 0 ? "text-emerald-700" : "text-red-600",
            bar:   advantage > 0 ? "bg-emerald-500"  : "bg-red-500",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`h-1 ${kpi.bar}`} />
            <div className="p-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
              <p className={`text-[28px] font-bold mt-2 leading-none ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue Comparison ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Short-Term */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h3 className="font-bold text-white text-[15px]">Short-Term Rental</h3>
            <p className="text-blue-200 text-xs mt-0.5">Airbnb / short-stay platform</p>
          </div>
          <div className="px-6 py-4 divide-y divide-slate-100">
            <Row label="Nightly Rate" value={formatter.format(stNightly)} />
            <Row label="Annual Occupancy" value={`${annualOccupancy}%`} />
            <Row label="Gross Annual Revenue" value={formatter.format(stAnnual)} />
            <Row label={`Less Platform Fee (${platformPct.toFixed(0)}%)`} value={`− ${formatter.format(platformAmt)}`} red />
            {managementFee > 0 && (
              <Row
                label={`Less Management Fee (${(managementFee * 100).toFixed(0)}%)`}
                value={`− ${formatter.format(mgmtAmt)}`}
                red
              />
            )}
            <div className="flex justify-between pt-3.5 pb-0.5">
              <span className="text-[13px] font-bold text-slate-800">Net Annual Revenue</span>
              <span className="text-[15px] font-bold text-emerald-700">{formatter.format(stAfterFees)}</span>
            </div>
          </div>
        </div>

        {/* Long-Term */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <h3 className="font-bold text-white text-[15px]">Long-Term Rental</h3>
            <p className="text-purple-200 text-xs mt-0.5">Traditional lease arrangement</p>
          </div>
          <div className="px-6 py-4 divide-y divide-slate-100">
            <Row label="Monthly Rental" value={formatter.format(ltMonthly)} />
            <Row label="Annual Escalation" value={`${property.annualEscalation}%`} />
            <div className="flex justify-between pt-3.5 pb-0.5">
              <span className="text-[13px] font-bold text-slate-800">Annual Revenue</span>
              <span className="text-[15px] font-bold text-purple-700">{formatter.format(ltAnnual)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Break-Even ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-[15px] mb-5">Break-Even Occupancy Analysis</h3>

        <div className="relative">
          <div className="h-5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
              style={{ width: `${Math.min(annualOccupancy, 100)}%` }}
            />
          </div>
          {breakEven > 0 && breakEven <= 100 && (
            <div
              className="absolute top-0 flex flex-col items-center pointer-events-none"
              style={{ left: `${Math.min(breakEven, 100)}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-px h-7 bg-red-500 -mt-1" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-3 text-[12px]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-500">
              Current occupancy: <span className="font-semibold text-slate-800">{annualOccupancy}%</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-px h-4 bg-red-500" />
            <span className="text-slate-500">
              Break-even: <span className="font-semibold text-slate-800">{breakEven.toFixed(1)}%</span>
            </span>
          </div>
        </div>

        <div className={`mt-4 p-4 rounded-lg border text-[13px] leading-relaxed ${
          advantage > 0
            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
            : "bg-amber-50 border-amber-100 text-amber-800"
        }`}>
          {advantage > 0 ? (
            <>
              <span className="font-semibold">Short-term is more profitable.</span>{" "}At {annualOccupancy}%
              occupancy this property earns{" "}
              <span className="font-semibold">{formatter.format(advantage)} more</span> per year than a
              long-term lease.
            </>
          ) : (
            <>
              <span className="font-semibold">Long-term may be more suitable</span> at the current{" "}
              {annualOccupancy}% occupancy target. Short-term rental requires at least{" "}
              <span className="font-semibold">{breakEven.toFixed(1)}%</span> occupancy to match long-term
              revenue.
            </>
          )}
        </div>
      </div>

      {/* ── Monthly Projections Chart ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="mb-5">
          <h3 className="font-bold text-slate-800 text-[15px]">Monthly Revenue Projections</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            After all fees · Based on historical seasonality with three occupancy scenarios
          </p>
        </div>
        <ResponsiveContainer width="100%" height={270}>
          <LineChart data={monthlyChartData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 10, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={62}
            />
            <ChartTooltip
              formatter={(v: any) => formatter.format(Number(v))}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
            <Line type="monotone" dataKey="Conservative" stroke="#fca5a5" strokeWidth={2} dot={false} name="Conservative (Low)" />
            <Line type="monotone" dataKey="Moderate"     stroke="#fb923c" strokeWidth={2} dot={false} name="Moderate" />
            <Line type="monotone" dataKey="Optimistic"   stroke="#4ade80" strokeWidth={2.5} dot={false} name="Optimistic (High)" />
            <Line type="monotone" dataKey="Long Term"    stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Long-Term" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Monthly Comparison Table ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-[15px]">Monthly Revenue Comparison</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Short-term net revenue at {annualOccupancy}% occupancy (with seasonality) vs long-term per month
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left font-semibold text-slate-500">Month</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500">Seasonal Rate</th>
                <th className="px-5 py-3 text-right font-semibold text-blue-600">Short-Term (Net)</th>
                <th className="px-5 py-3 text-right font-semibold text-purple-600">Long-Term</th>
                <th className="px-5 py-3 text-right font-semibold text-slate-500">Difference</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTable.map((row, i) => (
                <tr
                  key={row.month}
                  className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                >
                  <td className="px-5 py-2.5 font-semibold text-slate-700">{row.month}</td>
                  <td className="px-5 py-2.5 text-right text-slate-400 text-[11px]">
                    {formatter.format(row.seasonal)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-semibold text-blue-700">
                    {formatter.format(row.stNet)}
                  </td>
                  <td className="px-5 py-2.5 text-right text-purple-600">
                    {formatter.format(row.lt)}
                  </td>
                  <td className={`px-5 py-2.5 text-right font-semibold ${row.diff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {row.diff > 0 ? "+" : ""}{formatter.format(row.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-100 font-bold">
                <td className="px-5 py-3 text-slate-700">Annual Total</td>
                <td className="px-5 py-3" />
                <td className="px-5 py-3 text-right text-blue-700">{formatter.format(stAfterFees)}</td>
                <td className="px-5 py-3 text-right text-purple-700">{formatter.format(ltAnnual)}</td>
                <td className={`px-5 py-3 text-right ${advantage > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {advantage > 0 ? "+" : ""}{formatter.format(advantage)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Location Map ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-[15px]">Location</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">{property.address}</p>
        </div>
        <div className="h-[300px]">
          <MapView address={property.address} />
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  red,
}: {
  label: string;
  value: string;
  red?: boolean;
}) {
  return (
    <div className="flex justify-between py-2.5">
      <span className="text-[12px] text-slate-500">{label}</span>
      <span className={`text-[12px] font-semibold ${red ? "text-red-500" : "text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}
