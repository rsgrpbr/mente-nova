import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Mente Nova] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos. Configure .env.local na raiz do projeto."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? ""
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
