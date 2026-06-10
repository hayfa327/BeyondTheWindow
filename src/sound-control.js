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
      window.speechSynthesis.cancel();
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
