// sound-zoom-Bg.js
// — Unlocks AudioContext on first gesture (backup for celestial.js autoplay)
// — Zooms the background sky sphere in/out in sync with Jupiter zoom

// ── AUDIO UNLOCK ─────────────────────────────────────────────────────────────
function unlockAudio() {
  const comp = document.querySelector('a-scene')?.components?.['space-audio'];
  if (comp?.ctx?.state === 'suspended') comp.ctx.resume();
  // Also try _startHum in case init hasn't fired yet
  if (comp?._startHum) comp._startHum();
}
document.addEventListener('click',      unlockAudio, { once: true });
document.addEventListener('keydown',    unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

// ── BACKGROUND ZOOM ──────────────────────────────────────────────────────────
// When Jupiter comes closer the sky texture zooms in (repeat shrinks → fills more of view).
// jupiterZ range: -200 (far) to -40 (close)
document.addEventListener('wheel', () => {
  const sky = document.querySelector('#nebula1');
  if (!sky || typeof window.jupiterZ === 'undefined') return;
  const t = (window.jupiterZ - (-200)) / (-40 - (-200)); // 0 = far, 1 = close
  const repeat = (1.0 - t * 0.55).toFixed(3);            // 1.0 far → 0.45 close
  sky.setAttribute('material', 'repeat', `${repeat} ${repeat}`);
});
