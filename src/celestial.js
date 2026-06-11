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
    bass.frequency.value = 48;

    // Layer 2: mid hum at 120 Hz, slightly detuned for texture
    const mid = ctx.createOscillator();
    mid.type = 'sine';
    mid.frequency.value = 97;

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
  const gain = ctx.createGain();

  osc.type = 'triangle';

  osc.frequency.setValueAtTime(
    1400,
    ctx.currentTime
  );

  osc.frequency.exponentialRampToValueAtTime(
    700,
    ctx.currentTime + 0.15
  );

  gain.gain.setValueAtTime(
    0.25,
    ctx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + 0.18
  );

  osc.connect(gain);
  gain.connect(this.output);

  osc.start();
  osc.stop(ctx.currentTime + 0.18);
},

  remove() {
    this.stopHum();
    if (this.ctx) this.ctx.close();
  }
});
