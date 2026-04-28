import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Hospital, ArrowLeft, AlertTriangle, CheckCircle, Edit3, XCircle,
  ChevronDown, LogOut, BarChart3, MapPin,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AICopilot from "@/components/AICopilot";
import { MANDAL_COORDS } from "@/data/mandalCoordinates";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const MapComponent = lazy(() => import("@/components/MapComponent"));

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };
const CATEGORIES = ["Communicable", "Non-Communicable", "Other"];

export default function CHCDashboard() {
  const navigate = useNavigate();
  const { t, td, isRTL } = useLang();
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [queue, setQueue] = useState<any[]>([]);
  const [phcs, setPhcs] = useState<any[]>([]);
  const [topDiseases, setTopDiseases] = useState<any[]>([]);
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [correcting, setCorrecting] = useState<string | null>(null);

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

  // Compute block-level map: distribute PHCs across mandals in the district
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
      // Slight jitter so multiple PHCs in same mandal don't overlap perfectly
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
    <div className="min-h-screen bg-slate-50">
      <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600" />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg">
              <Hospital className="h-4 w-4 text-white" />
            </div>
            <div dir={isRTL ? "rtl" : "ltr"}>
              <h1 className="text-sm font-bold text-slate-900">{t("chc_title")}</h1>
              <p className="text-[10px] text-slate-500">{t("chc_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-violet-400">
                <optgroup label="● LIVE">
                  {districts.filter(d => d.cases > 0).map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
                </optgroup>
                <optgroup label="○ READY">
                  {districts.filter(d => d.cases === 0).map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
                </optgroup>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              <LogOut className="h-3.5 w-3.5" /> {t("exit")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">

        <div className="grid gap-6 lg:grid-cols-3">
          {/* PHC Case Distribution Chart */}
          <motion.div {...fade} transition={{ delay: 0.05 }} className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900">PHC Case Distribution — {selectedDistrict}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} width={90} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "10px", fontSize: "11px", color: "#f8fafc" }} />
                <Bar dataKey="cases" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top diseases */}
          <motion.div {...fade} transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Block Disease Burden</h2>
            <div className="space-y-2.5">
              {topDiseases.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 w-4 text-right shrink-0">{i + 1}</span>
                    <span className="text-xs font-medium text-slate-700 truncate">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold text-violet-600 shrink-0 ml-2">{d.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Block Map — PHCs in the block */}
        {blockMapNodes.length > 0 && blockCenter && (
          <motion.div {...fade} transition={{ delay: 0.12 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Block-Level PHC Map</h2>
                <p className="text-[10px] text-slate-500">{blockMapNodes.length} PHCs in {selectedDistrict.replace(/_/g, " ")} block</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold text-violet-600">
                <MapPin className="h-3 w-3" /> Block overview
              </span>
            </div>
            <div className="h-[300px] overflow-hidden rounded-xl border border-slate-100">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading map…</div>}>
                <MapComponent nodes={blockMapNodes} center={blockCenter} zoom={10} />
              </Suspense>
            </div>
          </motion.div>
        )}

        {/* Feedback Loop */}
        <motion.div {...fade} transition={{ delay: 0.15 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <BarChart3 className="h-4 w-4 text-violet-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">AI Feedback Loop — Classification Review</h2>
              <p className="text-[10px] text-slate-500">Review and correct AI disease classifications to improve model accuracy</p>
            </div>
            <span className="ml-auto rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600">{queue.length} cases</span>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {queue.length === 0 && (
              <div className="flex items-center gap-2 px-6 py-10 text-sm text-slate-400">
                <CheckCircle className="h-4 w-4 text-emerald-400" /> No cases pending review for this district.
              </div>
            )}
            {queue.map(item => {
              const done = !!feedbackState[item.op_id];
              return (
                <div key={item.op_id} className={`px-6 py-4 ${done ? "bg-slate-50/60" : ""}`}>
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800">{item.complaint?.split(",")[0]}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.ai_category === "Communicable" ? "bg-red-50 text-red-700" :
                          item.ai_category === "Non-Communicable" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                          {item.ai_category}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{item.ai_icd10}</span>
                        <span className={`text-[10px] font-bold ${item.confidence < 0.6 ? "text-red-500" : "text-amber-500"}`}>
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">{item.facility_name} · {item.mandal}</p>
                    </div>
                    {done ? (
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold shrink-0 ${feedbackState[item.op_id] === "approve" ? "bg-emerald-50 text-emerald-700" : feedbackState[item.op_id] === "correct" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
                        {feedbackState[item.op_id] === "approve" ? "✓ Approved" : feedbackState[item.op_id] === "correct" ? "✎ Corrected" : "✗ Rejected"}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleFeedback(item, "approve")} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><CheckCircle className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setCorrecting(correcting === item.op_id ? null : item.op_id)} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleFeedback(item, "reject")} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"><XCircle className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                  {correcting === item.op_id && !done && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500">Correct to:</span>
                      {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => handleFeedback(item, "correct", cat)}
                          className="rounded-lg px-3 py-1 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200">{cat}</button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </main>

      <AICopilot floating patientContext={{
        role: "CHC Block Medical Officer",
        district: selectedDistrict,
        scope: "Block-level",
      }} />
    </div>
  );
}
