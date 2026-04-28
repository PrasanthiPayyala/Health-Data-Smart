import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "primary" | "warning" | "danger";
  className?: string;
}

const variants = {
  default: { iconBg: "bg-secondary", iconColor: "text-secondary-foreground" },
  primary: { iconBg: "bg-medical-teal-light", iconColor: "text-medical-teal" },
  warning: { iconBg: "bg-medical-amber-light", iconColor: "text-medical-amber" },
  danger: { iconBg: "bg-risk-critical/10", iconColor: "text-risk-critical" },
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, variant = "default", className }: StatCardProps) => {
  const v = variants[variant];
  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("mt-1 text-xs font-medium", trend.positive ? "text-health-excellent" : "text-risk-critical")}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", v.iconBg)}>
          <Icon className={cn("h-5 w-5", v.iconColor)} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
