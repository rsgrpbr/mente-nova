import { supabase, isSupabaseConfigured } from "./supabase";
import type { DiaryPersistedState } from "../types/diary";
import { loadDiaryLocal, saveDiaryLocal } from "./diaryStorage";
import { hasAnyDiaryContent } from "./diaryInsights";

const DEVICE_KEY = "mente_nova_device_id";

export type DiarySyncStatus = "idle" | "loading" | "syncing" | "synced" | "error" | "offline";

export function explainDiarySyncError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("diario_jornal") && (m.includes("does not exist") || m.includes("não existe") || m.includes("schema cache"))) {
    return "A tabela diario_jornal ainda não existe no Supabase. Execute o SQL em supabase/schema.sql.";
  }
  if (m.includes("permission denied") || m.includes("row-level security") || m.includes("42501")) {
    return "Sem permissão (RLS). Crie as políticas diario_* no Supabase.";
  }
  if (m.includes("jwt") || m.includes("apikey") || m.includes("invalid")) {
    return "Chave Supabase inválida. Verifique VITE_SUPABASE_ANON_KEY em .env.local.";
  }
  return message;
}

function stampForPush(state: DiaryPersistedState): DiaryPersistedState {
  return { ...state, updatedAt: state.updatedAt ?? Date.now() };
}

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "local-fallback";
  }
}

export function notifyDiaryUpdated(): void {
  window.dispatchEvent(new CustomEvent("mente-nova-diario-update"));
}

/** Carrega do Supabase; se remoto for mais recente, grava no localStorage */
export async function pullDiaryFromSupabase(): Promise<{
  merged: DiaryPersistedState | null;
  status: DiarySyncStatus;
  errorMessage?: string;
}> {
  if (!isSupabaseConfigured) {
    return { merged: null, status: "offline" };
  }

  const deviceId = getOrCreateDeviceId();
  const { data, error } = await supabase
    .from("diario_jornal")
    .select("payload, updated_at")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    console.error("[Diário] Erro ao carregar do Supabase:", error.message);
    return { merged: null, status: "error", errorMessage: explainDiarySyncError(error.message) };
  }

  if (!data?.payload) {
    const local = loadDiaryLocal();
    if (hasAnyDiaryContent(local.respostas)) {
      const { status, errorMessage } = await pushDiaryToSupabase(stampForPush(local));
      return { merged: null, status, errorMessage };
    }
    return { merged: null, status: "synced" };
  }

  const remote = data.payload as DiaryPersistedState;
  const remoteTs = new Date(data.updated_at).getTime();
  const local = loadDiaryLocal();
  const localTs = local.updatedAt ?? 0;

  if (remoteTs > localTs) {
    const merged: DiaryPersistedState = {
      ...local,
      ...remote,
      updatedAt: remoteTs,
    };
    saveDiaryLocal(merged);
    notifyDiaryUpdated();
    return { merged, status: "synced" };
  }

  if (localTs > remoteTs && hasAnyDiaryContent(local.respostas)) {
    const { status, errorMessage } = await pushDiaryToSupabase(stampForPush(local));
    return { merged: null, status, errorMessage };
  }

  return { merged: null, status: "synced" };
}

/** Envia estado local para Supabase (upsert por device_id) */
export async function pushDiaryToSupabase(
  state: DiaryPersistedState
): Promise<{ status: DiarySyncStatus; errorMessage?: string }> {
  if (!isSupabaseConfigured) {
    return { status: "offline" };
  }

  const deviceId = getOrCreateDeviceId();
  const withTs: DiaryPersistedState = {
    ...state,
    updatedAt: state.updatedAt ?? Date.now(),
  };

  const { error } = await supabase.from("diario_jornal").upsert(
    {
      device_id: deviceId,
      payload: withTs,
      updated_at: new Date(withTs.updatedAt).toISOString(),
    },
    { onConflict: "device_id" }
  );

  if (error) {
    console.error("[Diário] Erro ao guardar no Supabase:", error.message);
    return { status: "error", errorMessage: explainDiarySyncError(error.message) };
  }

  saveDiaryLocal(withTs);
  return { status: "synced" };
}

export { getOrCreateDeviceId };
