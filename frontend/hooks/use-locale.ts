import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { zh, localeType } from "@/locale/zh";

export function useLocale() {
  const [lang, setLang] = useLocalStorage<string>("lang", "zh");
  const [locale, setLocale] = useState<localeType>(zh);
  useEffect(() => {
    if (lang === "zh") {
      setLocale(zh);
    }
  }, [lang]);

  return { locale, setLang };
}
