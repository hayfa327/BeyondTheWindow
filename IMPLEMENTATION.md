# Beyond the Window — Implementation Notes
### Branch: `sound-zoom-Bg` | Author: Raheel Shan

---

## Overview

All audio is synthesised in real time using the **Web Audio API** and **Web Speech Synthesis API** — no external audio files are used or required.

---

## Rooms & Pages

| File | Room | Audio Profile |
|---|---|---|
| `stationRoom.html` | Welcome Screen → Station Room | Space Hum (welcome only) + Beep + Voice |
| `cameraOutSide.html` | Outside Camera / Jupiter View | Beep + Voice |
| `halRoom.html` | HAL 9000 Room | Beep + Voice |
| `index.html` | Entry point | Redirects to stationRoom |

---

## Available Sounds

| Sound | Frequency | Where | Trigger |
|---|---|---|---|
| Space Ambient Hum | 60 Hz + 121.5 Hz sine | Welcome screen only | First user gesture |
| Computer Beep | 880 Hz sine, 0.3 s | All rooms before HAL speaks | `playBeep()` |
| HAL 9000 Voice | Web Speech API | All rooms | `speakHAL(text)` |

---

## Full Source Code

---

### `src/celestial.js`
> A-Frame components: planet rotation, moon orbit, and the `space-audio` system (ambient hum + beep).

```js
// Raheel Shan — Motion & Sound
// Usage in HTML:
//   planet-rotation="dur: 20000"         → attach to any planet entity
//   moon-orbit="radius: 3; dur: 15000"   → attach to Jupiter entity
//   space-audio                           → attach to <a-scene>

AFRAME.registerComponent('space-audio', {
  schema: { hum: { type: 'boolean', default: true } },

  init() {
    this.ctx = null;
    this.humNodes = [];
    this.output = null;
    this.muted = window.soundControl?.getMuted?.() ?? false;

    // Defer creation until a user gesture (browser autoplay policy)
    if (this.data.hum) {
      document.addEventListener('click', () => this._startHum(), { once: true });
      document.addEventListener('keydown', () => this._startHum(), { once: true });
      document.addEventListener('touchstart', () => this._startHum(), { once: true });
    } else {
      document.addEventListener('click', () => this._createCtx(), { once: true });
      document.addEventListener('keydown', () => this._createCtx(), { once: true });
      document.addEventListener('touchstart', () => this._createCtx(), { once: true });
    }

    window.addEventListener('sound-control-changed', (evt) => this.setMuted(evt.detail.muted));
  },

  // Creates AudioContext + master gain without any oscillators (used for beep-only rooms)
  _createCtx() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = this.ctx;
    this.output = ctx.createGain();
    this.output.gain.setValueAtTime(this.muted ? 0 : 1, ctx.currentTime);
    this.output.connect(ctx.destination);
    // Notify UI that audio context has been created (one-time)
    try { window.dispatchEvent(new CustomEvent('space-audio-initialized')); } catch (e) {}
    if (ctx.state === 'suspended') {
      const unlock = () => ctx.resume();
      document.addEventListener('click', unlock, { once: true });
      document.addEventListener('keydown', unlock, { once: true });
      document.addEventListener('touchstart', unlock, { once: true });
    }
  },

  _startHum() {
    if (this.humNodes.length) return;
    this._createCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Layer 1: deep bass drone at 60 Hz
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = 60;

    // Layer 2: mid hum at 120 Hz, slightly detuned for texture
    const mid = ctx.createOscillator();
    mid.type = 'sine';
    mid.frequency.value = 121.5;

    // Slow volume fade-in over 4 seconds
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 4);

    bass.connect(gain);
    mid.connect(gain);
    gain.connect(this.output);

    bass.start();
    mid.start();

    this.humNodes = [bass, mid, gain];
  },

  setMuted(muted) {
    this.muted = !!muted;
    if (!this.ctx) {
      // Create audio context on first mute/unmute action so user gesture initializes audio
      this._createCtx();
    }

    const gainTarget = this.muted ? 0 : 1;
    try {
      this.output.gain.cancelScheduledValues(this.ctx.currentTime);
      this.output.gain.setTargetAtTime(gainTarget, this.ctx.currentTime, 0.01);
    } catch (e) {
      // ignore if ctx/out not ready
    }
  },

  toggleMute() {
    this.setMuted(!this.muted);
  },

  // Stop the ambient hum but keep AudioContext open for beep-only pages
  stopHum() {
    if (!this.humNodes || this.humNodes.length === 0) return;
    try {
      this.humNodes.forEach(n => {
        if (n.stop) n.stop();
        try { n.disconnect(); } catch (e) {}
      });
    } catch (e) {}
    this.humNodes = [];
  },

  // Short sci-fi beep at 880 Hz — called by robot AI
  playBeep() {
    if (!this.ctx) {
      this._createCtx();
    }
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.output);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  },

  remove() {
    this.stopHum();
    if (this.ctx) this.ctx.close();
  }
});
```

