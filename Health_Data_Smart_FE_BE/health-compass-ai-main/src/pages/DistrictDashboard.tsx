import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  MapPin, AlertTriangle, ArrowLeft, FileText, TrendingUp,
  Building2, Activity, ChevronDown, LogOut, Download,
} from "lucide-react";
import AICopilot from "@/components/AICopilot";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { getMandalCoords } from "@/data/mandalCoordinates";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const MapComponent = lazy(() => import("@/components/MapComponent"));

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function DistrictDashboard() {
  const navigate = useNavigate();
  const { t, td, isRTL } = useLang();
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [mandals, setMandals] = useState<any[]>([]);
  const [phcs, setPhcs] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [idspReport, setIdspReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Load all 29 AP districts dynamically from DB (live + ready)
  useEffect(() => {
    fetch(`${API}/api/districts/all`)
      .then(r => r.json())
      .then(d => {
        const all = d.districts || [];
        setDistricts(all);
        // Default to first live district (one with data) for a useful initial view
        const firstLive = all.find((x: any) => x.cases > 0) || all[0];
        if (firstLive) setSelectedDistrict(firstLive.district_upper);
        setLoading(false);
      });
  }, []);

  // Load district detail when selection changes
  useEffect(() => {
    if (!selectedDistrict) return;
    setLoadingDetail(true);
    Promise.all([
      fetch(`${API}/api/districts/${encodeURIComponent(selectedDistrict)}/mandals`).then(r => r.json()),
      fetch(`${API}/api/phcs?district=${encodeURIComponent(selectedDistrict)}`).then(r => r.json()),
      fetch(`${API}/api/diseases/trends?district=${encodeURIComponent(selectedDistrict)}&weeks=6`).then(r => r.json()),
      fetch(`${API}/api/validation/queue?district=${encodeURIComponent(selectedDistrict)}&limit=10`).then(r => r.json()),
      fetch(`${API}/api/reports/idsp?district=${encodeURIComponent(selectedDistrict)}`).then(r => r.json()),
    ]).then(([m, p, t, q, idsp]) => {
      setMandals(m.mandals || []);
      setPhcs(p.phcs || []);
      setTrends(t.trends || []);
      setQueue(q.queue || []);
      setIdspReport(idsp);
      setLoadingDetail(false);
    }).catch(() => setLoadingDetail(false));
  }, [selectedDistrict]);

  const districtInfo = districts.find(d => d.district_upper === selectedDistrict);

  // Compute mandal-level map nodes for the selected district
  const mandalMapNodes = useMemo(() => {
    if (!mandals.length || !selectedDistrict) return [];
    const maxCases = Math.max(...mandals.map(m => m.cases), 1);
    return mandals
      .map(m => {
        const coords = getMandalCoords(selectedDistrict, m.mandal);
        if (!coords) return null;
        return {
          name: m.mandal,
          lat: coords.lat,
          lng: coords.lng,
          intensity: m.cases / maxCases,
          cases: m.cases,
          capacity: Math.round((m.cases / maxCases) * 90),
          disease: m.top_disease,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [mandals, selectedDistrict]);

  const downloadCSV = () => {
    if (!idspReport) return;
    const header = "Disease,S (Syndromic),P (Probable),L (Laboratory),Total\n";
    const rows = idspReport.rows.map((r: any) => `"${r.disease}",${r.S},${r.P},${r.L},${r.total}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `IDSP_${selectedDistrict}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("IDSP report downloaded");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg">
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div dir={isRTL ? "rtl" : "ltr"}>
              <h1 className="text-sm font-bold text-slate-900">{t("district_title")}</h1>
              <p className="text-[10px] text-slate-500">{t("district_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Dynamic district selector — from DB */}
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
              >
                <optgroup label="● LIVE — with surveillance data">
                  {districts.filter(d => d.cases > 0).map(d => (
                    <option key={d.district_upper} value={d.district_upper}>{d.district} ({d.cases})</option>
                  ))}
                </optgroup>
                <optgroup label="○ READY — awaiting onboarding">
                  {districts.filter(d => d.cases === 0).map(d => (
                    <option key={d.district_upper} value={d.district_upper}>{d.district}</option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
            <button onClick={downloadCSV}
              className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100">
              <Download className="h-3.5 w-3.5" /> {t("district_idsp_csv")}
            </button>
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              <LogOut className="h-3.5 w-3.5" /> {t("exit")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">

        {/* District KPIs */}
        {districtInfo && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: t("district_kpi_cases"), value: districtInfo.cases.toLocaleString(), sub: selectedDistrict, color: "from-blue-500 to-indigo-600" },
              { label: t("district_kpi_mandals"), value: districtInfo.mandals, sub: t("district_kpi_mandals_sub"), color: "from-slate-600 to-slate-800" },
              { label: t("district_kpi_forecast"), value: districtInfo.predicted_7d.toLocaleString(), sub: t("district_kpi_forecast_sub"), color: "from-amber-500 to-orange-600" },
              { label: t("district_kpi_risk"), value: `${districtInfo.risk_score}/10`, sub: districtInfo.risk_score >= 8 ? t("risk_critical") : districtInfo.risk_score >= 6 ? t("risk_high") : t("risk_moderate"), color: districtInfo.risk_score >= 8 ? "from-red-500 to-rose-600" : "from-amber-500 to-orange-600" },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} {...fade} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{loadingDetail ? "–" : kpi.value}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{kpi.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* District Map — zoomed into the selected district with mandal heat circles */}
        {districtInfo && (
          <motion.div {...fade} transition={{ delay: 0.08 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{districtInfo.district} District Hotspot Map</h2>
                <p className="text-[10px] text-slate-500">Mandal-level disease density · {mandalMapNodes.length} mandals plotted</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                {[
                  { label: "Critical", color: "bg-red-500" },
                  { label: "High", color: "bg-amber-500" },
                  { label: "Moderate", color: "bg-emerald-500" },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1 font-semibold text-slate-400">
                    <span className={`h-2 w-2 rounded-full ${l.color}`} /> {l.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-[320px] overflow-hidden rounded-xl border border-slate-100">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading map…</div>}>
                <MapComponent
                  nodes={mandalMapNodes}
                  center={[districtInfo.lat, districtInfo.lng]}
                  zoom={9}
                />
              </Suspense>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Disease Trend */}
          <motion.div {...fade} transition={{ delay: 0.1 }} className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900">{t("district_disease_trend")} — {selectedDistrict.replace(/_/g, ' ')}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "10px", fontSize: "11px", color: "#f8fafc" }} />
                {trends[0] && Object.keys(trends[0]).filter(k => k !== "week").map((key, i) => {
                  const colors = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981"];
                  return <Area key={key} type="monotone" dataKey={key} stroke={colors[i % 4]} fill={colors[i % 4]} fillOpacity={0.1} strokeWidth={2} />;
                })}
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* IDSP Report */}
          <motion.div {...fade} transition={{ delay: 0.15 }} className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">{t("district_idsp_weekly")}</h2>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <div className="divide-y max-h-[260px] overflow-y-auto">
              {idspReport?.rows?.slice(0, 8).map((row: any) => (
                <div key={row.disease} className="grid grid-cols-4 gap-2 px-5 py-2.5 text-xs">
                  <span className="col-span-1 font-medium text-slate-700 truncate" title={row.disease}>{row.disease}</span>
                  <span className="text-center font-bold text-blue-600">S:{row.S}</span>
                  <span className="text-center font-bold text-amber-600">P:{row.P}</span>
                  <span className="text-center font-bold text-emerald-600">L:{row.L}</span>
                </div>
              ))}
              {!idspReport && <p className="px-5 py-4 text-xs text-slate-400">Loading IDSP data…</p>}
            </div>
            <div className="border-t border-slate-100 px-5 py-2.5">
              <p className="text-[10px] text-slate-400">{t("idsp_legend")}</p>
            </div>
          </motion.div>
        </div>

        {/* Mandal + PHC Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mandal breakdown */}
          <motion.div {...fade} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">{t("mandal_burden")}</h2>
              <p className="text-[10px] text-slate-500">{mandals.length} {t("mandal_count_in")} {selectedDistrict.replace(/_/g,' ')}</p>
            </div>
            <div className="overflow-y-auto max-h-[320px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50/90">
                  <tr className="border-b border-slate-100">
                    {["Mandal", "Cases", "Top Disease"].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mandals.map(m => (
                    <tr key={m.mandal} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-5 py-2.5 text-xs font-medium text-slate-800">{m.mandal}</td>
                      <td className="px-5 py-2.5 text-xs font-bold text-slate-900">{m.cases}</td>
                      <td className="px-5 py-2.5">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{m.top_disease}</span>
                      </td>
                    </tr>
                  ))}
                  {!mandals.length && (
                    <tr><td colSpan={3} className="px-5 py-6 text-center text-xs text-slate-400">Loading mandal data…</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* PHC table */}
          <motion.div {...fade} transition={{ delay: 0.25 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">{t("phc_performance")}</h2>
              <p className="text-[10px] text-slate-500">{phcs.length} {t("phc_facilities_in_district")}</p>
            </div>
            <div className="overflow-y-auto max-h-[320px]">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-50/90">
                  <tr className="border-b border-slate-100">
                    {["Facility", "Type", "Cases", "Top Disease"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {phcs.slice(0, 30).map(p => (
                    <tr key={p.phc_code} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-800 max-w-[140px] truncate" title={p.facility_name}>{p.facility_name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.facility_type === "UPHC" ? "bg-violet-50 text-violet-700" : "bg-teal-50 text-teal-700"}`}>{p.facility_type}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-bold text-slate-900">{p.cases}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{p.top_disease}</span>
                      </td>
                    </tr>
                  ))}
                  {!phcs.length && (
                    <tr><td colSpan={4} className="px-5 py-6 text-center text-xs text-slate-400">Loading PHC data…</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Validation Queue */}
        {queue.length > 0 && (
          <motion.div {...fade} transition={{ delay: 0.3 }} className="rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-amber-200 px-5 py-4">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">{t("validation_queue")}</h2>
              <span className="ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{queue.length} {t("pending")}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-100 bg-amber-50">
                    {["PHC", "Complaint", "AI Category", "ICD-10", "Confidence"].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-amber-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queue.map(item => (
                    <tr key={item.op_id} className="border-b border-amber-50 hover:bg-amber-50/60">
                      <td className="px-5 py-2.5 text-xs text-slate-700 max-w-[120px] truncate">{item.facility_name || item.phc}</td>
                      <td className="px-5 py-2.5 text-xs text-slate-700 max-w-[160px] truncate">{item.complaint}</td>
                      <td className="px-5 py-2.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${item.ai_category === "Communicable" ? "bg-red-50 text-red-700" : item.ai_category === "Non-Communicable" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                          {item.ai_category}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-xs font-mono text-slate-700">{item.ai_icd10}</td>
                      <td className="px-5 py-2.5">
                        <span className="text-xs font-bold text-amber-600">{Math.round(item.confidence * 100)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>

      <AICopilot floating patientContext={{
        role: "District Health Officer",
        district: selectedDistrict,
        district_name: districtInfo?.district,
        cases: districtInfo?.cases,
      }} />
    </div>
  );
}
