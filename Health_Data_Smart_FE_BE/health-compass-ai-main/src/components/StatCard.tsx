import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "primary" | "warning" | "danger";
  className?: string;
  onClick?: () => void;
}

const variants = {
  default: { iconBg: "#E3F2FD", iconColor: "#0D47A1" },
  primary: { iconBg: "#E0F2F1", iconColor: "#00695C" },
  warning: { iconBg: "#FFF3E0", iconColor: "#E65100" },
  danger:  { iconBg: "#FFEBEE", iconColor: "#C62828" },
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
  onClick,
}: StatCardProps) => {
  const v = variants[variant];
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={cn("rounded-lg border bg-white p-5 ap-card-hover w-full text-left", className)}
      style={{ borderColor: "#90CAF9" }}
      title={onClick ? "Click to see detailed breakdown" : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums" style={{ color: "#0D47A1" }}>
            {value}
          </p>
          {subtitle && <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={
                  trend.positive
                    ? { background: "#E8F5E9", color: "#2E7D32", border: "1px solid #C8E6C9" }
                    : { background: "#FFEBEE", color: "#C62828", border: "1px solid #FFCDD2" }
                }
              >
                {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.value}
              </span>
              <span className="text-[10px] text-slate-500">vs last week</span>
            </div>
          )}
        </div>

        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
          style={{ background: v.iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: v.iconColor }} />
        </div>
      </div>
      {onClick && (
        <p className="mt-3 text-[10px] font-semibold" style={{ color: "#0D47A1" }}>View details →</p>
      )}
    </Wrapper>
  );
};

export default StatCard;