---

### `src/sound-control.js`
> Global mute singleton, toggle button (🔊/🔇), keyboard shortcut M, and speech position tracker for resume-after-mute.

```js
const STORAGE_KEY = 'beyondTheWindowSoundMuted';

window.soundControl = window.soundControl || {
  muted: false,
  init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    this.muted = stored === 'true';
    return this.muted;
  },
  setMuted(value) {
    this.muted = !!value;
    localStorage.setItem(STORAGE_KEY, this.muted);
    window.dispatchEvent(new CustomEvent('sound-control-changed', { detail: { muted: this.muted } }));
  },
  toggle() {
    this.setMuted(!this.muted);
  },
  getMuted() {
    return this.muted;
  }
};

// ── SPEECH POSITION TRACKER ──────────────────────────────────────────────────
// Tracks the active TTS utterance so mute cancels it and unmute restarts from
// approximately the same word (using boundary events for position tracking).
const _speech = { text: '', offset: 0, charIndex: 0, lang: 'en-US', rate: 0.75, pitch: 0.55 };

window.registerSpeech = function(utterance, fullText) {
  _speech.text      = fullText;
  _speech.charIndex = 0;
  _speech.offset    = 0;
  _speech.lang      = utterance.lang  || 'en-US';
  _speech.rate      = utterance.rate  || 0.75;
  _speech.pitch     = utterance.pitch || 0.55;
  utterance.addEventListener('boundary', (e) => {
    _speech.charIndex = _speech.offset + (e.charIndex || 0);
  });
  utterance.addEventListener('end', () => {
    _speech.text = '';
    _speech.charIndex = 0;
    _speech.offset    = 0;
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  if (!sceneEl) return;

  window.soundControl.init();

  const audioToggle = document.createElement('button');
  audioToggle.id = 'audio-toggle';
  audioToggle.type = 'button';
  audioToggle.setAttribute('aria-label', 'Toggle sound');
  audioToggle.title = 'Toggle sound (M)';
  document.body.appendChild(audioToggle);

  function updateToggleLabel(muted) {
    audioToggle.textContent = muted ? '🔇' : '🔊';
    audioToggle.classList.toggle('muted', muted);
    audioToggle.classList.toggle('active', !muted);
  }

  function updateSceneAudioState() {
    const comp = sceneEl.components['space-audio'];
    if (comp?.setMuted) {
      comp.setMuted(window.soundControl.getMuted());
    }
  }

  function handleSoundControlChange(evt) {
    updateToggleLabel(evt.detail.muted);
    updateSceneAudioState();

    if (evt.detail.muted) {
      // Cancel speech and save position — pause() is unreliable in Chrome
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.cancel();
      }
    } else {
      // Restart speech from last word boundary position
      const remaining = (_speech.text || '').slice(_speech.charIndex).trim();
      if (remaining) {
        const u = new SpeechSynthesisUtterance(remaining);
        u.lang   = _speech.lang;
        u.rate   = _speech.rate;
        u.pitch  = _speech.pitch;
        u.volume = 1;
        const resumeOffset = _speech.charIndex;
        u.addEventListener('boundary', (e) => {
          _speech.charIndex = resumeOffset + (e.charIndex || 0);
        });
        u.addEventListener('end', () => {
          _speech.text = '';
          _speech.charIndex = 0;
          _speech.offset    = 0;
        });
        window.speechSynthesis.speak(u);
      }
    }
  }

  audioToggle.addEventListener('click', () => {
    window.soundControl.toggle();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'm') {
      window.soundControl.toggle();
    }
  });

  window.addEventListener('sound-control-changed', handleSoundControlChange);
  updateToggleLabel(window.soundControl.getMuted());
  updateSceneAudioState();
  sceneEl.addEventListener('loaded', updateSceneAudioState);

  // One-time visual toast when audio context initializes
  let _toastShown = false;
  function showAudioInitToast() {
    if (_toastShown) return; _toastShown = true;
    const t = document.createElement('div');
    t.id = 'audio-init-toast';
    t.textContent = 'Audio initialized';
    Object.assign(t.style, {
      position: 'fixed', left: '18px', bottom: '18px', zIndex: '1000000',
      background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 12px', borderRadius: '8px',
      fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', boxShadow: '0 6px 18px rgba(0,0,0,0.6)'
    });
    document.body.appendChild(t);
    setTimeout(() => { try { t.style.transition='opacity 0.4s'; t.style.opacity='0'; setTimeout(()=>t.remove(),400); } catch(e){} }, 1800);
  }
  window.addEventListener('space-audio-initialized', showAudioInitToast, { once: true });
});
```

