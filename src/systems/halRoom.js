let secs = 0;
setInterval(() => {
  secs++;
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  const p = n => String(n).padStart(2, '0');
  const clockDisplay = document.getElementById('clock-display');
  if (clockDisplay) {
    clockDisplay.textContent = `DAY 847 — ${p(h)}:${p(m)}:${p(s)}`;
  }
}, 1000);

const camRig = document.querySelector('#cam-rig') || document.querySelector('#camRig');
const BASE_ANGLE = -22;
const MAX_SWING  = 38;
let targetY = BASE_ANGLE;

document.addEventListener('mousemove', (e) => {
  const ratio = (e.clientX / window.innerWidth - 0.5) * 2;
  targetY = BASE_ANGLE + (-ratio * MAX_SWING);
});

function animateCam() {
  if (camRig && camRig.object3D) {
    const targetRad = THREE.MathUtils.degToRad(targetY);
    camRig.object3D.rotation.y += (targetRad - camRig.object3D.rotation.y) * 0.04;
  }
  requestAnimationFrame(animateCam);
}

const startOverlay = document.createElement('div');
startOverlay.id = 'startOverlay';
startOverlay.innerHTML = `
  <div class="hal-title">HAL 9000</div>
  <div class="deck-title">JUPITER OBSERVATION DECK</div>
  <div class="click-prompt">CLICK ANYWHERE TO BEGIN</div>
  <div class="pulse-dot"></div>`;
document.body.appendChild(startOverlay);

startOverlay.addEventListener('click', () => {
  startOverlay.remove();
  animateCam();
  
  if (typeof window.askHAL === 'function') {
    window.askHAL("hello");
  }
});