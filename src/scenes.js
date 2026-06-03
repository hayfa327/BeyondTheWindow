// ══════════════════════════════════════════════
// MISSION: JUPITER — Scene Manager
// ══════════════════════════════════════════════

const SceneManager = {

  // المشهد الحالي
  currentScene: 1,

  // ── إعدادات كل مشهد ──────────────────────────
  scenes: {

 scenes: {
  1: {
    name: 'First Observation',
    jupiter: { position: '0 1.6 -80', scale: '0.8 0.8 0.8' },
    europa:  { visible: true  },
    earth:   { visible: true,  emissiveIntensity: 2.0 },
    hal:     { dialogue: 'Good morning, Dr. Bowman. Jupiter is now 41 hours away.' }
  },
  2: {
    name: 'HAL Conversations',
    jupiter: { position: '0 1.6 -75', scale: '1 1 1' },
    europa:  { visible: true  },
    earth:   { visible: true,  emissiveIntensity: 1.2 },
    hal:     { dialogue: 'I have been monitoring Jupiter for 847 days.' }
  },
  3: {
    name: 'Jupiter Grows',
    jupiter: { position: '0 1.6 -60', scale: '1.5 1.5 1.5' },
    europa:  { visible: true  },
    earth:   { visible: true,  emissiveIntensity: 0.5 },
    hal:     { dialogue: 'I still find its scale difficult to comprehend.' }
  },
  4: {
    name: 'The Window',
    jupiter: { position: '0 1.6 -40', scale: '2.5 2.5 2.5' },
    europa:  { visible: true  },
    earth:   { visible: true,  emissiveIntensity: 0.15 },
    hal:     { dialogue: 'Human beings were not designed to witness worlds like this.' }
  },
  5: {
    name: 'Europa Flyby',
    jupiter: { position: '0 1.6 -35', scale: '3 3 3' },
    europa:  { visible: true  },
    earth:   { visible: false, emissiveIntensity: 0 },
    hal:     { dialogue: 'If life exists beneath that surface... it has never seen the stars.' }
  },
  6: {
    name: 'The Signal',
    jupiter: { position: '0 1.6 -25', scale: '4 4 4' },
    europa:  { visible: false },
    earth:   { visible: false, emissiveIntensity: 0 },
    hal:     { dialogue: 'Dr. Bowman... I do not understand what I am observing.' }
  },
  7: {
    name: 'Final Encounter',
    jupiter: { position: '0 1.6 -15', scale: '6 6 6' },
    europa:  { visible: false },
    earth:   { visible: false, emissiveIntensity: 0 },
    hal:     { dialogue: 'I am no longer certain that Jupiter is the destination.' }
  },
  8: {
    name: 'Ending',
    jupiter: { position: '0 1.6 -10', scale: '8 8 8' },
    europa:  { visible: false },
    earth:   { visible: false, emissiveIntensity: 0 },
    hal:     { dialogue: '' }
  }
},
  // ── الانتقال لمشهد معين ───────────────────────
  goToScene(number) {
    const scene = this.scenes[number];
    if (!scene) return;

    console.log(`Moving to Scene ${number}: ${scene.name}`);
    this.currentScene = number;

    // تحريك المشتري
    const jupiter = document.querySelector('#jupiter');
    if (jupiter) {
      jupiter.setAttribute('animation__pos', {
        property: 'position',
        to: scene.jupiter.position,
        dur: 3000,
        easing: 'easeInOutSine'
      });
      jupiter.setAttribute('animation__scale', {
        property: 'scale',
        to: scene.jupiter.scale,
        dur: 3000,
        easing: 'easeInOutSine'
      });
    }

    // إظهار أو إخفاء أوروبا
    const europa = document.querySelector('#europa');
    if (europa) {
      europa.setAttribute('visible', scene.europa.visible);
      if (scene.europa.visible) {
        europa.setAttribute('position', scene.europa.position);
      }
    }

    // إظهار أو إخفاء الأرض
  // تلاشي الأرض تدريجياً
const earth = document.querySelector('#earth');
if (earth) {
  earth.setAttribute('visible', scene.earth.visible);
  if (scene.earth.visible) {
    earth.setAttribute('material', {
      color: '#88bbff',
      emissive: '#88bbff',
      emissiveIntensity: scene.earth.emissiveIntensity
    });
  }
}

    // HAL يتحدث
    if (scene.hal.dialogue) {
      this.halSpeak(scene.hal.dialogue);
    }
  },

  // ── المشهد التالي ─────────────────────────────
  nextScene() {
    if (this.currentScene < 8) {
      this.goToScene(this.currentScene + 1);
    }
  },

  // ── المشهد السابق ─────────────────────────────
  prevScene() {
    if (this.currentScene > 1) {
      this.goToScene(this.currentScene - 1);
    }
  },

  // ── HAL يتحدث ─────────────────────────────────
  halSpeak(text) {
    const box = document.querySelector('#hal-dialogue');
    const textEl = document.querySelector('#hal-text');
    if (!box || !textEl) return;

    textEl.textContent = '';
    box.style.opacity = '1';

    // typewriter effect
    let i = 0;
    const interval = setInterval(() => {
      textEl.textContent += text[i];
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        // إخفاء بعد 6 ثوانٍ
        setTimeout(() => { box.style.opacity = '0'; }, 6000);
      }
    }, 35);
  },

  // ── تشغيل المشهد الأول عند البداية ───────────
  init() {
    const aScene = document.querySelector('a-scene');
    aScene.addEventListener('loaded', () => {
      this.goToScene(1);
      console.log('SceneManager ready — Mission: Jupiter');
    });

    // التنقل بلوحة المفاتيح
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'n') this.nextScene();
      if (e.key === 'ArrowLeft'  || e.key === 'p') this.prevScene();
    });
  }

}};

// تشغيل
SceneManager.init();

// تصدير للاستخدام في ملفات أخرى
export default SceneManager;