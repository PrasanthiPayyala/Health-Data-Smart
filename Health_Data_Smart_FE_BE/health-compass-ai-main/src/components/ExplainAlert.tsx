import { useState } from "react";
import { HelpCircle, X, AlertTriangle, Activity, Target, Lightbulb } from "lucide-react";

const NAVY = "#0D47A1";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";

export interface AlertExplanation {
  alert_title: string;
  data_source: string;
  current_value: string;
  baseline_value: string;
  delta: string;
  threshold_rule: string;
  recommended_actions: string[];
  ai_explanation?: string;
}

interface Props {
  explanation: AlertExplanation;
  variant?: "link" | "button";
  className?: string;
}

export default function ExplainAlert({ explanation, variant = "link", className = "" }: Props) {
  const [open, setOpen] = useState(false);

  const triggerStyles =
    variant === "button"
      ? "inline-flex items-center gap-1 rounded-md border bg-white px-2.5 py-1 text-[10px] font-bold"
      : "inline-flex items-center gap-1 text-[10px] font-bold underline-offset-2 hover:underline";

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`${triggerStyles} ${className}`}
        style={{ color: NAVY, ...(variant === "button" ? { borderColor: SKY_LINE } : {}) }}
        title="See why this alert was triggered"
      >
        <HelpCircle className="h-3 w-3" />
        Why this alert?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.45)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-lg border bg-white shadow-lg"
            style={{ borderColor: SKY_LINE }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: SKY_LINE }}>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: "#FFF3E0" }}>
                  <AlertTriangle className="h-4 w-4" style={{ color: "#E65100" }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: NAVY }}>Why this alert was triggered</h3>
                  <p className="text-[10px] text-slate-500 truncate">{explanation.alert_title}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3" style={{ background: "#F8FBFE", borderColor: SKY_LINE }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Activity className="h-2.5 w-2.5" /> Current
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{explanation.current_value}</p>
                </div>
                <div className="rounded-md border p-3" style={{ background: "#F8FBFE", borderColor: SKY_LINE }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Baseline</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{explanation.baseline_value}</p>
                </div>
              </div>

              <div className="rounded-md border-2 p-3" style={{ background: "#FFF3E0", borderColor: "#FFCC80" }}>
                <p className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1" style={{ color: "#E65100" }}>
                  <Target className="h-2.5 w-2.5" /> Delta · Threshold
                </p>
                <p className="mt-1 text-sm font-bold" style={{ color: "#7A4F01" }}>{explanation.delta}</p>
                <p className="mt-1 text-[10px] italic" style={{ color: "#B26A00" }}>Rule: {explanation.threshold_rule}</p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">Data Source</p>
                <p className="text-[11px] text-slate-700 leading-relaxed">{explanation.data_source}</p>
              </div>

              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1" style={{ color: "#2E7D32" }}>
                  <Lightbulb className="h-2.5 w-2.5" /> Suggested Public-Health Action
                </p>
                <ul className="space-y-1">
                  {explanation.recommended_actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
                      <span className="mt-0.5 font-bold" style={{ color: "#2E7D32" }}>✓</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {explanation.ai_explanation && (
                <div className="rounded-md border p-3" style={{ background: "#F3E5F5", borderColor: "#CE93D8" }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#6A1B9A" }}>Additional AI Context</p>
                  <p className="text-[11px] text-slate-700 leading-relaxed">{explanation.ai_explanation}</p>
                </div>
              )}

              <p className="text-[9px] text-slate-500 italic">
                This explanation is generated by deterministic surveillance rules. It works offline and does not depend on the AI service.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function buildOutbreakExplanation(opts: {
  disease: string;
  location: string;
  cases: number;
  baseline: number;
  affected_mandals?: number;
  ai_text?: string;
}): AlertExplanation {
  const spike_pct = Math.round(((opts.cases - opts.baseline) / Math.max(opts.baseline, 1)) * 100);
  const ratio = opts.baseline > 0 ? (opts.cases / opts.baseline).toFixed(1) : "N/A";

  const d = opts.disease.toLowerCase();
  let actions: string[];
  if (d.includes("fever") || d.includes("dengue") || d.includes("malaria") || d.includes("chikun")) {
    actions = [
      "Deploy fever surveillance camps in affected mandals within 48h",
      "Conduct CBC + platelet count + malaria RDT for fever > 3 days",
      "Source-reduction drive: clear stagnant water around homes",
      "Notify District Health Officer + State Surveillance Unit",
    ];
  } else if (d.includes("diarrh") || d.includes("cholera") || d.includes("gastric") || d.includes("vomit")) {
    actions = [
      "Urgent water-quality testing at shared sources (canal, treatment plant)",
      "Deploy ORS distribution teams to affected mandals",
      "Food-safety inspection at street vendors + community kitchens",
      "Notify District Health Officer + State Surveillance Unit",
    ];
  } else if (d.includes("cough") || d.includes("ari") || d.includes("respiratory") || d.includes("influenza")) {
    actions = [
      "Activate ARI surveillance protocol at district PHCs",
      "Collect throat swabs from severe / cluster cases",
      "Isolate suspected influenza cases in health facilities",
      "Notify District Health Officer",
    ];
  } else {
    actions = [
      "Increase passive surveillance at PHCs in affected area",
      "Field investigation team to visit affected mandals",
      "Collect samples for lab confirmation",
      "Notify District Health Officer",
    ];
  }

  return {
    alert_title: `${opts.disease} spike in ${opts.location}`,
    data_source: `Live AP Health IQ surveillance — OPD records + ANM/ASHA field signals from ${opts.location}, aggregated over the last 7 days.`,
    current_value: `${opts.cases} cases this week${opts.affected_mandals ? ` across ${opts.affected_mandals} mandals` : ""}`,
    baseline_value: `${opts.baseline} cases/week (6-week median for ${opts.location})`,
    delta: `${spike_pct >= 0 ? "+" : ""}${spike_pct}% vs baseline (${ratio}x)`,
    threshold_rule:
      spike_pct >= 100
        ? "Auto-alert (Critical) when current cases ≥ 2.0x baseline"
        : spike_pct >= 50
        ? "Auto-alert (High) when current cases ≥ 1.5x baseline"
        : "Auto-alert (Elevated) when current cases ≥ 1.2x baseline",
    recommended_actions: actions,
    ai_explanation: opts.ai_text,
  };
}
