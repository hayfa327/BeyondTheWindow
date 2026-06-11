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
    this.humNodes = [];
    this.output = null;
    this.muted = window.soundControl?.getMuted?.() ?? false;

    // Attempt autoplay immediately; browser suspends AudioContext until first gesture
    this._startHum();
    window.addEventListener('sound-control-changed', (evt) => this.setMuted(evt.detail.muted));
  },

  _startHum() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    const ctx = this.ctx;
    this.output = ctx.createGain();
    this.output.gain.setValueAtTime(this.muted ? 0 : 1, ctx.currentTime);
    this.output.connect(ctx.destination);

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

    // If autoplay was blocked, resume AudioContext on first user gesture
    if (ctx.state === 'suspended') {
      const unlock = () => ctx.resume();
      document.addEventListener('click',      unlock, { once: true });
      document.addEventListener('keydown',    unlock, { once: true });
      document.addEventListener('touchstart', unlock, { once: true });
    }
  },

  setMuted(muted) {
    this.muted = !!muted;
    if (!this.ctx) {
      if (this.muted) {
        this._startHum();
      }
      return;
    }

    const gainTarget = this.muted ? 0 : 1;
    this.output.gain.cancelScheduledValues(this.ctx.currentTime);
    this.output.gain.setTargetAtTime(gainTarget, this.ctx.currentTime, 0.01);
  },

  toggleMute() {
    this.setMuted(!this.muted);
  },

  // Short sci-fi beep at 880 Hz — called by robot AI
  playBeep() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.output = this.ctx.createGain();
      this.output.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
      this.output.connect(this.ctx.destination);
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
    this.humNodes.forEach(n => { try { n.disconnect(); } catch(e) {} });
    if (this.ctx) this.ctx.close();
  }
});
