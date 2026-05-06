import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Building2, AlertTriangle, Users, MapPin,
  Shield, CheckCircle, FileText, LogOut, Zap,
  Radar, Sparkles, Play, Pause, RotateCcw, PlayCircle,
} from "lucide-react";
import GuidedDemo from "@/components/GuidedDemo";
import AISafetyBadge from "@/components/AISafetyBadge";
import ExplainAlert, { buildOutbreakExplanation } from "@/components/ExplainAlert";
import PilotRolloutCard from "@/components/PilotRolloutCard";
import DetailModal, { DetailGrid, DetailSection } from "@/components/DetailModal";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Line,
} from "recharts";
import AICopilot from "@/components/AICopilot";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const MapComponent = lazy(() => import("@/components/MapComponent"));

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const NAVY = "#0D47A1";
const ELECTRIC = "#1976D2";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";
const PAGE_BG = "#F4F8FC";

const chartTooltipStyle = {
  background: "#FFFFFF",
  border: `1px solid ${SKY_LINE}`,
  borderRadius: "8px",
  fontSize: "11px",
  color: "#0F172A",
  boxShadow: "0 4px 12px rgba(15,23,42,0.10)",
};

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
  const [intelligence, setIntelligence] = useState<any>(null);
  const [timelapse, setTimelapse] = useState<any>(null);
  const [tlWeek, setTlWeek] = useState(0);
  const [tlPlaying, setTlPlaying] = useState(false);
  const tlIntervalRef = useRef<number | null>(null);
  const [guidedDemoOpen, setGuidedDemoOpen] = useState(false);
  const [detailKpi, setDetailKpi] = useState<null | "records" | "districts" | "critical" | "accuracy">(null);
  const [detailDistrict, setDetailDistrict] = useState<any | null>(null);

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

    fetch(`${API}/api/intelligence/cross-district`)
      .then(r => r.json())
      .then(setIntelligence)
      .catch(() => setIntelligence(null));

    fetch(`${API}/api/analytics/timelapse?weeks=26`)
      .then(r => r.json())
      .then(d => { setTimelapse(d); setTlWeek(d.frames?.length - 1 || 0); })
      .catch(() => setTimelapse(null));
  }, []);

  useEffect(() => {
    if (!tlPlaying || !timelapse) return;
    tlIntervalRef.current = window.setInterval(() => {
      setTlWeek(w => {
        const max = (timelapse.frames?.length || 1) - 1;
        if (w >= max) { setTlPlaying(false); return max; }
        return w + 1;
      });
    }, 350) as unknown as number;
    return () => {
      if (tlIntervalRef.current) window.clearInterval(tlIntervalRef.current);
    };
  }, [tlPlaying, timelapse]);

  const timelapseMapNodes = (() => {
    if (!timelapse || !timelapse.frames || !timelapse.frames[tlWeek]) return null;
    const frame = timelapse.frames[tlWeek];
    const peak = Math.max(frame.peak_district_cases, 1);
    return frame.districts.map((d: any) => {
      const districtMeta = districts.find((x: any) => x.district_upper === d.district);
      if (!districtMeta) return null;
      const intensity = d.cases / peak;
      return {
        name: districtMeta.district,
        lat: districtMeta.lat,
        lng: districtMeta.lng,
        intensity,
        cases: d.cases,
        capacity: Math.round(intensity * 95),
        disease: districtMeta.top_disease || "—",
      };
    }).filter(Boolean);
  })();

  useEffect(() => {
    if (!forecastDistrict) return;
    fetch(`${API}/api/districts/${encodeURIComponent(forecastDistrict)}/forecast`)
      .then(r => r.json())
      .then(d => setForecast(d.forecast || []));
  }, [forecastDistrict]);

  const totalCases = districts.reduce((s, d) => s + (d.cases || 0), 0);
  const realCases = districts.reduce((s, d) => s + (d.cases_real || 0), 0);
  const syntheticCases = districts.reduce((s, d) => s + (d.cases_synthetic || 0), 0);
  const liveDistricts = districts.filter(d => d.status === "live" || d.cases > 0).length;
  const readyDistricts = districts.length - liveDistricts;
  const criticalDistricts = districts.filter(d => d.risk_score >= 8).length;
  const mapNodes = districts.filter(d => d.cases > 0).map(d => ({
    name: d.district, lat: d.lat, lng: d.lng,
    intensity: d.intensity, cases: d.cases,
    capacity: Math.round(d.intensity * 90), disease: d.top_disease || "—",
  }));

  const card: React.CSSProperties = { background: "#FFFFFF", borderColor: SKY_LINE };

  return (
    <div className="min-h-screen w-full" style={{ background: PAGE_BG }}>
      {/* Header — full width */}
      <header className="w-full border-b" style={{ background: "#FFFFFF", borderColor: SKY_LINE }}>
        <div className="w-full flex items-center justify-between px-8 py-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: NAVY }}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div dir={isRTL ? "rtl" : "ltr"}>
              <h1 className="text-sm font-bold" style={{ color: NAVY }}>{t("state_title")}</h1>
              <p className="text-[10px] text-slate-500">{t("state_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="ap-badge ap-badge-critical">
              {criticalDistricts} {t("state_critical_districts")}
            </span>
            <span className="ap-badge ap-badge-low">
              {t("state_live")}
            </span>
            <button
              onClick={() => setGuidedDemoOpen(true)}
              className="ap-btn-primary"
              title="Open the 7-step Guided Demo walkthrough"
            >
              <PlayCircle className="h-3.5 w-3.5" /> Guided Demo
            </button>
            <button
              onClick={() => navigate("/compliance")}
              className="ap-btn-secondary"
              title="DPDP Act 2023 Compliance Dashboard"
            >
              <Shield className="h-3.5 w-3.5" /> Compliance
            </button>
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="ap-btn-ghost">
              <LogOut className="h-3.5 w-3.5 inline mr-1" /> {t("exit")}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-8 py-6 space-y-6">

        {/* Provenance banner */}
        {syntheticCases > 0 && (
          <div className="rounded-lg border p-3" style={{ background: "#FFF8E1", borderColor: "#FFE082" }}>
            <div className="flex items-start gap-2">
              <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ background: "#FFE082", color: "#B26A00" }}>
                Scale Test Mode
              </span>
              <p className="text-[11px] leading-relaxed" style={{ color: "#7A4F01" }}>
                <strong>{realCases.toLocaleString()} real anonymised AP OPD records</strong> + <strong>{syntheticCases.toLocaleString()} synthetic load-test records</strong> = <strong>{totalCases.toLocaleString()} total scale-test volume</strong>. Real records preserve true epidemiological distributions; synthetic records demonstrate platform behaviour at production scale.
              </p>
            </div>
          </div>
        )}

        {/* KPI Row — clickable, opens detail */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {([
            {
              key: "records" as const,
              label: "Records (Total Volume)",
              value: totalCases.toLocaleString(),
              icon: Users,
              iconBg: "#E3F2FD",
              iconColor: "#0D47A1",
              sub: syntheticCases > 0
                ? `${realCases.toLocaleString()} real + ${syntheticCases.toLocaleString()} synthetic`
                : t("kpi_total_cases_sub"),
            },
            { key: "districts" as const, label: t("kpi_districts"), value: `${districts.length}`, icon: MapPin, iconBg: "#E0F2F1", iconColor: "#00695C", sub: `${liveDistricts} live · ${readyDistricts} ready` },
            { key: "critical" as const, label: t("kpi_critical"), value: criticalDistricts, icon: AlertTriangle, iconBg: "#FFEBEE", iconColor: "#C62828", sub: t("kpi_critical_sub") },
            { key: "accuracy" as const, label: t("kpi_accuracy"), value: accuracy ? `${accuracy.overall_accuracy_pct}%` : "–", icon: CheckCircle, iconBg: "#E8F5E9", iconColor: "#2E7D32", sub: t("kpi_accuracy_sub") },
          ]).map((kpi) => (
            <button
              key={kpi.label}
              onClick={() => setDetailKpi(kpi.key)}
              className="text-left rounded-lg border bg-white p-5 ap-card-hover cursor-pointer w-full"
              style={card}
              title="Click to see detailed breakdown"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{kpi.label}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: kpi.iconBg }}>
                  <kpi.icon className="h-4 w-4" style={{ color: kpi.iconColor }} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-extrabold tabular-nums" style={{ color: NAVY }}>
                {loading ? "–" : kpi.value}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">{kpi.sub}</p>
              <p className="mt-2 text-[10px] font-semibold" style={{ color: NAVY }}>View details →</p>
            </button>
          ))}
        </div>

        {/* Critical alerts banner */}
        {criticalAlerts.length > 0 && (
          <div className="rounded-lg border p-5" style={{ background: "#FFEBEE", borderColor: "#FFCDD2" }}>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md" style={{ background: "#C62828" }}>
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-bold" style={{ color: "#C62828" }}>{t("outbreak_alert_title")}</h3>
                  <span className="ap-badge ap-badge-critical">{criticalAlerts.length} {t("outbreak_alert_active")}</span>
                </div>
                <p className="text-[11px] mb-3" style={{ color: "#7F1D1D" }}>{t("outbreak_alert_subtitle")}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {criticalAlerts.map((a, i) => (
                    <div key={i} className="rounded-md border bg-white px-3 py-2" style={{ borderColor: "#FFCDD2" }}>
                      <p className="text-xs font-bold" style={{ color: "#C62828" }}>{a.disease}</p>
                      <p className="text-[10px] text-slate-600">{a.mandal}, {a.district}</p>
                      <p className="text-[10px] font-bold mt-0.5" style={{ color: "#C62828" }}>{a.case_count} {t("cases_reported")}</p>
                      <div className="mt-1">
                        <ExplainAlert
                          variant="link"
                          explanation={buildOutbreakExplanation({
                            disease: a.disease,
                            location: `${a.mandal}, ${a.district}`,
                            cases: a.case_count,
                            baseline: Math.max(1, Math.round(a.case_count / 3)),
                            affected_mandals: 1,
                          })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map + Accuracy */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-lg border bg-white p-5" style={card}>
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold" style={{ color: NAVY }}>{t("map_title")}</h2>
                <p className="text-[10px] text-slate-500">
                  {timelapse && timelapseMapNodes ? (
                    <span>
                      <span className="font-bold" style={{ color: "#6A1B9A" }}>Time-lapse:</span> {timelapse.frames[tlWeek]?.week_label}
                      {" · "}{timelapse.frames[tlWeek]?.total_cases_this_week} cases this week
                    </span>
                  ) : t("map_subtitle")}
                </p>
              </div>
              {timelapse && timelapse.frames && timelapse.frames.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setTlPlaying(p => !p); }}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-bold text-white"
                    style={{ background: "#6A1B9A" }}
                  >
                    {tlPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {tlPlaying ? "Pause" : "Play 26-week"}
                  </button>
                  <button
                    onClick={() => { setTlPlaying(false); setTlWeek(0); }}
                    className="ap-btn-secondary px-2 py-1.5 text-[11px]"
                    title="Reset to week 1"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {timelapse && timelapse.frames && timelapse.frames.length > 0 && (
              <div className="mb-3 px-1">
                <input
                  type="range"
                  min={0}
                  max={timelapse.frames.length - 1}
                  value={tlWeek}
                  onChange={(e) => { setTlPlaying(false); setTlWeek(Number(e.target.value)); }}
                  className="w-full"
                  style={{ accentColor: "#6A1B9A" }}
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                  <span>{timelapse.frames[0]?.week_label}</span>
                  <span className="font-bold" style={{ color: "#6A1B9A" }}>{timelapse.frames[tlWeek]?.week_label}</span>
                  <span>{timelapse.frames[timelapse.frames.length - 1]?.week_label}</span>
                </div>
              </div>
            )}

            <div className="h-[320px] overflow-hidden rounded-md border" style={{ borderColor: SKY_LINE }}>
              <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-500">Loading map…</div>}>
                {!loading && <MapComponent nodes={timelapseMapNodes || mapNodes} timelineDay={0} />}
              </Suspense>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-lg border bg-white p-5" style={card}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-4 w-4" style={{ color: "#2E7D32" }} />
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>{t("accuracy_title")}</h2>
            </div>
            {accuracy ? (
              <div className="space-y-4">
                <div className="rounded-md border p-4 text-center" style={{ background: "#E8F5E9", borderColor: "#C8E6C9" }}>
                  <p className="text-4xl font-extrabold" style={{ color: "#2E7D32" }}>{accuracy.overall_accuracy_pct}%</p>
                  <p className="text-xs font-medium mt-1" style={{ color: "#1B5E20" }}>{t("accuracy_overall")}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#2E7D32" }}>{accuracy.total_evaluated.toLocaleString()} {t("accuracy_records_evaluated")}</p>
                </div>
                {Object.entries(accuracy.per_category).map(([cat, data]: [string, any]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{cat}</span>
                      <span className="text-xs font-bold" style={{ color: NAVY }}>{data.accuracy}%</span>
                    </div>
                    <div className="ap-progress success">
                      <div className="bar" style={{ width: `${data.accuracy}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{data.correct} / {data.total} correct</p>
                  </div>
                ))}
                <div className="rounded-md p-3 text-[10px] space-y-1 border" style={{ background: "#F8FBFE", borderColor: SKY_LINE, color: "#475569" }}>
                  <p className="font-semibold text-slate-800">{t("accuracy_validations")}</p>
                  <p style={{ color: "#2E7D32" }}>✓ {t("accuracy_approved")}: {accuracy.feedback_stats?.approved ?? 0}</p>
                  <p style={{ color: "#E65100" }}>✎ {t("accuracy_corrected")}: {accuracy.feedback_stats?.corrected ?? 0}</p>
                  <p style={{ color: "#C62828" }}>✗ {t("accuracy_rejected")}: {accuracy.feedback_stats?.rejected ?? 0}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-xs text-slate-500">Loading accuracy data…</div>
            )}
          </div>
        </div>

        {/* Trend + Top Diseases */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border bg-white p-5" style={card}>
            <h2 className="mb-4 text-sm font-bold" style={{ color: NAVY }}>{t("trend_title")}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                {trends[0] && Object.keys(trends[0]).filter(k => k !== "week").map((key, i) => {
                  const colors = ["#C62828", "#1976D2", "#E65100", "#2E7D32"];
                  return <Area key={key} type="monotone" dataKey={key} stroke={colors[i % 4]} fill={colors[i % 4]} fillOpacity={0.10} strokeWidth={2} />;
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border bg-white p-5" style={card}>
            <h2 className="mb-4 text-sm font-bold" style={{ color: NAVY }}>{t("top_diseases")}</h2>
            <div className="space-y-3">
              {topDiseases.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-500 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-700 truncate">{d.name}</span>
                      <span className="text-xs font-bold ml-2" style={{ color: NAVY }}>{d.count.toLocaleString()}</span>
                    </div>
                    <div className="ap-progress" style={{ height: 6 }}>
                      <div className="bar" style={{ width: `${(d.count / (topDiseases[0]?.count || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast */}
        <div className="rounded-lg border bg-white p-5" style={card}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: "#E65100" }} />
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>{t("forecast_title")}</h2>
            </div>
            <select
              value={forecastDistrict}
              onChange={e => setForecastDistrict(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
              style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}
            >
              {districts.filter(d => d.cases > 0).map(d => (
                <option key={d.district_upper} value={d.district_upper}>{d.district}</option>
              ))}
            </select>
          </div>
          <p className="mb-3 text-[10px] text-slate-500">{t("forecast_subtitle")}</p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="upper_ci" stroke="none" fill="#FFB74D" fillOpacity={0.18} name="Upper CI" />
              <Area type="monotone" dataKey="lower_ci" stroke="none" fill="#FFB74D" fillOpacity={0.18} name="Lower CI" />
              <Line type="monotone" dataKey="predicted" stroke="#E65100" strokeWidth={2.5} dot={{ r: 4, fill: "#E65100" }} name="Predicted Cases" />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-7 gap-2">
            {forecast.map(f => (
              <div key={f.day} className="rounded-md p-2 text-center border" style={{ background: "#FFF8E1", borderColor: "#FFE082" }}>
                <p className="text-[10px] font-bold" style={{ color: "#E65100" }}>{f.day}</p>
                <p className="text-sm font-extrabold" style={{ color: "#7A4F01" }}>{f.predicted}</p>
                <p className="text-[9px]" style={{ color: "#B26A00" }}>{f.lower_ci}–{f.upper_ci}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-District Pattern Insights */}
        {intelligence && intelligence.correlations && intelligence.correlations.length > 0 && (
          <div
            data-demo-id="pattern-insights"
            className="rounded-lg border p-5"
            style={{ background: "#F3E5F5", borderColor: "#CE93D8" }}
          >
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Radar className="h-5 w-5" style={{ color: "#6A1B9A" }} />
                <div>
                  <h2 className="text-sm font-bold" style={{ color: "#4A148C" }}>Pattern Insights — Cross-District Outbreak Intelligence</h2>
                  <p className="text-[10px] text-slate-600">{intelligence.total_patterns_detected} multi-district correlation{intelligence.total_patterns_detected === 1 ? "" : "s"} detected · AI-generated hypotheses</p>
                </div>
              </div>
              <span className="ap-badge ap-badge-info">
                <Sparkles className="h-3 w-3" /> AI-POWERED
              </span>
            </div>

            {intelligence.ai_explanation_for_top ? (
              <div className="mb-4 rounded-md border bg-white p-4" style={{ borderColor: "#CE93D8" }}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6A1B9A" }}>AI Analysis — Top Pattern</p>
                  <AISafetyBadge compact role="State Surveillance Officer" />
                </div>
                <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-line">{intelligence.ai_explanation_for_top}</p>
                <p className="mt-2 text-[9px] text-slate-500 italic">Final decision remains with the authorized State Surveillance Officer.</p>
              </div>
            ) : (
              <div className="mb-4 rounded-md border p-3" style={{ background: "#FFF8E1", borderColor: "#FFE082" }}>
                <p className="text-[11px]" style={{ color: "#7A4F01" }}>
                  <strong>AI service temporarily unavailable.</strong> Showing rule-based surveillance intelligence below.
                </p>
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-2">
              {intelligence.correlations.slice(0, 4).map((corr: any, i: number) => {
                const sevStyle =
                  corr.severity === "Critical"
                    ? { border: "#FFCDD2", bg: "#FFEBEE", badgeClass: "ap-badge-critical" }
                    : corr.severity === "High"
                    ? { border: "#FFCC80", bg: "#FFF3E0", badgeClass: "ap-badge-high" }
                    : { border: "#FFE082", bg: "#FFF8E1", badgeClass: "ap-badge-amber" };
                return (
                  <div key={i} className="rounded-md border-2 p-4" style={{ background: sevStyle.bg, borderColor: sevStyle.border }}>
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{corr.cluster}</p>
                        <h3 className="mt-0.5 text-sm font-bold text-slate-900">{corr.disease} — {corr.total_cases} cases</h3>
                      </div>
                      <span className={`ap-badge ${sevStyle.badgeClass}`}>
                        {corr.severity} · {corr.spike_ratio}x
                      </span>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {corr.districts_affected.map((d: any) => (
                        <span key={d.district} className="rounded px-2 py-0.5 text-[10px] font-semibold text-slate-700 border bg-white" style={{ borderColor: SKY_LINE }}>
                          {d.district} <span className="text-slate-400">({d.cases})</span>
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-600 italic"><span className="font-bold not-italic text-slate-700">Hypothesis:</span> {corr.hypothesis}</p>
                    <p className="mt-1 text-[11px] text-slate-700"><span className="font-bold">Action:</span> {corr.recommended_action}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <ExplainAlert
                        variant="link"
                        explanation={{
                          alert_title: `${corr.disease} pattern in ${corr.cluster}`,
                          data_source: `Aggregated OPD records across ${corr.districts_affected.length} adjacent AP districts in the ${corr.cluster} cluster.`,
                          current_value: `${corr.total_cases} cases combined across cluster`,
                          baseline_value: `${corr.state_baseline_per_district} cases per district (state median)`,
                          delta: `${corr.spike_ratio}x state median (${corr.severity})`,
                          threshold_rule: `Cross-district pattern fires when ≥2 districts in the same geo cluster exceed ${corr.state_baseline_per_district}+ cases for the same disease in one week.`,
                          recommended_actions: [corr.recommended_action, `Coordinate joint surveillance via State Surveillance Unit`],
                        }}
                      />
                      <AISafetyBadge compact role="District / State Surveillance Officer" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* District Risk Table */}
        <div className="rounded-lg border bg-white overflow-hidden" style={card}>
          <div className="flex items-center justify-between border-b px-6 py-4 flex-wrap gap-2" style={{ borderColor: SKY_LINE }}>
            <div>
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>{t("district_table_title")}</h2>
              <p className="text-[10px] text-slate-500">{t("district_table_subtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { window.open(`${API}/api/reports/idsp`, "_blank"); toast.success("IDSP JSON opened"); }}
                className="ap-btn-secondary"
              >
                <FileText className="h-3.5 w-3.5" /> {t("idsp_report")}
              </button>
              <button
                onClick={() => { window.open(`${API}/api/reports/idsp?format=pdf`, "_blank"); toast.success("IDSP PDF downloading"); }}
                className="ap-btn-primary"
              >
                <FileText className="h-3.5 w-3.5" /> Download PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto ap-scroll">
            <table className="w-full">
              <thead style={{ background: SKY }}>
                <tr>
                  {[t("col_district"), t("col_status"), t("col_region"), t("col_cases"), t("col_forecast"), t("col_top_disease"), t("col_risk"), t("col_mandals")].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {districts.map((row, i) => (
                  <tr
                    key={row.district}
                    className="border-t cursor-pointer"
                    style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}
                    onClick={() => setDetailDistrict(row)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = SKY)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#FFFFFF" : "#F8FBFE")}
                    title="Click for district details"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" style={{ color: row.risk_score >= 8 ? "#C62828" : "#94A3B8" }} />
                        <span className="text-sm font-semibold text-slate-800">{row.district}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`ap-badge ${row.status === "live" ? "ap-badge-low" : "ap-badge-moderate"}`}>
                        {row.status === "live" ? t("status_live") : t("status_ready")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{row.region}</td>
                    <td className="px-5 py-3 text-sm font-bold tabular-nums" style={{ color: NAVY }}>{row.cases.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-slate-700 tabular-nums">{row.predicted_7d.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full border bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-700" style={{ borderColor: SKY_LINE }}>
                        {td(row.top_disease)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full" style={{ background: SKY }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(row.risk_score / 10) * 100}%`,
                              background:
                                row.risk_score >= 8 ? "#C62828" :
                                row.risk_score >= 6 ? "#E65100" :
                                "#2E7D32",
                            }}
                          />
                        </div>
                        <span className="text-xs font-extrabold" style={{
                          color: row.risk_score >= 8 ? "#C62828" : row.risk_score >= 6 ? "#E65100" : "#2E7D32",
                        }}>
                          {row.risk_score}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{row.mandals || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <PilotRolloutCard />

        <p dir={isRTL ? "rtl" : "ltr"} className="text-center text-[10px] text-slate-500">
          <Shield className="mr-1 inline h-3 w-3" />
          {t("footer_compliance")}
        </p>
      </main>

      <AICopilot floating patientContext={{ role: "State Health Officer", scope: "Statewide AP" }} />
      <GuidedDemo open={guidedDemoOpen} onClose={() => setGuidedDemoOpen(false)} />

      {/* ─── KPI: Records detail ─── */}
      <DetailModal
        open={detailKpi === "records"}
        onClose={() => setDetailKpi(null)}
        title="Total Records — Volume Breakdown"
        subtitle="Real anonymised AP OPD records + synthetic load-test records"
        icon={Users}
        size="lg"
      >
        <DetailGrid
          items={[
            { label: "Total Volume", value: totalCases.toLocaleString() },
            { label: "Real Records", value: realCases.toLocaleString(), accent: "#2E7D32" },
            { label: "Synthetic", value: syntheticCases.toLocaleString(), accent: "#E65100" },
          ]}
        />
        <DetailSection title="Top 8 Disease Categories">
          <div className="space-y-2.5">
            {topDiseases.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700 truncate">{d.name}</span>
                    <span className="text-xs font-bold" style={{ color: NAVY }}>{d.count.toLocaleString()}</span>
                  </div>
                  <div className="ap-progress" style={{ height: 6 }}>
                    <div className="bar" style={{ width: `${(d.count / (topDiseases[0]?.count || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DetailSection>
      </DetailModal>

      {/* ─── KPI: Districts detail ─── */}
      <DetailModal
        open={detailKpi === "districts"}
        onClose={() => setDetailKpi(null)}
        title="All AP Districts"
        subtitle={`${liveDistricts} live · ${readyDistricts} ready · ${districts.length} total`}
        icon={MapPin}
        accent="#00695C"
        size="lg"
      >
        <div className="overflow-x-auto ap-scroll">
          <table className="w-full text-sm">
            <thead style={{ background: SKY }}>
              <tr>
                {["District", "Region", "Status", "Cases", "Risk"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {districts.map((d, i) => (
                <tr key={d.district} className="border-t" style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{d.district}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-600">{d.region}</td>
                  <td className="px-4 py-2.5">
                    <span className={`ap-badge ${d.cases > 0 ? "ap-badge-low" : "ap-badge-moderate"}`}>
                      {d.cases > 0 ? "Live" : "Ready"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm font-bold tabular-nums" style={{ color: NAVY }}>{d.cases.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs font-bold" style={{ color: d.risk_score >= 8 ? "#C62828" : d.risk_score >= 6 ? "#E65100" : "#2E7D32" }}>{d.risk_score}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailModal>

      {/* ─── KPI: Critical districts detail ─── */}
      <DetailModal
        open={detailKpi === "critical"}
        onClose={() => setDetailKpi(null)}
        title="Critical Districts (Risk ≥ 8)"
        subtitle={`${criticalDistricts} district${criticalDistricts === 1 ? "" : "s"} require immediate attention`}
        icon={AlertTriangle}
        accent="#C62828"
        size="lg"
      >
        {districts.filter(d => d.risk_score >= 8).length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No districts at critical risk level.</p>
        ) : (
          <div className="space-y-3">
            {districts.filter(d => d.risk_score >= 8).map(d => (
              <div key={d.district} className="rounded-md border p-4" style={{ background: "#FFEBEE", borderColor: "#FFCDD2" }}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold" style={{ color: "#C62828" }}>{d.district}</h3>
                  <span className="ap-badge ap-badge-critical">Risk {d.risk_score}/10</span>
                </div>
                <p className="text-xs text-slate-700">{d.cases.toLocaleString()} cases · Top: {d.top_disease} · Region: {d.region}</p>
                <p className="text-xs text-slate-600 mt-1">Forecast (7-day): {d.predicted_7d.toLocaleString()} · Mandals: {d.mandals}</p>
              </div>
            ))}
          </div>
        )}
      </DetailModal>

      {/* ─── KPI: Accuracy detail ─── */}
      <DetailModal
        open={detailKpi === "accuracy"}
        onClose={() => setDetailKpi(null)}
        title="AI Classification Accuracy"
        subtitle={accuracy ? `${accuracy.total_evaluated.toLocaleString()} records evaluated` : "Loading..."}
        icon={CheckCircle}
        accent="#2E7D32"
      >
        {accuracy ? (
          <>
            <DetailGrid
              items={[
                { label: "Overall", value: `${accuracy.overall_accuracy_pct}%`, accent: "#2E7D32" },
                { label: "Approved", value: accuracy.feedback_stats?.approved ?? 0, accent: "#2E7D32" },
                { label: "Corrected", value: accuracy.feedback_stats?.corrected ?? 0, accent: "#E65100" },
                { label: "Rejected", value: accuracy.feedback_stats?.rejected ?? 0, accent: "#C62828" },
              ]}
              cols={4}
            />
            <DetailSection title="Per-Category Accuracy">
              <div className="space-y-3">
                {Object.entries(accuracy.per_category).map(([cat, data]: [string, any]) => (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{cat}</span>
                      <span className="text-xs font-bold" style={{ color: NAVY }}>{data.accuracy}%</span>
                    </div>
                    <div className="ap-progress success">
                      <div className="bar" style={{ width: `${data.accuracy}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{data.correct} / {data.total} correct</p>
                  </div>
                ))}
              </div>
            </DetailSection>
          </>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">Loading accuracy data…</p>
        )}
      </DetailModal>

      {/* ─── District row detail ─── */}
      <DetailModal
        open={!!detailDistrict}
        onClose={() => setDetailDistrict(null)}
        title={detailDistrict?.district || ""}
        subtitle={detailDistrict ? `${detailDistrict.region} · ${detailDistrict.cases > 0 ? "Live" : "Ready"}` : ""}
        icon={MapPin}
        accent={detailDistrict?.risk_score >= 8 ? "#C62828" : detailDistrict?.risk_score >= 6 ? "#E65100" : "#0D47A1"}
        size="lg"
      >
        {detailDistrict && (
          <>
            <DetailGrid
              items={[
                { label: "Cases", value: detailDistrict.cases.toLocaleString() },
                { label: "Forecast (7d)", value: detailDistrict.predicted_7d.toLocaleString(), accent: "#E65100" },
                {
                  label: "Risk",
                  value: `${detailDistrict.risk_score}/10`,
                  accent: detailDistrict.risk_score >= 8 ? "#C62828" : detailDistrict.risk_score >= 6 ? "#E65100" : "#2E7D32",
                },
                { label: "Mandals", value: detailDistrict.mandals || "—" },
              ]}
              cols={4}
            />
            <DetailSection title="Top Disease">
              <p className="text-sm font-semibold text-slate-800">{detailDistrict.top_disease}</p>
            </DetailSection>
            <DetailSection title="Intensity">
              <p className="text-xs text-slate-600 mb-2">{(detailDistrict.intensity * 100).toFixed(0)}% of statewide peak</p>
              <div className="ap-progress" style={{ height: 8 }}>
                <div className="bar" style={{ width: `${detailDistrict.intensity * 100}%` }} />
              </div>
            </DetailSection>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDetailDistrict(null)} className="ap-btn-secondary">
                Close
              </button>
              <button onClick={() => navigate("/district-dashboard")} className="ap-btn-primary">
                Open District Dashboard →
              </button>
            </div>
          </>
        )}
      </DetailModal>
    </div>
  );
}
