import { Languages } from "lucide-react";
import { useLang } from "@/lib/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";

export default function LanguageToggle({ size = "sm" }: { size?: "sm" | "md" }) {
  const { lang, setLang } = useLang();
  const cls = size === "md" ? "text-xs px-3 py-1.5" : "text-[11px] px-2.5 py-1";

  return (
    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
      {LANGUAGES.map((l, i) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          dir={l.dir}
          className={`flex items-center gap-1 rounded-md font-bold transition ${cls} ${
            lang === l.code ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
          title={l.label}
        >
          {i === 0 && <Languages className="h-3 w-3" />}
          {l.native}
        </button>
      ))}
    </div>
  );
}
