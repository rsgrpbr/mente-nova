/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** JSON array: [{ "id","label","description","url","durationMin?" }] */
  readonly VITE_MEDITATION_TRACKS?: string;
  readonly VITE_AUDIO_INCEPTION?: string;
  readonly VITE_AUDIO_EINAUDI_LIVE?: string;
  readonly VITE_AUDIO_EINAUDI_SOLO?: string;
  readonly VITE_AUDIO_EINAUDI_TINY_DESK?: string;
  readonly VITE_AUDIO_PASSACAGLIA?: string;
  readonly VITE_AUDIO_ICARUS?: string;
  readonly VITE_AUDIO_VISUALIZACAO?: string;
  readonly VITE_BELL_OMBU_URL?: string;
  readonly VITE_BELL_KANGSEGENGZE_URL?: string;
  readonly VITE_SOUND_CHUVA?: string;
  readonly VITE_SOUND_FLORESTA?: string;
  readonly VITE_SOUND_OCEANO?: string;
  readonly VITE_GEMINI_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
