  const camRig = document.querySelector('#camRig');
  const MAX_ANGLE = 40;
  let targetY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let startAngle = 0;

  document.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    startAngle = targetY;
    document.body.style.cursor = 'grabbing';
  });
  document.addEventListener('mouseup', () => { isDragging = false; document.body.style.cursor = 'default'; });
  document.addEventListener('mouseleave', () => { isDragging = false; document.body.style.cursor = 'default'; });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const ratio = dx / window.innerWidth;
    targetY = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, startAngle + (-ratio * MAX_ANGLE * 1.5)));
  });

  function animateCam() {
    if (camRig && camRig.object3D) {
      const targetRad = THREE.MathUtils.degToRad(targetY);
      camRig.object3D.rotation.y += (targetRad - camRig.object3D.rotation.y) * 0.12;
    }
    requestAnimationFrame(animateCam);
  }

  let halHasSpoken = false;

  function speakHAL(text) {
    const eye = document.querySelector('#hal-eye');
    if (eye) {
      eye.setAttribute('color', '#FF5555');
      eye.setAttribute('animation__talk', 'property: scale; from:1 1 1; to:1.25 1.25 1.25; dir:alternate; loop:true; dur:220');
      eye.setAttribute('animation', 'property:emissive-intensity;from:4;to:1;dir:alternate;loop:true;dur:250;easing:easeInOutSine');
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
        eye.setAttribute('animation', 'property:emissive-intensity;from:3;to:0.7;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
      }
    };
    speechSynthesis.speak(speech);
    if (window.soundControl?.getMuted?.()) setTimeout(() => speechSynthesis.pause(), 50);
  }

  const HAL_GREETING = "I have studied Jupiter for 847 days. I still find its scale difficult to comprehend.";

  const startOverlay = document.createElement('div');
  startOverlay.id = 'startOverlay';
  startOverlay.innerHTML = `
    <div class="welcome-box">
      <div class="hal-title">HAL 9000</div>
      <div class="deck-title">JUPITER OBSERVATION DECK</div>
      <div class="click-prompt">CLICK ANYWHERE TO BEGIN</div>
      <div class="pulse-dot"></div>
    </div>`;

  Object.assign(startOverlay.style, {
    position: 'fixed', inset: '0', zIndex: '999999',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: "'Courier New', monospace"
  });
  startOverlay.querySelector('.hal-title') && null;
  document.body.appendChild(startOverlay);

  const st = document.getElementById('startOverlay');
  st.children[0].style.cssText = 'color:#FF0000;font-size:13px;letter-spacing:0.4em;margin-bottom:18px;';
  st.children[1].style.cssText = 'color:#fff;font-size:22px;letter-spacing:0.15em;margin-bottom:10px;';
  st.children[2].style.cssText = 'color:rgba(255,255,255,0.45);font-size:12px;letter-spacing:0.2em;margin-top:24px;';
  st.children[3].style.cssText = 'margin-top:30px;width:10px;height:10px;border-radius:50%;background:#FF0000;box-shadow:0 0 18px #FF0000;animation:pulse 1.5s ease-in-out infinite;';

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
    document.getElementById('hal-popup').style.display = 'none';
    document.getElementById('hal-overlay').style.display = 'none';
    const hud = document.getElementById('hal-interface');
    if (hud) hud.style.display = 'block';
    if (window.inlineHAL && window.inlineHAL.initInlineHAL) window.inlineHAL.initInlineHAL();
    setTimeout(() => speakHAL(HAL_GREETING), 300);
  });

  if (typeof window.jupiterZ === 'undefined') window.jupiterZ = -140;
  const jinit = document.querySelector('#jupiter-system'); if (jinit) jinit.setAttribute('position', `-3 3.2 ${window.jupiterZ}`);
  document.addEventListener('wheel', (e) => {
    const jupiter = document.querySelector('#jupiter-system');
    window.jupiterZ += e.deltaY > 0 ? 10 : -10;
    window.jupiterZ = Math.max(-200, Math.min(-40, window.jupiterZ));
    if (jupiter) jupiter.setAttribute('position', `-3 3.2 ${window.jupiterZ}`);
  });

  function createZoomControls() {
    if (document.getElementById('zoom-controls')) return;
    const div = document.createElement('div');
    div.id = 'zoom-controls';
    div.style.position = 'fixed';
    div.style.left = '18px';
    div.style.bottom = '18px';
    div.style.zIndex = '999999';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '8px';

    const btnIn = document.createElement('button');
    btnIn.textContent = '＋';
    btnIn.title = 'Zoom In (bring Jupiter closer)';
    Object.assign(btnIn.style, {width:'44px',height:'44px',borderRadius:'8px',fontSize:'20px',background:'#0B2545',color:'#fff',border:'none',cursor:'pointer'});
    const btnOut = document.createElement('button');
    btnOut.textContent = '−';
    btnOut.title = 'Zoom Out (push Jupiter away)';
    Object.assign(btnOut.style, {width:'44px',height:'44px',borderRadius:'8px',fontSize:'22px',background:'#0B2545',color:'#fff',border:'none',cursor:'pointer'});

    btnIn.addEventListener('click', () => { window.jupiterZ = Math.max(-200, Math.min(-40, window.jupiterZ + 10)); document.querySelector('#jupiter-system').setAttribute('position', `-3 3.2 ${window.jupiterZ}`); });
    btnOut.addEventListener('click', () => { window.jupiterZ = Math.max(-200, Math.min(-40, window.jupiterZ - 10)); document.querySelector('#jupiter-system').setAttribute('position', `-3 3.2 ${window.jupiterZ}`); });

    div.appendChild(btnIn); div.appendChild(btnOut);
    document.body.appendChild(div);
  }

  createZoomControls();

  function triggerJupiterSubmit() {
    const inputField = document.getElementById('jupiter-input') || document.getElementById('question-input') || document.querySelector('.hal-interface input');
    const sendBtn = document.getElementById('sendJupiterBtn') || document.getElementById('ask-btn') || document.getElementById('send');
    if (sendBtn) {
      sendBtn.click();
    } else if (inputField && typeof window.askHAL === 'function') {
      const q = inputField.value.trim();
      if (q) {
        window.askHAL(q);
        inputField.value = '';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const targetInput = document.getElementById('jupiter-input') || document.getElementById('question-input') || document.querySelector('input');
    if (targetInput) {
      targetInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerJupiterSubmit();
        }
      });
      targetInput.addEventListener('keypress', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerJupiterSubmit();
        }
      });
    }
  });
