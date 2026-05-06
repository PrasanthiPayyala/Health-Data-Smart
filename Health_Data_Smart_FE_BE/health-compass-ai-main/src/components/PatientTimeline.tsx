import { cn } from "@/lib/utils";
import RiskBadge from "./RiskBadge";

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "visit" | "report" | "prescription" | "alert";
  risk?: "critical" | "high" | "moderate" | "low";
}

interface PatientTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const typeIcons: Record<string, string> = {
  visit: "🩺",
  report: "📋",
  prescription: "💊",
  alert: "⚠️",
};

const typeStyle: Record<string, { bg: string; ring: string }> = {
  visit:        { bg: "#E0F2F1", ring: "#80CBC4" },
  report:       { bg: "#E3F2FD", ring: "#90CAF9" },
  prescription: { bg: "#F3E5F5", ring: "#CE93D8" },
  alert:        { bg: "#FFF3E0", ring: "#FFB74D" },
};

const PatientTimeline = ({ events, className }: PatientTimelineProps) => {
  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, i) => {
        const style = typeStyle[event.type];
        return (
          <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < events.length - 1 && (
              <div className="absolute left-[19px] top-10 h-[calc(100%-24px)] w-px bg-[#90CAF9]" />
            )}

            <div
              className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base"
              style={{ background: style.bg, border: `1.5px solid ${style.ring}` }}
            >
              {typeIcons[event.type]}
            </div>

            <div
              className="flex-1 rounded-lg border bg-white p-3.5 ap-card-hover"
              style={{ borderColor: "#90CAF9" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{event.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {event.risk && <RiskBadge level={event.risk} />}
                  <span className="whitespace-nowrap text-xs text-slate-500">{event.date}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PatientTimeline;
