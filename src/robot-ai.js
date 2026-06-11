const jupiterData = {
    "size": "Jupiter is absolutely massive, commander. It's about eleven times the diameter of Earth.",
    "moons": "We've charted ninety-five moons out here. The biggest ones on our radar are Io, Europa, Ganymede, and Callisto.",
    "storm": "Keep an eye on the Great Red Spot out the window. That storm is a massive vortex twice the size of Earth.",
    "hello": "Glad to have you on the observation deck, astronaut. What sector details do you need?",
    "default": "Copy that, can you repeat? Ask me about the size, the moons, or the storm."
};

AFRAME.registerComponent('hal-logic', {
    init: function () {
        this.hud = document.querySelector('#ai-status');
        this.setupVoice();
        this.setupKeyboardInput();
    },

    setupVoice: function() {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const speechToText = event.results[event.results.length - 1][0].transcript.toLowerCase();
            this.processInput(speechToText);
        };

        recognition.start();
    },

    setupKeyboardInput: function() {
        const targetInput = document.getElementById('question-input') || document.getElementById('jupiter-input') || document.querySelector('input');
        if (targetInput) {
            const executeSubmit = (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const q = targetInput.value.trim();
                    if (q) {
                        this.processInput(q.toLowerCase());
                        targetInput.value = '';
                    }
                }
            };
            targetInput.addEventListener('keydown', executeSubmit);
            targetInput.addEventListener('keypress', executeSubmit);
        }
    },

    processInput: function(text) {
        let response = jupiterData.default;
        if (text.includes("hello") || text.includes("hi")) response = jupiterData.hello;
        if (text.includes("size") || text.includes("big")) response = jupiterData.size;
        if (text.includes("moon")) response = jupiterData.moons;
        if (text.includes("storm") || text.includes("spot")) response = jupiterData.storm;

        this.speak(response);
    },

    speak: function(text) {
        if (this.hud) {
            this.hud.innerText = `GUIDE: "${text}"`;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 0.9;
        utterance.volume = 1;
    
        const spaceAudio =
  document.querySelector('a-scene')
  ?.components?.['space-audio'];

spaceAudio?.playBeep?.();

        window.speechSynthesis.speak(utterance);
        if (window.soundControl?.getMuted?.()) window.speechSynthesis.cancel();
    },

    tick: function () {
        const playerEl = document.querySelector('#player');
        if (!playerEl) return;
        
        const playerPos = playerEl.object3D.position;
        const targetPos = new THREE.Vector3(playerPos.x, this.el.object3D.position.y, playerPos.z);
        
        this.el.object3D.lookAt(targetPos);
    }
});
