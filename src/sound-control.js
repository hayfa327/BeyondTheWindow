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

if (evt.detail.muted) {

  if (window.speechSynthesis.speaking) {
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

  // One-time visual toast when audio context initializes (helps testing autoplay/unlock)
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