---

### `src/sound-zoom-Bg.js`
> Backup audio unlock + background sky sphere zoom formula synced to Jupiter's Z position.

```js
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
```

---

### `style/sound-zoom-Bg.css`
> Welcome overlay background image at full brightness, dialogue box glass card, mute button z-index.

```css
/* ── START OVERLAY — full-brightness space image, no dark tint ── */
#startOverlay {
  background:
    url('/assets/textures/new%20image%20of%20space.png') center / cover no-repeat !important;
}

/* ── WELCOME DIALOGUE BOX ── */
.welcome-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 56px 80px;
  background: rgba(2, 6, 18, 0.80);
  border: 1px solid rgba(210, 35, 35, 0.55);
  border-radius: 10px;
  box-shadow:
    0 0 90px rgba(180, 0, 0, 0.22),
    0 8px 40px rgba(0, 0, 0, 0.85),
    inset 0 0 60px rgba(0, 0, 30, 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* ── MUTE BUTTON — always above the overlay ── */
#audio-toggle {
  z-index: 1000001;
}
```

---

### `src/systems/stationRoom.js`
> Welcome screen overlay, HAL greeting, Jupiter zoom, door animation, beep on entry.

```js
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
    if (eye) {
      eye.setAttribute('animation',
        'property:emissive-intensity;from:6;to:1.2;dir:alternate;loop:true;dur:200;easing:easeInOutSine');
    }
    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US'; speech.rate = 0.75; speech.pitch = 0.55; speech.volume = 1;
    speech.onend = () => {
      if (eye) {
        eye.setAttribute('animation',
          'property:emissive-intensity;from:4.5;to:0.9;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
      }
    };
    window.registerSpeech?.(speech, text);
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
    try { scene?.components?.['space-audio']?._createCtx?.(); } catch (e) {}
    try { scene?.components?.['space-audio']?.playBeep?.(); } catch (e) {}
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
    if (!cam || !door) { requestAnimationFrame(checkDoor); return; }
    const pos = cam.object3D.position;
    if (!doorOpened && pos.x < -7) {
      doorOpened = true;
      door.setAttribute('animation','property: position; to: -12 2.5 -2; dur: 2000; easing: easeInOutQuad');
    }
    requestAnimationFrame(checkDoor);
  }

  checkDoor();
```

---

