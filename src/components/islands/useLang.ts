import { useEffect, useState } from "react";
import { getLang, type Lang } from "../../lib/i18n";

/** Reads the current UI language and re-renders when the nav toggle changes it. */
export function useLang(): Lang {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    setLang(getLang()); // sync to persisted choice after hydration
    const onChange = (e: Event) => setLang((e as CustomEvent<Lang>).detail ?? getLang());
    window.addEventListener("agentprep-langchange", onChange);
    return () => window.removeEventListener("agentprep-langchange", onChange);
  }, []);
  return lang;
}
