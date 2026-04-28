import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Building2, AlertTriangle, TrendingUp, Users, MapPin, ArrowLeft,
  Shield, Activity, CheckCircle, Clock, BarChart3, FileText, LogOut, Zap,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ComposedChart, Line,
} from "recharts";
import AICopilot from "@/components/AICopilot";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const MapComponent = lazy(() => import("@/components/MapComponent"));

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function StateDashboard() {
  const navigate = useNavigate();
  const { t, td, isRTL } = useLang();
  const [districts, setDistricts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [topDiseases, setTopDiseases] = useState<any[]>([]);
  const [accuracy, setAccuracy] = useState<any>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [forecastDistrict, setForecastDistrict] = useState<string>("EAST GODAVARI");
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/districts/all`).then(r => r.json()),
      fetch(`${API}/api/diseases/trends?weeks=6`).then(r => r.json()),
      fetch(`${API}/api/diseases/top?limit=8`).then(r => r.json()),
      fetch(`${API}/api/ai/accuracy`).then(r => r.json()),
      fetch(`${API}/api/public/alerts`).then(r => r.json()),
    ]).then(([d, t, td, acc, alerts]) => {
      setDistricts(d.districts || []);
      setTrends(t.trends || []);
      setTopDiseases(td.diseases || []);
      setAccuracy(acc);
      setCriticalAlerts((alerts.alerts || []).filter((a: any) => a.severity === "critical").slice(0, 3));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!forecastDistrict) return;
    fetch(`${API}/api/districts/${encodeURIComponent(forecastDistrict)}/forecast`)
      .then(r => r.json())
      .then(d => setForecast(d.forecast || []));
  }, [forecastDistrict]);

  const totalCases = districts.reduce((s, d) => s + (d.cases || 0), 0);
  const liveDistricts = districts.filter(d => d.status === "live" || d.cases > 0).length;
  const readyDistricts = districts.length - liveDistricts;
  const criticalDistricts = districts.filter(d => d.risk_score >= 8).length;
  // Only put markers on the map for live districts (ready ones have intensity 0)
  const mapNodes = districts.filter(d => d.cases > 0).map(d => ({
    name: d.district, lat: d.lat, lng: d.lng,
    intensity: d.intensity, cases: d.cases,
    capacity: Math.round(d.intensity * 90), disease: d.top_disease || "—",
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1 bg-gradient-to-r from-slate-800 via-blue-600 to-teal-500" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div dir={isRTL ? "rtl" : "ltr"}>
              <h1 className="text-sm font-bold text-slate-900">{t("state_title")}</h1>
              <p className="text-[10px] text-slate-500">{t("state_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              {criticalDistricts} {t("state_critical_districts")}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {t("state_live")}
            </span>
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              <LogOut className="h-3.5 w-3.5" /> {t("exit")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">

        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: t("kpi_total_cases"), value: totalCases.toLocaleString(), icon: Users, color: "from-blue-500 to-indigo-600", sub: t("kpi_total_cases_sub") },
            { label: t("kpi_districts"), value: `${districts.length}`, icon: MapPin, color: "from-slate-600 to-slate-800", sub: `${liveDistricts} live · ${readyDistricts} ready` },
            { label: t("kpi_critical"), value: criticalDistricts, icon: AlertTriangle, color: "from-red-500 to-rose-600", sub: t("kpi_critical_sub") },
            { label: t("kpi_accuracy"), value: accuracy ? `${accuracy.overall_accuracy_pct}%` : "–", icon: CheckCircle, color: "from-emerald-500 to-teal-600", sub: t("kpi_accuracy_sub") },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} {...fade} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.color}`}>
                  <kpi.icon className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{loading ? "–" : kpi.value}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{kpi.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Outbreak Auto-Alert Banner — fires when statistical spike detected */}
        {criticalAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-rose-50 p-5 shadow-lg shadow-red-500/10">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 shadow-lg shadow-red-500/30 animate-pulse">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-black text-red-900">{t("outbreak_alert_title")}</h3>
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                    {criticalAlerts.length} {t("outbreak_alert_active")}
                  </span>
                </div>
                <p className="text-[11px] text-red-800 mb-3">{t("outbreak_alert_subtitle")}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {criticalAlerts.map((a, i) => (
                    <div key={i} className="rounded-lg bg-white/80 px-3 py-2 border border-red-200">
                      <p className="text-xs font-bold text-red-900">{a.disease}</p>
                      <p className="text-[10px] text-red-700">{a.mandal}, {a.district}</p>
                      <p className="text-[10px] font-bold text-red-600 mt-0.5">{a.case_count} {t("cases_reported")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Map + Accuracy Panel */}
        <div className="grid gap-6 lg:grid-cols-5">
          <motion.div {...fade} transition={{ delay: 0.1 }} className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-bold text-slate-900">{t("map_title")}</h2>
            <p className="mb-4 text-[10px] text-slate-500">{t("map_subtitle")}</p>
            <div className="h-[320px] overflow-hidden rounded-xl border border-slate-100">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading map…</div>}>
                {!loading && <MapComponent nodes={mapNodes} timelineDay={0} />}
              </Suspense>
            </div>
          </motion.div>

          <motion.div {...fade} transition={{ delay: 0.15 }} className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900">{t("accuracy_title")}</h2>
            </div>
            {accuracy ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 p-4 text-center">
                  <p className="text-4xl font-black text-emerald-600">{accuracy.overall_accuracy_pct}%</p>
                  <p className="text-xs text-emerald-700 font-medium mt-1">{t("accuracy_overall")}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">{accuracy.total_evaluated.toLocaleString()} {t("accuracy_records_evaluated")}</p>
                </div>
                {Object.entries(accuracy.per_category).map(([cat, data]: [string, any]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{cat}</span>
                      <span className="text-xs font-bold text-slate-900">{data.accuracy}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                        style={{ width: `${data.accuracy}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{data.correct} / {data.total} correct</p>
                  </div>
                ))}
                <div className="rounded-lg bg-slate-50 p-3 text-[10px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700">{t("accuracy_validations")}</p>
                  <p>✓ {t("accuracy_approved")}: {accuracy.feedback_stats?.approved ?? 0}</p>
                  <p>✎ {t("accuracy_corrected")}: {accuracy.feedback_stats?.corrected ?? 0}</p>
                  <p>✗ {t("accuracy_rejected")}: {accuracy.feedback_stats?.rejected ?? 0}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-slate-400">Loading accuracy data…</div>
            )}
          </motion.div>
        </div>

        {/* Trend + Top Diseases */}
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div {...fade} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900">{t("trend_title")}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "10px", fontSize: "11px", color: "#f8fafc" }} />
                {trends[0] && Object.keys(trends[0]).filter(k => k !== "week").map((key, i) => {
                  const colors = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981"];
                  return <Area key={key} type="monotone" dataKey={key} stroke={colors[i % 4]} fill={colors[i % 4]} fillOpacity={0.08} strokeWidth={2} />;
                })}
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div {...fade} transition={{ delay: 0.25 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900">{t("top_diseases")}</h2>
            <div className="space-y-2">
              {topDiseases.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium text-slate-700 truncate">{d.name}</span>
                      <span className="text-xs font-bold text-slate-900 ml-2">{d.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-teal-500"
                        style={{ width: `${(d.count / (topDiseases[0]?.count || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 7-Day Predictive Forecast */}
        <motion.div {...fade} transition={{ delay: 0.27 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">{t("forecast_title")}</h2>
            </div>
            <select value={forecastDistrict} onChange={e => setForecastDistrict(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-amber-400">
              {districts.filter(d => d.cases > 0).map(d => (
                <option key={d.district_upper} value={d.district_upper}>{d.district}</option>
              ))}
            </select>
          </div>
          <p className="mb-3 text-[10px] text-slate-500">{t("forecast_subtitle")}</p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "10px", fontSize: "11px", color: "#f8fafc" }} />
              <Area type="monotone" dataKey="upper_ci" stroke="none" fill="#fbbf24" fillOpacity={0.15} name="Upper CI" />
              <Area type="monotone" dataKey="lower_ci" stroke="none" fill="#fbbf24" fillOpacity={0.15} name="Lower CI" />
              <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: "#f59e0b" }} name="Predicted Cases" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {forecast.map(f => (
              <div key={f.day} className="rounded-lg bg-amber-50 p-2 text-center">
                <p className="text-[10px] font-bold text-amber-600">{f.day}</p>
                <p className="text-sm font-black text-amber-800">{f.predicted}</p>
                <p className="text-[9px] text-amber-700">{f.lower_ci}–{f.upper_ci}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* District Risk Table */}
        <motion.div {...fade} transition={{ delay: 0.3 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t("district_table_title")}</h2>
              <p className="text-[10px] text-slate-500">{t("district_table_subtitle")}</p>
            </div>
            <button
              onClick={() => { window.open(`${API}/api/reports/idsp`, "_blank"); toast.success("IDSP Report opened"); }}
              className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100">
              <FileText className="h-3.5 w-3.5" /> {t("idsp_report")}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {[t("col_district"), t("col_status"), t("col_region"), t("col_cases"), t("col_forecast"), t("col_top_disease"), t("col_risk"), t("col_mandals")].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {districts.map(row => (
                  <tr key={row.district} className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer"
                    onClick={() => navigate("/district-dashboard")}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-3.5 w-3.5 ${row.risk_score >= 8 ? "text-red-400" : "text-slate-400"}`} />
                        <span className="text-sm font-semibold text-slate-800">{row.district}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${row.status === "live" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {row.status === "live" ? t("status_live") : t("status_ready")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{row.region}</td>
                    <td className="px-5 py-3 text-sm font-bold text-slate-800">{row.cases.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{row.predicted_7d.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">{td(row.top_disease)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${row.risk_score >= 8 ? "bg-red-500" : row.risk_score >= 6 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${(row.risk_score / 10) * 100}%` }} />
                        </div>
                        <span className={`text-xs font-black ${row.risk_score >= 8 ? "text-red-600" : row.risk_score >= 6 ? "text-amber-600" : "text-emerald-600"}`}>
                          {row.risk_score}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{row.mandals || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p dir={isRTL ? "rtl" : "ltr"} className="text-center text-[10px] text-slate-400">
          <Shield className="mr-1 inline h-3 w-3" />
          {t("footer_compliance")}
        </p>
      </main>

      <AICopilot floating patientContext={{ role: "State Health Officer", scope: "Statewide AP" }} />
    </div>
  );
}
