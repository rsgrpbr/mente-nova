import type { AmbientPresetId } from "../lib/ambientEngine";

export type SoundscapeCategory = "guiada" | "frequencias" | "solfeggio" | "natureza" | "hibrido";

export type SoundscapeEngine = "guided-mp3" | "ambient" | "stream" | "guided-plus-ambient";

export interface SoundscapeOption {
  id: string;
  label: string;
  description: string;
  category: SoundscapeCategory;
  engine: SoundscapeEngine;
  /** Preset Web Audio (frequências / solfégio / natureza sintética) */
  ambientPreset?: AmbientPresetId;
  /** URL de loop (natureza real ou faixa externa) — VITE_SOUND_* ou Supabase */
  streamUrl?: string;
  /** Camada ambiente por baixo da voz guiada */
  ambientUnderlay?: AmbientPresetId;
  ambientVolume?: number;
}

const env = import.meta.env;

function envUrl(key: string): string | undefined {
  const v = env[key as keyof ImportMetaEnv];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Catálogo completo — adicione MP3 no Supabase e ligue via .env.local */
export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  {
    id: "guided-week",
    label: "Meditação guiada (MP3)",
    description: "Narração do catálogo — escolha a faixa abaixo",
    category: "guiada",
    engine: "guided-mp3",
  },
  {
    id: "guided-binaural-theta",
    label: "Guiada + Binaural Theta 432Hz",
    description: "Voz guiada com batida theta de fundo",
    category: "hibrido",
    engine: "guided-plus-ambient",
    ambientUnderlay: "binaural-theta-432",
    ambientVolume: 0.06,
  },
  {
    id: "guided-solfeggio-528",
    label: "Guiada + Solfégio 528Hz",
    description: "Voz guiada com frequência de regeneração",
    category: "hibrido",
    engine: "guided-plus-ambient",
    ambientUnderlay: "solfeggio-528",
    ambientVolume: 0.07,
  },

  // --- Frequências / binaural ---
  {
    id: "binaural-theta-432",
    label: "Binaural Theta 6Hz · portador 432Hz",
    description: "Relaxamento profundo e estado meditativo",
    category: "frequencias",
    engine: "ambient",
    ambientPreset: "binaural-theta-432",
  },
  {
    id: "binaural-alpha-10",
    label: "Binaural Alpha 10Hz",
    description: "Calma alerta e foco consciente",
    category: "frequencias",
    engine: "ambient",
    ambientPreset: "binaural-alpha-10",
  },
  {
    id: "binaural-delta-2",
    label: "Binaural Delta 2Hz",
    description: "Indução corpórea e sonolência meditativa",
    category: "frequencias",
    engine: "ambient",
    ambientPreset: "binaural-delta-2",
  },

  // --- Solfégio ---
  {
    id: "solfeggio-396",
    label: "Solfégio 396 Hz",
    description: "Libertação de culpa e medo",
    category: "solfeggio",
    engine: "ambient",
    ambientPreset: "solfeggio-396",
  },
  {
    id: "solfeggio-417",
    label: "Solfégio 417 Hz",
    description: "Facilitar mudança e desbloqueio",
    category: "solfeggio",
    engine: "ambient",
    ambientPreset: "solfeggio-417",
  },
  {
    id: "solfeggio-528",
    label: "Solfégio 528 Hz",
    description: "Transformação e reparação (Love frequency)",
    category: "solfeggio",
    engine: "ambient",
    ambientPreset: "solfeggio-528",
  },
  {
    id: "solfeggio-639",
    label: "Solfégio 639 Hz",
    description: "Conexão e relacionamentos",
    category: "solfeggio",
    engine: "ambient",
    ambientPreset: "solfeggio-639",
  },
  {
    id: "solfeggio-741",
    label: "Solfégio 741 Hz",
    description: "Expressão e soluções criativas",
    category: "solfeggio",
    engine: "ambient",
    ambientPreset: "solfeggio-741",
  },
  {
    id: "solfeggio-852",
    label: "Solfégio 852 Hz",
    description: "Despertar espiritual e intuição",
    category: "solfeggio",
    engine: "ambient",
    ambientPreset: "solfeggio-852",
  },
  {
    id: "solfeggio-harmonic",
    label: "Solfégio harmónico (acorde)",
    description: "Várias frequências em camadas",
    category: "solfeggio",
    engine: "ambient",
    ambientPreset: "solfeggio-harmonic",
  },

  // --- Natureza (síntese ou URL customizada) ---
  {
    id: "nature-rain",
    label: "Chuva",
    description: "Ruído filtrado — chuva suave",
    category: "natureza",
    engine: envUrl("VITE_SOUND_CHUVA") ? "stream" : "ambient",
    ambientPreset: "nature-rain",
    streamUrl: envUrl("VITE_SOUND_CHUVA"),
  },
  {
    id: "nature-forest",
    label: "Floresta",
    description: "Ambiente de bosque e pássaros (sintético ou MP3)",
    category: "natureza",
    engine: envUrl("VITE_SOUND_FLORESTA") ? "stream" : "ambient",
    ambientPreset: "nature-forest",
    streamUrl: envUrl("VITE_SOUND_FLORESTA"),
  },
  {
    id: "nature-ocean",
    label: "Oceano",
    description: "Ondas graves e hum oceânico",
    category: "natureza",
    engine: envUrl("VITE_SOUND_OCEANO") ? "stream" : "ambient",
    ambientPreset: "nature-ocean",
    streamUrl: envUrl("VITE_SOUND_OCEANO"),
  },
  {
    id: "cosmic-hum",
    label: "Silêncio quântico / Hum cósmico",
    description: "Ruído de baixa frequência para dissociação",
    category: "natureza",
    engine: "ambient",
    ambientPreset: "cosmic-hum",
  },
];

export const SOUNDSCAPE_CATEGORIES: { id: SoundscapeCategory; label: string }[] = [
  { id: "guiada", label: "Guiada" },
  { id: "hibrido", label: "Guiada + frequência" },
  { id: "frequencias", label: "Frequências" },
  { id: "solfeggio", label: "Solfégio" },
  { id: "natureza", label: "Natureza" },
];

export function getSoundscapeById(id: string): SoundscapeOption {
  return SOUNDSCAPE_OPTIONS.find((s) => s.id === id) ?? SOUNDSCAPE_OPTIONS[0];
}

export const TIBETAN_BELL_OPTIONS = [
  { id: "ombu" as const, label: "Ombu", desc: "Taça grande — tom grave, sustain longo" },
  { id: "kangsegengze" as const, label: "Kangsegengze", desc: "Taça cristalina — tom agudo e brilhante" },
  { id: "sequence" as const, label: "Ombu → Kangsegengze", desc: "Sequência clássica de transição" },
];
