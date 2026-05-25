import { supabase, isSupabaseConfigured } from "./supabase";
import { getOrCreateDeviceId, notifyDiaryUpdated } from "./diarySupabase";
import { wipeLocalAppData } from "./appStorage";

const DEVICE_KEY = "mente_nova_device_id";

export interface ResetResult {
  localCleared: boolean;
  cloudCleared: boolean;
  cloudErrors: string[];
}

/** Apaga localStorage do app e, se possível, dados Supabase deste dispositivo */
export async function resetAllAppData(): Promise<ResetResult> {
  const cloudErrors: string[] = [];

  wipeLocalAppData();

  if (!isSupabaseConfigured) {
    return { localCleared: true, cloudCleared: false, cloudErrors: [] };
  }

  const deviceId = getOrCreateDeviceId();

  const { error: diaryErr } = await supabase
    .from("diario_jornal")
    .delete()
    .eq("device_id", deviceId);

  if (diaryErr) {
    cloudErrors.push(`Diário: ${diaryErr.message}`);
  }

  const { error: progressErr } = await supabase
    .from("progresso_diario")
    .delete()
    .gte("semana", 1);

  if (progressErr) {
    cloudErrors.push(`Progresso meditação: ${progressErr.message}`);
  }

  const { data: imagens, error: imgSelectErr } = await supabase
    .from("imagens_manifestacao")
    .select("id, url_imagem");

  if (imgSelectErr) {
    cloudErrors.push(`Vision board (leitura): ${imgSelectErr.message}`);
  } else if (imagens?.length) {
    const paths = imagens
      .map((row) => {
        const m = String(row.url_imagem).match(/\/vision_board\/(.+)$/);
        return m?.[1];
      })
      .filter(Boolean) as string[];

    if (paths.length) {
      const { error: storageErr } = await supabase.storage.from("vision_board").remove(paths);
      if (storageErr) {
        cloudErrors.push(`Imagens (storage): ${storageErr.message}`);
      }
    }

    const { error: imgDelErr } = await supabase
      .from("imagens_manifestacao")
      .delete()
      .in(
        "id",
        imagens.map((r) => r.id)
      );

    if (imgDelErr) {
      cloudErrors.push(`Vision board: ${imgDelErr.message}`);
    }
  }

  localStorage.removeItem(DEVICE_KEY);

  return {
    localCleared: true,
    cloudCleared: cloudErrors.length === 0,
    cloudErrors,
  };
}

export { DEVICE_KEY };
