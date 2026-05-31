/**
 * Upload dos 6 MP3 para Supabase Storage (bucket `meditacoes`).
 *
 * Pré-requisitos:
 * 1. .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
 * 2. Executar supabase/storage-meditacoes.sql no SQL Editor
 * 3. MP3 em public/audio/meditacao/ (correr setup-meditation-audio.ps1 se faltar)
 *
 * Uso: npm run upload-audio
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");
const audioDir = resolve(root, "public", "audio", "meditacao");
const BUCKET = "meditacoes";

const TRACKS = [
  { file: "hans-zimmer-inception-time.mp3", envKey: "VITE_AUDIO_INCEPTION" },
  { file: "einaudi-experience-live-milano.mp3", envKey: "VITE_AUDIO_EINAUDI_LIVE" },
  { file: "einaudi-experience-solo-piano.mp3", envKey: "VITE_AUDIO_EINAUDI_SOLO" },
  { file: "einaudi-tiny-desk.mp3", envKey: "VITE_AUDIO_EINAUDI_TINY_DESK" },
  { file: "passacaglia-handel-halvorsen.mp3", envKey: "VITE_AUDIO_PASSACAGLIA" },
  { file: "tony-ann-icarus.mp3", envKey: "VITE_AUDIO_ICARUS" },
];

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("Ficheiro .env.local não encontrado em:", root);
    console.error("Copie .env.example → .env.local e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
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

async function main() {
  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local");
    process.exit(1);
  }

  if (!existsSync(audioDir)) {
    console.error("Pasta não encontrada:", audioDir);
    console.error("Corra: .\\scripts\\setup-meditation-audio.ps1");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const envLines = [];
  let ok = 0;

  console.log(`A enviar ${TRACKS.length} ficheiros para bucket "${BUCKET}"...\n`);

  for (const track of TRACKS) {
    const localPath = join(audioDir, track.file);
    if (!existsSync(localPath)) {
      console.error(`[FALTA] ${track.file}`);
      continue;
    }

    const body = readFileSync(localPath);
    const { error } = await supabase.storage.from(BUCKET).upload(track.file, body, {
      contentType: "audio/mpeg",
      cacheControl: "31536000",
      upsert: true,
    });

    if (error) {
      console.error(`[ERRO] ${track.file}: ${error.message}`);
      if (error.message.includes("Bucket not found")) {
        console.error("\n→ Crie o bucket: execute supabase/storage-meditacoes.sql no SQL Editor do Supabase.\n");
      }
      if (error.message.includes("policy") || error.message.includes("row-level security")) {
        console.error("\n→ Políticas em falta: execute supabase/storage-meditacoes.sql no SQL Editor.\n");
      }
      continue;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(track.file);
    const publicUrl = data.publicUrl;
    envLines.push(`${track.envKey}=${publicUrl}`);
    console.log(`[OK] ${track.file}`);
    ok++;
  }

  console.log("\n--- Cole no .env.local e na Vercel (Environment Variables) ---\n");
  console.log(envLines.join("\n"));
  console.log("\n--- Opcional (visualização / Vision Board) ---");
  console.log(`VITE_AUDIO_VISUALIZACAO=${envLines.find((l) => l.includes("EINAUDI_SOLO"))?.split("=")[1] ?? ""}`);

  if (ok < TRACKS.length) {
    console.error(`\nConcluído com erros: ${ok}/${TRACKS.length} enviados.`);
    process.exit(1);
  }

  console.log(`\n✓ ${ok}/${TRACKS.length} áudios no Supabase. Reinicie npm run dev e faça deploy na Vercel.`);
}

main();
