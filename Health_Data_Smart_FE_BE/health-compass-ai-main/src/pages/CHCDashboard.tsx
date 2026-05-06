import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Hospital, ArrowLeft, CheckCircle, Edit3, XCircle,
  ChevronDown, LogOut, BarChart3, MapPin,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AICopilot from "@/components/AICopilot";
import DetailModal, { DetailGrid, DetailSection, DetailRow } from "@/components/DetailModal";
import { Activity } from "lucide-react";
import { MANDAL_COORDS } from "@/data/mandalCoordinates";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const MapComponent = lazy(() => import("@/components/MapComponent"));

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const NAVY = "#0D47A1";
const ELECTRIC = "#1976D2";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";
const PAGE_BG = "#F4F8FC";

const CATEGORIES = ["Communicable", "Non-Communicable", "Other"];

const chartTooltipStyle = {
  background: "#FFFFFF",
  border: `1px solid ${SKY_LINE}`,
  borderRadius: "8px",
  fontSize: "11px",
  color: "#0F172A",
  boxShadow: "0 4px 12px rgba(15,23,42,0.10)",
};

const cardStyle = { background: "#FFFFFF", borderColor: SKY_LINE };

export default function CHCDashboard() {
  const navigate = useNavigate();
  const { t, isRTL } = useLang();
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [queue, setQueue] = useState<any[]>([]);
  const [phcs, setPhcs] = useState<any[]>([]);
  const [topDiseases, setTopDiseases] = useState<any[]>([]);
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [detailQueue, setDetailQueue] = useState<any | null>(null);
  const [detailDisease, setDetailDisease] = useState<any | null>(null);

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
    Promise.all([
      fetch(`${API}/api/validation/queue?district=${encodeURIComponent(selectedDistrict)}&limit=20`).then(r => r.json()),
      fetch(`${API}/api/phcs?district=${encodeURIComponent(selectedDistrict)}`).then(r => r.json()),
      fetch(`${API}/api/diseases/top?district=${encodeURIComponent(selectedDistrict)}&limit=8`).then(r => r.json()),
    ]).then(([q, p, td]) => {
      setQueue(q.queue || []);
      setPhcs(p.phcs?.slice(0, 8) || []);
      setTopDiseases(td.diseases || []);
    });
  }, [selectedDistrict]);

  const handleFeedback = async (item: any, action: "approve" | "correct" | "reject", correctedCategory?: string) => {
    await fetch(`${API}/api/ai/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        op_id: item.op_id, original_category: item.ai_category,
        original_icd10: item.ai_icd10, corrected_category: correctedCategory || item.ai_category,
        corrected_icd10: item.ai_icd10, officer_role: "chc",
        district: selectedDistrict, action,
      }),
    });
    setFeedbackState(prev => ({ ...prev, [item.op_id]: action }));
    setCorrecting(null);
    toast.success(action === "approve" ? "Approved ✓" : action === "correct" ? `Corrected to ${correctedCategory}` : "Rejected");
  };

  const chartData = phcs.map(p => ({ name: p.facility_name.replace("PHC ", "").slice(0, 12), cases: p.cases }));

  const blockMapNodes = useMemo(() => {
    if (!phcs.length || !selectedDistrict) return [];
    const districtMandals = MANDAL_COORDS[selectedDistrict];
    if (!districtMandals) return [];
    const mandalNames = Object.keys(districtMandals);
    if (!mandalNames.length) return [];
    const maxCases = Math.max(...phcs.map(p => p.cases), 1);
    return phcs.map((p, i) => {
      const mandalName = mandalNames[i % mandalNames.length];
      const coords = districtMandals[mandalName];
      return {
        name: p.facility_name,
        lat: coords.lat + (Math.random() - 0.5) * 0.04,
        lng: coords.lng + (Math.random() - 0.5) * 0.04,
        intensity: p.cases / maxCases,
        cases: p.cases,
        capacity: Math.round((p.cases / maxCases) * 90),
        disease: p.top_disease,
      };
    });
  }, [phcs, selectedDistrict]);

  const blockCenter = useMemo<[number, number] | undefined>(() => {
    const districtMandals = MANDAL_COORDS[selectedDistrict];
    if (!districtMandals) return undefined;
    const first = Object.values(districtMandals)[0];
    return first ? [first.lat, first.lng] : undefined;
  }, [selectedDistrict]);

  return (
    <div className="min-h-screen w-full" style={{ background: PAGE_BG }}>
      <header className="w-full border-b" style={{ background: "#FFFFFF", borderColor: SKY_LINE }}>
        <div className="w-full flex items-center justify-between px-8 py-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="ap-btn-ghost">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: NAVY }}>
              <Hospital className="h-4 w-4 text-white" />
            </div>
            <div dir={isRTL ? "rtl" : "ltr"}>
              <h1 className="text-sm font-bold" style={{ color: NAVY }}>{t("chc_title")}</h1>
              <p className="text-[10px] text-slate-500">{t("chc_subtitle")}</p>
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
                <optgroup label="● LIVE">
                  {districts.filter(d => d.cases > 0).map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
                </optgroup>
                <optgroup label="○ READY">
                  {districts.filter(d => d.cases === 0).map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
                </optgroup>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="ap-btn-ghost">
              <LogOut className="h-3.5 w-3.5 inline mr-1" /> {t("exit")}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-8 py-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border bg-white p-5" style={cardStyle}>
            <h2 className="mb-4 text-sm font-bold" style={{ color: NAVY }}>PHC Case Distribution — {selectedDistrict}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#475569" }} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: SKY }} />
                <Bar dataKey="cases" fill={ELECTRIC} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border bg-white p-5" style={cardStyle}>
            <h2 className="mb-4 text-sm font-bold" style={{ color: NAVY }}>Block Disease Burden</h2>
            <div className="space-y-3">
              {topDiseases.map((d, i) => (
                <button
                  key={d.name}
                  onClick={() => setDetailDisease(d)}
                  className="w-full text-left rounded-md p-1.5 -m-1.5 hover:bg-blue-50"
                  title="Click for disease details"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 w-4 text-right shrink-0">{i + 1}</span>
                      <span className="text-xs font-medium text-slate-700 truncate">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold shrink-0 ml-2" style={{ color: NAVY }}>{d.count}</span>
                  </div>
                  <div className="ap-progress" style={{ height: 4 }}>
                    <div className="bar" style={{ width: `${(d.count / (topDiseases[0]?.count || 1)) * 100}%` }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {blockMapNodes.length > 0 && blockCenter && (
          <div className="rounded-lg border bg-white p-5" style={cardStyle}>
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-bold" style={{ color: NAVY }}>Block-Level PHC Map</h2>
                <p className="text-[10px] text-slate-500">{blockMapNodes.length} PHCs in {selectedDistrict.replace(/_/g, " ")} block</p>
              </div>
              <span className="ap-badge ap-badge-moderate">
                <MapPin className="h-3 w-3" /> Block overview
              </span>
            </div>
            <div className="h-[300px] overflow-hidden rounded-md border" style={{ borderColor: SKY_LINE }}>
              <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-500">Loading map…</div>}>
                <MapComponent nodes={blockMapNodes} center={blockCenter} zoom={10} />
              </Suspense>
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-white overflow-hidden" style={cardStyle}>
          <div className="flex items-center gap-2 border-b px-6 py-4 flex-wrap" style={{ borderColor: SKY_LINE }}>
            <BarChart3 className="h-4 w-4" style={{ color: NAVY }} />
            <div>
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>AI Feedback Loop — Classification Review</h2>
              <p className="text-[10px] text-slate-500">Review and correct AI disease classifications to improve model accuracy</p>
            </div>
            <span className="ap-badge ap-badge-moderate ml-auto">{queue.length} cases</span>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto ap-scroll">
            {queue.length === 0 && (
              <div className="flex items-center gap-2 px-6 py-10 text-sm text-slate-500">
                <CheckCircle className="h-4 w-4" style={{ color: "#2E7D32" }} /> No cases pending review for this district.
              </div>
            )}
            {queue.map((item, i) => {
              const done = !!feedbackState[item.op_id];
              return (
                <div key={item.op_id} className="px-6 py-4 border-t" style={{ background: done ? "#F8FBFE" : i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}>
                  <div className="flex items-start gap-4 flex-wrap">
                    <button
                      onClick={() => setDetailQueue(item)}
                      className="flex-1 min-w-[200px] text-left hover:bg-blue-50 rounded-md p-1 -m-1"
                      title="Click for case details"
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800">{item.complaint?.split(",")[0]}</span>
                        <span className={`ap-badge ${item.ai_category === "Communicable" ? "ap-badge-critical" : item.ai_category === "Non-Communicable" ? "ap-badge-moderate" : "ap-badge-info"}`}>
                          {item.ai_category}
                        </span>
                        <span className="rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-700 border bg-white" style={{ borderColor: SKY_LINE }}>{item.ai_icd10}</span>
                        <span className="text-[10px] font-bold" style={{ color: item.confidence < 0.6 ? "#C62828" : "#E65100" }}>
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{item.facility_name} · {item.mandal}</p>
                    </button>
                    {done ? (
                      <span className={`ap-badge shrink-0 ${feedbackState[item.op_id] === "approve" ? "ap-badge-low" : feedbackState[item.op_id] === "correct" ? "ap-badge-moderate" : "ap-badge-critical"}`}>
                        {feedbackState[item.op_id] === "approve" ? "✓ Approved" : feedbackState[item.op_id] === "correct" ? "✎ Corrected" : "✗ Rejected"}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleFeedback(item, "approve")} className="rounded-md border px-2.5 py-1.5 text-xs font-bold" style={{ borderColor: "#C8E6C9", background: "#E8F5E9", color: "#2E7D32" }} title="Approve">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setCorrecting(correcting === item.op_id ? null : item.op_id)} className="rounded-md border px-2.5 py-1.5 text-xs font-bold" style={{ borderColor: "#BBDEFB", background: SKY, color: NAVY }} title="Correct">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleFeedback(item, "reject")} className="rounded-md border px-2.5 py-1.5 text-xs font-bold" style={{ borderColor: "#FFCDD2", background: "#FFEBEE", color: "#C62828" }} title="Reject">
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {correcting === item.op_id && !done && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-600">Correct to:</span>
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => handleFeedback(item, "correct", cat)} className="ap-btn-secondary px-3 py-1 text-xs">
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
      </main>

      <AICopilot floating patientContext={{ role: "CHC Block Medical Officer", district: selectedDistrict, scope: "Block-level" }} />

      {/* ─── Disease detail ─── */}
      <DetailModal
        open={!!detailDisease}
        onClose={() => setDetailDisease(null)}
        title={detailDisease?.name || ""}
        subtitle={`Block disease burden — ${selectedDistrict}`}
        icon={Activity}
        accent="#6A1B9A"
      >
        {detailDisease && (
          <>
            <DetailGrid
              items={[
                { label: "Cases", value: detailDisease.count },
                {
                  label: "Share",
                  value: `${((detailDisease.count / Math.max(1, topDiseases.reduce((s, d) => s + d.count, 0))) * 100).toFixed(1)}%`,
                  accent: "#6A1B9A",
                },
                { label: "Rank", value: `#${topDiseases.findIndex(d => d.name === detailDisease.name) + 1}` },
              ]}
            />
            <DetailSection title="Context">
              <p className="text-xs text-slate-700 leading-relaxed">
                {detailDisease.name} accounts for {detailDisease.count} cases in the {selectedDistrict} block.
                Officer-validated AI classifications drive trend tracking and seasonal alerting.
              </p>
            </DetailSection>
          </>
        )}
      </DetailModal>

      {/* ─── Queue case detail ─── */}
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
              <DetailRow label="Mandal" value={detailQueue.mandal || "—"} />
              <DetailRow label="OP ID" value={<span className="font-mono text-xs">{detailQueue.op_id}</span>} />
            </div>
          </>
        )}
      </DetailModal>
    </div>
  );
}
