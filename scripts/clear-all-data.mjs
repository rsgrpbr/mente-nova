/**
 * Uso único: limpa Supabase (diário, progresso, vision board).
 * node scripts/clear-all-data.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("Ficheiro .env.local não encontrado em:", root);
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const errors = [];

async function main() {
  console.log("A limpar dados no Supabase...\n");

  const { error: d1 } = await supabase.from("diario_jornal").delete().neq("device_id", "");
  if (d1) errors.push(`diario_jornal: ${d1.message}`);
  else console.log("✓ diario_jornal");

  const { error: d2 } = await supabase.from("progresso_diario").delete().gte("semana", 1);
  if (d2) errors.push(`progresso_diario: ${d2.message}`);
  else console.log("✓ progresso_diario");

  const { data: imgs } = await supabase.from("imagens_manifestacao").select("id, url_imagem");
  if (imgs?.length) {
    const paths = imgs
      .map((r) => String(r.url_imagem).match(/\/vision_board\/(.+)$/)?.[1])
      .filter(Boolean);
    if (paths.length) {
      const { error: st } = await supabase.storage.from("vision_board").remove(paths);
      if (st) errors.push(`storage: ${st.message}`);
      else console.log(`✓ storage (${paths.length} ficheiros)`);
    }
    const { error: d3 } = await supabase.from("imagens_manifestacao").delete().in("id", imgs.map((i) => i.id));
    if (d3) errors.push(`imagens_manifestacao: ${d3.message}`);
    else console.log("✓ imagens_manifestacao");
  } else {
    console.log("✓ imagens_manifestacao (vazio)");
  }

  if (errors.length) {
    console.error("\nErros (execute políticas DELETE em supabase/schema.sql):\n", errors.join("\n"));
    process.exit(1);
  }

  console.log("\nNuvem limpa. No telemóvel/PC: limpa dados do site do browser (ver instruções no README) ou abre a app em janela anónima.");
}

main();
