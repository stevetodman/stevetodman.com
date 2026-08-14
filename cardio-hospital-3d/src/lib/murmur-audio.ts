export type MurmurPattern =
  | "none"
  | "stills"
  | "hcm"
  | "vsd"
  | "pulmonary-flow"
  | "aortic-stenosis"
  | "pda"
  | "myocarditis";

export interface MurmurConfig {
  pattern: MurmurPattern;
  heartRate: number;
  valsalva?: boolean;
}

export type AuscultationSite = "RUSB" | "LUSB" | "LLSB" | "Apex";

const SITE_INTENSITY: Record<MurmurPattern, Record<AuscultationSite, number>> = {
  none: { RUSB: 0, LUSB: 0, LLSB: 0, Apex: 0 },
  stills: { RUSB: 0.1, LUSB: 0.35, LLSB: 0.9, Apex: 0.6 },
  hcm: { RUSB: 0.15, LUSB: 0.45, LLSB: 1, Apex: 0.55 },
  vsd: { RUSB: 0.05, LUSB: 0.3, LLSB: 1, Apex: 0.45 },
  "pulmonary-flow": { RUSB: 0.15, LUSB: 0.9, LLSB: 0.35, Apex: 0.1 },
  "aortic-stenosis": { RUSB: 1, LUSB: 0.5, LLSB: 0.3, Apex: 0.35 },
  pda: { RUSB: 0.2, LUSB: 0.9, LLSB: 0.35, Apex: 0.1 },
  myocarditis: { RUSB: 0.05, LUSB: 0.15, LLSB: 0.35, Apex: 0.85 },
};

interface Session {
  ctx: AudioContext;
  master: GainNode;
  timer: number | null;
  cfg: MurmurConfig;
  site: AuscultationSite;
}

let session: Session | null = null;

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const length = Math.floor(duration * ctx.sampleRate);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * 0.85;
  }
  return buffer;
}

function scheduleThump(ctx: AudioContext, dest: GainNode, at: number, frequency: number, intensity: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, at + 0.09);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(intensity, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
  oscillator.connect(gain).connect(dest);
  oscillator.start(at);
  oscillator.stop(at + 0.15);
}

type MurmurShape = "holosystolic" | "crescendo-decrescendo" | "early-systolic" | "continuous";

function scheduleMurmurBurst(
  ctx: AudioContext,
  dest: GainNode,
  startAt: number,
  duration: number,
  intensity: number,
  shape: MurmurShape,
  hiPass: number,
  loPass: number,
) {
  if (intensity <= 0.001) return;
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, Math.max(0.05, duration + 0.05));

  const highPass = ctx.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = hiPass;
  const lowPass = ctx.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = loPass;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startAt);

  const peak = intensity * 0.35;
  const end = startAt + duration;
  if (shape === "holosystolic") {
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.03);
    gain.gain.linearRampToValueAtTime(peak * 0.9, end - 0.03);
    gain.gain.linearRampToValueAtTime(0, end);
  } else if (shape === "crescendo-decrescendo") {
    gain.gain.linearRampToValueAtTime(peak, startAt + duration * 0.55);
    gain.gain.linearRampToValueAtTime(0, end);
  } else if (shape === "early-systolic") {
    gain.gain.linearRampToValueAtTime(peak, startAt + duration * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
  } else {
    gain.gain.linearRampToValueAtTime(peak, startAt + 0.05);
    gain.gain.linearRampToValueAtTime(peak * 0.85, end - 0.05);
    gain.gain.linearRampToValueAtTime(0, end);
  }

  noise.connect(highPass).connect(lowPass).connect(gain).connect(dest);
  noise.start(startAt);
  noise.stop(end + 0.05);
}

