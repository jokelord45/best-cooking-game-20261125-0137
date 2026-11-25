// All sound is synthesised with WebAudio: short oscillator blips and filtered noise, no files.
// The context is created lazily on the first user gesture so browsers allow it.
let ctx = null;
let muted = false;

function audio() {
  if (ctx === null) {
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type, vol, when = 0) {
  const ac = audio();
  if (!ac || muted) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, vol, freq) {
  const ac = audio();
  if (!ac || muted) return;
  const t0 = ac.currentTime;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  unlock() { audio(); },
  toggleMute() { muted = !muted; return muted; },
  isMuted() { return muted; },
  pickup() { tone(520, 0.08, 'sine', 0.12); },
  place() { tone(330, 0.08, 'triangle', 0.12); },
  chop() { noise(0.09, 0.25, 1800); tone(180, 0.06, 'square', 0.06); },
  chopDone() { tone(660, 0.1, 'sine', 0.14); tone(880, 0.12, 'sine', 0.12, 0.08); },
  sizzle() { noise(0.25, 0.12, 3200); },
  cooked() { tone(740, 0.1, 'sine', 0.14); tone(990, 0.14, 'sine', 0.12, 0.09); },
  burnt() { tone(220, 0.25, 'sawtooth', 0.1); tone(160, 0.3, 'sawtooth', 0.08, 0.12); },
  serve() { tone(523, 0.12, 'sine', 0.16); tone(659, 0.12, 'sine', 0.16, 0.1); tone(784, 0.2, 'sine', 0.16, 0.2); },
  error() { tone(140, 0.18, 'square', 0.1); },
  expire() { tone(392, 0.15, 'triangle', 0.12); tone(311, 0.25, 'triangle', 0.12, 0.14); },
  tick() { tone(880, 0.05, 'sine', 0.08); },
  start() { tone(392, 0.1, 'sine', 0.14); tone(523, 0.1, 'sine', 0.14, 0.09); tone(659, 0.18, 'sine', 0.14, 0.18); },
  gameOver() { tone(523, 0.2, 'sine', 0.14); tone(440, 0.2, 'sine', 0.14, 0.18); tone(349, 0.35, 'sine', 0.14, 0.36); },
};
