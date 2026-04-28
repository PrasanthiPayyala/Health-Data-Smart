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

const typeBg: Record<string, string> = {
  visit: "bg-medical-teal-light",
  report: "bg-medical-blue-light",
  prescription: "bg-medical-purple-light",
  alert: "bg-medical-amber-light",
};

const PatientTimeline = ({ events, className }: PatientTimelineProps) => {
  return (
    <div className={cn("space-y-0", className)}>
      {events.map((event, i) => (
        <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Line */}
          {i < events.length - 1 && (
            <div className="absolute left-[19px] top-10 h-[calc(100%-24px)] w-px bg-border" />
          )}
          {/* Dot */}
          <div
            className={cn(
              "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm",
              typeBg[event.type]
            )}
          >
            {typeIcons[event.type]}
          </div>
          {/* Content */}
          <div className="flex-1 rounded-lg border bg-card p-3 shadow-card transition-shadow hover:shadow-card-hover">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-card-foreground">{event.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{event.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {event.risk && <RiskBadge level={event.risk} />}
                <span className="whitespace-nowrap text-xs text-muted-foreground">{event.date}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PatientTimeline;
