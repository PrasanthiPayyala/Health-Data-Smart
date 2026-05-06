import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, MapPin, Radar, FileText, MessageCircle, ClipboardCheck,
  Mic, Shield, ChevronRight, PlayCircle,
} from "lucide-react";

const NAVY = "#0D47A1";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: any;
  route: string;
  scrollTo?: string;
  callout?: string;
}

const STEPS: Step[] = [
  { id: 1, title: "State outbreak overview", description: "29 districts with real + synthetic OPD records, color-coded by risk. Banner shows the data provenance split.", icon: MapPin, route: "/state-dashboard", callout: "Look at the amber Scale Test Mode banner + the AP heat-map." },
  { id: 2, title: "Cross-district pattern insight", description: "AI detects multi-district outbreak correlations in 6 geographic clusters with rule-based hypotheses + Groq explanations.", icon: Radar, route: "/state-dashboard", scrollTo: "[data-demo-id='pattern-insights']", callout: "Scroll to the purple 'Pattern Insights' card." },
  { id: 3, title: "Download IDSP report", description: "Auto-generated S/P/L disease surveillance report in government-ready PDF format with charts + signature block.", icon: FileText, route: "/state-dashboard", callout: "Click the 'Download PDF' button next to the District Risk Table." },
  { id: 4, title: "District broadcast alert", description: "Officer broadcasts WhatsApp alert to consented citizens. Live sends gated by allowlist; rest are honestly labelled simulated.", icon: MessageCircle, route: "/district-dashboard", callout: "Click the 'Broadcast Alert' button in the header." },
  { id: 5, title: "PHC validation queue", description: "Medical Officer reviews low-confidence AI classifications with Approve / Correct / Reject — drives continuous model improvement.", icon: ClipboardCheck, route: "/phc-dashboard", callout: "See the AI Validation Queue card + officer feedback buttons." },
  { id: 6, title: "Audio case diary", description: "ANM/ASHA speaks 30 sec describing a patient in Telugu/Urdu/English → AI extracts structured clinical fields.", icon: Mic, route: "/phc-dashboard", callout: "Click the 'Audio Case' button (bottom-left)." },
  { id: 7, title: "DPDP compliance dashboard", description: "9 DPDP Act 2023 principles, full PII access audit log, role-based access matrix — govt-RFP credibility.", icon: Shield, route: "/compliance", callout: "'Compliance' button in the State Dashboard header navigates here." },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GuidedDemo({ open, onClose }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const goToStep = (step: Step) => {
    onClose();
    setTimeout(() => {
      navigate(step.route);
      if (step.scrollTo) {
        setTimeout(() => {
          const el = document.querySelector(step.scrollTo!);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 600);
      }
    }, 100);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(15,23,42,0.45)" }}
        onClick={onClose}
      />

      <aside
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l bg-white shadow-lg ap-scroll"
        style={{ borderColor: SKY_LINE }}
        role="dialog"
        aria-labelledby="guided-demo-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4" style={{ borderColor: SKY_LINE }}>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: NAVY }}>
              <PlayCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 id="guided-demo-title" className="text-sm font-bold" style={{ color: NAVY }}>
                AP Health IQ — Guided Demo Walkthrough
              </h2>
              <p className="text-[10px] text-slate-500">7 steps · ~5 min · Click any step to jump there</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close guided demo">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => goToStep(step)}
              className="w-full text-left rounded-md border bg-white p-4 ap-card-hover"
              style={{ borderColor: SKY_LINE }}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border" style={{ background: SKY, borderColor: SKY_LINE }}>
                  <step.icon className="h-4 w-4" style={{ color: NAVY }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: NAVY }}>STEP {step.id}</span>
                    <h3 className="text-sm font-bold text-slate-900 truncate">{step.title}</h3>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-700 leading-relaxed">{step.description}</p>
                  {step.callout && (
                    <p className="mt-1.5 text-[10px] italic" style={{ color: NAVY }}>→ {step.callout}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
              </div>
            </button>
          ))}
        </div>

        <div className="sticky bottom-0 border-t p-4" style={{ background: SKY, borderColor: SKY_LINE }}>
          <p className="text-[10px] text-slate-700 leading-relaxed">
            <strong style={{ color: NAVY }}>Pro tip:</strong> Open the demo URL on a phone in incognito to show real PWA + offline behaviour. Final step (DPDP compliance) is the strongest govt-RFP signal.
          </p>
        </div>
      </aside>
    </>
  );
}