function scheduleBeat(active: Session, startAt: number) {
  const { ctx, master, cfg, site } = active;
  const beatSec = 60 / Math.max(30, cfg.heartRate);
  const systoleEnd = startAt + beatSec * 0.4;
  const baseIntensity = SITE_INTENSITY[cfg.pattern][site];
  const valsalvaBoost = cfg.valsalva && (cfg.pattern === "hcm" || cfg.pattern === "stills")
    ? cfg.pattern === "hcm" ? 1.5 : 0.6
    : 1;
  const intensity = Math.min(1, baseIntensity * valsalvaBoost);

  scheduleThump(ctx, master, startAt, 60, 0.35 + intensity * 0.15);
  scheduleThump(ctx, master, systoleEnd, 80, 0.28 + intensity * 0.1);

  switch (cfg.pattern) {
    case "stills":
      scheduleMurmurBurst(ctx, master, startAt + 0.05, beatSec * 0.32, intensity, "crescendo-decrescendo", 90, 260);
      break;
    case "hcm":
      scheduleMurmurBurst(ctx, master, startAt + 0.05, beatSec * 0.34, intensity, "crescendo-decrescendo", 150, 900);
      break;
    case "vsd":
      scheduleMurmurBurst(ctx, master, startAt + 0.04, beatSec * 0.38, intensity, "holosystolic", 200, 1400);
      break;
    case "pulmonary-flow":
      scheduleMurmurBurst(ctx, master, startAt + 0.06, beatSec * 0.28, intensity, "early-systolic", 120, 700);
      break;
    case "aortic-stenosis":
      scheduleMurmurBurst(ctx, master, startAt + 0.05, beatSec * 0.34, intensity, "crescendo-decrescendo", 180, 1600);
      break;
    case "pda":
      scheduleMurmurBurst(ctx, master, startAt + 0.02, beatSec * 0.9, intensity, "continuous", 200, 1600);
      break;
    case "myocarditis":
      scheduleMurmurBurst(ctx, master, startAt + 0.04, beatSec * 0.36, intensity * 0.7, "holosystolic", 150, 900);
      scheduleThump(ctx, master, systoleEnd + beatSec * 0.15, 45, 0.25 + intensity * 0.15);
      break;
    default:
      break;
  }
}

export function startMurmur(cfg: MurmurConfig, site: AuscultationSite) {
  stopMurmur();
  if (typeof window === "undefined") return;
  const audioWindow = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextConstructor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
  if (!AudioContextConstructor) return;

  const ctx: AudioContext = new AudioContextConstructor();
  const master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);

  const active: Session = { ctx, master, timer: null, cfg, site };
  session = active;
  const beatSec = 60 / Math.max(30, cfg.heartRate);
  let nextAt = ctx.currentTime + 0.05;

  const tick = () => {
    if (!session || session !== active) return;
    while (nextAt < ctx.currentTime + 0.8) {
      scheduleBeat(active, nextAt);
      nextAt += beatSec;
    }
    active.timer = window.setTimeout(tick, 250);
  };
  tick();
}

export function updateSite(site: AuscultationSite) {
  if (session) session.site = site;
}

export function updateValsalva(valsalva: boolean) {
  if (session) session.cfg = { ...session.cfg, valsalva };
}

export function stopMurmur() {
  if (!session) return;
  const active = session;
  session = null;
  if (active.timer != null) window.clearTimeout(active.timer);
  try {
    active.master.gain.setValueAtTime(active.master.gain.value, active.ctx.currentTime);
    active.master.gain.linearRampToValueAtTime(0, active.ctx.currentTime + 0.15);
    window.setTimeout(() => {
      try {
        void active.ctx.close();
      } catch {
        // ignore
      }
    }, 300);
  } catch {
    try {
      void active.ctx.close();
    } catch {
      // ignore
    }
  }
}

export function murmurPatternForCase(caseId: string): MurmurPattern {
  switch (caseId) {
    case "case-hcm": return "hcm";
    case "case-innocent-murmur": return "stills";
    case "case-myocarditis": return "myocarditis";
    default: return "none";
  }
}
