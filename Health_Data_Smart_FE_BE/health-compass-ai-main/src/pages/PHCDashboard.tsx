import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Stethoscope, ArrowLeft, CheckCircle, XCircle, Edit3,
  AlertTriangle, LogOut, MapPin, Pill, TrendingDown, Mic,
} from "lucide-react";
import AICopilot from "@/components/AICopilot";
import AudioCaseDiary from "@/components/AudioCaseDiary";
import AISafetyBadge from "@/components/AISafetyBadge";
import ExplainAlert from "@/components/ExplainAlert";
import DetailModal, { DetailGrid, DetailSection, DetailRow } from "@/components/DetailModal";
import { Activity } from "lucide-react";
import { MANDAL_COORDS } from "@/data/mandalCoordinates";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const MapComponent = lazy(() => import("@/components/MapComponent"));

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const NAVY = "#0D47A1";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";
const PAGE_BG = "#F4F8FC";

const CATEGORIES = ["Communicable", "Non-Communicable", "Other"];
const cardStyle = { background: "#FFFFFF", borderColor: SKY_LINE };

export default function PHCDashboard() {
  const navigate = useNavigate();
  const { t, isRTL } = useLang();
  const [districts, setDistricts] = useState<any[]>([]);
  const [phcs, setPhcs] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedPHC, setSelectedPHC] = useState("");
  const [, setPatients] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [topDiseases, setTopDiseases] = useState<any[]>([]);
  const [feedbackState, setFeedbackState] = useState<Record<string, { action: string; correctedCategory?: string }>>({});
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [drugForecast, setDrugForecast] = useState<any>(null);
  const [audioDiaryOpen, setAudioDiaryOpen] = useState(false);
  const [detailKpi, setDetailKpi] = useState<null | "facility" | "cases" | "pending" | "topcond">(null);
  const [detailDrug, setDetailDrug] = useState<any | null>(null);
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
    fetch(`${API}/api/phcs?district=${encodeURIComponent(selectedDistrict)}`).then(r => r.json()).then(d => {
      setPhcs(d.phcs || []);
      if (d.phcs?.length) setSelectedPHC(d.phcs[0].phc_code);
    });
  }, [selectedDistrict]);

  useEffect(() => {
    if (!selectedPHC) return;
    Promise.all([
      fetch(`${API}/api/patients?limit=20&offset=0`).then(r => r.json()),
      fetch(`${API}/api/validation/queue?phc=${encodeURIComponent(selectedPHC)}&limit=15`).then(r => r.json()),
      fetch(`${API}/api/diseases/top?district=${encodeURIComponent(selectedDistrict)}&limit=5`).then(r => r.json()),
      fetch(`${API}/api/phc/${encodeURIComponent(selectedPHC)}/drug-forecast`).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([p, q, td, df]) => {
      setPatients(p.patients || []);
      setQueue(q.queue || []);
      setTopDiseases(td.diseases || []);
      setDrugForecast(df);
    });
  }, [selectedPHC]);

  const handleFeedback = async (item: any, action: "approve" | "correct" | "reject", correctedCategory?: string) => {
    try {
      await fetch(`${API}/api/ai/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op_id: item.op_id, original_category: item.ai_category, original_icd10: item.ai_icd10,
          corrected_category: correctedCategory || item.ai_category, corrected_icd10: item.ai_icd10,
          officer_role: "phc", district: selectedDistrict, phc: selectedPHC, action,
        }),
      });
      setFeedbackState(prev => ({ ...prev, [item.op_id]: { action, correctedCategory } }));
      setCorrecting(null);
      toast.success(action === "approve" ? "Classification approved ✓" : action === "correct" ? `Corrected to ${correctedCategory}` : "Case rejected");
    } catch {
      toast.error("Failed to save feedback");
    }
  };

  const selectedPHCInfo = phcs.find(p => p.phc_code === selectedPHC);

  const phcLocation = useMemo(() => {
    if (!selectedDistrict || !selectedPHC) return null;
    const districtMandals = MANDAL_COORDS[selectedDistrict];
    if (!districtMandals) return null;
    const names = Object.keys(districtMandals);
    if (!names.length) return null;
    let hash = 0;
    for (const ch of selectedPHC) hash = (hash * 31 + ch.charCodeAt(0)) % names.length;
    const chosenMandal = names[hash];
    return { ...districtMandals[chosenMandal], mandal: chosenMandal };
  }, [selectedDistrict, selectedPHC]);

  return (
    <div className="min-h-screen w-full" style={{ background: PAGE_BG }}>
      <header className="w-full border-b" style={{ background: "#FFFFFF", borderColor: SKY_LINE }}>
        <div className="w-full flex items-center justify-between px-8 py-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="ap-btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: NAVY }}>
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <div dir={isRTL ? "rtl" : "ltr"}>
              <h1 className="text-sm font-bold" style={{ color: NAVY }}>{t("phc_title")}</h1>
              <p className="text-[10px] text-slate-500">{t("phc_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className="rounded-md border px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none" style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}>
              <optgroup label="● LIVE">
                {districts.filter(d => d.cases > 0).map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
              </optgroup>
              <optgroup label="○ READY">
                {districts.filter(d => d.cases === 0).map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
              </optgroup>
            </select>
            <select value={selectedPHC} onChange={e => setSelectedPHC(e.target.value)} className="rounded-md border px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none max-w-[180px]" style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}>
              {phcs.map(p => <option key={p.phc_code} value={p.phc_code}>{p.facility_name}</option>)}
            </select>
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="ap-btn-ghost"><LogOut className="h-3.5 w-3.5 inline mr-1" /> {t("exit")}</button>
          </div>
        </div>
      </header>

      <main className="w-full px-8 py-6 space-y-6">
        {selectedPHCInfo && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {([
              { key: "facility" as const, label: "Facility", value: selectedPHCInfo.facility_name, sub: selectedPHCInfo.facility_type },
              { key: "cases" as const, label: "Total Cases", value: selectedPHCInfo.cases, sub: "OPD records" },
              { key: "pending" as const, label: "Pending Validation", value: queue.length, sub: "Low confidence AI classifications" },
              { key: "topcond" as const, label: "Top Condition", value: selectedPHCInfo.top_disease, sub: "Most frequent complaint" },
            ]).map(kpi => (
              <button key={kpi.label} onClick={() => setDetailKpi(kpi.key)} className="text-left rounded-lg border bg-white p-5 ap-card-hover w-full" style={cardStyle} title="Click to see detailed breakdown">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{kpi.label}</p>
                <p className="mt-2 text-sm font-extrabold truncate" style={{ color: NAVY }} title={String(kpi.value)}>{kpi.value}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{kpi.sub}</p>
                <p className="mt-2 text-[10px] font-semibold" style={{ color: NAVY }}>View details →</p>
              </button>
            ))}
          </div>
        )}

        {phcLocation && selectedPHCInfo && (
          <div className="rounded-lg border bg-white p-5" style={cardStyle}>
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold" style={{ color: NAVY }}>PHC Catchment Area</h2>
                <p className="text-[10px] text-slate-500">{selectedPHCInfo.facility_name} · 5 km radius · ~{phcLocation.mandal} mandal</p>
              </div>
              <span className="ap-badge ap-badge-low">
                <MapPin className="h-3 w-3" /> {selectedPHCInfo.cases} OPD cases
              </span>
            </div>
            <div className="h-[280px] overflow-hidden rounded-md border" style={{ borderColor: SKY_LINE }}>
              <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-500">Loading map…</div>}>
                <MapComponent
                  nodes={[{
                    name: selectedPHCInfo.facility_name, lat: phcLocation.lat, lng: phcLocation.lng,
                    intensity: 0.8, cases: selectedPHCInfo.cases,
                    capacity: Math.min(95, 60 + selectedPHCInfo.cases), disease: selectedPHCInfo.top_disease,
                  }]}
                  center={[phcLocation.lat, phcLocation.lng]}
                  zoom={12}
                  catchmentCircle={{ lat: phcLocation.lat, lng: phcLocation.lng, radius_m: 5000, label: `${selectedPHCInfo.facility_name} — 5km catchment` }}
                />
              </Suspense>
            </div>
          </div>
        )}

        {drugForecast && drugForecast.drugs && (
          <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="flex items-center gap-2 border-b px-6 py-4 flex-wrap" style={{ borderColor: SKY_LINE }}>
              <Pill className="h-4 w-4" style={{ color: "#2E7D32" }} />
              <div className="min-w-[260px]">
                <h2 className="text-sm font-bold" style={{ color: NAVY }}>Drug Stock Forecast — AI-Predicted Stockouts</h2>
                <p className="text-[10px] text-slate-500">Based on {drugForecast.data_period_days}-day OPD consumption trend at this PHC</p>
                <div className="mt-1 flex items-center gap-2">
                  <AISafetyBadge compact role="PHC Pharmacist / MO" />
                  <ExplainAlert
                    variant="link"
                    explanation={{
                      alert_title: "Drug stock forecast methodology",
                      data_source: `OPD records at this PHC over the last ${drugForecast.data_period_days} days. Each disease maps to one or more essential drugs via a calibrated consumption table.`,
                      current_value: `${drugForecast.summary.critical_drugs} critical · ${drugForecast.summary.low_drugs} low · ${drugForecast.summary.warn_drugs} warn`,
                      baseline_value: `Default stock baselines: Paracetamol 80 packs, ORS 200 sachets, Amlodipine 60 packs.`,
                      delta: "Days-to-stockout = current stock ÷ daily burn rate",
                      threshold_rule: "Critical < 7 days · Low < 14 days · Warn < 30 days · OK ≥ 30 days",
                      recommended_actions: [
                        "Place re-order request for critical/low drugs immediately via PHC Pharmacist",
                        "Verify physical stock weekly — model uses estimated stock baselines",
                        "Notify District Drug Logistics if multiple PHCs hit critical for the same drug",
                      ],
                    }}
                  />
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {drugForecast.summary.critical_drugs > 0 && <span className="ap-badge ap-badge-critical">{drugForecast.summary.critical_drugs} CRITICAL</span>}
                {drugForecast.summary.low_drugs > 0 && <span className="ap-badge ap-badge-high">{drugForecast.summary.low_drugs} LOW</span>}
                {drugForecast.summary.warn_drugs > 0 && <span className="ap-badge ap-badge-amber">{drugForecast.summary.warn_drugs} WARN</span>}
              </div>
            </div>
            <div className="overflow-x-auto ap-scroll">
              <table className="w-full text-xs">
                <thead style={{ background: SKY }}>
                  <tr>
                    {["Drug", "Current Stock", "Daily Burn", "Days Left", "Stockout Date", "Re-order"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: NAVY }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {drugForecast.drugs.map((d: any, i: number) => {
                    const badgeClass = d.status === "critical" ? "ap-badge-critical" : d.status === "low" ? "ap-badge-high" : d.status === "warn" ? "ap-badge-amber" : "ap-badge-low";
                    return (
                      <tr
                        key={i}
                        className="border-t cursor-pointer hover:bg-blue-50"
                        style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}
                        onClick={() => setDetailDrug(d)}
                        title="Click for drug forecast details"
                      >
                        <td className="px-5 py-3">
                          <div className="font-bold text-slate-900">{d.drug}</div>
                          <div className="text-[10px] text-slate-500">{d.form}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          <span className="font-bold">{d.current_stock_units}</span>
                          <span className="text-[10px] text-slate-500 ml-1">({d.current_stock_packs} packs)</span>
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          {d.daily_burn_units > 0 ? (
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-slate-400" />
                              <span>{d.daily_burn_units}/day</span>
                            </div>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-3">
                          {d.days_to_stockout !== null ? <span className={`ap-badge ${badgeClass}`}>{d.days_to_stockout} days</span> : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-3 text-slate-700">{d.stockout_date || <span className="text-slate-400">&gt; 60 days</span>}</td>
                        <td className="px-5 py-3 text-[11px]">
                          {d.reorder_recommendation === "Stock adequate" ? <span style={{ color: "#2E7D32" }}>{d.reorder_recommendation}</span> : d.reorder_recommendation === "—" ? <span className="text-slate-400">—</span> : <span className="font-semibold text-slate-900">{d.reorder_recommendation}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
          <div className="flex items-center gap-2 border-b px-6 py-4 flex-wrap" style={{ borderColor: SKY_LINE }}>
            <AlertTriangle className="h-4 w-4" style={{ color: "#E65100" }} />
            <div>
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>AI Classification — Approve / Correct / Reject</h2>
              <p className="text-[10px] text-slate-500">Cases where AI confidence &lt; 80% — officer review required</p>
              <AISafetyBadge compact role="PHC Medical Officer" className="mt-0.5" />
            </div>
            <span className="ap-badge ap-badge-amber ml-auto">{queue.length} cases</span>
          </div>
          <div className="divide-y">
            {queue.length === 0 && (
              <div className="flex items-center gap-2 px-6 py-8 text-sm text-slate-500">
                <CheckCircle className="h-4 w-4" style={{ color: "#2E7D32" }} />
                No cases pending validation for this PHC.
              </div>
            )}
            {queue.map((item, i) => {
              const state = feedbackState[item.op_id];
              const done = !!state;
              return (
                <div key={item.op_id} className="px-6 py-4 border-t" style={{ background: done ? "#F8FBFE" : i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}>
                  <div className="flex items-start gap-4 flex-wrap">
                    <button
                      onClick={() => setDetailQueue(item)}
                      className="flex-1 min-w-[200px] text-left hover:bg-blue-50 rounded-md p-1 -m-1"
                      title="Click for full case details"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">{item.complaint}</span>
                        <span className={`ap-badge ${item.ai_category === "Communicable" ? "ap-badge-critical" : item.ai_category === "Non-Communicable" ? "ap-badge-moderate" : "ap-badge-info"}`}>
                          {item.ai_category}
                        </span>
                        <span className="rounded px-2 py-0.5 font-mono text-[10px] text-slate-700 border bg-white" style={{ borderColor: SKY_LINE }}>{item.ai_icd10}</span>
                        <span className="text-[10px] font-bold" style={{ color: item.confidence < 0.6 ? "#C62828" : "#E65100" }}>{Math.round(item.confidence * 100)}% confidence</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{item.facility_name} · {item.district} · {item.mandal}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.ai_icd_desc}</p>
                    </button>

                    {done ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`ap-badge ${state.action === "approve" ? "ap-badge-low" : state.action === "correct" ? "ap-badge-moderate" : "ap-badge-critical"}`}>
                          {state.action === "approve" ? "✓ Approved" : state.action === "correct" ? `✎ ${state.correctedCategory}` : "✗ Rejected"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleFeedback(item, "approve")} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "#C8E6C9", background: "#E8F5E9", color: "#2E7D32" }}>
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={() => setCorrecting(correcting === item.op_id ? null : item.op_id)} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "#BBDEFB", background: SKY, color: NAVY }}>
                          <Edit3 className="h-3.5 w-3.5" /> Correct
                        </button>
                        <button onClick={() => handleFeedback(item, "reject")} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "#FFCDD2", background: "#FFEBEE", color: "#C62828" }}>
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {correcting === item.op_id && !done && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-600">Correct to:</span>
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => handleFeedback(item, "correct", cat)} className="rounded-md px-3 py-1.5 text-xs font-bold border"
                          style={cat === "Communicable" ? { borderColor: "#FFCDD2", background: "#FFEBEE", color: "#C62828" } :
                                 cat === "Non-Communicable" ? { borderColor: "#BBDEFB", background: SKY, color: NAVY } :
                                 { borderColor: SKY_LINE, background: "#FFFFFF", color: "#475569" }}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5" style={cardStyle}>
          <h2 className="mb-4 text-sm font-bold" style={{ color: NAVY }}>Local Disease Distribution — {selectedDistrict}</h2>
          <div className="space-y-3">
            {topDiseases.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="w-5 text-[10px] font-bold text-slate-500 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">{d.name}</span>
                    <span className="text-xs font-bold" style={{ color: NAVY }}>{d.count} cases</span>
                  </div>
                  <div className="ap-progress success">
                    <div className="bar" style={{ width: `${(d.count / (topDiseases[0]?.count || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <button
        onClick={() => setAudioDiaryOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-md px-5 py-3 text-sm font-bold text-white shadow-md"
        style={{ background: NAVY }}
        title="Speak a case in any language — AI fills the form"
      >
        <Mic className="h-4 w-4" /> Audio Case
      </button>
      <AudioCaseDiary open={audioDiaryOpen} onClose={() => setAudioDiaryOpen(false)} defaultDistrict={selectedDistrict} />

      <AICopilot floating patientContext={{ role: "PHC Medical Officer", district: selectedDistrict, phc: selectedPHC, facility: selectedPHCInfo?.facility_name }} />

      {/* ─── KPI Detail Modals ─── */}
      <DetailModal
        open={detailKpi === "facility"}
        onClose={() => setDetailKpi(null)}
        title={selectedPHCInfo?.facility_name || ""}
        subtitle={`${selectedPHCInfo?.facility_type || ""} · ${selectedDistrict}`}
        icon={Activity}
      >
        {selectedPHCInfo && (
          <>
            <DetailGrid
              items={[
                { label: "Facility", value: selectedPHCInfo.facility_name },
                { label: "Type", value: selectedPHCInfo.facility_type, accent: selectedPHCInfo.facility_type === "UPHC" ? "#6A1B9A" : "#2E7D32" },
                { label: "District", value: selectedDistrict },
              ]}
            />
            <div className="mt-5 space-y-1">
              <DetailRow label="PHC Code" value={<span className="font-mono text-xs">{selectedPHCInfo.phc_code}</span>} />
              <DetailRow label="Total OPD cases" value={selectedPHCInfo.cases.toLocaleString()} />
              <DetailRow label="Top condition" value={selectedPHCInfo.top_disease} />
              <DetailRow label="Pending validation" value={`${queue.length} cases`} />
            </div>
          </>
        )}
      </DetailModal>

      <DetailModal
        open={detailKpi === "cases"}
        onClose={() => setDetailKpi(null)}
        title="OPD Case Volume"
        subtitle={`${selectedPHCInfo?.cases?.toLocaleString() || 0} records at ${selectedPHCInfo?.facility_name || "this PHC"}`}
        icon={Activity}
        size="lg"
      >
        {selectedPHCInfo && (
          <>
            <DetailGrid
              items={[
                { label: "Total Cases", value: selectedPHCInfo.cases.toLocaleString() },
                { label: "Top Condition", value: selectedPHCInfo.top_disease },
                { label: "Pending Validation", value: queue.length, accent: "#E65100" },
              ]}
            />
            <DetailSection title="Local Disease Distribution">
              <div className="space-y-2.5">
                {topDiseases.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-700 truncate">{d.name}</span>
                        <span className="text-xs font-bold" style={{ color: NAVY }}>{d.count}</span>
                      </div>
                      <div className="ap-progress success">
                        <div className="bar" style={{ width: `${(d.count / (topDiseases[0]?.count || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          </>
        )}
      </DetailModal>

      <DetailModal
        open={detailKpi === "pending"}
        onClose={() => setDetailKpi(null)}
        title={`Pending Validation — ${queue.length} cases`}
        subtitle="AI classifications below the 80% confidence threshold"
        icon={Activity}
        accent="#E65100"
        size="lg"
      >
        {queue.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No cases pending validation.</p>
        ) : (
          <div className="space-y-2">
            {queue.map((item) => (
              <button
                key={item.op_id}
                onClick={() => { setDetailKpi(null); setDetailQueue(item); }}
                className="w-full text-left rounded-md border bg-white p-3 hover:bg-blue-50"
                style={{ borderColor: SKY_LINE }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[260px]">{item.complaint}</span>
                  <span className={`ap-badge ${item.ai_category === "Communicable" ? "ap-badge-critical" : item.ai_category === "Non-Communicable" ? "ap-badge-moderate" : "ap-badge-info"}`}>
                    {item.ai_category}
                  </span>
                  <span className="text-[10px] font-bold ml-auto" style={{ color: item.confidence < 0.6 ? "#C62828" : "#E65100" }}>{Math.round(item.confidence * 100)}%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{item.mandal} · ICD-10: <span className="font-mono">{item.ai_icd10}</span></p>
              </button>
            ))}
          </div>
        )}
      </DetailModal>

      <DetailModal
        open={detailKpi === "topcond"}
        onClose={() => setDetailKpi(null)}
        title={`Top Condition — ${selectedPHCInfo?.top_disease || ""}`}
        subtitle={`Most frequent at ${selectedPHCInfo?.facility_name || "this PHC"}`}
        icon={Activity}
        accent="#6A1B9A"
      >
        <DetailSection title="Local Disease Distribution">
          <div className="space-y-2.5">
            {topDiseases.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700 truncate">{d.name}</span>
                    <span className="text-xs font-bold" style={{ color: NAVY }}>{d.count}</span>
                  </div>
                  <div className="ap-progress">
                    <div className="bar" style={{ width: `${(d.count / (topDiseases[0]?.count || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DetailSection>
      </DetailModal>

      {/* ─── Drug forecast row detail ─── */}
      <DetailModal
        open={!!detailDrug}
        onClose={() => setDetailDrug(null)}
        title={detailDrug?.drug || ""}
        subtitle={detailDrug?.form || ""}
        icon={Activity}
        accent={
          detailDrug?.status === "critical" ? "#C62828" :
          detailDrug?.status === "low" ? "#E65100" :
          detailDrug?.status === "warn" ? "#B26A00" : "#2E7D32"
        }
      >
        {detailDrug && (
          <>
            <DetailGrid
              items={[
                { label: "Current Stock", value: `${detailDrug.current_stock_units} (${detailDrug.current_stock_packs} packs)` },
                { label: "Daily Burn", value: detailDrug.daily_burn_units > 0 ? `${detailDrug.daily_burn_units}/day` : "—", accent: "#E65100" },
                {
                  label: "Days Left",
                  value: detailDrug.days_to_stockout !== null ? `${detailDrug.days_to_stockout} days` : "—",
                  accent: detailDrug.status === "critical" ? "#C62828" : detailDrug.status === "low" ? "#E65100" : "#2E7D32",
                },
              ]}
            />
            <div className="mt-5 space-y-1">
              <DetailRow label="Status" value={<span className="uppercase">{detailDrug.status}</span>} />
              <DetailRow label="Stockout Date" value={detailDrug.stockout_date || "> 60 days"} />
              <DetailRow label="Re-order recommendation" value={detailDrug.reorder_recommendation || "—"} />
            </div>
            <DetailSection title="Methodology">
              <p className="text-xs text-slate-700 leading-relaxed">
                Days-to-stockout = current stock ÷ daily burn rate. Critical &lt; 7 days · Low &lt; 14 days · Warn &lt; 30 days · OK ≥ 30 days.
                Daily burn is computed from OPD records at this PHC over the last {drugForecast?.data_period_days || 30} days using a calibrated disease-to-drug consumption table.
              </p>
            </DetailSection>
          </>
        )}
      </DetailModal>

      {/* ─── Queue row detail (full case) ─── */}
      <DetailModal
        open={!!detailQueue}
        onClose={() => setDetailQueue(null)}
        title="AI Classification — Case Detail"
        subtitle={detailQueue?.facility_name || ""}
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
          </>
        )}
      </DetailModal>
    </div>
  );
}
