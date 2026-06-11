// sound-zoom-Bg.js
// Guarantees space audio starts on the very first user gesture (click or key),
// which includes the "CLICK ANYWHERE TO BEGIN" start overlay.
// Works alongside celestial.js — _startHum() is idempotent so double-calls are safe.

function startSpaceAudio() {
  const scene = document.querySelector('a-scene');
  const comp = scene?.components?.['space-audio'];
  if (comp?._startHum) comp._startHum();
}

document.addEventListener('click',   startSpaceAudio, { once: true });
document.addEventListener('keydown', startSpaceAudio, { once: true });
