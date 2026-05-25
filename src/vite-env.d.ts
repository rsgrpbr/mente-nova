/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_AUDIO_SEMANA_1?: string;
  readonly VITE_AUDIO_SEMANA_2?: string;
  readonly VITE_AUDIO_SEMANA_3?: string;
  readonly VITE_AUDIO_SEMANA_4?: string;
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
