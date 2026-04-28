import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-health-excellent";
  if (score >= 60) return "text-health-good";
  if (score >= 40) return "text-health-fair";
  return "text-health-poor";
};

const getStrokeColor = (score: number) => {
  if (score >= 80) return "stroke-health-excellent";
  if (score >= 60) return "stroke-health-good";
  if (score >= 40) return "stroke-health-fair";
  return "stroke-health-poor";
};

const sizes = {
  sm: { outer: 48, stroke: 4, text: "text-sm" },
  md: { outer: 72, stroke: 5, text: "text-xl" },
  lg: { outer: 100, stroke: 6, text: "text-3xl" },
};

const HealthScore = ({ score, size = "md", className }: HealthScoreProps) => {
  const s = sizes[size];
  const radius = (s.outer - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={s.outer} height={s.outer} className="-rotate-90">
        <circle
          cx={s.outer / 2}
          cy={s.outer / 2}
          r={radius}
          fill="none"
          className="stroke-border"
          strokeWidth={s.stroke}
        />
        <circle
          cx={s.outer / 2}
          cy={s.outer / 2}
          r={radius}
          fill="none"
          className={cn(getStrokeColor(score), "transition-all duration-700 ease-out")}
          strokeWidth={s.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute font-bold", s.text, getScoreColor(score))}>
        {score}
      </span>
    </div>
  );
};

export default HealthScore;
