import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin, AlertTriangle, ArrowLeft, FileText,
  ChevronDown, LogOut, Download, MessageCircle,
} from "lucide-react";
import AICopilot from "@/components/AICopilot";
import OutbreakBroadcast from "@/components/OutbreakBroadcast";
import ExplainAlert from "@/components/ExplainAlert";
import DetailModal, { DetailGrid, DetailSection, DetailRow } from "@/components/DetailModal";
import { Activity } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getMandalCoords } from "@/data/mandalCoordinates";
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

const cardStyle = { background: "#FFFFFF", borderColor: SKY_LINE };

export default function DistrictDashboard() {
  const navigate = useNavigate();
  const { t, isRTL } = useLang();
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [mandals, setMandals] = useState<any[]>([]);
  const [phcs, setPhcs] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [idspReport, setIdspReport] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [detailKpi, setDetailKpi] = useState<null | "cases" | "mandals" | "forecast" | "risk">(null);
  const [detailMandal, setDetailMandal] = useState<any | null>(null);
  const [detailPhc, setDetailPhc] = useState<any | null>(null);
  const [detailQueue, setDetailQueue] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${API}/api/districts/all`).then(r => r.json()).then(d => {
      const all = d.districts || [];
      setDistricts(all);
      const firstLive = all.find((x: any) => x.cases > 0) || all[0];
      if (firstLive) setSelectedDistrict(firstLive.district_upper);
    });
  }, []);

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
    <div className="min-h-screen w-full" style={{ background: PAGE_BG }}>
      <header className="w-full border-b" style={{ background: "#FFFFFF", borderColor: SKY_LINE }}>
        <div className="w-full flex items-center justify-between px-8 py-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="ap-btn-ghost">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: NAVY }}>
              <MapPin className="h-4 w-4 text-white" />
            </div>
            <div dir={isRTL ? "rtl" : "ltr"}>
              <h1 className="text-sm font-bold" style={{ color: NAVY }}>{t("district_title")}</h1>
              <p className="text-[10px] text-slate-500">{t("district_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="appearance-none rounded-md border px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 outline-none"
                style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}
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
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
            <button onClick={downloadCSV} className="ap-btn-secondary">
              <Download className="h-3.5 w-3.5" /> {t("district_idsp_csv")}
            </button>
            <button onClick={() => setBroadcastOpen(true)} className="ap-btn-primary" title="Broadcast WhatsApp outbreak alert to citizens">
              <MessageCircle className="h-3.5 w-3.5" /> Broadcast Alert
            </button>
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="ap-btn-ghost">
              <LogOut className="h-3.5 w-3.5 inline mr-1" /> {t("exit")}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-8 py-6 space-y-6">

        {/* KPI Row — clickable */}
        {districtInfo && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {([
              { key: "cases" as const, label: t("district_kpi_cases"), value: districtInfo.cases.toLocaleString(), sub: selectedDistrict, color: NAVY },
              { key: "mandals" as const, label: t("district_kpi_mandals"), value: districtInfo.mandals, sub: t("district_kpi_mandals_sub"), color: "#00695C" },
              { key: "forecast" as const, label: t("district_kpi_forecast"), value: districtInfo.predicted_7d.toLocaleString(), sub: t("district_kpi_forecast_sub"), color: "#E65100" },
              { key: "risk" as const, label: t("district_kpi_risk"), value: `${districtInfo.risk_score}/10`, sub: districtInfo.risk_score >= 8 ? t("risk_critical") : districtInfo.risk_score >= 6 ? t("risk_high") : t("risk_moderate"), color: districtInfo.risk_score >= 8 ? "#C62828" : "#E65100" },
            ]).map((kpi) => (
              <button key={kpi.label} onClick={() => setDetailKpi(kpi.key)} className="text-left rounded-lg border bg-white p-5 ap-card-hover w-full" style={cardStyle} title="Click to see detailed breakdown">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{kpi.label}</p>
                <p className="mt-2 text-2xl font-extrabold tabular-nums" style={{ color: kpi.color }}>{loadingDetail ? "–" : kpi.value}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{kpi.sub}</p>
                <p className="mt-2 text-[10px] font-semibold" style={{ color: NAVY }}>View details →</p>
                {kpi.key === "risk" && districtInfo.risk_score >= 6 && (
                  <div className="mt-2">
                    <ExplainAlert
                      variant="link"
                      explanation={{
                        alert_title: `${districtInfo.district} risk score ${districtInfo.risk_score}/10`,
                        data_source: `Aggregated OPD records for ${districtInfo.district} District over the last 6 weeks (real + synthetic load-test data combined).`,
                        current_value: `${districtInfo.cases.toLocaleString()} total cases · top disease: ${districtInfo.top_disease}`,
                        baseline_value: `State-median per-district case volume (computed from all 29 districts)`,
                        delta: `Intensity ${(districtInfo.intensity * 100).toFixed(0)}% of statewide peak`,
                        threshold_rule: "Risk score = 4.0 + intensity × 5.5, capped at 9.9. Critical ≥ 8.0 · High ≥ 6.0 · Moderate ≥ 4.0",
                        recommended_actions: [
                          districtInfo.risk_score >= 8
                            ? "Activate district outbreak response protocol immediately"
                            : "Increase passive surveillance at PHCs in high-burden mandals",
                          "Verify field signals from ANM/ASHA workers in top mandals",
                          "Notify State Surveillance Unit for joint review",
                        ],
                      }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Map */}
        {districtInfo && (
          <div className="rounded-lg border bg-white p-5" style={cardStyle}>
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold" style={{ color: NAVY }}>{districtInfo.district} District Hotspot Map</h2>
                <p className="text-[10px] text-slate-500">Mandal-level disease density · {mandalMapNodes.length} mandals plotted</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                {[
                  { label: "Critical", color: "#C62828" },
                  { label: "High", color: "#E65100" },
                  { label: "Moderate", color: "#2E7D32" },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 font-semibold text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-[320px] overflow-hidden rounded-md border" style={{ borderColor: SKY_LINE }}>
              <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-500">Loading map…</div>}>
                <MapComponent nodes={mandalMapNodes} center={[districtInfo.lat, districtInfo.lng]} zoom={9} />
              </Suspense>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-lg border bg-white p-5" style={cardStyle}>
            <h2 className="mb-4 text-sm font-bold" style={{ color: NAVY }}>{t("district_disease_trend")} — {selectedDistrict.replace(/_/g, ' ')}</h2>
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

          <div className="lg:col-span-2 rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: SKY_LINE }}>
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>{t("district_idsp_weekly")}</h2>
              <FileText className="h-4 w-4" style={{ color: ELECTRIC }} />
            </div>
            <div className="divide-y max-h-[260px] overflow-y-auto ap-scroll" style={{ borderColor: SKY_LINE }}>
              {idspReport?.rows?.slice(0, 8).map((row: any) => (
                <div key={row.disease} className="grid grid-cols-4 gap-2 px-5 py-2.5 text-xs border-t" style={{ borderColor: SKY_LINE }}>
                  <span className="col-span-1 font-medium text-slate-800 truncate" title={row.disease}>{row.disease}</span>
                  <span className="text-center font-bold" style={{ color: ELECTRIC }}>S:{row.S}</span>
                  <span className="text-center font-bold" style={{ color: "#E65100" }}>P:{row.P}</span>
                  <span className="text-center font-bold" style={{ color: "#2E7D32" }}>L:{row.L}</span>
                </div>
              ))}
              {!idspReport && <p className="px-5 py-4 text-xs text-slate-500">Loading IDSP data…</p>}
            </div>
            <div className="border-t px-5 py-2.5" style={{ borderColor: SKY_LINE }}>
              <p className="text-[10px] text-slate-500">{t("idsp_legend")}</p>
            </div>
          </div>
        </div>

        {/* Mandal + PHC tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="border-b px-5 py-4" style={{ borderColor: SKY_LINE }}>
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>{t("mandal_burden")}</h2>
              <p className="text-[10px] text-slate-500">{mandals.length} {t("mandal_count_in")} {selectedDistrict.replace(/_/g,' ')}</p>
            </div>
            <div className="overflow-y-auto max-h-[320px] ap-scroll">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: SKY }}>
                  <tr>
                    {["Mandal", "Cases", "Top Disease"].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mandals.map((m, i) => (
                    <tr
                      key={m.mandal}
                      className="border-t cursor-pointer hover:bg-blue-50"
                      style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}
                      onClick={() => setDetailMandal(m)}
                      title="Click for mandal details"
                    >
                      <td className="px-5 py-2.5 text-xs font-medium text-slate-800">{m.mandal}</td>
                      <td className="px-5 py-2.5 text-xs font-bold tabular-nums" style={{ color: NAVY }}>{m.cases}</td>
                      <td className="px-5 py-2.5">
                        <span className="ap-badge ap-badge-moderate">{m.top_disease}</span>
                      </td>
                    </tr>
                  ))}
                  {!mandals.length && (
                    <tr><td colSpan={3} className="px-5 py-6 text-center text-xs text-slate-500">Loading mandal data…</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="border-b px-5 py-4" style={{ borderColor: SKY_LINE }}>
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>{t("phc_performance")}</h2>
              <p className="text-[10px] text-slate-500">{phcs.length} {t("phc_facilities_in_district")}</p>
            </div>
            <div className="overflow-y-auto max-h-[320px] ap-scroll">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: SKY }}>
                  <tr>
                    {["Facility", "Type", "Cases", "Top Disease"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {phcs.slice(0, 30).map((p, i) => (
                    <tr
                      key={p.phc_code}
                      className="border-t cursor-pointer hover:bg-blue-50"
                      style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}
                      onClick={() => setDetailPhc(p)}
                      title="Click for PHC details"
                    >
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-800 max-w-[140px] truncate" title={p.facility_name}>{p.facility_name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`ap-badge ${p.facility_type === "UPHC" ? "ap-badge-info" : "ap-badge-low"}`}>{p.facility_type}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-bold tabular-nums" style={{ color: NAVY }}>{p.cases}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full border bg-white px-2 py-0.5 text-[10px] text-slate-700" style={{ borderColor: SKY_LINE }}>{p.top_disease}</span>
                      </td>
                    </tr>
                  ))}
                  {!phcs.length && (
                    <tr><td colSpan={4} className="px-5 py-6 text-center text-xs text-slate-500">Loading PHC data…</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Validation Queue */}
        {queue.length > 0 && (
          <div className="rounded-lg border overflow-hidden" style={{ background: "#FFF8E1", borderColor: "#FFE082" }}>
            <div className="flex items-center gap-2 border-b px-5 py-4 flex-wrap" style={{ borderColor: "#FFE082" }}>
              <AlertTriangle className="h-4 w-4" style={{ color: "#E65100" }} />
              <h2 className="text-sm font-bold text-slate-900">{t("validation_queue")}</h2>
              <span className="ap-badge ap-badge-amber ml-auto">{queue.length} {t("pending")}</span>
            </div>
            <div className="overflow-x-auto ap-scroll">
              <table className="w-full">
                <thead style={{ background: "#FFF3E0" }}>
                  <tr>
                    {["PHC", "Complaint", "AI Category", "ICD-10", "Confidence"].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "#7A4F01" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item, i) => (
                    <tr
                      key={item.op_id}
                      className="border-t cursor-pointer hover:bg-amber-100"
                      style={{ background: i % 2 === 0 ? "#FFFFFF" : "#FFFBE6", borderColor: "#FFE082" }}
                      onClick={() => setDetailQueue(item)}
                      title="Click for full case details"
                    >
                      <td className="px-5 py-2.5 text-xs text-slate-700 max-w-[120px] truncate">{item.facility_name || item.phc}</td>
                      <td className="px-5 py-2.5 text-xs text-slate-700 max-w-[160px] truncate">{item.complaint}</td>
                      <td className="px-5 py-2.5">
                        <span className={`ap-badge ${item.ai_category === "Communicable" ? "ap-badge-critical" : item.ai_category === "Non-Communicable" ? "ap-badge-moderate" : "ap-badge-info"}`}>
                          {item.ai_category}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-xs font-mono text-slate-700">{item.ai_icd10}</td>
                      <td className="px-5 py-2.5">
                        <span className="text-xs font-bold" style={{ color: "#E65100" }}>{Math.round(item.confidence * 100)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <OutbreakBroadcast
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        district={districtInfo?.district || selectedDistrict}
        topDisease={districtInfo?.top_disease || "Fever"}
        cases={districtInfo?.cases || 0}
      />

      <AICopilot floating patientContext={{
        role: "District Health Officer",
        district: selectedDistrict,
        district_name: districtInfo?.district,
        cases: districtInfo?.cases,
      }} />

      {/* ─── KPI Detail Modals ─── */}
      <DetailModal
        open={detailKpi === "cases"}
        onClose={() => setDetailKpi(null)}
        title={`${districtInfo?.district || ""} — Case Volume Breakdown`}
        subtitle={`${districtInfo?.cases?.toLocaleString() || 0} total OPD cases`}
        icon={Activity}
        size="lg"
      >
        {districtInfo && (
          <>
            <DetailGrid
              items={[
                { label: "Total Cases", value: districtInfo.cases.toLocaleString() },
                { label: "Top Disease", value: districtInfo.top_disease },
                { label: "Mandals", value: districtInfo.mandals || "—", accent: "#00695C" },
              ]}
            />
            <DetailSection title={`Top mandals in ${districtInfo.district}`}>
              <div className="space-y-2">
                {mandals.slice(0, 8).map((m, i) => (
                  <div key={m.mandal} className="flex items-center justify-between border-b py-2" style={{ borderColor: SKY_LINE }}>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-500 w-4">{i + 1}</span>
                      <span className="text-xs font-medium text-slate-800">{m.mandal}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="ap-badge ap-badge-moderate">{m.top_disease}</span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: NAVY }}>{m.cases}</span>
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          </>
        )}
      </DetailModal>

      <DetailModal
        open={detailKpi === "mandals"}
        onClose={() => setDetailKpi(null)}
        title={`${districtInfo?.district || ""} — All Mandals`}
        subtitle={`${mandals.length} mandals in this district`}
        icon={MapPin}
        accent="#00695C"
        size="lg"
      >
        <div className="overflow-x-auto ap-scroll">
          <table className="w-full text-sm">
            <thead style={{ background: SKY }}>
              <tr>
                {["Mandal", "Cases", "Top Disease"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mandals.map((m, i) => (
                <tr key={m.mandal} className="border-t" style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{m.mandal}</td>
                  <td className="px-4 py-2.5 text-sm font-bold tabular-nums" style={{ color: NAVY }}>{m.cases}</td>
                  <td className="px-4 py-2.5"><span className="ap-badge ap-badge-moderate">{m.top_disease}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailModal>

      <DetailModal
        open={detailKpi === "forecast"}
        onClose={() => setDetailKpi(null)}
        title={`${districtInfo?.district || ""} — 7-Day Forecast`}
        subtitle={`Predicted ${districtInfo?.predicted_7d?.toLocaleString() || 0} cases over next 7 days`}
        icon={Activity}
        accent="#E65100"
      >
        {districtInfo && (
          <>
            <DetailGrid
              items={[
                { label: "Current week", value: districtInfo.cases.toLocaleString() },
                { label: "Predicted (7d)", value: districtInfo.predicted_7d.toLocaleString(), accent: "#E65100" },
                {
                  label: "Change",
                  value: `${districtInfo.cases > 0 ? Math.round(((districtInfo.predicted_7d - districtInfo.cases) / districtInfo.cases) * 100) : 0}%`,
                  accent: districtInfo.predicted_7d > districtInfo.cases ? "#C62828" : "#2E7D32",
                },
              ]}
            />
            <DetailSection title="Methodology">
              <p className="text-xs text-slate-700 leading-relaxed">
                7-day forecast uses an autoregressive model trained on this district's 6-week trend.
                Confidence intervals widen for districts with sparse data.
              </p>
            </DetailSection>
          </>
        )}
      </DetailModal>

      <DetailModal
        open={detailKpi === "risk"}
        onClose={() => setDetailKpi(null)}
        title={`${districtInfo?.district || ""} — Risk Score ${districtInfo?.risk_score || "?"}/10`}
        subtitle={districtInfo?.risk_score >= 8 ? "Critical risk level" : districtInfo?.risk_score >= 6 ? "High risk level" : "Moderate risk level"}
        icon={Activity}
        accent={districtInfo?.risk_score >= 8 ? "#C62828" : districtInfo?.risk_score >= 6 ? "#E65100" : "#2E7D32"}
      >
        {districtInfo && (
          <>
            <DetailGrid
              items={[
                {
                  label: "Risk Score",
                  value: `${districtInfo.risk_score}/10`,
                  accent: districtInfo.risk_score >= 8 ? "#C62828" : districtInfo.risk_score >= 6 ? "#E65100" : "#2E7D32",
                },
                { label: "Total Cases", value: districtInfo.cases.toLocaleString() },
                { label: "Intensity", value: `${(districtInfo.intensity * 100).toFixed(0)}%`, accent: "#E65100" },
              ]}
            />
            <DetailSection title="Risk Computation">
              <p className="text-xs text-slate-700 leading-relaxed">
                Risk score = 4.0 + intensity × 5.5, capped at 9.9.
                Critical ≥ 8.0 · High ≥ 6.0 · Moderate ≥ 4.0.
                Intensity is this district's case volume relative to the statewide peak district.
              </p>
            </DetailSection>
            <DetailSection title="Recommended Actions">
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-start gap-2"><span className="font-bold mt-0.5" style={{ color: "#2E7D32" }}>✓</span>
                  {districtInfo.risk_score >= 8 ? "Activate district outbreak response protocol immediately" : "Increase passive surveillance at PHCs in high-burden mandals"}
                </li>
                <li className="flex items-start gap-2"><span className="font-bold mt-0.5" style={{ color: "#2E7D32" }}>✓</span>
                  Verify field signals from ANM/ASHA workers in top mandals
                </li>
                <li className="flex items-start gap-2"><span className="font-bold mt-0.5" style={{ color: "#2E7D32" }}>✓</span>
                  Notify State Surveillance Unit for joint review
                </li>
              </ul>
            </DetailSection>
          </>
        )}
      </DetailModal>

      {/* ─── Mandal row detail ─── */}
      <DetailModal
        open={!!detailMandal}
        onClose={() => setDetailMandal(null)}
        title={detailMandal?.mandal || ""}
        subtitle={`Mandal in ${districtInfo?.district || selectedDistrict}`}
        icon={MapPin}
        accent="#00695C"
      >
        {detailMandal && (
          <>
            <DetailGrid
              items={[
                { label: "Cases", value: detailMandal.cases },
                { label: "Top Disease", value: detailMandal.top_disease },
                { label: "Population share", value: `${((detailMandal.cases / Math.max(1, mandals.reduce((s, m) => s + m.cases, 0))) * 100).toFixed(1)}%`, accent: "#00695C" },
              ]}
            />
            <DetailSection title="Epidemiological context">
              <p className="text-xs text-slate-700">
                {detailMandal.mandal} contributes {detailMandal.cases} of the
                {" "}{mandals.reduce((s, m) => s + m.cases, 0)} cases recorded across
                {" "}{districtInfo?.district || selectedDistrict}.
                Top condition is {detailMandal.top_disease}.
              </p>
            </DetailSection>
          </>
        )}
      </DetailModal>

      {/* ─── PHC row detail ─── */}
      <DetailModal
        open={!!detailPhc}
        onClose={() => setDetailPhc(null)}
        title={detailPhc?.facility_name || ""}
        subtitle={`${detailPhc?.facility_type || "PHC"} · ${districtInfo?.district || selectedDistrict}`}
        icon={Activity}
      >
        {detailPhc && (
          <>
            <DetailGrid
              items={[
                { label: "Facility Type", value: detailPhc.facility_type },
                { label: "Cases", value: detailPhc.cases },
                { label: "Top Condition", value: detailPhc.top_disease },
              ]}
            />
            <div className="mt-5 space-y-1">
              <DetailRow label="PHC Code" value={<span className="font-mono text-xs">{detailPhc.phc_code}</span>} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDetailPhc(null)} className="ap-btn-secondary">Close</button>
              <button onClick={() => navigate("/phc-dashboard")} className="ap-btn-primary">Open PHC Dashboard →</button>
            </div>
          </>
        )}
      </DetailModal>

      {/* ─── Validation queue row detail ─── */}
      <DetailModal
        open={!!detailQueue}
        onClose={() => setDetailQueue(null)}
        title="AI Classification — Case Detail"
        subtitle={detailQueue?.facility_name || detailQueue?.phc || ""}
        icon={Activity}
        accent="#E65100"
        size="lg"
      >
        {detailQueue && (
          <>
            <div className="rounded-md border p-4 mb-4" style={{ background: "#FFF8E1", borderColor: "#FFE082" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#7A4F01" }}>Patient Complaint</p>
              <p className="text-sm text-slate-800">{detailQueue.complaint || "—"}</p>
            </div>
            <DetailGrid
              items={[
                { label: "AI Category", value: detailQueue.ai_category },
                { label: "ICD-10", value: <span className="font-mono">{detailQueue.ai_icd10}</span> },
                { label: "Confidence", value: `${Math.round(detailQueue.confidence * 100)}%`, accent: detailQueue.confidence < 0.6 ? "#C62828" : "#E65100" },
              ]}
            />
            <div className="mt-5 space-y-1">
              <DetailRow label="District" value={detailQueue.district || selectedDistrict} />
              <DetailRow label="Mandal" value={detailQueue.mandal || "—"} />
              <DetailRow label="OP ID" value={<span className="font-mono text-xs">{detailQueue.op_id}</span>} />
              <DetailRow label="ICD-10 description" value={detailQueue.ai_icd_desc || "—"} />
            </div>
            <DetailSection title="Next step">
              <p className="text-xs text-slate-700">
                Open the PHC dashboard to approve, correct, or reject this AI classification. Officer feedback trains future model accuracy.
              </p>
            </DetailSection>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDetailQueue(null)} className="ap-btn-secondary">Close</button>
              <button onClick={() => navigate("/phc-dashboard")} className="ap-btn-primary">Review at PHC →</button>
            </div>
          </>
        )}
      </DetailModal>
    </div>
  );
}
