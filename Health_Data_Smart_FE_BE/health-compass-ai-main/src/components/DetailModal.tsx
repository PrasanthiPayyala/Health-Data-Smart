import { ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";

const NAVY = "#0D47A1";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Optional accent color for the header icon background. Defaults to navy. */
  accent?: string;
  children: ReactNode;
  /** Maximum width — default "max-w-2xl". Pass "max-w-4xl" for wider tables. */
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClass = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

/**
 * Generic detail panel that opens when a user clicks a KPI card or a table row.
 * Light professional styling — white surface, sky-blue border, navy accents.
 * No animations, no glassmorphism — matches the rest of the app.
 */
export default function DetailModal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  accent = NAVY,
  children,
  size = "md",
}: DetailModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.45)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${sizeClass[size]} max-h-[90vh] overflow-y-auto rounded-lg border bg-white shadow-lg ap-scroll`}
        style={{ borderColor: SKY_LINE }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4"
          style={{ borderColor: SKY_LINE }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                style={{ background: accent }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold truncate" style={{ color: NAVY }}>{title}</h2>
              {subtitle && <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Helper sub-components for consistent detail layouts ──────────────────

interface DetailRowProps {
  label: string;
  value: ReactNode;
}
export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2.5 last:border-b-0" style={{ borderColor: SKY_LINE }}>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900 text-right break-words">{value}</span>
    </div>
  );
}

interface DetailGridProps {
  items: { label: string; value: ReactNode; accent?: string }[];
  cols?: 2 | 3 | 4;
}
export function DetailGrid({ items, cols = 3 }: DetailGridProps) {
  const colClass = cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3";
  return (
    <div className={`grid grid-cols-2 ${colClass} gap-3`}>
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-md border p-3"
          style={{ background: "#F8FBFE", borderColor: SKY_LINE }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.label}</p>
          <p className="mt-1 text-base font-extrabold tabular-nums" style={{ color: item.accent || NAVY }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

interface DetailSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}
export function DetailSection({ title, children, className = "" }: DetailSectionProps) {
  return (
    <div className={`mt-5 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: NAVY }}>
        {title}
      </p>
      {children}
    </div>
  );
}
