/**
 * Synthesized bell — a decaying sine "ding", optionally repeated. Web Audio is
 * used because iOS Safari blocks notification audio but allows synthesis after
 * a user gesture (starting/logging counts). Also fires a haptic where available.
 */
export function playBell(times = 1, freq = 880) {
  try {
    navigator.vibrate?.(times > 1 ? [120, 80, 120] : 120);
  } catch {
    /* noop */
  }
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const start = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const t = start + i * 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    }
    setTimeout(() => ctx.close().catch(() => {}), times * 250 + 600);
  } catch {
    /* noop */
  }
}
