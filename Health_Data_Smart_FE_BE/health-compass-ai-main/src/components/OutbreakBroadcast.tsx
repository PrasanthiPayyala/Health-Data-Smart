import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  X, Send, MessageCircle, Loader2, CheckCircle2, AlertCircle,
  Plus, Trash2, Globe, Phone, Info, Smartphone,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const NAVY = "#0D47A1";
const ELECTRIC = "#1976D2";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";

interface Props {
  open: boolean;
  onClose: () => void;
  district: string;
  topDisease?: string;
  cases?: number;
}

const LANG_OPTIONS: Array<{ code: "en" | "te" | "ur"; label: string; flag: string }> = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
  { code: "ur", label: "اردو", flag: "🇮🇳" },
];

export default function OutbreakBroadcast({ open, onClose, district, topDisease = "Fever", cases = 0 }: Props) {
  const [language, setLanguage] = useState<"en" | "te" | "ur">("en");
  const [recipients, setRecipients] = useState<string[]>([""]);
  const [disease, setDisease] = useState(topDisease);
  const [caseCount, setCaseCount] = useState(cases || 50);
  const [baseline, setBaseline] = useState(15);
  const [severity, setSeverity] = useState("High");
  const [preview, setPreview] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [sandbox, setSandbox] = useState<any>(null);
  const [citizens, setCitizens] = useState<any>(null);
  const [useCitizenList, setUseCitizenList] = useState(true);

  useEffect(() => {
    if (!open) return;
    fetch(`${API}/api/alerts/sandbox-info`).then(r => r.json()).then(setSandbox).catch(() => {});
    if (district) {
      fetch(`${API}/api/alerts/citizens?district=${encodeURIComponent(district.toUpperCase())}`)
        .then(r => r.json())
        .then(d => {
          setCitizens(d);
          if (d.citizens && d.citizens.length > 0 && useCitizenList) {
            setRecipients(d.citizens.map((c: any) => c.phone));
          }
        })
        .catch(() => setCitizens(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, district]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => regeneratePreview(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, disease, caseCount, baseline, severity, district, open]);

  const regeneratePreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`${API}/api/alerts/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: recipients.filter(r => r.trim()),
          language,
          location: `${district} District`,
          disease, cases: caseCount, baseline, severity,
        }),
      });
      if (!res.ok) throw new Error("preview failed");
      const data = await res.json();
      setPreview(data.body);
    } catch {
      setPreview("(preview unavailable)");
    } finally {
      setPreviewLoading(false);
    }
  };

  const addRecipient = () => setRecipients(prev => [...prev, ""]);
  const updateRecipient = (i: number, v: string) =>
    setRecipients(prev => prev.map((r, idx) => idx === i ? v : r));
  const removeRecipient = (i: number) =>
    setRecipients(prev => prev.filter((_, idx) => idx !== i));

  const send = async () => {
    const valid = recipients.map(r => r.trim()).filter(Boolean);
    if (valid.length === 0) { toast.error("Add at least one recipient phone number"); return; }
    setSending(true); setResults(null);
    try {
      const res = await fetch(`${API}/api/alerts/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: valid, language,
          location: `${district} District`,
          disease, cases: caseCount, baseline, severity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Send failed");
      setResults(data);
      if (data.successful > 0) toast.success(`Sent ${data.successful}/${data.total_recipients} WhatsApp alerts`);
      else toast.error(`All ${data.total_recipients} sends failed — check recipient opt-in`);
    } catch (e: any) {
      toast.error(`Broadcast failed: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const reset = () => { setResults(null); setRecipients([""]); };
  const handleClose = () => { setResults(null); onClose(); };

  if (!open) return null;

  const inputCls = "w-full rounded-md border bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none";
  const inputStyle = { borderColor: SKY_LINE };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-lg border bg-white shadow-lg ap-scroll"
        style={{ borderColor: SKY_LINE }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4" style={{ borderColor: SKY_LINE }}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ background: NAVY }}>
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>Broadcast Outbreak Alert via WhatsApp</h2>
              <p className="text-[10px] text-slate-500">Send a real-time multilingual alert to citizens in {district}</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-0 lg:divide-x" style={{ borderColor: SKY_LINE }}>
          {/* LEFT: form */}
          <div className="space-y-5 p-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                <Globe className="h-3 w-3" /> Language
              </label>
              <div className="flex gap-2">
                {LANG_OPTIONS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className="flex-1 rounded-md border-2 px-3 py-2 text-xs font-bold"
                    style={
                      language === l.code
                        ? { borderColor: NAVY, background: SKY, color: NAVY }
                        : { borderColor: SKY_LINE, background: "#FFFFFF", color: "#475569" }
                    }
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Disease</label>
                <input value={disease} onChange={e => setDisease(e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Severity</label>
                <select value={severity} onChange={e => setSeverity(e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle}>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Elevated">Elevated</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cases this week</label>
                <input type="number" value={caseCount} onChange={e => setCaseCount(Number(e.target.value))} className={`mt-1 ${inputCls}`} style={inputStyle} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Baseline (per week)</label>
                <input type="number" value={baseline} onChange={e => setBaseline(Number(e.target.value))} className={`mt-1 ${inputCls}`} style={inputStyle} />
              </div>
            </div>

            {citizens && citizens.total_consented > 0 && (
              <div className="rounded-md border p-3" style={{ background: "#E8F5E9", borderColor: "#A5D6A7" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#2E7D32" }}>Consented Citizen Registry — {district}</p>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex-1">
                    <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{citizens.total_consented}</p>
                    <p className="text-[10px] text-slate-600">citizens consented</p>
                  </div>
                  <div className="flex-1 border-l pl-3" style={{ borderColor: "#A5D6A7" }}>
                    <p className="text-2xl font-extrabold tabular-nums" style={{ color: "#2E7D32" }}>{citizens.would_deliver_live}</p>
                    <p className="text-[10px]" style={{ color: "#1B5E20" }}>will deliver LIVE (allowlist)</p>
                  </div>
                  <div className="flex-1 border-l pl-3" style={{ borderColor: SKY_LINE }}>
                    <p className="text-2xl font-extrabold tabular-nums text-slate-700">{citizens.would_simulate}</p>
                    <p className="text-[10px] text-slate-600">SIMULATED for demo</p>
                  </div>
                </div>
                <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCitizenList}
                    onChange={(e) => {
                      setUseCitizenList(e.target.checked);
                      if (e.target.checked && citizens.citizens) {
                        setRecipients(citizens.citizens.map((c: any) => c.phone));
                      } else {
                        setRecipients([""]);
                      }
                    }}
                    style={{ accentColor: "#2E7D32" }}
                  />
                  Pre-populate recipients from consented citizen registry
                </label>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                <Phone className="h-3 w-3" /> Recipients (WhatsApp numbers)
                {recipients.length > 5 && (
                  <span className="ml-auto text-[10px] font-normal text-slate-500">{recipients.filter(r => r.trim()).length} numbers</span>
                )}
              </label>
              <div className="space-y-2 max-h-[240px] overflow-y-auto ap-scroll">
                {recipients.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={r}
                      onChange={e => updateRecipient(i, e.target.value)}
                      placeholder="+91 98xxxxxxxx"
                      className="flex-1 rounded-md border bg-white px-3 py-2 text-xs font-mono text-slate-900 outline-none"
                      style={{ borderColor: SKY_LINE }}
                    />
                    {recipients.length > 1 && (
                      <button onClick={() => removeRecipient(i)} className="rounded-md p-2 border" style={{ borderColor: SKY_LINE, background: "#FFFFFF", color: "#C62828" }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addRecipient} className="mt-2 flex items-center gap-1 text-xs font-bold" style={{ color: NAVY }}>
                <Plus className="h-3 w-3" /> Add another recipient
              </button>
            </div>

            {sandbox && sandbox.configured && (
              <div className="rounded-md border p-3" style={{ background: SKY, borderColor: SKY_LINE }}>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: NAVY }} />
                  <div className="text-[11px]" style={{ color: "#0F172A" }}>
                    <p className="font-bold mb-1" style={{ color: NAVY }}>Demo via Twilio Sandbox — recipients must complete a one-time link step</p>
                    <p className="leading-relaxed whitespace-pre-line text-slate-700">{sandbox.instructions_en}</p>
                    <p className="mt-2 font-bold" style={{ color: NAVY }}>Production deployment: AP Govt uses WhatsApp Business API with consented citizens.</p>
                  </div>
                </div>
              </div>
            )}

            {!sandbox?.configured && (
              <div className="rounded-md border p-3" style={{ background: "#FFF3E0", borderColor: "#FFCC80" }}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#E65100" }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: "#7A4F01" }}>
                    <strong>Twilio not configured on backend yet.</strong> Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to Railway env vars to enable broadcasting.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: preview + send */}
          <div className="space-y-4 p-6" style={{ background: "#F8FBFE" }}>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                <Smartphone className="h-3 w-3" /> Live Preview ({language.toUpperCase()})
              </label>

              <div className="mt-2 rounded-md border-4 p-3" style={{ borderColor: SKY_LINE, background: "#E8F5E9" }}>
                <div
                  className="rounded-md p-3 border bg-white"
                  dir={language === "ur" ? "rtl" : "ltr"}
                  style={{ borderColor: SKY_LINE }}
                >
                  <div className="flex items-center gap-2 border-b pb-2 mb-2" style={{ borderColor: SKY_LINE }}>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full text-white text-[10px] font-bold" style={{ background: "#2E7D32" }}>
                      AP
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-900">AP Health Alerts</p>
                      <p className="text-[9px] text-slate-500">Govt of Andhra Pradesh • now</p>
                    </div>
                  </div>
                  {previewLoading ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
                      <Loader2 className="h-3 w-3 animate-spin" /> Generating preview...
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-800">
                      {preview || "(preview will appear here)"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {!results ? (
              <button
                onClick={send}
                disabled={sending || !sandbox?.configured}
                className="flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#2E7D32" }}
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Broadcasting...</>
                ) : (
                  <><Send className="h-4 w-4" /> Broadcast Alert via WhatsApp</>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="rounded-md border p-3" style={{ background: "#E8F5E9", borderColor: "#A5D6A7" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4" style={{ color: "#2E7D32" }} />
                    <p className="text-xs font-bold" style={{ color: "#1B5E20" }}>Broadcast {results.broadcast_id}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md p-2 text-center border" style={{ background: "#C8E6C9", borderColor: "#A5D6A7" }}>
                      <p className="text-2xl font-extrabold tabular-nums" style={{ color: "#1B5E20" }}>{results.live_delivered ?? 0}</p>
                      <p className="text-[9px] font-bold uppercase" style={{ color: "#2E7D32" }}>Live ✓</p>
                    </div>
                    <div className="rounded-md p-2 text-center border bg-white" style={{ borderColor: SKY_LINE }}>
                      <p className="text-2xl font-extrabold tabular-nums text-slate-700">{results.simulated ?? 0}</p>
                      <p className="text-[9px] font-bold uppercase text-slate-500">Simulated ○</p>
                    </div>
                    <div className="rounded-md p-2 text-center border" style={{ background: "#FFCDD2", borderColor: "#EF9A9A" }}>
                      <p className="text-2xl font-extrabold tabular-nums" style={{ color: "#C62828" }}>{results.live_failed ?? 0}</p>
                      <p className="text-[9px] font-bold uppercase" style={{ color: "#7F1D1D" }}>Failed ✗</p>
                    </div>
                  </div>
                  {results.demo_disclosure && (
                    <p className="mt-2 text-[10px] italic leading-relaxed" style={{ color: "#1B5E20" }}>{results.demo_disclosure}</p>
                  )}
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto ap-scroll">
                  {results.results?.map((r: any, i: number) => {
                    const mode = r.delivery_mode;
                    const styles = mode === "live_delivered"
                      ? { border: "#A5D6A7", bg: "#E8F5E9", iconClass: "#2E7D32", label: "LIVE DELIVERED" }
                      : mode === "live_failed"
                      ? { border: "#FFCDD2", bg: "#FFEBEE", iconClass: "#C62828", label: "LIVE FAILED" }
                      : { border: SKY_LINE, bg: "#F8FBFE", iconClass: "#475569", label: "SIMULATED" };
                    return (
                      <div key={i} className="rounded-md border px-3 py-2 text-[10px]" style={{ background: styles.bg, borderColor: styles.border }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-slate-700 truncate">{r.to}</span>
                          <span className="font-bold" style={{ color: styles.iconClass }}>{styles.label}</span>
                        </div>
                        {r.consent_label && <p className="mt-1 text-slate-600 italic">{r.consent_label}</p>}
                        {r.error && <p className="mt-0.5" style={{ color: "#C62828" }}>⚠ {r.error}</p>}
                        {r.sid && <p className="mt-0.5 font-mono" style={{ color: "#2E7D32" }}>SID: {r.sid}</p>}
                      </div>
                    );
                  })}
                </div>
                <button onClick={reset} className="ap-btn-secondary w-full px-5 py-2.5 text-sm font-bold">
                  Send Another Broadcast
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
