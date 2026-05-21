/**
 * Placeholder audio — synthesized blips via the Web Audio API, no asset files.
 * Real sound design is swapped in at M6. The AudioContext is created lazily on
 * first use (after the player's "Start" gesture, satisfying autoplay policy).
 */

let ctx: AudioContext | undefined;

function audio(): AudioContext | undefined {
  if (typeof window === "undefined" || !window.AudioContext) return undefined;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  durationMs: number,
  type: OscillatorType,
  gain: number,
  delayMs = 0,
): void {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + delayMs / 1000;
  const end = start + durationMs / 1000;

  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0, start);
  amp.gain.linearRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(amp).connect(ac.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

function arpeggio(freqs: number[], type: OscillatorType, gain: number): void {
  freqs.forEach((f, i) => tone(f, 170, type, gain, i * 95));
}

export const sfx = {
  select: () => tone(430, 55, "sine", 0.04),
  correct: () => {
    tone(660, 90, "triangle", 0.1);
    tone(990, 150, "triangle", 0.09, 75);
  },
  wrong: () => tone(150, 240, "sawtooth", 0.1),
  breach: () => {
    tone(120, 320, "sawtooth", 0.14);
    tone(85, 380, "sawtooth", 0.12, 70);
  },
  wave: () => arpeggio([523, 659, 784], "triangle", 0.08),
  win: () => arpeggio([523, 659, 784, 1047], "triangle", 0.1),
  lose: () => arpeggio([330, 247, 165], "sawtooth", 0.11),
};
