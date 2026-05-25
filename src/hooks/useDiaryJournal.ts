import { useState, useEffect, useCallback, useRef } from "react";
import type { DiaryDeconstruction, DiaryNewDestiny } from "../types";
import type { DiaryModo, DiaryPersistedState, StepAnswers } from "../types/diary";
import {
  DIARY_STORAGE_KEY,
  defaultDiaryPersisted,
  loadDiaryLocal,
  saveDiaryLocal,
} from "../lib/diaryStorage";
import { CURRENT_STORAGE_VERSION } from "../lib/appStorage";
import {
  pullDiaryFromSupabase,
  pushDiaryToSupabase,
  notifyDiaryUpdated,
  type DiarySyncStatus,
} from "../lib/diarySupabase";

export type { DiaryModo, StepAnswers, AllStepAnswers, DiaryPersistedState } from "../types/diary";
export { DIARY_STORAGE_KEY };

function stampPersisted(p: DiaryPersistedState): DiaryPersistedState {
  return { ...p, updatedAt: Date.now() };
}

/** Sincroniza campos-chave com o estado legado do app */
export function mapStepToLegacy(
  stepId: number,
  answers: StepAnswers
): Partial<DiaryDeconstruction> & Partial<DiaryNewDestiny> {
  const join = (indices: number[]) =>
    indices
      .map((i) => answers[i]?.trim())
      .filter(Boolean)
      .join("\n\n");

  switch (stepId) {
    case 1:
      return {
        whoIHaveBeen: join([0, 1, 2, 4, 6, 7]),
        whatIHaveHidden: answers[5]?.trim() || join([2, 3]),
      };
    case 2:
      return { emotionToUnmemorize: answers[0]?.trim() || "" };
    case 3:
      return {
        limitingThoughts: [join([0, 1, 2, 3])].filter(Boolean),
      };
    case 4:
      return {
        limitingBehaviors: [join([0, 1, 2, 3])].filter(Boolean),
      };
    case 6:
      return { surrenderStatement: join([0, 1, 2, 3]) };
    case 7:
      return {
        frontalLobeWhoAmI: join([0, 1, 2]),
        howToThink: join([2, 3, 4, 5, 6, 7]),
      };
    case 8:
      return { howToAct: join([0, 1, 2, 3, 4]) };
    case 9:
      return {
        howToFeel: join([0, 1, 2, 3, 4]),
        whatWouldISay: answers[0]?.trim() || "",
      };
    default:
      return {};
  }
}

function loadDiaryState(): DiaryPersistedState {
  if (localStorage.getItem("mente_nova_storage_version") !== String(CURRENT_STORAGE_VERSION)) {
    return defaultDiaryPersisted();
  }
  return loadDiaryLocal();
}

export function useDiaryJournal() {
  const [persisted, setPersisted] = useState<DiaryPersistedState>(loadDiaryState);
  const [respostasEtapa, setRespostasEtapa] = useState<StepAnswers>({});
  const [syncStatus, setSyncStatus] = useState<DiarySyncStatus>("idle");
  const [syncErrorDetail, setSyncErrorDetail] = useState<string | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipPushRef = useRef(true);

  useEffect(() => {
    const version = localStorage.getItem("mente_nova_storage_version");
    if (version !== String(CURRENT_STORAGE_VERSION)) {
      setPersisted(defaultDiaryPersisted());
      skipPushRef.current = true;
      return;
    }

    let cancelled = false;
    (async () => {
      setSyncStatus("loading");
      const { merged, status, errorMessage } = await pullDiaryFromSupabase();
      if (cancelled) return;
      if (merged) setPersisted(merged);
      setSyncStatus(status);
      setSyncErrorDetail(status === "error" ? errorMessage ?? null : null);
      skipPushRef.current = false;
      notifyDiaryUpdated();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stamped = stampPersisted(persisted);
    saveDiaryLocal(stamped);
    notifyDiaryUpdated();

    if (skipPushRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      setSyncStatus("syncing");
      void pushDiaryToSupabase(stamped).then(({ status, errorMessage }) => {
        setSyncStatus(status);
        setSyncErrorDetail(status === "error" ? errorMessage ?? null : null);
      });
    }, 1200);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [persisted]);

  useEffect(() => {
    setRespostasEtapa(persisted.respostas[persisted.etapaAtual] ?? {});
  }, [persisted.etapaAtual, persisted.respostas]);

  const patchPersisted = useCallback(
    (fn: (p: DiaryPersistedState) => DiaryPersistedState) => {
      setPersisted((p) => stampPersisted(fn(p)));
    },
    []
  );

  const salvarResposta = useCallback((perguntaIdx: number, valor: string) => {
    setRespostasEtapa((prev) => {
      const next = { ...prev, [perguntaIdx]: valor };
      patchPersisted((p) => ({
        ...p,
        respostas: {
          ...p.respostas,
          [p.etapaAtual]: { ...(p.respostas[p.etapaAtual] ?? {}), [perguntaIdx]: valor },
        },
      }));
      return next;
    });
  }, [patchPersisted]);

  const setModo = (modo: DiaryModo) => patchPersisted((p) => ({ ...p, modo }));
  const setEtapaAtual = (idx: number) =>
    patchPersisted((p) => ({ ...p, etapaAtual: idx, modo: "escrita" }));

  const iniciarProcesso = () =>
    patchPersisted((p) => ({ ...p, started: true, modo: "escrita", etapaAtual: 0 }));

  const guardarEtapaAtual = useCallback(() => {
    patchPersisted((p) => ({
      ...p,
      respostas: { ...p.respostas, [p.etapaAtual]: respostasEtapa },
    }));
  }, [patchPersisted, respostasEtapa]);

  const proximaEtapa = useCallback(() => {
    patchPersisted((p) => {
      const nextIdx = Math.min(p.etapaAtual + 1, 9);
      return {
        ...p,
        respostas: { ...p.respostas, [p.etapaAtual]: respostasEtapa },
        etapaAtual: nextIdx,
        modo: "escrita",
      };
    });
  }, [patchPersisted, respostasEtapa]);

  const etapaConcluida = (stepIndex: number) => {
    const a = persisted.respostas[stepIndex];
    return a && Object.values(a).some((v) => String(v ?? "").trim());
  };

  const syncNow = useCallback(async () => {
    setSyncStatus("syncing");
    const { merged, status, errorMessage } = await pullDiaryFromSupabase();
    if (merged) setPersisted(merged);
    const { status: pushStatus, errorMessage: pushErr } = await pushDiaryToSupabase(
      stampPersisted(merged ?? persisted)
    );
    const final = pushStatus === "error" ? pushStatus : status;
    setSyncStatus(final);
    setSyncErrorDetail(
      final === "error" ? pushErr ?? errorMessage ?? null : null
    );
  }, [persisted]);

  return {
    persisted,
    respostasEtapa,
    salvarResposta,
    setModo,
    setEtapaAtual,
    iniciarProcesso,
    guardarEtapaAtual,
    proximaEtapa,
    etapaConcluida,
    setRespostasEtapa,
    syncStatus,
    syncErrorDetail,
    syncNow,
  };
}
