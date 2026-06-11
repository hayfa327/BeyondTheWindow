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
  _speech.text     = fullText;
  _speech.charIndex = 0;
  _speech.offset   = 0;
  _speech.lang     = utterance.lang  || 'en-US';
  _speech.rate     = utterance.rate  || 0.75;
  _speech.pitch    = utterance.pitch || 0.55;
  utterance.addEventListener('boundary', (e) => {
    _speech.charIndex = _speech.offset + (e.charIndex || 0);
  });
  utterance.addEventListener('end', () => {
    _speech.text = '';
    _speech.charIndex = 0;
    _speech.offset    = 0;
  });
};

function isSoundMuted() {
  return window.soundControl?.getMuted?.() ?? false;
}

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
});
