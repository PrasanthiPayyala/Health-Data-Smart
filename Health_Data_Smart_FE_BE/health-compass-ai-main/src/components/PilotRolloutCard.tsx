import { Rocket, MapPin, Users, Calendar, FileCheck, Target, ChevronRight } from "lucide-react";

const NAVY = "#0D47A1";
const SKY_LINE = "#90CAF9";

interface Props {
  className?: string;
  compact?: boolean;
}

export default function PilotRolloutCard({ className = "", compact = false }: Props) {
  return (
    <div
      className={`rounded-lg border bg-white overflow-hidden ${className}`}
      style={{ borderColor: "#A5D6A7" }}
    >
      <div className="flex items-center gap-2 border-b px-5 py-4 flex-wrap" style={{ background: "#E8F5E9", borderColor: "#A5D6A7" }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: "#2E7D32" }}>
          <Rocket className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-sm font-bold text-slate-900">Recommended Pilot Rollout</h2>
          <p className="text-[10px] text-slate-600">From demo to operational deployment in 4 weeks</p>
        </div>
        <span className="ap-badge ap-badge-low">Ready to deploy</span>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-2">
        <div className="rounded-md border p-4" style={{ background: "#F8FBFE", borderColor: SKY_LINE }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1">
            <Target className="h-3 w-3" /> Pilot Scope
          </p>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-2 border-b pb-1.5" style={{ borderColor: SKY_LINE }}>
              <dt className="text-slate-600 flex items-center gap-1"><MapPin className="h-3 w-3" /> Pilot district</dt>
              <dd className="font-bold text-slate-900 text-right">Krishna OR East Godavari</dd>
            </div>
            <div className="flex justify-between gap-2 border-b pb-1.5" style={{ borderColor: SKY_LINE }}>
              <dt className="text-slate-600 flex items-center gap-1"><Calendar className="h-3 w-3" /> Duration</dt>
              <dd className="font-bold text-slate-900 text-right">4 weeks</dd>
            </div>
            <div className="flex justify-between gap-2 border-b pb-1.5" style={{ borderColor: SKY_LINE }}>
              <dt className="text-slate-600">Coverage</dt>
              <dd className="font-bold text-slate-900 text-right">5 PHCs + 1 CHC</dd>
            </div>
            <div className="flex justify-between gap-2 border-b pb-1.5" style={{ borderColor: SKY_LINE }}>
              <dt className="text-slate-600 flex items-center gap-1"><Users className="h-3 w-3" /> Field users</dt>
              <dd className="font-bold text-slate-900 text-right">~50 ANM/ASHA workers</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600">Engineering effort</dt>
              <dd className="font-bold text-slate-900 text-right">2 engineers × 4 weeks</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-md border p-4" style={{ background: "#F8FBFE", borderColor: SKY_LINE }}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1">
            <FileCheck className="h-3 w-3" /> Key Pilot Outputs
          </p>
          <ul className="space-y-1.5 text-xs">
            {[
              "Weekly IDSP report (auto-generated PDF)",
              "Officer validation metrics (Approve/Correct/Reject rates)",
              "Field signal capture from ANM/ASHA via voice + offline PWA",
              "Outbreak alert simulation with consented citizen registry",
              "DPDP audit log review with State Surveillance Officer",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-700">
                <span className="font-bold mt-0.5" style={{ color: "#2E7D32" }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {!compact && (
          <div className="lg:col-span-2 rounded-md border p-4" style={{ background: "#F8FBFE", borderColor: SKY_LINE }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#2E7D32" }}>Success Metrics (measured weekly)</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[
                { metric: "Classification Coverage", target: "≥ 95%", note: "of OPD records auto-classified" },
                { metric: "Officer-Confirmed Accuracy", target: "≥ 85%", note: "of AI labels approved by MO" },
                { metric: "Time-to-Alert", target: "< 24 hr", note: "from cluster detection to alert" },
                { metric: "IDSP Report Generation", target: "< 2 min", note: "vs 6 hr manual baseline" },
                { metric: "Field Submission Rate", target: "≥ 80%", note: "of expected ANM/ASHA reports" },
              ].map((m, i) => (
                <div key={i} className="rounded-md border p-2.5" style={{ background: "#E8F5E9", borderColor: "#A5D6A7" }}>
                  <p className="text-2xl font-extrabold" style={{ color: "#1B5E20" }}>{m.target}</p>
                  <p className="text-[10px] font-bold text-slate-900 mt-0.5">{m.metric}</p>
                  <p className="text-[9px] text-slate-600">{m.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t px-5 py-3" style={{ background: "#E8F5E9", borderColor: "#A5D6A7" }}>
        <p className="text-[10px] leading-relaxed flex items-start gap-2" style={{ color: "#1B5E20" }}>
          <ChevronRight className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Next step:</strong> AP Govt selects the pilot district + 5 PHCs. Day-1 setup includes ABHA/IHIP integration testing, ANM training (4 hrs), and DLT registration for citizen SMS. Pilot evaluation report shared with State Surveillance Unit at Week 4.
          </span>
        </p>
      </div>
    </div>
  );
}
