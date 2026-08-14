const SITE_INTENSITY = { RUSB: 0.15, LUSB: 0.45, LLSB: 1, Apex: 0.55 };

let session = null;

function noiseBuffer(ctx, duration) {
  const length = Math.floor(duration * ctx.sampleRate);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.82 + white * 0.18;
    data[i] = previous * 1.8;
  }
  return buffer;
}

function thump(ctx, destination, at, frequency, gainValue) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, at + 0.09);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(gainValue, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
  oscillator.connect(gain).connect(destination);
  oscillator.start(at);
  oscillator.stop(at + 0.15);
}

function murmur(ctx, destination, at, duration, intensity) {
  if (intensity < 0.01) return;
  const source = ctx.createBufferSource();
  const highPass = ctx.createBiquadFilter();
  const lowPass = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = noiseBuffer(ctx, duration + 0.05);
  highPass.type = "highpass";
  highPass.frequency.value = 150;
  lowPass.type = "lowpass";
  lowPass.frequency.value = 900;
  const peakAt = at + duration * 0.55;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, intensity * 0.3), peakAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(highPass).connect(lowPass).connect(gain).connect(destination);
  source.start(at);
  source.stop(at + duration + 0.05);
}

function scheduleBeat(active, at) {
  const beatSeconds = 60 / active.heartRate;
  const systoleEnd = at + beatSeconds * 0.4;
  const siteIntensity = SITE_INTENSITY[active.site] ?? 0;
  const maneuverMultiplier = active.valsalva ? 1.5 : 1;
  const intensity = Math.min(1, siteIntensity * maneuverMultiplier);
  thump(active.ctx, active.master, at, 60, 0.3 + intensity * 0.12);
  thump(active.ctx, active.master, systoleEnd, 80, 0.24 + intensity * 0.08);
  murmur(active.ctx, active.master, at + 0.05, beatSeconds * 0.34, intensity);
}

export function audioSupported() {
  return typeof window !== "undefined" && Boolean(window.AudioContext || window.webkitAudioContext);
}

export async function startHcmMurmur(site = "LLSB", valsalva = false) {
  stopHcmMurmur();
  if (!audioSupported()) return false;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContextConstructor();
  await ctx.resume();
  const master = ctx.createGain();
  master.gain.value = 0.72;
  master.connect(ctx.destination);
  const active = { ctx, master, site, valsalva, heartRate: 68, timer: null, nextAt: ctx.currentTime + 0.05 };
  session = active;
  const tick = () => {
    if (session !== active) return;
    while (active.nextAt < ctx.currentTime + 0.7) {
      scheduleBeat(active, active.nextAt);
      active.nextAt += 60 / active.heartRate;
    }
    active.timer = window.setTimeout(tick, 220);
  };
  tick();
  return true;
}

export function updateHcmSite(site) {
  if (session) session.site = site;
}

export function updateHcmValsalva(valsalva) {
  if (session) session.valsalva = valsalva;
}

export function stopHcmMurmur() {
  if (!session) return;
  const active = session;
  session = null;
  if (active.timer !== null) window.clearTimeout(active.timer);
  try {
    active.master.gain.cancelScheduledValues(active.ctx.currentTime);
    active.master.gain.setValueAtTime(active.master.gain.value, active.ctx.currentTime);
    active.master.gain.linearRampToValueAtTime(0, active.ctx.currentTime + 0.12);
    window.setTimeout(() => active.ctx.close().catch(() => {}), 180);
  } catch {
    active.ctx.close().catch(() => {});
  }
}
