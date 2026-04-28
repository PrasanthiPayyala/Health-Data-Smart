import { useState, useEffect, lazy, Suspense, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Stethoscope, ArrowLeft, CheckCircle, XCircle, Edit3,
  AlertTriangle, Activity, ChevronDown, LogOut, ChevronRight, MapPin,
} from "lucide-react";
import AICopilot from "@/components/AICopilot";
import { MANDAL_COORDS } from "@/data/mandalCoordinates";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const MapComponent = lazy(() => import("@/components/MapComponent"));

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

const CATEGORIES = ["Communicable", "Non-Communicable", "Other"];

export default function PHCDashboard() {
  const navigate = useNavigate();
  const { t, td, isRTL } = useLang();
  const [districts, setDistricts] = useState<any[]>([]);
  const [phcs, setPhcs] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedPHC, setSelectedPHC] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [topDiseases, setTopDiseases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackState, setFeedbackState] = useState<Record<string, { action: string; correctedCategory?: string }>>({});
  const [correcting, setCorrecting] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/districts/all`).then(r => r.json()).then(d => {
      const all = d.districts || [];
      setDistricts(all);
      const firstLive = all.find((x: any) => x.cases > 0) || all[0];
      if (firstLive) setSelectedDistrict(firstLive.district_upper);
      setLoading(false);
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
    ]).then(([p, q, td]) => {
      setPatients(p.patients || []);
      setQueue(q.queue || []);
      setTopDiseases(td.diseases || []);
    });
  }, [selectedPHC]);

  const handleFeedback = async (item: any, action: "approve" | "correct" | "reject", correctedCategory?: string) => {
    try {
      await fetch(`${API}/api/ai/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op_id: item.op_id,
          original_category: item.ai_category,
          original_icd10: item.ai_icd10,
          corrected_category: correctedCategory || item.ai_category,
          corrected_icd10: item.ai_icd10,
          officer_role: "phc",
          district: selectedDistrict,
          phc: selectedPHC,
          action,
        }),
      });
      setFeedbackState(prev => ({ ...prev, [item.op_id]: { action, correctedCategory } }));
      setCorrecting(null);
      toast.success(
        action === "approve" ? "Classification approved ✓" :
        action === "correct" ? `Corrected to ${correctedCategory}` : "Case rejected",
      );
    } catch {
      toast.error("Failed to save feedback");
    }
  };

  const selectedPHCInfo = phcs.find(p => p.phc_code === selectedPHC);

  // PHC location: stable hash → pick a mandal in the district as the catchment centre
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
    <div className="min-h-screen bg-slate-50">
      <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500" />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <div dir={isRTL ? "rtl" : "ltr"}>
              <h1 className="text-sm font-bold text-slate-900">{t("phc_title")}</h1>
              <p className="text-[10px] text-slate-500">{t("phc_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-teal-400">
              <optgroup label="● LIVE">
                {districts.filter(d => d.cases > 0).map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
              </optgroup>
              <optgroup label="○ READY">
                {districts.filter(d => d.cases === 0).map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
              </optgroup>
            </select>
            <select value={selectedPHC} onChange={e => setSelectedPHC(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-teal-400 max-w-[180px]">
              {phcs.map(p => <option key={p.phc_code} value={p.phc_code}>{p.facility_name}</option>)}
            </select>
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              <LogOut className="h-3.5 w-3.5" /> {t("exit")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">

        {/* PHC Info + Stats */}
        {selectedPHCInfo && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: "Facility", value: selectedPHCInfo.facility_name, sub: selectedPHCInfo.facility_type, color: "from-teal-500 to-emerald-600" },
              { label: "Total Cases", value: selectedPHCInfo.cases, sub: "OPD records", color: "from-blue-500 to-indigo-600" },
              { label: "Pending Validation", value: queue.length, sub: "Low confidence AI classifications", color: "from-amber-500 to-orange-500" },
              { label: "Top Condition", value: selectedPHCInfo.top_disease, sub: "Most frequent complaint", color: "from-slate-600 to-slate-800" },
            ].map((kpi, i) => (
              <motion.div key={kpi.label} {...fade} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</p>
                <p className="mt-2 text-sm font-black text-slate-900 truncate" title={String(kpi.value)}>{kpi.value}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{kpi.sub}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* PHC Catchment Map — single PHC location with 5km catchment radius */}
        {phcLocation && selectedPHCInfo && (
          <motion.div {...fade} transition={{ delay: 0.08 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">PHC Catchment Area</h2>
                <p className="text-[10px] text-slate-500">{selectedPHCInfo.facility_name} · 5 km radius · ~{phcLocation.mandal} mandal</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold text-teal-600">
                <MapPin className="h-3 w-3" /> {selectedPHCInfo.cases} OPD cases
              </span>
            </div>
            <div className="h-[280px] overflow-hidden rounded-xl border border-slate-100">
              <Suspense fallback={<div className="flex h-full items-center justify-center text-xs text-slate-400">Loading map…</div>}>
                <MapComponent
                  nodes={[{
                    name: selectedPHCInfo.facility_name,
                    lat: phcLocation.lat,
                    lng: phcLocation.lng,
                    intensity: 0.8,
                    cases: selectedPHCInfo.cases,
                    capacity: Math.min(95, 60 + selectedPHCInfo.cases),
                    disease: selectedPHCInfo.top_disease,
                  }]}
                  center={[phcLocation.lat, phcLocation.lng]}
                  zoom={12}
                  catchmentCircle={{
                    lat: phcLocation.lat,
                    lng: phcLocation.lng,
                    radius_m: 5000,
                    label: `${selectedPHCInfo.facility_name} — 5km catchment`,
                  }}
                />
              </Suspense>
            </div>
          </motion.div>
        )}

        {/* AI Validation Queue */}
        <motion.div {...fade} transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">AI Classification — Approve / Correct / Reject</h2>
              <p className="text-[10px] text-slate-500">Cases where AI confidence &lt; 80% — officer review required</p>
            </div>
            <span className="ml-auto rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">{queue.length} cases</span>
          </div>
          <div className="divide-y">
            {queue.length === 0 && (
              <div className="flex items-center gap-2 px-6 py-8 text-sm text-slate-400">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                No cases pending validation for this PHC.
              </div>
            )}
            {queue.map(item => {
              const state = feedbackState[item.op_id];
              const done = !!state;
              return (
                <div key={item.op_id} className={`px-6 py-4 transition-colors ${done ? "bg-slate-50/60" : ""}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">{item.complaint}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.ai_category === "Communicable" ? "bg-red-50 text-red-700" :
                          item.ai_category === "Non-Communicable" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                          {item.ai_category}
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">{item.ai_icd10}</span>
                        <span className={`text-[10px] font-bold ${item.confidence < 0.6 ? "text-red-500" : "text-amber-500"}`}>
                          {Math.round(item.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">{item.facility_name} · {item.district} · {item.mandal}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.ai_icd_desc}</p>
                    </div>

                    {done ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          state.action === "approve" ? "bg-emerald-50 text-emerald-700" :
                          state.action === "correct" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
                          {state.action === "approve" ? "✓ Approved" :
                           state.action === "correct" ? `✎ ${state.correctedCategory}` : "✗ Rejected"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleFeedback(item, "approve")}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button onClick={() => setCorrecting(correcting === item.op_id ? null : item.op_id)}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">
                          <Edit3 className="h-3.5 w-3.5" /> Correct
                        </button>
                        <button onClick={() => handleFeedback(item, "reject")}
                          className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Correction dropdown */}
                  <AnimatePresence>
                    {correcting === item.op_id && !done && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-slate-500">Correct to:</span>
                        {CATEGORIES.map(cat => (
                          <button key={cat} onClick={() => handleFeedback(item, "correct", cat)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              cat === "Communicable" ? "bg-red-50 text-red-700 hover:bg-red-100" :
                              cat === "Non-Communicable" ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                            {cat}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Local Disease Distribution */}
        <motion.div {...fade} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-slate-900">Local Disease Distribution — {selectedDistrict}</h2>
          <div className="space-y-3">
            {topDiseases.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="w-5 text-[10px] font-bold text-slate-400 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">{d.name}</span>
                    <span className="text-xs font-bold text-slate-900">{d.count} cases</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all"
                      style={{ width: `${(d.count / (topDiseases[0]?.count || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <AICopilot floating patientContext={{
        role: "PHC Medical Officer",
        district: selectedDistrict,
        phc: selectedPHC,
        facility: selectedPHCInfo?.facility_name,
      }} />
    </div>
  );
}
