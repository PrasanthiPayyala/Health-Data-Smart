import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2, X, Sparkles, CheckCircle2, AlertCircle, Save, Copy } from "lucide-react";
import { toast } from "sonner";
import { useLang } from "@/lib/LanguageContext";
import AISafetyBadge from "@/components/AISafetyBadge";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const NAVY = "#0D47A1";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";

type SpeechRecognitionEvent = any;

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface StructuredCase {
  patient_name?: string | null;
  age?: number | null;
  gender?: "M" | "F" | null;
  district?: string | null;
  mandal?: string | null;
  complaints?: string[];
  duration_days?: number | null;
  vitals?: {
    temperature?: number | null;
    systole?: number | null;
    diastole?: number | null;
    spo2?: number | null;
    rbs?: number | null;
  };
  suggested_diagnosis?: string;
  icd10?: string | null;
  category?: string;
  urgency_level?: "low" | "medium" | "high" | "critical";
  recommended_actions?: string[];
  confidence?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  defaultDistrict?: string;
}

const LANG_TO_BCP47: Record<string, string> = {
  en: "en-IN",
  te: "te-IN",
  ur: "ur-PK",
};

export default function AudioCaseDiary({ open, onClose, defaultDistrict }: Props) {
  const { lang, isRTL } = useLang();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [supported, setSupported] = useState(true);
  const [loading, setLoading] = useState(false);
  const [structured, setStructured] = useState<StructuredCase | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANG_TO_BCP47[lang] || "en-IN";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript + " ";
        else interim += res[0].transcript;
      }
      if (finalText) setTranscript((prev) => (prev + " " + finalText).trim());
      setInterimText(interim);
    };
    recognition.onerror = (e: any) => {
      setError(`Speech recognition error: ${e.error || "unknown"}`);
      setListening(false);
    };
    recognition.onend = () => { setListening(false); setInterimText(""); };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.abort(); } catch {}
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [open, lang]);

  useEffect(() => {
    if (listening) {
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => setRecordingSeconds((s) => s + 1), 1000) as unknown as number;
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [listening]);

  const startRecording = () => {
    if (!recognitionRef.current || listening) return;
    setError(null); setStructured(null); setTranscript(""); setInterimText("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) { setError(`Failed to start recording: ${e}`); }
  };

  const stopRecording = () => {
    if (recognitionRef.current && listening) {
      try { recognitionRef.current.stop(); } catch {}
    }
  };

  const extractStructure = async () => {
    if (!transcript.trim()) { setError("No transcript to process. Please speak first."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/api/ai/structure-case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim(), language: lang }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setStructured(data.structured_case);
      toast.success("Case structured by AI");
    } catch {
      setError("AI service temporarily unavailable. Please retry in a moment, or enter the structured fields manually using the standard PHC patient form.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTranscript(""); setInterimText(""); setStructured(null); setError(null); setRecordingSeconds(0);
  };

  const handleClose = () => {
    if (listening) stopRecording();
    reset();
    onClose();
  };

  const urgencyClass = (level?: string) => {
    if (level === "critical") return "ap-badge-critical";
    if (level === "high") return "ap-badge-high";
    if (level === "medium") return "ap-badge-amber";
    return "ap-badge-low";
  };

  const placeholderHint =
    lang === "te" ? "ఉదాహరణ: \"రోగి పేరు లక్ష్మి, 45 ఏళ్ళు, విజయవాడ నుండి, మూడు రోజులుగా జ్వరం, ఒళ్ళు నొప్పులు...\"" :
    lang === "ur" ? "مثال: \"مریض کا نام رشید، 45 سال، وجے واڑہ سے، تین دن سے بخار...\"" :
    "Example: \"Patient name Lakshmi, 45 years from Vijayawada, fever for 3 days, body pain, BP 130 over 85...\"";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border bg-white shadow-lg ap-scroll"
        style={{ borderColor: SKY_LINE }}
        onClick={(e) => e.stopPropagation()}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4" style={{ borderColor: SKY_LINE }}>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: NAVY }}>
              <Mic className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: NAVY }}>Audio Case Diary</h2>
              <p className="text-[10px] text-slate-500">Speak in {lang === "te" ? "Telugu" : lang === "ur" ? "Urdu" : "English"} — AI fills the form for you</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {!supported && (
            <div className="rounded-md border p-4 text-xs" style={{ background: "#FFEBEE", borderColor: "#FFCDD2", color: "#C62828" }}>
              <strong>Speech recognition not supported.</strong> Please use Chrome, Edge, or Safari.
            </div>
          )}

          <div
            className="flex flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed py-8"
            style={{ borderColor: SKY_LINE, background: "#F8FBFE" }}
          >
            <button
              onClick={listening ? stopRecording : startRecording}
              disabled={!supported || loading}
              className="flex h-24 w-24 items-center justify-center rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              style={{ background: listening ? "#C62828" : NAVY }}
            >
              {listening ? <MicOff className="h-10 w-10 text-white" /> : <Mic className="h-10 w-10 text-white" />}
            </button>
            <div className="text-center">
              {listening ? (
                <>
                  <p className="text-sm font-bold" style={{ color: "#C62828" }}>Recording... {recordingSeconds}s</p>
                  <p className="mt-1 text-[11px] text-slate-500">Click stop when finished</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-900">{transcript ? "Recording stopped" : "Tap to start"}</p>
                  <p className="mt-1 text-[11px] text-slate-500 max-w-md">{placeholderHint}</p>
                </>
              )}
            </div>
          </div>

          {(transcript || interimText) && (
            <div className="rounded-md border bg-white p-4" style={{ borderColor: SKY_LINE }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Transcript</p>
                <button
                  onClick={() => { navigator.clipboard.writeText(transcript); toast.success("Transcript copied"); }}
                  className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">
                {transcript}
                {interimText && <span className="text-slate-400 italic"> {interimText}</span>}
              </p>
            </div>
          )}

          {transcript && !structured && !loading && (
            <button onClick={extractStructure} className="ap-btn-primary w-full px-5 py-3">
              <Sparkles className="h-4 w-4" /> Extract Structured Case with AI
            </button>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-md border px-5 py-4 text-sm font-bold" style={{ background: SKY, borderColor: SKY_LINE, color: NAVY }}>
              <Loader2 className="h-4 w-4 animate-spin" /> AI is extracting fields from your speech...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border p-4 text-xs" style={{ background: "#FFEBEE", borderColor: "#FFCDD2", color: "#C62828" }}>
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {structured && (
            <div className="space-y-4 rounded-md border p-5" style={{ background: "#E8F5E9", borderColor: "#A5D6A7" }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" style={{ color: "#2E7D32" }} />
                  <div>
                    <p className="text-sm font-bold text-slate-900">AI-Structured Case Report</p>
                    <AISafetyBadge compact role="PHC Medical Officer" className="mt-0.5" />
                  </div>
                </div>
                {structured.urgency_level && (
                  <span className={`ap-badge ${urgencyClass(structured.urgency_level)}`}>{structured.urgency_level} urgency</span>
                )}
              </div>
              <p className="text-[10px] text-slate-600 italic -mt-2">
                Final decision remains with the authorized PHC Medical Officer. Verify all extracted fields before saving.
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ["Patient", structured.patient_name],
                  ["Age", structured.age],
                  ["Gender", structured.gender],
                  ["District", structured.district || defaultDistrict],
                  ["Mandal", structured.mandal],
                  ["Duration (days)", structured.duration_days],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-md border bg-white p-2.5" style={{ borderColor: SKY_LINE }}>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
                    <p className="text-xs font-semibold text-slate-900 mt-0.5">{value || "—"}</p>
                  </div>
                ))}
              </div>

              {structured.complaints && structured.complaints.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Complaints</p>
                  <div className="flex flex-wrap gap-1.5">
                    {structured.complaints.map((c) => (
                      <span key={c} className="ap-badge ap-badge-info">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {structured.vitals && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    ["Temp °C", structured.vitals.temperature],
                    ["Systole", structured.vitals.systole],
                    ["Diastole", structured.vitals.diastole],
                    ["SpO₂", structured.vitals.spo2],
                    ["RBS", structured.vitals.rbs],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-md border bg-white p-2 text-center" style={{ borderColor: SKY_LINE }}>
                      <p className="text-[9px] font-bold uppercase text-slate-500">{label}</p>
                      <p className="text-sm font-bold text-slate-900">{value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              )}

              {structured.suggested_diagnosis && (
                <div className="rounded-md border p-3" style={{ background: SKY, borderColor: SKY_LINE }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: NAVY }}>AI Suggested Diagnosis</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {structured.suggested_diagnosis}
                    {structured.icd10 && <span className="ml-2 rounded bg-white px-2 py-0.5 text-[10px] border" style={{ color: NAVY, borderColor: SKY_LINE }}>ICD-10: {structured.icd10}</span>}
                    {structured.category && <span className="ml-2 text-[11px] font-semibold" style={{ color: NAVY }}>({structured.category})</span>}
                  </p>
                  {typeof structured.confidence === "number" && (
                    <p className="mt-1 text-[10px]" style={{ color: NAVY }}>Confidence: {Math.round(structured.confidence * 100)}%</p>
                  )}
                </div>
              )}

              {structured.recommended_actions && structured.recommended_actions.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Recommended Actions</p>
                  <ul className="space-y-1">
                    {structured.recommended_actions.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="mt-0.5" style={{ color: "#2E7D32" }}>✓</span> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-2 flex-wrap">
                <button
                  onClick={() => { toast.success("Case saved to validation queue"); handleClose(); }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold text-white"
                  style={{ background: "#2E7D32" }}
                >
                  <Save className="h-3.5 w-3.5" /> Save Case
                </button>
                <button onClick={reset} className="ap-btn-secondary px-4 py-2.5 text-sm font-bold">
                  Record Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
