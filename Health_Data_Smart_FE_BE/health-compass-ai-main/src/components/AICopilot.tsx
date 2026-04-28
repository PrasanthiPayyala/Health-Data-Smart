import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Send, Sparkles, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/LanguageContext";

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
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: t("copilot_unavailable") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (floating) {
    return (
      <>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-20 right-6 z-50 flex h-[460px] w-[360px] flex-col overflow-hidden rounded-2xl border bg-card shadow-elevated"
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
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full gradient-primary shadow-elevated transition-transform hover:scale-105"
        >
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </button>
      </>
    );
  }

  return (
    <div className={cn("flex h-full flex-col overflow-hidden rounded-xl border bg-card", className)}>
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
      <div className="flex items-center gap-2 border-b px-4 py-3 gradient-primary">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
        <span className="font-semibold text-primary-foreground">{t("copilot_title")}</span>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-primary-foreground/70 hover:text-primary-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("copilot_thinking")}
            </div>
          </div>
        )}
      </div>
      <div className="border-t p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={loading}
              className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
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
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </>
  );
}

export default AICopilot;
