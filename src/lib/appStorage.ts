import type { AppState } from "../types";
import { FRESH_INITIAL_STATE } from "../config/freshState";
import { DIARY_STORAGE_KEY, defaultDiaryPersisted, saveDiaryLocal } from "./diaryStorage";

export const APP_STATE_KEY = "mente_nova_state";
const STORAGE_VERSION_KEY = "mente_nova_storage_version";

/** Incrementar quando for necessário limpar dados antigos/de demonstração */
export const CURRENT_STORAGE_VERSION = 3;

function isLegacyDemoState(state: AppState): boolean {
  if (state.streakDays >= 5) return true;
  if (state.currentWeek > 1 && state.meditationLogs.length === 0) return false;
  if (state.meditationLogs.some((m) => /^m-[12]-\d+$/.test(m.id))) return true;
  if (
    state.intercepts.length >= 10 &&
    state.intercepts.some((i) => i.thoughtContext === "Detecção automática de reatividade")
  ) {
    return true;
  }
  const demoSnippet = "Ansiedade crônica e controle obsessivo";
  if (state.diaryDeconstruction.emotionToUnmemorize === demoSnippet) return true;
  return false;
}

export function wipeLocalAppData(): void {
  localStorage.setItem(STORAGE_VERSION_KEY, String(CURRENT_STORAGE_VERSION));
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(FRESH_INITIAL_STATE));
  saveDiaryLocal(defaultDiaryPersisted());
  localStorage.removeItem("mente_nova_device_id");
  window.dispatchEvent(new CustomEvent("mente-nova-diario-update"));
}

/** Carrega estado ou repõe vazio (migração automática) */
export function loadAppState(): AppState {
  const version = localStorage.getItem(STORAGE_VERSION_KEY);

  if (version !== String(CURRENT_STORAGE_VERSION)) {
    wipeLocalAppData();
    return { ...FRESH_INITIAL_STATE };
  }

  const saved = localStorage.getItem(APP_STATE_KEY);
  if (!saved) {
    wipeLocalAppData();
    return { ...FRESH_INITIAL_STATE };
  }

  try {
    const parsed = JSON.parse(saved) as AppState;
    if (isLegacyDemoState(parsed)) {
      wipeLocalAppData();
      return { ...FRESH_INITIAL_STATE };
    }
    return parsed;
  } catch {
    wipeLocalAppData();
    return { ...FRESH_INITIAL_STATE };
  }
}
