import { ShieldAlert } from "lucide-react";

interface Props {
  compact?: boolean;
  role?: string;
  className?: string;
}

export default function AISafetyBadge({ compact = false, role = "medical/public health officer", className = "" }: Props) {
  return (
    <div className={`inline-flex flex-col gap-0.5 ${className}`}>
      <span
        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold self-start"
        style={{ background: "#FFF8E1", color: "#B26A00", borderColor: "#FFE082" }}
      >
        <ShieldAlert className="h-2.5 w-2.5" />
        AI-Assisted · Officer Validation Required
      </span>
      {!compact && (
        <p className="text-[9px] text-slate-500 italic leading-tight">
          Final decision remains with the authorized {role}.
        </p>
      )}
    </div>
  );
}