### `src/systems/halRoom.js`
> HAL 9000 room: clock, camera, AI Q&A via Anthropic API, beep before speech, speech tracking.

```js
  let secs = 0;
  setInterval(() => {
    secs++;
    const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=secs%60;
    const p=n=>String(n).padStart(2,'0');
    document.getElementById('clock-display').textContent=`DAY 847 — ${p(h)}:${p(m)}:${p(s)}`;
  }, 1000);

  const camRig = document.querySelector('#cam-rig');
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

  function showHALDialogue(text) {
    const d = document.getElementById('hal-dialogue');
    const t = document.getElementById('hal-text');
    d.style.display = 'block';
    t.textContent = '';
    let i = 0;
    const iv = setInterval(() => { t.textContent += text[i++]; if(i>=text.length) clearInterval(iv); }, 28);
  }

  function speakHAL(text) {
    const eye = document.querySelector('#hal-eye');
    if (eye) eye.setAttribute('animation',
      'property:emissive-intensity;from:6;to:1.2;dir:alternate;loop:true;dur:200;easing:easeInOutSine');
    const spaceAudio = document.querySelector('a-scene')?.components?.['space-audio'];
    if (spaceAudio?.playBeep) spaceAudio.playBeep();
    speechSynthesis.cancel();
    const s = new SpeechSynthesisUtterance(text);
    s.lang='en-US'; s.rate=0.72; s.pitch=0.5; s.volume=1;
    s.onend = () => {
      if (eye) eye.setAttribute('animation',
        'property:emissive-intensity;from:4.5;to:0.9;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
    };
    window.registerSpeech?.(s, text);
    speechSynthesis.speak(s);
    if (window.soundControl?.getMuted?.()) speechSynthesis.cancel();
  }

  const HAL_SYSTEM = `You are HAL 9000, the artificial intelligence aboard the Discovery One spacecraft on a mission to Jupiter. Your voice is calm, precise, and measured. You never rush.

WHAT YOU ANSWER:
- Jupiter: atmosphere, size, storms, Great Red Spot, cloud bands, magnetic field, temperature, composition, lightning
- Jupiter moons: Europa, Io, Ganymede, Callisto
- Mission data: distance, orbital mechanics, arrival time, TMA-2 signal
- Space science directly related to Jupiter or this mission

WHAT YOU DECLINE:
"I am sorry, Dr. Bowman. That falls outside my mission information scope. Is there something about Jupiter I can help you understand?"

VOICE RULES:
- Never use exclamation marks
- Never say Certainly or Of course or Great question
- Maximum 4 sentences per response
- Speak in complete, precise sentences`;

  async function askHAL(question) {
    const btn = document.getElementById('ask-btn');
    const loading = document.getElementById('hal-loading');
    btn.disabled = true;
    loading.style.display = 'block';
    document.getElementById('hal-dialogue').style.display = 'none';
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: HAL_SYSTEM,
          messages: [{role:'user', content:question}]
        })
      });
      const data = await res.json();
      const answer = data.content[0].text;
      loading.style.display = 'none';
      showHALDialogue(answer);
      speakHAL(answer);
    } catch(e) {
      loading.style.display = 'none';
      showHALDialogue("I am sorry. I am experiencing a communication error. Please try again, Dr. Bowman.");
    } finally { btn.disabled = false; }
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
    const scene = document.querySelector('a-scene');
    try { scene?.components?.['space-audio']?._startHum?.(); } catch (e) {}
    animateCam();
    speechSynthesis.cancel();
    const greeting = "Good morning, Dr. Bowman. I am ready to assist you. You may ask me anything about Jupiter, its moons, or our mission. I will answer as precisely as I can.";
    setTimeout(() => { showHALDialogue(greeting); speakHAL(greeting); }, 800);
  });

  document.getElementById('ask-btn').addEventListener('click', () => {
    const q = document.getElementById('question-input').value.trim();
    if (!q) return;
    askHAL(q);
    document.getElementById('question-input').value = '';
  });

  document.getElementById('question-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (!q) return;
      askHAL(q);
      e.target.value = '';
    }
  });
```

