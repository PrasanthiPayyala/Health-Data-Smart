import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Heart, ArrowLeft, Search, MapPin, AlertTriangle, Hospital,
  Calendar, Shield, Activity, ChevronDown, LogOut, Clock,
  CheckCircle, ExternalLink, FileSearch,
} from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function CitizenPortal() {
  const navigate = useNavigate();
  const { t, td, isRTL } = useLang();
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [phcLoad, setPhcLoad] = useState<any[]>([]);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [sampleIds, setSampleIds] = useState<string[]>([]);

  // Patient ID lookup
  const [patientId, setPatientId] = useState("");
  const [myRecord, setMyRecord] = useState<any>(null);
  const [recordError, setRecordError] = useState("");
  const [loadingRecord, setLoadingRecord] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/districts/all`).then(r => r.json()).then(d => {
      const all = d.districts || [];
      setDistricts(all);
      const firstLive = all.find((x: any) => x.cases > 0) || all[0];
      if (firstLive) setSelectedDistrict(firstLive.district_upper);
    });
    fetch(`${API}/api/public/sample-patient-ids`).then(r => r.json()).then(d => setSampleIds(d.sample_ids || []));
  }, []);

  useEffect(() => {
    if (!selectedDistrict) return;
    Promise.all([
      fetch(`${API}/api/public/alerts?district=${encodeURIComponent(selectedDistrict)}`).then(r => r.json()),
      fetch(`${API}/api/public/phc-load?district=${encodeURIComponent(selectedDistrict)}`).then(r => r.json()),
      fetch(`${API}/api/public/screenings?district=${encodeURIComponent(selectedDistrict)}`).then(r => r.json()),
    ]).then(([a, p, s]) => {
      setAlerts(a.alerts || []);
      setPhcLoad(p.phcs || []);
      setScreenings(s.screenings || []);
    });
  }, [selectedDistrict]);

  const lookupRecord = async () => {
    if (!patientId.trim()) return;
    setLoadingRecord(true); setRecordError(""); setMyRecord(null);
    try {
      const res = await fetch(`${API}/api/public/my-record/${encodeURIComponent(patientId.trim())}`);
      if (!res.ok) {
        setRecordError(t("citizen_no_record"));
      } else {
        const data = await res.json();
        setMyRecord(data);
        toast.success(`Found ${data.total_visits} ${t("citizen_visits_found")}`);
      }
    } catch {
      setRecordError("Service temporarily unavailable.");
    }
    setLoadingRecord(false);
  };

  const districtInfo = districts.find(d => d.district_upper === selectedDistrict);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <div dir={isRTL ? "rtl" : "ltr"}>
              <h1 className="text-sm font-bold text-slate-900">{t("citizen_title")}</h1>
              <p className="text-[10px] text-slate-500">{t("citizen_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400">
              {districts.map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
            </select>
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              <LogOut className="h-3.5 w-3.5" /> {t("exit")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-6 py-8 space-y-6">

        {/* Hero greeting */}
        <motion.div {...fade} className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50 p-6 shadow-sm">
          <p dir={isRTL ? "rtl" : "ltr"} className="text-xs font-bold uppercase tracking-widest text-emerald-600">{t("citizen_namaste")}</p>
          <h2 dir={isRTL ? "rtl" : "ltr"} className="mt-2 text-2xl font-black text-slate-900">{t("citizen_hero")}</h2>
          <p dir={isRTL ? "rtl" : "ltr"} className="mt-1 text-sm text-slate-600">{t("citizen_hero_sub")}</p>
          {districtInfo && (
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm border border-slate-200">
                <MapPin className="mr-1 inline h-3 w-3 text-emerald-500" />
                {districtInfo.district}, {districtInfo.region}
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm border border-slate-200">
                {districtInfo.cases.toLocaleString()} OPD cases tracked
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm border border-slate-200">
                {districtInfo.mandals} mandals
              </span>
            </div>
          )}
        </motion.div>

        {/* Main 2-col layout */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Disease Alerts in Your Area */}
          <motion.div {...fade} transition={{ delay: 0.05 }} className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t("citizen_alerts_title")}</h3>
                <p className="text-[10px] text-slate-500">{t("citizen_alerts_subtitle")}</p>
              </div>
              <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-600">{alerts.length} active</span>
            </div>
            <div className="divide-y max-h-[420px] overflow-y-auto">
              {alerts.length === 0 && <p className="px-6 py-8 text-center text-xs text-slate-400">{t("citizen_no_alerts")}</p>}
              {alerts.map((a, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{td(a.disease)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          a.severity === "critical" ? "bg-red-50 text-red-700" :
                          a.severity === "high" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                          {a.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{a.mandal} Mandal · {a.case_count} reported cases</p>
                      <p className="text-xs text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{a.advisory}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recommended Screenings */}
          <motion.div {...fade} transition={{ delay: 0.1 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900">{t("citizen_screenings")}</h3>
            </div>
            <div className="divide-y max-h-[420px] overflow-y-auto">
              {screenings.map((s, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">{s.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      s.category === "NCD" ? "bg-blue-50 text-blue-700" :
                      s.category === "Communicable" ? "bg-red-50 text-red-700" :
                      s.category === "Maternal" ? "bg-pink-50 text-pink-700" : "bg-slate-100 text-slate-600"}`}>
                      {s.category}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{s.reason}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.frequency}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.where}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Nearby PHC Load */}
        <motion.div {...fade} transition={{ delay: 0.15 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <Hospital className="h-4 w-4 text-blue-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t("citizen_phc_load")}</h3>
              <p className="text-[10px] text-slate-500">{t("citizen_phc_subtitle")}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["PHC / Facility", "Current Load", "Estimated Wait", "Action"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {phcLoad.slice(0, 10).map((p) => (
                  <tr key={p.phc_code} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-6 py-3.5 text-xs font-semibold text-slate-800">{p.facility_name}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${p.load_pct >= 80 ? "bg-red-500" : p.load_pct >= 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${p.load_pct}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${p.load_pct >= 80 ? "text-red-600" : p.load_pct >= 50 ? "text-amber-600" : "text-emerald-600"}`}>
                          {p.load_label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-700"><Clock className="mr-1 inline h-3 w-3 text-slate-400" />~{p.estimated_wait_min} minutes</td>
                    <td className="px-6 py-3.5">
                      <button className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-100">
                        <ExternalLink className="h-3 w-3" /> Get Directions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* My Anonymised Record */}
        <motion.div {...fade} transition={{ delay: 0.2 }} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
            <FileSearch className="h-4 w-4 text-violet-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t("citizen_my_record")}</h3>
              <p className="text-[10px] text-slate-500">{t("citizen_my_record_sub")}</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-3">
              <input value={patientId} onChange={e => setPatientId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lookupRecord()}
                placeholder={t("citizen_id_placeholder")}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white" />
              <button onClick={lookupRecord} disabled={loadingRecord || !patientId.trim()}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:shadow-md disabled:opacity-50">
                <Search className="h-4 w-4" />
                {loadingRecord ? t("citizen_searching") : t("citizen_find_record")}
              </button>
            </div>

            {sampleIds.length > 0 && !myRecord && !recordError && (
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold mb-1.5">{t("citizen_try_samples")}</p>
                <div className="flex flex-wrap gap-2">
                  {sampleIds.map(id => (
                    <button key={id} onClick={() => setPatientId(id)}
                      className="rounded-md bg-white px-2 py-1 font-mono text-[11px] text-violet-600 hover:bg-violet-50 border border-slate-200">{id}</button>
                  ))}
                </div>
              </div>
            )}

            {recordError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">{recordError}</div>
            )}

            {myRecord && (
              <div className="space-y-3">
                <div className="rounded-xl bg-violet-50 border border-violet-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-violet-600" />
                    <p className="text-xs font-bold text-violet-800">Found {myRecord.total_visits} Visit(s)</p>
                  </div>
                  <p className="text-[11px] text-violet-700">{myRecord.anonymisation_note}</p>
                </div>
                {myRecord.visits.map((v: any, i: number) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <p className="text-xs font-bold text-slate-800">Visit {v.visit_id}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {v.facility} · {v.mandal}
                      </span>
                    </div>
                    {v.complaint && <p className="text-xs text-slate-700 mb-2"><span className="font-semibold text-slate-500">Complaints: </span>{v.complaint}</p>}
                    {v.duration_days && <p className="text-xs text-slate-700 mb-2"><span className="font-semibold text-slate-500">Duration: </span>{v.duration_days} days</p>}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                      {Object.entries(v.vitals).filter(([_, val]) => val).map(([k, val]) => (
                        <div key={k} className="rounded-lg bg-slate-50 px-3 py-2 text-center">
                          <p className="text-[9px] font-bold uppercase text-slate-400">{k}</p>
                          <p className="text-xs font-bold text-slate-800">{val as string}</p>
                        </div>
                      ))}
                    </div>
                    {v.tests && <p className="mt-3 text-[11px] text-slate-500"><span className="font-semibold">Tests: </span>{v.tests}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <p dir={isRTL ? "rtl" : "ltr"} className="text-center text-[10px] text-slate-400 pb-4">
          <Shield className="mr-1 inline h-3 w-3" />
          {t("citizen_dpdp")}
        </p>
      </main>
    </div>
  );
}
