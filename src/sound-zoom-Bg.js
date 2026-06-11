// sound-zoom-Bg.js
// — Unlocks AudioContext on first gesture (backup for celestial.js autoplay)
// — Zooms the background sky sphere in/out in sync with Jupiter zoom

// ── AUDIO UNLOCK ─────────────────────────────────────────────────────────────
function unlockAudio() {
  const comp = document.querySelector('a-scene')?.components?.['space-audio'];
  if (comp?.ctx?.state === 'suspended') comp.ctx.resume();
  if (comp && !comp.ctx) {
    if (comp.data?.hum !== false) comp._startHum?.();
    else comp._createCtx?.();
  }
}
document.addEventListener('click',      unlockAudio, { once: true });
document.addEventListener('keydown',    unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

// ── BACKGROUND ZOOM ──────────────────────────────────────────────────────────
// Default Z=-140 → repeat=2.0 (wide zoomed-out panoramic view).
// As Jupiter approaches (Z→-40) the sky zooms in (repeat→0.5).
// At far (Z→-200) clamped at 2.0 — no extra tiling beyond the default.
function updateBg() {
  const sky = document.querySelector('#nebula1');
  if (!sky || typeof window.jupiterZ === 'undefined') return;
  const t = Math.max(0, (window.jupiterZ - (-140)) / (-40 - (-140)));
  const repeat = Math.max(0.5, 2.0 - t * 1.5).toFixed(3);
  sky.setAttribute('material', 'repeat', `${repeat} ${repeat}`);
}

// Update BG on scroll wheel and zoom button clicks
document.addEventListener('wheel', updateBg);
document.addEventListener('click', updateBg);

// Initialize BG repeat once the scene is ready
const scene = document.querySelector('a-scene');
if (scene) {
  if (scene.hasLoaded) {
    updateBg();
  } else {
    scene.addEventListener('loaded', updateBg, { once: true });
  }
}
