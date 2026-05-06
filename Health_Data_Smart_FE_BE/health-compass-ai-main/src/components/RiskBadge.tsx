import { cn } from "@/lib/utils";

type RiskLevel = "critical" | "high" | "moderate" | "low";

interface RiskBadgeProps {
  level: RiskLevel;
  label?: string;
  className?: string;
  animate?: boolean; // ignored — no animations per app guidelines
}

const config: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
  critical: { bg: "#FFEBEE", text: "#C62828", border: "#FFCDD2", dot: "#C62828" },
  high:     { bg: "#FFF3E0", text: "#E65100", border: "#FFCC80", dot: "#E65100" },
  moderate: { bg: "#E3F2FD", text: "#1565C0", border: "#BBDEFB", dot: "#1565C0" },
  low:      { bg: "#E8F5E9", text: "#2E7D32", border: "#C8E6C9", dot: "#2E7D32" },
};

const RiskBadge = ({ level, label, className }: RiskBadgeProps) => {
  const c = config[level];
  const displayLabel = label || level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border",
        className
      )}
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.dot }} />
      {displayLabel}
    </span>
  );
};

export default RiskBadge;
