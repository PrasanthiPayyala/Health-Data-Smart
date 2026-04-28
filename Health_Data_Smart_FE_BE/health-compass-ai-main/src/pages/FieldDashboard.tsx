import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Users, ArrowLeft, Send, CheckCircle, AlertTriangle,
  LogOut, Plus, Minus, Mic, MicOff, Wifi, WifiOff, Languages,
} from "lucide-react";
import { parseSpokenNumber } from "@/lib/i18n";
import { useLang } from "@/lib/LanguageContext";
import { useVoiceInput, type VoiceLang } from "@/lib/useVoiceInput";
import { enqueue, flushQueue, isOnline, readQueue } from "@/lib/offlineQueue";
import LanguageToggle from "@/components/LanguageToggle";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

const ROLES = ["ANM", "ASHA", "Anganwadi Worker"];

type CountField = "fever_cases" | "diarrhea_cases" | "maternal_flags" | "referrals";

export default function FieldDashboard() {
  const navigate = useNavigate();
  const { lang, t, isRTL } = useLang();

  // Online status
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(readQueue().length);

  useEffect(() => {
    const goOnline = async () => {
      setOnline(true);
      const result = await flushQueue(API);
      setPendingCount(readQueue().length);
      if (result.sent > 0) toast.success(`Synced ${result.sent} offline submission(s) to PHC`);
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    if (isOnline()) goOnline();
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Voice input
  const voiceLang: VoiceLang = lang === "te" ? "te-IN" : "en-IN";
  const voice = useVoiceInput(voiceLang);
  const [voiceTarget, setVoiceTarget] = useState<CountField | null>(null);

  // Form state
  const [districts, setDistricts] = useState<any[]>([]);
  const [mandals, setMandals] = useState<string[]>([]);
  const [prevSignals, setPrevSignals] = useState<any[]>([]);
  const [form, setForm] = useState({
    district: "", mandal: "", village: "", phc: "",
    submitted_by: "", role: "ANM",
    fever_cases: 0, diarrhea_cases: 0, maternal_flags: 0,
    unusual_cluster: false, cluster_note: "", referrals: 0,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/districts/all`).then(r => r.json()).then(d => {
      const all = d.districts || [];
      setDistricts(all);
      const firstLive = all.find((x: any) => x.cases > 0) || all[0];
      if (firstLive) setForm(f => ({ ...f, district: firstLive.district_upper }));
    }).catch(() => { /* offline ok */ });
    fetch(`${API}/api/field/signals`).then(r => r.json())
      .then(d => setPrevSignals(d.signals || []))
      .catch(() => { /* offline ok */ });
  }, []);

  useEffect(() => {
    if (!form.district || !online) return;
    fetch(`${API}/api/field/mandals?district=${encodeURIComponent(form.district)}`)
      .then(r => r.json()).then(d => {
        setMandals(d.mandals || []);
        if (d.mandals?.length) setForm(f => ({ ...f, mandal: d.mandals[0] }));
      }).catch(() => { /* offline ok */ });
  }, [form.district, online]);

  // Voice transcript → set field value
  useEffect(() => {
    if (!voice.transcript || !voiceTarget) return;
    const num = parseSpokenNumber(voice.transcript);
    if (num !== null) {
      setForm(f => ({ ...f, [voiceTarget]: num }));
      toast.success(`✓ ${voice.transcript} → ${num}`);
    } else {
      toast.error(`Could not understand "${voice.transcript}"`);
    }
    setVoiceTarget(null);
  }, [voice.transcript]);

  const startVoice = (field: CountField) => {
    if (!voice.supported) {
      toast.error(t("voice_unsupported"));
      return;
    }
    setVoiceTarget(field);
    voice.start();
  };

  const counter = (field: CountField, delta: number) =>
    setForm(f => ({ ...f, [field]: Math.max(0, (f[field] as number) + delta) }));

  const handleSubmit = async () => {
    if (!form.submitted_by.trim()) { toast.error("Please enter your name"); return; }
    setSubmitting(true);
    try {
      if (online) {
        const res = await fetch(`${API}/api/field/signal`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("API failed");
        toast.success(t("submitted_title") + " ✓");
        fetch(`${API}/api/field/signals`).then(r => r.json()).then(d => setPrevSignals(d.signals || []));
      } else {
        // Queue for later sync
        enqueue("/api/field/signal", form);
        setPendingCount(readQueue().length);
        toast.success(t("offline_mode"));
      }
      setSubmitted(true);
    } catch {
      // Network failed → queue offline
      enqueue("/api/field/signal", form);
      setPendingCount(readQueue().length);
      toast.warning("Saved offline — will sync when reconnected");
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">{t("field_dashboard")}</h1>
              <p className="text-[10px] text-slate-500">{t("field_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Online / Offline indicator */}
            {online ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                <Wifi className="h-3 w-3" /> {t("online")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
            )}
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                {pendingCount} {t("offline_pending")}
              </span>
            )}
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              <LogOut className="h-3.5 w-3.5" /> {t("exit")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">

        {submitted ? (
          <motion.div {...fade} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
            <h2 className="text-lg font-bold text-emerald-800">{t("submitted_title")}</h2>
            <p className="mt-2 text-sm text-emerald-700">{t("submitted_subtitle")}</p>
            <button onClick={() => { setSubmitted(false); setForm(f => ({ ...f, fever_cases: 0, diarrhea_cases: 0, maternal_flags: 0, referrals: 0, cluster_note: "", unusual_cluster: false })); }}
              className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
              {t("submit_another")}
            </button>
          </motion.div>
        ) : (
          <motion.div {...fade} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("daily_report")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("daily_report_subtitle")}</p>
            </div>

            {/* Identity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("your_details")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">{t("your_name")} *</label>
                  <input value={form.submitted_by} onChange={e => setForm(f => ({ ...f, submitted_by: e.target.value }))}
                    placeholder={t("full_name")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">{t("role")}</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400">
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">{t("district")}</label>
                  <select value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400">
                    {districts.map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">{t("mandal")}</label>
                  <select value={form.mandal} onChange={e => setForm(f => ({ ...f, mandal: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400">
                    {mandals.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">{t("village")}</label>
                  <input value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))}
                    placeholder={t("village_placeholder")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400" />
                </div>
              </div>
            </div>

            {/* Case counts with voice input */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("todays_counts")}</h3>
                {voice.listening && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                    {t("voice_listening")}
                  </span>
                )}
              </div>
              {[
                { field: "fever_cases" as const, label: t("fever_cases"), color: "text-red-600", bg: "bg-red-50" },
                { field: "diarrhea_cases" as const, label: t("diarrhea_cases"), color: "text-amber-600", bg: "bg-amber-50" },
                { field: "maternal_flags" as const, label: t("maternal_flags"), color: "text-blue-600", bg: "bg-blue-50" },
                { field: "referrals" as const, label: t("referrals"), color: "text-violet-600", bg: "bg-violet-50" },
              ].map(row => (
                <div key={row.field} className={`flex items-center justify-between rounded-xl ${row.bg} px-5 py-3.5`}>
                  <span className={`text-sm font-semibold ${row.color} flex-1`}>{row.label}</span>
                  <div className="flex items-center gap-2">
                    {voice.supported && (
                      <button onClick={() => startVoice(row.field)} disabled={voice.listening}
                        title={t("voice_say_number")}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm transition ${voiceTarget === row.field && voice.listening ? "bg-red-500 text-white" : "bg-white hover:bg-slate-50"}`}>
                        {voiceTarget === row.field && voice.listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className={`h-3.5 w-3.5 ${row.color}`} />}
                      </button>
                    )}
                    <button onClick={() => counter(row.field, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm hover:shadow-md">
                      <Minus className="h-3.5 w-3.5 text-slate-600" />
                    </button>
                    <span className={`w-10 text-center text-xl font-black ${row.color}`}>{form[row.field]}</span>
                    <button onClick={() => counter(row.field, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm hover:shadow-md">
                      <Plus className="h-3.5 w-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>
              ))}
              {voice.supported && (
                <p className="text-center text-[10px] text-slate-400">
                  <Mic className="mr-1 inline h-3 w-3" />
                  {t("voice_say_number")}
                </p>
              )}
            </div>

            {/* Unusual cluster */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("unusual_cluster")}</h3>
              <div className="flex items-center gap-4">
                <button onClick={() => setForm(f => ({ ...f, unusual_cluster: !f.unusual_cluster }))}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${form.unusual_cluster ? "bg-red-50 text-red-700 ring-2 ring-red-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  <AlertTriangle className="h-4 w-4" />
                  {form.unusual_cluster ? t("cluster_yes") : t("cluster_no")}
                </button>
              </div>
              {form.unusual_cluster && (
                <textarea value={form.cluster_note} onChange={e => setForm(f => ({ ...f, cluster_note: e.target.value }))}
                  rows={3} placeholder={t("cluster_describe")}
                  className="w-full rounded-xl border border-red-200 bg-red-50/30 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
              )}
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-emerald-500/40 disabled:opacity-60">
              <Send className="h-4 w-4" />
              {submitting ? t("submitting") : t("submit_field")}
            </button>

            {!online && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <WifiOff className="h-4 w-4 text-amber-600" />
                <p className="text-xs text-amber-800">{t("offline_mode")}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Previous signals */}
        {prevSignals.length > 0 && (
          <motion.div {...fade} transition={{ delay: 0.2 }} className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">{t("recent_submissions")}</h3>
            </div>
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {prevSignals.slice(0, 10).map(s => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3 text-xs">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{s.district} · {s.mandal}</p>
                    <p className="text-slate-500">{s.role} · {s.submitted_by}</p>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div><p className="font-black text-red-600">{s.fever_cases}</p><p className="text-slate-400">{t("fever")}</p></div>
                    <div><p className="font-black text-amber-600">{s.diarrhea_cases}</p><p className="text-slate-400">{t("diarrhea")}</p></div>
                    <div><p className="font-black text-violet-600">{s.referrals}</p><p className="text-slate-400">{t("referred")}</p></div>
                  </div>
                  {s.unusual_cluster && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
