# Beyond the Window — Implementation Notes
### Branch: `sound-zoom-Bg` | Author: Raheel Shan

---

## Overview

This document covers all features built for the **sound, zoom, and background** system of the *Beyond the Window* WebXR experience. All audio is synthesised in real time using the **Web Audio API** and **Web Speech Synthesis API** — no external audio files are used or required.

---

## Rooms & Pages

| File | Room | Audio Profile |
|---|---|---|
| `stationRoom.html` | Welcome Screen → Station Room | Space Hum (welcome only) + Beep + Voice |
| `cameraOutSide.html` | Outside Camera / Jupiter View | Beep + Voice |
| `halRoom.html` | HAL 9000 Room | Beep + Voice |
| `index.html` | Entry point | Redirects to stationRoom |

---

## Available Sounds

All sounds are generated programmatically. No `.mp3`, `.wav`, or `.ogg` files are needed.

---

### 1. Space Ambient Hum
**File:** `src/celestial.js` — `space-audio` component, `_startHum()` method

**Where it plays:** Welcome screen only (stationRoom). Fades out the moment the user clicks through the overlay.

**How it works:**
- Creates an `AudioContext` on first user gesture (browser autoplay policy)
- **Layer 1 — Bass drone:** Sine oscillator at **60 Hz**
- **Layer 2 — Mid hum:** Sine oscillator at **121.5 Hz** (slightly detuned for texture)
- Both layers share a `GainNode` that fades in from 0 → 0.18 over 4 seconds
- The master output `GainNode` lets mute/unmute work instantly via `setTargetAtTime()`

**HTML usage:**
```html
<a-scene space-audio>            <!-- hum ON  (welcome screen) -->
<a-scene space-audio="hum: false"> <!-- hum OFF (all other rooms) -->
```

**Stop on entry:** `stopHum()` is called when the user clicks past the welcome overlay. The gain fades to 0 over 0.5 s, then oscillators are disconnected.

---

### 2. Computer Beep
**File:** `src/celestial.js` — `space-audio` component, `playBeep()` method

**Where it plays:** Before every HAL speech line in all rooms.

**How it works:**
- Sine oscillator at **880 Hz**
- Duration: **0.3 seconds**
- Amplitude envelope: starts at 0.4 → exponential decay to 0.001 (sci-fi blip feel)
- Routes through the same master `GainNode` so mute silences it too

**Triggered by:**
```js
const spaceAudio = document.querySelector('a-scene')?.components?.['space-audio'];
if (spaceAudio?.playBeep) spaceAudio.playBeep();
```
Called in `src/systems/halRoom.js` before each `speakHAL()` call.

---

### 3. HAL 9000 Voice
**Files:** `src/systems/stationRoom.js`, `src/systems/halRoom.js`, `src/systems/cameraOutSide.js`, `src/robot-ai.js`

**Where it plays:** All rooms, whenever HAL speaks.

**How it works (Web Speech Synthesis API):**
| Setting | Value |
|---|---|
| `lang` | `en-US` |
| `rate` | 0.72 – 0.75 (slow, deliberate) |
| `pitch` | 0.5 – 0.55 (low, HAL-like) |
| `volume` | 1 (always full; mute is handled separately) |

**Mute / unmute — resume from position:**
- Every utterance is registered via `window.registerSpeech(utterance, fullText)` (defined in `src/sound-control.js`)
- `SpeechSynthesisUtterance` boundary events update a `charIndex` tracker word by word
- **Mute pressed:** `speechSynthesis.cancel()` stops audio; `charIndex` is already saved
- **Unmute pressed:** new utterance created from `text.slice(charIndex)` — speech resumes from approximately the last word spoken before mute
- Reason for cancel+restart instead of pause/resume: Chrome's `speechSynthesis.pause()` is unreliable and often silently drops the utterance

**Registering a new utterance (pattern used in all rooms):**
```js
function speakHAL(text) {
  speechSynthesis.cancel();
  const s = new SpeechSynthesisUtterance(text);
  s.lang = 'en-US'; s.rate = 0.72; s.pitch = 0.5; s.volume = 1;
  window.registerSpeech?.(s, text);   // register for mute-resume tracking
  speechSynthesis.speak(s);
  if (window.soundControl?.getMuted?.()) speechSynthesis.cancel(); // don't speak while muted
}
```

---

## Mute / Unmute System
**File:** `src/sound-control.js`, `src/sound-zoom-Bg.css`

- Global singleton `window.soundControl` — persists mute state to `localStorage`
- Toggle button `#audio-toggle` (🔊 / 🔇) injected into DOM on load, keyboard shortcut `M`
- Dispatches `sound-control-changed` custom event; all components listen to it
- Muting also silences the Web Audio gain node (hum + beep)
- Unmuting restores gain AND resumes speech from saved position

---

## Background Image & Zoom
**Files:** `src/sound-zoom-Bg.js`, `style/sound-zoom-Bg.css`

