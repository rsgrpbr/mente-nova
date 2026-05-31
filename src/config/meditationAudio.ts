/**
 * Catálogo de áudios para meditação — escolha livre no player.
 * Ficheiros locais em public/audio/meditacao/ (servidos em /audio/meditacao/…).
 * Override opcional: VITE_MEDITATION_TRACKS (JSON) no .env.local.
 */

export interface MeditationTrack {
  id: string;
  label: string;
  description: string;
  url: string;
  /** Duração sugerida ao selecionar a faixa (minutos) */
  durationMin?: number;
}

/** Fallback se a faixa não existir */
export const MEDITATION_AUDIO_FALLBACK =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";

const env = import.meta.env;
const AUDIO = (file: string) => `/audio/meditacao/${file}`;

function envUrl(key: string): string {
  const v = env[key as keyof ImportMetaEnv];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

/** URL da faixa: env (Supabase) → ficheiro local só em dev */
function trackUrl(envKey: keyof ImportMetaEnv, file: string): string {
  const fromEnv = envUrl(envKey as string);
  if (fromEnv) return fromEnv;
  if (!import.meta.env.PROD) return AUDIO(file);
  return "";
}

/** Catálogo principal — os teus áudios de meditação */
const BUILTIN_TRACKS: MeditationTrack[] = [
  {
    id: "hans-zimmer-inception-time",
    label: "Inception Time",
    description: "Hans Zimmer — versão orquestral",
    url: trackUrl("VITE_AUDIO_INCEPTION", "hans-zimmer-inception-time.mp3"),
    durationMin: 20,
  },
  {
    id: "einaudi-experience-live-milano",
    label: "Experience (Milano)",
    description: "Ludovico Einaudi — ao vivo no Teatro dal Verme",
    url: trackUrl("VITE_AUDIO_EINAUDI_LIVE", "einaudi-experience-live-milano.mp3"),
    durationMin: 20,
  },
  {
    id: "einaudi-experience-solo-piano",
    label: "Experience (Piano solo)",
    description: "Ludovico Einaudi — performance solo",
    url: trackUrl("VITE_AUDIO_EINAUDI_SOLO", "einaudi-experience-solo-piano.mp3"),
    durationMin: 20,
  },
  {
    id: "einaudi-tiny-desk",
    label: "Tiny Desk Concert",
    description: "Ludovico Einaudi — NPR Music",
    url: trackUrl("VITE_AUDIO_EINAUDI_TINY_DESK", "einaudi-tiny-desk.mp3"),
    durationMin: 25,
  },
  {
    id: "passacaglia-handel-halvorsen",
    label: "Passacaglia",
    description: "Handel / Halvorsen — piano relaxante",
    url: trackUrl("VITE_AUDIO_PASSACAGLIA", "passacaglia-handel-halvorsen.mp3"),
    durationMin: 20,
  },
  {
    id: "tony-ann-icarus",
    label: "ICARUS",
    description: "Tony Ann",
    url: trackUrl("VITE_AUDIO_ICARUS", "tony-ann-icarus.mp3"),
    durationMin: 20,
  },
];

function parseTracksFromEnv(): MeditationTrack[] | null {
  const raw = env.VITE_MEDITATION_TRACKS?.trim();
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const tracks: MeditationTrack[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id.trim() : "";
      const label = typeof row.label === "string" ? row.label.trim() : "";
      const url = typeof row.url === "string" ? row.url.trim() : "";
      if (!id || !label || !url) continue;
      tracks.push({
        id,
        label,
        description: typeof row.description === "string" ? row.description : "",
        url,
        durationMin:
          typeof row.durationMin === "number" && row.durationMin > 0
            ? row.durationMin
            : undefined,
      });
    }
    return tracks.length > 0 ? tracks : null;
  } catch {
    console.warn("[meditationAudio] VITE_MEDITATION_TRACKS inválido — usando catálogo padrão.");
    return null;
  }
}

export function getMeditationTracks(): MeditationTrack[] {
  return parseTracksFromEnv() ?? BUILTIN_TRACKS;
}

export function getAvailableMeditationTracks(): MeditationTrack[] {
  const tracks = getMeditationTracks();
  const withUrl = tracks.filter((t) => t.url.length > 0);
  return withUrl.length > 0 ? withUrl : tracks;
}

export function getMeditationTrackById(id: string): MeditationTrack | undefined {
  return getMeditationTracks().find((t) => t.id === id);
}

export function getMeditationTrackUrl(id: string): string {
  const track = getMeditationTrackById(id);
  return track?.url.trim() ? track.url.trim() : MEDITATION_AUDIO_FALLBACK;
}

/** @deprecated Use getMeditationTrackUrl */
export function getMeditationAudioUrl(weekNum: number): string {
  const ids = BUILTIN_TRACKS.map((t) => t.id);
  const id = ids[weekNum - 1];
  return id ? getMeditationTrackUrl(id) : MEDITATION_AUDIO_FALLBACK;
}

export function getVisualizationAudioUrl(): string {
  const dedicated = envUrl("VITE_AUDIO_VISUALIZACAO");
  if (dedicated) return dedicated;
  return getMeditationTrackUrl("einaudi-experience-solo-piano");
}
