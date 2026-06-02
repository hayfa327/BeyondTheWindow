import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─────────────────────────────────────────────────────────────────────────────
//  BeyondTheWindow — Cinematic Space Environment (no stars)
// ─────────────────────────────────────────────────────────────────────────────

// ── Renderer ──────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
renderer.outputColorSpace    = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ── Scene & Camera ────────────────────────────────────────────────────────────
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000);
camera.position.set(0, 0, 0.001);

// ── Controls ──────────────────────────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping   = true;
controls.dampingFactor   = 0.04;
controls.rotateSpeed     = 0.4;
controls.zoomSpeed       = 0.6;
controls.autoRotate      = true;
controls.autoRotateSpeed = 0.15;
controls.minDistance     = 0.1;
controls.maxDistance     = 80;

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────────────────────────────────────────────
//  BACKGROUND — pure black sky sphere
// ─────────────────────────────────────────────────────────────────────────────
const skyMesh = new THREE.Mesh(
  new THREE.SphereGeometry(900, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x000008, side: THREE.BackSide })
);
scene.add(skyMesh);

// ─────────────────────────────────────────────────────────────────────────────
//  NEBULA IMAGE — space photo projected inside two rotating spheres
// ─────────────────────────────────────────────────────────────────────────────
const texLoader = new THREE.TextureLoader();
const nebulaTex = texLoader.load(
  '/textures/beautiful-view-stars-night-sky.jpg',
  () => console.log('✅ Texture loaded'),
  undefined,
  (err) => console.error('❌ Texture failed — check filename in public/textures/', err)
);

// Sphere 1 — main wrap, slow rotation
const nebulaSphere1 = new THREE.Mesh(
  new THREE.SphereGeometry(600, 64, 64),
  new THREE.MeshBasicMaterial({
    map:         nebulaTex,
    side:        THREE.BackSide,
    transparent: true,
    opacity:     0.75,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  })
);
scene.add(nebulaSphere1);

// Sphere 2 — same texture, tilted different axis = parallax depth
const nebulaSphere2 = new THREE.Mesh(
  new THREE.SphereGeometry(750, 64, 64),
  new THREE.MeshBasicMaterial({
    map:         nebulaTex,
    side:        THREE.BackSide,
    transparent: true,
    opacity:     0.35,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  })
);
nebulaSphere2.rotation.x = Math.PI * 0.3;
nebulaSphere2.rotation.z = Math.PI * 0.15;
scene.add(nebulaSphere2);

// ─────────────────────────────────────────────────────────────────────────────
//  LIGHTS
// ─────────────────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x0d1a3a, 2));

const key = new THREE.DirectionalLight(0xc8d8ff, 3);
key.position.set(5, 8, 4);
scene.add(key);

const rim = new THREE.DirectionalLight(0x6633cc, 1.5);
rim.position.set(-4, -2, -6);
scene.add(rim);

const glow = new THREE.PointLight(0x0088ff, 1, 30);
glow.position.set(0, 0, 0);
scene.add(glow);

// ─────────────────────────────────────────────────────────────────────────────
//  LOAD YOUR MODELS
//  Place .glb files in /public/models/ then uncomment below
// ─────────────────────────────────────────────────────────────────────────────
const loader = new GLTFLoader();

// loader.load('/models/your-model.glb', (gltf) => {
//   const model = gltf.scene;
//   model.position.set(0, 0, -3);
//   scene.add(model);
// });

// ─────────────────────────────────────────────────────────────────────────────
//  ANIMATE
// ─────────────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // Rotate nebula spheres on different axes for 3D depth feel
  nebulaSphere1.rotation.y =  t * 0.008;
  nebulaSphere1.rotation.x =  t * 0.003;
  nebulaSphere2.rotation.y = -t * 0.005;
  nebulaSphere2.rotation.z =  t * 0.004;

  controls.update();
  renderer.render(scene, camera);
}

animate();