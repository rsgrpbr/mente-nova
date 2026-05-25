import { useState, useEffect, useCallback } from "react";
import { loadDiaryLocal } from "../lib/diaryStorage";
import { pullDiaryFromSupabase } from "../lib/diarySupabase";
import { getTopDailyReminders, hasAnyDiaryContent } from "../lib/diaryInsights";
import type { DiaryInsights } from "../lib/diaryInsights";

export function useDiaryReminders() {
  const [lembretes, setLembretes] = useState<DiaryInsights["lembretesDiarios"]>([]);
  const [hasContent, setHasContent] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const local = loadDiaryLocal();
    const respostas = local.respostas ?? {};
    setHasContent(hasAnyDiaryContent(respostas));
    setLembretes(getTopDailyReminders(respostas, 3));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("mente-nova-diario-update", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("mente-nova-diario-update", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { merged } = await pullDiaryFromSupabase();
      if (!cancelled) refresh();
      if (merged && !cancelled) refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { lembretes, hasContent, loading };
}