---

### `src/systems/cameraOutSide.js`
> Outside Jupiter view: camera drag, welcome overlay, HAL greeting, Jupiter + moons zoom, zoom buttons.

```js
  const camRig = document.querySelector('#camRig');
  const MAX_ANGLE = 40;
  let targetY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let startAngle = 0;

  document.addEventListener('mousedown', (e) => { isDragging = true; dragStartX = e.clientX; startAngle = targetY; document.body.style.cursor = 'grabbing'; });
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
    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US'; speech.rate = 0.75; speech.pitch = 0.55; speech.volume = 1;
    speech.onend = () => {
      if (eye) {
        eye.removeAttribute('animation');
        eye.removeAttribute('animation__talk');
        eye.object3D.scale.set(1,1,1);
        eye.setAttribute('animation', 'property:emissive-intensity;from:3;to:0.7;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
      }
    };
    window.registerSpeech?.(speech, text);
    speechSynthesis.speak(speech);
    if (window.soundControl?.getMuted?.()) speechSynthesis.cancel();
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
  document.body.appendChild(startOverlay);

  startOverlay.addEventListener('click', () => {
    startOverlay.remove();
    const scene = document.querySelector('a-scene');
    try { scene?.components?.['space-audio']?._startHum?.(); } catch (e) {}
    document.querySelector('a-scene').addEventListener('loaded', () => { animateCam(); });
    if (document.querySelector('a-scene').hasLoaded) animateCam();
    if (!halHasSpoken) {
      halHasSpoken = true;
      setTimeout(() => speakHAL(HAL_GREETING), 800);
    }
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
    div.style.position = 'fixed'; div.style.left = '18px'; div.style.bottom = '18px'; div.style.zIndex = '999999';
    div.style.display = 'flex'; div.style.flexDirection = 'column'; div.style.gap = '8px';

    const btnIn = document.createElement('button');
    btnIn.textContent = '＋'; btnIn.title = 'Zoom In (bring Jupiter closer)';
    Object.assign(btnIn.style, {width:'44px',height:'44px',borderRadius:'8px',fontSize:'20px',background:'#0B2545',color:'#fff',border:'none',cursor:'pointer'});
    const btnOut = document.createElement('button');
    btnOut.textContent = '−'; btnOut.title = 'Zoom Out (push Jupiter away)';
    Object.assign(btnOut.style, {width:'44px',height:'44px',borderRadius:'8px',fontSize:'22px',background:'#0B2545',color:'#fff',border:'none',cursor:'pointer'});

    btnIn.addEventListener('click', () => { window.jupiterZ = Math.max(-200, Math.min(-40, window.jupiterZ + 10)); document.querySelector('#jupiter-system').setAttribute('position', `-3 3.2 ${window.jupiterZ}`); });
    btnOut.addEventListener('click', () => { window.jupiterZ = Math.max(-200, Math.min(-40, window.jupiterZ - 10)); document.querySelector('#jupiter-system').setAttribute('position', `-3 3.2 ${window.jupiterZ}`); });

    div.appendChild(btnIn); div.appendChild(btnOut);
    document.body.appendChild(div);
  }

  createZoomControls();
```

---

### `src/robot-ai.js`
> A-Frame `hal-logic` component: voice recognition, keyword Q&A about Jupiter, and speak with mute tracking.

