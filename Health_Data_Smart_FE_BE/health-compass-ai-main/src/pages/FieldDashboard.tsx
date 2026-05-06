import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Users, ArrowLeft, Send, CheckCircle, AlertTriangle,
  LogOut, Plus, Minus, Mic, MicOff, Wifi, WifiOff,
} from "lucide-react";
import { parseSpokenNumber } from "@/lib/i18n";
import { useLang } from "@/lib/LanguageContext";
import { useVoiceInput, type VoiceLang } from "@/lib/useVoiceInput";
import { enqueue, flushQueue, isOnline, readQueue } from "@/lib/offlineQueue";
import LanguageToggle from "@/components/LanguageToggle";
import AudioCaseDiary from "@/components/AudioCaseDiary";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const NAVY = "#0D47A1";
const ELECTRIC = "#1976D2";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";
const PAGE_BG = "#F4F8FC";

const ROLES = ["ANM", "ASHA", "Anganwadi Worker"];
const cardStyle = { background: "#FFFFFF", borderColor: SKY_LINE };

type CountField = "fever_cases" | "diarrhea_cases" | "maternal_flags" | "referrals";

export default function FieldDashboard() {
  const navigate = useNavigate();
  const { lang, t } = useLang();

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

  const voiceLang: VoiceLang = lang === "te" ? "te-IN" : "en-IN";
  const voice = useVoiceInput(voiceLang);
  const [voiceTarget, setVoiceTarget] = useState<CountField | null>(null);

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
  const [audioDiaryOpen, setAudioDiaryOpen] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/districts/all`).then(r => r.json()).then(d => {
      const all = d.districts || [];
      setDistricts(all);
      const firstLive = all.find((x: any) => x.cases > 0) || all[0];
      if (firstLive) setForm(f => ({ ...f, district: firstLive.district_upper }));
    }).catch(() => {});
    fetch(`${API}/api/field/signals`).then(r => r.json())
      .then(d => setPrevSignals(d.signals || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.district || !online) return;
    fetch(`${API}/api/field/mandals?district=${encodeURIComponent(form.district)}`)
      .then(r => r.json()).then(d => {
        setMandals(d.mandals || []);
        if (d.mandals?.length) setForm(f => ({ ...f, mandal: d.mandals[0] }));
      }).catch(() => {});
  }, [form.district, online]);

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
    if (!voice.supported) { toast.error(t("voice_unsupported")); return; }
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
        enqueue("/api/field/signal", form);
        setPendingCount(readQueue().length);
        toast.success(t("offline_mode"));
      }
      setSubmitted(true);
    } catch {
      enqueue("/api/field/signal", form);
      setPendingCount(readQueue().length);
      toast.warning("Saved offline — will sync when reconnected");
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const inputClass = "w-full rounded-md border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none";
  const inputStyle = { borderColor: SKY_LINE };

  return (
    <div className="min-h-screen w-full" style={{ background: PAGE_BG }}>
      <header className="w-full border-b" style={{ background: "#FFFFFF", borderColor: SKY_LINE }}>
        <div className="w-full flex items-center justify-between px-8 py-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="ap-btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: NAVY }}>
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ color: NAVY }}>{t("field_dashboard")}</h1>
              <p className="text-[10px] text-slate-500">{t("field_subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {online ? (
              <span className="ap-badge ap-badge-low"><Wifi className="h-3 w-3" /> {t("online")}</span>
            ) : (
              <span className="ap-badge ap-badge-amber"><WifiOff className="h-3 w-3" /> Offline</span>
            )}
            {pendingCount > 0 && <span className="ap-badge ap-badge-amber">{pendingCount} {t("offline_pending")}</span>}
            <LanguageToggle />
            <button onClick={() => navigate("/login")} className="ap-btn-ghost"><LogOut className="h-3.5 w-3.5 inline mr-1" /> {t("exit")}</button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-6 py-8">
        {submitted ? (
          <div className="rounded-lg border p-8 text-center" style={{ background: "#E8F5E9", borderColor: "#C8E6C9" }}>
            <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4" style={{ background: "#C8E6C9" }}>
              <CheckCircle className="h-8 w-8" style={{ color: "#2E7D32" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "#1B5E20" }}>{t("submitted_title")}</h2>
            <p className="mt-2 text-sm" style={{ color: "#2E7D32" }}>{t("submitted_subtitle")}</p>
            <button
              onClick={() => { setSubmitted(false); setForm(f => ({ ...f, fever_cases: 0, diarrhea_cases: 0, maternal_flags: 0, referrals: 0, cluster_note: "", unusual_cluster: false })); }}
              className="mt-6 rounded-md px-6 py-2.5 text-sm font-semibold text-white"
              style={{ background: "#2E7D32" }}
            >
              {t("submit_another")}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold" style={{ color: NAVY }}>{t("daily_report")}</h2>
              <p className="mt-1 text-sm text-slate-600">{t("daily_report_subtitle")}</p>
            </div>

            <div className="rounded-lg border p-5 space-y-4" style={cardStyle}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("your_details")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">{t("your_name")} *</label>
                  <input value={form.submitted_by} onChange={e => setForm(f => ({ ...f, submitted_by: e.target.value }))} placeholder={t("full_name")} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">{t("role")}</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={inputClass} style={inputStyle}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">{t("district")}</label>
                  <select value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className={inputClass} style={inputStyle}>
                    {districts.map(d => <option key={d.district_upper} value={d.district_upper}>{d.district}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">{t("mandal")}</label>
                  <select value={form.mandal} onChange={e => setForm(f => ({ ...f, mandal: e.target.value }))} className={inputClass} style={inputStyle}>
                    {mandals.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">{t("village")}</label>
                  <input value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} placeholder={t("village_placeholder")} className={inputClass} style={inputStyle} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-5 space-y-4" style={cardStyle}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("todays_counts")}</h3>
                {voice.listening && (
                  <span className="ap-badge ap-badge-critical">{t("voice_listening")}</span>
                )}
              </div>
              {[
                { field: "fever_cases" as const, label: t("fever_cases"), color: "#C62828", bg: "#FFEBEE" },
                { field: "diarrhea_cases" as const, label: t("diarrhea_cases"), color: "#E65100", bg: "#FFF3E0" },
                { field: "maternal_flags" as const, label: t("maternal_flags"), color: NAVY, bg: SKY },
                { field: "referrals" as const, label: t("referrals"), color: "#6A1B9A", bg: "#F3E5F5" },
              ].map(row => (
                <div key={row.field} className="flex items-center justify-between rounded-md border px-5 py-3.5" style={{ background: row.bg, borderColor: SKY_LINE }}>
                  <span className="text-sm font-semibold flex-1" style={{ color: row.color }}>{row.label}</span>
                  <div className="flex items-center gap-2">
                    {voice.supported && (
                      <button onClick={() => startVoice(row.field)} disabled={voice.listening} title={t("voice_say_number")}
                        className="flex h-8 w-8 items-center justify-center rounded-md border bg-white"
                        style={{ borderColor: SKY_LINE }}>
                        {voiceTarget === row.field && voice.listening ? <MicOff className="h-3.5 w-3.5 text-white" style={{ background: "#C62828" }} /> : <Mic className="h-3.5 w-3.5" style={{ color: row.color }} />}
                      </button>
                    )}
                    <button onClick={() => counter(row.field, -1)} className="flex h-8 w-8 items-center justify-center rounded-md border bg-white" style={{ borderColor: SKY_LINE }}>
                      <Minus className="h-3.5 w-3.5 text-slate-700" />
                    </button>
                    <span className="w-10 text-center text-xl font-extrabold tabular-nums" style={{ color: row.color }}>{form[row.field]}</span>
                    <button onClick={() => counter(row.field, 1)} className="flex h-8 w-8 items-center justify-center rounded-md border bg-white" style={{ borderColor: SKY_LINE }}>
                      <Plus className="h-3.5 w-3.5 text-slate-700" />
                    </button>
                  </div>
                </div>
              ))}
              {voice.supported && (
                <p className="text-center text-[10px] text-slate-500">
                  <Mic className="mr-1 inline h-3 w-3" />
                  {t("voice_say_number")}
                </p>
              )}
            </div>

            <div className="rounded-lg border p-5 space-y-3" style={cardStyle}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("unusual_cluster")}</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setForm(f => ({ ...f, unusual_cluster: !f.unusual_cluster }))}
                  className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold border"
                  style={form.unusual_cluster
                    ? { borderColor: "#FFCDD2", background: "#FFEBEE", color: "#C62828" }
                    : { borderColor: SKY_LINE, background: "#FFFFFF", color: "#475569" }}
                >
                  <AlertTriangle className="h-4 w-4" />
                  {form.unusual_cluster ? t("cluster_yes") : t("cluster_no")}
                </button>
              </div>
              {form.unusual_cluster && (
                <textarea
                  value={form.cluster_note}
                  onChange={e => setForm(f => ({ ...f, cluster_note: e.target.value }))}
                  rows={3}
                  placeholder={t("cluster_describe")}
                  className="w-full rounded-md border px-4 py-3 text-sm outline-none"
                  style={{ borderColor: "#FFCDD2", background: "#FFF5F5", color: "#0F172A" }}
                />
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="ap-btn-primary w-full py-4 text-sm font-bold disabled:opacity-60"
              style={{ background: "#2E7D32" }}
            >
              <Send className="h-4 w-4" />
              {submitting ? t("submitting") : t("submit_field")}
            </button>

            {!online && (
              <div className="flex items-center gap-2 rounded-md border px-4 py-3" style={{ background: "#FFF8E1", borderColor: "#FFE082" }}>
                <WifiOff className="h-4 w-4" style={{ color: "#E65100" }} />
                <p className="text-xs" style={{ color: "#7A4F01" }}>{t("offline_mode")}</p>
              </div>
            )}
          </div>
        )}

        {prevSignals.length > 0 && (
          <div className="mt-8 rounded-lg border bg-white overflow-hidden" style={cardStyle}>
            <div className="border-b px-5 py-4" style={{ borderColor: SKY_LINE }}>
              <h3 className="text-sm font-bold" style={{ color: NAVY }}>{t("recent_submissions")}</h3>
            </div>
            <div className="divide-y max-h-[300px] overflow-y-auto ap-scroll">
              {prevSignals.slice(0, 10).map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3 text-xs border-t" style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FBFE", borderColor: SKY_LINE }}>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{s.district} · {s.mandal}</p>
                    <p className="text-slate-500">{s.role} · {s.submitted_by}</p>
                  </div>
                  <div className="flex gap-3 text-center">
                    <div><p className="font-extrabold tabular-nums" style={{ color: "#C62828" }}>{s.fever_cases}</p><p className="text-slate-500">{t("fever")}</p></div>
                    <div><p className="font-extrabold tabular-nums" style={{ color: "#E65100" }}>{s.diarrhea_cases}</p><p className="text-slate-500">{t("diarrhea")}</p></div>
                    <div><p className="font-extrabold tabular-nums" style={{ color: "#6A1B9A" }}>{s.referrals}</p><p className="text-slate-500">{t("referred")}</p></div>
                  </div>
                  {s.unusual_cluster && <AlertTriangle className="h-4 w-4" style={{ color: "#C62828" }} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <button
        onClick={() => setAudioDiaryOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-md px-5 py-3 text-sm font-bold text-white shadow-md"
        style={{ background: NAVY }}
        title="Speak the patient details — AI fills the form"
      >
        <Mic className="h-4 w-4" /> Audio Case
      </button>
      <AudioCaseDiary open={audioDiaryOpen} onClose={() => setAudioDiaryOpen(false)} />
    </div>
  );
}
