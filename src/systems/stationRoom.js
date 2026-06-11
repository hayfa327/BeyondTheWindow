  const camRig = document.querySelector('#camRig');
  const MAX_ANGLE = 45;
  let targetY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let startAngle = 0;

  document.addEventListener('mousedown', (e) => { isDragging = true; dragStartX = e.clientX; startAngle = targetY; document.body.style.cursor='grabbing'; });
  document.addEventListener('mouseup', () => { isDragging = false; document.body.style.cursor='default'; });
  document.addEventListener('mouseleave', () => { isDragging = false; document.body.style.cursor='default'; });
  document.addEventListener('mousemove', (e) => { if (!isDragging) return; const dx = e.clientX - dragStartX; const ratio = dx / window.innerWidth; targetY = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, startAngle + (-ratio * MAX_ANGLE * 1.5))); });

  function animateCam() {
    if (camRig && camRig.object3D) {
      const targetRad = THREE.MathUtils.degToRad(targetY);
      camRig.object3D.rotation.y += (targetRad - camRig.object3D.rotation.y) * 0.12;
    }
    requestAnimationFrame(animateCam);
  }

  let halHasSpoken = false;

  const HAL_GREETING =
    "Good morning, Dr. Bowman. Jupiter is now forty-one hours away. " +
    "The giant world before you is the largest planet in our Solar System, " +
    "a vast sphere of hydrogen and helium whose storms have raged for centuries. " +
    "The Great Red Spot visible from here is a storm larger than Earth itself. " +
    "Would you like to learn more about Jupiter?";

  function speakHAL(text) {
    const eye = document.querySelector('#hal-eye');
    const spaceAudio = document.querySelector('a-scene')?.components?.['space-audio'];
    if (eye) {
      eye.setAttribute('animation',
        'property:emissive-intensity;from:6;to:1.2;dir:alternate;loop:true;dur:200;easing:easeInOutSine');
    }
    spaceAudio?.playBeep?.();
    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US'; speech.rate = 0.75; speech.pitch = 0.55; speech.volume = 1;
    speech.onend = () => {
      spaceAudio?.setComputerLevel?.(1);
      if (eye) {
        eye.setAttribute('animation',
          'property:emissive-intensity;from:4.5;to:0.9;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
      }
    };
    window.registerSpeech?.(speech, text);
    spaceAudio?.setComputerLevel?.(0.2);
    speechSynthesis.speak(speech);
    if (window.soundControl?.getMuted?.()) speechSynthesis.cancel();
  }

  const startOverlay = document.createElement('div');
  startOverlay.id = 'startOverlay';
  startOverlay.innerHTML = `
    <div class="welcome-box">
      <div class="hal-title">HAL 9000</div>
      <div class="deck-title">JUPITER OBSERVATION DECK</div>
      <div class="click-prompt">CLICK ANYWHERE TO BEGIN</div>
      <div class="pulse-dot"></div>
    </div>`;
  document.body.appendChild(startOverlay);

  startOverlay.addEventListener('click', () => {
    startOverlay.remove();
    // Ensure space-audio context exists and play a startup beep for station room
    const scene = document.querySelector('a-scene');
    const audio = scene?.components?.['space-audio'];
    try { audio?._createCtx?.(); } catch (e) {}
    try { audio?.playBeep?.(); } catch (e) {}
    try { audio?.startComputerLoop?.(); } catch (e) {}

    animateCam();
    if (!halHasSpoken) {
      halHasSpoken = true;
      setTimeout(() => speakHAL(HAL_GREETING), 800);
    }
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
  const jEnt = document.querySelector('#jupiter-system'); if (jEnt) jEnt.setAttribute('position', `-1.5 3.8 ${window.jupiterZ}`);
  document.addEventListener('wheel', (e) => {
    const j = document.querySelector('#jupiter-system');
    window.jupiterZ += e.deltaY > 0 ? 10 : -10;
    window.jupiterZ = Math.max(-200, Math.min(-40, window.jupiterZ));
    if (j) j.setAttribute('position', `-1.5 3.8 ${window.jupiterZ}`);
  });

  function createZoomControls() {
    if (document.getElementById('zoom-controls')) return;
    const div = document.createElement('div');
    div.id = 'zoom-controls';
    div.style.position = 'fixed'; div.style.left = '18px'; div.style.bottom = '18px'; div.style.zIndex='999999'; div.style.display='flex'; div.style.flexDirection='column'; div.style.gap='8px';
    const btnIn = document.createElement('button'); btnIn.textContent='＋'; Object.assign(btnIn.style,{width:'44px',height:'44px',borderRadius:'8px',fontSize:'20px',background:'#0B2545',color:'#fff',border:'none',cursor:'pointer'});
    const btnOut = document.createElement('button'); btnOut.textContent='−'; Object.assign(btnOut.style,{width:'44px',height:'44px',borderRadius:'8px',fontSize:'22px',background:'#0B2545',color:'#fff',border:'none',cursor:'pointer'});
    btnIn.addEventListener('click', ()=>{ window.jupiterZ = Math.max(-200, Math.min(-40, window.jupiterZ + 10)); document.querySelector('#jupiter-system').setAttribute('position', `-1.5 3.8 ${window.jupiterZ}`); });
    btnOut.addEventListener('click', ()=>{ window.jupiterZ = Math.max(-200, Math.min(-40, window.jupiterZ - 10)); document.querySelector('#jupiter-system').setAttribute('position', `-1.5 3.8 ${window.jupiterZ}`); });
    div.appendChild(btnIn); div.appendChild(btnOut); document.body.appendChild(div);
  }
  createZoomControls();

  let doorOpened = false;

  function checkDoor() {
    const cam = document.querySelector('#camRig');
    const door = document.querySelector('#doorPanel');
    if (!cam || !door) {
      requestAnimationFrame(checkDoor);
      return;
    }
    const pos = cam.object3D.position;
    if (!doorOpened && pos.x < -7) {
      doorOpened = true;
      door.setAttribute('animation','property: position; to: -12 2.5 -2; dur: 2000; easing: easeInOutQuad');
    }
    requestAnimationFrame(checkDoor);
  }

  checkDoor();

  function triggerGlobalSubmit() {
    const inputField = document.getElementById('question-input') || document.getElementById('jupiter-input') || document.querySelector('input');
    const sendBtn = document.getElementById('ask-btn') || document.getElementById('send') || document.getElementById('sendJupiterBtn');
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
    const targetInput = document.getElementById('question-input') || document.getElementById('jupiter-input') || document.querySelector('input');
    if (targetInput) {
      targetInput.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerGlobalSubmit();
        }
      });
      targetInput.addEventListener('keypress', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerGlobalSubmit();
        }
      });
    }
  });