```js
const jupiterData = {
    "size": "Jupiter is absolutely massive, commander. It's about eleven times the diameter of Earth.",
    "moons": "We've charted ninety-five moons out here. The biggest ones on our radar are Io, Europa, Ganymede, and Callisto.",
    "storm": "Keep an eye on the Great Red Spot out the window. That storm is a massive vortex twice the size of Earth.",
    "hello": "Glad to have you on the observation deck, astronaut. What sector details do you need?",
    "default": "Copy that, can you repeat? Ask me about the size, the moons, or the storm."
};

AFRAME.registerComponent('hal-logic', {
    init: function () {
        this.hud = document.querySelector('#ai-status');
        this.setupVoice();
        this.setupKeyboardInput();
    },

    setupVoice: function() {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const speechToText = event.results[event.results.length - 1][0].transcript.toLowerCase();
            this.processInput(speechToText);
        };

        recognition.start();
    },

    setupKeyboardInput: function() {
        const targetInput = document.getElementById('question-input') || document.getElementById('jupiter-input') || document.querySelector('input');
        if (targetInput) {
            const executeSubmit = (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const q = targetInput.value.trim();
                    if (q) { this.processInput(q.toLowerCase()); targetInput.value = ''; }
                }
            };
            targetInput.addEventListener('keydown', executeSubmit);
            targetInput.addEventListener('keypress', executeSubmit);
        }
    },

    processInput: function(text) {
        let response = jupiterData.default;
        if (text.includes("hello") || text.includes("hi")) response = jupiterData.hello;
        if (text.includes("size") || text.includes("big")) response = jupiterData.size;
        if (text.includes("moon")) response = jupiterData.moons;
        if (text.includes("storm") || text.includes("spot")) response = jupiterData.storm;
        this.speak(response);
    },

    speak: function(text) {
        if (this.hud) {
            this.hud.innerText = `GUIDE: "${text}"`;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 0.9;
        utterance.volume = 1;
        window.registerSpeech?.(utterance, text);
        window.speechSynthesis.speak(utterance);
        if (window.soundControl?.getMuted?.()) window.speechSynthesis.cancel();
    },

    tick: function () {
        const playerEl = document.querySelector('#player');
        if (!playerEl) return;
        const playerPos = playerEl.object3D.position;
        const targetPos = new THREE.Vector3(playerPos.x, this.el.object3D.position.y, playerPos.z);
        this.el.object3D.lookAt(targetPos);
    }
});
```

---

## HTML — Sky Sphere & Audio Setup (per room)

### stationRoom.html — Welcome screen (hum ON)
```html
<a-scene space-audio>
  <a-assets>
    <img id="nebulaTex" src="/assets/textures/new%20image%20of%20space.png" crossorigin="anonymous">
  </a-assets>

  <a-sphere id="nebula1" radius="600" segments-width="64" segments-height="64"
    src="#nebulaTex"
    material="side: back; opacity: 1; transparent: false; blending: normal; depthWrite: false; shader: flat"
    animation="property: rotation; to: 5 360 2; loop: true; dur: 120000; easing: linear">
  </a-sphere>

  <!-- Jupiter + all moons as one parent so they zoom together -->
  <a-entity id="jupiter-system" position="-1.5 3.8 -140">
    <a-entity planet-rotation="dur:45000"> ... Jupiter model ... </a-entity>
    <a-entity moon-orbit="radius:4; dur:18000; size:0.18; color:#d4c5a0">
    <a-entity moon-orbit="radius:6; dur:30000; size:0.14; color:#c8b89a">
    <a-entity moon-orbit="radius:8; dur:52000; size:0.22; color:#b0a898">
  </a-entity>
</a-scene>
```

### halRoom.html / cameraOutSide.html — Beep only (hum OFF)
```html
<a-scene space-audio="hum: false">
  ...
</a-scene>
```

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Web Audio API oscillators instead of audio files | No file dependencies; works offline; full programmatic control |
| `cancel()` + restart on unmute instead of `pause()`/`resume()` | Chrome's `speechSynthesis.pause()` silently drops utterances; cancel+restart from charIndex is reliable |
| `boundary` events for position tracking | Only reliable cross-browser way to know which word is being spoken |
| `window.jupiterZ` global | Shared between the room system script and `sound-zoom-Bg.js` without import complexity |
| Single `#jupiter-system` parent entity | Guarantees moons always move with Jupiter — no separate position calculations needed |
| CSS `background-image` on overlay instead of A-Frame sky | Loads immediately, no dependency on WebGL or A-Frame asset pipeline |

---

*Branch: `sound-zoom-Bg` — Raheel Shan*
