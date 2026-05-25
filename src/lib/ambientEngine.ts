/**
 * Motor de ambiente: binaural, solfégio e sons de natureza (síntese Web Audio).
 */

export type AmbientPresetId =
  | "binaural-theta-432"
  | "binaural-alpha-10"
  | "binaural-delta-2"
  | "solfeggio-396"
  | "solfeggio-417"
  | "solfeggio-528"
  | "solfeggio-639"
  | "solfeggio-741"
  | "solfeggio-852"
  | "solfeggio-harmonic"
  | "nature-rain"
  | "nature-forest"
  | "nature-ocean"
  | "cosmic-hum";

type StopHandle = { stop: () => void };

let ctx: AudioContext | null = null;
let activeStop: StopHandle | null = null;
let chimeInterval: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext {
  if (!ctx || ctx.state === "closed") {
    ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function connectMaster(audioCtx: AudioContext, volume = 0.08): GainNode {
  const master = audioCtx.createGain();
  master.gain.setValueAtTime(volume, audioCtx.currentTime);
  master.connect(audioCtx.destination);
  return master;
}

function startBinaural(
  audioCtx: AudioContext,
  master: GainNode,
  carrier: number,
  beatHz: number
): OscillatorNode[] {
  const panL = audioCtx.createStereoPanner?.();
  const panR = audioCtx.createStereoPanner?.();
  if (panL) panL.pan.value = -1;
  if (panR) panR.pan.value = 1;

  const oscL = audioCtx.createOscillator();
  const oscR = audioCtx.createOscillator();
  const oscC = audioCtx.createOscillator();
  oscL.type = oscR.type = oscC.type = "sine";
  oscL.frequency.value = carrier - beatHz / 2;
  oscR.frequency.value = carrier + beatHz / 2;
  oscC.frequency.value = carrier;

  const gL = audioCtx.createGain();
  const gR = audioCtx.createGain();
  const gC = audioCtx.createGain();
  gL.gain.value = 0.45;
  gR.gain.value = 0.45;
  gC.gain.value = 0.25;

  if (panL && panR) {
    oscL.connect(gL).connect(panL).connect(master);
    oscR.connect(gR).connect(panR).connect(master);
  } else {
    oscL.connect(gL).connect(master);
    oscR.connect(gR).connect(master);
  }
  oscC.connect(gC).connect(master);
  oscL.start();
  oscR.start();
  oscC.start();
  return [oscL, oscR, oscC];
}

function startSolfeggioSingle(audioCtx: AudioContext, master: GainNode, freq: number): OscillatorNode {
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.value = 0.35;
  osc.connect(g).connect(master);
  osc.start();
  return osc;
}

function startNatureNoise(
  audioCtx: AudioContext,
  master: GainNode,
  filterFreq: number,
  q = 0.8
): AudioBufferSourceNode {
  const len = audioCtx.sampleRate * 4;
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = q;
  const g = audioCtx.createGain();
  g.gain.value = 0.4;
  src.connect(filter).connect(g).connect(master);
  src.start();
  return src;
}

export function startAmbient(preset: AmbientPresetId, volume = 0.08): void {
  stopAmbient();
  const audioCtx = getCtx();
  const master = connectMaster(audioCtx, volume);
  const oscillators: OscillatorNode[] = [];
  let bufferSource: AudioBufferSourceNode | null = null;

  switch (preset) {
    case "binaural-theta-432":
      oscillators.push(...startBinaural(audioCtx, master, 432, 6));
      break;
    case "binaural-alpha-10":
      oscillators.push(...startBinaural(audioCtx, master, 220, 10));
      break;
    case "binaural-delta-2":
      oscillators.push(...startBinaural(audioCtx, master, 200, 2));
      break;
    case "solfeggio-396":
      oscillators.push(startSolfeggioSingle(audioCtx, master, 396));
      break;
    case "solfeggio-417":
      oscillators.push(startSolfeggioSingle(audioCtx, master, 417));
      break;
    case "solfeggio-528":
      oscillators.push(startSolfeggioSingle(audioCtx, master, 528));
      break;
    case "solfeggio-639":
      oscillators.push(startSolfeggioSingle(audioCtx, master, 639));
      break;
    case "solfeggio-741":
      oscillators.push(startSolfeggioSingle(audioCtx, master, 741));
      break;
    case "solfeggio-852":
      oscillators.push(startSolfeggioSingle(audioCtx, master, 852));
      break;
    case "solfeggio-harmonic":
      [132, 264, 396, 528, 639].forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        g.gain.value = i === 2 ? 0.35 : 0.15;
        osc.connect(g).connect(master);
        osc.start();
        oscillators.push(osc);
      });
      break;
    case "nature-rain":
      bufferSource = startNatureNoise(audioCtx, master, 1200, 1.2);
      break;
    case "nature-forest":
      bufferSource = startNatureNoise(audioCtx, master, 800, 0.6);
      oscillators.push(startSolfeggioSingle(audioCtx, master, 110));
      break;
    case "nature-ocean":
      bufferSource = startNatureNoise(audioCtx, master, 400, 0.4);
      break;
    case "cosmic-hum":
      bufferSource = startNatureNoise(audioCtx, master, 180, 0.3);
      break;
    default:
      break;
  }

  activeStop = {
    stop: () => {
      oscillators.forEach((o) => {
        try {
          o.stop();
        } catch {
          /* já parado */
        }
      });
      if (bufferSource) {
        try {
          bufferSource.stop();
        } catch {
          /* */
        }
      }
      if (chimeInterval) {
        clearInterval(chimeInterval);
        chimeInterval = null;
      }
    },
  };
}

/** Camada extra de gongos tibetanos periódicos durante a prática */
export function startPeriodicGongs(intervalMs = 120000): void {
  if (chimeInterval) clearInterval(chimeInterval);
  chimeInterval = setInterval(() => {
    import("./tibetanBells").then(({ playTibetanBell }) => {
      void playTibetanBell("ombu");
    });
  }, intervalMs);
}

export function stopAmbient(): void {
  activeStop?.stop();
  activeStop = null;
  if (chimeInterval) {
    clearInterval(chimeInterval);
    chimeInterval = null;
  }
}

export function setAmbientVolume(volume: number): void {
  if (ctx && ctx.state !== "closed") {
    /* próximo start usa volume; para ajuste em tempo real seria preciso guardar master ref */
  }
  void volume;
}
