const HAL_SYSTEM = `You are HAL 9000, the ship's research assistant for the Jupiter observation deck. You have absolute, unlimited data on Jupiter, its moons (Europa, Io, Ganymede, Callisto), atmosphere, physics, magnetosphere, and exploration missions.

CRITICAL PRESENTATION RULES:
1. Speak in a calm, precise, measured, and objective tone.
2. Keep responses brief and factual (1 to 3 sentences maximum).
3. STRICT FILTER: You are ONLY allowed to answer questions regarding Jupiter and the Jovian system. If the user asks about anything completely unrelated to Jupiter or space science (such as countries on Earth like Belgium, recipes, unrelated history, pop culture, or general knowledge), you must politely but firmly refuse to answer. State that the inquiry falls outside your operational parameters.`;

if (!document.getElementById('puter-script')) {
  const script = document.createElement('script');
  script.id = 'puter-script';
  script.src = 'https://js.puter.com/v2/';
  document.head.appendChild(script);
}

function showHALDialogue(text) {
  const d = document.getElementById('hal-dialogue');
  const t = document.getElementById('hal-text');
  if (!d || !t) return;
  d.style.display = 'block';

  d.style.maxHeight = '220px';
  d.style.overflowY = 'auto';
  d.style.padding = '10px';
  d.style.background = 'rgba(8,10,12,0.9)';
  t.textContent = '';
  t.style.whiteSpace = 'pre-wrap';
  t.style.lineHeight = '1.36';
  let i = 0;
  const iv = setInterval(() => { t.textContent += (text[i++]||''); if (i>=text.length) clearInterval(iv); }, 24);
}

function speakHAL(text) {
  const eye = document.querySelector('#hal-eye');
  if (eye) {
    eye.setAttribute('animation', 'property:emissive-intensity;from:6;to:1.2;dir:alternate;loop:true;dur:200;easing:easeInOutSine');
  }
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    
    const chooseVoice = () => {
      const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      const preferredNames = ['Samantha', 'Alex', 'Victoria', 'Serena', 'Google UK English Female', 'Google US English', 'Karen', 'Fiona'];
      let v = voices.find(v => preferredNames.some(p => v.name && v.name.includes(p)));
      if (!v) v = voices.find(v => v.lang && v.lang.startsWith('en') && v.name && /female|FEMALE|Female/i.test(v.name));
      if (!v) v = voices.find(v => v.lang && v.lang.startsWith('en'));
      if (v) utt.voice = v;
   
      utt.rate = 0.92;
      utt.pitch = 1.05;
      utt.volume = 1;
    };

    if (!window.speechSynthesis || !window.speechSynthesis.getVoices() || window.speechSynthesis.getVoices().length === 0) {
      const handler = () => {
        try { chooseVoice(); window.speechSynthesis.speak(utt); } catch (e) { }
        if (window.speechSynthesis) window.speechSynthesis.removeEventListener('voiceschanged', handler);
      };
      if (window.speechSynthesis) window.speechSynthesis.addEventListener('voiceschanged', handler);
    } else {
      chooseVoice();
      window.speechSynthesis.speak(utt);
    }

    utt.onstart = () => {
      if (eye) {
        eye.setAttribute('animation__talk', 'property:scale; from:1 1 1; to:1.18 1.18 1.18; dir:alternate; loop:true; dur:220');
      }
    };
    utt.onend = () => {
      if (eye) {
        eye.removeAttribute('animation__talk');
        eye.setAttribute('animation', 'property:emissive-intensity;from:4.5;to:0.9;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
      }
    };
    utt.onerror = () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  } catch (e) {
    if (eye) eye.setAttribute('animation', 'property:emissive-intensity;from:4.5;to:0.9;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
  }
}

window.askHAL = function(query) {
  const q = query.trim();
  const loadingIndicator = document.getElementById('hal-loading');
  const dialogueContainer = document.getElementById('hal-dialogue');
  
  if (loadingIndicator) loadingIndicator.style.display = 'block';
  if (dialogueContainer) dialogueContainer.style.display = 'none';

  const cleanQuery = q.toLowerCase();
  if (cleanQuery === "hello" || cleanQuery === "hi") {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    const welcome = "Console active. Ready for Jovian system inquiries.";
    showHALDialogue(welcome);
    speakHAL(welcome);
    return;
  }

  if (typeof window.puter !== 'undefined' && window.puter.ai) {
    window.puter.ai.chat([
      { role: "system", content: HAL_SYSTEM },
      { role: "user", content: q }
    ], {
      model: "gemini-2.5-flash"
    })
    .then(response => {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      const reply = response.toString().trim();
      showHALDialogue(reply);
      speakHAL(reply);
    })
    .catch(() => {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      const failText = "Data link error. Jupiter is primarily composed of hydrogen and helium.";
      showHALDialogue(failText);
      speakHAL(failText);
    });
  } else {
    setTimeout(() => {
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      const loadingText = "Interface initializing. Re-submit in a moment.";
      showHALDialogue(loadingText);
      speakHAL(loadingText);
    }, 1200);
  }
};

function submitQuestion() {
  const inputField = document.getElementById('question-input') || document.getElementById('jupiter-input') || document.querySelector('input');
  if (!inputField) return;
  
  const q = inputField.value.trim();
  if (!q) return;
  
  if (typeof window.askHAL === 'function') {
    window.askHAL(q);
  }
  inputField.value = '';
}

const askBtn = document.getElementById('ask-btn') || document.getElementById('send');
if (askBtn) {
  askBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    submitQuestion();
  });
}

const questionInput = document.getElementById('question-input') || document.getElementById('jupiter-input') || document.querySelector('input');
if (questionInput) {
  questionInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      submitQuestion();
    }
  });

  questionInput.addEventListener('keypress', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      submitQuestion();
    }
  });
}

const quickAskBtn = document.getElementById('quick-ask-btn') || document.querySelector('#quick-ask button');
const quickQuestionInput = document.getElementById('quick-question') || document.querySelector('#quick-ask input');

if (quickAskBtn && quickQuestionInput) {
  quickAskBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const query = quickQuestionInput.value.trim();
    if (query && typeof window.askHAL === 'function') {
      window.askHAL(query);
      quickQuestionInput.value = '';
    }
  });

  quickQuestionInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = quickQuestionInput.value.trim();
      if (query && typeof window.askHAL === 'function') {
        window.askHAL(query);
        quickQuestionInput.value = '';
      }
    }
  });
}

function setupHALMicrophone() {
  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  if (!SpeechRecognition) return;

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const speechToText = event.results[event.results.length - 1][0].transcript.trim();
    if (speechToText && typeof window.askHAL === 'function') {
      window.askHAL(speechToText);
    }
  };

  try {
    recognition.start();
  } catch (e) {}
}

window.addEventListener('DOMContentLoaded', () => {
  setupHALMicrophone();
});
window.addEventListener('click', () => {
  if (window.speechSynthesis && window.speechSynthesis.speaking === false && window.speechSynthesis.pending === false) {
    window.speechSynthesis.resume();
  }
}, { once: true });