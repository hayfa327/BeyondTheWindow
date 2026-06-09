 const camRig = document.querySelector('#camRig');
  const MAX_ANGLE = 45;
  let targetY = 0;

  document.addEventListener('mousemove', (e) => {
    const ratio = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = -ratio * MAX_ANGLE;
  });

  function animateCam() {
    if (camRig && camRig.object3D) {
      const targetRad = THREE.MathUtils.degToRad(targetY);
      camRig.object3D.rotation.y += (targetRad - camRig.object3D.rotation.y) * 0.04;
    }
    requestAnimationFrame(animateCam);
  }

  let halHasSpoken = false;

  const HAL_GREETING =
    "Good morning, Dr. Bowman. Jupiter is now forty-one hours away. " +
    "The giant world before you is the largest planet in our Solar System, " +
    "a vast sphere of hydrogen and helium whose storms have raged for centuries. " +
    "The Great Red Spot visible from here is a storm larger than Earth itself. " +
    "Would you like to learn more about Jupiter?";

  function speakHAL(text) {
    const eye = document.querySelector('#hal-eye');
    if (eye) {
      eye.setAttribute('animation',
        'property:emissive-intensity;from:6;to:1.2;dir:alternate;loop:true;dur:200;easing:easeInOutSine');
    }
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US'; speech.rate = 0.75; speech.pitch = 0.55; speech.volume = 1;
    speech.onend = () => {
      if (eye) {
        eye.setAttribute('animation',
          'property:emissive-intensity;from:4.5;to:0.9;dir:alternate;loop:true;dur:3000;easing:easeInOutSine');
      }
      setTimeout(() => {
        document.getElementById('hal-popup').style.display = 'block';
        document.getElementById('hal-overlay').style.display = 'block';
      }, 1500);
    };
    speechSynthesis.speak(speech);
  }

  // Start overlay
  const startOverlay = document.createElement('div');
  startOverlay.id = 'startOverlay';
  startOverlay.innerHTML = `
    <div class="hal-title">HAL 9000</div>
    <div class="deck-title">JUPITER OBSERVATION DECK</div>
    <div class="click-prompt">CLICK ANYWHERE TO BEGIN</div>
    <div class="pulse-dot"></div>`;
  document.body.appendChild(startOverlay);

  startOverlay.addEventListener('click', () => {
    startOverlay.remove();
    animateCam();
    if (!halHasSpoken) {
      halHasSpoken = true;
      setTimeout(() => speakHAL(HAL_GREETING), 800);
    }
  });

  document.getElementById('learnMoreBtn').addEventListener('click', () => {
    speechSynthesis.cancel();
    halHasSpoken = true;
    setTimeout(() => speakHAL(HAL_GREETING), 300);
  });

  document.getElementById('closePopup').addEventListener('click', () => {
    document.getElementById('hal-popup').style.display = 'none';
    document.getElementById('hal-overlay').style.display = 'none';
  });

  document.getElementById('enterHAL').addEventListener('click', () => {
    window.location.href = '/halRoom.html';
  });

  // scroll zoom
  let jupiterZ = -110;
  document.addEventListener('wheel', (e) => {
    const j = document.querySelector('#jupiter');
    jupiterZ += e.deltaY > 0 ? 10 : -10;
    jupiterZ = Math.max(-200, Math.min(-60, jupiterZ));
    j.setAttribute('position', `-1.5 3.8 ${jupiterZ}`);
  });


  let doorOpened = false;

function checkDoor() {
  const cam = document.querySelector('#camRig');
  const door = document.querySelector('#doorPanel');

  if (!cam || !door) {
    requestAnimationFrame(checkDoor);
    return;
  }

  const pos = cam.object3D.position;

  if (!doorOpened && pos.x < -7) {
    doorOpened = true;

    door.setAttribute(
      'animation',
      'property: position; to: -12 2.5 -2; dur: 2000; easing: easeInOutQuad'
    );
  }

  requestAnimationFrame(checkDoor);
}

checkDoor();