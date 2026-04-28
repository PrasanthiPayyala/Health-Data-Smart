import { cn } from "@/lib/utils";

type RiskLevel = "critical" | "high" | "moderate" | "low";

interface RiskBadgeProps {
  level: RiskLevel;
  label?: string;
  className?: string;
  animate?: boolean;
}

const levelConfig: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-risk-critical/15", text: "text-risk-critical", dot: "bg-risk-critical" },
  high: { bg: "bg-risk-high/15", text: "text-risk-high", dot: "bg-risk-high" },
  moderate: { bg: "bg-risk-moderate/15", text: "text-risk-moderate", dot: "bg-risk-moderate" },
  low: { bg: "bg-risk-low/15", text: "text-risk-low", dot: "bg-risk-low" },
};

const RiskBadge = ({ level, label, className, animate = false }: RiskBadgeProps) => {
  const config = levelConfig[level];
  const displayLabel = label || level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        config.bg,
        config.text,
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", config.dot, animate && "animate-pulse-gentle")}
      />
      {displayLabel}
    </span>
  );
};

export default RiskBadge;
