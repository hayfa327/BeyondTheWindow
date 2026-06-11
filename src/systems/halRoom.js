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
    const spaceAudio = document.querySelector('a-scene')?.components?.['space-audio'];
    if (eye) eye.setAttribute('animation',
      'property:emissive-intensity;from:6;to:1.2;dir:alternate;loop:true;dur:200;easing:easeInOutSine');
    if (spaceAudio?.playBeep) spaceAudio.playBeep();
    speechSynthesis.cancel();
    const s = new SpeechSynthesisUtterance(text);
    s.lang='en-US'; s.rate=0.72; s.pitch=0.5; s.volume=1;
    s.onend = () => {
      spaceAudio?.setComputerLevel?.(1);
      if (eye) eye.setAttribute('animation',
        'property:emissive-intensity;from:4.5;to:0.9;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
    };
    window.registerSpeech?.(s, text);
    spaceAudio?.setComputerLevel?.(0.2);
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
    // Ensure space hum starts on user gesture
    const scene = document.querySelector('a-scene');
    const startHum = () => {
      try { scene?.components?.['space-audio']?._startHum?.(); } catch (e) {}
    };
    startHum();
    setTimeout(startHum, 50);
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