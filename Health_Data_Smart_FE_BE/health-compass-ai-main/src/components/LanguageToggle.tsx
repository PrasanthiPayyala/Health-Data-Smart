import { Languages } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";

const NAVY = "#0D47A1";
const SKY = "#E3F2FD";
const SKY_LINE = "#90CAF9";

export default function LanguageToggle({ size = "sm" }: { size?: "sm" | "md" }) {
  const { lang, setLang } = useLang();
  const cls = size === "md" ? "text-xs px-3 py-1.5" : "text-[11px] px-2.5 py-1";

  return (
    <div
      className="flex items-center gap-1 rounded-md border p-0.5"
      style={{ borderColor: SKY_LINE, background: "#FFFFFF" }}
    >
      {LANGUAGES.map((l, i) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          dir={l.dir}
          className={`flex items-center gap-1 rounded font-semibold transition-colors ${cls}`}
          style={
            lang === l.code
              ? { background: NAVY, color: "#FFFFFF" }
              : { background: "transparent", color: NAVY }
          }
          onMouseEnter={(e) => {
            if (lang !== l.code) e.currentTarget.style.background = SKY;
          }}
          onMouseLeave={(e) => {
            if (lang !== l.code) e.currentTarget.style.background = "transparent";
          }}
          title={l.label}
        >
          {i === 0 && <Languages className="h-3 w-3" />}
          {l.native}
        </button>
      ))}
    </div>
  );
}
