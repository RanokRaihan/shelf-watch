let audio: AudioContext | null = null;

// Checkout scanners use a piezo beeper: one short, flat, high tone near its resonance.
const PITCH_HZ = 2700;
const DURATION_S = 0.1;
const EDGE_S = 0.004;
const VOLUME = 0.35;

function getAudio() {
  if (audio) return audio;
  const AudioCtx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  audio = new AudioCtx();
  return audio;
}

// iOS keeps an AudioContext suspended until it's resumed during a tap.
export function unlockBeep() {
  const ctx = getAudio();
  if (ctx?.state === "suspended") void ctx.resume().catch(() => {});
}

export async function playBeep() {
  const ctx = getAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});

  const osc = ctx.createOscillator();
  const tone = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  const t = ctx.currentTime;

  // A square wave band-passed at its own pitch gives the buzzy-but-clean piezo sound.
  osc.type = "square";
  osc.frequency.value = PITCH_HZ;
  tone.type = "bandpass";
  tone.frequency.value = PITCH_HZ;
  tone.Q.value = 4;

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(VOLUME, t + EDGE_S);
  gain.gain.setValueAtTime(VOLUME, t + DURATION_S - EDGE_S);
  gain.gain.linearRampToValueAtTime(0, t + DURATION_S);

  osc.connect(tone).connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + DURATION_S + 0.01);
}
