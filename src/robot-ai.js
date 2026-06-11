AFRAME.registerComponent('hal-logic', {
    tick: function () {
        const playerEl = document.querySelector('#player') || document.querySelector('a-camera') || document.querySelector('#camRig');
        if (!playerEl) return;
        
        const playerPos = playerEl.object3D.position;
        const targetPos = new THREE.Vector3(playerPos.x, this.el.object3D.position.y, playerPos.z);
        
        this.el.object3D.lookAt(targetPos);
    }
});