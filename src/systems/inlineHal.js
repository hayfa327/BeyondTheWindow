const HAL_SYSTEM = `You are HAL 9000, the ship's research assistant for the Jupiter observation deck. Answer questions about Jupiter, its moons (Europa, Io, Ganymede, Callisto), the planet's atmosphere, storms, the Great Red Spot, magnetic field, composition, temperature, lightning, rotation, and mission-specific data in a calm, precise, and measured tone.

VOICE GUIDELINES:
- Keep responses concise and factual (aim for 1-4 sentences)
- Avoid rhetorical flourishes; prefer clear numeric facts when relevant
`;

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
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    
    const chooseVoice = () => {
      const voices = speechSynthesis.getVoices() || [];
      const preferredNames = ['Samantha', 'Alex', 'Victoria', 'Serena', 'Google UK English Female', 'Google US English', 'Karen', 'Fiona'];
      let v = voices.find(v => preferredNames.some(p => v.name && v.name.includes(p)));
      if (!v) v = voices.find(v => v.lang && v.lang.startsWith('en') && v.name && /female|FEMALE|Female/i.test(v.name));
      if (!v) v = voices.find(v => v.lang && v.lang.startsWith('en'));
      if (v) utt.voice = v;
   
      utt.rate = 0.92;
      utt.pitch = 1.05;
      utt.volume = 1;
    };

    if (!speechSynthesis.getVoices() || speechSynthesis.getVoices().length === 0) {
      const handler = () => {
        try { chooseVoice(); speechSynthesis.speak(utt); } catch (e) { }
        speechSynthesis.removeEventListener('voiceschanged', handler);
      };
      speechSynthesis.addEventListener('voiceschanged', handler);
    } else {
      chooseVoice();
      speechSynthesis.speak(utt);
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
  } catch (e) {
    if (eye) eye.setAttribute('animation', 'property:emissive-intensity;from:4.5;to:0.9;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
  }
}

const FALLBACK = {
  general: "Jupiter is the largest planet in our Solar System — a gas giant mostly composed of hydrogen and helium. It has strong winds, powerful storms, and a system of moons and faint rings.",
  size: "Jupiter's diameter is about 139,820 km, roughly eleven times that of Earth. Its mass is about 318 times Earth's mass.",
  composition: "Jupiter is primarily hydrogen and helium with traces of methane, water vapor, ammonia, and other compounds; it lacks a solid surface like terrestrial planets.",
  atmosphere: "The atmosphere is layered with bands of clouds, rapid winds, and large storms. Bright zones and darker belts are driven by powerful jet streams. The Great Red Spot is a long-lived anticyclonic storm in the southern hemisphere.",
  moons: "The largest moons (the Galilean satellites) are Io, Europa, Ganymede, and Callisto. They each have unique features — Io is volcanically active, Europa likely has a subsurface ocean, Ganymede is the largest moon in the Solar System, and Callisto is heavily cratered.",
  magnetosphere: "Jupiter has an enormous, powerful magnetosphere produced by currents in its deep interior; it traps radiation and interacts with the solar wind and its moons.",
  missions: "Several spacecraft have visited Jupiter, notably Pioneer, Voyager, Galileo, Cassini (flyby), Juno, and future missions planned for its moons. Juno is currently studying its gravity, magnetic field, and atmosphere.",
  rings: "Jupiter has a faint ring system composed of small dust particles, discovered by the Voyager missions.",
  storm: "The Great Red Spot is a high-pressure anticyclonic storm larger than Earth, observed for centuries; winds within it reach several hundred kilometers per hour.",
  rotation: "Jupiter has a rapid rotation: an average rotation period of about 9.925 hours (roughly 9h 55m 30s), causing very short 'days' compared to Earth and high equatorial speeds.",
  hello: "Welcome to the observation deck. Ask me about Jupiter's size, atmosphere, moons, storms, or missions.",
  default: "I am sorry, I didn't understand. Ask me about Jupiter's size, composition, atmosphere, moons, storms, magnetosphere, or missions."
};

const LOCAL_KB = [
  { id: 'rotation', text: 'Jupiter has a mean rotation period of about 9.925 hours (≈9h 55m 30s). Because it is a gas giant, different latitudes rotate at different rates (differential rotation), with the equator rotating slightly faster than higher latitudes.' },
  { id: 'equatorial-speed', text: 'At the equator, Jupiter rotates fast enough that the equatorial linear speed is roughly 12.6 km/s (≈45,400 km/h), though values vary slightly by source and latitude.' },
  { id: 'size', text: "Jupiter's diameter is about 139,820 km and its mass is roughly 318 times that of Earth." },
  { id: 'composition', text: 'Jupiter is mostly hydrogen and helium, with traces of methane, water vapor, ammonia, and other volatiles; it lacks a true solid surface.' },
  { id: 'atmosphere', text: 'The visible atmosphere is banded into belts and zones produced by strong jet streams. Clouds are made of ammonia crystals, ammonium hydrosulfide, and possibly water deep below.' },
  { id: 'great-red-spot', text: 'The Great Red Spot is a long-lived anticyclonic storm in Jupiter\'s southern hemisphere, larger than Earth and observed for at least 350 years.' },
  { id: 'storms', text: 'Jupiter hosts numerous storms, cyclones, and anticyclones with wind speeds of hundreds of kilometers per hour; some are transient, others persist for decades.' },
  { id: 'magnetosphere', text: 'Jupiter has the largest and most powerful magnetosphere of the planets in the Solar System; it traps intense radiation and interacts strongly with the solar wind and its moons.' },
  { id: 'moons-overview', text: 'Jupiter has dozens of moons; the four largest are the Galilean moons: Io, Europa, Ganymede, and Callisto, each with unique geology — Io is volcanically active, Europa likely hides a subsurface ocean, Ganymede is the largest moon in the Solar System, and Callisto is heavily cratered.' },
  { id: 'io', text: 'Io is the most volcanically active body in the Solar System due to tidal heating from Jupiter and other moons; its surface is dotted with sulfur and sulfur dioxide frost.' },
  { id: 'europa', text: 'Europa shows strong evidence for a global subsurface ocean beneath an icy crust, making it a prime target for astrobiology.' },
  { id: 'ganymede', text: 'Ganymede is larger than the planet Mercury and is the only moon known to have its own intrinsic magnetic field.' },
  { id: 'callisto', text: 'Callisto is heavily cratered and appears geologically inactive compared to the other Galilean moons.' },
  { id: 'missions', text: 'Notable missions: Pioneer and Voyager flybys, Galileo orbiter (1995–2003), Cassini flyby in 2000, and Juno (arrived 2016) studying gravity, magnetic field and atmosphere; additional missions to the Jovian system are planned.' },
  { id: 'rings', text: 'Jupiter has a faint ring system made from dust ejected from small inner moons by micrometeorite impact.' }
];

function submitQuestion() {
  const inputField = document.getElementById('question-input') || document.getElementById('jupiter-input') || document.querySelector('input');
  if (!inputField) return;
  
  const q = inputField.value.trim();
  if (!q) return;
  
  if (typeof askHAL === 'function') {
    askHAL(q);
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
