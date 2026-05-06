import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Lang, t as translate, TranslationKey, translateDisease } from "./i18n";

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  td: (disease: string) => string;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("ap_lang") as Lang) || "en";
  });

  useEffect(() => {
    localStorage.setItem("ap_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);
  const isRTL = lang === "ur";

  const value: LanguageContextValue = {
    lang,
    setLang,
    t: (key) => translate(lang, key),
    td: (disease) => translateDisease(lang, disease),
    isRTL,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback when provider not present (some legacy pages)
    return {
      lang: "en" as Lang,
      setLang: () => {},
      t: (key: TranslationKey) => translate("en", key),
      td: (d: string) => d,
      isRTL: false,
    };
  }
  return ctx;
}
