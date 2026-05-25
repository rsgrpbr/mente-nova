/**
 * Sinos tibetanos sintetizados (Ombu — grave/longevo; Kangsegengze — agudo/brilhante).
 * Opcional: URLs de amostras reais em VITE_BELL_OMBU_URL / VITE_BELL_KANGSEGENGZE_URL
 */

export type TibetanBellId = "ombu" | "kangsegengze" | "sequence";

const BELL_SAMPLE_URLS: Record<"ombu" | "kangsegengze", string | undefined> = {
  ombu: import.meta.env.VITE_BELL_OMBU_URL?.trim() || undefined,
  kangsegengze: import.meta.env.VITE_BELL_KANGSEGENGZE_URL?.trim() || undefined,
};

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (sharedCtx.state === "suspended") {
    void sharedCtx.resume();
  }
  return sharedCtx;
}

async function playSample(url: string, volume = 0.7): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = new Audio(url);
    el.volume = volume;
    el.onended = () => resolve();
    el.onerror = () => reject(new Error("Falha ao carregar amostra do sino"));
    void el.play().catch(reject);
  });
}

/** Ombu: taça grande — fundamental grave, harmónicos quentes, decay longo */
function synthesizeOmbu(ctx: AudioContext, startAt: number, master: GainNode) {
  const partials = [
    { freq: 136.1, gain: 1.0 },
    { freq: 272.2, gain: 0.45 },
    { freq: 408.3, gain: 0.22 },
    { freq: 544.4, gain: 0.1 },
  ];

  partials.forEach(({ freq, gain }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, startAt);
    g.gain.setValueAtTime(0, startAt);
    g.gain.linearRampToValueAtTime(gain * 0.12, startAt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + 5.5);
    osc.connect(g).connect(master);
    osc.start(startAt);
    osc.stop(startAt + 5.6);
  });
}

/** Kangsegengze: taça cristalina — tom agudo, ataque brilhante, decay médio */
function synthesizeKangsegengze(ctx: AudioContext, startAt: number, master: GainNode) {
  const partials = [
    { freq: 523.25, gain: 1.0 },
    { freq: 1046.5, gain: 0.55 },
    { freq: 1567.98, gain: 0.28 },
    { freq: 2093.0, gain: 0.12 },
  ];

  partials.forEach(({ freq, gain }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, startAt);
    g.gain.setValueAtTime(0, startAt);
    g.gain.linearRampToValueAtTime(gain * 0.1, startAt + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, startAt + 3.8);
    osc.connect(g).connect(master);
    osc.start(startAt);
    osc.stop(startAt + 4);
  });
}

export async function playTibetanBell(bell: TibetanBellId): Promise<void> {
  if (bell === "sequence") {
    await playTibetanBell("ombu");
    await new Promise((r) => setTimeout(r, 400));
    await playTibetanBell("kangsegengze");
    return;
  }

  const sampleUrl = BELL_SAMPLE_URLS[bell];
  if (sampleUrl) {
    try {
      await playSample(sampleUrl);
      return;
    } catch {
      console.warn(`[Bells] Amostra ${bell} indisponível, a usar síntese.`);
    }
  }

  const ctx = getCtx();
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.85, t);
  master.connect(ctx.destination);

  if (bell === "ombu") synthesizeOmbu(ctx, t, master);
  else synthesizeKangsegengze(ctx, t, master);

  await new Promise((r) => setTimeout(r, bell === "ombu" ? 5600 : 4000));
}
