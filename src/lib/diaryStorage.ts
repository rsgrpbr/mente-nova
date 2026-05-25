import type { DiaryPersistedState } from "../types/diary";

export const DIARY_STORAGE_KEY = "mente_nova_diario_etapas";

export const defaultDiaryPersisted = (): DiaryPersistedState => ({
  etapaAtual: 0,
  modo: "inicio",
  respostas: {},
  started: false,
  updatedAt: 0,
});

export function loadDiaryLocal(): DiaryPersistedState {
  try {
    const raw = localStorage.getItem(DIARY_STORAGE_KEY);
    if (raw) return { ...defaultDiaryPersisted(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultDiaryPersisted();
}

export function saveDiaryLocal(state: DiaryPersistedState): void {
  localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(state));
}
