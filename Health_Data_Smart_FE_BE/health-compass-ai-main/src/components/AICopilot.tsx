import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Send, Sparkles, X, Loader2 } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import AISafetyBadge from "@/components/AISafetyBadge";

const NAVY = "#0D47A1";
const ELECTRIC = "#1976D2";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface AICopilotProps {
  floating?: boolean;
  className?: string;
  patientContext?: Record<string, unknown>;
}

const AICopilot = ({ floating = false, className, patientContext }: AICopilotProps) => {
  const { t, lang } = useLang();
  const suggestions = useMemo(() => [
    t("copilot_suggest_summary"),
    t("copilot_suggest_dx"),
    t("copilot_suggest_tests"),
    t("copilot_suggest_outbreak"),
    t("copilot_suggest_classify"),
  ], [t]);
  const [isOpen, setIsOpen] = useState(!floating);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: t("copilot_greeting") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          context: { ...(patientContext || {}), preferred_language: lang },
          history: messages.slice(-6).map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.text,
          })),
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch {
      const fallback = (
        "AI service temporarily unavailable. Showing rule-based surveillance intelligence:\n\n" +
        "• For disease classification: refer to ICD-10 + SNOMED tables\n" +
        "• For outbreak alerts: cross-check District Risk Table + IDSP weekly report\n" +
        "• For differential diagnosis: refer to standard MO clinical protocols\n\n" +
        "Please retry in a moment, or escalate to your Medical Officer / District Surveillance Unit."
      );
      setMessages((prev) => [...prev, { role: "ai", text: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  if (floating) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[380px] flex-col overflow-hidden rounded-lg border bg-white shadow-lg"
            style={{ borderColor: SKY_LINE }}
          >
            <CopilotContent
              messages={messages}
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              onClose={() => setIsOpen(false)}
              suggestions={suggestions}
              loading={loading}
            />
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close AI Copilot" : "Open AI Copilot"}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
          style={{ background: NAVY }}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border bg-white",
        className
      )}
      style={{ borderColor: SKY_LINE }}
    >
      <CopilotContent
        messages={messages}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        suggestions={suggestions}
        loading={loading}
      />
    </div>
  );
};

function CopilotContent({
  messages,
  input,
  setInput,
  handleSend,
  onClose,
  suggestions,
  loading,
}: {
  messages: { role: "ai" | "user"; text: string }[];
  input: string;
  setInput: (v: string) => void;
  handleSend: (text?: string) => void;
  onClose?: () => void;
  suggestions: string[];
  loading: boolean;
}) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useLang();
  return (
    <>
      {/* Header */}
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ background: NAVY, borderColor: SKY_LINE }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">{t("copilot_title")}</p>
          <p className="text-[10px] leading-tight flex items-center gap-1.5" style={{ color: "#BBDEFB" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online · GPT-medical
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white hover:bg-white/15"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 ap-scroll" style={{ background: "#F8FBFE" }}>
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-wrap"
              )}
              style={
                msg.role === "user"
                  ? { background: NAVY, color: "#FFFFFF" }
                  : { background: "#FFFFFF", color: "#0F172A", border: `1px solid ${SKY_LINE}` }
              }
            >
              {msg.text}
            </div>
            {msg.role === "ai" && i > 0 && (
              <div className="mt-1 ml-1">
                <AISafetyBadge compact />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm text-slate-700"
              style={{ background: "#FFFFFF", border: `1px solid ${SKY_LINE}` }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: ELECTRIC }} />
              {t("copilot_thinking")}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3" style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={loading}
              className="rounded-full border px-2.5 py-1 text-xs font-medium disabled:opacity-50"
              style={{ borderColor: SKY_LINE, background: SKY, color: NAVY }}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("copilot_placeholder")}
            disabled={loading}
            className="flex-1 rounded-md border px-3 py-2 text-sm text-slate-900 outline-none disabled:opacity-50"
            style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = ELECTRIC)}
            onBlur={(e) => (e.currentTarget.style.borderColor = SKY_LINE)}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white disabled:opacity-50"
            style={{ background: NAVY }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </>
  );
}

export default AICopilot;
