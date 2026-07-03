let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playHitSound(): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.setValueAtTime(660, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, c.currentTime + 0.06);
    gain.gain.setValueAtTime(0.25, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.12);
  } catch {
    /* audio not available */
  }
}

export function playMissSound(): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.setValueAtTime(150, c.currentTime);
    gain.gain.setValueAtTime(0.15, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.18);
  } catch {
    /* audio not available */
  }
}

export function playCompleteSound(): void {
  try {
    const c = getCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(c.destination);
      const t = c.currentTime + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  } catch {
    /* audio not available */
  }
}

export function playAbilitySound(soundUrl: string): void {
  try {
    const a = new Audio(soundUrl);
    a.volume = 0.25;
    a.play().catch(() => {});
  } catch {
    /* audio not available */
  }
}
