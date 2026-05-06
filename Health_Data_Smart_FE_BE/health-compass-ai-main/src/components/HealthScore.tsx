import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const scoreColor = (score: number) => {
  if (score >= 80) return { stroke: "#2E7D32", text: "#2E7D32" };
  if (score >= 60) return { stroke: "#1976D2", text: "#1976D2" };
  if (score >= 40) return { stroke: "#E65100", text: "#E65100" };
  return { stroke: "#C62828", text: "#C62828" };
};

const sizes = {
  sm: { outer: 48, stroke: 4, text: "text-sm" },
  md: { outer: 80, stroke: 6, text: "text-xl" },
  lg: { outer: 120, stroke: 8, text: "text-3xl" },
};

const HealthScore = ({ score, size = "md", className }: HealthScoreProps) => {
  const s = sizes[size];
  const radius = (s.outer - s.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const c = scoreColor(score);
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={s.outer} height={s.outer} className="-rotate-90">
        <circle
          cx={s.outer / 2}
          cy={s.outer / 2}
          r={radius}
          fill="none"
          stroke="#E3F2FD"
          strokeWidth={s.stroke}
        />
        <circle
          cx={s.outer / 2}
          cy={s.outer / 2}
          r={radius}
          fill="none"
          stroke={c.stroke}
          strokeWidth={s.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute font-extrabold tabular-nums", s.text)} style={{ color: c.text }}>
        {score}
      </span>
    </div>
  );
};

export default HealthScore;