### Background Image
- **Asset:** `/assets/textures/new image of space.png`
- Used on the A-Frame sky sphere (`#nebula1`) in all rooms
- CSS directly applies it to `#startOverlay` so it shows at full quality before A-Frame loads:
  ```css
  #startOverlay {
    background: url('/assets/textures/new%20image%20of%20space.png') center / cover no-repeat;
  }
  ```
- Sky sphere material: `opacity: 1; transparent: false; blending: normal` for true vivid colours (previously `blending: additive` was washing out the colours)

### Sky Sphere Zoom (synced with Jupiter)
When the user scrolls / uses zoom buttons, both Jupiter and the background zoom together.

**Formula (anchored at default Z = -140):**
```js
// t = 0 at default (far out) → repeat = 2.0 (wide panoramic view)
// t = 1 at closest  (Z=-40)  → repeat = 0.5 (zoomed in)
const t = Math.max(0, (window.jupiterZ - (-140)) / (-40 - (-140)));
const repeat = Math.max(0.5, 2.0 - t * 1.5).toFixed(3);
sky.setAttribute('material', 'repeat', `${repeat} ${repeat}`);
```
- `repeat: 2 2` → texture tiles twice → image appears wide and zoomed out
- `repeat: 0.5 0.5` → texture zoomed in → larger detail fill
- Updates on both mouse wheel and button clicks

---

## Jupiter + Moons Zoom
**Files:** `stationRoom.html`, `cameraOutSide.html`, `src/systems/stationRoom.js`, `src/systems/cameraOutSide.js`

Jupiter and all its moons are parented under a single `#jupiter-system` entity. Moving the parent moves everything together so moons never fall behind or drift:

```html
<a-entity id="jupiter-system" position="-1.5 3.8 -140">
  <a-entity planet-rotation="dur:45000"> ... Jupiter ... </a-entity>
  <a-entity moon-orbit="radius:4; dur:18000; ...">
  <a-entity moon-orbit="radius:6; dur:30000; ...">
  <a-entity moon-orbit="radius:8; dur:52000; ...">
</a-entity>
```

Scroll handler:
```js
window.jupiterZ += e.deltaY > 0 ? 10 : -10;
window.jupiterZ = Math.max(-200, Math.min(-40, window.jupiterZ));
document.querySelector('#jupiter-system').setAttribute('position', `-1.5 3.8 ${window.jupiterZ}`);
```
`window.jupiterZ` is shared globally so `sound-zoom-Bg.js` can read it for the background formula.

---

## Welcome Screen
**Files:** `src/systems/stationRoom.js`, `style/sound-zoom-Bg.css`

- Full-screen overlay before entering the experience
- Background: the space image shown at full brightness via CSS `background-image` (independent of A-Frame)
- Content wrapped in `.welcome-box` — a centred dialogue card with:
  - Dark semi-transparent background (`rgba(2,6,18,0.80)`)
  - HAL red border with glow (`rgba(210,35,35,0.55)`)
  - `backdrop-filter: blur(6px)` glass effect
- Space hum begins automatically when the page loads (deferred to first gesture per browser policy)
- On overlay click: hum fades out, beep-only mode activates, HAL greeting plays

---

## A-Frame Components (`src/celestial.js`)

| Component | Schema | Description |
|---|---|---|
| `planet-rotation` | `dur` (ms) | Continuous Y-axis rotation animation |
| `moon-orbit` | `radius`, `dur`, `size`, `color` | Orbiting moon on a pivot entity |
| `space-audio` | `hum` (bool, default `true`) | Ambient hum + beep system; attach to `<a-scene>` |

### `space-audio` API
```js
const audio = document.querySelector('a-scene').components['space-audio'];

audio.playBeep();    // trigger the 880 Hz computer beep
audio.stopHum();     // fade out and stop oscillators (keeps beep available)
audio.setMuted(true/false); // sync to mute state
```

---

## File Summary

| File | Role |
|---|---|
| `src/celestial.js` | A-Frame components: planet rotation, moon orbit, space-audio (hum + beep) |
| `src/sound-control.js` | Global mute singleton, toggle button, speech position tracker |
| `src/sound-zoom-Bg.js` | Audio unlock backup, background zoom formula, scene init |
| `style/sound-zoom-Bg.css` | Welcome overlay image, dialogue box styling, mute button z-index |
| `src/systems/stationRoom.js` | Welcome screen logic, Jupiter zoom, HAL greeting, stopHum on entry |
| `src/systems/halRoom.js` | HAL Q&A interface, beep before speech, registerSpeech tracking |
| `src/systems/cameraOutSide.js` | Outside view HAL greeting, Jupiter zoom, registerSpeech tracking |
| `src/robot-ai.js` | Robot guide speak function with registerSpeech tracking |

---

*Branch: `sound-zoom-Bg` — Raheel Shan*
