
// ── MOUSE LOOK — limited horizontal only ─────────────
  const camRig = document.querySelector('#camRig');
  const MAX_ANGLE = 40;
  let targetY = 0;

  document.addEventListener('mousemove', (e) => {
    const ratio = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = -ratio * MAX_ANGLE;
  });

  function animateCam() {
    if (camRig && camRig.object3D) {
      const targetRad = THREE.MathUtils.degToRad(targetY);
      camRig.object3D.rotation.y += (targetRad - camRig.object3D.rotation.y) * 0.04;
    }
    requestAnimationFrame(animateCam);
  }

  // ── HAL SPEECH ───────────────────────────────────────
  let halHasSpoken = false;

  function speakHAL(text) {
    const eye = document.querySelector('#hal-eye');
    if (eye) {
      eye.setAttribute('color', '#FF5555');
      eye.setAttribute('animation__talk',
      'property: scale; from:1 1 1; to:1.25 1.25 1.25; dir:alternate; loop:true; dur:220');
      eye.setAttribute('animation',
        'property:emissive-intensity;from:4;to:1;dir:alternate;loop:true;dur:250;easing:easeInOutSine');
    }
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US';
    speech.rate = 0.75;
    speech.pitch = 0.55;
    speech.volume = 1;
    speech.onend = () => {
      if (eye) {
        eye.removeAttribute('animation');
        eye.removeAttribute('animation__talk');
        eye.object3D.scale.set(1,1,1);
        eye.setAttribute('animation',
          'property:emissive-intensity;from:3;to:0.7;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
      }
      setTimeout(() => {
        document.getElementById('hal-popup').style.display = 'block';
        document.getElementById('hal-overlay').style.display = 'block';
      }, 1500);
    };
    speechSynthesis.speak(speech);
  }

  const HAL_GREETING =
   "I have studied Jupiter for 847 days. I still find its scale difficult to comprehend."

  // Start overlay
  const startOverlay = document.createElement('div');
  startOverlay.id = 'startOverlay';
  startOverlay.innerHTML = `
    <div class="hal-title">HAL 9000</div>
    <div class="deck-title">JUPITER OBSERVATION DECK</div>
    <div class="click-prompt">CLICK ANYWHERE TO BEGIN</div>
    <div class="pulse-dot"></div>`;

  // inline styles since CSS is in separate file
  Object.assign(startOverlay.style, {
    position: 'fixed', inset: '0', zIndex: '999999',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.9)', cursor: 'pointer',
    fontFamily: "'Courier New', monospace"
  });
  startOverlay.querySelector('.hal-title') && null;
  document.body.appendChild(startOverlay);

  // style children
  const st = document.getElementById('startOverlay');
  st.children[0].style.cssText = 'color:#FF0000;font-size:13px;letter-spacing:0.4em;margin-bottom:18px;';
  st.children[1].style.cssText = 'color:#fff;font-size:22px;letter-spacing:0.15em;margin-bottom:10px;';
  st.children[2].style.cssText = 'color:rgba(255,255,255,0.45);font-size:12px;letter-spacing:0.2em;margin-top:24px;';
  st.children[3].style.cssText = 'margin-top:30px;width:10px;height:10px;border-radius:50%;background:#FF0000;box-shadow:0 0 18px #FF0000;animation:pulse 1.5s ease-in-out infinite;';

  // add pulse keyframes
  const style = document.createElement('style');
  style.textContent = '@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.7)}}';
  document.head.appendChild(style);

  startOverlay.addEventListener('click', () => {
    startOverlay.remove();
    document.querySelector('a-scene').addEventListener('loaded', () => { animateCam(); });
    if (document.querySelector('a-scene').hasLoaded) animateCam();
    if (!halHasSpoken) {
      halHasSpoken = true;
      setTimeout(() => speakHAL(HAL_GREETING), 800);
    }
  });

  document.querySelector('a-scene').addEventListener('loaded', () => {
    if (!startOverlay.parentNode) animateCam();
  });

  document.getElementById('learnMoreBtn').addEventListener('click', () => {
    speechSynthesis.cancel();
    halHasSpoken = true;
    setTimeout(() => speakHAL(HAL_GREETING), 300);
  });

  document.getElementById('closePopup').addEventListener('click', () => {
    document.getElementById('hal-popup').style.display = 'none';
    document.getElementById('hal-overlay').style.display = 'none';
  });

  document.getElementById('enterHAL').addEventListener('click', () => {
    window.location.href = './sceneHall.html';
  });

  // zoom with scroll
  let jupiterZ = -70;
  document.addEventListener('wheel', (e) => {
    const jupiter = document.querySelector('#jupiter');
    jupiterZ += e.deltaY > 0 ? 10 : -10;
    jupiterZ = Math.max(-200, Math.min(-60, jupiterZ));
    jupiter.setAttribute('position', `-2 3.8 ${jupiterZ}`);
  });

 