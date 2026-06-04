// Raheel Shan — Motion & Sound
// Usage in HTML:
//   planet-rotation="dur: 20000"         → attach to any planet entity
//   moon-orbit="radius: 3; dur: 15000"   → attach to Jupiter entity
//   space-audio                           → attach to <a-scene>

// Slowly rotates a planet around its Y axis
// dur = full rotation time in ms (higher = slower)
AFRAME.registerComponent('planet-rotation', {
  schema: {
    dur: { type: 'number', default: 20000 }
  },
  init() {
    this.el.setAttribute('animation', {
      property: 'rotation',
      to: '0 360 0',
      loop: true,
      dur: this.data.dur,
      easing: 'linear'
    });
  }
});

// Creates a moon that orbits around the parent entity
// radius = orbit distance, dur = full orbit time in ms
AFRAME.registerComponent('moon-orbit', {
  schema: {
    radius: { type: 'number', default: 3    },
    dur:    { type: 'number', default: 15000 },
    size:   { type: 'number', default: 0.2  },
    color:  { type: 'color',  default: '#aaaaaa' }
  },
  init() {
    const pivot = document.createElement('a-entity');
    pivot.setAttribute('animation', {
      property: 'rotation',
      to: '0 360 0',
      loop: true,
      dur: this.data.dur,
      easing: 'linear'
    });

    const moon = document.createElement('a-sphere');
    moon.setAttribute('position', `${this.data.radius} 0 0`);
    moon.setAttribute('radius', this.data.size);
    moon.setAttribute('color', this.data.color);

    pivot.appendChild(moon);
    this.el.appendChild(pivot);
  }
});

// Ambient space hum + beep — generated via Web Audio API (no files needed)
// Usage: <a-scene space-audio>
// Robot AI triggers beep: document.querySelector('a-scene').components['space-audio'].playBeep()
AFRAME.registerComponent('space-audio', {
  init() {
    this.ctx = null;
    this.masterGain = null;
    this.humNodes = [];
    this.isMuted = false;

    // Expose globally so the sound button can call toggleMute()
    window.__spaceAudio = this;

    // Start audio only after a user gesture (browser requirement)
    document.addEventListener('click', () => this._startHum(), { once: true });
    document.addEventListener('keydown', () => this._startHum(), { once: true });
  },

  _startHum() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    const ctx = this.ctx;

    // Layer 1: deep bass drone at 60 Hz
    const bass = ctx.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = 60;

    // Layer 2: mid hum at 120 Hz, slightly detuned for texture
    const mid = ctx.createOscillator();
    mid.type = 'sine';
    mid.frequency.value = 121.5;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, ctx.currentTime);

    if (!this.isMuted) {
      this.masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 4);
    }

    bass.connect(this.masterGain);
    mid.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    bass.start();
    mid.start();

    this.humNodes = [bass, mid];
  },

  // Called by the sound button — returns new muted state
  toggleMute() {
    if (!this.ctx) {
      this._startHum();
      this.isMuted = false;
      return false;
    }

    this.isMuted = !this.isMuted;
    const now = this.ctx.currentTime;

    if (this.isMuted) {
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.3);
    } else {
      this.masterGain.gain.linearRampToValueAtTime(0.18, now + 0.5);
    }

    return this.isMuted;
  },

  // Short sci-fi beep at 880 Hz — called by robot AI
  playBeep() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 880;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  },

  remove() {
    this.humNodes.forEach(n => { try { n.disconnect(); } catch(e) {} });
    if (this.masterGain) { try { this.masterGain.disconnect(); } catch(e) {} }
    if (this.ctx) this.ctx.close();
  }
});
