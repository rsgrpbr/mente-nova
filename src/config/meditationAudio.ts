/**
 * URLs dos áudios de meditação por semana.
 * Defina VITE_AUDIO_SEMANA_1 … VITE_AUDIO_SEMANA_4 em .env.local
 * ou faça upload para o bucket `meditacoes` no Supabase Storage.
 */
export const MEDITATION_AUDIO_URLS: Record<number, string> = {
  1: import.meta.env.VITE_AUDIO_SEMANA_1 ?? "",
  2: import.meta.env.VITE_AUDIO_SEMANA_2 ?? "",
  3: import.meta.env.VITE_AUDIO_SEMANA_3 ?? "",
  4: import.meta.env.VITE_AUDIO_SEMANA_4 ?? "",
};

/** Fallback de demonstração quando não há URL configurada */
export const MEDITATION_AUDIO_FALLBACK =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";

export function getMeditationAudioUrl(weekNum: number): string {
  const configured = MEDITATION_AUDIO_URLS[weekNum];
  return configured?.trim() ? configured.trim() : MEDITATION_AUDIO_FALLBACK;
}

/** Áudio da sessão de visualização (Passo 7) — Semana 4 ou VITE_AUDIO_VISUALIZACAO */
export function getVisualizationAudioUrl(): string {
  const dedicated = import.meta.env.VITE_AUDIO_VISUALIZACAO?.trim();
  if (dedicated) return dedicated;
  const week4 = MEDITATION_AUDIO_URLS[4]?.trim();
  if (week4) return week4;
  return MEDITATION_AUDIO_FALLBACK;
}
