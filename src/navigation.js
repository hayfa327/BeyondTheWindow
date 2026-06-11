// Makes a gltf-model planet self-emissive so intense scene lighting doesn't
// wash out the texture. Only applied to meshes that have a base color texture
// (skips transparent ring/atmosphere materials).
AFRAME.registerComponent('gltf-emissive-fix', {
  init() {
    this.el.addEventListener('model-loaded', () => {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh) return;
      mesh.traverse(node => {
        if (!node.isMesh || !node.material || !node.material.map) return;
        const mat = node.material;
        mat.emissive.set(1, 1, 1);
        mat.emissiveMap = mat.map;
        mat.emissiveIntensity = 1.0;
        mat.map = null;
        mat.needsUpdate = true;
      });
    });
  }
});

// Arrow-key locomotion + VR controller thumbstick locomotion
// Both components share the same bounds/floor-lock schema so they
// always enforce the same room limits regardless of input source.

const _SHARED_SCHEMA = {
  speed:     { type: 'number', default: 5  },
  turnSpeed: { type: 'number', default: 60 },
  // Room boundary limits (world-space X / Z of the camera rig).
  // Override per-scene with  arrow-controls="xMin:-9; xMax:9; zMin:-11.2; zMax:1.2"
  xMin: { type: 'number', default: -9    },
  xMax: { type: 'number', default:  9    },
  zMin: { type: 'number', default: -11.2 },
  zMax: { type: 'number', default:  1.2  }
};

// ─── arrow-controls ────────────────────────────────────────────────────────
// Attach to the camera-rig entity (not the camera itself).
//   ↑  Arrow  – walk forward
//   ↓  Arrow  – walk backward
//   ←  Arrow  – turn left
//   →  Arrow  – turn right
AFRAME.registerComponent('arrow-controls', {
  schema: _SHARED_SCHEMA,

  init () {
    this.keys    = {};
    this._fwd    = new THREE.Vector3();
    this._floorY = null;   // latched on first tick after entity position is ready

    const noInput = () =>
      document.activeElement &&
      (document.activeElement.tagName === 'INPUT' ||
       document.activeElement.tagName === 'TEXTAREA');

    this._onDown = (e) => { if (!noInput()) this.keys[e.code] = true;  };
    this._onUp   = (e) => { delete this.keys[e.code]; };

    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup',   this._onUp);
  },

  remove () {
    window.removeEventListener('keydown', this._onDown);
    window.removeEventListener('keyup',   this._onUp);
  },

  tick (t, dt) {
    const pos = this.el.object3D.position;

    // Latch floor Y once the entity is positioned in the world
    if (this._floorY === null) { this._floorY = pos.y; }

    const k = this.keys;
    if (!k.ArrowUp && !k.ArrowDown && !k.ArrowLeft && !k.ArrowRight) return;

    const sec = dt / 1000;
    const { speed, turnSpeed, xMin, xMax, zMin, zMax } = this.data;
    const rig = this.el.object3D;
    const cam = this.el.querySelector('[camera]');
    if (!cam) return;

    // Project camera look direction onto the floor plane
    cam.object3D.getWorldDirection(this._fwd);
    this._fwd.y = 0;
    this._fwd.normalize();

    if (k.ArrowUp)    pos.addScaledVector(this._fwd,  speed * sec);
    if (k.ArrowDown)  pos.addScaledVector(this._fwd, -speed * sec);
    if (k.ArrowLeft)  rig.rotation.y += THREE.MathUtils.degToRad(turnSpeed * sec);
    if (k.ArrowRight) rig.rotation.y -= THREE.MathUtils.degToRad(turnSpeed * sec);

    // Keep player on the floor and inside room walls
    pos.x = THREE.MathUtils.clamp(pos.x, xMin, xMax);
    pos.z = THREE.MathUtils.clamp(pos.z, zMin, zMax);
    pos.y = this._floorY;
  }
});

// ─── vr-locomotion ─────────────────────────────────────────────────────────
// Attach to the camera-rig entity alongside arrow-controls.
// Requires #leftHand and #rightHand controller entities in the scene.
//
//   Left  thumbstick / trackpad  ↑↓ → walk forward / back
//   Left  thumbstick / trackpad  ←→ → strafe
//   Right thumbstick / trackpad  ←→ → smooth turn
AFRAME.registerComponent('vr-locomotion', {
  schema: _SHARED_SCHEMA,

  init () {
    this.lAxis   = { x: 0, y: 0 };
    this.rAxis   = { x: 0, y: 0 };
    this._fwd    = new THREE.Vector3();
    this._right  = new THREE.Vector3();
    this._UP     = new THREE.Vector3(0, 1, 0);
    this._floorY = null;

    this._onL = (e) => { this.lAxis = e.detail; };
    this._onR = (e) => { this.rAxis = e.detail; };

    this.el.sceneEl.addEventListener('enter-vr', () => this._bind());
    this.el.sceneEl.addEventListener('exit-vr',  () => this._unbind());
  },

  _bind () {
    const s = this.el.sceneEl;
    this._lEl = s.querySelector('#leftHand');
    this._rEl = s.querySelector('#rightHand');
    ['thumbstickmoved', 'trackpadmoved'].forEach(ev => {
      if (this._lEl) this._lEl.addEventListener(ev, this._onL);
      if (this._rEl) this._rEl.addEventListener(ev, this._onR);
    });
  },

  _unbind () {
    ['thumbstickmoved', 'trackpadmoved'].forEach(ev => {
      if (this._lEl) this._lEl.removeEventListener(ev, this._onL);
      if (this._rEl) this._rEl.removeEventListener(ev, this._onR);
    });
    this.lAxis = { x: 0, y: 0 };
    this.rAxis = { x: 0, y: 0 };
  },

  tick (t, dt) {
    const pos = this.el.object3D.position;

    if (this._floorY === null) { this._floorY = pos.y; }

    const { x: lx, y: ly } = this.lAxis;
    const { x: rx } = this.rAxis;
    if (Math.abs(lx) < 0.1 && Math.abs(ly) < 0.1 && Math.abs(rx) < 0.1) return;

    const sec = dt / 1000;
    const { speed, turnSpeed, xMin, xMax, zMin, zMax } = this.data;
    const rig = this.el.object3D;
    const cam = this.el.querySelector('[camera]');
    if (!cam) return;

    cam.object3D.getWorldDirection(this._fwd);
    this._fwd.y = 0;
    this._fwd.normalize();
    this._right.crossVectors(this._fwd, this._UP);

    if (Math.abs(ly) > 0.1) pos.addScaledVector(this._fwd,  -speed * ly * sec);
    if (Math.abs(lx) > 0.1) pos.addScaledVector(this._right, speed * lx * sec);
    if (Math.abs(rx) > 0.1) rig.rotation.y -= THREE.MathUtils.degToRad(turnSpeed * rx * sec);

    // Keep player on the floor and inside room walls
    pos.x = THREE.MathUtils.clamp(pos.x, xMin, xMax);
    pos.z = THREE.MathUtils.clamp(pos.z, zMin, zMax);
    pos.y = this._floorY;
  }
});
